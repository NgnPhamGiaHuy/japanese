# 09 — Progress Tracking

> ## 🛑 SUPERSEDED — the status tables in this file are WRONG
>
> **Every task row below is blank and §3's roll-up reads `Done: 0` for all six waves.
> That is not the state of the repository.** The tables were pre-filled to be "usable on
> day one" and were never updated during execution.
>
> **Actual status (verified 2026-08-04): 61 of 63 tasks complete.** 61 task IDs appear in
> commit messages (`git log --oneline | grep -oE "T-[0-9]{3}[a-e]?" | sort -u`). The only
> two that are not are **T-118b** (BLOCKED — ledger `LDG-09`) and **T-118d** (OPEN — ledger
> `LDG-08`), both correctly so.
>
> **Do not use this file to decide what to work on.** It would have you re-plan 63 finished
> tasks. The tables are left in place rather than retro-filled because the ledger already
> carries the durable state and back-writing 63 rows from memory is exactly the failure
> ADR-120 exists to prevent.
>
> **Read instead:** [`docs/migrations-ledger.md`](../docs/migrations-ledger.md) (live state)
> and [`project-memory/00-INDEX.md`](../project-memory/00-INDEX.md) (current state).
>
> What *is* still valuable here: **§2.3's ledger-row model** and **§5's open-question
> register**, both of which the ledger now implements.

**Phase 11 — Implementation Planning.** How this plan's execution is tracked, day to day, by a one-person team.

> **Honest labeling.** This plan is **derived from the 20 ADRs** in `architecture-decision/`, not a validation of a pre-existing backlog. `engineering-tasks/` and `requirements-consolidation/` do not exist. No requirement-ID or recommendation-ID is cited anywhere in this document, because those documents are absent and their IDs are unrecoverable. Traceability runs **task → ADR → driving findings → corpus file**.

**Authority.** `01-Validated-Backlog.md` is the authoritative task list — IDs, waves, sizes, gates, statuses. This document tracks execution against it and **restates nothing it owns**. Where the two ever differ, 01 wins and the tables here are corrected.

**Two artifacts, one boundary.** This document defines *task* tracking — the ephemeral record of executing this plan. It does **not** define the **ADR-120 migration ledger**, which is the permanent, in-repo record of staged change and outlives this plan entirely. §2 fixes the boundary between them so nothing is recorded twice.

---

## 1. Task status model

### 1.1 The three backlog statuses, plus execution states

`01` assigns every task exactly one of three statuses — **Ready · Gated Q-n · Open** — split **46 / 16 / 1**. Those are the day-one values in §3, unchanged. Tracking adds only the states a task passes through *after* it is picked up:

| State | Origin | Meaning | Exit |
|---|---|---|---|
| **Ready** | 01 | Schedulable now; no external answer required. Has passed 01's five validation checks: one owning ADR, ≥1 driving finding, observable acceptance criteria, named regression scope, rollback path. | → In progress |
| **Gated Q-n** | 01 | Scheduled into a wave, **NOT READY** until the gate answers. Each carries a defined fallback (§1.2). | → Ready (§1.3) |
| **Open** | 01 | Not schedulable; the output is a decision, not code. **Exactly one task: T-118d** (hosting, Q-2). | → Ready only once the decision is recorded as a new ADR |
| **In progress** | tracking | Branch open, work underway. | → In review |
| **In review** | tracking | PR open. Pre-commit gate (lint + format + full build) passed; named test tiers running or green. | → In progress (changes requested) or → Done |
| **Done** | tracking | Merged. Acceptance criteria observed, not asserted. Ledger row advanced in the same PR where one applies. | terminal |

There is deliberately **no "Not started"**. 01 calls these tasks Ready, which is a stronger and more useful claim — it means the readiness work has already been done. Introducing a weaker default state here would quietly discard that.

There is also no "Superseded". 01 §2.1 already performed the merges and folds (M-1 … M-9) before any task reached this table, so no row here can be absorbed by another. The cross-cutting items have named owners: the `ShareModal.tsx` split rides in **T-115a**, the raw-hex cleanup in **T-110a + T-111a**, the stale lint-config count in **T-101c**, the `toActionResult` shim retirement in **T-106d**.

### 1.2 Gated tasks carry a fallback, and the fallback's *shape* matters

01 §2.4 gives all 16 gated tasks a pre-committed fallback drawn from `07-Open-Questions.md`'s standing defaults, "so no gate can stall indefinitely." Those fallbacks split in two directions, and the difference decides whether a gated task can occupy sprint capacity:

| Fallback shape | Meaning | Tasks | Count |
|---|---|---|---:|
| **Executable** | The default names an action the task can carry out today. The work is doable; only the risk of later contradiction is open. | T-116b, T-116c (defer activation **and record the deferral** — 01 makes an undecided state an explicit failure of the task) · T-114d (remove the dead read paths) · T-109b/c/d (per-schema: wire or delete) · T-119a/b/c/d/e (delete the unclaimed surface) · T-110b (delete `Drawer`) | **12** |
| **Inaction** | The default is *retain / hold*. Executing now would be the specific harm the ADR names. The task cannot occupy capacity. | T-115c (01: "the one gate whose default is *inaction*") · T-108b, T-108c, T-108d (retain the dual machinery until the deploy state and legacy-data verdict are known) | **4** |

**Why this annotation earns its place.** Without it, Wave 5's eight gated tasks look uniformly frozen when five of them (T-119a–e) are executable under a pre-committed default and need only someone to accept it. With it, sprint planning can tell the difference between *blocked* and *awaiting a decision nobody has made yet*.

**Why it is an annotation and not a status.** 01 owns the status vocabulary. Splitting `Gated` into two statuses here would fork it.

ADR-108 states the inaction case exactly: collapsing the dual read path without confirming the backfill ran "would silently hide pre-migration notifications from users." That is not caution — it is the named consequence.

### 1.3 What moves a task off Gated

| Fallback shape | Unblocked by |
|---|---|
| **Executable** | (a) the question answering, **or** (b) the ledger row's **review-by date passing**, which executes the pre-committed default. |
| **Inaction** | The question answering, and nothing else. A schedule slip is not an answer. The only alternative is an explicit, ledger-recorded owner decision to accept the named alternate risk — never an implied one. |
| **Open** (T-118d) | A hosting decision being **made** and recorded as a new ADR. 07 is explicit that Q-2 "is a decision to make, not a fact to find"; no investigation resolves it. |

Route (b) is the operational teeth of ADR-120. Without an expiry that actually fires, "delete-unless-claimed" degrades into "delete-never" — the exact failure mode (RC-7, CX-7) the decision exists to prevent.

### 1.4 Definition of Done (every task)

- Acceptance criteria from 01 demonstrated, not asserted — the evidence is in the PR (test output, lint failure-then-pass, search result returning the stated count).
- Pre-commit gate green: lint + format + full build.
- The applicable test tiers named in the PR body are green.
- **If the task advances a staged change, its ledger row's `current stage` moved in the same PR.** A staged change that lands without its ledger row moving is a review-time defect (ADR-120).
- The row in §3 carries a PR link and a done-date.

---

## 2. The ADR-120 ledger is the system of record

### 2.1 What the ledger is

T-120a creates it; T-120b backfills it. Per ADR-120 it lives **in-repo**, and every row carries four required fields: **intended end state · current stage · owner · review-by date**. T-120a's acceptance criteria make a row missing any of the four invalid by the format's own statement.

The ADR's rejected alternatives bind this document. It rejected *tracking completion state in an external tool* because out-of-repo state is unknowable to the code and to any future maintainer, and rejected *ADRs alone* because a staged change needs a **mutable** current-stage that an immutable decision record cannot carry.

**So nothing in this file may become a second home for completion state.** The progress table tracks whether *a unit of this plan's work* happened. The ledger tracks whether *a staged change reached its end state*. Different questions, different lifetimes.

### 2.2 The explicit relationship

| | **Ledger (ADR-120)** | **Progress table (§3)** |
|---|---|---|
| Unit | One **staged change** — a migration, deprecation, or capability landed in stages | One **task** from `01-Validated-Backlog.md` |
| Question answered | "Is this still intended, how far along is it, who owns it, when is it re-checked?" | "Did this piece of the plan get done?" |
| Lifetime | **Permanent.** Survives this plan, this phase, and contributor turnover. | **Ephemeral.** Dies when the plan completes. |
| Mutability | Rows mutate as stages advance; rows close at the end state. | Rows reach Done and freeze. |
| Location | In-repo, discoverable from the docs index (T-120a, coordinated with T-120c) | This file |
| Cardinality | 14 rows + 1 conditional | 63 rows |

**The join is exactly one column.** The progress table's `Ledger` column names the ledger row a task advances, or `—`.

- The ledger **never** lists task IDs, sprints, PRs, or statuses. It is not a backlog.
- The progress table **never** restates an intended end state, an owner, or a review-by date. It is not a ledger.
- Where a task advances a staged change, the **task's DoD** (§1.4) requires the ledger row to move in the same PR. That is the only place the two artifacts touch.

**Where they disagree, the ledger wins.** It is the in-repo record a future maintainer reads; this file is scaffolding for one execution run.

### 2.3 Initial ledger rows

ADR-120 names its own initial entries, and T-120b's acceptance criteria require every gated disposition in ADR-108/109/110/114/118/119 to have a row with all four fields. Expanded against `02`'s conditional-destinations register, that is fourteen rows plus one conditional:

| Key | Staged change | ADR | Gate | Advanced by |
|---|---|---|---|---|
| LDG-01 | Notification schema migration (dual paths, dual indexes, 4 `@deprecated` fields, backfill script) | ADR-108 | Q-5 + NQ-1 (Q-6 for the digest) | T-108b/c/d/e |
| LDG-02 | `cardContentSchema` disposition | ADR-109 | Q-12 | T-109b |
| LDG-03 | `privacyModeSchema` disposition | ADR-109 | Q-12 | T-109c |
| LDG-04 | `publicRoleSchema` disposition | ADR-109 | Q-12 | T-109d |
| LDG-05 | `Drawer` disposition | ADR-110 | NQ-3 (closed-by-decision; veto window) | T-110b |
| LDG-06 | `analytics_daily` / `metadata/counters` read paths | ADR-114 | Q-9 | T-114d |
| LDG-07 | Hosting / deployment target — **Open**, with the `SITE_URL` localhost fallback flagged as the standing hazard | ADR-118 | Q-2 | T-118d |
| LDG-08 | 7 dormant `NotificationKind`s | ADR-119 | Q-8 | T-119a |
| LDG-09 | 8 never-emitted `ActivityAction`s + `cloud_function` LogSource (incl. the kana-practice gap) | ADR-119 | Q-11 | T-119b |
| LDG-10 | Handler-less admin Quick Actions, Settings stub, orphan `canChangeSettings` | ADR-119 | Q-13 | T-119c |
| LDG-11 | `fanOutNotifications` callable | ADR-119 | Q-6 | T-119d |
| LDG-12 | Storybook toolchain + unreferenced scaffold SVGs | ADR-119 | Q-17 | T-119e |
| LDG-13 | Sentry / PostHog activation | ADR-116 | Q-4 | T-116b, T-116c |
| LDG-14 | Admin-authority predicate alignment (3 divergent predicates) | ADR-115 | Q-10 | T-115c |
| LDG-15 † | **Conditional** — `APP_ID` data repartition | ADR-118 | Opened *only if* the pre-release comparison shows the two env vars disagree | T-118b |

† T-118b's own acceptance criteria already require a ledger row "noting that production agreement is verified by Q-6 before the old variable retires," and its regression scope names the tenant-root split as *both the failure mode being eliminated and the risk of the change itself*. LDG-15 is that row. If the two values agree in the deployed environment the change is inert; if they differ, unifying them repoints one package at a different `artifacts/{APP_ID}` root, which is a data migration rather than a config cleanup. Which world is real cannot be read from the repo (Q-1/Q-6). See `10-Release-Plan.md` §3.3 (6).

**LDG-01 note.** T-108e's entire deliverable *is* the LDG-01 row — the one task in this plan whose output is a ledger entry rather than a code change.

`LDG-nn` is a **proposed** key scheme; T-120a owns the final ledger format. If it chooses another, the `Ledger` column in §3 is the single place that changes.

### 2.4 The ledger's own health is tracked

ADR-120's success criteria are testable, and their regression is a health signal (§6):

- Every gated disposition has a row with all four fields; a row missing an owner or a review-by date is a defect on creation.
- No `@deprecated` field or "reconcile later" comment exists without a corresponding ledger row naming its removal condition (T-120b acceptance criterion).
- The docs ADR index lists every ADR on disk (T-120c).
- New staged work adds a ledger row **as part of the change that lands it** — not afterwards (T-120a acceptance criterion).

---

## 3. Progress table

**All 63 tasks from `01-Validated-Backlog.md`**, aligned to it exactly — IDs, waves, sizes, gates, statuses. Pre-filled and usable on day one.

**Columns.** `Sz` size (S ≤1d · M 2–4d · L 5–8d; XL disallowed) · `Sprint` from the sprint plan · `Status` 01's value, then the execution states · `Gate` the blocking question · `FB` fallback shape for gated rows (**E** executable · **I** inaction, §1.2) · `Ledger` the row this task advances · `PR` · `Done` date.

**The `Sprint` column is deliberately blank.** Sprint assignment is owned by the sprint plan (`03`) and filled in here at wave kickoff. Pre-filling it would create a second source of sprint truth — the duplication ADR-120 exists to prevent. Task titles are abbreviated; 01 owns the canonical wording, description, acceptance criteria, regression scope and rollback path for every row.

### Wave 1 — Platform Foundations · 14 tasks · 14 Ready / 0 Gated

*Releasable outcome: boundaries lint-enforced, config single-sourced, cycle broken, ledger live.*

| ID | W | Sz | Task | Sprint | Status | Gate | FB | Ledger | PR | Done |
|---|---|---|---|---|---|---|---|---|---|---|
| T-120a | 1 | S | Create the in-repo migration ledger | | Ready | — | | *creates all* | | |
| T-120b | 1 | M | Backfill ledger entries for in-flight staged work | | Ready | — | | LDG-01…14 | | |
| T-120c | 1 | S | Fix docs ADR index omission + ADR process note | | Ready | — | | — | | |
| T-118a | 1 | M | One module owns the public-path allowlist | | Ready | — | | — | | |
| T-118b | 1 | M | One `APP_ID` derivation across app + functions | | Ready | — | | LDG-15 † | | |
| T-118c | 1 | S | `.env.example` for the ~30 referenced env vars | | Ready | — | | — | | |
| T-101a | 1 | M | Root barrels as public API, all 9 features | | Ready | — | | — | | |
| T-101b | 1 | **L** | Migrate the 43 deep-import sites onto barrels | | Ready | — | | — | | |
| T-101c | 1 | S | ESLint import-boundary rule → `error` (+ UR-4 count fix) | | Ready | — | | — | | |
| T-103a | 1 | S | Relocate admin log types; remove the lib back-edge | | Ready | — | | — | | |
| T-103b | 1 | S | Extend boundary lint: forbid `lib → features` | | Ready | — | | — | | |
| T-102a | 1 | M | Notifications injection/registry seam | | Ready | — | | — | | |
| T-102b | 1 | M | Rewire `InviteActions` onto the seam | | Ready | — | | — | | |
| T-102c | 1 | S | Lint rule: no `notifications → flashcard` | | Ready | — | | — | | |

### Wave 2 — Safety Net · 8 tasks · 6 Ready / 2 Gated

*Releasable outcome: high-risk logic under test; failures reported, not swallowed.*

| ID | W | Sz | Task | Sprint | Status | Gate | FB | Ledger | PR | Done |
|---|---|---|---|---|---|---|---|---|---|---|
| T-117a | 2 | M | Unit tests — SRS math (`domain/srs`) | | Ready | — | | — | | |
| T-117b | 2 | M | Unit tests — sharing-RBAC `resolveRole` ‖ | | Ready | — | | — | | |
| T-117c | 2 | **L** | Tests — flashcard data services | | Ready | — | | — | | |
| T-117d | 2 | **L** | Rules-suite coverage for uncovered collections | | Ready | — | | — | | |
| T-117e | 2 | **L** | Baseline coverage — ai, game, home, command-palette | | Ready | — | | — | | |
| T-116a | 2 | **L** | Report-then-handle at the 17 swallow sites | | Ready | — | | — | | |
| T-116b | 2 | S | Activate Sentry | | **Gated** | Q-4 ‡ | **E** | LDG-13 | | |
| T-116c | 2 | S | Activate PostHog | | **Gated** | Q-4 ‡ | **E** | LDG-13 | | |

‖ T-117b must complete **before T-115a** — 01 states ADR-117 names `resolveRole` a test-floor priority precisely so the T-115a convergence lands against a net, and its acceptance criteria require asserting the `ownerId ?? userId` owner semantics as the behavioral oracle for that convergence.

‡ **Q-4 has no owner row in `07-Open-Questions.md`** — see §5.2. It is the one gate at risk of being nobody's job.

### Wave 3 — Security & Data Layer · 10 tasks · 9 Ready / 1 Gated

*Releasable outcome: httpOnly session, bounded queries, honest UI.*

| ID | W | Sz | Task | Sprint | Status | Gate | FB | Ledger | PR | Done |
|---|---|---|---|---|---|---|---|---|---|---|
| T-107a | 3 | **L** | httpOnly session issuance + server verification | | Ready | — | | — | | |
| T-107b | 3 | M | Migrate client auth off the raw ID-token cookie | | Ready | — | | — | | |
| T-107c | 3 | S | Cookie lifetime; edge gate routing-only by contract | | Ready | — | | — | | |
| T-107d | 3 | M | E2E auth regression across protected/public routes | | Ready | — | | — | | |
| T-113a | 3 | **L** | Centralize `useUserProgress` (10 mounts → 1 listener) | | Ready | — | | — | | |
| T-113b | 3 | M | Audit + centralize remaining per-mount listeners | | Ready | — | | — | | |
| T-114a | 3 | M | Explicit bounds on unbounded listeners | | Ready | — | | — | | |
| T-114b | 3 | M | Dashboard: absent-data rendering, not fabricated zeros | | Ready | — | | — | | |
| T-114c | 3 | S | Export rows: absent-data semantics | | Ready | — | | — | | |
| T-114d | 3 | M | `analytics_daily` / counters: remove reads or define writer | | **Gated** | Q-9 | **E** | LDG-06 | | |

### Wave 4 — Contracts & Convergence · 12 tasks · 8 Ready / 4 Gated

*Releasable outcome: validated writes, one action client, no inline predicates.*

| ID | W | Sz | Task | Sprint | Status | Gate | FB | Ledger | PR | Done |
|---|---|---|---|---|---|---|---|---|---|---|
| T-109a | 4 | **L** | Audit + wire zod at every server write boundary | | Ready | — | | — | | |
| T-109b | 4 | M | `cardContentSchema`: enforce or delete | | **Gated** | Q-12 | **E** | LDG-02 | | |
| T-109c | 4 | S | `privacyModeSchema`: enforce or delete | | **Gated** | Q-12 | **E** | LDG-03 | | |
| T-109d | 4 | S | `publicRoleSchema`: enforce or delete | | **Gated** | Q-12 | **E** | LDG-04 | | |
| T-109e | 4 | M | Standardize multi-field forms on RHF + zodResolver | | Ready | — | | — | | |
| T-115a | 4 | **L** | Converge the 5 inline deck-access predicates **+ `ShareModal` split** | | Ready | — | | — | | |
| T-115b | 4 | M | Automate the vocabulary-agreement check § | | Ready | — | | — | | |
| T-115c | 4 | M | Align the 3 divergent admin-authority predicates | | **Gated** | Q-10 | **I** | LDG-14 | | |
| T-106a | 4 | **L** | Unified verified-identity action client | | Ready | — | | — | | |
| T-106b | 4 | **L** | Migrate `adminActionClient` call sites | | Ready | — | | — | | |
| T-106c | 4 | M | Migrate idToken bind-arg `actionClient` call sites | | Ready | — | | — | | |
| T-106d | 4 | S | Remove superseded client(s) + retire the compat shim | | Ready | — | | — | | |

§ **T-115b's notification target ships report-only.** 01 §5.4: T-115b builds the agreement check in Wave 4, but one of its targets is the notification union that T-108a widens in Wave 5 — a check that is red by design is the standards-decay pattern the whole decision set guards against. The mechanism lands in Wave 4 with the notification target in **report-only** mode and **flips to failing when T-108a lands**. Both tasks' acceptance criteria in 01 record the flip. Track it: a Wave-5 exit criterion (§4.2) confirms the flip happened.

### Wave 5 — Migration Completion · 10 tasks · 2 Ready / 8 Gated

*Releasable outcome: notification migration closed, dead surfaces resolved.*

**Expected to read NOT READY until its questions answer.** Eight of ten are gated; four of those have an *inaction* fallback, meaning no effort advances them without an external answer. 01 §4.3 states this plainly rather than presenting it as readiness.

| ID | W | Sz | Task | Sprint | Status | Gate | FB | Ledger | PR | Done |
|---|---|---|---|---|---|---|---|---|---|---|
| T-108a | 5 | S | Widen `NotificationType` to the 10 written values | | Ready ¶ | — | | — | | |
| T-108b | 5 | M | Verify/complete the index + rules deployment | | **Gated** | NQ-1 | **I** | LDG-01 | | |
| T-108c | 5 | M | Legacy-data verdict: 4 `@deprecated` fields | | **Gated** | Q-5 | **I** | LDG-01 | | |
| T-108d | 5 | **L** | Collapse dual read paths + dual indexes to one | | **Gated** | Q-5 | **I** | LDG-01 | | |
| T-108e | 5 | S | Ledger entry: migration end state + current stage | | Ready | — | | LDG-01 | | |
| T-119a | 5 | M | 7 dormant `NotificationKind`s: delete or complete | | **Gated** | Q-8 | **E** | LDG-08 | | |
| T-119b | 5 | M | 8 `ActivityAction`s + `cloud_function` LogSource | | **Gated** | Q-11 | **E** | LDG-09 | | |
| T-119c | 5 | M | Handler-less admin buttons + Settings stub | | **Gated** | Q-13 | **E** | LDG-10 | | |
| T-119d | 5 | M | `fanOutNotifications` callable: delete or wire | | **Gated** | Q-6 | **E** | LDG-11 | | |
| T-119e | 5 | M | Storybook toolchain + scaffold SVGs: delete or adopt | | **Gated** | Q-17 | **E** | LDG-12 | | |

¶ **Ready, with the Q-7 default in force** — not "ungated". 01 §5.6: Q-7's standing default *is* "the union widens to the 10 written values," so the direction is pre-committed and an answer can only confirm it or trigger a named alternate. But Q-7 remains an open [INTENT] question in 07 Group A. Recorded this way so no reader concludes the question is closed.

### Wave 6 — Structure & Patterns · 8 tasks · 7 Ready / 1 Gated

*Releasable outcome: placement parity, one dialog pattern, one table engine.* Last because these moves cause the widest merge conflicts and need a quiet codebase.

| ID | W | Sz | Task | Sprint | Status | Gate | FB | Ledger | PR | Done |
|---|---|---|---|---|---|---|---|---|---|---|
| T-105a | 6 | M | Relocate kana-survival to `features/kana/survival/` | | Ready | — | | — | | |
| T-105b | 6 | M | Route-layer audit: `_components` orchestrator-only | | Ready | — | | — | | |
| T-104a | 6 | **L** | Flashcard sub-module boundaries + internal barrels | | Ready | — | | — | | |
| T-104b | 6 | S | Enforce flashcard internal boundaries via lint | | Ready | — | | — | | |
| T-110a | 6 | S | Converge the straggler backdrops onto DialogChrome ¤ | | Ready | — | | — | | |
| T-110b | 6 | M | `Drawer`: delete, or adopt with both bespoke panels | | **Gated** | NQ-3 ◊ | **E** | LDG-05 | | |
| T-111a | 6 | **L** | Migrate Reports onto the shared react-table engine ¤ | | Ready | — | | — | | |
| T-112a | 6 | S | Codify the two pagination mechanisms + review gate | | Ready | — | | — | | |

¤ The raw-hex token cleanup (38 occurrences / 29 files, charts carve-out excepted) rides along with these two — 01 §2.1 M-6.

◊ **NQ-3 is closed, not open.** 07 §0 lists it under *Closed — RESOLVED-BY-DECISION*, default = delete, with an owner-veto note; the kernel alone still marks T-110b gated, and 01 §5.3 identifies this as the lone inconsistency among the five resolved-by-decision questions. Kept at 01's status, annotated as a **veto window rather than a blocker** — practically Ready-on-default, and it cannot stall.

### Unscheduled

| ID | W | Sz | Task | Sprint | Status | Gate | FB | Ledger | PR | Done |
|---|---|---|---|---|---|---|---|---|---|---|
| T-118d | — | — | Hosting / deployment target decision → new ADR | — | **Open** | Q-2 | | LDG-07 | | |

### Roll-up counter

Recomputed at every sprint review. Day-one values match `01` §4.1 and §4.3 exactly.

| Wave | Tasks | Ready | Gated | Open | In prog | In rev | Done | Sizes (S/M/L) |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 7 / 6 / 1 |
| 2 | 8 | 6 | 2 | 0 | 0 | 0 | 0 | 2 / 2 / 4 |
| 3 | 10 | 9 | 1 | 0 | 0 | 0 | 0 | 2 / 6 / 2 |
| 4 | 12 | 8 | 4 | 0 | 0 | 0 | 0 | 3 / 5 / 4 |
| 5 | 10 | 2 | **8** | 0 | 0 | 0 | 0 | 2 / 7 / 1 |
| 6 | 8 | 7 | 1 | 0 | 0 | 0 | 0 | 3 / 3 / 2 |
| — | 1 | 0 | 0 | 1 | 0 | 0 | 0 | — |
| **Total** | **63** | **46** | **16** | **1** | 0 | 0 | 0 | **19 / 29 / 14** |

**Gated fallback split:** 12 executable · 4 inaction (T-115c, T-108b, T-108c, T-108d).
**Gates by question:** Q-12 → 3 · Q-5 → 2 · Q-4 → 2 · Q-6, Q-8, Q-9, Q-10, Q-11, Q-13, Q-17, NQ-1, NQ-3 → 1 each.
**Nominal effort at team size 1:** ≈ 147–247 developer-days (01 §4.2). Sprint packing and buffer belong to `03`; this figure is only the raw sum implied by the sizes.

---

## 4. Wave-level completion criteria

**`02` owns the canonical exit criteria.** This section mirrors them for tracking use. **If the two diverge, `02` wins.**

### 4.1 The five conditions every wave must meet

1. **Every Ready task in the wave is Done.** Gated tasks are either Done, or carry a live ledger row with an owner and an unexpired review-by date. A wave never closes with a gated task in limbo and no ledger row.
2. **The wave ships as a release** (`10-Release-Plan.md`) — or its release is explicitly deferred with a recorded reason. "Independently releasable" is only true if release is actually attempted.
3. **The wave ends deployable** (kernel standing rule). No half-migrated boundary, no partially-converged client, no broken gate. Specifically: no wave ends with T-101b partly migrated, T-106 partly cut over, or a lint rule left at `warn`.
4. **All five test suites pass** at the wave boundary, not just the tiers each PR touched.
5. **The ledger is current**: every row this wave touched has moved, and every row created this wave has all four fields.

### 4.2 Per-wave criteria

| Wave | Done when… | Traces to |
|---|---|---|
| **1** | The ledger exists in-repo with all fourteen initial rows populated (four fields each) and is discoverable from the docs index · the docs ADR index lists every ADR on disk and the ADR-vs-ledger process note is written · one module owns the public-path allowlist, both proxy and AuthGate consume it, **and the reconciliation of the two currently-unequal sets is recorded as an explicit adjudication** · one `APP_ID` derivation, verified identical across both packages under the emulator suite · `.env.example` documents the ~30 vars with each one's observable degradation, no secrets · all 9 features expose a curated root barrel · external import sites into `flashcard/types` = **0** (was 43) and the boundary rule is at `error` with a message naming ADR-101 · a search of `lib/` for `@/features` matches only `lib/providers.tsx` · a search of `features/notifications/` for other features returns **zero**, with invite accept **and** decline working through the seam · the stale `eslint.config.mjs` count comment corrected to 44 or removed | ADR-120, ADR-118, ADR-101, ADR-103, ADR-102; 01 M-7 |
| **2** | SRS math, `resolveRole` and the flashcard data services carry direct tests that **discriminate** (a deliberate off-by-one fails at least one test) · the four zero-coverage features no longer exist as a category · every collection with a `firestore.rules` block appears in the rules suite with both allow and deny cases · report-less swallows on real-state writes = **0** (was 17), with at least one non-boundary layer reporting and no primary flow gaining a new blocking failure · Sentry and PostHog are **decided and recorded** against Q-4 — live, or deferred with the reason and review-by in LDG-13. **An undecided state is a failure of T-116b/c**, not a deferral of them | ADR-117 floors, ADR-116; 01 T-116b/c AC |
| **3** | The session cookie carries `HttpOnly` and the non-httpOnly rationale comment is gone · a forged or absent credential is rejected **by verification**, not by presence · the session lifecycle is complete (mint, refresh, revoke — with revoke actually invalidating server-side) · no client code reads the credential from `document.cookie` · the stale-cookie "loads-but-fails" state is unreachable and the edge gate's routing-UX-only role is documented in-code · N components reading one user's progress open **one** listener · every listener carries an explicit bound · no dashboard or export surface renders a fabricated zero · the E2E route matrix is driven by T-118a's single allowlist | ADR-107 SC, ADR-113, ADR-114 |
| **4** | Every server write path validates at its boundary · multi-field forms use RHF + zodResolver · no schema remains declared-but-unenforced (each of the three wired or deleted, or carrying a live ledger row) · zero inline re-derivations of the deck-access predicate remain, **including the divergent `isOwner`**, with `ShareModal.tsx` split under the CS-2 ceiling as part of T-115a · the vocabulary-agreement check runs in CI, failing on divergence for its live targets and **report-only for the notification target** · one action client serves both write families, the superseded client(s) and the `toActionResult` shim are gone | ADR-109, ADR-115, ADR-106; 01 M-2, M-5, §5.4 |
| **5** | `NotificationType` enumerates the 10 stored values and a deliberately non-exhaustive switch **fails typecheck** · **T-115b's notification target has flipped from report-only to failing** · LDG-01 carries the migration's end state, current stage, owner and review-by · **and, only once Q-5/NQ-1 answer:** one document shape, one query path, one index set, no `@deprecated` fields, no legacy fallback, no backfill script in-tree · every dead-surface gate has either executed its default or recorded a claim | ADR-108 SC, ADR-119; 01 §5.4 |
| **6** | Kana-survival sits in `features/kana/survival/` · remaining `_components` are orchestrators and shell chrome only · flashcard sub-module boundaries are lint-enforced · one dialog pattern with two sanctioned tiers, both straggler backdrops converged · Reports runs on the shared react-table engine with real engine semantics · both pagination mechanisms codified with a review gate against a third · the raw-hex tail is cleared (charts carve-out excepted) | ADR-105, ADR-104, ADR-110, ADR-111, ADR-112; 01 M-6 |

---

## 5. Question-resolution tracking

**Kernel rule 3: question-answering is scheduled work, not a wish.** Every wave containing gated tasks opens with a question-resolution item naming the questions it needs. Those items are tracked here as first-class rows.

### 5.1 The tracked questions

Ordered by **blocking-count**. Owner-class per `01` §4.3 and `07`: **[INTENT]** product owner / author · **[GCP]/[OPS]** console or deployment records · **[DATA]** live Firestore sample · **[ENV]** production environment config.

| Q | Owner-class | Blocks | Tasks gated | Needed by | Fallback in force (= what happens if unanswered) | FB | Status |
|---|---|---:|---|---|---|:--:|---|
| **Q-12** | [INTENT] author | **3** | T-109b, T-109c, T-109d | Wave 4 open | Per-schema: wire into the write path if adoption was intended, else delete. **No schema stays declared-but-unenforced.** | E | Not asked |
| **Q-4** ‡ | [GCP] + [INTENT] hybrid — **no owner row in 07** | **2** | T-116b, T-116c | Wave 2 open | Defer activation, leave the credential-gated wiring intact, **record the deferral and its reason in LDG-13**. Undecided is a task failure, not a deferral. | E | **Unassigned** |
| **Q-5** | [DATA] + [OPS] | **2** | T-108c, T-108d | Wave 5 open — **ask by Wave 3** | **Retain** all dual read paths, `@deprecated` fields, legacy indexes. Assumed load-bearing until a data sample proves otherwise. | **I** | Not asked |
| **Q-6** | [GCP] / [OPS] | 1 | T-119d | Wave 5 open | **Delete** the un-called callable unless an out-of-repo operator invocation is confirmed. | E | Not asked |
| **Q-8** | [INTENT] product | 1 | T-119a | Wave 5 open | **Delete** each unclaimed kind with its registry entry, schema weight and collapse logic. | E | Not asked |
| **Q-9** | [DATA] / [GCP] | 1 | T-114d | Wave 3 open | **Remove** the dead read paths and their zero-fabricating fallbacks. Honest UI is *outside* this gate — it is policy on both branches (T-114b/c). | E | Not asked |
| **Q-10** | [OPS] / [GCP] | 1 | T-115c | Wave 4 open | **No alignment yet** — the three predicates stay as-is until the live authority source is known. Aligning blind risks locking out or failing to lock out real admins. **The one gate whose default is inaction.** | **I** | Not asked |
| **Q-11** | [INTENT] product | 1 | T-119b | Wave 5 open | **Delete** unclaimed members; the kana-practice gap resolves in whichever direction the gate answers. | E | Not asked |
| **Q-13** | [INTENT] product | 1 | T-119c | Wave 5 open | **Delete** (behavior-neutral) unless claimed as pending. | E | Not asked |
| **Q-17** | [INTENT] author | 1 | T-119e | Wave 5 open | **Delete** toolchain + scaffold SVGs. 01 notes Q-17's own answerability is rated **Low** — under ADR-119 an undecidable gate resolves to the default. | E | Not asked |
| **NQ-1** | [OPS] / [GCP] | 1 | T-108b | Wave 5 open — **ask by Wave 3** | **Retain** dual indexes/queries/fields until the deploy state is confirmed. | **I** | Not asked |
| **NQ-3** ◊ | [INTENT] — **closed** | 1 | T-110b | Wave 6 open | **Delete** `Drawer`, per AD-10. Veto window, not a blocker. | E | Closed-by-decision |
| **Q-2** | Hosting decision (product + ops) | 1 (Open) | T-118d | **Wave 1 open** | `SITE_URL` localhost fallback persists. A decision to make, not a fact to find. | — | Not decided |
| **Q-7** ¶ | [INTENT] author | **0** — default executes | (T-108a proceeds) | Wave 5 open | Union **widens to the 10 written values**. Pre-committed; an answer can only confirm it or trigger the named alternate. | — | Open, default in force |
| **Q-1** | [GCP] + [ENV] | **0 direct / plan-wide** | — | **Wave 1 readiness** | Decision *directions* stand; their **production verification** waits on project identity. | — | Not asked |

### 5.2 Q-4 is an unassigned gate — track it as one

**`07-Open-Questions.md` has no row for Q-4.** The kernel gates T-116b/T-116c on it, `03-Architecture-Decisions.md` records ADR-116 as Accepted-conditional on it, and `06-Decision-Matrix.md` treats it as the live activation gate in four places (§1 AD-16, §2b rank 4, §3 OP-21, §4 C13). But none of 07's four open-question groups lists it; it survives only as an aside inside NQ-14's row ("couples to Q-4").

07's roll-up arithmetic is independently inconsistent: the section header reads **26**, the roll-up totals **25**, and the four non-minor groups sum to **25** with 7 minor gaps on top — **32**. The most likely reading is that Q-4 was the dropped 26th row.

**Consequence for tracking, and the reason this has its own section:** every other gate in §5.1 inherits an owner-class and an answer source from 07. Q-4 inherits nothing. Its class is **inferred** — [GCP] for credentials and project ownership, [INTENT] for the analytics scope — from ADR-116's own text, not from an owner row. **Wave 2's question-resolution item must name Q-4 explicitly and assign it a person, or it will be the one gate nobody is assigned to answer.** Tracked as `Unassigned` rather than `Not asked`, because the two failure modes differ: *not asked* has an owner waiting; *unassigned* does not.

### 5.3 Per-row required fields

Each row carries, in the working copy: **owner named** (a person, not a class) · **asked-on date** · **channel** (console access request, product conversation, data pull) · **chase count** · **answer-by target** · **the ledger row it releases**.

Answer-classes are not equal in effort. Everything in §5.1 is [INTENT], [GCP]/[OPS], or [DATA] — each needs one of the four external sources the discovery phase first named: **the production Firebase project, deployment records, live data, or author/product intent**. By 01's count: seven gated tasks turn on [INTENT], three on [GCP]/[OPS], three on [DATA], two on the Q-4 hybrid, one on a closed-by-decision veto. Most of the [INTENT] set resolves in a single conversation with one person.

### 5.4 The wave-opening ritual

Before any task in a new wave is picked up:

1. List the questions this wave's gated tasks need (§5.1, *Needed by*).
2. For each: answered? If not — who is being asked, through what channel, by when?
3. For each **executable**-fallback task: confirm the ledger row's review-by date, and confirm that executing the default at expiry is still acceptable.
4. For each **inaction**-fallback task: confirm it is **not** in the sprint. It cannot be worked; do not let it hold capacity.
5. Record the outcome. A wave that opens without this step has skipped kernel rule 3.

**Ask earlier than you need.** Q-5 and NQ-1 are needed in Wave 5 but should be asked by Wave 3 — a [DATA] sample and an [OPS] deploy check both have latency a wave boundary does not absorb. 01 §5.5 makes this sharper: the critical path terminates in **T-108d**, which is Q-5-gated, so Q-5's latency sits directly on the schedule's tail.

---

## 6. Health indicators

Leading signals that the plan is off-track — visible **before** a milestone is missed. Thresholds calibrated to one developer on two-week sprints.

### 6.1 Gate health — the plan's dominant failure mode

| Signal | Amber | Red | Why it matters |
|---|---|---|---|
| **Q-1 unanswered at Wave 1 close** | — | Immediately red | Kernel rule 4 places it in Wave 1's readiness. Production verification of six ADRs and three release units is blocked until it answers. |
| **Q-4 still unassigned after Wave 2 opens** | — | Immediately red | It has no owner row anywhere in the source corpus (§5.2). Unassigned gates do not age — they are simply never answered. |
| **Gated task age** — sprints in Gated with no owner contact logged | > 2 sprints | > 3 sprints | The exact mechanism that produced the debt this plan repairs: staged change, no recorded owner, no expiry, ageing quietly. |
| **Ledger row past review-by** | — | Any occurrence | Direct regression of an ADR-120 success criterion. An unmaintained ledger "is as misleading as a stale comment — the failure mode it exists to prevent." |
| **Ledger row missing owner or review-by** | — | Any occurrence | Invalid by T-120a's own format statement. |
| **Executable-fallback deferral count** | 1 | ≥ 2 | Delete-unless-claimed degrading into delete-never — *the* erosion signal for ADR-119. Two deferrals means the expiry mechanism is not firing. |
| **Zero questions answered across two consecutive sprints** | — | Any occurrence | Question-answering has stopped being scheduled work. Wave 5 (8 of 10 gated) becomes unreachable. |
| **Q-5 not asked by end of Wave 3** | — | Any occurrence | It gates the critical path's terminal task (01 §5.5) and needs a live data sample — the slowest answer class in the set. |

### 6.2 Schedule health

| Signal | Amber | Red |
|---|---|---|
| **Critical-path task over its size estimate** — the spine is T-120a → T-101a → T-101b → T-101c → T-102a → T-102b → [T-117a/b/c] → T-116a → T-107a → T-107b → T-106a → T-106b → T-109a → T-108a/d | > 1.5× | > 2× |
| **Sprint carryover** (planned Done, ended In progress / In review) | 1 task | ≥ 2 tasks |
| **Sprint exit criteria slipping** — a sprint ends with a boundary half-migrated, a client partly converged, or a lint rule left at `warn` | — | Any occurrence — violates "every sprint ends deployable" |
| **Wave bleed** — a Wave-N task still open when Wave N+1's first sprint starts | — | Any occurrence. Worst for Wave 6, whose entire rationale is *a quiet codebase*. |
| **An L task behaving like an XL after one full sprint** | — | Any occurrence. Fourteen L tasks exist (T-101b, T-117c/d/e, T-116a, T-107a, T-113a, T-109a, T-115a, T-106a/b, T-108d, T-104a, T-111a). XL is disallowed — split it. |
| **Cumulative effort tracking outside 147–247 dev-days** (01 §4.2) | ±20 % | ±40 % — the size estimates, not the plan, are wrong |

### 6.3 Quality health

| Signal | Amber | Red |
|---|---|---|
| **PR with no named applicable test tier** | — | Any occurrence — a readiness-rule violation shipping anyway |
| **Test suites not all green at a wave boundary** | — | Any occurrence |
| **Lint rule landed at `warn` instead of `error`** | — | Any occurrence. The corpus's own lesson: a 200-line ceiling with 44 standing violations taught contributors that lint output is noise. A boundary rule at `warn` is a documented convention — precisely what ADR-101 replaces. |
| **T-115b's notification target still failing-by-design in CI** | — | Any occurrence. A check red on purpose is the standards-decay pattern the set guards against; report-only until T-108a lands is the sanctioned state (01 §5.4). |
| **New deep-import site appearing after T-101c** | — | Any occurrence — the enforcement regressed |
| **New `@deprecated` marker or "reconcile later" comment with no ledger row** | — | Any occurrence — the C16 generator restarting |
| **A test written to match current buggy behavior** | — | Any occurrence. 01 flags this for T-117a, T-117b and T-117d specifically: a rules test matching a wrong rule certifies the wrong posture. |
| **Rework caused by a gate answer contradicting an executed default** | 1 | ≥ 2 — review-by dates are firing too early relative to answer latency |

### 6.4 The three signals worth watching hardest

1. **Q-1 ageing, and Q-4 unassigned.** Everything needing production verification stalls behind the first; the second has nobody to stall behind at all.
2. **Ledger rows past review-by.** The plan's highest-leverage decision failing inside the plan that implements it.
3. **New staged work landing without a ledger row.** The point was a structural fix, not per-instance patches. This signal says the fix did not take.

---

## 7. Cadence

### 7.1 Per-PR

| Check | Owner |
|---|---|
| Pre-commit gate: lint + format + full build | Automated |
| Named applicable test tiers green | Automated |
| 01's acceptance criteria demonstrated in the PR body (test output, search result with the stated count, lint failure-then-pass) | Author |
| **Ledger touch check** — does this PR advance a staged change? If so, its row's `current stage` moved in *this* PR | Author, verified at review |
| **New staged work check** — does this PR *create* staged work (a `@deprecated` marker, a "later step", a conditional path)? Then it adds a ledger row here, not later | Author, verified at review |
| Progress-table row updated: status, PR link, done-date | Author |

### 7.2 Per-sprint (every 2 weeks)

1. Reconcile the §3 table; recompute the roll-up.
2. **Question-resolution standup** — walk §5.1: asked, answered, needs chasing. Log every contact. Confirm Q-4 has a named owner.
3. Evaluate §6; record ambers and reds with an action, not just a colour.
4. Review carryover; if ≥ 2, ask whether the sizes are wrong or the gates are eating capacity.
5. Re-rate next sprint's readiness. Mark NOT READY where it is, plainly.
6. **Ledger review-by sweep for rows expiring within one sprint** — chase the answer, or let the default execute.

### 7.3 Per-wave

1. Verify wave completion criteria (§4) — the five universal conditions and the wave-specific ones.
2. Run all five suites at the boundary, not just the tiers each PR touched.
3. **Release decision** — ship the wave's release units (`10-Release-Plan.md`), or record why not.
4. **Full ledger review-by sweep.** Confirm owners are still correct.
5. Re-forecast remaining gates: which questions has elapsed time actually resolved, and which are drifting?
6. Wave-opening ritual for the next wave (§5.4).

### 7.4 Continuous / event-driven

| Trigger | Action |
|---|---|
| A question answers | Update §5.1 · move affected tasks off Gated · advance or close the ledger row · if the answer contradicts an already-executed default, log the rework under §6.3 |
| A ledger review-by date arrives | Execute the pre-committed default (executable fallback) or escalate the chase (inaction fallback). **Do not silently extend the date** — an extension is a decision, recorded as one, with a reason. |
| T-108a lands | Flip T-115b's notification target from report-only to failing (01 §5.4). Verify at the Wave 5 boundary. |
| An L task behaves like an XL | Split it — XL is disallowed. |
| A touched file crosses the CS-2 ceiling, or raw-hex tokens are found in a touched file | Fold into the owning task per 01 §2.1 and note it there. Never open a new task. |

---

## 8. Readiness honesty

Four statements this document will not soften:

1. **Wave 5 reads NOT READY today** and will keep reading NOT READY until Q-5, NQ-1, Q-6, Q-8, Q-11, Q-13 and Q-17 answer. Eight of ten tasks are gated; four have an *inaction* fallback and cannot be worked at all. The kernel anticipates this and instructs saying so rather than pretending readiness.
2. **The critical path terminates in a gated task.** It ends `… → T-109a → T-108a/d`, and **T-108d is Q-5-gated** (01 §5.5). The path cannot complete on in-repo work alone — it terminates on a live-data answer. Treat it as ending at T-108a with T-108d as a gate-bound tail, and open Q-5 early enough that the tail is not the schedule's blocker.
3. **Q-1 is unanswered, so production verification of this plan is blocked** — not the work, the *verification* of the work. Six ADRs' directions stand on repo-observable facts; their confirmation against a real environment does not. See `10-Release-Plan.md` §4.3.
4. **Q-4 is a real gate with no owner row in the source corpus** (§5.2), and `07`'s own question counts are internally inconsistent (header 26, roll-up 25, groups summing 32). Tracked as explicitly unassigned rather than inheriting the gap.

**Kernel errata, confirmed.** Per `01` §5.1 the task set is **63 tasks, not the "50" the kernel's heading claims** — a 26 % under-count that would badly distort sprint math if carried forward. All 63 are tracked above, split 46 Ready / 16 Gated / 1 Open.
