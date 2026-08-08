# 07 — Risk and Mitigation

**Phase 11 — Implementation Planning.** This document assesses the risk of **running this plan**. It is not a re-statement of the codebase's inherent risks — those are `architecture-assessment/08-Risk-Assessment.md` (R-1 … R-19) and are cited here only as context for what an execution failure would leave exposed.

- **Binding input:** the planning kernel. **Errata applied:** the kernel's heading says "50 tasks"; it enumerates **63** — 62 wave-assigned + T-118d unscheduled. **16 gated · 46 ready · 1 open.** Per-wave gated counts: W2 2 · W3 1 · W4 4 · W5 8 · W6 1.
- **Source of truth:** `architecture-decision/` — ADR-101 … ADR-120 (`03`), gates and answering-owner classes (`07-Open-Questions.md`), coverage caveats (`06-Decision-Matrix.md` §2a/§2b/§5), CS-1 … CS-14 (`04`), NS-1 … NS-8 (`05`).
- **Sprint references (S1 … S29)** point at `03-Sprint-Plan.md`, the authoritative 29-sprint decomposition. Task-level acceptance criteria, regression scope and rollback are `01-Validated-Backlog.md`'s; wave-level entry/exit criteria are `02-Execution-Waves.md`'s. This file does not restate them — it names what could go wrong while executing them.
- **Honest labeling.** This is derived-from-decisions planning, not backlog validation. `engineering-tasks/` and `requirements-consolidation/` do not exist; no requirement-ID or recommendation-ID is cited anywhere below, and none should be invented to make a risk look better sourced than it is.
- **ID scheme:** execution risks are **X-1 … X-14**, deliberately distinct from the corpus's R-n so the two are never confused in review.

---

## 1. Execution-risk matrix (likelihood × impact)

Likelihood is *over the life of the program* (29 sprints ≈ 58 weeks at team size 1). Impact is measured against the plan, not against the running system: "High" means the program stalls, ships a half-state, or loses a wave of work.

| ↓ Impact \ Likelihood → | **Low** | **Medium** | **High** |
|---|---|---|---|
| **High** | X-6 (auth cutover lockout) | X-1 (sole developer unavailable), X-2 (dual-state windows), X-4 (safety net slips), X-7 (regression in untested areas) | **X-8 (no production to verify against)**, **X-14 (critical path ends in a gated task)** |
| **Medium** | X-5 (Wave 6 merge conflicts) | X-9 (late gate answer contradicts executed default), X-11 (emulator/JDK topology) | X-3 (gates never answer), X-12 (estimate drift), **X-13 (Q-4 has no owner)** |
| **Low** | — | X-10 (lint-flip backlog) | — |

**Ranked (highest concern first):**

| # | ID | Execution risk | L / I |
|---:|---|---|---|
| 1 | **X-8** | Verification without production — Q-1 unanswered means nothing is checkable against the real environment | High / High |
| 2 | **X-14** | The critical path terminates in T-108d, which is gated on Q-5 — the program **cannot fully complete on in-repo work alone** | High / High |
| 3 | **X-3** | Gated tasks never get answers; ADR defaults become permanent by attrition | High / Med |
| 4 | **X-1** | Bus factor 1 — the single developer is unavailable mid-program | Med / High |
| 5 | **X-4** | Wave 2 slips; Wave 4 proceeds without the safety net it was scheduled to build | Med / High |
| 6 | **X-2** | Mid-migration dual-state windows (T-106b/c write paths, T-108c/d notifications) | Med / High |
| 7 | **X-7** | Regression in the untested areas the plan touches | Med / High |
| 8 | **X-13** | **Q-4 gates two tasks but has no owner row in the open-questions register** — an unassigned gate is a gate nobody answers | High / Med |
| 9 | **X-6** | Auth cutover T-107 — user-visible credential change; failure mode is lockout | Low / High |
| 10 | **X-12** | Estimate drift — ADR-derived sizing with no calibration baseline over ~58 weeks | High / Med |
| 11 | **X-11** | Emulator/JDK test topology blocks the tiers Waves 2–3 depend on | Med / Med |
| 12 | **X-9** | A gate answers late and contradicts a default already executed (irreversible deletions) | Med / Med |
| 13 | **X-5** | Wave 6 placement moves collide with in-flight work | Low / Med |
| 14 | **X-10** | Flipping boundary lint to `error` creates a blocking backlog on the pre-commit gate | Med / Low |

**Structural observation that shapes the whole table.** Seven of the sixteen gates — **Q-1, Q-4, Q-5, Q-6, Q-9, Q-10, NQ-1** — cannot be answered without a provisioned production Firebase project. `architecture-assessment/08` opens by stating this is a *pre-deployment* codebase (no `.firebaserc`, no `hosting` block, demo-only project IDs, R-13/D-5), and `07-Open-Questions.md` records Q-2 as "a decision to make, not a fact to find." **X-8, X-14 and X-3 are therefore one root risk viewed three times**, and all three are downstream of a single item the kernel marks *not schedulable*: **T-118d (hosting/deployment target)**. That coupling is `08` §5's first pre-flight item.

---

## 2. The execution risks

### X-1 — Bus factor 1: the single developer is unavailable mid-program

- **Risk.** The plan is sized for one person (kernel planning assumption; corpus R-12/W-6: all 140 commits, one author, one email). A 29-sprint program has no second executor, no reviewer, and no continuity owner. Unavailability at any point stops the program outright — it does not slow it.
- **Trigger.** Illness, job change, competing priority, or attrition over ~58 weeks. Also triggered *silently* by the sole developer being the same person who must answer the `[INTENT]` gates (Q-8/Q-11/Q-12/Q-13/Q-17) — one absence stalls both execution and gate resolution.
- **Impact on the plan.** Whatever wave is in flight freezes at its current state. If the freeze lands inside S11 (auth cutover), S15–S17 (action-client convergence) or S21–S23 (notification migration), the system sits in one of the dual-state windows X-2 describes, with nobody holding the context needed to finish or roll back. All in-flight knowledge not in the ledger is lost — precisely the failure mode ADR-120 exists to prevent.
- **Likelihood.** **Medium.** Short absences over 58 weeks are near-certain; an absence long enough to freeze a wave is Medium.
- **Mitigation already built into the plan.**
  - **Wave 1 is about legibility and it is first.** **S1** lands the migration ledger *and backfills it* (T-120a + T-120b in the same sprint) with mandatory *intended end state / current stage / owner / review-by* fields — so the program's own state is readable from the repo rather than from one person's memory (ADR-120 consequence: "a future maintainer, or the sole author after time away, can answer *is this still intended?* from the repo").
  - **S2 lands `.env.example`** (T-118c) covering the ~30 referenced env vars — the onboarding artifact `06-Decision-Matrix.md` §2b names in R-12's mitigation set, and which `03-Sprint-Plan.md` calls "a direct mitigation of the bus-factor-1 amplifier."
  - **Wave 2 (S5–S9) before Wave 4** converts the highest-risk logic into executable knowledge (ADR-117): SRS math, `resolveRole`, flashcard data services. Tests are the handover document that survives the author.
  - **Every sprint ends deployable**, so an absence lands between shippable states, never on a half-shipped boundary.
  - **The plan uses "isolation sprints"** (S3, S6, S7, S8, S10, S12, S15, S16, S18, S19, S23, S27, S29) — a single L task, alone. These are the cleanest possible resume points for a returning or successor developer.
- **Residual risk.** **Material and not removable.** `06-Decision-Matrix.md` §2b is explicit: R-12 is "**⚠ Mitigated only** — not architecturally resolvable," and §5 repeats "No decision claims to fix bus-factor-of-one." The ledger records *state*, not *capability*: a successor still needs Firestore-data-model, security-rules, Cloud-Functions and emulator-topology competence, none of which the plan transfers. The out-of-band rituals (R-8 admin bootstrap, R-13 deploy) stay undocumented because their answers are gated (Q-10, Q-2).
- **Contingency.** (1) Treat the ledger as the handover artifact and require it current at every sprint boundary — a sprint that ends without its ledger rows updated has not ended. (2) Never begin **S11, S17 or S23** without the whole sprint's capacity available; these are the three sprints where an absence is most expensive. (3) If unavailability is foreseen, stop at a sprint boundary; the deployable-per-sprint rule makes this safe. (4) If a second developer becomes available, each sprint's parallel-opportunity note says what to hand over — but note this *raises* X-5.

---

### X-2 — Mid-migration dual-state windows: the write-path and notification convergences

- **Risk.** Two convergences necessarily pass through states where two mechanisms are live at once and the system is correct only if *both* are: the **action-client convergence** (S15 → S17: the unified client is built, then `adminActionClient` call sites migrate, then idToken bind-arg `actionClient` call sites migrate, then the superseded clients are removed) and the **notification migration** (S21 → S23: union widened, then `@deprecated` fields dispositioned, then dual read paths and dual indexes collapsed). A partially-converged write path means two verification implementations differ on the same request class; a partially-collapsed read path means pre-migration notifications become invisible to users.
- **Trigger.** A task estimated M/L overrunning; an interrupt (X-1) landing mid-window; or T-106d (removal of the superseded client) being pulled forward before both migrations complete.
- **Impact on the plan.** The plan's core promise — *every sprint ends deployable* — is what makes this program safe to run for a single developer with no CI/CD rollback story (R-13). _(Correction 2026-08-04: "no CI/CD" is false — see the correction under §4 standing contingency 1. CI predates this corpus.)_ Breaking it once converts the program from "a sequence of independently shippable increments" into "a long-lived branch," the shape that historically fails. For the notification half the specific consequence is named in ADR-108's rejected alternative 3: cleaning up the dual read path without confirming the backfill ran "would silently hide pre-migration notifications from users" (RC-3).
- **Likelihood.** **Medium.** T-106b alone is an L touching ~30 actions' plumbing plus their hooks and the `toActionResult` bridge (ADR-106 trade-offs).
- **Mitigation already built into the plan.**
  - **The write-path dual-state is deliberately *safe*, not merely short.** S15 builds the unified client additively (both legacy clients keep working). S16 migrates the admin call sites. S17 migrates the remaining call sites **and only then** removes the superseded clients (T-106d). `02-Execution-Waves.md` marks this ordering **non-negotiable**: "removing a superseded client while any call site still uses it breaks the build." Every intermediate sprint is deployable because the old clients are still present and functional — the dual state is the *designed* resting condition, and the build itself enforces that removal comes last.
  - **The removal is the forcing function.** T-106d cannot land until T-106b and T-106c both have, so "we'll finish the migration later" is not reachable without leaving a visible, ledger-recorded incomplete convergence.
  - **The notification convergence is gated before it is scheduled.** T-108c (S22) and T-108d (S23) are both `[GATED Q-5]`, and they follow S21's ungated half (T-108a union widening, T-108e ledger entry). **NS-8** is the standing rule: *nothing legacy-compatible is stripped before its gate answers*. S23 either runs whole or does not run, and S21's state — widened union, dual machinery intact and **recorded in the ledger as gated-for-removal** — is a coherent shipped state.
  - **T-108e is scheduled in S21, before the removal sprints**, so the dual state is a tracked row rather than an unrecorded assumption (ADR-120 success criterion: no `@deprecated` field exists without a ledger entry naming its removal condition).
  - **The auth cutover uses the same additive/cutover seam** — see X-6.
- **Residual risk.** S17 carries T-106c + T-106d + T-115b (7 d) and is the sprint where an overrun has the widest consequence, because T-106d's removal is what closes the window. S23's risk is not sequencing but *data*: even a perfectly executed S23 is safe only if Q-5's answer is accurate, and Q-5 is answered from a live data sample that may be a partial view.
- **Contingency.** (1) If T-106c is not complete by day 6 of S17, defer T-106d rather than rushing it — a longer dual state is strictly safer than a premature removal. (2) Before S23, take a documented Firestore export of the notification collections; the collapse is code-reversible but a mistaken read-path collapse over legacy documents is only diagnosable if the pre-state was recorded. (3) If Q-5 answers "legacy documents present," the default (retain) stands and S23 does not run — a success of the gate, not a failure of the plan.

---

### X-3 — Gated tasks never get answers; the ADR defaults become permanent by attrition

- **Risk.** Sixteen tasks are `[GATED]` across twelve questions. The kernel's rule is that a gated task carries a defined fallback and the ADR default applies; the risk is not that the defaults are wrong but that **"default in force while the gate is open" silently becomes "default forever,"** reproducing the exact meta-failure the decision set was built to end (C16 / RC-2/3/5/6/7/10: staged work whose completion state nobody records). The plan would then have replaced one permanent-transitional state with a better-documented one.
- **Trigger.** No production project exists to inspect (X-8) for **Q-4, Q-5, Q-6, Q-9, Q-10, NQ-1**; and no forcing function compels the product owner to rule on **Q-8, Q-11, Q-12, Q-13, Q-17**. Both triggers are the current state, not a projection.
- **Impact on the plan, per gate, and what the default costs:**

| Gate | Tasks it blocks | ADR default in force | What running on the default costs |
|---|---|---|---|
| **Q-4** (observability credentials/ownership) | T-116b, T-116c (S9) | Activation deferred; **report-then-handle lands unconditionally** (ADR-116's policy leg is Accepted, not conditional) | The 17 swallow sites report into the in-repo pipeline, but production errors still reach nobody. R-6 (rank 4) is structurally addressed and operationally still dark; D-1 stays unknown. The plan ships the plumbing and not the alarm. **See X-13 — this gate has no owner row at all.** |
| **Q-5** (+ NQ-1) (live notification data / deploy currency) | T-108c (S22), T-108d (S23); T-108b (S21) | **Retain** all dual read paths, `@deprecated` fields and legacy indexes | TD-1 — the corpus's **#1-ranked debt (score 8)** — is not closed. The union widens (T-108a is ungated, so the type stops lying) but the cleanup does not land. **This is also X-14: T-108d is the critical path's terminal node.** |
| **Q-8 / Q-11 / Q-13 / Q-17** (dormant kinds, actions, admin surfaces, Storybook) | T-119a, T-119b (S24); T-119c, T-119e (S25) | **Delete-unless-claimed** | The default is *action*, not paralysis — these execute on the default. The cost is one-directional: a deletion against an unanswered `[INTENT]` gate destroys a roadmap item nobody wrote down (X-9). The kana-practice logging gap (Q-11) is a *provable* omission and must not be deleted blind. |
| **Q-6** (Functions deployed / fan-out invoked) | T-119d (S22) | **Delete** the un-called fan-out | ⚠ CS-3 names `fanOutNotifications` as its example of *acceptable* forward-provisioning — it self-documents why it exists and how it activates. `01-Validated-Backlog.md` is blunt that **the gate, not the comment, decides**, but this default deserves more scrutiny than the other four deletions. |
| **Q-9** (analytics writer) | T-114d (S14) | **Honest-UI default: no fabricated zeros.** Read paths removed if no writer exists | T-114b/T-114c ship regardless, so dashboards stop lying either way. The residue is that `analytics_daily` / `metadata/counters` read paths either linger with nothing behind them, or are removed without confirming an external writer does not exist — which ADR-114's rejected alternative warns "could sever a live external contract." |
| **Q-12** (schema intent + prod data compatibility) | T-109b, T-109c, T-109d (S20) | **Per-schema enforce-or-delete** — no schema stays declared-but-unenforced | The rule (CS-13) lands via T-109a/T-109e regardless. Without Q-12 the three named schemas sit in a documented "pending disposition" state — exactly what ADR-109 tried to end. TD-5's cost-of-delay is explicit: "**deferral converts a code fix into a data migration**." **This is the gate whose cost grows with time.** |
| **Q-10** (admin authority source) | T-115c (S21) | **No alignment** — the three divergent admin predicates stay as-is | R-8 (risk rank 7) stays unresolved. T-115a (S18, the five inline deck-access predicates) is ungated and ships, so ADR-115's P1 half lands; the P2 admin half does not. `03-Sprint-Plan.md`: "Shipping a guess here is the one outcome ADR-115 forbids." |
| **NQ-3** (Drawer) | T-110b (S28) | **Delete** | Lowest cost of any gate — and `07-Open-Questions.md` §0 records NQ-3 as **closed — resolved-by-decision**, so this gate is arguably already answered (`08` §6, incoherence 3). |

- **Likelihood.** **High** for the production-dependent cluster (Q-4/Q-5/Q-6/Q-9/Q-10/NQ-1) — unanswerable *by construction* until the app is deployed. **Medium** for the `[INTENT]` cluster, and lower than it looks, because the sole developer is plausibly also the product owner: these need a decision, not an investigation.
- **Mitigation already built into the plan.**
  - **Gate-handling rule 3 is a scheduling rule, not a hope:** every wave containing gated tasks opens with a question-resolution item naming the questions it needs. `03-Sprint-Plan.md` implements this and goes further — **S1 opens Q-1, Q-4 and Q-2** (Q-4 eight sprints before it bites, precisely because it has no owner row anywhere else — X-13); **S19 raises** Q-5, Q-6, Q-8, Q-11, Q-13, Q-17 and **S21 formally opens** them, giving the `[INTENT]` cluster maximum lead time.
  - **Gate-heavy work is scheduled late** (Wave 5, S21–S25), so answers have ~20 sprints to arrive.
  - **Every gated task carries a pre-committed fallback** — `07-Open-Questions.md`'s standing-defaults summary — so an unanswered gate produces a *decided* outcome, never a stall.
  - **ADR-120's ledger is the anti-attrition mechanism**: a review-by date and an owner on every gated disposition, and no `@deprecated` field or "reconcile later" comment without a row. A default that outlives its review-by date becomes visible instead of invisible.
- **Residual risk.** The ledger makes a stalled gate *visible*; it does not make it *answerable*. ADR-120's own trade-off is blunt: "an unmaintained ledger is as misleading as a stale comment," and for a single author "the discipline cost falls on one person." The production-dependent cluster stays hard-blocked regardless of ledger discipline.
- **Contingency.** (1) Give every gate a review-by date in S1, not at its wave. (2) At each question-resolution item, force one of three recorded verdicts: **answered** / **unanswerable-now, default in force, next review date** / **superseded**. "Still open" without a date is not an allowed outcome. (3) Batch the five `[INTENT]` questions into one owner sitting — they are decisions, not research, and answering them converts **S20, S24 and S25** toward READY. (4) If Q-12 is still open at S20, prefer *delete* for `privacyModeSchema` and `publicRoleSchema` (both S-sized, zero-consumer, trivially restorable from git) and hold only `cardContentSchema` pending — shrinking TD-5's growing exposure without risking the one schema whose enforcement could reject existing card data.

---

### X-4 — Wave 2 slips and Wave 4 proceeds without the safety net

- **Risk.** The plan's central sequencing claim is **coverage before convergence** — "ADR-106/108/109 rewrite exactly the paths that are currently untested" (kernel sequencing rationale). Wave 2 is S5–S9, four of them near-isolation sprints of test work. If it compresses or is deferred, Waves 3 and 4 execute the riskiest rewrites in the program over code with no regression net — the status-quo-with-extra-steps outcome ADR-117's rejected alternative 3 names: testing at refactor time costs more than testing at write time, and "the file-splitting program cannot proceed safely without a net."
- **Trigger.** Wave 2 is the least visibly productive wave (no user-facing change) and the easiest to trade away under schedule pressure — especially at team size 1 where the developer also decides. Secondary trigger: emulator friction (X-11) makes T-117d expensive and it gets dropped.
- **Impact on the plan.** The units Wave 2 covers are precisely the downstream convergence targets:
  - `resolveRole` (T-117b, S5) is the **T-115a convergence target** (S18) — ADR-117's consequence states it "becomes tested before it is consolidated." Without it, S18 converges five inline predicates, including one **semantically divergent**, onto an untested engine.
  - Flashcard data services (T-117c, S6) — `lesson-save`'s diff-based batch writer and `shared.service` — are what T-109a (S19) wires validation into and what T-106b (S16) migrates.
  - The rules suite (T-117d, S7) is what makes ADR-114 and ADR-115 rules changes verifiable at all; without it, S13/S14 and S18 change rules with no coverage of `lessons`/`cards`/`comments`, `admins`, `system_logs`, `sharedProgress`, or the collection-group read.
  - SRS math (T-117a, S5) is 335 lines of the most user-data-affecting logic in the repo, touched by T-116a's counter reporting (S9).
- **Likelihood.** **Medium**, trending Medium-High: Wave 2 is 5 of 29 sprints (17%) spent entirely on tests and telemetry before any user-visible improvement, and ADR-117 concedes coverage "competes with the structural ADRs for the same scarce single-author time (W-6)."
- **Mitigation already built into the plan.**
  - **The wave order is the mitigation** — Wave 2 precedes Waves 3–6 by construction, and the critical path routes *through* the test work (`[T-117a/b/c] → T-116a → T-107a`), so it is on the spine, not beside it.
  - **Allocation is risk-ranked, not volume-ranked** (ADR-117 names SRS math, `resolveRole`, flashcard data services as the priority), so a compressed Wave 2 still covers the convergence targets first: S5 and S6 carry the load-bearing coverage, S7/S8 carry breadth.
  - **Per-sprint exit criteria are ADR-117's own success criteria** and they are greppable: `resolveRole` test references > 0 (was 0); each of `ai`/`game`/`home`/`command-palette` has domain-logic coverage; every collection with a `firestore.rules` block appears in the rules suite. A skipped test task fails a checkable criterion rather than quietly not happening.
- **Residual risk.** Nothing prevents the sole developer from reordering their own waves; the exit criteria detect the skip, they do not block it. And even a complete Wave 2 sets risk-targeted floors, not a coverage percentage — ADR-117 rejected a global line-coverage mandate — so "covered" is a judgment call at review, with no second reviewer.
- **Contingency.** If Wave 2 must compress, the defensible minimum is **S5 + S6** (T-117a, T-117b, T-117c): these cover every unit Waves 3–4 rewrite. Defer **S7** (T-117d) only if S13/S14 and S18's rules changes are also deferred — the rules suite and the rules changes must move together. Defer **S8** (T-117e) freely; the four zero-coverage features are not on the convergence path. **Do not defer S9's T-116a** — it is on the critical path and it is what makes a regression *visible* if one lands.

---

### X-5 — Wave 6's placement moves collide with in-flight work

- **Risk.** Wave 6 (S26–S29) moves files across layer boundaries: kana-survival screens relocate to `features/kana/survival/` (T-105a), route `_components` are audited and relocated (T-105b), flashcard acquires internal sub-module boundaries and barrels (T-104a, an isolation sprint), Reports migrates onto the shared table engine (T-111a, an isolation sprint), and `ShareModal.tsx` (436 lines) is split under CS-2's hard ceiling in S28. These are the widest-diff changes in the program and the ones git can least help with — a rename plus an edit is a conflict magnet.
- **Trigger.** Any long-lived branch spanning a Wave 6 sprint; a second developer working concurrently (which the parallel-opportunity notes contemplate); or a hotfix landing on `main` during a placement sprint.
- **Impact on the plan.** A conflicted placement move is resolved by hand across dozens of files, and the failure mode is silent: an import that resolves but points at the wrong copy, or a file surviving the merge in its old location. Because Wave 6 is last, a botched merge lands *after* the boundary lint rules are at `error` (T-101c, T-103b, T-102c, T-104b), so the build catches structural breakage — but not semantic duplication.
- **Likelihood.** **Low at team size 1** — sequential work on one branch has little to collide with. **High if a second developer joins.** Rated Low because the plan is explicitly "valid at team size 1."
- **Mitigation already built into the plan.**
  - **Wave 6 is scheduled last, deliberately, into a quiet codebase** — the kernel's sequencing rationale says so exactly: "placement/pattern moves last because they cause the widest merge conflicts." By S26 all convergences, migrations and deletions have landed.
  - **The two widest moves get isolation sprints** — T-104a alone in S27, T-111a alone in S29 — so nothing else is in flight against them.
  - **The boundary lint rules land in Wave 1** (T-101c, T-103b in S4; T-102c in S5), so a placement move landing in the wrong layer fails the pre-commit gate rather than merging quietly.
  - **T-101a's root barrels (S2)** mean cross-feature consumers import from a barrel, not a path — relocating a file *inside* a feature no longer ripples into 43 call sites.
  - **CS-2's hard ceiling rides with S28**, folding the `ShareModal.tsx` split into the sprint that already touches the dialog surface rather than making it a separate colliding change.
- **Residual risk.** T-104a restructures the largest feature in the repo (~17k LOC / 146 files, R-4) and cannot be made conflict-free by ordering alone. And `04-Coding-Standards.md` flags a live tension: CS-7's barrel reduction "partially reverses a demonstrated preference" (CX-4 — a June barrel removal was reverted in July), so the scope needs owner confirmation before lint-enforcement; an unconfirmed scope means rework, not just conflict.
- **Contingency.** (1) Run each Wave 6 sprint on a short-lived branch merged within the sprint; never carry a placement branch across a boundary. (2) Perform moves as pure renames in one commit and edits in the next, so `git log --follow` and conflict resolution stay tractable. (3) If a second developer is added, give Wave 6 exclusive ownership of the tree for its four sprints and route the parallel developer to Wave 5's gated work (S21–S25), which touches almost none of the same files. (4) Confirm the CS-7 barrel scope at pre-flight, not at S27.

---

### X-6 — Auth cutover (T-107): a user-visible credential change whose failure mode is lockout

- **Risk.** ADR-107 replaces the JS-readable `auth-token` cookie with an httpOnly, server-verified session credential and aligns the cookie lifetime to session semantics. Each is user-visible: the credential riding every same-origin request changes shape, the edge gate's input changes, the lifetime changes. If issuance, verification and client plumbing disagree even briefly, authenticated users are redirected to `/login` and cannot get back — **lockout**, not degradation. The compensating controls (server actions re-verify; rules gate all client access — S-5/W-15) do not help, because the failure is *before* them.
- **Trigger.** Landing T-107b (client plumbing off the raw ID-token cookie) without T-107a's issuance path live and accepting; or T-107c (lifetime alignment) while sessions still hold the old 7-day cookie; or shipping without the E2E pass across protected *and* public routes.
- **Impact on the plan.** The one sprint whose failure is felt by users before it is felt by the program. It also sits on the critical path (`T-116a → T-107a → T-107b → T-106a`), so a rollback delays Waves 3 and 4 entirely. And it is the change the plan can least verify against reality — with Q-1 unanswered there is no production environment in which to confirm cookie flags, `Secure` behavior over real HTTPS, or the session mint/refresh/revoke lifecycle (X-8).
- **Likelihood.** **Low** — the plan's structure makes the dangerous ordering hard to reach. **High impact** if it happens.
- **Mitigation already built into the plan.**
  - **The cutover splits across an additive isolation sprint and a cutover sprint.** **S10** is T-107a alone: httpOnly session issuance plus server verification, with the existing credential **still accepted** — no user-visible change, deployable. **S11** then runs T-107b + T-107c + T-107d together, closing the dual-accept window only *after* T-107d's E2E regression pass across protected and public routes succeeds.
  - **T-107d is a sized task, not a hope** — an explicit "E2E auth regression pass across protected/public routes" (M) inside the cutover sprint, so verification is budgeted rather than squeezed.
  - **T-118a lands in S1** — the public-path allowlist divergence between the proxy and `AuthGate` is a *live defect today*; single-sourcing it (ADR-118 / NQ-2, "divergence is a defect, not intent") means S11 changes one allowlist, not two hand-mirrored ones. Cutting over auth on top of a known allowlist divergence would have been the most likely lockout path, and Wave 1 removes it ten sprints early.
  - **ADR-107 keeps the edge gate routing-UX only, by contract** (T-107c). The cutover adds no new *authorization* dependency at the edge — it changes what the routing check reads, narrowing the blast radius.
  - **Playwright E2E already exists** as one of the five affirmed suites (NS-3), so the tier T-107d needs is built.
- **Residual risk.** E2E runs against the **emulator** with a test-only sign-in bridge (`window.__e2eSignIn`) that does not exist in production — R-9's emulator-vs-prod gap applies directly here. `Secure`-flag behavior, real cookie-domain scoping, and session refresh against Google's live key rotation are unexercised. ADR-107 also concedes the SDK's in-memory token still exists, so this narrows rather than eliminates token exposure to page JS.
- **Contingency.** (1) Keep the dual-accept window open across the S10→S11 boundary and close it only on green E2E; if E2E is not green, S11 reverts to S10's state, which is deployable. (2) Prepare and test the revert of the cookie-set path as the *first* commit of S11, not the last. (3) Accept that a rollback forces re-authentication for users holding the new credential — state it as the known cost, and prefer it over an extended dual-accept. (4) If Q-1/Q-2 answer before S10, run the S11 cutover against the real project first; if not, record in the ledger that T-107's verification is emulator-only and carries R-9 as a residual — that row is what makes X-8 auditable.

---

### X-7 — Regression in the untested areas the plan touches

- **Risk.** The largest rewrites land on code with no tests today: all flashcard data services, `resolveRole`, the game-session hooks, and `admin.actions.ts` (380 lines, 20 actions, the RBAC enforcement seam) — W-16/TD-2/OP-23. T-106b/c migrate ~30 actions' plumbing; T-109a wires validation into every server write path; T-115a converges five inline predicates including one **semantically divergent** from the engine; T-113a collapses ten independent `useUserProgress` subscriptions into one. Each fails as a silent behavioral difference, not a crash.
- **Trigger.** Any Wave 3/4 task executing before its Wave 2 coverage lands (X-4), or a convergence quietly normalizing a divergence that was load-bearing — T-115a's divergent predicate is the named instance.
- **Impact on the plan.** Regressions here are user-data-affecting and hard to notice: wrong SRS scheduling, a share-permission that silently widens or narrows, progress that stops updating for some consumers. With the repo pre-deployment and no production telemetry (D-1, and Q-4 may keep it that way), a regression can persist undetected for the remainder of the program.
- **Likelihood.** **Medium.** High volume of untested surface being rewritten; the mitigation is real but partial.
- **Mitigation already built into the plan.**
  - **Wave 2 is the mitigation, by design** (X-4). ADR-117's consequence states it exactly: "the refactors ADR-101/ADR-104/ADR-106/ADR-115 imply gain a regression net over exactly the code they touch."
  - **T-116a (report-then-handle) lands in S9, before Waves 3–4.** Under CS-12 no swallow site discards an error without reporting first — so a regression in a fire-and-forget path (SRS counters, Storage cleanup, invite delivery, the named priority sites) leaves a trace instead of vanishing. That is the difference between a detectable and an undetectable regression.
  - **T-115a's divergent predicate is called out in the task itself** ("incl. the semantically divergent one"), so S18 cannot treat the convergence as a mechanical rewrite.
  - **The five-suite topology is affirmed (NS-3)** and every sprint names its applicable tier, so "which test proves this" is answered per sprint.
  - **T-115b (S17) automates the vocabulary-agreement check** (TS union ↔ rules list ↔ writers), with the kernel folding T-108's identical check into it — a whole class of drift regression becomes CI-detectable rather than review-detectable.
- **Residual risk.** Coverage is risk-targeted, not exhaustive: `admin.actions.ts` is named in W-16 as untested but is **not** in ADR-117's allocation priority, yet T-106b (S16) migrates its call sites. Game-session hooks are similarly named-but-not-prioritized. And with Q-4 unresolved, T-116a's reporting may terminate in an in-repo pipeline nobody reads (D-1).
- **Contingency.** (1) Before **S16** and **S18**, add characterization tests for any call site the sprint touches that Wave 2 did not cover — the "pay for characterization tests first" cost ADR-117 warned about, cheaper scheduled than discovered. (2) Treat T-115a's divergent predicate as a decision needing a ledger row, not a merge: record whether the divergence was intentional before normalizing it. (3) Require a rules-suite test for every rules change in S13/S14 and S18 (available only if S7 ran).

---

### X-8 — Verification without production: Q-1 unanswered means changes cannot be checked against the real environment

- **Risk.** `07-Open-Questions.md` names Q-1 (which Firebase project is production, and its provisioned state) as "the single most foundational question — it gates *verification* of the widest set of decisions (AD-06/07/08/14/16/18)." The plan can *execute* those decisions on their fixed directions but cannot *verify* any of them: deployed rules, composite indexes, TTL configuration, custom claims, session-cookie behavior over real HTTPS, and whether the Cloud Functions run at all are all outside the repo. The assessment's scope note is unambiguous — a pre-deployment codebase with demo-only project IDs and no observable production traffic.
- **Trigger.** It is the present state, not an event. It persists as long as no hosting decision is made (Q-2), and **the plan's own hosting task, T-118d, is `[OPEN]` — "not schedulable."**
- **Impact on the plan.** Two compounding effects.
  1. **Verification.** Six waves land with emulator-only validation. R-9 (emulator-vs-prod gap) applies to every rules change (S7, S13/S14, S18), the auth cutover (S11), and the notification index work (S21–S23). The fallback paths the code already carries — the notification listener that "transparently falls back" when a composite index is missing, the shared-lessons roles→collaborators fallback — mean a production divergence would degrade silently rather than fail loudly.
  2. **Gates.** Q-4, Q-5, Q-6, Q-9, Q-10 and NQ-1 are answerable only from a live project, deployment records, or live data. **Q-1 unanswered means six further gates are unanswerable** — the mechanism behind X-3's High likelihood and X-14's existence. One blockage presenting as seven.
- **Likelihood.** **High** — the current state, and nothing in the schedulable task set changes it.
- **Mitigation already built into the plan.**
  - **The kernel promotes Q-1 to Wave 1's readiness** (gate-rule 4: "Q-1 gates verification of nearly everything — it belongs to Wave 1's readiness, not to a later wave"), and `03-Sprint-Plan.md` opens it in **S1**, the first item of the program, with a ledger row via T-120b.
  - **T-118c (`.env.example`, S2)** answers the half of this that *is* in-repo: the env surface becomes discoverable even while its production values are unknown.
  - **T-118a (S1) and T-118b (S2) remove the two config-divergence hazards hardest to debug across two deploy surfaces** — the duplicated public-path allowlist (a live defect) and the split `NEXT_PUBLIC_APP_ID` / `NOTIFICATIONS_APP_ID` derivation (R-14, whose failure mode is a silent data partition between the app and the Functions package). Both land before any deployment can misconfigure them. `03-Sprint-Plan.md` further records that T-118b's *production agreement* is itself verified by Q-6 before the old variable retires — the plan does not claim confirmation the repo cannot provide.
  - **Decision directions stand without verification.** `07-Open-Questions.md` is explicit that Q-1 blocks *validation*, not direction: every ADR's target state is executable now. The plan is not blocked; it is unverified.
  - **The ledger records unverified-against-production as a tracked state** rather than an assumption — the only honest handling available.
- **Residual risk.** **High and structural.** No in-repo work substitutes for a production project. Everything shipped between S1 and a first deploy carries R-9 as an unretired residual, and the first real deploy will be the first time deployed rules, indexes, TTL and claims are exercised — after 29 sprints of changes rather than before them. R-13 stands: "a first deploy has no defined shape."
- **Contingency.** (1) **Make the hosting decision at pre-flight** — `07-Open-Questions.md` states plainly that Q-2 is "a decision to make, not a fact to find," so it needs a decision-maker, not an investigation. This is `08` §5's PF-1 and the single highest-leverage act available. (2) If hosting cannot be decided, provision a non-demo Firebase project used only for verification; that alone answers Q-1's provisioned-state half and unblocks Q-4, Q-6, Q-9, Q-10 and NQ-1 empirically. (3) Failing both, record per sprint which exit criteria were verified against emulator only, so the verification debt is enumerable at first deploy rather than rediscovered. (4) Never let an emulator-green result be reported as production-verified in a sprint review.

---

### X-9 — A gate answers late and contradicts a default already executed

- **Risk.** Gate defaults are *actionable*, so work will be done on them. Several are **deletions** (Q-6/Q-8/Q-11/Q-13/Q-17, NQ-3 — all "delete-unless-claimed"). If a gate answers after its task executed on the default, the plan has destroyed something that turns out to be claimed. Deletion is git-reversible; the *decision* it encoded, and any downstream work built on its absence, is not.
- **Trigger.** An `[INTENT]` answer arriving in Wave 6 for a Wave 5 deletion; or a gate answered casually ("delete it") without the roadmap context that would have claimed it.
- **Impact on the plan.** Bounded — these are S/M-sized surfaces (7 `NotificationKind`s, 8 `ActivityAction`s, admin Quick Actions and the Settings stub, the fan-out callable, the Storybook toolchain, `Drawer`). The real cost is confidence: a reversed deletion undermines delete-unless-claimed for the remaining gates.
- **Likelihood.** **Medium.** `07-Open-Questions.md` attaches a **veto note** to each resolved-by-decision item precisely because this is expected occasionally.
- **Mitigation already built into the plan.**
  - **Gated deletions are scheduled last** (S22, S24, S25; NQ-3's in S28), maximizing the window for an answer before execution, and the `[INTENT]` cluster is formally opened at S21 — four sprints of lead time before S25.
  - **Every gated task names its question and its default**, so a deletion traces to the decision that authorized it — a reversal is a decision change, not archaeology.
  - **The owner-veto mechanism is written into the source of truth** (`07-Open-Questions.md` §0), and ADR-120 gives it a home: the ledger row carries the disposition, so a veto edits a row rather than reopening a debate.
  - **T-119b's kana-practice logging gap is explicitly carved out** — a *provable* omission, "resolved in the direction its gate answers" rather than defaulted to deletion.
  - **Q-6's fan-out default carries a stated caveat** in `03-Sprint-Plan.md`: delete only if the gate has ruled out an out-of-repo operator invocation; if it cannot, retain with a ledger row — "do not delete on assumption."
- **Residual risk.** ADR-109's per-schema disposition is the asymmetric case: *enforcing* `cardContentSchema` against non-conforming stored data is a data migration, not a code change (TD-5), and unlike a deletion it is not cleanly revertible once user-visible rejections have occurred.
- **Contingency.** (1) Execute deletions as a single revertible commit per surface, referenced from its ledger row. (2) Before **S24 and S25**, re-ask the four `[INTENT]` questions once — a five-minute re-confirmation immediately before an irreversible act. (3) For Q-12 at S20, prefer deletion of the two zero-risk schemas and hold `cardContentSchema` (X-3 contingency 4).

---

### X-10 — Flipping boundary lint to `error` creates a blocking backlog on the pre-commit gate

- **Risk.** Wave 1 turns four lint rules to `error` (T-101c import boundaries, T-103b lib→features, T-102c notifications→flashcard, later T-104b flashcard internal boundaries), and CS-2 raises `max-lines` to `error` at 400. The existing pre-commit gate runs lint + format + **full build** on every commit. A rule flipped to `error` before its violations are cleared blocks every commit — for a single developer with no second machine, a hard stop.
- **Trigger.** T-101c landing before T-101b has migrated all 43 deep-import sites; or CS-2's 400-error being enabled before `ShareModal.tsx` (436, the only non-test violator) is split.
- **Impact on the plan.** Short-lived but total: the pre-commit gate is the program's quality floor and cannot be bypassed without abandoning the kernel's standing constraint.
- **Likelihood.** **Medium** — the hazard is real, but the sprint plan orders around it.
- **Mitigation already built into the plan.**
  - **Every flip is scheduled in a sprint *after* its cleanup completes** — never before, and never in the same sprint where a partial cleanup could strand the gate: `T-101a` (S2) → `T-101b` (S3, isolation) → **`T-101c` (S4)**; `T-103a` (S2) → **`T-103b` (S4)**; `T-102a`/`T-102b` (S4) → **`T-102c` (S5)**; `T-104a` (S27) → **`T-104b` (S28)**. This is a stronger property than co-locating flip and cleanup: an incomplete cleanup delays the *next* sprint's flip rather than blocking the *current* sprint's gate.
  - **CS-2's backlog was sized to be near-empty by design** — `04-Coding-Standards.md` notes exactly one non-test violator, and S28 pairs the `ShareModal` split with the ceiling's enforcement in the same sprint.
  - **The ESLint mechanism is proven in-repo** (the audio boundary already enforces at `error` with a teaching message, S-15/CS-9) — configuration of a working mechanism, not new infrastructure.
- **Residual risk.** `04-Coding-Standards.md` flags that CS-7's barrel-reduction scope "partially reverses a demonstrated preference" (CX-4) and says the owner should confirm the scope **before** lint-enforcing it. If T-101a (S2) publishes barrels at a scope the owner later disputes, T-101c (S4) enforces a contested rule.
- **Contingency.** (1) Land each rule as `warn` in the commit that starts its cleanup and flip to `error` in the commit that finishes it. (2) Confirm the CS-7 barrel scope at pre-flight. (3) If a flip blocks the gate unexpectedly, revert the rule change (one line) rather than bypassing the hook.

---

### X-11 — The emulator/JDK test topology blocks the tiers Waves 2–3 depend on

- **Risk.** Three of the five affirmed suites require the Firebase emulator, and the Firestore emulator is a JVM process requiring a JDK on `PATH` (R-15). The plan leans on them: T-117d (S7) is entirely emulator-tier; T-117c (S6) largely is; T-107d (S11) boots its own emulator. R-15 notes the sole author's most recent commit before this program (`a0bbbc4`) was itself a fix to an emulator test crash.
- **Trigger.** JDK or Firebase-CLI version drift, an emulator upgrade, or a machine change mid-program.
- **Impact on the plan.** S7 and S11 become unexecutable; S6 partially. Since S7 is the prerequisite for verifiable rules changes in S13/S14 and S18, a topology failure propagates forward two waves.
- **Likelihood.** **Medium** — R-15 rates it Med ("every new contributor hits this"), and 58 weeks is long enough for toolchain drift.
- **Mitigation already built into the plan.**
  - **The topology is affirmed, not changed** (NS-3, ADR-117): no dependency on new test infrastructure, only on the four vitest configs plus Playwright that already exist and are mirrored job-for-job in CI (S-10/S-11).
  - **Emulator-tier work is concentrated** in S6/S7 and S11 rather than spread across every sprint, bounding the blast radius.
  - **Pre-flight requires all five suites green at HEAD** before Sprint 1 — the topology is verified working before anything depends on it.
- **Residual risk.** R-15's impact note stands: emulator-tier tests are the ones most likely to be skipped locally "and thus rot," and they cover exactly the security-critical rules/functions code that has no other coverage. At team size 1 nobody notices a skipped tier.
- **Contingency.** (1) Pin the Firebase CLI and JDK versions and record them alongside S2's `.env.example` work. (2) Run the emulator tiers at every sprint boundary, not only when touching them, so rot is detected within one sprint. (3) If the topology breaks mid-wave, treat it as sprint-stopping — do not proceed into S13/S14 or S18 rules changes with a dead rules suite.

---

### X-12 — Estimate drift: ADR-derived sizing with no calibration baseline over a 29-sprint program

- **Risk.** The task set was **derived from twenty ADRs**, not validated against a pre-existing backlog — `engineering-tasks/` and `requirements-consolidation/` were deleted before the discovery phase and are unrecoverable, and the E15–E18 epic backlog is superseded. The T-shirt sizes have no historical calibration against this developer's actual throughput on this codebase. A systematic 30% underestimate turns 29 sprints into ~38; a 50% underestimate makes it ~44, at which point Wave 5's gated work starts ~14 months out.
- **Trigger.** Cumulative slippage rather than any single event. Amplified by X-4 (compressing the least visible wave) and X-1 (any absence is unrecoverable capacity at team size 1).
- **Impact on the plan.** Duration is itself a risk multiplier: the longer the program, the higher the probability of X-1 materializing, the longer gated defaults sit unreviewed (X-3), and the more the codebase drifts under Wave 6's placement moves (X-5).
- **Likelihood.** **High** for some drift; the question is magnitude, not occurrence.
- **Mitigation already built into the plan.**
  - **Sizes are bounded and XL is forbidden** — any XL task must be split, so no single task hides more than ~6–8 days of uncertainty.
  - **The plan already discounts capacity**: `03-Sprint-Plan.md` sizes sprints at ~8 days of task load per 10-day sprint, and uses isolation sprints for every L task, so the schedule is not built on 100% utilization.
  - **Waves are independently releasable**, each with a stated outcome, so value lands at wave boundaries rather than only at the end. Wave 1 alone delivers boundaries lint-enforced, config single-sourced, the cycle broken, the ledger live — and closes a live user-visible allowlist defect in S1.
  - **The critical path is fixed and short** (14 nodes), so off-spine slippage does not compound.
  - **Every sprint ends deployable**, so the program can stop at any boundary with a coherent shipped state.
- **Residual risk.** Estimates stay uncalibrated until several sprints have run.
- **Contingency.** (1) Recalibrate after **S4**: compare actual to estimated for Wave 1's 14 tasks and rescale the remaining waves once, publicly, in the ledger. (2) If the program must be cut short, wave boundaries are the cut points — stopping after Wave 3 (S14) leaves boundaries enforced, a safety net in place, httpOnly sessions live and queries bounded: a defensible state. (3) Do not respond to drift by compressing Wave 2 (X-4).

---

### X-13 — Q-4 gates two tasks but has no owner row in the open-questions register

- **Risk.** **Q-4** (do production Sentry/PostHog credentials exist; what analytics scope was intended) is treated as a live gate by three artifacts: `06-Decision-Matrix.md` lists it as AD-16's gate in four places, `03-Architecture-Decisions.md` records ADR-116 as "Accepted-conditional on Q-4 (activation leg)," and the kernel marks T-116b/T-116c `[GATED Q-4]`. But **`07-Open-Questions.md` does not enumerate it** — not in Group B `[GCP]`/`[OPS]` (which holds Q-1, Q-2, Q-6, Q-9, Q-10, NQ-1), not in any other group, and not in the roll-up. It survives in that document only as an aside inside NQ-14's row ("couples to Q-4"). **A question with no row has no answering-owner class, no default, and no review-by date** — and the register is exactly the artifact the plan consults to find out who answers what. An unassigned gate is a gate nobody answers.
- **Trigger.** Structural and already present. It bites at **S9**, when T-116b/T-116c come due and no one has been tasked with producing an answer.
- **Impact on the plan.** Two effects, one worse than the other:
  1. **The obvious one:** S9's two S-sized tasks do not ship, and observability stays dark. Bounded — ADR-116's policy leg (T-116a, report-then-handle) is unconditional and carries the sprint's value regardless.
  2. **The corrosive one:** an unregistered gate is invisible to every process built on the register. PF-6 assigns owners and review-by dates "to all gated questions" **by reading `07-Open-Questions.md`** — so without a correction, Q-4 is skipped by the very mechanism designed to prevent X-3. It becomes the one gate that defaults silently, which is the failure ADR-120 exists to end.
- **Likelihood.** **High** that Q-4 goes unanswered absent a correction — it has no owner by construction. **Medium** impact: the blocked work is 2 days, but the precedent is a hole in the gate-tracking mechanism.
- **Mitigation already built into the plan.**
  - **`03-Sprint-Plan.md` catches this and compensates explicitly.** Sprint 1's question-resolution items assign Q-4 an owner **eight sprints before it bites**, with the reasoning stated in-plan: because backlog §5.2 establishes Q-4 has no owner row anywhere in the register, "if no sprint names it, nobody is assigned to answer it." S5 re-affirms it as Wave 2's opening item.
  - **`01-Validated-Backlog.md` §5.2 flags the omission** as a kernel/source incoherence rather than silently resolving it.
  - **Q-4's default is unambiguous even without a row:** ADR-116's success criterion accepts either branch — Sentry/PostHog live with confirmed credentials, **or** explicitly deferred with the reason logged in the ledger. So the fallback is well-defined despite the register gap.
- **Residual risk.** The compensation lives in the *plan*, not in the *source of truth*. `architecture-decision/07-Open-Questions.md` remains wrong, and the next reader of that document will reach the same wrong conclusion. **Related documentation defect, to reconcile rather than silently resolve:** that document's own arithmetic does not close — its section heading says **26** open questions, its roll-up totals **25**, and its four group tables sum to **32** (A 12 + B 6 + C 2 + D 5 + E 7). Do not pick a number; the register needs a corrective pass that adds Q-4's row and reconciles the counts.
- **Contingency.** (1) **Fix the source, not just the plan** — add a Q-4 row to `07-Open-Questions.md` Group B with its answering class (`[GCP]` credentials/ownership + `[INTENT]` scope), its standing default (activation deferred, report-then-handle unconditional), and an owner; then reconcile the 26/25/32 discrepancy in the same pass. (2) Until that lands, treat `03-Sprint-Plan.md` S1 as the authoritative owner record for Q-4. (3) Audit the register once for any *other* question cited by an ADR but absent from the tables — Q-4 was found by cross-referencing the decision matrix against the register, and nothing guarantees it is the only one.

---

### X-14 — The critical path terminates in a gated task: the program cannot fully complete on in-repo work alone

- **Risk.** The kernel's critical path is `T-120a → T-101a → T-101b → T-101c → T-102a → T-102b → [T-117a/b/c] → T-116a → T-107a → T-107b → T-106a → T-106b → T-109a → T-108a/d → done`. Its **terminal node is T-108d** (collapse dual read paths and dual indexes to one), which is `[GATED Q-5]` — a `[DATA]` + `[OPS]` question answerable only from a live Firestore data sample and deployment records. **The program's definition of "done" is therefore not reachable by in-repo work.** No amount of correct execution completes the critical path; an external fact must arrive.
- **Trigger.** Structural and already present. It becomes visible at **S23**, the isolation sprint holding T-108d, which is also the last critical-path node.
- **Impact on the plan.**
  - **Schedule.** The program has no in-repo completion date. Sprints 1–22 can all execute perfectly and the critical path still terminates one node short. Every completion estimate is conditional on an external event with no scheduled arrival.
  - **Reporting.** "Percent complete" becomes misleading near the end: at S22 the program can be ~97% of its task-days delivered and 0% of its critical path *closed*.
  - **Debt.** T-108d's gate is what closes TD-1, the corpus's **#1-ranked technical debt (score 8)**. Running to the end of the schedule without Q-5 means the highest-ranked debt in the assessment survives the entire remediation program — with its type-level half fixed (T-108a, ungated, S21) and its data-level half untouched.
  - **Coupling.** Q-5 needs a production project, so X-14 is downstream of X-8, which is downstream of the unschedulable T-118d. Three risks, one root.
- **Likelihood.** **High** that Q-5 is unanswered when S23 arrives, given the codebase is pre-deployment today and nothing in the schedulable task set provisions a production environment.
- **Mitigation already built into the plan.**
  - **The gate is honest rather than hidden.** ADR-108 gates the retirement deliberately: its rejected alternative 3 states that retiring the dual machinery without confirming the backfill ran "would silently hide pre-migration notifications from users." A blocked T-108d is the decision working as designed — the alternative is a data-visibility incident.
  - **The valuable half is ungated and lands early in the wave.** T-108a (S21) widens the union to the 10 stored values and makes non-exhaustive switches fail typecheck — closing the "lie the codebase tells" without any production fact. `01-Validated-Backlog.md` records that T-108a is *Ready with Q-7's default in force*, not gate-free, so the distinction is preserved.
  - **T-108e (S21) gives the unfinished migration a ledger row** with removal gate, current stage, owner and review-by — converting RC-3's permanent-transitional state into a tracked, closeable one. The program ends with the debt *tracked*, not *forgotten*.
  - **NS-8 makes the blocked state the correct state**: nothing legacy-compatible is stripped before its gate answers.
  - **Q-5 is raised at S19 and formally opened at S21**, giving it four sprints of lead time before S23.
- **Residual risk.** The plan cannot close its own critical path. If Q-5 never answers, the program's terminal deliverable is a ledger row rather than a merged change, and TD-1's cleanup half stays open indefinitely — visible, owned, dated, and unresolved.
- **Contingency.** (1) **State the conditional completion definition up front**, not at S23: the program has two end states — *schedule-complete* (all 62 wave-assigned tasks executed or dispositioned on their defaults) and *critical-path-complete* (additionally requires Q-5). Report against both. (2) Make Q-5's answerability a pre-flight objective, not a Wave 5 activity — it is the same production-project dependency as PF-1/PF-2, so provisioning a real project once resolves X-8, X-14 and five other gates together. (3) If Q-5 remains unanswerable at S23, close the program at *schedule-complete* with T-108d carried as the single open ledger row, its review-by date set, and TD-1 explicitly named in the closing report as surviving the program. Do not quietly declare completion.

---

## 3. When each risk is live

| Sprint range | Wave | Live execution risks |
|---|---|---|
| Pre-flight | — | **X-8**, **X-14**, **X-13** (all three must be attacked here or they persist all program), X-11, X-12 |
| S1–S4 | 1 | X-10 (lint flips at S4), X-8 (Q-1 opened S1), X-13 (Q-4 owner assigned S1), X-1 (the ledger mitigation is being built) |
| S5–S9 | 2 | **X-4** (the wave most likely to be compressed), X-11 (emulator tiers S6/S7), X-3 + X-13 (Q-4 bites at S9), X-7 |
| S10–S14 | 3 | **X-6** (S10/S11 auth cutover), X-7, X-8 (emulator-only verification of the cutover), X-3 (Q-9 at S14) |
| S15–S20 | 4 | **X-2** (write-path dual state S15→S17), X-7, X-3 (Q-12 at S20), X-9 |
| S21–S25 | 5 | **X-2** (notification collapse S22/S23), **X-14** (T-108d at S23), **X-3** (eight gated tasks), **X-9** (irreversible deletions S24/S25) |
| S26–S29 | 6 | **X-5** (placement moves), X-10 (T-104b + CS-2 400-error at S28), X-3 (NQ-3 at S28) |
| Throughout | — | X-1, X-12 |

---

## 4. Standing contingencies (apply program-wide)

1. **A sprint that cannot meet its exit criteria reverts; it does not extend.** The deployable-per-sprint rule is the plan's only rollback mechanism — ~~there is no CI/CD pipeline and no deployment history to roll back to (R-13)~~. Reverting to the previous sprint's tagged state is the rollback.

   > **Correction (2026-08-04): the struck claim was false when written.** `.github/workflows/ci.yml` was created **2026-07-16** (`15e203b`), two days before this corpus's own baseline commit `a0bbbc4`. CI runs 5 jobs (`build-lint-test`, `emulator-rules-tests`, `functions-tests`, `e2e-tests`, `deploy-functions`); lint has been **blocking** since `4fd206c` (Sprint 0). This same file already contradicts the claim at §238 ("mirrored job-for-job in CI"). Source risk R-13 says only *"No hosting or deployment decision recorded"* — the widening into "no CI/CD pipeline" was never supported. Deployment history also now exists: `LDG-19` records a verified `firebase deploy --only firestore:indexes`. The revert-to-tagged-state rule itself still stands.
2. **The ledger is current at every sprint boundary, or the sprint has not ended.** This mitigates X-1, X-3, X-9, X-13 and X-14 simultaneously, and it is worthless if it lags.
3. **Every gate review produces one of three recorded verdicts:** answered / unanswerable-now-with-next-review-date / superseded. "Still open" is not a verdict.
4. **Emulator-green is never reported as production-verified.** Each sprint's exit record states which tier verified it (X-8).
5. **Irreversible acts are re-confirmed immediately before execution** — deletions at S22/S24/S25, schema enforcement at S20, the dual-accept close at S11, the read-path collapse at S23.
6. **Recalibrate estimates once, after Wave 1 (S4)**, and record the rescale in the ledger rather than silently absorbing it (X-12).
7. **Report against two completion definitions** — schedule-complete and critical-path-complete — from Sprint 1 onward, so X-14 is never a late surprise.

---

## 5. What this document does not cover

- **The codebase's inherent risks (R-1 … R-19).** Assessed in `architecture-assessment/08-Risk-Assessment.md` and addressed — or explicitly not addressed — by the twenty ADRs. Where this plan's execution affects one, it is cited by ID; nothing here re-rates them.
- **The three risks the decision set deliberately leaves open.** R-3 (leaderboard world-readable PII / NQ-7) and R-18 (world-readable card-image Storage / NQ-8) have **no addressing decision** — `06-Decision-Matrix.md` §2b and §5 route them to product intent. R-7 (transaction invariants / NQ-11) awaits an in-repo audit. **No task in this plan touches any of them**, so executing this plan in full leaves all three exactly where they are. That is a property of the decision set, not a gap in the schedule, but it should not be discovered at the end of the program.
- **The `[REPO]`-class audits.** NQ-11 (multi-document write invariants), NQ-12 (sanitization trace) and NQ-13 (page-level a11y) are resolvable **without production access** but are not in the task set. `03-Sprint-Plan.md` notes them at S22 specifically so spare parallel capacity is not misallocated to inventing scope.
- **TD-3 (the 200-line warn-only ceiling, top-10 debt, no dedicated decision).** `06-Decision-Matrix.md` §2a flags it as a deliberate deferral. CS-2's tiered ceiling rides along as files are touched rather than as a task.
- **Runtime magnitudes (NQ-14).** No profiling or bundle analysis exists; ADR-113/ADR-114 proceed on structure. The plan does not size R-1, R-2 or R-10, so it cannot demonstrate improvement on them beyond the structural change.
- **Business, staffing and budget risk.** Out of scope; X-1 covers only the execution consequence of a single-developer team.
