# Architecture Decision — Index

The **decision phase** for the "Kana & Nihongo Master" codebase: one coherent architectural direction consolidated from the two preceding corpora. Fixes **12 principles**, **20 Architecture Decision Records (ADR-101–120)**, and **14 coding standards**. Every decision traces to assessment findings, which trace to discovery citations, which trace to the repository.

**Method note.** This phase consolidated existing documentation and did not rescan the repository; where the corpus was silent, an open question was recorded rather than an answer invented. Statuses are **Accepted** (decidable now) or **Accepted-conditional** (default stands, gated on a named question). Priorities are P1/P2/P3.

**Input-state note.** Of the four input directories named in the phase mandate, only `project-discovery/` and `architecture-assessment/` exist; `architecture-audit/` and `requirements-consolidation/` were removed from the repository before the discovery phase and were not reconstructed — their absence is recorded here rather than worked around.

| # | Document | Contents |
|---|----------|----------|
| 01 | [Architecture Principles](01-Architecture-Principles.md) | P-1–P-12: statement, why it exists (finding IDs), what it rules out (real corpus anti-examples), decisions it grounds, and seven resolved inter-principle tensions |
| 02 | [Target Architecture](02-Target-Architecture.md) | The destination only — feature organization, shared infrastructure, forms, validation, tables, dialogs, data layer, Firebase layer, permissions, auth, state, observability, configuration, testing; conditional destinations state their gates |
| 03 | [Architecture Decisions](03-Architecture-Decisions.md) | ADR-101–120 (1:1 with the decision kernel), each with Problem / Context / Decision / Alternatives Considered / Trade-offs / Consequences / Success Criteria / Status / Priority; namespaced to coexist with the repo's existing `docs/adr/001–003` |
| 04 | [Coding Standards](04-Coding-Standards.md) | CS-1–CS-14 operationalizing the decisions: shared-utility three-use rule, tiered file-size ceiling, abstraction limits, component/hook/service responsibilities, folder & barrel policy, naming, import rules, performance, state ownership, error/logging, validation, i18n & theming |
| 05 | [Simplification Strategy](05-Simplification-Strategy.md) | Where architecture is *removed*: gated deletions, unconditional removals, convergences, indirection to retire, configuration to centralize — plus an explicit **what NOT to simplify** guard (two RBAC engines, two pagination mechanisms, five-suite testing, deliberate boundaries) |
| 06 | [Decision Matrix](06-Decision-Matrix.md) | Full traceability: decisions → findings → evidence clusters → corpus files, with reverse-traces for every top debt, top risk, and all 24 opportunities; coverage gaps flagged explicitly rather than papered over |
| 07 | [Open Questions](07-Open-Questions.md) | 25 open questions grouped by answering-class (intent / GCP-ops / live data / repo-measurable) and ordered by how many decisions each blocks; 5 questions closed-by-decision with owner-veto notes; defaults in force while open |
| 08 | [Final Architecture Vision](08-Final-Architecture-Vision.md) | The direction in one place: the five commitments, the Phase-7 validation result, **what this phase deliberately did not decide**, what a following phase would draw on, and the confidence statement |

## The five commitments, in brief

1. **Boundaries are enforced, not documented** (ADR-101/102/103/105) — prose conventions provably decayed here.
2. **One pattern per problem, unless a constraint is written down** (ADR-106/110/111; plurality preserved in ADR-112/115).
3. **Truthfulness at the boundaries** — validated writes, bounded queries, honest UI, reported errors, verified sessions (ADR-107/109/114/116).
4. **Deletion is the default for unclaimed surfaces** (ADR-119, CS-3).
5. **Staged work records itself** (ADR-120) — the highest-leverage decision; every other decision decays without it.
