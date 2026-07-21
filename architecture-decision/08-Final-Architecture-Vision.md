# 08 — Final Architecture Vision

**The decision phase, closed.** This document states the architectural direction in one place, records the Phase-7 validation result, and names — without softening — what this phase deliberately did not decide. It is the capstone of a three-phase chain: `project-discovery/` established what exists (144 evidence-cited facts, no judgments), `architecture-assessment/` evaluated it (144 findings across eight families, no prescriptions), and `architecture-decision/` fixes the direction (12 principles, 20 ADRs, 14 standards). Every decision here traces to assessment evidence, which traces to discovery citations, which trace to the repository.

## The vision in one paragraph

This codebase's foundations are sound and, in several respects, unusually disciplined — grep-checkable layering, a zero-route-handler server surface behind typed action families, security rules re-implementing application RBAC under emulator test, a five-suite test topology mirrored job-for-job in CI, measured 803/803 i18n parity. Its liabilities are not sloppiness; they are **staged work whose completion state was never recorded**. Six of twelve root causes reduce to exactly that, and the complexity analysis reached the same conclusion independently. The target architecture therefore does not add structure — it **enforces the boundaries the codebase already believes in, converges plurality that has no recorded constraint behind it, deletes what nothing claims, and makes staged work self-tracking**. The single highest-leverage decision in this phase is not about dependencies or auth or tests: it is ADR-120, which requires every staged change to record its intended end state. Every other decision degrades over time without it.

## The five commitments

1. **Boundaries are enforced, not documented.** Feature public APIs become lint-enforced (ADR-101); the `flashcard ↔ notifications` cycle becomes one-way (ADR-102); `lib` stops importing `features` (ADR-103); feature code lives in `features/`, routes orchestrate (ADR-105). Rationale: the corpus proves prose conventions decay here — the proxy and AuthGate allowlists, documented as mirrors, had already silently diverged.
2. **One pattern per problem — unless a constraint is written down.** Three write-path families converge to two families on one action client (ADR-106); one table engine (ADR-111); one dialog pattern in two sanctioned tiers (ADR-110). Principled plurality survives precisely where the constraint is real and recorded: two RBAC engines for two domains (ADR-115), two pagination mechanisms for two access shapes (ADR-112).
3. **Truthfulness at the boundaries.** Validation happens at the write boundary and declared schemas are enforced or deleted (ADR-109); queries are bounded and dashboards render absent data as absent rather than as fabricated zeros (ADR-114); errors report before they are handled (ADR-116); the auth credential becomes httpOnly and server-verified (ADR-107).
4. **Deletion is the default for unclaimed surfaces.** Dormant vocabularies, handler-less controls, the uncalled fan-out callable, the one-story Storybook toolchain: each is delete-unless-claimed behind a named gate (ADR-119). Capability-first abstraction without a consumer is out of policy (CS-3).
5. **Staged work records itself.** Every migration, deprecation, and gated disposition carries a ledger entry — intended end state, current stage, owner, review-by date (ADR-120). This is the answer to the meta-finding, and ADR-120 is the recording home for every gate across ADR-108/109/110/114/118/119.

## Phase-7 validation result

| Check | Result |
|---|---|
| No conflicting decisions | **Pass.** All 20 ADRs transcribe kernel status/gate/priority unchanged; gate references in `03` are a proper subset of `06`'s ledger. One nuance recorded below. |
| No duplicated standards | **Pass.** 14 standards, no overlap; two automation mechanisms that would have duplicated (ADR-108's vocabulary-agreement check and ADR-115's) were explicitly cross-referenced as one mechanism during drafting. |
| No contradictory principles | **Pass.** 12 principles intact, none dropped or inverted; seven inter-principle tensions were identified and resolved with explicit precedence (e.g. delete-first vs behavior-preservation; never-block vs report-then-handle). |
| Target aligns with assessment | **Pass.** All 16 evidence clusters map to at least one decision; 22 of 24 opportunities adopted, 2 rejected with recorded reasons. |
| Recommendations traceable | **Pass.** Every decision carries driving finding IDs → assessment file → discovery citation. Cross-file AD-x reference density: 428 references across the six non-ADR documents. |
| No unsupported assumptions | **Pass with disclosure.** Conditional decisions are gated on named questions rather than assumed; 25 questions remain open, 5 were closed by decision with owner-veto notes. |

**Recorded nuance (not a conflict):** ADR-115 is Accepted unconditionally for its core decision (two engines stay; predicates are never inlined), but the *alignment of the three divergent admin-authority predicates* folded under it (OP-7) cannot proceed until Q-10 answers where production admin authority actually lives. The matrix records this as a coverage caveat on R-8; the ADR's status is correct as written.

## What this phase deliberately did not decide

Stated plainly, because a decision phase that hides its gaps is worse than one that has them:

- **R-3 — the world-readable leaderboard (uid ↔ displayName, no auth gate).** No decision. Whether public readability is a feature or a privacy defect is a product call, not an architectural one; routed to NQ-7. The architecture does not bless the current state — it declines to rule on it.
- **R-12 — single-author knowledge concentration** (all 140 commits, plus an admin bootstrap no code performs). Not architecturally resolvable. Mitigated indirectly by ADR-120's ledger, ADR-117's coverage floors, and ADR-118's configuration single-sourcing.
- **TD-3 — the warn-only 200-line ceiling with 44 standing violators.** No dedicated ADR; CS-2 replaces it with a tiered rule (≤250 / 251–400 / >400 error) derived from the corpus's own size distribution, and feature-size concerns roll up into ADR-104. Making the hard tier binding implicates exactly one non-test file.
- **Hosting and deployment target.** Cannot be decided from documents (Q-2). ADR-118 addresses configuration single-sourcing and explicitly leaves hosting open.
- **Runtime magnitudes** (listener costs, bundle impact, actual query latencies). Never profiled in any phase; several risks are High-confidence structurally and Low-confidence in magnitude. The decisions do not claim measured performance impact.
- **Anything requiring production or product knowledge** — 25 open questions across intent (12), GCP/ops (6), live data (2), and repo-measurable (5), plus 7 minor gaps. Defaults are in force for gated decisions until answered.

## What follows this phase

This document set is the destination and the rules, not a plan. Nothing here is sequenced, estimated, or assigned — deliberately, per the phase's mandate. A planning phase would draw on `06-Decision-Matrix.md` for priorities (P1 decisions cluster around the notification migration, boundary enforcement, auth credential, observability, coverage, and configuration) and on `07-Open-Questions.md` for what must be answered before specific gated work can begin. The most valuable single thing to do before any of that: answer the questions with the widest blast radius — Q-1 (production project identity), then the AD-08 cluster (Q-5, Q-7, NQ-1), then the AD-19 gates (Q-6, Q-8, Q-11, Q-13, Q-17), because each unblocks several decisions at once.

## Confidence statement

The decisions rest on an evidence chain that was adversarially checked at every level: discovery separated observation from inference and marked its uncertainties; the assessment re-verified every load-bearing discovery claim against the repository and corrected ten of them; its synthesis phase spot-checked findings *across* parallel documents and adjudicated ten inter-file discrepancies — all detail-level, no headline overturned. This phase added no new repository claims; where the corpus was silent, it recorded an open question rather than inventing an answer. Where the corpus carried a known error (the "11th notification value" off-by-one, the flashcard 34%/46% denominator mislabel), the adjudicated-correct figure was used and the correction noted. The direction is as well-founded as documents can make it; the 25 open questions mark exactly where documents stop.
