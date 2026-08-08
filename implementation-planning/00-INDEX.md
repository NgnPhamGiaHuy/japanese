# Implementation Planning — Index

> ## ⚠ HISTORICAL — this plan has been EXECUTED
>
> **Status as of 2026-08-04: 61 of 63 tasks complete.** Only two remain, both deliberately:
> **T-118b** (BLOCKED — unifying `APP_ID` is a tenant repartition; ledger `LDG-09`) and
> **T-118d** (OPEN — hosting is a decision, not a task; ledger `LDG-08`).
>
> **The 29-sprint / 58-week schedule never ran as written.** The program executed in
> **5 days / 82 commits** (`a0bbbc4` → `f4dd766`). Every sprint boundary, capacity figure,
> merge-lock window and parallel-opportunity note in **02**, **03**, **04** describes a
> process that did not occur. The 16 gated tasks discharged two different ways: **5 executed
> their delete default** (T-110b, T-119a/b/c/e) and **11 landed as recorded dispositions with
> code untouched** (T-108b/c/d, T-109b/c/d, T-114d, T-115c, T-116b/c, T-119d).
>
> ⚠ **[`09-Progress-Tracking.md`](09-Progress-Tracking.md) still reports `Done: 0` for all
> 63 tasks. It is wrong** — it was pre-filled and never updated. See its own banner.
>
> **Still-binding reference material, worth keeping (not schedules):**
> - **[`04-PR-Plan.md`](04-PR-Plan.md) §1.2** — 7 PR-sizing rules. The most reusable block in the corpus.
> - **[`08-Implementation-Readiness.md`](08-Implementation-Readiness.md) §7** — the 17-point standing definition of done.
> - **[`10-Release-Plan.md`](10-Release-Plan.md) §3.3** — what does NOT revert cleanly. Item (6) is the reasoning behind T-118b's standing BLOCK.
> - **[`10-Release-Plan.md`](10-Release-Plan.md) §5.2** — two-package deploy topology ("the tolerant side deploys first").
> - **[`02-Execution-Waves.md`](02-Execution-Waves.md) §576** — the six areas the program deliberately did *not* address.
>
> For current state read **[`project-memory/00-INDEX.md`](../project-memory/00-INDEX.md)**;
> for live state read **[`docs/migrations-ledger.md`](../docs/migrations-ledger.md)**.

Execution-ready plan for the "Kana & Nihongo Master" modernization program: **63 tasks · 6 waves · 29 sprints · 93 PRs · 10 release units**, every task traceable to an Architecture Decision Record.

## Provenance and honest labelling

**This plan is derived from the 20 ADRs in `architecture-decision/`, not validated from a pre-existing backlog.** The phase mandate named three inputs; two do not exist:

| Input | Status |
|---|---|
| `architecture-decision/` | Present — 20 ADRs, 12 principles, 14 standards |
| `requirements-consolidation/` | **Absent** — deleted before the discovery phase, never committed, unrecoverable |
| `engineering-tasks/` | **Absent** — same; this was the backlog itself |

Consequences, applied throughout: traceability runs **task → ADR → driving findings → corpus**; Requirement-IDs and Recommendation-IDs from the absent documents are **never cited**, because inventing them would fake the audit trail. The prior E15–E18 epic backlog was largely executed (E15, E16, E17 T1/T3–T10 shipped) and is superseded by the ADR set; its IDs are not resurrected.

## Planning basis

- **Team size 1** — the corpus establishes bus factor 1 (all commits, single author). Sizing assumes one developer; every sprint marks what a second could take in parallel.
- **2-week sprints, 8 task-days of capacity** per 10-day sprint; the reserve covers the pre-commit gate, five-suite CI turnaround, gate-chasing, and L-size variance.
- **Every sprint ends deployable.** No sprint ships a half-migrated boundary, a partially-converged client, or a broken gate.

| # | Document | Contents |
|---|----------|----------|
| 01 | [Validated Backlog](01-Validated-Backlog.md) | All 63 tasks: ID, size, wave, status, ADR trace, description, acceptance criteria, applicable standards, regression scope, rollback. Plus the derivation-validation record — what was merged, what was deliberately *not* created, and why |
| 02 | [Execution Waves](02-Execution-Waves.md) | 6 waves with goal, placement rationale, releasable outcome, entry/exit criteria, gated items, parallelization notes |
| 03 | [Sprint Plan](03-Sprint-Plan.md) | 29 sprints: goal, tasks, deployable value, complexity, risk, parallel opportunity, merge-conflict profile, question-resolution items |
| 04 | [PR Plan](04-PR-Plan.md) | 93 PRs, one concern each; four large refactors split across sprints with named stable intermediate states; sequencing constraints |
| 05 | [Dependency Map](05-Dependency-Map.md) | Hard vs soft dependencies, per-wave graphs, cross-wave table, gate-dependency table, parallel-start candidates |
| 06 | [Critical Path](06-Critical-Path.md) | The 73-day dependency spine, slack analysis (124 days of float), schedule risks, what shortens the path |
| 07 | [Risk and Mitigation](07-Risk-and-Mitigation.md) | 14 execution risks (X-1…X-14) with trigger, plan impact, built-in mitigation, residual risk, contingency |
| 08 | [Implementation Readiness](08-Implementation-Readiness.md) | READY/NOT-READY verdict per sprint, the immediate-start runway, 10-item pre-flight checklist, 17-point definition of done |
| 09 | [Progress Tracking](09-Progress-Tracking.md) | Task status model, the ADR-120 ledger as system of record, pre-filled 63-row tracking table, wave completion criteria, question tracking, health indicators |
| 10 | [Release Plan](10-Release-Plan.md) | 10 release units, sequencing, per-release rollback, verification tiers, deployment constraints, checklist, communication notes |

## Where to start

**Sprints 1–8 form an unbroken ~16-week runway with zero external dependencies** — ledger, single-sourced configuration, feature public APIs, lint-enforced boundaries, the flashcard↔notifications cycle broken, and the full Wave 2 test safety net. No question needs answering before Sprint 1 begins.

**20 of 29 sprints are READY.** All 9 NOT-READY sprints are blocked by *unanswered gates*, never by planning defects — acceptance criteria, regression scope, and rollback are complete for all 62 wave-assigned tasks. Three non-engineering acts unblock all nine: one product-owner session on the intent questions, one confirmation of an already-recorded decision, and provisioning a real Firebase project.

## Phase-7 quality review

| Check | Result |
|---|---|
| No duplicated work | **Pass.** 63 unique IDs consistent across files 01/02/05/09; overlapping candidates were merged with the merge recorded (e.g. the vocabulary-check mechanism built once, serving two ADRs) |
| No conflicting tasks | **Pass.** One latent conflict found and resolved: the activity-vocabulary declaration relocated by T-103a and edited by T-119b — ordering already satisfied it, now recorded explicitly |
| No missing requirements | **Pass, with disclosure.** All 20 ADRs map to tasks; two top-corpus items intentionally carry no task (a deferred debt item and two privacy risks routed to product intent) — recorded, not silently dropped |
| No missing acceptance criteria | **Pass.** 63 of 63 tasks carry observable acceptance criteria |
| No architecture violations | **Pass.** Every task cites the ADRs it must not violate; standards (CS-1…CS-14) attached per task |
| No unnecessary complexity | **Pass.** Derivation deliberately created no new features and no new architecture; 13 candidate task-classes were rejected as already-covered |

**Reconciled discrepancy:** files 02 and 06 quote *~20 sprints / 40 weeks* — a raw day-sum (197 d ÷ 10 working days) assuming 100% utilization. File 03's **29 sprints / 58 weeks (~13.5 months)** is the planning figure: it applies realistic 8-day sprint capacity plus the isolation slack forced by the no-mixing rule (82% utilization). **Use 29 sprints for scheduling; 20 is an unreachable floor.** The 73-day critical path is a *capacity* floor, reachable only with added developers — never at team size 1.

## Two things the plan cannot solve for itself

1. **The critical path terminates in a gated task.** Its final step is blocked on a data question; sprints 1–22 can execute flawlessly and the path still ends one node short, leaving the corpus's #1 debt alive. Two completion definitions are reported from Sprint 1 rather than assuming an answer arrives.
2. **The plan cannot unblock its own verification.** Production verification depends on knowing the production project, which depends on a hosting decision that is `[OPEN]` and not schedulable. This is escalated as a pre-flight item — it sits outside the plan by construction.
