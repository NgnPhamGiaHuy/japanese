# Execution Readiness — Index

> ## ⚠ HISTORICAL — this gate has been passed and spent
>
> **The program it gated has since executed** (61 of 63 tasks). Sprint 0 ran and closed;
> see [`08-Sprint-0-Completion.md`](08-Sprint-0-Completion.md).
>
> **Condition status (2026-08-04):**
>
> | | Condition | Status |
> |---|---|---|
> | **C-1** | Run Sprint 0 | ✅ Discharged |
> | **C-2** | Restate Sprint 1's acceptance evidence | ✅ Closed |
> | **C-3** | Hold T-118b out of Wave 1 | ✅ Closed — still BLOCKED (`LDG-09`) |
> | **C-4** | Correct the "T-117d is droppable float" claim | ✅ **Closed 2026-08-04** |
> | **C-5** | Flip CI lint to blocking | ✅ Closed (`4fd206c`) |
> | **C-6** | Feature-flag posture + DR position | ⚠ Rule recorded, implementation deferred |
> | **C-7** | Adjudicate the ADR-106 / ADR-115 permission-vocabulary collision | ❌ **STILL OPEN** |
>
> ⚠ **Two different `C-1…C-7` sets exist in this directory.** The table above is
> [`07-Go-NoGo-Decision.md`](07-Go-NoGo-Decision.md)'s. [`04-Sprint-1-Approval.md`](04-Sprint-1-Approval.md)
> uses the same labels for entirely different conditions, and only 07's set was ever tracked
> to closure. When someone says "C-3 is closed," ask which set.
>
> **The one thing here that is still live: C-7.** Also still unclosed —
> [`05-Risk-Register.md`](05-Risk-Register.md) rated feature-flags, disaster-recovery and
> monitoring **ABSENT or THIN**, and nothing since has closed them.
>
> For current state read **[`project-memory/00-INDEX.md`](../project-memory/00-INDEX.md)**.

Readiness review of the implementation plan. **Verdict: GO WITH CONDITIONS** — Sprint 0 (a working session) then Sprint 1 are approved; seven conditions attach, three of them due before later waves rather than before Sprint 1.

This is a verification phase, not a planning phase. No architecture, tasks, or plans were created here. The only new artifacts are findings, statuses, and the verdict.

## Method

Four independent reviewers were briefed **adversarially**: every document under review was produced earlier in the same session by sibling agents working from a coordinator-written kernel, so they share a common origin and a common blind spot. The brief required falsification over confirmation and instructed reviewers to delete any "Pass" not backed by a citation. Ten known issues were handed over to be **verified independently, not inherited** — several came back worse than reported, two came back cleared.

`requirements-consolidation/`, listed as an input by the phase mandate, does not exist (deleted before discovery, never committed, unrecoverable). Recorded, not worked around.

| # | Document | Contents |
|---|----------|----------|
| 01 | [Readiness Review](01-Readiness-Review.md) | Phase-1 consistency: 7 checks (2 PASS, 3 PARTIAL, 2 FAIL) with cross-comparison shown; 19 ranked defects — 0 Critical, 6 Major, 13 Minor |
| 02 | [Open Questions](02-Open-Questions.md) | All 33 questions re-enumerated and classified by decision type; blocks-Sprint-1 shortlist; per-question default, owner class, and answer-latency risk |
| 03 | [Task Status](03-Task-Status.md) | Independent status for all 63 tasks — 36 READY / 19 READY WITH ASSUMPTIONS / 8 BLOCKED; 20 re-classifications with reasoning; the T-118b adjudication |
| 04 | [Sprint 1 Approval](04-Sprint-1-Approval.md) | Prerequisites, environments, credentials, approvals, hidden migration risks — verdict APPROVED WITH CONDITIONS (7), plus the Sprint 0 definition |
| 05 | [Risk Register](05-Risk-Register.md) | Coverage review across 9 areas: feature flags **absent**, disaster recovery **absent**, monitoring **thin**; the 7 non-reverting change classes rated 3 specified / 2 partial / 2 named-only |
| 06 | [Implementation Contract](06-Implementation-Contract.md) | 126 mandatory rules across 10 sections, 124 of them restating a cited artifact obligation; plus 6 gaps where an obligation has no enforceable rule |
| 07 | [Go / No-Go Decision](07-Go-NoGo-Decision.md) | **The verdict**, its conditions, approved scope, required corrections, what the verdict does not certify, and the review-integrity note |
| 08 | [Sprint 0 Completion Record](08-Sprint-0-Completion.md) | **Sprint 0 executed** at `a0bbbc4`: condition checklist, five-suite verification, the CI-gate flip proven by experiment, the Sprint 1 evidence decision, the irreversible-migration rule, and the two owner confirmations still outstanding |

## The two findings that changed the verdict

1. ~~**CI lint does not block.** It runs `continue-on-error: true`, and no task among the 63 flips it~~ — yet from Sprint 4 the program converts import-boundary rules to `error` and treats that as enforcement for its first principle. Wave 1 would have shipped the *appearance* of enforcement. No prior phase caught this; the corpus cites the non-blocking lint approvingly.

   > **RESOLVED 2026-08-04.** This finding did its job: Sprint 0 flipped CI lint to blocking (`4fd206c`, removing `continue-on-error`) under Go/No-Go condition **C-5**. `.github/workflows/ci.yml:41-53` now runs lint as a hard gate, and `import/no-restricted-paths` is at `error` in `src/eslint.config.mjs`. The enforcement is real, not apparent. This correction also applies to `02-Open-Questions.md` §290, `04-Sprint-1-Approval.md` F-4, and `06-Implementation-Contract.md` PROH-20 / gap G-1, all of which rest on the same premise.
2. **Sprint 1's acceptance evidence does not exist.** Three documents name an E2E route-matrix pass that only materializes in Sprint 11 — itself downstream of Sprint 1's own work.

## What is approved

**Sprint 0** — seven pre-flight items, one sitting, no engineering: toolchain check, baseline SHA, CI-record correction, name human owners, assign gate owners (including the unregistered Q-4), settle Sprint 1's acceptance evidence, confirm ledger scope.

**Sprint 1** — T-120a/b/c (create the migration ledger, backfill it, fix the ADR index) + T-118a (single-source the public-path allowlist, repairing an existing divergence). 8 task-days, 5 PRs, no gated task, no credentials, no non-reverting change.

**Sprints 3–8** conditionally; **Sprint 2** at reduced scope with `T-118b` held out as BLOCKED.

## Standing corrections the artifacts still need

Q-4's missing row (true question count: 33; the register's "18 blocking" figure is unreconstructible and should be deleted) · the gated split is not 12/4 · "there is no CI/CD pipeline" is false · the zero-external-dependencies runway claim fails at Sprint 2 · `T-114d`'s fallback is stated in opposite directions in two documents · no artifact establishes who is assignable as an owner.
