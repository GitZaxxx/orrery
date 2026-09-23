# AGY Command Center Dashboard — Plan Draft v1 (BUILD COMPLETE)

**Scope:** the dashboard pod only — the hub every other system plugs into.
All other pods (your vLLM project, chat, MCP, prompt-oversight, telemetry
agent, podman agent) plug in via env URLs + plugin manifests; none were
built here, per modularity requirement.

## 1. Architecture implemented

```
[ browser ]
    │  http://127.0.0.1:3000
    ▼
[ agy-dashboard pod — Next.js 14, standalone, non-root ]
    ├── Headless client: every panel = API subscriber (SWR / SSE)
    ├── BFF API surface (15 routes) = the plug-in contract
    ├── Plugin registry (zod-validated manifests)
    ├── Topology state (reactive DAG: core + plugins + services + proposed)
    ├── GenUI engine: LLM → validated UI-schema → local renderer
    └── Chat brain: portable tool-calling protocol, HITL patches
            │
            ├── VLLM_API_URL ──────► your external vLLM project (models + generative engine)
            ├── INFERENCE_API_URL ─► LiteLLM router (future inference pod)
            ├── CHAT_API_URL ──────► dedicated chat pod (future)
            ├── MCP_API_URL / PROMPTS_API_URL / RAG_API_URL (future pods)
            └── PODMAN_API_URL / TELEMETRY_SOURCE_URL (future agents)
```

## 2. Datapoint map (sketch → panel → API → source)

| Sketch datapoint | Panel | API | Live source (real) |
|---|---|---|---|
| Arsenal: Inference (VRAM/models) | left | `/api/vllm/status` | your vLLM project `/v1/models` |
| Arsenal: MCP servers | left | `/api/mcp/status` | MCP pod `…/mcp/status` |
| Arsenal: Prompts library | left | `/api/prompts` | prompts pod |
| Arsenal: RAG/vector status | left | `/api/rag/vectors` | RAG pod |
| Intake/Router + agent topography | center | `/api/topology/graph` + `/mutate` | registry + services + human/chat edits (React Flow) |
| Zero-trust: internal vs bridged | right | `/api/security/isolation` | declared postures + plugin manifests |
| Zero-trust: exposed ports | right | `/api/security/ports` | real `/proc/net/tcp{,6}` netns parse |
| Zero-trust: audit | right | `/api/security/audit` | audit ring buffer (all real actions) |
| Network In/Out visual graph | bottom | `/api/telemetry/stream` (SSE) | real `/proc/net/dev` counters + os CPU/mem |
| Resource guardrails | bottom | same | CPU%, MEM%, RSS, uptime chips |
| Floating chat = Brain | bottom-right | `/api/chat/execute` (SSE) | LLM tool-loop → tools → GenUI + HITL |
| Sys/plugins/topo/GenUI chips | header | `/api/health` | live registry + revision + LLM state |

## 3. Generative system (per SOTA reverse-engineering)

1. **GenUI loop (v0/Artifacts pattern)** — chat/`ui/generate` streams
   *structured UI* (zod-validated widget schema), rendered instantly by
   the local renderer. Widget vocabulary: status-card, table, chart
   (line/area/bar), alert, form, code-block, topology-patch.
2. **Reactive DAG (Langflow pattern)** — canvas is a pure projection of
   `/api/topology/graph`; mutations bump revision; canvas redraws without
   refresh.
3. **Tool-calling router (agentic pattern)** — the brain selects tools via
   a portable `TOOL_CALL {json}` protocol (works with ANY OpenAI-compatible
   server — your vLLM does not need native function-calling). Allowlist:
   `get_topology`, `get_plugins`, `get_telemetry`, `get_vllm_status`,
   `propose_ui`, `propose_topology_patch`.
4. **HITL** — proposed patches render as magenta dashed cards requiring
   human "Apply"; only then `POST /api/topology/mutate` executes.

## 4. Verification (executed today — all green)

| Gate | Result |
|---|---|
| `npm ci` (fixed deps: autoprefixer, umap-js→dropped, react-flow-renderer→reactflow@11) | PASS |
| `tsc --noEmit` strict | PASS |
| `jest` — 4 suites / 23 tests (registry, topology, genui schema, telemetry) | PASS |
| `next build` (standalone) — 15 API routes + shell | PASS |
| `podman build` (fixed: node:20-bookworm base, public/, HOSTNAME=0.0.0.0) | PASS |
| Container `/api/health` | 200 `status:ok` |
| Plugin register/validate (bad manifest → 400) | PASS |
| Topology live-reflects plugin (node + edge) | PASS |
| Security ports = real netns (3000/tcp listed) | PASS |
| SSE telemetry = real ticks (cpu/mem/net/RSS) | PASS |
| Prometheus `/api/metrics` | PASS |
| No-LLM states honest (chat error msg, GenUI 503) | PASS |
| **E2E with mock vLLM API**: adapter lists models; chat NL command → `tool_call` → `topology_patch` (NOT applied) → streamed text → `done`; `ui/generate` → validated widget schema | PASS |
| HITL: apply-patch → proposed node lands on canvas (rev bump) | PASS |
| Audit trail records plugin/chat/topology events | PASS |

## 5. Defects fixed (from the pre-build simulation)

- `node:20-lts` image tag does not exist → `node:20-bookworm` (root + dashboard)
- `autopostcss` npm package does not exist → `autoprefixer`
- `umap-js@^0.1.0` unresolvable (registry starts at 1.0.0) → dependency removed for this scope
- `react-flow-renderer@^11` unresolvable (v11 renamed) → `reactflow@^11.11.4`
- missing `@tailwindcss/forms`+`typography` (required by tailwind config) → added
- no lockfile (`npm ci` failed) → committed `package-lock.json` (724 packages)
- Tailwind content globs pointed at non-existent dirs → `./src/**`
- `next.config.js`: removed `appDir` (invalid in Next 14); added `output: 'standalone'`
- `public/` missing (broke prod COPY) → created
- Next standalone bound to container hostname (unreachable) → `HOSTNAME=0.0.0.0`
- template defects (MotionContainer, instanceof ReactElement, umap API misuse,
  invalid classes) — superseded by the new schema-driven renderer in `src/components/genui/`

## 6. Next phases (external pods — each modular, own tree)

1. **Wire the real vLLM project**: run with `-e VLLM_API_URL=… -e VLLM_MODEL=…` — zero code changes.
2. Chat pod (LLM sessions + tool state) — registers via manifest; dashboard proxies automatically.
3. MCP pod (FastMCP) → `MCP_API_URL`; Prompts pod → `PROMPTS_API_URL`; RAG pod → `RAG_API_URL`.
4. Podman agent (socket, read-only + allowlist) → real isolation/port/audit + `spawn_container` tool with HITL.
5. Telemetry agent → per-container stats into the same SSE contract.
6. Proxy pod (gateway) + podman-compose network, systemd socket activation for :80/:443.
