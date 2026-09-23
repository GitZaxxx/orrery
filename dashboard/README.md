# AGY Command Center Dashboard Pod

The **plug-in hub** of the AGY Command Center: a headless, 100% API-driven
Next.js client with a **generative interface engine**. Every external system
(your vLLM project, the chat pod, MCP, prompts, RAG, telemetry/security
agents...) plugs into this dashboard via env-configured URLs and plugin
manifests — never via code changes.

**Roadmap**: v1 is built and verified (record: `docs/plan-draft-v1.md`).
The v2 overhaul plan — legibility overhaul, zen shell, map-focus datapoint
inflation, artifact canvas, redis-backed reporting — lives in
`docs/plan-draft-v2.md` (50-point feature matrix, 4 sprints with gates).

## Layout (from the concept sketch)

| Panel | Data source (all real) | API |
|---|---|---|
| Left — The Arsenal: Inference/vLLM, MCP, Prompts, RAG | pluggable adapters | `GET /api/vllm/status`, `/api/mcp/status`, `/api/prompts`, `/api/rag/vectors` |
| Center — Topology / Visual Routing (React Flow) | plugin registry + declared services + human/chat mutations | `GET /api/topology/graph`, `POST /api/topology/mutate` |
| Right — Zero-Trust Security | self-declared isolation + real netns ports + audit ring | `GET /api/security/{isolation,ports,audit}` |
| Bottom — Telemetry (live charts) | real container stats (os CPU/mem, /proc/net/dev), SSE | `GET /api/telemetry/stream` |
| Bottom-right — Generative Brain (chat) | LLM tool-calling loop with HITL-confirmed patches + GenUI widgets | `POST /api/chat/execute` (SSE) |

Every panel subscribes via SWR/EventSource and renders strictly from API
payloads. If a plug-in is not configured, its panel shows an honest
**UNREGISTERED** state with plug-in instructions — data is never faked.

## Generative abilities

- **GenUI loop**: `POST /api/ui/generate` → LLM emits a zod-validated UI
  schema (status-card / table / chart / alert / form / code-block) rendered
  by the local schema-driven renderer. No codegen, no remote code.
- **Tool-calling router**: `POST /api/chat/execute` streams SSE events —
  `text-delta | tool_call | ui_component | topology_patch | done`. Tools:
  `get_topology`, `get_plugins`, `get_telemetry`, `get_vllm_status`,
  `propose_ui`, `propose_topology_patch`. Works with ANY OpenAI-compatible
  backend (vLLM, LiteLLM) via a portable text tool protocol.
- **HITL**: chat-proposed topology patches are NEVER auto-applied. The
  rendered patch card requires a human "Apply" click → `POST /api/topology/mutate`.
- **Reactive DAG**: applied patches bump the topology revision; the canvas
  redraws on next poll without a page refresh.

## Plug-in contract

External pods register themselves on boot:

```bash
curl -X POST http://dashboard:3000/api/plugins \
  -H 'content-type: application/json' \
  -d '{"id":"mcp-github","name":"GitHub MCP","version":"1.0.0",
       "kind":"mcp","baseUrl":"http://mcp:3002",
       "statusUrl":"http://mcp:3002/health",
       "capabilities":["filesystem","github"],
       "isolation":{"network":"internal","capabilities":["no-internet"]}}'
```

The manifest is zod-validated (`dashboard/src/server/registry.ts`); the
plugin instantly appears in the Arsenal, the topology canvas, and the
isolation view. See `docs/plan-draft-v1.md` for the full contract.

## Environment variables

See `.env.example`. Key plug-ins:
- `VLLM_API_URL` — **your external vLLM project** (OpenAI-compatible). Feeds
  the Inference card AND powers GenUI + chat brain when no router is set.
- `INFERENCE_API_URL` — LiteLLM router (takes precedence for generative features).
- `CHAT_API_URL` — dedicated chat pod (proxied by `/api/chat/execute`).
- `MCP_API_URL`, `PROMPTS_API_URL`, `RAG_API_URL`, `TELEMETRY_SOURCE_URL`, `PODMAN_API_URL`.

## Build & run

```bash
# build (requires package-lock.json — committed)
podman build -t agy-dashboard:latest .

# run
podman run -d --name agy-dashboard -p 3000:3000 \
  -e VLLM_API_URL=http://<your-vllm-host>:8000 \
  -e VLLM_MODEL=<served-model-id> \
  agy-dashboard:latest
```

Note: rootless podman forwards on IPv4 — browse `http://127.0.0.1:3000`.

## Development

No host Node.js needed — use the node:20-bookworm container:

```bash
podman run --rm --userns=keep-id -v "$PWD":/app:Z -w /app -e HOME=/tmp node:20-bookworm bash -lc \
  "npm ci && npm run typecheck && npm test && npm run build"
```

## Endpoints

| Route | Purpose |
|---|---|
| `GET /api/health` | liveness + revision + plugin count + GenUI state |
| `GET /api/metrics` | Prometheus exposition (real CPU/mem/net) |
| `GET/POST /api/plugins` | list / register plug-ins (manifests) |
| `GET /api/topology/graph` · `POST /api/topology/mutate` | DAG state / human-confirmed mutation |
| `POST /api/chat/execute` | SSE generative orchestration stream |
| `POST /api/ui/generate` | GenUI schema generation (validated) |
| `GET /api/telemetry/stream` | SSE live telemetry |
| `GET /api/vllm/status` · `/api/mcp/status` · `/api/prompts` · `/api/rag/vectors` | Arsenal adapters |
| `GET /api/security/isolation` · `/ports` · `/audit` | zero-trust panel |
