# AGENTS.md — AGY Command Center

Monorepo of modular pods. **The dashboard is the plug-in hub**: every other
system (vLLM project, chat pod, MCP, prompts, RAG, agents) plugs in via env
URLs + plugin manifests — never by editing dashboard code. Goal pillars and
the full v2 plan: `dashboard/docs/plan-draft-v2.md` (v1 record:
`dashboard/docs/plan-draft-v1.md`).

## Non-negotiable rules

- **Never fake data.** Unconfigured plug-ins render honest UNREGISTERED states.
- **HITL**: chat-proposed topology patches are never auto-applied.
- **Modularity**: each pod owns its tree + Containerfile; no cross-tree imports at build time.
- **Legibility floor (v2)**: no font below 12px anywhere; 16px prose base.
- Zod-validate every API boundary; shared types live in `dashboard/src/lib/types.ts`.

## Environment facts (verified on this host)

- **No host node/npm** — ALL JS toolchain runs in a node container (below).
- Podman 5.8.7 (rootless). Images pulled: `node:20-bookworm`. Use **`node:20-bookworm`**, NOT `node:20-lts` (that tag does not exist).
- Rootless port-forwarding is **IPv4**: test with `http://127.0.0.1:3000`, not `localhost` (::1).
- Next standalone binds to `HOSTNAME` env if set — the dashboard Containerfile sets `HOSTNAME=0.0.0.0`. Keep it.
- Host port 8080 is occupied; 3000/3001/8000/etc are free.

## Dashboard toolchain (run from repo root or dashboard/)

```bash
# deps (lockfile is committed; never run bare npm install)
podman run --rm --userns=keep-id -v "$PWD/dashboard:/app:Z" -w /app -e HOME=/tmp \
  node:20-bookworm npm ci

# verify pipeline (THE gate — run before every container build)
podman run --rm --userns=keep-id -v "$PWD/dashboard:/app:Z" -w /app -e HOME=/tmp \
  -e NEXT_TELEMETRY_DISABLED=1 node:20-bookworm \
  bash -lc "npm run typecheck && npm test && npm run lint && npm run build"

# image
podman build -t orrery-dashboard:latest ./dashboard

# run
podman run -d --name orrery-dashboard -p 3000:3000 \
  [-e VLLM_API_URL=http://host.containers.internal:8931 -e VLLM_MODEL=llama-3-8b-instruct] \
  orrery-dashboard:latest
```

`--userns=keep-id` + `:Z` keep files host-owned (uid 1000) and SELinux-safe.

## Verification scripts

- `scripts/smoke.sh [base_url]` — full endpoint battery against a live dashboard (health, topology, plugins, adapters, security, metrics, SSE, chat, GenUI states). Exit non-zero on any failure. Run after every build/run.
- `scripts/mock_vllm.py` — OpenAI-compatible mock simulating the external vLLM project (`/v1/models`, `/v1/chat/completions` with scripted TOOL_CALL behavior). Run on host port 8931: `python3 scripts/mock_vllm.py`, then start the dashboard with `-e VLLM_API_URL=http://host.containers.internal:8931 -e VLLM_MODEL=llama-3-8b-instruct` to exercise the full generative loop (chat tool-calls, HITL patch proposals, GenUI schema generation).

## Repo map

```
dashboard/          # THE hub: Next.js 14 App Router + BFF APIs + GenUI + chat brain
  src/app/api/*     # 15 routes: health, metrics, plugins, topology/{graph,mutate},
                    #   chat/execute (SSE), ui/generate, telemetry/stream (SSE),
                    #   vllm/status, mcp/status, prompts, rag/vectors, security/*
  src/server/       # zod contracts (registry, genui), topology state, telemetry,
                    #   providers (plug-in adapters), llm client, chat brain
  src/components/   # DashboardShell, panels (Arsenal/Canvas/Security/Telemetry/Chat),
                    #   genui/Renderer (schema-driven widgets)
  src/lib/types.ts  # shared contract types (mirrored by server zod schemas)
  docs/             # plan-draft-v1.md (v1 record), plan-draft-v2.md (v2 build plan)
inference/ proxy/   # future pods (Containerfiles currently broken — see v1 doc §5)
templates/          # original concept components (superseded by src/components/genui)
scripts/            # smoke.sh, mock_vllm.py
```

## Plug-in contract (how systems attach)

Boot-time registration: `POST /api/plugins` with a zod-validated manifest
(`id`, `name`, `version`, `kind`, optional `baseUrl`/`statusUrl`/`capabilities`/
`topology`/`isolation`). Plugin instantly appears in Arsenal, canvas topology,
and isolation view. Env adapters: `VLLM_API_URL`, `INFERENCE_API_URL`,
`CHAT_API_URL`, `MCP_API_URL`, `PROMPTS_API_URL`, `RAG_API_URL`,
`TELEMETRY_SOURCE_URL`, `PODMAN_API_URL` (see `dashboard/.env.example`).

## v2 sprint order (see plan-draft-v2.md for gates)

1. Sprint 1 "Legible & Calm" (typography, zen shell, onboarding, responsive, settings)
2. Sprint 2 "Everything Inflates" (map-focus inflation, artifact canvas, refine loop)
3. Sprint 3 "Power Reporting" (redis sidecar, time ranges, alerts, export, GenUI v2)
4. Sprint 4 "Differentiators" (ML overlays, subflows, palette, a11y completion)

Stop for user review after each sprint gate.
