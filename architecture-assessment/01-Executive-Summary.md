# 01 — Executive Summary

**Architecture Assessment** of the repository at HEAD `a0bbbc4` (branch `main`, 2026-07-19). Evidence base: the `project-discovery/` corpus plus direct re-verification of every load-bearing claim against the repository, which was treated as the source of truth throughout — including over the discovery documents themselves, ten of whose counts were corrected during this phase. The assessment evaluates and explains only; it prescribes nothing. Finding families: **S** (strengths, 21) · **W** (weaknesses, 22) · **RC** (root causes, 12) · **CX** (complexity sources, 12) · **PC** (pattern consistency, 18) · **TD** (technical debt, 16) · **R** (risks, 19) · **OP** (opportunities, 24) — **144 findings**, each carrying Observation / Evidence / Interpretation / Confidence, classified for decision-readiness in file 10 and cross-mapped in file 11.

## Overall verdict

This is a codebase whose *foundations* show unusually deliberate engineering discipline, and whose principal liabilities are not carelessness but **staged work whose completion state is recorded nowhere**. The strongest single explanatory finding in the corpus is the meta-cause identified in the root-cause analysis (04, cross-cutting observation): six of twelve root causes reduce to "a migration or capability was staged with a defined later step, and the repository has no mechanism that records whether the later step happened or is still intended." The complexity analysis (05) reaches the same shape independently: complexity divides into a *deliberate, documented* group (with in-code rationale, ADRs, enforcing lint), a *historical-strata* group (coherent responses to their moment, preserved by compatibility pressure), and a *drift* group (no rule, no recorded intent) — and it is the third group, not the largest files, where the codebase is hardest to reason about.

## What works well (selected from 02)

- **Layering that grep can check** (S-1, S-3): unidirectional imports (`shared` → nothing; `lib` → features only at the composition root), server code physically fenced by 10 `server-only` modules and exactly 10 `"use server"` files — leakage fails the build.
- **A minimal, uniform server surface** (S-4, S-5): zero API route handlers; all mutations flow through two typed safe-action families sharing one `{ok,data}|{ok,error}` contract, with identity, recipient, and role always derived server-side.
- **Security rules that are tested** (S-6): `firestore.rules` re-implements application RBAC — immutable-field guards, owner-only inbox creates — under an automated emulator suite.
- **A five-suite test architecture with an honest CI mirror** (S-10, S-11): unit / real-browser / emulator / functions / E2E, each tier proving what only it can prove, mirrored job-for-job in CI.
- **Measured i18n and design-token discipline** (S-17, PC-17, PC-18): 803/803 en/ja key parity (freshly measured, zero drift); a converging token system with a quantified 38-occurrence raw-hex tail.
- **Deliberate, documented constraint boundaries** (S-15, CX-5): the ESLint-enforced audio boundary encodes a real past incident; motion is confined to a strict LazyMotion budget.

## What costs the most (clustered; see 11 for full cluster map)

- **C1/C2 — The notification migration frozen mid-flight** (W-7, RC-2, TD-1 — ranked #1 debt): the TypeScript union declares 4 notification types while the codebase writes 10; four `@deprecated` fields are load-bearing; dual read paths and dual indexes coexist; and an in-repo runbook states the supporting index/rules deploy is **"NOT yet deployed"** — a production-currency question no code read can answer (NQ-1).
- **C9 — Knowledge concentration** (W-6, R-12 — top-ranked risk): every one of the 140 commits is by a single author; the admin bootstrap additionally requires an out-of-band action no code performs (RC-x, TD area), so operational knowledge exists nowhere but in one person.
- **C7 — The auth-gate posture** (W-15, R-11, TD-15): the middleware checks only cookie *presence*; the cookie is the raw ID token, JS-readable by design, 7-day cookie vs 1-hour token. Server-side verification inside actions is real (S-5) — the three source files rate this differently by lens, adjudicated in file 11 as complementary rather than contradictory.
- **C13 — Reliability of fire-and-forget state** (W-17, R-6, OP-22): 17 swallow-sites cover *real* state transitions — SRS counters, Storage cleanup, invite delivery — with no reporting path beneath the error boundaries while Sentry/PostHog sit credential-gated and dormant.
- **C8 — Coverage inverted against risk** (W-16, TD-2 — ranked #2 debt): the largest feature (flashcard, 34% of `src/`) has 4 test files; its data services, SRS math, and the sharing-RBAC resolver have none; four features have zero tests in any suite; the rules suite omits lessons/cards/comments entirely.
- **C6 — Fabricated dashboard data** (W-11, TD-8): admin analytics reads two collections nothing writes, substituting zeros indistinguishable from real values, and the CSV export synthesizes hardcoded-zero rows.
- **C3/C15/C4 — Structural debts**: the `flashcard↔notifications` import cycle (both legs value imports) plus the type-only `lib→features` back-edge; the flashcard mega-feature (46% of feature-module code); kana-survival's screens living in the route layer unlike all four sibling modes, a placement that has survived three restructures with intent unknown (PC-15, NQ-5).
- **C14 — Hand-synchronized configuration already drifted** (W-20): the proxy and AuthGate public-path allowlists — described in discovery as mirrors — are in fact **unequal** today; `APP_ID` derives from two different env vars across the two packages; there is no `.env.example` for ~30 referenced env vars and no recorded hosting decision (TD-14, the repo's only TODO).

## Pattern consistency (06)

Across 18 concerns: **3 consistent** (API access, toasts, i18n), **12 mostly-consistent**, **3 divergent** (forms, the three CRUD write-path families, filter/sort/search). Git dating shows most divergence is a July migration wave landing its first beachheads (react-hook-form, the shared table engine, the dialog end-state, ADR-002's caching policy are all July 16–18 work) — i.e., *migrations begun*, which loops back to the meta-finding: none of them record their intended end state.

## Decision readiness (10)

Of 144 findings: **85 strongly evidence-supported** (decisions can rely on them now), **49 need further investigation** (real findings whose severity depends on production state, live data, or product intent — three of them resolvable in-repo), **10 are explicit interpretations** (weight-of-judgment framings such as what counts as "too large"). Eight decision areas are ready for a decision-making phase now (boundaries/cycles, coverage allocation, standards enforcement, dialogs, the diverging inline-RBAC duplicate, auth architecture, config synchronization, component placement); ten are blocked pending answers to **17 inherited questions** (discovery Q-1–Q-17) plus **14 new ones** raised by this assessment (NQ-1–NQ-14 in file 12), of which the production-deploy currency of the notification migration (NQ-1) gates the single largest debt item.

## Confidence statement

Every wave-1 file re-verified its citations at HEAD rather than trusting the discovery corpus; the synthesis phase then spot-checked claims *across* files and adjudicated ten inter-file discrepancies against the repository — all were detail-level (counts, denominators, line numbers); **no finding's headline was overturned**. Where evidence was insufficient — runtime performance magnitudes, page-level accessibility, production deployment state, product intent for dormant surfaces — the corpus says so explicitly rather than assuming.
