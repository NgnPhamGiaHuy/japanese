# Project Discovery — Index

> ## ⚠ HISTORICAL — sealed inventory, do not navigate by its paths
>
> **Discovered at `a0bbbc4` (2026-07-18). HEAD is now 82+ commits later.** These are
> point-in-time **inventories**, and inventories decay fastest. A structural cleanup program
> has since moved most of `features/flashcard/components/`, `admin/components/shared/`,
> `shared/components/ui/`, and every `app/**/_components/` directory.
>
> **Measured path accuracy, by file (sampled 2026-08-04):**
>
> | Doc | Accuracy | Read it for |
> |---|---|---|
> | 06-Service-Inventory | ~100% | **Still reliable.** Firestore path map, execution-context legend, the two server-action auth families |
> | 09-Data-Flow | ~100% | **Still reliable** — but its "centralized listener = notifications only" claim is now false (`UserProgressContext` and `LessonsContext` do it too) |
> | 02-Architecture-Discovery | high | Auth chain, both RBAC systems, env-var table — rationale intact, counts stale |
> | 07-Provider-Inventory | high | Now **5** contexts, not 3 |
> | 08-Dependency-Graph | ~75% | The two cycles + the layering invariant; every edge *count* is stale |
> | 05-Hook-Inventory | ~73% | Per-hook semantics reusable; path column rotted |
> | 04-Component-Inventory | ~56% | **Flashcard section is 0/24 — every path moved** |
> | 11-Code-Metrics | ~45% | The *commands* are re-runnable; the numbers are a 2026-07-18 baseline |
> | 14-Evidence-Appendix | 0% | Faithful transcript of `a0bbbc4`; archival only |
>
> **Current counts (2026-08-04):** 9 features (unchanged) · 493 files under `features/` ·
> 12 `onSnapshot` call sites in 8 files, all in `services/` · 0 Storybook files.
>
> For current state read **[`project-memory/00-INDEX.md`](../project-memory/00-INDEX.md)**.
> Docs **12** and **13** (known-unknowns / questions) largely still stand — those questions
> are out-of-repo by nature — except U-8, U-9, U-23, Q-13 and Q-17, all answered by deletion.

Evidence-based Discovery Phase for the repository at HEAD `a0bbbc4` (branch `main`). Every document observes and cites; none evaluates or recommends. Claims are grounded in file:line references verified at time of writing; "Observed" and "Inferred" are separated throughout, and uncertainty is marked explicitly. The prior-analysis artifacts formerly at the repo root were not used as evidence (they were absent from disk at discovery time); `docs/` (ADRs, testing notes) was cited only where code comments reference it.

| # | Document | Contents |
|---|----------|----------|
| 01 | [Project Overview](01-Project-Overview.md) | Stack (Next.js 16.2.3 / React 19.2.4, Firebase 12/13, Tailwind v4, next-intl 4), repo and `src/` structure, both package.json files, build/lint/format/test tooling, routing shape, counts summary |
| 02 | [Architecture Discovery](02-Architecture-Discovery.md) | Layered organization (App Router pages → 9 feature modules → `shared/` → `lib/`), layer boundaries and their enforcement, rendering/auth/permission/error/notification/form/API/state/configuration flows, with mermaid sequence diagrams |
| 03 | [Feature Catalog](03-Feature-Catalog.md) | All 9 feature modules plus 8 app-level surfaces, each with purpose, entry points, pages, components, hooks, services, Firestore paths, shared dependencies, and related features; summary and import-matrix tables |
| 04 | [Component Inventory](04-Component-Inventory.md) | Full detail on 21 shared UI components (+ internals), per-feature tables for ~150 feature components with verified consumers, app-level components, client/server directive map |
| 05 | [Hook Inventory](05-Hook-Inventory.md) | All 68 custom hooks in 12 groups: purpose, params/returns, state mechanism, services called, consumers; cross-cutting hook patterns |
| 06 | [Service Inventory](06-Service-Inventory.md) | All 64 service/action modules incl. Cloud Functions: exports, execution context (client SDK / `"use server"` / server-only Admin SDK / Function), Firestore paths, callers, service-to-service imports |
| 07 | [Provider Inventory](07-Provider-Inventory.md) | Both composition roots with exact nesting order, the three `createContext` contexts with mount sites and consumers, third-party provider configs, module-level singletons |
| 08 | [Dependency Graph](08-Dependency-Graph.md) | Six graphs (feature, component, service, provider, API, state) as mermaid + grep-evidence tables; two directory-level cycles documented with exact import lines |
| 09 | [Data Flow](09-Data-Flow.md) | UI → hooks → services → actions → Firebase → UI map; three return channels (realtime push, one-shot React Query, fire-and-forget); three fully-traced examples at file:line granularity |
| 10 | [Pattern Catalog](10-Pattern-Catalog.md) | 17 required pattern categories + 11 additional observed patterns, each with mechanism, canonical files, usage counts, and coexisting variants documented neutrally |
| 11 | [Code Metrics](11-Code-Metrics.md) | Objective numbers only: 586 TS/TSX files / 49,883 lines, largest files/hooks/services, counts by kind, dependency counts, duplicate-name scan, stated-method heuristics; unmeasured items recorded as such |
| 12 | [Known Unknowns](12-Known-Unknowns.md) | 25 unknowns (U-1–U-25): flags, dormant vocabularies, unenforced schemas, unwritten-but-read collections, admin bootstrap, env-gated integrations — each with evidence and why code alone cannot answer it |
| 13 | [Questions Before Refactoring](13-Questions-Before-Refactoring.md) | 17 questions (Q-1–Q-17) ordered widest-first, each with Reason / Affected modules / Potential impact / Confidence level; no answers or solutions proposed |
| 14 | [Evidence Appendix](14-Evidence-Appendix.md) | Reproducible raw evidence: directory trees, verbatim config excerpts, counting commands with outputs, git facts (138 commits, 2026-04-12 → 2026-07-18) |
