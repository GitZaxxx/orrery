# AGY Dashboard v2 — Executable Build Plan (Handoff Artifact)

**Status**: v1 built & verified (see `plan-draft-v1.md`). This document is the
complete, self-contained plan for the v2 overhaul. A fresh session can execute
Sprints 1→4 from this file alone, with `AGENTS.md` (repo root) for toolchain.

**Goal (user's words)**: a generative UI that is not overwhelming, easy to
learn, yet powerful in reporting and metrics — with **all data points
inflatable into the center visual map** and **bigger, legible fonts**.

## Locked decisions (user-approved)

| Decision | Choice |
|---|---|
| Inflation interaction | **Map-focus inflation** — any datapoint promotes into the center map as a focused sub-view with camera fly-to + breadcrumbs (`System ▸ vLLM ▸ models`) |
| Boot view | **Zen default** — center map + slim chat dock; Arsenal/Security panels slide in on demand |
| Typography | **16px base** / 14px secondary / 12px hard minimum; sans (Inter/system) for prose, mono for IDs/code only |
| History store | **Redis sidecar now** — telemetry ring buffer (24h) + persistence for topology/plugins/settings |

**Deferred / decided against**: per-API micro-models inside the dashboard pod.
Inference belongs in pods (modularity). Possible future: lazy-loaded
intent-routing fallback model behind a feature flag, only when no LLM
endpoint is configured. Do not bundle models into the dashboard image.

## User-perspective audit of v1 (the hard numbers)

- **Illegible**: 59 font classes, zero above 11px (43× 10px, 9× 9px, 7× 11px). Chat prose 11px mono.
- **Wall of density**: 4 panels + 2 charts + minimap visible at boot; side panels eat 784px on a 1366px laptop, squeezing the canvas.
- **No learning path**: no tour/tooltips/help; UNREGISTERED states read as errors.
- **Datapoints are dead-ends**: node click does nothing; charts locked in a 288px strip; nothing inflates into the map.
- **GenUI trapped**: full E2E loop works, but widgets render in a 440px chat column (charts 160px tall); no artifact canvas, direct entry, or refine loop.
- **Reporting shallow**: telemetry window = 120 ticks in-memory (~2 min), no time ranges/alerts/export/drill-down; restart wipes state.
- **No memory**: no settings/view/layout persistence of any kind.

## Research synthesis (anchors for the matrix)

- **AI SDK GenUI (Vercel)**: tool-call → typed UI parts with stream states (input-available → output-available → output-error); loading/partial states are first-class.
- **Thesys / OpenUI Cloud**: AI responds with dashboards/reports; "ask your data" correlation queries are the headline interaction.
- **v0 / Claude Artifacts**: generated output gets the whole canvas; chat is a slim rail.
- **Grafana Scenes**: drill-down pages, variables, URL-synced view state (shareable), scenes-ml (baselines, outlier + changepoint detection).
- **Langflow / Draft v2 doc**: reactive DAG canvas driven purely by JSON state; mutations redraw without refresh (v1 already has this).

## The 50-Point Feature Matrix

Priority: **P0** = must · **P1** = strong · **P2** = differentiator. Effort: S/M/L.

### A. Typography & Readability
| # | Feature | Pri | Eff |
|---|---|---|---|
| 1 | Type-scale system: 16px base / 14px secondary / **12px hard minimum**; eliminate all 9–11px | P0 | S |
| 2 | Dual font stacks: UI sans (Inter/system) for prose; mono only for IDs/code | P0 | S |
| 3 | User font-size control (A−/A+, localStorage-persisted, respects browser zoom) | P0 | S |
| 4 | WCAG AA contrast: lift `/60`-opacity text ≥`/80`; 4.5:1 on obsidian | P0 | S |
| 5 | Smart truncation + hover tooltips; tabular numerals for metrics | P1 | S |

### B. Overwhelm Control
| # | Feature | Pri | Eff |
|---|---|---|---|
| 6 | **Zen boot view**: center map + slim chat dock; panels slide in | P0 | M |
| 7 | Collapsible panels, state persisted | P0 | S |
| 8 | Focus mode: any panel → full viewport, Esc restores | P0 | S |
| 9 | Density toggle: comfortable (default) / compact | P1 | S |
| 10 | ⌘K command palette: navigation + actions + plugin commands | P1 | M |

### C. Onboarding & Learnability
| # | Feature | Pri | Eff |
|---|---|---|---|
| 11 | First-run spotlight tour of the 4 zones + chat brain | P0 | M |
| 12 | Tooltips on every card/node/metric (meaning, source API, health) | P0 | S |
| 13 | Example-missions gallery (one-click scenarios) | P0 | S |
| 14 | Instructive empty states: copy-env snippet + "run simulated demo" | P1 | S |
| 15 | Help drawer (⌘/): plug-in contract, shortcuts, FAQ | P1 | S |

### D. Data-Point Inflation → Center Map (signature)
| # | Feature | Pri | Eff |
|---|---|---|---|
| 16 | Universal **⤢ Inflate** on hover of any datapoint → camera fly-to focused sub-view | P0 | M |
| 17 | Card→map: Arsenal cards spawn metric child-nodes around their node | P0 | M |
| 18 | Chart→map: telemetry charts inflate to full-canvas data stage | P0 | S |
| 19 | GenUI widgets inflate to canvas stage | P0 | M |
| 20 | Breadcrumb stack + back navigation | P1 | S |
| 21 | Animated inflate/deflate (framer layout animations) | P1 | S |

### E. Canvas Evolution
| # | Feature | Pri | Eff |
|---|---|---|---|
| 22 | Node click → detail drawer (sparklines, isolation, capabilities, API links, actions) | P0 | M |
| 23 | Selection sync: sidebars switch to selected node's context | P1 | M |
| 24 | Semantic zoom (LOD): labels/metrics reveal by zoom level | P1 | M |
| 25 | Live edge encoding: width/color = real traffic/CPU | P1 | M |
| 26 | Layout presets (auto/radial/dagre) + canvas search/filter | P1 | S |
| 27 | Subflow grouping for multi-container pods | P2 | M |

### F. Generative UI System
| # | Feature | Pri | Eff |
|---|---|---|---|
| 28 | **Artifact canvas mode**: slim chat rail + full-canvas generated views | P0 | L |
| 29 | Direct GenUI entries: "Generate view" on empty canvas + "visualize this" per panel | P0 | S |
| 30 | Refine loop: inline regenerate/follow-up prompt on every generated view | P0 | M |
| 31 | Saved generated views with shareable URL hash | P1 | S |
| 32 | Widget vocabulary v2: kpi-grid, gauge, heatmap, timeline, diff | P1 | M |
| 33 | Streaming part-states: skeleton → partial → complete per tool call | P1 | S |
| 34 | "Ask your data": NL query on canvas → chart/table from live metrics | P1 | M |

### G. Chat Brain UX
| # | Feature | Pri | Eff |
|---|---|---|---|
| 35 | Chat resizes/detaches (dock ↔ modal ↔ fullscreen), drag-resizable | P0 | S |
| 36 | Tool-call timeline chips with expandable args/results | P1 | S |
| 37 | Slash-command autocomplete incl. plugin capabilities | P2 | M |
| 38 | Persistent multi-session chat history | P2 | M |

### H. Reporting & Metrics Power
| # | Feature | Pri | Eff |
|---|---|---|---|
| 39 | Time-range control (1m/15m/1h/24h) + history persistence (redis ring) | P0 | M |
| 40 | User thresholds → alert states on cards + audit events | P1 | M |
| 41 | Export: canvas PNG, table/chart CSV, shareable view links | P1 | S |
| 42 | Chart drill-down: click point → crosshair + related-node inflation | P1 | M |
| 43 | Per-plugin metrics: manifests declare gauges → auto-rendered | P1 | M |
| 44 | ML overlays: baseline / outlier / changepoint on telemetry | P2 | L |

### I. Accessibility & Responsive
| # | Feature | Pri | Eff |
|---|---|---|---|
| 45 | Responsive: <1280px collapses to tabbed panels, canvas-first | P0 | M |
| 46 | Full keyboard nav + focus management (incl. React Flow a11y) | P1 | M |
| 47 | ARIA live regions for SSE streams + prefers-reduced-motion | P1 | S |

### J. Persistence & Settings
| # | Feature | Pri | Eff |
|---|---|---|---|
| 48 | localStorage settings sync (font size, density, panel state, zen default) | P0 | S |
| 49 | Saved workspaces: named canvas states + layout recall | P1 | M |
| 50 | Server persistence (redis): topology/plugins/telemetry survive restarts | P1 | M |

## Sprint Plan & Gates

Per sprint: implement in batches → run the full gate (container toolchain:
`npm ci && typecheck && test && build` → `podman build` → `scripts/smoke.sh`
against a live container) → fix → next.

**Sprint 1 — "Legible & Calm"**: #1–5 (type system, contrast), #6–8 (zen,
collapse, focus), #11–13 (tour, tooltips, missions), #45 (responsive), #48
(settings).
*Gate*: zero sub-12px classes in source; tsc+jest+build green; no overflow at
1366×768 and 1920×1080; smoke.sh all-pass; fresh-container boot shows Zen.

**Sprint 2 — "Everything Inflates"**: #16–19 (inflation engine + affordances),
#20–21 (breadcrumbs, animations), #22 (node drawer), #28–30 (artifact mode,
GenUI entries, refine loop), #35 (chat resize).
*Gate*: inflation E2E for all 5 datapoint classes (card/chart/widget/node/audit);
GenUI refine loop verified against `scripts/mock_vllm.py`; breadcrumb state
machine unit-tested.

**Sprint 3 — "Power Reporting"**: redis sidecar (#50, #39), #40–43
(alerts/export/drill-down/plugin metrics), #23–26 (canvas upgrades), #31–34
(GenUI v2: URL hash, vocab, part-states, ask-your-data), #36, #49.
*Gate*: restart-persistence round-trip via redis; 24h-range query <200ms;
threshold rule fires audit event E2E.

**Sprint 4 — "Differentiators"**: #44 (ML overlays), #25 replay animation,
#27 (subflows), #9–10 (density, palette), #15 (help drawer), #37–38, #46–47.
*Gate*: full matrix re-audit + all gates re-run.

## Fresh-session kickoff prompt

> Read `AGENTS.md` and `dashboard/docs/plan-draft-v2.md`. Execute Sprint 1
> ("Legible & Calm") for the AGY dashboard exactly per the matrix points and
> gates, then stop for review before Sprint 2.

## Open items requiring the user

1. **Git commit approval** — v1 + these artifacts are uncommitted (`git add -A && git commit` needs explicit OK).
2. **VLLM_API_URL** — plug the real vLLM project URL in when ready (`podman run -e VLLM_API_URL=… -e VLLM_MODEL=…`); zero code changes needed.
3. Sprint review cadence — confirm stop-for-review after each sprint.
