# 10 — Release Plan

**Phase 11 — Implementation Planning.** How this plan's work reaches a running environment, in what order, and what happens when a piece has to come back out.

> **Honest labeling.** Derived from the 20 ADRs in `architecture-decision/`, not from a pre-existing backlog. `engineering-tasks/` and `requirements-consolidation/` do not exist; no requirement-ID or recommendation-ID is cited. Traceability runs **task → ADR → driving findings → corpus file**.

**Authority.** `01-Validated-Backlog.md` owns the task set — 63 tasks (46 Ready / 16 Gated / 1 Open), with their IDs, waves, sizes, gates, acceptance criteria, regression scopes and per-task rollback paths. This document groups those tasks into shippable units and adds only what 01 does not carry: release-level rollback, verification and deployment constraints. Where the two differ, 01 wins.

---

## 0. What "release" means in this repository today

Before anything else, the honest constraint: **there is no recorded deployment target.**

`lib/site.ts` carries the repository's only TODO, and it records no hosting decision. There is no `.firebaserc`, no hosting block, and the project IDs in the repo are demo-only; `SITE_URL` falls back to `localhost`. This is **Q-2**, and `07-Open-Questions.md` is explicit that it "is a decision to make, not a fact to find" — no investigation resolves it. It is the one item AD-18 leaves **Open** inside an otherwise-accepted decision set, and **T-118d** is the one task in the plan marked `[OPEN]`, not schedulable.

So this document defines two things that are currently separable:

| | Definition | Available today? |
|---|---|---|
| **Release** | A coherent, independently revertible set of merged changes, verified against the five test suites and the emulators, with its rollback path proven. | **Yes.** Every wave produces one or more. |
| **Deployment** | That release running in a named environment against a named Firebase project. | **No.** Blocked on Q-2 (target) and Q-1 (project identity). |

Everything below is written for the deployment case, because that is what the plan is building toward — but §5 states plainly which parts cannot execute until Q-1 and Q-2 answer. A release plan that assumed a deploy target would be inventing the one fact the corpus says is missing.

---

## 1. Release units

**The wave boundary is the guaranteed release boundary** — the kernel fixes every wave as independently releasable. Four waves are additionally sub-split where a distinct rollback story or a distinct audience makes a finer cut worth the ceremony. **No sub-split crosses a wave boundary.**

**Ten release units.**

| Unit | Wave | Scope | User-visible? | Reverts cleanly? | Gates |
|---|---|---|---|---|---|
| **R1** | 1 | Platform foundations — ledger, config single-sourcing, barrels + import boundaries, cycle break | **Almost none** (one behavior change) | Yes, with one conditional exception | — |
| **R2.1** | 2 | Safety net — coverage for SRS math / RBAC resolver / flashcard services / rules collections / 4 zero-coverage features; report-then-handle at 17 sites | **No features**; failure modes become visible | Yes | — |
| **R2.2** | 2 | Telemetry activation — Sentry + PostHog | No | **No** | Q-4 — **unassigned**, fallback executable |
| **R3.1** | 3 | Auth credential cutover — httpOnly server-verified session | **Yes — forced re-authentication** | **No** | (verification: Q-1, Q-2) |
| **R3.2** | 3 | State & data guardrails — centralized listeners, bounded queries, honest UI | **Yes** — dashboards, exports, list lengths change | Yes (default branch) | Q-9 (T-114d only) — fallback executable |
| **R4.1** | 4 | Write-boundary validation + predicate convergence + vocabulary automation + `ShareModal` split | **Yes** — invalid writes now rejected | Yes | Q-12 (executable) · **Q-10 (inaction — T-115c holds)** |
| **R4.2** | 4 | Action-client cutover — one verified-identity client, superseded clients removed | No (transport only) | Yes, **at unit granularity only** | — |
| **R5.1** | 5 | Notification migration — union widening, index/rules deploy, dual-machinery collapse | **Yes** — notification rendering changes | **No** | **Q-5, NQ-1 (both inaction)** · Q-6 — see §1.1 |
| **R5.2** | 5 | Dead-surface deletion — kinds, actions, admin UI, fan-out callable, Storybook | **Yes** (admin) + team-visible | Mostly; one exception | Q-6/8/11/13/17 — all executable |
| **R6** | 6 | Structure & patterns — placement, flashcard internals, one dialog pattern, one table engine, pagination codified | **Yes** (admin) + subtle visual | Yes | NQ-3 (veto window) |

### 1.1 Per-unit detail

---

#### R1 — Platform Foundations (Wave 1)

**Contents.** T-120a/b/c · T-118a/b/c · T-101a/b/c · T-103a/b · T-102a/b/c (14 tasks).

**Team-visible change.** Substantial: nine feature barrels become the public API, 43 deep-import sites move onto them, the boundary rule goes to `error`, `lib`→`features` is forbidden, notifications reaches flashcard only through a registry seam, and the migration ledger exists in-repo for the first time.

**User-visible change — one, and it is not cosmetic.** T-118a is described in the kernel as fixing *a live divergence defect*: the edge proxy and `AuthGate` currently hold two copies of the public-path allowlist that are **provably unequal** despite a comment claiming they mirror each other (W-20a). Single-sourcing them necessarily changes the behavior of whichever consumer held the narrower list — some path that today redirects will splash, or vice versa. **This is a routing behavior change and must be verified as one, not waved through as config cleanup.** Everything else in R1 is internal.

**Honest statement.** With that one exception, R1 ships nothing a user can see. Its value is that every subsequent release lands in a codebase where boundaries fail CI instead of decaying quietly.

---

#### R2.1 — Safety Net (Wave 2)

**Contents.** T-117a/b/c/d/e · T-116a (6 tasks).

**User-visible change.** No feature changes. But T-116a converts 17 swallow sites to report-then-handle, and that changes **failure behavior**: operations that previously failed silently now surface an error or report one. Users who were experiencing silent failures (SRS counter updates, Storage cleanup, invite delivery) will start seeing them. This looks like a regression and is the opposite — it is the plan making existing breakage legible. Say so in any release note.

**Honest statement.** Nothing new works. Some things that were already broken start admitting it.

---

#### R2.2 — Telemetry Activation (Wave 2) · **GATED Q-4**

**Contents.** T-116b (Sentry) · T-116c (PostHog).

**User-visible change.** None in the product. But the app begins transmitting error and product-analytics events about real users to two third-party services. That is not a user-visible *feature* change; it is a data-handling change.

**Beyond credentials.** Q-4 covers credentials and project ownership; T-116c's acceptance criteria add the **intended analytics scope** as a second thing the answer must settle — the near-empty product-event surface is either widened by decision or accepted by decision. Activating product analytics on end users also carries a privacy-posture question that credentials do not answer. Flagged as a pre-release item for the product owner alongside Q-4 — not decided here, and not invented as a requirement.

**This unit can complete without the gate answering, and that is deliberate.** 01 makes an *undecided* state an explicit failure of T-116b/T-116c: the task is discharged either by activating, or by **deferring with the reason and a review-by date recorded in LDG-13**, leaving the credential-gated wiring intact. So R2.2 always ships something — either telemetry, or a recorded decision not to run it. What it may not do is ship silence.

**But Q-4 has no owner row.** It is a real gate that `07-Open-Questions.md` never enumerates (see `09` §5.2). Wave 2's question-resolution item must name it and assign a person, or R2.2 will default to deferral not by decision but by nobody having been asked.

**Honest statement.** Internal only, with an external data-egress consequence that is irreversible once it starts (§3).

---

#### R3.1 — Auth Credential Cutover (Wave 3)

**Contents.** T-107a/b/c/d (4 tasks). Split from the rest of Wave 3 because it is the plan's only release requiring user notice, and its rollback story is unlike anything else here.

**User-visible change — yes, unavoidably.** The credential shape changes from a JS-readable raw ID token to an httpOnly server-minted session. **Every existing session becomes invalid at cutover; every signed-in user must sign in again.** In exchange, the confusing "page loads, every action fails" state (a 7-day cookie wrapping a 1-hour token — W-15) disappears.

**Honest statement.** The one release in this plan that a user will definitely notice, and the one that needs an announcement (§7).

---

#### R3.2 — State & Data Guardrails (Wave 3)

**Contents.** T-113a/b · T-114a/b/c · T-114d (gated Q-9, fallback executable) (6 tasks).

**The gate does not hold the unit.** 01 deliberately split the honest-UI legs (T-114b dashboard, T-114c export rows) from the read-path disposition (T-114d): fabricated zeros are out of policy on *both* branches of Q-9, so keeping them together would have held ungated correctness work hostage to a production-console answer. And T-114d's own fallback — *remove the dead read paths and their zero-fabricating fallbacks* — is executable, so the unit ships complete whether or not Q-9 answers. Only the alternate branch (define a real writer) needs the answer, and only that branch is irreversible (§3.3 (7)).

**User-visible change — yes, in three places.**
1. **Dashboards stop showing zeros they invented.** Absent data renders as absent. A panel that read "0" now reads "no data" — visually a regression, factually a correction (ADR-114's honest-UI rule).
2. **Exports change shape.** Hardcoded-zero rows become absent-data semantics; anything downstream parsing those exports sees different content.
3. **Lists get shorter.** Bounded listeners — the public-lesson collection-group query first — now carry an explicit `limit()`. Where production public-deck volume exceeds the bound, users see a truncated list where they previously saw everything. NQ-6 sizes the urgency; it does not change the requirement.

Plus an invisible improvement: `useUserProgress` collapses from one listener per mount across 10 consumers to a single shared subscription.

**Honest statement.** This release makes the product **less flattering and more truthful**. Three of its visible changes will read as regressions to anyone not told why.

---

#### R4.1 — Contracts (Wave 4)

**Contents.** T-109a/e · T-109b/c/d (gated Q-12, fallbacks executable) · T-115a/b · T-115c (gated Q-10, fallback **inaction**) (8 tasks). The `ShareModal.tsx` split (436 lines — the one >400-line non-test file) rides here, in **T-115a**, which is the first task to edit that file's body (01 §2.1 M-5). The `toActionResult` compatibility shim retires in T-106d with R4.2 (M-2).

**One task in this unit cannot ship.** T-115c's fallback is *inaction* — 01 calls it "the one gate whose default is inaction." Until Q-10 establishes which source production admin authority actually rides on, the three divergent admin-authority predicates stay as they are, because aligning blind risks either locking out real admins or failing to lock out the wrong ones. R4.1 ships without it and LDG-14 carries the deferral.

**User-visible change.** Writes that previously succeeded with invalid payloads are now rejected at the boundary. Forms that accepted malformed input start returning validation errors. That is the intent — but if any real user flow depends on writing data the new schemas reject, that flow breaks at this release. T-109a's audit is the mitigation and must enumerate what it will start rejecting, not just where it wires validation.

Also here: the five inline deck-access predicates converge on the engine, **including the semantically divergent `isOwner` in `shared.service.ts`** — the corpus's "closest thing to a discovered live bug" (`roles?.[uid] === "owner"` versus the engine's `ownerId ?? userId`). Converging it **changes who is treated as an owner** on that path. That is a permission-behavior change in a sharing flow and belongs in the release note for anyone administering shared decks.

**Honest statement.** Mostly internal, with two real behavior changes: stricter writes, and one corrected ownership predicate.

---

#### R4.2 — Action-Client Cutover (Wave 4)

**Contents.** T-106a/b/c/d (4 tasks). Split because it rewrites the transport under every privileged write and deserves its own rollback boundary.

**User-visible change.** None intended. Both write families move onto one verified-identity client with per-action permission metadata; the superseded clients are deleted. If the migration is incomplete or the permission metadata is wrong, the failure mode is *actions stop working* — which is why T-106d (removal) never ships in a different release from T-106a/b/c.

**Honest statement.** Internal only, with a sharp failure mode if partially applied.

---

#### R5.1 — Notification Migration (Wave 5) · **GATED Q-5 + NQ-1 (+ Q-6)**

**Contents.** T-108a (Ready, Q-7 default in force) · T-108b/c/d (gated, **all three with inaction fallbacks**) · T-108e (5 tasks).

**This is the one release unit that cannot be fully scheduled on in-repo work alone.** The plan's critical path ends `… → T-109a → T-108a/d`, and **T-108d is Q-5-gated** (01 §5.5) — so the path does not terminate on a task, it terminates on a live-data answer. Three of this unit's five tasks (T-108b, T-108c, T-108d) have *inaction* fallbacks: their standing default is *retain*, so no amount of effort advances them. Schedule the unit as **an ungated half that ships on repo work and a gate-bound tail that does not**, and open Q-5 and NQ-1 by Wave 3 (`09` §5.4) so the tail is not the schedule's blocker.

**User-visible change.** T-108a widens `NotificationType` from 4 declared values to the 10 actually written. Today, correctness on the six unhandled values depends on `NotificationIcon` widening to `string`. Once the union is honest, exhaustive handling becomes mandatory and **six notification types get proper icons and labels where they previously fell through generic handling** — a visible improvement in the notification list.

T-108c/d are where the risk lives. If the backfill never ran in production, collapsing the dual read path **silently hides pre-migration notifications from users** — ADR-108 names this exact outcome as the reason the removal is gated.

**Split within the unit.** T-108a and T-108e are Ready and can ship without the rest. Where Q-5/NQ-1 have not answered, **release T-108a + T-108e alone** and hold T-108b/c/d. That partial release is coherent: the union widens (a pure code fact needing no production access), the ledger records the migration's stage, and no compatibility machinery is touched. It also discharges ADR-108's first success criterion — a deliberately non-exhaustive switch over the union fails typecheck — without touching the gated half at all.

**T-115b's notification target flips here.** The vocabulary-agreement check shipped in R4.1 with its notification target in report-only mode, because until T-108a lands the union genuinely diverges from the writer and a failing check would be red by design (01 §5.4). **When T-108a merges, the target flips to failing.** That flip is a release-time step of R5.1, not an afterthought, and a Wave 5 exit criterion confirms it happened.

**Honest statement.** The half that improves rendering is safe and schedulable. The half that closes the migration cannot ship on repo knowledge alone, and shipping it blind is the specific harm the ADR forbids.

---

#### R5.2 — Dead-Surface Deletion (Wave 5) · **GATED Q-8/Q-11/Q-13/Q-6/Q-17**

**Contents.** T-119a/b/c/d/e (5 tasks). All five are **Gated-default** — the standing default is *delete*, executable at each ledger row's review-by (see `09` §1.4).

**User-visible change.** Admin users lose the handler-less Quick Action buttons and the Settings stub — inert controls that today do nothing when clicked, so the removal is behavior-neutral *for anyone who tried them* and cosmetic for everyone else. **Team-visible:** the one-story Storybook toolchain and the unreferenced scaffold SVGs disappear from the repo.

**Forward risk, not a rollback risk.** Deleting the 7 dormant `NotificationKind`s narrows the union. If production documents carry any of those values, those documents no longer have a declared type. Q-8 exists precisely to establish that; the pre-release check in §4 states what to confirm.

**Honest statement.** Removes surfaces nobody can currently prove are alive or dead. That is the point — the target state excludes "declared surface whose liveness nobody can determine."

---

#### R6 — Structure & Patterns (Wave 6)

**Contents.** T-105a/b · T-104a/b · T-110a/b (NQ-3 veto window) · T-111a · T-112a (8 tasks), plus the folded raw-hex token cleanup (38 occurrences across 29 files, charts carve-out excepted), which rides on T-110a and T-111a (01 §2.1 M-6). The `ShareModal.tsx` split is **not** here — it lands two waves earlier with T-115a in R4.1.

**User-visible change — more than the label suggests.** T-111a migrates Reports onto the shared react-table engine, which means **Reports gains real sorting, selection, and filtering semantics it does not have today** — a visible admin capability change, not a refactor. T-110a converges the straggler backdrop, and the raw-hex cleanup touches rendered colour in 29 files. Subtle, but not nothing.

**Honest statement.** Nominally the "internal" wave; actually the one that changes what admins can do with Reports. Scheduled last for merge-conflict reasons, which means it lands against a codebase that has been quiet for five waves — verify that assumption held before starting (`09` §6.2, wave bleed).

---

## 2. Release sequencing

### 2.1 The order

```
R1  →  R2.1  →  R2.2*  →  R3.1  →  R3.2  →  R4.1  →  R4.2  →  R5.1*  →  R5.2*  →  R6
                (Q-4)                                              (Q-5/NQ-1)  (5 gates)
```

`*` = gated; may slip out of position or ship partially without blocking what follows.

### 2.2 The constraints that fix this order

| # | Constraint | Source |
|---|---|---|
| 1 | **R1 first.** Every later change is staged work that needs enforcement and recording. The ledger and the boundaries must exist before there is anything to record or enforce. | Kernel sequencing rationale; ADR-120 as highest-leverage |
| 2 | **R2.1 before R4.1, R4.2, R5.1 — "coverage before convergence."** ADR-106/108/109 rewrite exactly the paths that are currently untested. This is not just a plan rule; it is the pre-release verification argument. Shipping R4.2's transport rewrite without R2.1's coverage means the release has no way to prove it did not break the money-path mutation logic. | Kernel; ADR-117 allocation (W-16, TD-2, cluster C8) |
| 3 | **R2.2 before R3.1 — wanted, not guaranteed.** You want production error reporting live *before* the riskiest cutovers. But R2.2 is gated on Q-4. **If Q-4 has not answered by Wave 3, the auth cutover ships with no production error reporting** — errors during the cutover window are observable only through user reports. This is a named, accepted consequence of the gate, not an oversight. Flag it at the R3.1 go/no-go. | Q-4 gate; ADR-116 |
| 4 | **R3.1 before R4.2.** The unified action client carries verified identity. Cutting the credential over *after* the client would mean rewriting the transport twice. The kernel's critical path puts T-107a/b ahead of T-106a/b for this reason. | Critical path |
| 5 | **R3.x before R4.x** — security and data correctness are user-facing; contracts and convergence are structural. | Kernel sequencing rationale |
| 6 | **R4.2 is atomic.** T-106a/b/c/d ship together. A release containing T-106b but not T-106d leaves a half-migrated boundary, which the kernel forbids ("no sprint may end with a partially-converged client"). | Kernel; §3.4 |
| 7 | **Within R5.1: establish deploy state → deploy indexes → wait for index build → deploy rules → deploy app → then collapse.** T-108d's query collapse depends on a composite index; collapsing before the index is confirmed **built** makes the surviving query fail. T-108b establishes the state that makes the rest safe. | ADR-108; NQ-1; Firestore index-build semantics |
| 8 | **Gated units late.** R2.2, R5.1, R5.2 sit late so their questions have maximum elapsed time to answer. Gates do not block the units after them. | Kernel: "gated work late so answers have time to arrive" |
| 9 | **R6 last.** Placement and pattern moves cause the widest merge conflicts and need a quiet codebase. | Kernel sequencing rationale |
| 10 | **Non-reverting releases go last within their wave and never precede their verification capability.** R3.1 is the last thing in Wave 3 to merge; R5.1's irreversible half does not ship at all until Q-5/NQ-1 answer. | §3, §4 |
| 11 | **The critical path terminates in a gated task, so the schedule's tail is an answer, not a task.** The path ends `… → T-109a → T-108a/d` and T-108d is Q-5-gated (01 §5.5). Treat the path as ending at **T-108a** — which is schedulable — with T-108d as a gate-bound tail. Consequence for releasing: **R5.1's completion date is a function of Q-5's answer latency, not of developer capacity.** Adding effort does not pull it in. | 01 §5.5 |
| 12 | **T-115b ships report-only in R4.1 and flips to failing in R5.1.** The mechanism must precede the target it checks, but the notification target is not correct until T-108a lands a wave later. Shipping the check failing-by-design would be the standards-decay pattern the whole decision set guards against. | 01 §5.4 |

### 2.3 What can move

- **R2.2** can ship any time after Q-4 answers, including out of order. It is config and credentials, not code the other units depend on.
- **R5.2 does not depend on R5.1, and is far more likely to ship on time.** All five of its tasks have **executable** fallbacks (delete-unless-claimed), so each can be discharged at its ledger row's review-by even with no answer at all. Four of the five gates are a single product-owner conversation; Q-5, which gates R5.1, needs a live data sample. Expect R5.2 first.
- **R5.1 splits** into its schedulable half (T-108a + T-108e, both Ready) and its gate-bound tail (T-108b/c/d, all three *inaction*). The schedulable half can ship with R5.2 or earlier.
- **R3.2 and R4.1 could merge** into one release for a one-person team if the ceremony outweighs the rollback isolation. They are kept separate because both carry user-visible behavior changes and separate notes are clearer than one compound one.

---

## 3. Rollback strategy

### 3.1 The governing rule

**Revert granularity is the release unit, not the PR.** Reverting one PR out of a converged set — T-106b without T-106a, or T-101b without T-101c — produces exactly the half-migrated state the kernel forbids. Every unit below has one revert command shape: revert the unit's merge range, whole.

Where that is not sufficient, the unit is on the list in §3.3.

### 3.2 What reverts cleanly (and why)

These are all **code-only, no persisted side effects**:

| Change class | Units | Revert |
|---|---|---|
| Lint rules and boundary enforcement (T-101c, T-102c, T-103b, T-104b, T-112a) | R1, R6 | Delete the rule. Instant, no state. |
| Barrels + import-site migration (T-101a/b) | R1 | Revert the range. Mechanical, no runtime state. |
| Injection/registry seam (T-102a/b) | R1 | Revert. The seam is code structure. |
| Type widening (T-108a) | R5.1 | Revert. `NotificationType` is compile-time only; **no write behavior changes**, so no data is affected either way. |
| Tests (T-117a–e) | R2.1 | Revert. Nothing depends on them. |
| Report-then-handle (T-116a) | R2.1 | Revert. Restores the swallow behavior — undesirable, but clean. |
| Listener centralization (T-113a/b), query bounds (T-114a) | R3.2 | Revert. Read-side only; no writes. |
| Honest-UI rendering (T-114b/c) | R3.2 | Revert. Presentation only — the fabricated zeros were never persisted. |
| Validation wiring (T-109a/e) | R4.1 | Revert. Writes rejected during the window were simply not made; no partial or malformed state is created. |
| Predicate convergence (T-115a) | R4.1 | Revert. Reinstates the divergent `isOwner`, which is worse but consistent. |
| Vocabulary-agreement check (T-115b) | R4.1 | Revert. CI-only. |
| Action client (T-106a/b/c/d) | R4.2 | Revert **the whole unit**. See §3.4. |
| Pure code deletions (T-119a/b/c/e) | R5.2 | Revert restores the code. Note the forward risk in §4.6 — that is not a rollback concern. |
| Placement moves, dialog/table convergence (T-105, T-104, T-110, T-111) | R6 | Revert. Structure only. |
| Ledger and docs (T-120a/b/c) | R1 | Reverts cleanly. Never desirable — reverting the ledger recreates the condition ADR-120 exists to fix. |

### 3.3 What does NOT revert cleanly

**Seven change classes. Each needs a pre-release decision, not a post-incident one.**

---

**(1) T-107a/b/c — the auth credential cutover** · R3.1

Reverting the server code does not un-mint the credentials already issued. Users holding a new-shape httpOnly session cookie meet an old-shape verification path that does not understand it. Cookie name and flag changes persist in browsers until expiry regardless of what the server does.

*Consequence:* **rollback costs a second forced re-authentication.** Rolling back is not free and is not invisible — it is a repeat of the disruption the cutover caused. Plan the forward-fix path as the default response, with revert as the last resort.

*Pre-release requirement:* the cookie-clearing path must work independently of the verification path, so a rollback can invalidate stale credentials rather than leaving users in a broken middle state.

---

**(2) T-108b — index and rules deployment** · R5.1

Firestore rules and indexes are **project state, not repository state**. Deploying rules replaces the live ruleset; rollback means redeploying the previous ruleset, which only works if it was captured first. Composite index creation and deletion are **asynchronous** and not atomic with any code revert — a dropped index takes time to rebuild, during which the queries depending on it fail.

*Consequence:* the index/rules deploy is sequenced ahead of the code that needs it (§2.2 #7), and the previous ruleset is captured before any deploy.

---

**(3) T-108c/d — notification data-shape changes** · R5.1

The single most consequential entry on this list.

- Documents written during the window are written in the **new shape**. Reverting the code restores the old read path; it does not rewrite those documents.
- Removing the `isUnread()` legacy fallback and the dual read path means **legacy-shaped documents stop being readable**. If the backfill never ran, those documents become invisible to users — ADR-108 names this outcome explicitly as the reason the removal is gated.
- Removing the legacy composite indexes is subject to (2) above.

*Consequence:* this is why Q-5 and NQ-1 are hard gates and why the standing default is **retain**. There is no "try it and roll back" here — a rollback restores the code but not the interim writes, and cannot restore the user trust lost by notifications disappearing.

---

**(4) T-116b/c — telemetry activation** · R2.2

Events transmitted to Sentry and PostHog **cannot be unsent.** Reverting stops future collection; it does not retract what was already collected. Project and account creation at both vendors is external state that a git revert does not touch.

*Consequence:* the privacy-posture question in §1.1 (R2.2) is settled **before** activation, not after. Activation is a one-way door for the data already through it.

---

**(5) T-119d — `fanOutNotifications` deletion** · R5.2

Deleting the callable from the repository is a git revert. Deleting the **deployed** function from the Firebase project is out-of-repo state — restoring it requires a redeploy, and any Cloud Tasks queue state associated with it is not restored by that redeploy.

*Consequence:* T-119d is the one ADR-119 deletion with a deployed-artifact component. It is verified against the live function inventory (Q-6) before deletion, not just against the repo's zero in-repo callers.

---

**(6) T-118b — `APP_ID` unification** · R1 · **conditional, and this one is easy to miss**

T-118b replaces the dual-env-var split (`NEXT_PUBLIC_APP_ID` for the app, `NOTIFICATIONS_APP_ID` for functions, each with its own default literal) with one derivation. **If the two values currently agree in the deployed environment, this is inert config cleanup.** If they differ — the silent tenant-split failure mode named in TD-16/R-14 — then unifying them **repoints one package at a different `artifacts/{APP_ID}` partition.** Documents written before the change live under the old ID; documents written after live under the new one. **No code revert reunites them.**

Which world is real cannot be determined from the repository. It depends on production environment configuration — Q-1 and Q-6.

*Consequence, and it is uncomfortable:* **R1, the "safe internal foundations" release, contains a latent data-partition change whose severity is unknown.** The mitigation is a pre-release check (§4.2) and, if the values differ, opening ledger row LDG-15 and treating T-118b as a data migration rather than a config task. This is exactly why kernel rule 4 places Q-1 in Wave 1's readiness rather than a later wave.

---

**(7) T-114d, alternate branch only — a new analytics writer** · R3.2

The **default** branch (remove the `analytics_daily` / `metadata/counters` read paths) reverts cleanly — read-side only. The **alternate** branch, taken if Q-9 reveals or a decision creates a real producer, means writing new documents in a new shape. Those documents persist through any code revert.

*Consequence:* the branch choice is a release-gating decision, not an implementation detail. Only one of the two branches is reversible.

### 3.4 The near-miss: R4.2 at the wrong granularity

T-106a/b/c/d individually revert cleanly, and the unit as a whole reverts cleanly. **A partial revert does not.** Reverting T-106d (removal of the superseded clients) after T-106b/c have migrated their call sites leaves call sites pointing at a client that no longer exists in the shape they expect. Reverting T-106b while keeping T-106d leaves migrated call sites with no client at all.

Not on the non-reverting list — but it is the change most likely to be reverted badly under pressure. Recorded here so the release runbook says *revert the unit* and not *revert the bad commit*.

### 3.5 What this implies for ordering

1. **Non-reverting units ship last within their wave**, after everything revertible in that wave is merged and stable. R3.1 is Wave 3's final merge.
2. **A non-reverting unit never ships ahead of its verification capability.** R5.1's gated half waits for Q-5/NQ-1 — not because the code is hard, but because the verification is impossible without them.
3. **R2.1 precedes every unit containing a non-reverting change to a write path.** If you cannot roll it back, you must be able to test it forward.
4. **R1's T-118b needs its pre-release check run before merge**, which makes an "ungated" Wave-1 task quietly dependent on Q-1. Named here so it is not discovered at deploy time.

---

## 4. Verification per release

### 4.1 The five suites

The five-suite topology is affirmed as the target testing architecture and is unchanged by this plan: **unit** (node) · **real-browser component** (Vitest Browser Mode) · **app emulator + rules** · **functions emulator** · **E2E** (Playwright against emulator + dedicated server). The existing pre-commit gate — lint + format + full build — runs on every PR in every unit and is not restated per row.

| Unit | Unit | Browser | App emu + rules | Functions emu | E2E | Verifiable **only** in a real environment |
|---|:--:|:--:|:--:|:--:|:--:|---|
| **R1** | ● | | ● | ● | **●** | **`APP_ID` value comparison** (Q-1/Q-6) — see §4.2. Allowlist behavior is E2E-provable against the dedicated server. |
| **R2.1** | **●** | ● | **●** | ● | | Whether the newly-reported failures actually reach an observer — depends on R2.2 (Q-4). |
| **R2.2** | | | | | | **Everything.** No suite gates this unit; it is credentials and configuration. Verified only by an error appearing in a real Sentry project and an event in a real PostHog project. |
| **R3.1** | ● | ● | ● | | **●** | **Cookie `Secure`/`Domain`/`SameSite` behavior over HTTPS on the real host.** Emulators and localhost cannot prove these. Needs Q-1 **and** Q-2. |
| **R3.2** | ● | ● | **●** | | ● | Whether the query bound truncates real result sets — depends on production public-deck volume (NQ-6). |
| **R4.1** | **●** | ● | **●** | ● | | Whether any live user flow writes payloads the new schemas reject. Also: T-115b's notification target ships **report-only** here and must not be counted as a passing check until it flips in R5.1 (01 §5.4). |
| **R4.2** | ● | | **●** | **●** | **●** | Whether real admin custom claims match what the permission metadata expects (Q-10 territory). |
| **R5.1** | ● | ● | **●** | **●** | ● | **Legacy-document presence (Q-5) and index/rules deploy state (NQ-1).** Neither is emulator-observable. See §4.5. |
| **R5.2** | ● | | ● | ● | ● | **Live function inventory** for `fanOutNotifications` (Q-6); **whether production documents carry the 7 dormant kinds** (Q-8). |
| **R6** | ● | **●** | | | ● | Nothing. R6 is fully verifiable pre-deployment. |

● = applies · **●** = the tier that carries the primary weight for that unit.

### 4.2 R1's production dependency

Before T-118b merges, one check must run in the target environment: **do `NEXT_PUBLIC_APP_ID` and `NOTIFICATIONS_APP_ID` resolve to the same value?**

- **Same** → T-118b is inert cleanup. Proceed. No ledger row.
- **Different** → T-118b is a data-partition migration. Open LDG-15, re-plan T-118b as a migration with its own end state, and do **not** ship it inside R1.
- **Cannot be determined** (Q-1 unanswered — the current state) → T-118b ships with an explicit recorded assumption that the values agree, or is held out of R1. **Holding it out is the recommended default**, because the failure mode is silent: a tenant split produces no error, only data written to a partition nobody reads.

### 4.3 Production verification is currently blocked

**Q-1 — which Firebase project is production, and what is its provisioned state — is unanswered.** There is no `.firebaserc`, the project IDs in the repo are demo-only, and configuration is env-driven with lazy credentials. Nothing in the repository substitutes for this; `07` classes it verified-absent.

Q-1 gates *verification* of AD-06, AD-07, AD-08, AD-14, AD-16, and AD-18 — the widest blocking footprint of any question in the catalogue. Concretely, for this release plan:

| Blocked | Unit | What cannot be established |
|---|---|---|
| Cookie flag behavior on the real host | R3.1 | Whether `Secure`/`Domain`/`SameSite` behave as intended — cookie semantics are host-dependent, and the host is also unknown (Q-2) |
| `APP_ID` agreement | R1 | Whether T-118b repartitions data (§4.2) |
| Legacy notification documents | R5.1 | Whether collapsing the dual read path hides real user data |
| Index and rules deploy state | R5.1 | Whether the runbook's "NOT yet deployed" note is still current (NQ-1) |
| Live function inventory | R5.2 | Whether `fanOutNotifications` is deployed and invoked by an operator (Q-6) |
| Telemetry reaching a real project | R2.2 | Whether errors are observed at all (Q-4) |
| Analytics producer existence | R3.2 | Which of Q-9's two branches is real |

**Stated plainly: the five test suites can prove this plan's code correct. They cannot prove it correct *against production*, because production is not currently identified.** Every unit is releasable in the §0 sense; **R3.1, R5.1, and R5.2 are not safely deployable** until Q-1 answers. That is a fact about the environment, not a defect in the plan.

### 4.4 What the emulators can and cannot prove for R5.1

Worth separating, because it is easy to over-trust a green emulator suite here.

**Can prove:** the code handles both document shapes correctly · the queries are well-formed · the rules permit and deny what they should · delivery is idempotent · the union covers all 10 written values and a non-exhaustive switch fails typecheck.

**Cannot prove:** which shapes exist in production · whether the backfill ran · whether the indexes are built · whether the rules currently deployed match the ones in the repo.

The emulator answers *"is the code right?"*. Q-5 and NQ-1 answer *"is it safe to remove the other half?"*. A green suite is necessary and nowhere near sufficient.

### 4.5 R5.1's release-time sequence

0. Land T-108a (union widening) and **flip T-115b's notification target from report-only to failing**. Both are schedulable now; neither touches the compatibility machinery.
1. Establish the current deploy state of the notification indexes and rules (**T-108b**, gated NQ-1).
2. Capture the currently-deployed ruleset so a rollback target exists (§3.3 (2)).
3. Sample production data for legacy-shaped documents (**Q-5**).
4. Deploy indexes. **Wait for the build to complete** — this is asynchronous and is not instant.
5. Deploy rules.
6. Deploy app code.
7. **Only then** collapse the dual read paths and remove the `@deprecated` fields (T-108c/d).
8. Advance LDG-01 to its end state (T-108e).

Step 0 is the part that ships without anyone answering anything. Steps 1 and 3 are the gates. Steps 4–7 out of order produce failing queries or hidden documents.

### 4.6 R5.2's pre-deletion checks

Each deletion confirms its surface is dead against something better than the repository, because the repository is what already reports it as zero-producer:

| Task | Confirm before deleting |
|---|---|
| T-119a (7 kinds) | No production notification documents carry any of the 7 kind values (Q-8 / [DATA]) |
| T-119b (8 actions + LogSource) | No production `system_logs` entries carry them; the kana-practice gap resolves in the direction the gate answers (Q-11) |
| T-119c (admin UI) | Confirmed inert — verified in-repo; the gate is product intent, not existence (Q-13) |
| T-119d (fan-out) | **Not deployed, or deployed and never invoked** (Q-6 / [GCP]) — the only one with deployed state |
| T-119e (Storybook) | No active adoption claimed (Q-17 / [INTENT]) |

---

## 5. Deployment constraints

### 5.1 Hosting is OPEN

Restating §0 because it governs everything in this section: **Q-2 is undecided, T-118d is `[OPEN]` and not schedulable, and until a hosting decision is made and recorded as an ADR, none of these units can be deployed anywhere.**

`SITE_URL`'s localhost fallback stands until then, which means sitemap, robots, OG tags, and metadata are all built against localhost. `07` is explicit that this is a decision to make, not a fact to find — no investigation clears it.

**What this plan can do without Q-2:** produce ten verified, revertible releases on `main`, each proven against the five suites and the emulators.
**What it cannot do:** deploy any of them, or verify the host-dependent behavior in R3.1.

### 5.2 Two-package deploy topology

Two deployable code artifacts, plus a third non-code artifact:

| Artifact | Contents | Deployed how |
|---|---|---|
| **app** | Next.js application, edge proxy, server actions | Per the hosting decision (**undecided**, Q-2) |
| **functions** | Cloud Functions package — the digest writer, `fanOutNotifications` | Firebase project |
| **Firestore rules + indexes** | `firestore.rules`, composite index definitions | Firebase project — **versioned in-repo, applied out-of-repo** |

**Three shared contracts cross the app/functions boundary**, and each is a deploy-ordering constraint:

1. **`APP_ID` derivation** (T-118b) — **must flip in both packages together.** Any window where one package has the new derivation and the other has the old is a live tenant split: writes land in one partition, reads look in another, and **nothing errors.** TD-16/R-14 name this failure mode as silent, which makes it the worst kind. If the two packages cannot be deployed atomically, the change is staged through a transition period where both IDs are read and one is written — which makes it a migration with a ledger row (LDG-15), not a config change.
2. **Notification document shape** (T-108c/d) — the functions package writes digest documents; the app reads them. Deploy the **tolerant reader before the narrowed writer**, always.
3. **Notification vocabulary** (T-108a) — the app is the reader of values the functions package writes. Widen the app's union **first**; it is backward-compatible in that direction and breaking in the other.

**General rule: for any contract change, the tolerant side deploys first.** Widening reads before narrowing writes; never the reverse.

### 5.3 The notification index and rules deploy — NQ-1

`docs/testing-notifications.md:30` carries a heading stating the notification indexes and rules are **"NOT yet deployed."** Whether that is still true is **NQ-1**, and `07` puts the risk precisely: a stale note that outlived a deploy would be worse than no note at all.

**What this means for releasing the notification migration:**

- **Nothing in R5.1's gated half ships until the actual deploy state is established** (T-108b). The runbook note is evidence, not a fact.
- If the indexes genuinely are not deployed, then production is currently serving notification queries **without** the composite indexes the migrated code expects — which is itself a finding worth surfacing at that moment, independent of this plan.
- The deploy is **asynchronous**: index builds take time proportional to collection size and complete after the deploy command returns. Code depending on a new index must not go live until the build reports complete. This is why §4.5 has an explicit wait step.
- Rules deploy **replaces** the live ruleset atomically. Capture the current ruleset first (§3.3 (2)) or there is no rollback target.
- The standing default while NQ-1 is open is **retain** the dual indexes, queries, and fields. Retention costs a two-schema tax. Removal without confirmation costs user-visible data loss. The asymmetry is why the default is what it is.

### 5.4 Environment configuration

T-118c produces `.env.example` documenting the ~30 referenced environment variables — the first artifact from which a fresh environment can be stood up from the repo alone. It is a prerequisite for any deployment, and a direct bus-factor mitigation for a repository whose 140 commits are single-author.

**It documents the surface; it does not provision it.** Knowing that 30 variables exist is not knowing their production values. That remains Q-1/[ENV].

---

## 6. Release checklist template

Copy per release unit. Every line is answerable — no line reads "verify it works."

```
RELEASE UNIT:  R__            WAVE: __            DATE: ________
TASKS:         T-___, T-___, ...
LEDGER ROWS TOUCHED:  LDG-__, ...

-- GATES ------------------------------------------------------------
[ ] Every gate on this unit is answered, OR its EXECUTABLE fallback is
    recorded as executed in its ledger row (09 §1.2-1.3)
[ ] No task with an INACTION fallback is included in this release
    (T-115c, T-108b, T-108c, T-108d — these cannot be worked unanswered)
[ ] Gate answers received since the last release do not contradict any
    default already executed  (if they do: log rework, 09 §6.3)

-- CODE READINESS ---------------------------------------------------
[ ] All tasks in the unit are DONE — no partial convergence (kernel:
    no half-migrated boundary, no partially-converged client)
[ ] Pre-commit gate green on every constituent PR: lint + format + build
[ ] Every new lint rule is at `error`, not `warn`
[ ] Cross-cutting work folded, not deferred (CS-2 ceiling on touched
    files; raw-hex tokens in touched files)

-- VERIFICATION -----------------------------------------------------
[ ] Test tiers named for this unit in §4.1 are green
[ ] ALL five suites green at the wave boundary (if this closes a wave)
[ ] Real-environment items from §4.1 are either verified, or listed
    below as knowingly unverified with the reason

    Unverified, and why: _______________________________________

-- ROLLBACK ---------------------------------------------------------
[ ] Revert command identified AT UNIT GRANULARITY (§3.1)
[ ] Unit checked against the §3.3 non-reverting list
[ ] If it contains a non-reverting change:
      [ ] the specific irreversibility is named here: ______________
      [ ] forward-fix path defined (preferred over revert)
      [ ] pre-release state captured (previous ruleset / current data
          sample / config snapshot)
[ ] Rollback rehearsed where the unit permits it

-- DEPLOY (blocked until Q-2 answers — see §5.1) --------------------
[ ] Deploy order across the two packages respects §5.2's shared
    contracts: tolerant side first
[ ] Firestore rules/indexes: previous ruleset captured; index build
    confirmed COMPLETE before dependent code goes live
[ ] `APP_ID` verified identical across both packages post-deploy

-- COMMUNICATION (§7) -----------------------------------------------
[ ] Audience determined: users / admins / team / silent
[ ] Notice drafted and sent, or "silent" recorded as a decision
[ ] Changes that will READ as regressions are explained (honest-UI
    zeros, shorter bounded lists, newly-visible errors)

-- LEDGER (ADR-120) -------------------------------------------------
[ ] Every ledger row this unit advanced has its current stage moved
[ ] Rows reaching their end state are closed
[ ] No staged change landed in this unit without a ledger row
[ ] Review-by dates still correct for rows that remain open

-- SIGN-OFF ---------------------------------------------------------
Released by: ____________   Rollback owner: ____________
Progress table (09 §3) updated: [ ]
```

---

## 7. Communication

### 7.1 Per-unit audience

| Unit | Audience | Notice | What to say |
|---|---|---|---|
| **R1** | Silent | — | One caveat: if the allowlist unification changes which paths redirect versus splash, and that path is user-facing, it needs a line. Determine at release, not in advance. |
| **R2.1** | Silent, with a caveat | — | If support volume rises after release, the cause is likely **newly-visible failures that were previously silent**. Brief whoever handles reports *before* shipping, or the release looks like it broke something. |
| **R2.2** | Product owner, pre-release | **Decision, not notice** | Third-party analytics on real users is a privacy-posture call, not just a credentials one, and T-116c's criteria make the analytics *scope* part of the same decision. Settle both before activation — the data is irreversible once sent (§3.3 (4)). **Assign Q-4 to a person first**: it is the one gate with no owner row in the source corpus, so "nobody decided" is its most likely outcome unless someone is named. |
| **R3.1** | **Users — required** | **Advance notice** | See §7.2. |
| **R3.2** | Admins / anyone reading dashboards | **Short note** | "Panels that showed 0 now show 'no data' — the zeros were never real. Some lists now show a capped number of results." Without this, three deliberate corrections read as three regressions. |
| **R4.1** | Silent, monitored | — | If form-submission failures rise, the cause is boundary validation now rejecting payloads that previously passed. Also: one ownership predicate is corrected — anyone administering shared decks may see a changed owner determination on that path. |
| **R4.2** | Silent | — | No intended visible change. Failure mode is loud (actions stop working), so monitoring covers it. |
| **R5.1** | Users, if the migration half ships | **Note** | Notification icons and labels change for six types that previously fell through generic handling — an improvement, but a visible one. |
| **R5.2** | Admins + team | **Short note** | Inert admin buttons and the Settings stub are removed (they never did anything). Team-facing: Storybook is gone. |
| **R6** | Admins | **Short note** | Reports gains sorting, selection, and filtering. That is a capability addition inside a release labelled "internal" — do not let the label suppress the note. |

### 7.2 R3.1 — the one release that needs real notice

**Every signed-in user is signed out at cutover and must sign in again.** That is not a side effect to mention in passing; for most users it is the entire visible content of the release.

The notice should carry:

1. **When** — the cutover window.
2. **What they will experience** — signed out once, sign in again, done.
3. **Why** — the session credential becomes httpOnly and server-verified; it is a security improvement, and the credential is no longer readable by page scripts.
4. **A genuine benefit** — the "page loads but every action fails" state, caused by a 7-day cookie wrapping a 1-hour token, stops happening.
5. **What to do if sign-in fails** — a real contact path, staffed during the window.

**And the honest complication: who to notify is itself unknown.** Q-1 is unanswered, so which project is production — and therefore which users exist — is not established. **The notification plan for R3.1 is contingent on Q-1**, exactly like the release's verification (§4.3). If Q-1 answers and the production project has no real users, the notice requirement dissolves and R3.1 becomes silent. That is a legitimate outcome; assuming it without the answer is not.

### 7.3 The standing communication rule

**Three releases in this plan make the product look worse while making it more truthful:** R2.1 (silent failures become visible), R3.2 (fabricated zeros become honest absences, unbounded lists become bounded), R4.1 (permissive writes become validated).

Each is a correction. Each will be read as a regression by anyone not told. **Where a release replaces a comfortable fiction with an uncomfortable fact, say which fiction and which fact** — otherwise the plan's most principled work generates its worst feedback, and the pressure to revert lands on exactly the changes that should stay.
