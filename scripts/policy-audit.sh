#!/usr/bin/env bash
# POLICIES.md mechanical audit battery — read-only, exits non-zero on any FAIL.
# Usage: scripts/policy-audit.sh   (from anywhere; anchors itself to repo root)
# Note: gitleaks/trivy/syft are NOT installed on this host. The secret scan
# below is a grep-based HEURISTIC, not a dedicated scanner.
set -u
cd "$(dirname "$0")/.." || exit 1
pass=0
fail=0

check() { # name status [detail]
  if [ "$2" = "PASS" ]; then
    pass=$((pass+1)); echo "PASS  $1${3:+ — $3}"
  else
    fail=$((fail+1)); echo "FAIL  $1${3:+ — $3}"
  fi
}

# UX font floor: no 9/10/11px anywhere (legibility floor)
n=$(grep -rE 'text-\[(9|10|11)px\]' dashboard/src 2>/dev/null | wc -l)
check "Font floor (no 9/10/11px)" "$([ "$n" -eq 0 ] && echo PASS || echo FAIL)" "$n violations"

# P33 input validation: every POST route handler must reference zod/safeParse
posts=$(grep -rl 'export async function POST' dashboard/src/app/api 2>/dev/null)
total=$(echo "$posts" | grep -c . || true)
bad=0
for f in $posts; do
  grep -qE 'zod|safeParse' "$f" || { bad=$((bad+1)); echo "      unvalidated: $f"; }
done
check "Zod on every POST route (P33)" "$([ "$bad" -eq 0 ] && [ "$total" -gt 0 ] && echo PASS || echo FAIL)" "$bad of $total route files unvalidated"

# Hygiene: no dead TODOs in source (allowlist .env.example)
n=$(grep -rI 'TODO' dashboard/src 2>/dev/null | grep -v '.env.example' | wc -l)
check "No dead TODOs (hygiene)" "$([ "$n" -eq 0 ] && echo PASS || echo FAIL)" "$n found"

# P41 CI readiness: lockfile committed
check "package-lock.json present (P41)" "$([ -f dashboard/package-lock.json ] && echo PASS || echo FAIL)"

# P39 least privilege + verified base image
cf=dashboard/Containerfile
check "Containerfile base node:20-bookworm" "$(grep -q 'FROM node:20-bookworm' "$cf" && echo PASS || echo FAIL)"
check "Containerfile USER node, non-root (P39)" "$(grep -q '^USER node' "$cf" && echo PASS || echo FAIL)"

# P38 secrets — HEURISTIC (gitleaks not installed on this host)
hits=$(grep -rInE '(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY)' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=logs . 2>/dev/null | wc -l)
check "Secret scan HEURISTIC (P38)" "$([ "$hits" -eq 0 ] && echo PASS || echo FAIL)" "$hits candidate hits"

echo "== RESULT: $pass passed, $fail failed =="
[ "$fail" -eq 0 ]
