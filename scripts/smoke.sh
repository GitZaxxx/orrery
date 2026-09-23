#!/usr/bin/env bash
# AGY dashboard endpoint smoke battery.
# Usage: scripts/smoke.sh [base_url]   (default http://127.0.0.1:3000)
# Exits non-zero if any check fails. Run against a live dashboard container.
set -u
BASE="${1:-http://127.0.0.1:3000}"
pass=0
fail=0

check() { # name expected actual
  if [ "$2" = "$3" ]; then
    pass=$((pass+1)); echo "PASS  $1 (HTTP $3)"
  else
    fail=$((fail+1)); echo "FAIL  $1 (expected $2, got $3)"
  fi
}

get_code() { curl -s -o /dev/null -w '%{http_code}' -m 8 "$1"; }

echo "== AGY dashboard smoke battery against $BASE =="

check "GET  /api/health"               200 "$(get_code "$BASE/api/health")"
check "GET  /api/topology/graph"        200 "$(get_code "$BASE/api/topology/graph")"
check "GET  /api/plugins"              200 "$(get_code "$BASE/api/plugins")"
check "GET  /api/vllm/status"          200 "$(get_code "$BASE/api/vllm/status")"
check "GET  /api/mcp/status"           200 "$(get_code "$BASE/api/mcp/status")"
check "GET  /api/prompts"              200 "$(get_code "$BASE/api/prompts")"
check "GET  /api/rag/vectors"          200 "$(get_code "$BASE/api/rag/vectors")"
check "GET  /api/security/isolation"   200 "$(get_code "$BASE/api/security/isolation")"
check "GET  /api/security/ports"       200 "$(get_code "$BASE/api/security/ports")"
check "GET  /api/security/audit"      200 "$(get_code "$BASE/api/security/audit")"
check "GET  /api/metrics"              200 "$(get_code "$BASE/api/metrics")"
check "GET  / (page)"                  200 "$(get_code "$BASE/")"

# Content sanity
curl -s -m 8 "$BASE/api/health" | grep -q '"status":"ok"' \
  && { pass=$((pass+1)); echo "PASS  health body ok"; } \
  || { fail=$((fail+1)); echo "FAIL  health body"; }
curl -s -m 8 "$BASE/api/metrics" | grep -q "agy_uptime_seconds" \
  && { pass=$((pass+1)); echo "PASS  metrics exposition"; } \
  || { fail=$((fail+1)); echo "FAIL  metrics exposition"; }

# Plugin registry validation
bad=$(curl -s -o /dev/null -w '%{http_code}' -m 8 -X POST "$BASE/api/plugins" \
  -H 'content-type: application/json' \
  -d '{"id":"BAD ID","name":"x","version":"latest","kind":"nope"}')
check "POST /api/plugins invalid -> 400" 400 "$bad"

ok=$(curl -s -o /dev/null -w '%{http_code}' -m 8 -X POST "$BASE/api/plugins" \
  -H 'content-type: application/json' \
  -d '{"id":"smoke-test","name":"Smoke Test","version":"1.0.0","kind":"custom"}')
check "POST /api/plugins valid -> 201" 201 "$ok"

# Topology mutations
edge=$(curl -s -o /dev/null -w '%{http_code}' -m 8 -X POST "$BASE/api/topology/mutate" \
  -H 'content-type: application/json' \
  -d '{"action":"add-edge","edge":{"source":"service:ghost","target":"agy-dashboard"}}')
check "POST /api/topology/mutate unknown node -> 409" 409 "$edge"

patch=$(curl -s -o /dev/null -w '%{http_code}' -m 8 -X POST "$BASE/api/topology/mutate" \
  -H 'content-type: application/json' \
  -d '{"action":"apply-patch","patch":{"summary":"smoke","nodes":[{"id":"service:llama3","label":"L3","kind":"service"}],"edges":[]}}')
check "POST /api/topology/mutate apply-patch -> 200" 200 "$patch"

# SSE telemetry stream (first frame must be a tick)
sse=$(timeout 4 curl -sN -m 4 "$BASE/api/telemetry/stream" | head -1)
if echo "$sse" | grep -q '"type":"tick"'; then
  pass=$((pass+1)); echo "PASS  telemetry SSE emits ticks"
else
  fail=$((fail+1)); echo "FAIL  telemetry SSE first frame: ${sse:0:60}"
fi

# Chat + GenUI honest states depend on LLM configuration
genui=$(curl -s -m 8 "$BASE/api/health" | grep -o '"configured":[a-z]*' | cut -d: -f2)
if [ "$genui" = "true" ]; then
  ui=$(curl -s -o /dev/null -w '%{http_code}' -m 20 -X POST "$BASE/api/ui/generate" \
    -H 'content-type: application/json' -d '{"intent":"smoke overview"}')
  check "POST /api/ui/generate (LLM configured) -> 200" 200 "$ui"
  chat=$(timeout 30 curl -sN -m 30 -X POST "$BASE/api/chat/execute" \
    -H 'content-type: application/json' -d '{"command":"show topology"}' | tail -1)
  if echo "$chat" | grep -q '"type":"done"'; then
    pass=$((pass+1)); echo "PASS  chat SSE completes (done event)"
  else
    fail=$((fail+1)); echo "FAIL  chat SSE last frame: ${chat:0:60}"
  fi
else
  ui=$(curl -s -o /dev/null -w '%{http_code}' -m 8 -X POST "$BASE/api/ui/generate" \
    -H 'content-type: application/json' -d '{"intent":"smoke overview"}')
  check "POST /api/ui/generate (no LLM) -> 503" 503 "$ui"
  err=$(timeout 10 curl -sN -m 10 -X POST "$BASE/api/chat/execute" \
    -H 'content-type: application/json' -d '{"command":"hello"}' | head -1)
  if echo "$err" | grep -q '"type":"error"'; then
    pass=$((pass+1)); echo "PASS  chat SSE honest no-LLM error"
  else
    fail=$((fail+1)); echo "FAIL  chat SSE no-LLM frame: ${err:0:60}"
  fi
fi

echo "== RESULT: $pass passed, $fail failed =="
[ "$fail" -eq 0 ]
