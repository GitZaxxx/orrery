# TASKS.md — Actionable Task Lists per Phase

Use these checklists to track progress. Each phase ends with a **G6 sign-off**
(your review) before advancing. Gate definitions live in `POLICIES.md`;
toolchain commands and environment facts live in `AGENTS.md`.

Environment facts that shape these tasks (verified on this host):
no host node/npm (all JS toolchain runs in a `node:20-bookworm` podman
container), rootless podman forwards on IPv4 (test `http://127.0.0.1:3000`,
not `localhost`), and `scripts/smoke.sh` is a 21-check battery.

## Phase 0 — Bootstrap (Goal: state machine exists & blocks bad merges)

- [ ] Initial commit — **needs your OK**; nothing is ever committed without it
- [ ] Create GitHub repo `orrery` (private) — `gh repo create orrery --private --source . --push` (needs the initial commit first, and `gh` authenticated)
- [ ] Rename default branch `master` → `main` (`git branch -m master main`) — repo currently has zero commits on `master`
- [ ] Branch protection on `main` — require checks G3–G7 + 1 review (G6)
- [ ] Create pre-commit hook under `scripts/hooks/` and install — `git config core.hooksPath scripts/hooks`
- [ ] Rename pass:
  - `dashboard/Containerfile` — base is already `node:20-bookworm` (verified, all 3 stages); update OCI labels/image refs to Orrery / `orrery-dashboard`
  - `dashboard/README.md` — title → "Orrery (AGY Command Center Dashboard Pod)"
  - `AGENTS.md` — update Orrery references (`agy-dashboard` → `orrery-dashboard` where renamed)
- [ ] Enable security: CodeQL scanning, Dependabot alerts
- [ ] Validate:
  - PR to `main` with a failing check (e.g., break lint) → blocked
  - PR with passing checks + your approval → merges
  - Run the full gate (no host npm — everything runs in the node container):

```bash
# verify pipeline (THE gate — run before every container build)
podman run --rm --userns=keep-id -v "$PWD/dashboard:/app:Z" -w /app -e HOME=/tmp \
  -e NEXT_TELEMETRY_DISABLED=1 node:20-bookworm \
  bash -lc "npm ci && npm run typecheck && npm test && npm run lint && npm run build"

# image + run + smoke battery (rootless podman is IPv4: use 127.0.0.1)
podman build -t orrery-dashboard:latest ./dashboard
podman run -d --name orrery-dashboard -p 3000:3000 orrery-dashboard:latest
./scripts/smoke.sh http://127.0.0.1:3000
```

**Completion:** all checks green · PRs require G3–G7 + G6 · smoke 21/21
(honest UNREGISTERED/503 no-LLM states are PASS by design) · ready for Phase 1.

## Phase 1 — Legible & Calm (Goal: readable, calm, teachable shell)

- [ ] Type-scale system: Tailwind fontSize tokens (16/14/12px floor)
- [ ] Dual font stacks: UI sans (Inter/system) for prose, mono only for IDs/code
- [ ] Font-size control (A−/A+ in settings, persisted via localStorage)
- [ ] Contrast audit: lift /60 opacities ≥ /80; verify 4.5:1 on obsidian
- [ ] Zen boot view: center map + slim chat dock; panels slide in on demand
- [ ] Collapsible panels with persisted state
- [ ] Focus mode: expand any panel full-viewport; Esc restores
- [ ] First-run spotlight tour of the 4 zones + chat brain
- [ ] Tooltips on every card/node/metric (what it is, source API, health)
- [ ] Example missions gallery (one-click: "spin up Llama 3", "visualize telemetry")
- [ ] Instructive empty states: copy-env snippet + "run simulated demo" (mock vLLM: `python3 scripts/mock_vllm.py`, host port 8931)
- [ ] Help drawer: ⌘/ toggle (plug-in contract, shortcuts, FAQ)
- [ ] Responsive breakpoints: <1280px collapses to tabbed panels, canvas-first
- [ ] Settings localStorage: font size, density, panel state, zen default
- [ ] Update tests: unit (settings store); visual (font floor); UX (tour)

**Completion:**
- Functional: unit tests green; smoke 21/21
- Visual: `grep -rE "text-\[(9|10|11)px\]" dashboard/src` → 0 matches; screenshots at 1366×768 & 1920×1080 show readable UI
- Accessibility: axe-core scan → 0 critical violations; keyboard-navigable panels
- UX: tour completes; new-user task ("find vLLM status") < 30s
- Gates: G3–G7 green; G6 sign-off

## Phase 2 — Everything Inflates (Goal: every datapoint inflates to the center map; GenUI gets full canvas)

- [ ] Inflation engine: universal ⤢ Inflate on hover → camera fly-to + sub-view expansion + breadcrumb stack
- [ ] Card→map inflation: Arsenal cards spawn metric child-nodes (models, capabilities) around plugin node
- [ ] Chart→map inflation: telemetry charts inflate to full-canvas data stage with breakdown
- [ ] GenUI widgets inflate: any generated chart/table promotes to canvas stage
- [ ] Breadcrumb stack + back navigation (System ▸ vLLM ▸ models)
- [ ] Animated inflate/deflate transitions (framer layout animations)
- [ ] Node detail drawer: sparklines, isolation, capabilities, API links, actions
- [ ] Artifact canvas mode: slim chat rail + full-canvas generated views
- [ ] Direct GenUI entries: "Generate view" button on empty canvas + "visualize this" per panel
- [ ] Refine loop: inline regenerate/follow-up prompt on every generated view
- [ ] Chat resizes/detaches (dock ↔ modal ↔ fullscreen), drag-resizable

**Completion:**
- Unit: breadcrumb/back-nav state machine tests; inflation reducer tests
- E2E (mock vLLM via `scripts/mock_vllm.py`): all 5 datapoint classes inflate; chat propose → HITL Apply → canvas updates without refresh; refine loop regenerates
- Security: emitted GenUI schemas 100% zod-valid; HITL bypass attempt rejected
- Performance: fly-to animation 60fps (no layout thrash > 16ms frames)
- Gates: G3–G7 green; G6 sign-off

## Phase 3 — Power Reporting (Goal: real history, alerts, export — powerful reporting/metrics)

- [ ] Redis sidecar: telemetry history ring buffer (24h @ 1s → downsampled)
- [ ] Time-range control (1m/15m/1h/24h) + `/api/telemetry/history` endpoint
- [ ] Thresholds → alert states: user-defined rules → status cards + audit events
- [ ] Export: canvas PNG, table/chart CSV, shareable view-link URLs
- [ ] Chart drill-down: click point → crosshair + related-node inflation
- [ ] Per-plugin metrics: manifests declare gauges → auto-rendered
- [ ] Selection sync: sidebars auto-switch to context of selected node
- [ ] Semantic zoom (LOD): labels/metrics reveal progressively by zoom
- [ ] Live edge encoding: width/color = real traffic/CPU between nodes
- [ ] Layout presets (auto/radial/dagre) + canvas search/filter
- [ ] GenUI v2: widget vocabulary (kpi-grid, gauge, heatmap, timeline, diff)
- [ ] Streaming part-states: skeleton → partial → complete per tool call
- [ ] "Ask your data": NL query on canvas → chart/table from live metrics
- [ ] Saved workspaces: named canvas states + layout recall
- [ ] Update tests: persistence round-trip; 24h query perf < 200ms; alert E2E; export correctness; contract tests

**Completion:**
- Reliability: restart round-trip — topology/plugins/settings/24h history survive container kill
- Performance: 24h range query < 200ms p95; SSE tick latency < 50ms
- Correctness: alert rule fires → status card + audit event E2E; CSV export matches API data
- Contract: every new endpoint zod-validated (mutation tests on schemas)
- Gates: G3–G7 green; G6 sign-off

## Phase 4 — Differentiators & Hardening (Goal: ML overlays, subflows, a11y completion, security hardening)

- [ ] ML overlays: baseline/outlier/changepoint detection on telemetry (Grafana scenes-ml pattern)
- [ ] Traffic-flow replay animation: real net counters animate edges over time
- [ ] Subflow grouping: multi-container pods as subflows on canvas
- [ ] ⌘K command palette: navigation + actions + plugin discovery
- [ ] Density toggle: comfortable/compact (persisted via localStorage)
- [ ] Slash-command autocomplete: common missions + plugin capabilities
- [ ] Multi-session chat history: persisted sessions
- [ ] Full keyboard nav + focus management (incl. React Flow a11y)
- [ ] ARIA live regions for SSE streams + prefers-reduced-motion support
- [ ] Security hardening: CSP/HSTS headers on proxy; rate limiting zones; input validation hardening; output encoding audit
- [ ] Update tests: ML overlay correctness; traffic replay smoothness; subflow interactions; a11y scan; security scan

**Completion:**
- Reliability: subflows work; traffic replay smooth
- Performance: ML overlay < 50ms overhead; traffic replay 60fps
- Accessibility: axe-core scan → 0 critical violations; keyboard-navigable; ARIA live regions; reduced motion respected
- Security: header scan (grade A target); secret scan clean; dependency scan clean
- Gates: G3–G7 green; G6 sign-off

## Phase 5 — E2E Deployment & Operations (Goal: blue-green deploy, monitoring, rollback)

- [ ] GitHub Actions deploy workflow: staging (build → test → smoke → auto-deploy); prod on your approval (G6) → blue-green swap (staging → prod)
- [ ] Rollback script: swap prod/staging containers (or image tag)
- [ ] Monitoring/alerts wired to `/api/metrics` + healthchecks (SSE + Prometheus)
- [ ] Runbook: common ops (scale, backup, restore)
- [ ] Validate: push tag → CI green → staging auto-smoke → your approval → prod swap; zero-downtime swap; rollback drill < 60s; alerts fire on simulated faults

**Completion:**
- Deploy: push tag → CI green → staging auto-smoke → your approval → prod swap (zero downtime)
- Rollback: < 60s to recover
- Monitoring: alerts fire on fault; recoverable
- Gates: G3–G7 green; G6 sign-off

## Fresh-session kickoff prompts

- Phase 0: `Read AGENTS.md, POLICIES.md, TASKS.md, and dashboard/docs/plan-draft-v1.md. Execute Phase 0 (Bootstrap) per TASKS.md, then stop for G6 sign-off.`
- Phase 1: `Read AGENTS.md, POLICIES.md, TASKS.md, and dashboard/docs/plan-draft-v2.md. Execute Phase 1 (Legible & Calm) per TASKS.md — delegate code items to the coder subagent, then run the verifier and auditor subagents and check their evidence. Stop for G6 sign-off.`
- Phase 2: `Execute Phase 2 (Everything Inflates) per TASKS.md, then stop for G6 sign-off.`
- Phase 3: `Execute Phase 3 (Power Reporting) per TASKS.md, then stop for G6 sign-off.`
- Phase 4: `Execute Phase 4 (Differentiators & Hardening) per TASKS.md, then stop for G6 sign-off.`
- Phase 5: `Execute Phase 5 (E2E Deployment & Operations) per TASKS.md, then stop for G6 sign-off.`

Each phase ends with your review (G6). Never advance without your sign-off.
