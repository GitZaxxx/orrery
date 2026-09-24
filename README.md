Orrery — the system model you command
====================================

The plug-in hub of the AGY Command Center: a headless, 100% API-driven
Next.js client with a generative interface engine. Every external system
(your vLLM project, the chat pod, MCP, prompts, RAG, telemetry/security
agents...) plugs into this dashboard via env-configured URLs and plugin
manifests — never via code changes.

Quickstart
----------

Build & run (no host Node.js needed — podman only):

    podman build -t orrery-dashboard:latest ./dashboard
    podman run -d --name orrery-dashboard -p 3000:3000 orrery-dashboard:latest
    ./scripts/smoke.sh http://127.0.0.1:3000

Then visit http://127.0.0.1:3000 (rootless podman forwards on IPv4).

Governance
----------

- `AGENTS.md` — toolchain commands, environment gotchas, repo map
- `POLICIES.md` — the 50 protocols with gate mapping and enforcement
- `TASKS.md` — phase checklists with completion gates and fresh-session kickoff prompts
- `dashboard/docs/plan-draft-v1.md` — v1 build record
- `dashboard/docs/plan-draft-v2.md` — v2 plan (feature matrix, sprints with gates)

Roadmap
-------

- v1: Built & verified (record: `dashboard/docs/plan-draft-v1.md`)
- v2: In progress — legibility overhaul, zen shell, map-focus
  inflation, artifact canvas, redis-backed reporting
  (see `dashboard/docs/plan-draft-v2.md`)

License
-------

Proprietary — all rights reserved. This repository is private; no
license is granted to others.# Test
