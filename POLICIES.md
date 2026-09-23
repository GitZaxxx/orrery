# POLICIES.md — Enforced Rules for the Orrery Project

This document lists all 50 protocols (version control, code quality, testing, security, build/deploy) that are enforced via the agent-oversight state machine (see `AGENTS.md` and `docs/master-plan-v1.md`). Each policy is mapped to a gate (G0–G9) that must pass before code can advance to the next state. Enforcement is mechanical (CI required checks, branch protection) or human (G6 review).

## Summary Table

| ID  | Name                                      | Gate | Enforcement Mechanism                          | Status (v1 baseline) |
|-----|-------------------------------------------|------|------------------------------------------------|----------------------|
| P1  | Git version control                       | G0   | Repo existence; git commands                   | ENFORCED             |
| P2  | GitHub Flow branching model               | G0   | Branch protection; PR workflow                 | WIRED                |
| P3  | Trunk-based small merges                  | G0   | PR size limits; review                         | WIRED                |
| P4  | Mandatory PR reviews                      | G6   | Required approvals                             | WIRED                |
| P5  | Signed commits (GPG)                      | G8   | Commit verification                            | PLANNED-P0           |
| P6  | Protected branches (required checks)      | G0   | Branch protection config                       | WIRED                |
| P7  | Conventional Commits                      | G2   | Commit message lint (optional)                 | PLANNED-P1           |
| P8  | Code ownership                            | G0   | CODEOWNERS file                                | WIRED                |
| P9  | Branch policies (checks/reviews)          | G0   | Required checks + reviews                      | WIRED                |
| P10 | Semantic versioning (semver) tags         | G8   | Tag format validation                          | PLANNED-P0           |
| P11 | Linting (ESLint)                          | G3   | `npm run lint`                                 | ENFORCED             |
| P12 | Static analysis (tsc --noEmit)            | G3   | `npm run typecheck`                            | ENFORCED             |
| P13 | Formatting (Prettier)                     | G3   | `npm run format` (optional)                    | PLANNED-P1           |
| P14 | Dependency scanning (Snyk/Dependabot)     | G5   | `npm audit`                                    | ENFORCED (advisory)  |
| P15 | License compliance (FOSSA/WhiteSource)    | G5   | `licensee` or similar                          | PLANNED-P1           |
| P16 | Complexity metrics (cyclomatic)           | G3   | Complexity checker (optional)                  | PLANNED-P1           |
| P17 | Dead-code detection                       | G3   | `deadcode` or similar                          | PLANNED-P1           |
| P18 | Duplication detection                     | G3   | `jsinspect` or similar                         | PLANNED-P1           |
| P19 | Tech-debt ledger                          | G2   | Manual ledger + review                         | PLANNED-P1           |
| P20 | Code review checklist                     | G6   | Review template                                | PLANNED-P1           |
| P21 | Test-Driven Development (TDD)             | G2   | Test-first; coverage                           | PARTIAL              |
| P22 | Behavior-Driven Development (BDD)         | G2   | Given/When/Then style                          | PLANNED-P1           |
| P23 | Unit testing (Jest)                       | G4   | `npm test`                                     | ENFORCED             |
| P24 | Integration testing                       | G4   | Cross-component tests                          | PLANNED-P1           |
| P25 | End-to-End testing (smoke.sh)             | G4   | `./scripts/smoke.sh`                           | ENFORCED (advisory)  |
| P26 | Property-based testing (fast-check)       | G4   | Optional                                       | PLANNED-P2           |
| P27 | Mutation testing (Stryker)                | G4   | Optional                                       | PLANNED-P2           |
| P28 | Contract testing (Pact)                   | G4   | Optional                                       | PLANNED-P2           |
| P29 | Performance testing (k6/Lighthouse)       | G4   | Optional                                       | PLANNED-P1           |
| P30 | Security testing (OWASP/ZAP)              | G5   | Optional                                       | PLANNED-P1           |
| P31 | Threat modeling (STRIDE)                  | G1   | Session + documentation                        | PLANNED-P0           |
| P32 | Security design review                    | G1   | Session + documentation                        | PLANNED-P0           |
| P33 | Input validation                          | G2   | Zod on all inputs                              | PARTIAL              |
| P34 | Output encoding                           | G2   | Context-aware encoding                         | PARTIAL              |
| P35 | Parameterized queries                     | G2   | ORM/query builders                             | PARTIAL              |
| P36 | Secure headers (CSP, HSTS)                | G5   | Proxy/response headers                         | PLANNED-P1           |
| P37 | Dependency vuln scanning                  | G5   | `npm audit`                                    | ENFORCED (advisory)  |
| P38 | Secrets management (Vault/etc.)           | G5   | `gitleaks` + env var scanning                  | PLANNED-P1           |
| P39 | Least privilege                       | G3, G5 | Non-root containers; least privilege IAM       | PARTIAL             |
| P40 | Security flags (HSTS/CSP)                 | G5   | Proxy configuration                            | PLANNED-P1           |
| P41 | Continuous Integration (CI)               | G3/G4/G5 | GitHub Actions pipeline                      | WIRED                |
| P42 | Continuous Deployment (CD)                | G7/G8 | Blue-green deploy                              | PLANNED-P1           |
| P43 | Infrastructure as Code (Terraform)        | G7   | Terraform apply                                | PLANNED-P1           |
| P44 | Blue-green deployments                    | G7   | Staging/prod swap                              | PLANNED-P1           |
| P45 | Canary releases                           | G7   | Gradual rollout                                | PLANNED-P2           |
| P46 | Feature flags (LaunchDarkly)              | G7   | Flags service                                  | PLANNED-P2           |
| P47 | Immutable infrastructure                  | G7   | Immutable servers/containers                   | PLANNED-P1           |
| P48 | Container image scanning                  | G5, G7 | Trivy/clair scan (NOT installed on host — UNVERIFIED) | PLANNED-P1           |
| P49 | Software Bill of Materials (SBOM)         | G5, G7 | Syft/cyclonedx (NOT installed on host — UNVERIFIED) | PLANNED-P1           |
| P50 | Immutable artifacts                       | G8   | Versioned, unchanging build outputs            | PLANNED-P1           |

**Status Key**: ENFORCED = active and verified; WIRED = files/pipeline in place but not yet active; PLANNED-PX = planned for Sprint X; PARTIAL = partially implemented.

## Gate Enforcement Details

### G0 — Intake Agent
- Enforces: P1–P10 (version control basics)
- Mechanism: Repo existence; branch protection config; required checks setup.

### G1 — Design Agent
- Enforces: P31–P35 (security design)
- Mechanism: Threat modeling session; architecture review; abuse case identification.

### G2 — Implementation Agent
- Enforces: P11–P20 (code hygiene), P21–P25 (testing discipline), P33–P35 (input validation)
- Mechanism: Coding standards; test-first; lint; static analysis; input validation via zod.

### G3 — Static Agent
- Enforces: P11–P18 (linting, static analysis, formatting, dep scanning, license, complexity, dead code, duplication), P39 (least privilege containers)
- Mechanism: `npm ci && npm run typecheck && npm run lint && npm audit`; container user checks.

### G4 — Test Agent
- Enforces: P23–P30 (unit/integration/E2E/property/mutation/contract/perf/security testing), P47 (immutable infra)
- Mechanism: `npm test`; `npm run build`; smoke.sh; optional test suites.

### G5 — Security Agent
- Enforces: P14, P15, P36–P40 (dep scanning, license, secure headers, secrets, least privilege, security flags), P48–P49 (container scanning, SBOM)
- Mechanism: `npm audit`; `gitleaks`; dependency vuln scan; secret scanning; header validation; SBOM gen.

### G6 — Review Agent (Human)
- Enforces: All policies via checklist; final sign-off per phase
- Mechanism: Review template covering UX, security, performance, correctness; exception authority.

### G7 — Integrate Agent
- Enforces: P41–P45, P47–P49 (CI/CD/IaC/blue-green/canary/feature flags/immutable infra/container scanning/SBOM)
- Mechanism: Container build; compose up; full smoke.sh; deploy validation.

### G8 — Release Agent
- Enforces: P5, P10, P50 (signed commits, semver tags, immutable artifacts)
- Mechanism: Tag format; GPG signing; artifact validation.

### G9 — Operate/Audit Agent
- Enforces: P39–P50 (least privilege, security flags, monitoring, response, training, SBOM, immutable artifacts)
- Mechanism: Healthchecks; metrics; alerting; policy audits; drift detection.

## Verification Commands

- Font floor (UX#1–4): `grep -rE "text-\[(9|10|11)px\]" src` → expect 0 matches
- Secret scan: `gitleaks --no-git -v --redact --log-opts "-p"` → expect 0 hits
- Zod on routes: every `src/app/api/**/route.ts` POST handler must contain `zod` or `safeParse`
- No dead TODOs: `grep -rI TODO src` → expect 0 matches (allowlist .env.example)
- Container user: inspect `dashboard/Containerfile` for `USER node` (verified in place)
- Lockfile exists: `package-lock.json` present
- Node version: `Containerfile` uses `node:20-bookworm`

See `scripts/policy-audit.sh` for automated checks.