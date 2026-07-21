# 03 — Sprint Plan

**Implementation Planning phase.** This document breaks the six fixed waves of the plan kernel into two-week sprints sized for **one developer**. It is **derived-from-decisions planning**, not backlog validation: `engineering-tasks/` and `requirements-consolidation/` do not exist (deleted before the discovery phase, never committed, unrecoverable), so every sprint below traces **task → ADR → driving findings → corpus**, and **no requirement-ID or recommendation-ID is cited** — those documents are absent and their IDs cannot be reconstructed.

- **Binding input:** the plan kernel (task set, sizes, wave assignment, critical path, gate rules — all fixed here, never re-sized or renumbered).
- **Source of truth:** `architecture-decision/` — success criteria from `03-Architecture-Decisions.md`, PR-level rules from `04-Coding-Standards.md`, gates and defaults from `07-Open-Questions.md`.
- **No repository rescan** was performed for this file. Scope descriptions come from the ADR/corpus text, not from reading `src/`.

---

## 1. Planning assumptions (fixed by the kernel)

| Assumption | Value | Source |
|---|---|---|
| Team size | **1 developer** | corpus R-12 / W-6 — all 140 commits single-author; bus factor 1 |
| Sprint length | **2 weeks** (10 working days) | kernel |
| Size scale | **S ≤ 1d · M 2–4d · L 5–8d · XL > 8d (must be split — none remain)** | kernel |
| Parallelization | **marked, never assumed** — the plan is valid at team size 1 | kernel |
| Standing gates | pre-commit gate (lint + format + full build) and the five-suite test topology apply to **every** PR | kernel; S-10/S-11 |
| Sprint exit | **every sprint ends deployable** — no half-migrated boundary, no partially-converged client, no broken gate | kernel |

### 1.1 Capacity: why ~8 days of task load per 10-day sprint

**The task set is 63 tasks, not the 50 the kernel's heading states** (see §10.1). The sizes below are the backlog's, unchanged: **19 S · 29 M · 14 L · 1 unsized-Open (T-118d)** — a nominal **147–247 developer-days** at team size 1.

Planning points: **S = 1d, M = 3d (midpoint of 2–4), L = 6d (lower-middle of 5–8)**, giving **190 planning-days** — inside the nominal band, slightly below its midpoint. That is deliberate: the band's upper half assumes every M and L lands at its worst case, which is a schedule to plan *reserve* against, not a schedule to commit to. Each sprint is loaded to **at most 8 days**, holding back ~2 days (20%) of a 10-day sprint. That reserve is not padding; it is consumed by four named costs this repository actually imposes:

1. **The pre-commit gate runs lint + format + a full build on every commit.** On a repo of this size that cost is paid dozens of times per sprint and is not modelled in any task size.
2. **Review and rework on a single-author repo.** With one developer there is no reviewer queue, but there *is* self-review, CI turnaround, and post-merge fixes. The five suites (unit / browser / emulator / functions / E2E) are slower than a single unit run; the emulator tier carries a JDK dependency (R-15).
3. **Question-resolution work.** The kernel is explicit that answering gates is scheduled work, not a wish. Each gated sprint carries a question-resolution item budgeted at **≤ 0.5 d** of chasing (write the question, route it to its answering class, record the answer or the fallback in the ledger). Investigation work that is *not* in the fixed task set (the [REPO]-class audits NQ-11/NQ-12/NQ-13) is deliberately **not** scheduled here.
4. **L-size variance.** An L is 5–8 d but planned at 6 d. A sprint carrying one L can therefore run up to 2 days long — exactly the reserve. **Invariant enforced throughout: no sprint carries two L tasks.** Every L-heavy sprint is a single-L sprint.

Sprints below 8 days of load are **deliberate isolation slack**, not under-planning: the kernel forbids mixing a wide-surface refactor with unrelated risky work, so the wide-surface sprints (S3, S9, S12, S16, S19, S27) carry one workstream and nothing else. The utilization figure — 190 task-days over 29 sprints = **6.6 d/sprint against 8 d capacity (82%)** — is the price of that rule and is stated rather than hidden.

### 1.2 Total duration

**190 task-days · 29 sprints · 58 weeks ≈ 13.5 calendar months** at team size 1, starting from the current `main` (`a0bbbc4`).

Wave totals (planning points): Wave 1 = 31 d · Wave 2 = 32 d · Wave 3 = 32 d · Wave 4 = 42 d · Wave 5 = 29 d · Wave 6 = 24 d.

With a second developer taking the marked parallel track in every sprint where one exists, the indicative compression is to roughly **19–21 sprints (~9–10 months)** — *indicative only*. It is not a commitment and the plan does not depend on it: the wide-surface sprints (S3, S12, S16, S19, S27) cannot be parallelized within their own workstream, so a second developer is spent on *adjacent* work, not on the same files.

### 1.3 Sequencing rationale (carried from the kernel)

Ledger and boundaries first, because every later change is staged work that needs enforcing and recording. **Coverage before convergence**, because ADR-106/108/109 rewrite exactly the paths that are currently untested. Security and data before contracts, because they are user-facing correctness. Gated work late, so answers have time to arrive. Placement and pattern moves last, because they cause the widest merge conflicts and want a quiet codebase.

**Critical path (fixed):** T-120a → T-101a → T-101b → T-101c → T-102a → T-102b → [T-117a/b/c] → T-116a → T-107a → T-107b → T-106a → T-106b → T-109a → T-108a/d → done. It runs through Sprints 1 → 23. Everything else hangs off this spine or is gate-bound.

**The path terminates in a gated task** (backlog §5.5): T-108d is Q-5-gated, so the critical path cannot complete on in-repo work alone. This plan therefore treats the path as **ending at T-108a in Sprint 21**, with **T-108d (Sprint 23) as a gate-bound tail**. Q-5 is opened in Sprint 19 for exactly this reason — so the tail is not what determines the schedule.

---

## 2. Sprint overview

Load is planning points (S=1 / M=3 / L=6). **G** = sprint contains gated work and is **NOT READY** until its question answers or its fallback is invoked.

| # | Wave | Goal (one line) | Load | Cx | Risk | G |
|---|---|---|---:|:--:|:--:|:--:|
| 1 | 1 | Staged work becomes recordable, and the live public-route divergence closes | 8 | Low | Med | — |
| 2 | 1 | Config is single-sourced and every feature publishes a public API | 8 | Low | Low | — |
| 3 | 1 | Every cross-feature import goes through a root barrel | 6 | Med | Med | — |
| 4 | 1 | Boundaries become lint-enforced and the flashcard↔notifications cycle breaks | 8 | High | Med | — |
| 5 | 2 (+W1 tail) | The cycle rule is enforced and the two highest-risk pure units get tests | 7 | Low | Low | — |
| 6 | 2 | Flashcard data services gain a regression net | 6 | High | Low | — |
| 7 | 2 | Every ruled collection appears in the rules suite | 6 | Med | Low | — |
| 8 | 2 | The four zero-coverage features stop being a category | 6 | Med | Low | — |
| 9 | 2 | Failures of real state stop vanishing, and observability activates | 8 | Med | Med | **G** (Q-4) |
| 10 | 3 | The app can mint and server-verify an httpOnly session credential | 6 | High | High | — |
| 11 | 3 | The raw ID-token cookie is gone and auth is regression-tested end to end | 7 | High | High | — |
| 12 | 3 | One user-progress listener serves all consumers | 6 | High | Med | — |
| 13 | 3 | Realtime reads are bounded and exports stop inventing zeros | 7 | Med | Med | — |
| 14 | 3 | Admin dashboards render absent data as absent | 6 | Med | Low | **G** (Q-9) |
| 15 | 4 | One verified-identity action client exists with a live consumer | 6 | High | Med | — |
| 16 | 4 | Every admin server action runs on the unified client | 6 | Med | High | — |
| 17 | 4 | The second action client is gone and vocabulary agreement is machine-checked | 7 | Med | Med | — |
| 18 | 4 | Deck-access has exactly one implementation, and the divergent one is corrected | 6 | High | High | — |
| 19 | 4 | Every server write path validates at its boundary | 6 | High | Med | — |
| 20 | 4 | Forms standardize and no schema claims a protection it lacks | 8 | Med | Med | **G** (Q-12) |
| 21 | 5 (+W4 tail) | The notification type stops lying; the two ops-answerable gates close | 8 | Med | Med | **G** (NQ-1, Q-10) |
| 22 | 5 | Production verdicts land for legacy notification data and the fan-out callable | 6 | Low | Med | **G** (Q-5, Q-6) |
| 23 | 5 | The notification migration closes: one read path, one index set | 6 | High | High | **G** (Q-5) |
| 24 | 5 | Dormant notification and logging vocabulary is resolved | 6 | Low | Low | **G** (Q-8, Q-11) |
| 25 | 5 | Inert admin surfaces and the one-story toolchain are resolved | 6 | Low | Low | **G** (Q-13, Q-17) |
| 26 | 6 | Feature UI lives feature-side, and pagination is capped at its two mechanisms | 7 | Low | Low | — |
| 27 | 6 | Flashcard has named sub-modules behind a curated public API | 6 | High | Med | — |
| 28 | 6 | Internal boundaries and the file-size ceiling become enforceable | 5 | Med | Low | veto (NQ-3) |
| 29 | 6 | "Admin grid" has one behavior contract | 6 | High | Med | — |
| | | **Total** | **190** | | | |

**Gated sprints:** 9, 14, 20, 21, 22, 23, 24, 25. Sprints 21–25 (all of Wave 5, holding 8 of the backlog's 16 gated tasks) are **expected to be NOT READY** until their questions answer; each carries the kernel's standing fallback so the sprint is executable on the default rather than blocked indefinitely. **Sprint 28 is not gated** — NQ-3 is closed-by-decision with an owner-veto window, so T-110b is Ready on its default (backlog §5.3).

---

## 3. Wave 1 — Platform Foundations (Sprints 1–4, +T-102c tail in Sprint 5)

*Releasable outcome of the wave: boundaries lint-enforced, config single-sourced, the feature cycle broken, the ledger live.*

### Sprint 1 · Wave 1

**Goal.** Staged work becomes recordable in-repo, and the public-route allowlist stops disagreeing with itself.

**Tasks (8 d).** T-120a S(1) · T-120b M(3) · T-120c S(1) · T-118a M(3)
*Traceability:* T-120a/b/c → **ADR-120** (staged work records its completion state) ← RC-2/RC-3/RC-5/RC-6/RC-7/RC-10 collapse to one meta-cause; cluster C16; docs-index omission W-21(d)/TD-13. T-118a → **ADR-118** ← W-20(a) (the "mirrors the proxy list" comment is provably false), NQ-2 resolved-by-decision toward *defect*.

**Deployable value at sprint end.** A migrations ledger exists in-repo with a row for every in-flight staged change (notification migration, gated dispositions, in-progress convergences), each carrying intended end state / current stage / owner / review-by. The docs ADR index lists every ADR on disk. And one **user-visible defect closes**: public routes are now admitted identically by the edge proxy and the client AuthGate, so no "public" page is hidden behind the auth splash and no splash-bypass exists.

**Complexity: Low.** Ledger work is documentation with a fixed schema; the allowlist collapse is one small module plus two consumers.

**Risk: Medium.** The allowlist is a *live behavioral* change on the auth boundary — the two lists are currently unequal, so unifying them necessarily changes which routes render for signed-out users. Misjudging the canonical set either exposes a private route or breaks SEO/OG rendering. Mitigation: the change ships as two PRs (neutral consolidation, then the behavior switch) and the E2E public/protected route pass is the acceptance evidence.

**Parallel opportunity.** A second developer takes T-118b + T-118c (APP_ID unification and `.env.example`) from Sprint 2 — disjoint files, no shared surface with the ledger or the allowlist.

**Merge-conflict profile. Narrow.** New `docs/` ledger file; the route-allowlist module; `proxy.ts`; the AuthGate inside the composition root. Nothing in `features/`.

**Question-resolution items.**
- **Q-1 — which Firebase project is production, and what is its provisioned state?** [GCP]+[ENV]. Opened here per the kernel: Q-1 gates *verification* of ADR-106/107/108/114/116/118 and therefore belongs to Wave 1's readiness, not to a later wave. Fallback while open: decisions proceed on their fixed directions; only production *verification* waits. Record Q-1's status as a ledger row in T-120b.
- **Q-4 — do production Sentry/PostHog credentials exist, and what analytics scope was intended?** [GCP] (credentials/ownership) + [INTENT] (scope). **Assigned an owner here, in Sprint 1, even though it does not bite until Sprint 9** — because backlog §5.2 establishes that **Q-4 has no owner row anywhere in `07-Open-Questions.md`**. It is a real gate (the kernel gates T-116b/T-116c on it; ADR-116's status and the decision matrix both treat it as the live activation gate) that survives in the source only as an aside in NQ-14's row. If no sprint names it, nobody is assigned to answer it. Naming it here gives it eight sprints of lead time and a ledger row; Sprint 5 re-affirms it as Wave 2's opening item.
- **Q-2 — hosting target / canonical URL.** [Decision, not fact.] T-118d is `[OPEN]` and **not schedulable**. Record it in the ledger with the `SITE_URL` localhost-fallback hazard flagged, per ADR-118's success criteria. Do not invent a URL.

---

### Sprint 2 · Wave 1

**Goal.** Configuration has one source per value, and every feature publishes a public API surface.

**Tasks (8 d).** T-118b M(3) · T-118c S(1) · T-101a M(3) · T-103a S(1)
*Traceability:* T-118b/c → **ADR-118** ← W-20(b)/TD-16/R-14 (two `APP_ID` derivations silently split app and functions across two tenant roots), W-20(c)/TD-13 (~30 env vars, no `.env.example`). T-101a → **ADR-101** ← W-3 (2 of 9 features expose a root barrel). T-103a → **ADR-103** ← W-2/RC-12 (`lib/logging/public.ts` imports its vocabulary from `features/admin`).

**Deployable value at sprint end.** App and Cloud Functions can no longer diverge onto two tenant roots from one mis-set env var. A new environment is stand-up-able from `.env.example` instead of by grepping source — a direct mitigation of the bus-factor-1 amplifier (W-6). All 9 features expose a root barrel (additive: deep imports still resolve, so this is a **stable intermediate state**). `lib/logging` owns its own vocabulary and is extractable without the admin feature.

**Complexity: Low.** Barrel authoring is curation, not restructuring; the log-type relocation is a mechanical import rename wave across admin.

**Risk: Low.** Every change is additive or type-only. The one thing to watch is barrel scope — an over-broad `export *` root barrel degenerates into "everything is public" (ADR-101's named trade-off). Acceptance: the root barrel is a *curated export list*, reviewed as a contract.

**Parallel opportunity.** Second developer authors barrels for 7 of the 9 features while developer 1 handles `APP_ID` (which touches both deploy units) and the logging relocation. Barrel files are one-per-feature and do not collide.

**Merge-conflict profile. Moderate.** Nine new `features/*/index.ts` files (additive, non-colliding); `functions/` + app env derivation; `lib/logging/*`; `features/admin/types` and its consumers.

**Question-resolution items.** None gated. Carry Q-1's status forward in the ledger. Per T-118b's acceptance criteria, **production agreement of the APP_ID vars is verified by Q-6 before the old variable retires** — so this sprint lands the single derivation and records a verification-pending ledger row; it does not claim production confirmation the repo cannot provide.

---

### Sprint 3 · Wave 1

**Goal.** Every cross-feature import in the repository goes through a root barrel.

**Tasks (6 d, isolation sprint).** T-101b L(6)
*Traceability:* → **ADR-101** ← W-3 (43 sites import `flashcard/types`, 9 reach `games/match/config`, 4 import `ShareModal`, 4 reach `flashcard/utils/rbac`); CX-4 (barrels deliver their cost while only partially delivering their promise).

**Deployable value at sprint end.** Feature internals become privately refactorable: renaming `games/match/config` stops being a repo-wide change. This is the enabling precondition for Sprints 27–28 (flashcard sub-modules) and for ADR-104 generally. Behavior is unchanged — the entire sprint is import-statement rewrites.

**Complexity: Medium.** Mechanically simple, wide in extent, with judgment needed wherever a deep import reveals that the barrel does not yet export what the consumer needs (each such case is a public-API decision, not a rename).

**Risk: Medium.** Two specific hazards: (a) a barrel that re-exports a module with side effects changes import order and can alter initialization; (b) circular-import surfacing — routing everything through barrels can expose latent cycles that direct imports hid. Mitigation: migrate by import cluster (one PR per cluster), full build on every commit via the existing gate.

**Parallel opportunity.** **Not within this workstream** — import-only diffs across the same files conflict badly. The productive parallel track is to pull Wave 2's test-only work forward: a second developer starts T-117a/T-117b (SRS math, `resolveRole`) in test files that this sprint never touches.

**Merge-conflict profile. WIDE — flag.** 55+ import sites spread across every feature. This sprint holds a repo-wide lock on import statements. No other structural work may land concurrently; this is why the sprint carries one task and 2 days of slack.

**Question-resolution items.** None gated.

---

### Sprint 4 · Wave 1

**Goal.** The boundaries become machine-enforced, and the repository's only feature-level cycle breaks.

**Tasks (8 d).** T-101c S(1) · T-103b S(1) · T-102a M(3) · T-102b M(3)
*Traceability:* T-101c/T-103b → **ADR-101/ADR-103**, CS-9 (ESLint import-boundary rules; the audio boundary S-15 is the in-repo precedent for enforcement that holds). T-102a/b → **ADR-102** ← W-1 (the only feature-level value-import cycle), RC-1 (the write side has an inversion point; the render/act side has none, so the lattice risk compounds with every actionable kind).

**Deployable value at sprint end.** A deep cross-feature import now **fails lint at the keyboard** with a message naming the ADR; a synthetic `lib → features` import fails lint. `features/notifications` imports no feature: the invite accept/decline flow runs through a registry seam with flashcard's handler registered at the composition root, so notifications is independently buildable, testable and extractable. The user-visible surface (invite actions in the inbox) is unchanged and must be verified so.

**Complexity: High.** The seam is genuine design work, not a move: it introduces a kind→handler registry, a composition-time registration path, and a new runtime failure mode (a kind rendered with no registered handler) that ADR-102 requires be handled explicitly — render-degraded **and reported**, per ADR-116's policy.

**Risk: Medium.** If a kind's handler fails to register, the inbox silently loses its action buttons. The fallback path must be explicit and reported, not a blank render. Acceptance: the invite accept/decline flow works end-to-end through the seam (observable on the existing realtime E2E path), and adding an actionable kind requires zero new imports from notifications into any feature.

**Parallel opportunity.** Second developer takes the two lint-config tasks (T-101c, T-103b) — `eslint.config.mjs` only — while developer 1 builds and rewires the seam. Clean file split.

**Merge-conflict profile. Moderate.** `eslint.config.mjs`; `features/notifications/` (public API, registry, `InviteActions`); `features/flashcard/actions/access.actions`; the composition root `lib/providers.tsx` gains registration wiring.

**Question-resolution items.** None gated. **Ordering rule applied:** T-101c and T-103b are lint-*enabling* changes and land only after their migration tasks (T-101b in Sprint 3, T-103a in Sprint 2) are on `main` — never enable a rule that fails. T-102c (the notifications→flashcard rule) is deliberately deferred to Sprint 5 for the same reason: the rule turns on one sprint after the migration it enforces.

---

## 4. Wave 2 — Safety Net (Sprints 5–9)

*Releasable outcome of the wave: high-risk logic under test, failures reported rather than swallowed.*
*Why here:* ADR-106/108/109 rewrite exactly the paths that are currently untested (TD-2, cost-of-delay High — "refactors either proceed blind or must pay for characterization tests first").

### Sprint 5 · Wave 2 (+ Wave 1 tail)

**Goal.** The cycle rule becomes enforced, and the two highest-risk *pure* units in the repo get direct tests.

**Tasks (7 d).** T-102c S(1) · T-117a M(3) · T-117b M(3)
*Traceability:* T-102c → **ADR-102**/CS-9. T-117a/b → **ADR-117** ← W-16/TD-2 (coverage inverted relative to risk: `progress.service`'s 335-line SRS math has zero tests; `resolveRole` is security-relevant, pure, 9 consumers, zero direct tests).

**Deployable value at sprint end.** The cycle cannot re-form: `features/notifications` importing any feature is a lint error. The SRS scheduling math and the sharing-RBAC resolver — the two units most likely to corrupt user data silently — have direct unit tests. `resolveRole` is now tested **before** Sprint 18 consolidates it, which is the explicit ordering ADR-117 calls for.

**Complexity: Low.** Both units are pure functions; the harness already exists (S-10). This is allocation, not tooling.

**Risk: Low.** Test-only plus one lint rule. The one real hazard is characterization drift — writing tests that lock in current *buggy* behavior. For `resolveRole` specifically, tests must encode the **engine's** `ownerId ?? userId` semantics (ADR-115), not the divergent `roles[uid]` reading that Sprint 18 will correct.

**Parallel opportunity.** Second developer takes T-117c (Sprint 6) concurrently — different service files, no overlap with domain tests.

**Merge-conflict profile. Narrow.** `eslint.config.mjs`; new test files only.

**Question-resolution items.**
- **Q-4 — re-affirmed as Wave 2's opening item** (owner assigned in Sprint 1; see there for why it needs an explicit owner at all). Four sprints ahead of T-116b/T-116c in Sprint 9, so an answer has time to arrive. Fallback if unanswered by Sprint 9: activation is **explicitly deferred with the reason logged in the ledger** — which is itself a satisfied success criterion of ADR-116, not a failure. The report-then-handle policy (T-116a) lands regardless and reports into the in-repo pipeline even if Sentry is a no-op.

---

### Sprint 6 · Wave 2

**Goal.** The flashcard data services — the money path — gain a regression net.

**Tasks (6 d, isolation sprint).** T-117c L(6)
*Traceability:* → **ADR-117** ← W-16 (the diff-based `lesson-save` batch writer, `card.service`, `comment.service`, `shared.service` are all untested); TD-2 (#2 debt, score 8).

**Deployable value at sprint end.** The diff-based batch writer that decides what a save adds, updates and deletes is covered, as are the card/comment/shared services. Every convergence in Waves 4–6 that touches these paths now has a net under it.

**Complexity: High.** These are the hardest units in the repo to test: live-deck diffing needs realistic fixture states, and the services need the emulator tier (JDK dependency, R-15) rather than pure unit isolation.

**Risk: Low to the product, Medium to the schedule.** No production code changes. The schedule risk is that emulator-tier tests for a diff writer are exactly the kind of work that overruns an L — which is why this sprint carries a single task and 2 days of reserve.

**Parallel opportunity.** Second developer takes T-117d (Sprint 7, rules suite) — a different suite entirely, zero file overlap.

**Merge-conflict profile. Near-zero.** New `*.test.ts` / `*.emu.test.ts` files.

**Question-resolution items.** None gated. Note: emulator-tier work is the first real exercise of the toolchain since the recent `user.service.emu.test.ts` fix (`a0bbbc4`); budget for harness friction inside the reserve.

---

### Sprint 7 · Wave 2

**Goal.** Every collection with a `firestore.rules` block appears in the rules suite.

**Tasks (6 d, isolation sprint).** T-117d L(6)
*Traceability:* → **ADR-117** floor 2 ← OP-24 (lessons/cards/comments sharing, `admins`, `system_logs`, `sharedProgress`, and the collection-group read are all untested against the real rules engine).

**Deployable value at sprint end.** The rules surface is verifiable: every subsequent rules change (Sprint 18's predicate convergence, Sprint 21's admin-authority alignment, Sprint 23's index/rules collapse) lands against a suite that proves it. This is the specific precondition ADR-114/ADR-115 need in order to change rules safely.

**Complexity: Medium.** Rules tests are formulaic once the harness is warm, but the collection-group read and `sharedProgress` need multi-principal fixtures (owner, collaborator, stranger, admin).

**Risk: Low.** Test-only. Watch for tests that encode a rule the corpus flags as an **open question rather than a decision** — the world-readable leaderboard (NQ-7) and world-readable card-image Storage (NQ-8) are recorded as *undecided*. Assert the current rule as current, and note in the ledger that it is unratified — do not silently canonize it as intended.

**Parallel opportunity.** Second developer takes T-117e (Sprint 8) — unit tests in four features that this sprint does not touch.

**Merge-conflict profile. Near-zero.** Rules-suite test files; possibly a fixtures helper.

**Question-resolution items.** None gated, but **record NQ-7 and NQ-8 in the ledger as open product questions surfaced by this work.** They block no decision in this plan and no task exists for them; leaving them unrecorded would be the exact failure ADR-120 exists to prevent.

---

### Sprint 8 · Wave 2

**Goal.** The four zero-coverage features stop existing as a category.

**Tasks (6 d, isolation sprint).** T-117e L(6)
*Traceability:* → **ADR-117** floor 1 ← OP-23 (`ai`, `game`, `home`, `command-palette` have zero test files).

**Deployable value at sprint end.** Every feature has unit coverage of its domain logic. The `game` engine in particular (session/scoring/tier, consumed by both flashcard game modes and kana — S-16) is covered before Wave 6 relocates kana-survival around it.

**Complexity: Medium.** `game` has real domain logic worth testing; `home` and `command-palette` are thin and their "domain logic" floor needs interpretation at review rather than a mechanical percentage (ADR-117's stated trade-off).

**Risk: Low.** Test-only. The interpretive risk is writing volume instead of value — the floor is *domain-logic* coverage, not a line-count target, and ADR-117 explicitly rejects a blanket percentage.

**Parallel opportunity.** Second developer starts T-116a (Sprint 9) — service-level edits, no overlap with new test files.

**Merge-conflict profile. Near-zero.** New test files across four features.

**Question-resolution items.** None gated. Confirm Q-4's status; if still unanswered, pre-commit the ledger row that Sprint 9 will need.

---

### Sprint 9 · Wave 2

**Goal.** No failure of real state stays silent, and the observability wiring either goes live or is formally deferred.

**Tasks (8 d).** T-116a L(6) · T-116b S(1) `[GATED Q-4]` · T-116c S(1) `[GATED Q-4]`
*Traceability:* → **ADR-116** ← W-17 (59 `console.error` sites reach no one; the client→server log pipeline has 2 callers; 17 swallow sites include the audit-trail writes themselves), OP-22, R-6. Model to copy: `AUDIO_PLAYBACK_FAILED` — "the only subsystem whose silent failures leave a trace."

**Deployable value at sprint end.** Every below-boundary failure of real state leaves a trace: SRS counter increments, Storage cleanup, invite delivery, login logging. The UX contract is unchanged — fire-and-forget stays fire-and-forget (S-12/S-21's deliberate policy is preserved), it simply reports first. If Q-4 answered, production errors are observed and the `/ingest` proxy carries real traffic; if not, the deferral and its reason are ledger rows.

**Complexity: Medium.** Individually trivial edits at many sites; the judgment is per-site — which of the three sanctioned surfacing styles (throw to boundary / into state / fire-and-forget) applies, per CS-12.

**Risk: Medium.** Two specific risks: (a) the logging pipeline becomes a failure amplifier if a report path can itself throw — it must stay fire-and-forget by design; (b) a report on a hot path (SRS counters fire per review) can generate log volume that costs money or drowns signal. Sampling decisions belong in this sprint, not after.

**Parallel opportunity.** Second developer takes T-116b/T-116c (config and provider init only) plus Q-4 chasing, while developer 1 works the 17 swallow sites.

**Merge-conflict profile. WIDE — flag.** 17+ sites spread across flashcard services, notifications delivery, Storage cleanup, and auth/login logging. Single-line edits, but they touch many of the same files Wave 3 and Wave 4 will restructure. This is the last wide-surface sprint before the auth work; nothing else may land beside it.

**Question-resolution items.**
- **Q-4** (opened Sprint 5). Fallback if unanswered: T-116b/T-116c ship as **"activation deferred, reason recorded"** ledger rows. ADR-116's success criterion is satisfied by a *recorded decision*, either way — this sprint is therefore **READY even with Q-4 open**, which is the exception among the gated sprints and is worth stating.

---

## 5. Wave 3 — Security & Data Layer (Sprints 10–14)

*Releasable outcome of the wave: httpOnly server-verified session, bounded queries, honest UI.*

### Sprint 10 · Wave 3

**Goal.** The application can mint and server-verify an httpOnly session credential.

**Tasks (6 d, isolation sprint).** T-107a L(6)
*Traceability:* → **ADR-107** ← W-15/R-11/RC-4 (the edge gate checks only that `auth-token` *exists*; the cookie carries the raw Firebase ID token, deliberately not httpOnly, `SameSite=Lax`, 7-day max-age over a 1-hour token). TD-15 records this as an accepted XSS-amplification risk with no ADR — this is that ADR being implemented.

**Deployable value at sprint end.** A server-minted, httpOnly session credential is issued alongside the existing cookie and verified server-side — a **deliberate dual-credential intermediate state**, which is exactly how the kernel's "split large refactors across sprints with a stable intermediate state" rule applies to auth. Nothing is removed yet; the app works identically with the new path proven live. Per CS-3 (no capability without a consumer), the issuance path lands *with* its verifier in the same sprint — never as unconsumed infrastructure.

**Complexity: High.** Session-cookie lifecycle is genuinely new machinery: mint, refresh, revoke, and the interaction with the client SDK's own in-memory refresh loop. ADR-107 is explicit that this "narrows, not eliminates" token exposure — the win is that the *cookie* stops being a bearer credential.

**Risk: High.** This is the single highest-risk sprint in the plan. A mistake logs every user out, or worse, admits a forged credential. Mitigations, all mandatory: the old cookie keeps working throughout this sprint (no removal until Sprint 11); verification rejects a forged/absent credential by *verification*, not presence (ADR-107's own success criterion); the E2E route pass from Sprint 11 is the acceptance gate before Sprint 11's removal PR merges.

**Parallel opportunity.** Auth is a single-owner track — do not split it. A second developer instead takes T-114a and T-114c from Sprints 13–14 (bounded listeners, export absent-data), which touch flashcard/admin data paths and never the auth surface.

**Merge-conflict profile. Narrow but critical.** `proxy.ts`, the session-mint action, server auth derivation, `lib/firebase`, AuthGate. Small file count, maximal blast radius.

**Question-resolution items.**
- **Q-9 — what populates `analytics_daily` / `metadata/counters` in production?** [DATA]/[GCP]. Opened here, four sprints ahead of T-114d in Sprint 14. Fallback: honest-UI default is already in force — dashboards must not fabricate zeros regardless; if no writer is found, the read paths are removed.
- **NQ-6 — expected public-deck scale.** [DATA]+[INTENT]. Informational for T-114a in Sprint 13: an explicit bound is required regardless (ADR-114 policy); the scale only sizes the `limit()` and the urgency.
- **Q-14 (App Check enforcement) is noted, not scheduled.** It *refines* the residual severity of this sprint's work; it blocks nothing. Record as a ledger row against ADR-107.

---

### Sprint 11 · Wave 3

**Goal.** The raw ID-token cookie is gone, and the auth surface is regression-tested end to end.

**Tasks (7 d).** T-107b M(3) · T-107c S(1) · T-107d M(3)
*Traceability:* → **ADR-107** ← W-15 (the 7-day cookie outliving the 1-hour token produces the "page loads, all actions fail" state); RC-4.

**Deployable value at sprint end.** The auth end-state is reached: XSS no longer yields the session credential via `document.cookie`; the credential stops riding every same-origin request as a bearer token; the stale-cookie "loads-but-fails" state is eliminated because cookie lifetime now tracks a server-verifiable session; and the edge gate is documented as **routing-UX only, by contract**. A full E2E pass across protected and public routes is the evidence.

**Complexity: High.** Removing the credential the client SDK's refresh loop was built around means every client read of the cookie must be found and rerouted. The public/protected route matrix interacts with Sprint 1's unified allowlist — the two must be verified together.

**Risk: High.** Removal is the irreversible half. If any client path still expects the old cookie, users hit a broken session. Mitigation: T-107d (the E2E regression pass) is scoped as **acceptance for the whole auth change, not an afterthought**, and is the merge gate for T-107c's removal PR. Rollback path: revert the removal PR; the dual-credential state of Sprint 10 is the known-good fallback.

**Parallel opportunity.** Second developer takes T-113b + T-114c (Sprint 13's non-listener half) — no shared files with auth.

**Merge-conflict profile. Narrow but critical.** Client auth plumbing, cookie-set/clear paths, `proxy.ts` docs, E2E specs.

**Question-resolution items.** None gated. Verification of the deployed behavior remains Q-1-dependent (which project is production) — record that as a verification-pending ledger row rather than claiming production confirmation the repo cannot provide.

---

### Sprint 12 · Wave 3

**Goal.** All consumers of one user's progress share one listener.

**Tasks (6 d, isolation sprint).** T-113a L(6)
*Traceability:* → **ADR-113** ← R-1 (`useUserProgress` opens one `onSnapshot` per mount across 10 sites — `useHomeState`, `useStudySession`, `MatchGame`, `SpeedGame`, `KanaLearn`, `KanaChart`, `useKanaQuizSession`, `useKanaHubState`, `SettingsPageClient`, `profile/page` — in explicit contrast to the single centralized notifications listener).

**Deployable value at sprint end.** Mounting N components that read one user's progress opens one listener, not N. Firestore connection count, client memory and read-quota billing drop on every authenticated screen; the reconnect listener-storm risk closes. The four-tier state model gains one consistent realtime idiom, removing the `useUserProgress`-vs-`NotificationsContext` inconsistency R-1 names.

**Complexity: High.** A shared per-entity subscription needs reference-counted lifecycle (mount/unmount, tear down on last unmount) — the same complexity `NotificationsContext` already carries, now generalized — plus a mechanical but non-trivial hook refactor across 10 consumers.

**Risk: Medium.** Reference-count bugs are subtle: leak a count and the listener never tears down; drop one early and a mounted screen goes stale mid-study-session. The study surfaces are the ones users notice. Mitigation: Sprint 5's SRS tests plus Sprint 6's service tests cover the data underneath; the consumer migration lands as a separate PR from the provider so a revert is surgical.

**Parallel opportunity.** Second developer takes T-114b (dashboard absent-data, Sprint 14) — admin surface, no overlap with progress consumers.

**Merge-conflict profile. Moderate-wide — flag.** `useUserProgress` and its 10 consumers spread across home, study, both flashcard games, four kana surfaces, settings and profile. Behavior-preserving but broadly distributed.

**Question-resolution items.** None gated. **NQ-14** (runtime magnitudes — listeners, reads, bundle) is informational only: ADR-113 states the structural multiplication is verified and needs no profiling to act on. Record NQ-14 in the ledger as unmeasured rather than implying this sprint measured it.

---

### Sprint 13 · Wave 3

**Goal.** Realtime reads carry explicit bounds, and exports stop shipping invented zeros.

**Tasks (7 d).** T-113b M(3) · T-114a M(3) · T-114c S(1)
*Traceability:* T-113b → **ADR-113**. T-114a → **ADR-114** ← R-2 (`subscribePublicLessons` runs a live `collectionGroup` over all public lessons with no `limit()`, mounted on the flashcard dashboard, streaming the entire public corpus to every viewer). T-114c → **ADR-114**/P-9 (honest UI).

**Deployable value at sprint end.** No listener can stream an unbounded corpus into a client — read cost per screen is bounded by construction. The public-deck grid becomes a bounded set with paging or virtualization (a deliberate trade of completeness for bounded cost, per ADR-114). Exported rows stop carrying hardcoded zeros that a reader cannot distinguish from measured zeros.

**Complexity: Medium.** The bound is a one-line query change; the *product* consequence (a "see more" affordance on the dashboard) is real UI work, and per ADR-112 it must use the mechanism its channel dictates — grow-window resubscribe for the realtime feed, **not** a third pagination mechanism.

**Risk: Medium.** A user-visible product change: the dashboard shows fewer public decks than before. If the bound is set too low or the "see more" path is missing, this reads as data loss to users. Set the initial bound with NQ-6's answer if available, or with a stated, ledger-recorded default if not.

**Parallel opportunity.** Second developer takes T-114b (Sprint 14) concurrently — the admin dashboard, disjoint from flashcard listeners.

**Merge-conflict profile. Moderate.** Flashcard dashboard listeners and grid; remaining per-entity listener sites; export/report generation.

**Question-resolution items.** **NQ-6** (public-deck scale) — sizes the bound, does not decide it. Fallback: an explicit conservative bound plus paging, recorded in the ledger with the value chosen and why.

---

### Sprint 14 · Wave 3

**Goal.** Admin dashboards can tell "healthy" from "idle" from "unmeasured".

**Tasks (6 d).** T-114b M(3) · T-114d M(3) `[GATED Q-9]`
*Traceability:* → **ADR-114** ← W-11 (an operator "cannot distinguish truth from unpopulated fallback, on exactly the surface built to answer that question"), TD-8, RC-5 (the repo had no server compute for three months after the readers were built, so no in-repo producer ever existed).

**Deployable value at sprint end.** No admin code path substitutes a literal `0` for a missing metric; unpopulated metrics render as a distinct "no data" state. The `analytics_daily` / `metadata/counters` read paths either have a defined writer or are removed — with the disposition recorded against Q-9 in the ledger.

**Complexity: Medium.** Absent-data states are new UI across the stat cards and `SystemHealthCard`; the analytics disposition is small either way, but the *branch* is what waits on the gate.

**Risk: Low.** Admin-only surface, no learner-facing impact. The risk is picking the wrong branch: deleting the reads could sever a live external contract (RC-5's stated hazard).

**Parallel opportunity.** Second developer starts T-106a (Sprint 15) — the action client is a separate surface from admin dashboard rendering.

**Merge-conflict profile. Narrow.** Admin dashboard components, stat cards, `SystemHealthCard`, analytics read services.

**Question-resolution items.**
- **Q-9** (opened Sprint 10). **This sprint is NOT READY for T-114d until Q-9 answers.** Fallback if unanswered at sprint start: T-114b ships alone (it is ungated and is the majority of the user value); T-114d ships as a ledger row stating the read paths are retained-pending-Q-9 with a review-by date — **never** as a silent fabricated-zero path, which is out of policy now regardless of the gate.

---

## 6. Wave 4 — Contracts & Convergence (Sprints 15–20, +T-115c tail in Sprint 21)

*Releasable outcome of the wave: validated writes, one action client, no inline predicates.*
*Ordering note:* the critical path fixes T-106a → T-106b → T-109a, so the action client converges **before** the validation audit; T-115 sits between them because Sprint 18's predicate fix is a live-defect correction that should not wait behind the write-path audit.

### Sprint 15 · Wave 4

**Goal.** One verified-identity action client exists, with a real consumer.

**Tasks (6 d, isolation sprint).** T-106a L(6)
*Traceability:* → **ADR-106** ← PC-5/W-12 (three write families, three auth transports; a contributor must classify each new endpoint among three security models), RC-11 (families B and C both end at `adminAuth.verifyIdToken` on the same kind of token, "differing only in how it travels"). Pattern generalized: S-4's per-action permission metadata, where "an action *cannot be defined* without declaring its required permission."

**Deployable value at sprint end.** A single action client exists with per-action permission metadata and thin per-surface configuration (admin session vs user-initiated), and **at least one real action runs on it** — per CS-3, no capability ships without a live consumer, so the client's first migrated call site lands inside this sprint rather than as unconsumed infrastructure. Both old clients still work: a deliberate stable intermediate state.

**Complexity: High.** The convergence contract is the hard part — one verification path, one permission grammar, thin surface configuration that must not regrow into two divergent clients (ADR-106's named trade-off). The family-choice criterion (client SDK vs server action) must be written *at the client's definition site*, replacing the current two-families docstring.

**Risk: Medium.** The new client is additive this sprint, so blast radius is limited to its one pilot call site. The real risk is design debt: getting the metadata grammar wrong here makes Sprints 16–17 expensive.

**Parallel opportunity.** Second developer takes T-115b (the vocabulary-agreement CI check, Sprint 17) — CI plumbing, no overlap with action plumbing.

**Merge-conflict profile. Narrow.** `lib/safe-action.ts` (or successor) plus one pilot action module.

**Question-resolution items.**
- **Q-12 — where were `cardContentSchema` / `privacyModeSchema` / `publicRoleSchema` meant to be enforced, and is production data compatible?** [INTENT]. Opened here, five sprints ahead of T-109b/c/d in Sprint 20. Fallback per ADR-109: per-schema — wire into the write path if adoption was intended, else delete; no schema stays declared-but-unenforced.
- **Q-10 — how is admin authority provisioned (first superadmin; claims vs `admins/{uid}`)?** [OPS]/[GCP]. Opened here for T-115c in Sprint 21. Fallback: the three divergent predicates stay as-is — ADR-115 converges them *only after* the live source is known. Do not guess the provisioning model.

---

### Sprint 16 · Wave 4

**Goal.** Every admin server action runs on the unified client.

**Tasks (6 d, isolation sprint).** T-106b L(6)
*Traceability:* → **ADR-106** ← W-12 (cross-cutting changes implemented three times); `admin.actions.ts` is 380 lines / 20 actions and is the RBAC enforcement seam (W-16).

**Deployable value at sprint end.** The admin write surface runs on one client with one verification path. Every migrated action declares `.metadata({ permission })`. The admin app is fully functional at sprint end — the migration is complete for family B even though family C still exists.

**Complexity: Medium.** Mechanically repetitive, but each action's permission metadata is a security assertion that must be *reviewed*, not copied.

**Risk: High.** This is the RBAC enforcement seam. A wrong permission on a migrated action is a privilege-escalation bug that no test currently catches unless it was written in Sprint 7. Mitigation, in order: Sprint 7's rules suite covers `admins` and `system_logs`; every migrated action's permission is diffed against the pre-migration declaration; the migration lands in three PRs by action group so a revert is bounded.

**Parallel opportunity.** Second developer takes T-109e (forms standardization, Sprint 20) — component-layer work, disjoint from action plumbing.

**Merge-conflict profile. WIDE — flag.** ~20 admin action modules plus their calling hooks. Nothing else structural may land beside it.

**Question-resolution items.** None gated. Q-1 remains the verification gate for confirming behavior in production.

---

### Sprint 17 · Wave 4

**Goal.** The second action client is retired, and cross-artifact vocabulary agreement becomes machine-checked.

**Tasks (7 d).** T-106c M(3) · T-106d S(1) · T-115b M(3)
*Traceability:* T-106c/d → **ADR-106** (success criterion: one exported action client, no parallel verification implementations). T-115b → **ADR-115**'s automation leg ← OP-19 (human-enforced vocabulary agreements, one already drifted). **Build once:** this is the same mechanism ADR-108 needs for the notification union ↔ rules list ↔ writer check in Sprint 21 — the kernel is explicit that T-115b and ADR-108's check are one build.

**Deployable value at sprint end.** There is one action client and one token-verification implementation; the security-review surface for server writes becomes "one client plus the rules." A CI check compares the notification-type union, its rules list, and its writer, so Sprint 21's union widening lands against a machine that verifies it.

**Staging note (backlog §5.4).** T-115b's mechanism ships here in Wave 4, but one of its targets is the notification union that T-108a does not widen until Wave 5 — so run in failing mode now, the check would be **red by design against a divergence already scheduled for repair**, which is precisely the standards-decay pattern the whole decision set guards against. Resolution, within the kernel's fixed waves: stage the *target*, not the task. The notification target runs **report-only** until T-108a lands in Sprint 21, then flips to failing (PR-21.1). Every other target the check covers is failing from day one.

**Complexity: Medium.** The idToken bind-arg migration is smaller than Sprint 16's; the CI check is new but narrow.

**Risk: Medium.** Two distinct concerns share the sprint, which is a deliberate exception worth naming: they touch **disjoint areas** (server action plumbing vs CI config plus type/rules files) and neither is a wide-surface refactor, so the kernel's no-mixing rule is respected. The removal of the superseded client (T-106d) is the risk item — it must land only after T-106c's migration is green.

**Parallel opportunity.** Second developer takes T-115b entirely while developer 1 finishes the client migration — the natural split, since the two workstreams share no files.

**Merge-conflict profile. Moderate.** Remaining `actionClient` call sites and their hooks; `lib/safe-action.ts`; a new CI check plus the notification type/rules files it reads.

**Question-resolution items.** None gated. Confirm Q-10 and Q-12 status; both are needed by Sprints 20–21.

---

### Sprint 18 · Wave 4

**Goal.** Deck access has exactly one implementation, and the one that disagreed is corrected.

**Tasks (6 d, isolation sprint).** T-115a L(6)
*Traceability:* → **ADR-115** ← OP-5 ("the closest thing in the corpus to a discovered live bug": `shared.service.ts`'s `isOwner` checks `lesson.roles?.[uid] === "owner"` while the engine uses `ownerId ?? userId`), W-13/TD-9/RC-9 (the public-access predicate is encoded three times — client resolver, Admin-SDK preview, Firestore rules — one running rules-free on the Admin SDK).

**Deployable value at sprint end.** The `isOwner` divergence closes: an owner whose lesson lacks a `roles` self-entry is no longer potentially denied access to their own deck. All five inline re-derivations call the engine. The three-copy public-access predicate shares one pure predicate across the client/Admin bundle-isolation split (two files may remain — one implementation must).

**Cross-cutting rider (CS-2), per backlog §2.1 M-5.** `ShareModal.tsx` (436 lines) — the repo's single 400+ non-test file — **splits here, not in Sprint 27.** The kernel's rule is "split under whichever task next touches it," and T-115a is the first task that edits ShareModal's *body*: one of the five inline deck-access predicates lives inside it. Two consequences for the rest of the plan: Sprint 27's flashcard restructure inherits an already-split file, and the `max-lines: error 400` flip in Sprint 28 has its prerequisite satisfied nine sprints earlier than a naive reading would put it.

**Complexity: High.** The public-access consolidation must respect a real constraint: RC-9's client/Admin SDK bundle isolation means two *files* sharing one pure predicate, which is more design care than a naive merge. The ShareModal split adds file-movement work but no new design risk — it is a responsibility split of a file this sprint is already editing, and it ships as its own PR so the access-control changes stay reviewable on their own.

**Risk: High.** This is an access-control change on shared decks. Getting it wrong exposes a private deck or locks an owner out. Two mitigations are already in place by design: `resolveRole` was tested in Sprint 5 *before* this consolidation (ADR-117's explicit ordering), and the rules suite from Sprint 7 covers the sharing collections. The `isOwner` correction ships as its own first PR so the behavioral fix is reviewable and revertible independently of the mechanical convergence.

**Parallel opportunity.** Second developer starts T-109a's audit half (Sprint 19) — inventorying write paths is read-only and conflicts with nothing.

**Merge-conflict profile. Moderate.** The flashcard RBAC engine, its 5 inline sites, `shared.service.ts`, `shared-preview.service.ts`, `ShareModal.tsx` and the files its split produces, and possibly `firestore.rules`.

**Question-resolution items.** None gated for T-115a. **T-115c stays out of this sprint deliberately** — it is Q-10-gated and is scheduled in Sprint 21 where the ops answer has had six sprints to arrive.

---

### Sprint 19 · Wave 4

**Goal.** Every server write path validates at its boundary.

**Tasks (6 d, isolation sprint).** T-109a L(6)
*Traceability:* → **ADR-109** ← RC-6 (every real write path validates through the narrower `validateAtomicCard`, so `meaning`/`example`/`hint`/cloze-token/difficulty constraints are enforced nowhere — cards violating every non-primary rule save successfully from manual entry, import, and AI output alike), TD-5 (cost-of-delay High: "deferral converts a code fix into a data migration").

**Deployable value at sprint end.** Every card/lesson/notification/admin write is validated by a live schema or by an explicitly-chosen narrower validator — no path claims a protection it lacks. The cloze `___`-token invariant that study mode depends on gains a write-time guard, closing RC-6's named runtime-bug risk. Firestore accumulates no further unvalidated non-primary fields.

**Complexity: High.** The audit half is the work: enumerating every server write path and deciding, per path, what its authoritative schema is. Wiring is mechanical once the inventory exists.

**Risk: Medium.** Enforcing content caps on a write path that never had them can surface **user-visible rejection of inputs previously accepted** — ADR-109 names this exactly. Any newly-enforced constraint that could reject existing user input must be checked against Q-12's compatibility answer or shipped as warn-then-enforce with a ledger row.

**Parallel opportunity.** Second developer takes T-109e (forms, Sprint 20) — presentational and hook layer, disjoint from server write paths.

**Merge-conflict profile. WIDE — flag.** Server write paths across flashcard, notifications and admin; `shared/schemas`. Nothing else structural lands beside it.

**Question-resolution items.**
- **Gate pre-flight for Wave 5.** Raise the five [INTENT] questions Wave 5 depends on — **Q-5, Q-6, Q-8, Q-11, Q-13, Q-17** — now, two sprints before Wave 5 opens, because [INTENT] answers have the longest latency of any class. Formal wave-opening happens in Sprint 21; this is the lead-time item.

---

### Sprint 20 · Wave 4

**Goal.** Forms standardize, and no declared schema claims a protection it lacks.

**Tasks (8 d).** T-109e M(3) · T-109b M(3) `[GATED Q-12]` · T-109c S(1) `[GATED Q-12]` · T-109d S(1) `[GATED Q-12]`
*Traceability:* → **ADR-109**/CS-13 ← W-9/TD-5 (three exported schemas have zero non-test consumers while their headers claim to be the validation source of truth); PC-1 (the `useLessonBuilder` / `useShareInvites` rhf+zodResolver beachhead).

**Deployable value at sprint end.** Multi-field forms use react-hook-form + zodResolver, consistently. Each of the three zero-consumer schemas is either wired into its write path or deleted along with its misleading header — the "source of truth" headers become true or gone.

**Complexity: Medium.** Form migration is incremental and well-precedented in-repo. The schema dispositions are small; the gate is what makes them wait.

**Risk: Medium.** Enforcing `cardContentSchema` blind could reject or break reads of existing cards (ADR-109's rejected alternative #2). Deleting all three blind discards the correct target state if adoption was merely unfinished (rejected alternative #3). The gate exists precisely because the branch depends on production data.

**Parallel opportunity.** Second developer takes the three schema dispositions once Q-12 answers while developer 1 works the forms — disjoint files.

**Merge-conflict profile. Moderate.** `shared/schemas`, multi-field form components and their controller hooks, card write paths.

**Question-resolution items.**
- **Q-12** (opened Sprint 15). **NOT READY for T-109b/c/d until it answers.** Fallback: T-109e ships alone; each undisposed schema gets a ledger row recording "pending disposition" with an owner and review-by date — ADR-109 explicitly sanctions this documented intermediate state, and it is strictly better than a header that lies.

---

## 7. Wave 5 — Migration Completion (Sprints 21–25)

*Releasable outcome of the wave: the notification migration closed, dead surfaces resolved.*
**Readiness statement, stated plainly:** every sprint in this wave contains gated work and is **NOT READY** until its questions answer. That is expected and was the reason the kernel scheduled this wave late. Each sprint below names its questions, its fallback, and what ships if the answer never comes — none of them is blocked *indefinitely*, because ADR-119's standing default is deletion and ADR-108's is retention-with-a-recorded-gate.

### Sprint 21 · Wave 5 (+ Wave 4 tail)

**Goal.** The notification type stops lying, and the two ops-answerable alignments close.

**Tasks (8 d).** T-108a S(1) *ungated* · T-108e S(1) · T-108b M(3) `[GATED NQ-1]` · T-115c M(3) `[GATED Q-10]`
*Traceability:* T-108a → **ADR-108** ← W-7 (a 4-value TS union while the codebase writes 10 distinct runtime values; "a lie the codebase itself tells" — any exhaustive switch silently mishandles 6 of 10), RC-2 (drift dated `725633b` → `ca8a654`, no reconciliation since). T-108b → NQ-1 (`docs/testing-notifications.md:30` asserts "NOT yet deployed"). T-115c → **ADR-115** ← RC-10/OP-7/R-8.

**Deployable value at sprint end.** `NotificationType` enumerates the 10 stored values including `digest`; a deliberately non-exhaustive switch now fails typecheck, and Sprint 17's CI check **flips from report-only to failing** on the notification target in the same change — so the union, the rules list and the writer are machine-held in agreement from here on. The migration has a ledger row with its removal gate, current stage, owner and review-by date — converting RC-3's permanent-transitional state into a tracked, closeable one.

**Status precision (backlog §5.6).** T-108a is **Ready with Q-7's default in force**, not "ungated" in the sense of "no question applies." Q-7 (the intended end state of the notification vocabulary) is still an open [INTENT] question; its *standing default* is exactly this widening, so the direction is pre-committed and an answer can only confirm it or trigger a named alternate branch. Recorded this way so no reader concludes Q-7 is closed.

**Complexity: Medium.** Widening the union forces every consumer to handle 10 cases, surfacing latent gaps the `string` widening hid — a short-term cost that is the point (ADR-108).

**Risk: Medium.** T-108a is a compile-time change with no data effect — genuinely safe, and the reason it is the ungated anchor of this sprint. T-115c is the risk: aligning admin-authority predicates without knowing the live provisioning source could lock out the only superadmin.

**Parallel opportunity.** Second developer chases NQ-1 and Q-10 (both need console/ops access) and does the T-108b verification while developer 1 lands the union widening.

**Merge-conflict profile. Moderate.** Notification types and their consumers; `firestore.rules` and index config; the admin authority predicates. Note the overlap with Sprints 22–23 — the whole of Wave 5 works the same notification surface, which is why it is one contiguous block.

**Question-resolution items.**
- **NQ-1** — is the runbook's "NOT yet deployed" status still current? [OPS]/[GCP]. Fallback: **retain** dual indexes/queries/fields; removal stays gated. Sprint 23 depends on this answering.
- **Q-10** — admin authority provisioning. Fallback: **no alignment** — the three predicates stay as-is and T-115c does not ship. Shipping a guess here is the one outcome ADR-115 forbids.
- **Wave-5 opening item:** formally open Q-5, Q-6, Q-8, Q-11, Q-13, Q-17 (raised in Sprint 19). Record each in the ledger with its standing default so the wave is executable on defaults if the owner never answers.

---

### Sprint 22 · Wave 5

**Goal.** Production verdicts land for legacy notification data and for the un-called fan-out callable.

**Tasks (6 d).** T-108c M(3) `[GATED Q-5]` · T-119d M(3) `[GATED Q-6]`
*Traceability:* T-108c → **ADR-108** ← RC-3/TD-1 (four `@deprecated` fields, dual read paths, dual composite indexes, an unrun-status backfill script; TD-1 is the corpus's top-ranked debt, score 8). T-119d → **ADR-119** ← OP-14/CX-7 (the callable self-documents "No current product action triggers this yet" — and ADR-119 says documented aspiration is still aspiration; **the gate, not the comment, decides**).

**Deployable value at sprint end.** The four `@deprecated` fields are retained-with-a-recorded-condition or removed, on evidence. The fan-out callable and its Cloud Tasks contract are deleted or claimed with a named operator invocation. Either way the ambiguity ends: no surface remains whose liveness nobody can determine.

**Complexity: Low.** Both dispositions are small once the answer exists. The complexity is entirely in the gate.

**Risk: Medium.** ADR-108 is explicit: cleaning up the dual read without confirming the backfill ran "would silently hide pre-migration notifications from users." That is a data-visibility incident, not a refactor bug. Q-6's risk is symmetric but milder — deleting a callable an operator actually invokes breaks an out-of-repo workflow.

**Parallel opportunity.** These two tasks are independent and gate-separable; a second developer takes one each. Otherwise the second developer is better spent on the [REPO]-class audits (NQ-11 multi-document write invariants, NQ-12 sanitization trace, NQ-13 a11y) — **which are not in this task set** and are noted here only so the parallel capacity is not misallocated to inventing scope.

**Merge-conflict profile. Narrow.** Notification schema/types and read paths; `functions/src/fanout.ts` and its export binding.

**Question-resolution items.**
- **Q-5** — actual state of the notification schema migration in production data. [DATA]+[OPS]. Fallback: **retain** all dual read paths, `@deprecated` fields and legacy indexes; they are assumed load-bearing until a data sample proves otherwise.
- **Q-6** — are the Cloud Functions deployed/operating; do APP_ID vars agree in prod? [GCP]/[OPS]. Fallback: **delete** the un-called fan-out (ADR-119's default), *provided* the gate has ruled out an out-of-repo operator invocation. If it cannot be ruled out, retain with a ledger row — do not delete on assumption.

---

### Sprint 23 · Wave 5

**Goal.** The notification migration closes: one read path, one index set.

**Tasks (6 d, isolation sprint).** T-108d L(6) `[GATED Q-5]`
*Traceability:* → **ADR-108** ← C1+C2 (the corpus's largest single validation-blocked mass), RC-3.

**Deployable value at sprint end.** One read path and one composite index set serve notifications; the two-schema tax ends; TD-1, the corpus's top-ranked debt, closes. The ledger row moves from "gated" to "complete."

**Complexity: High.** Collapsing dual reads means every consumer of the legacy shape must be traced, and the index removal is a deploy-ordered operation (remove readers first, then indexes — never the reverse).

**Risk: High.** The specific risk is user-visible data loss of *display*: if any pre-migration document remains, collapsing the read path hides those users' notification history. This is why the sprint is entirely dependent on Q-5's data sample and why it carries a single task with full reserve.

**Parallel opportunity.** Second developer takes T-119a/T-119b (Sprint 24) — enum-level work, disjoint from read-path collapse.

**Merge-conflict profile. Moderate but concentrated.** All of `features/notifications` read paths, plus index configuration and the runbook doc.

**Question-resolution items.**
- **Q-5** and **NQ-1** must *both* be answered before this sprint starts. **NOT READY otherwise, with no fallback that permits the collapse** — the fallback is that the sprint does not run and its capacity goes to pulling Wave 6 work forward. Stated plainly: this is the one sprint in the plan that can be genuinely blocked, and pretending otherwise would be the exact dishonesty ADR-120 exists to end.

---

### Sprint 24 · Wave 5

**Goal.** Dormant notification and logging vocabulary is resolved in one direction or the other.

**Tasks (6 d).** T-119a M(3) `[GATED Q-8]` · T-119b M(3) `[GATED Q-11]`
*Traceability:* → **ADR-119** ← OP-8/W-8(a)/TD-6/RC-7 (7 registry-declared `NotificationKind`s with `active: false` and zero producers); OP-9/W-8(b)/TD-6 (8 never-emitted `ActivityAction`s + the producer-less `cloud_function` `LogSource`). RC-7 proves the kana-practice case is an **omission**, not a roadmap unknown: quiz and survival log completions, practice does not.

**Deployable value at sprint end.** Every declared vocabulary member has a producer or a claimed-roadmap ledger row. Activity analytics stop undercounting kana practice — either practice logs like its siblings, or the member is deleted and the asymmetry is recorded as intended. Readers stop carrying branches that can never fire.

**Complexity: Low.** Deletions are behavior-neutral by construction (the gate certifies zero producers). The one non-trivial item is the kana-practice producer, if Q-11 claims it.

**Risk: Low.** One preservation requirement is mandatory and easy to miss: the normalizer path that maps unknown log sources to `"server"` must survive an enum prune, so historical `system_logs` documents carrying pruned values still render. Deleting the enum member without preserving that path orphans stored data.

**Parallel opportunity.** Second developer takes T-119c/T-119e (Sprint 25) — admin UI and toolchain, disjoint from enums.

**Merge-conflict profile. Narrow.** The notifications registry and event weights; `lib/logging/actions.enum.ts`; the log-source badge branch; admin report filters keyed on the removed members.

**Question-resolution items.**
- **Q-8** (per kind) — fallback **delete**, with its registry entry and collapse/format share. A "claimed" answer must name the producing feature.
- **Q-11** (per member) — fallback **delete**; the kana-practice gap resolves in whichever direction the gate answers, never left asymmetric.

---

### Sprint 25 · Wave 5

**Goal.** Inert admin surfaces and the one-story toolchain are resolved.

**Tasks (6 d).** T-119c M(3) `[GATED Q-13]` · T-119e M(3) `[GATED Q-17]`
*Traceability:* → **ADR-119** ← OP-10/W-10/TD-7 (three handler-less Quick Action buttons, a self-described stub Settings page, and `canChangeSettings` — a permission required by zero actions); OP-13/TD-12/W-21(b) (8 Storybook packages supporting one story, plus five unreferenced scaffold SVGs).

**Deployable value at sprint end.** Admin operators stop seeing buttons that silently do nothing — TD-7's trust defect closes. An auditor reading the RBAC matrix no longer infers a settings-mutation capability that does not exist. The dev toolchain stops implying a component-documentation practice that isn't happening.

**Complexity: Low.** Removals with a small blast radius. The one care point is the `PermissionSet` matrix: every action that *does* declare a permission must resolve exactly as before after `canChangeSettings` leaves.

**Risk: Low.** Behavior-neutral by construction. The Storybook removal must not disturb the four real test configs or the lint config's audio-boundary and `max-lines` rules — a stated preservation requirement.

**Parallel opportunity.** Second developer starts T-105a (Sprint 26) — feature relocation, disjoint from admin and toolchain.

**Merge-conflict profile. Narrow.** Admin overview card and settings route; the admin RBAC matrix and action-metadata enum; `package.json`, `.storybook/`, `eslint.config.mjs`, `public/`.

**Question-resolution items.**
- **Q-13** (per surface) — fallback **delete** (behavior-neutral). A claimed answer must name the intended backend per surface; the corpus notes "Security Review" corresponds to nothing in the repo.
- **Q-17** — fallback **delete**. ADR-119 is explicit that an undecidable gate ("nobody decided" is a live possibility here) resolves to the default.

---

## 8. Wave 6 — Structure & Patterns (Sprints 26–29)

*Releasable outcome of the wave: placement parity, one dialog pattern, one table engine.*
*Why last:* these are the widest merge-conflict surfaces in the repo and want a quiet codebase — every other wave has landed by now.

### Sprint 26 · Wave 6

**Goal.** Feature UI lives feature-side, and pagination is capped at its two sanctioned mechanisms.

**Tasks (7 d).** T-105a M(3) · T-105b M(3) · T-112a S(1)
*Traceability:* T-105a/b → **ADR-105** ← W-5 (kana-survival's four screens, 483 lines, live under `app/…/survival/_components/` while their 666 lines of state hooks live in `features/kana/hooks/`), RC-8 (the placement survived three restructures and four in-place edit passes), CX-9 (a rule "that can only be learned by enumerating exceptions"), TD-10 (a live template for the next mode built by imitation). T-112a → **ADR-112** ← PC-11/OP-3.

**Deployable value at sprint end.** The `app → features/game` edges — which exist *only* because of these files — disappear. Feature-scoped search and tooling see all of kana. Future placements have a mechanical answer: a component that imports feature internals is feature code, wherever it currently sits. The two pagination mechanisms are codified as THE two, with a review gate against a third.

**Complexity: Low.** Behavior-neutral moves plus import-path updates, made cheap by Sprint 3's barrel migration and Sprint 4's lint rules. T-112a is documentation plus a review gate.

**Risk: Low.** Churny but neutral. The one live hazard: NQ-5's owner veto could reverse the relocation. ADR-105 already answers this — if vetoed, the veto and its rationale get recorded in the ledger, which still satisfies the real goal (a stated tiebreaker).

**Parallel opportunity.** Second developer takes T-111a (Sprint 29, Reports) — admin surface, entirely disjoint from kana and notifications placement.

**Merge-conflict profile. Moderate.** `app/[locale]/(immersive)/kana/survival/_components/` → `features/kana/survival/`; the notifications page-private list components; route pages; a rule file for the placement tiebreaker.

**Question-resolution items.**
- **NQ-3 — open the owner-veto window on `Drawer`.** Raised here, two sprints ahead of T-110b, so the window has closed by Sprint 28. This is **not** an unanswered question: NQ-3 is closed-by-decision toward deletion, and silence expires the window in favour of the default. The item is "notify the owner and record the response," not "wait for an answer."

---

### Sprint 27 · Wave 6

**Goal.** Flashcard has named sub-modules behind a curated public API.

**Tasks (6 d, isolation sprint).** T-104a L(6)
*Traceability:* → **ADR-104** ← W-4/OP-18 (146 files / 16,940 lines — 34% of `src/`, 46% of feature code — with a flat 27-file `components/` directory mixing sharing, comments, builder, import and practice concerns; 14 of the repo's 25 largest files live here). ADR-104 decides **no top-level split**: one feature, internal boundaries.

**Deployable value at sprint end.** `features/flashcard` consists of named sub-modules (dashboard, detail, games, study/SRS, sharing + comments, import/AI), each with a barrel; the flat `components/` directory no longer exists; the root barrel is a curated export list, not an `export *` chain. Internals become reorganizable behind a stable external contract, and a future top-level split — if ever justified — becomes a directory move rather than surgery.

**Cross-cutting note (CS-2).** `ShareModal.tsx` was **already split in Sprint 18** under T-115a, which was the first task to touch its body (backlog §2.1 M-5). This sprint therefore moves an already-compliant set of files into the sharing sub-module; it does no size-driven splitting of its own. The general rule still applies to every file this sprint touches: a file crossing 400 lines during the restructure is split by responsibility before merge, not carried.

**Complexity: High.** Boundary calls are design work, not mechanical moves — ADR-104 names the SRS/sharing seams as genuinely contested (progress touches study and dashboard).

**Risk: Medium.** Behavior-preserving in intent, but this is the largest file-movement operation in the plan. Mitigations already banked: Sprint 6's service tests and Sprint 5's SRS tests cover the logic being moved; Sprint 3's barrel migration means external consumers reference the root barrel, not internal paths, so the move is invisible outside the feature; and Sprint 18 already split the one file that would otherwise have forced a size decision mid-restructure.

**Parallel opportunity.** **None within this workstream** — this is the widest merge surface in the repo. A second developer takes T-111a (Sprint 29) or T-110a/T-110b (Sprint 28) instead.

**Merge-conflict profile. WIDEST IN THE PLAN — flag.** 146 files reorganized. Absolutely nothing else may land concurrently. This sprint is the reason Wave 6 is last.

**Question-resolution items.** None gated. **CS-7 caveat, carried from the standards' own conflicts section:** the "barrel = public API, not per-folder" policy partially reverses a demonstrated team preference (CX-4 records that a June-2026 barrel removal was reverted). ADR/CS-7 says the owner should confirm the reduction scope before lint-enforcing it — so confirm before Sprint 28 flips the rule.

---

### Sprint 28 · Wave 6

**Goal.** Internal boundaries and the file-size ceiling become enforceable, and overlays share one chrome.

**Tasks (5 d).** T-104b S(1) · T-110a S(1) · T-110b M(3) `[NQ-3 — veto window, not a blocker]`
*Traceability:* T-104b → **ADR-104**/CS-7. T-110a/b → **ADR-110** ← W-21/OP-2 (**two** non-conforming backdrops: `DeckDetailsPanel`'s `bg-[#3c3c3c]/30` and `AdminSidebar`'s `bg-black/40` — backlog §2.1 M-3 folds both into T-110a, since the decision is identical for each), TD-11/OP-12/CS-1 (`Drawer` has zero render sites while two features hand-roll the same slide-panel — the canonical premature-abstraction counter-example).

**Deployable value at sprint end.** Cross-sub-module imports inside flashcard are lint-enforced. Every `Dialog.Root` composition routes backdrop and close through `DialogChrome`, so focus-trap, Escape and scroll behavior are guaranteed on both sanctioned tiers. The shared-UI inventory stops advertising an unused-but-canonical-looking `Drawer`.

**Cross-cutting riders.** (a) **CS-2:** flip `max-lines` to `error` at 400 with the test-glob override — valid because **Sprint 18** split `ShareModal.tsx`, the only non-test violator, leaving a near-empty backlog. (b) **CS-14:** the raw-hex cleanup rides with the dialog work, since both bespoke backdrops *are* hardcoded-hex occurrences from the 38-instance tail (charts carve-out excepted).

**Complexity: Medium.** Small changes, but two of them are lint-rule flips whose correctness depends entirely on the preceding sprint having landed.

**Risk: Low.** The ordering risk is the real one and it is structural, not incidental: **every lint-enabling change here comes after its migration.** Flipping `max-lines` to error before the ShareModal split, or enforcing internal boundaries before the sub-modules exist, would put the repo in a state where the pre-commit gate fails on `main` — the one outcome the kernel's deployability rule forbids.

**Parallel opportunity.** Second developer takes T-111a (Sprint 29) concurrently — disjoint surfaces.

**Merge-conflict profile. Narrow.** `eslint.config.mjs`; flashcard sub-module barrels; `DeckDetailsPanel`, `AdminSidebar`, `Drawer` and the shared UI barrel.

**Question-resolution items.**
- **NQ-3 — a veto window to confirm, not a gate to wait on** (backlog §5.3). The kernel marks T-110b `[GATED NQ-3]`, but `07-Open-Questions.md` §0 lists NQ-3 among the questions **closed by decision**, default = delete, with an owner-veto note — and the kernel treats the other four resolved-by-decision questions (NQ-2, NQ-4, NQ-5, NQ-9) as ungated, making NQ-3 the lone inconsistency. Practically: T-110b is **Ready on its default and cannot stall**. The sprint action is to confirm the veto window has passed with no owner claim, then delete. If the owner does claim `Drawer` — asserting it was built *for* `DeckDetailsPanel`/`AdminSidebar` with adoption genuinely pending — the two panels adopt it instead, and the claim is recorded. **This sprint is not NOT-READY on NQ-3.**

---

### Sprint 29 · Wave 6

**Goal.** "Admin grid" has one behavior contract.

**Tasks (6 d, isolation sprint).** T-111a L(6)
*Traceability:* → **ADR-111** ← PC-2/W-12 (Reports wraps the shared visual chrome around a non-table virtualized list, "sharing the visual chrome but none of the engine semantics"). NQ-4 is resolved-by-decision: the exclusion is treated as unfinished migration, not doctrine.

**Deployable value at sprint end.** Sorting, selection and filtering semantics are uniform across Users, Content and Reports. Virtualization survives as a rendering strategy on the engine rather than as a parallel shell. The engine stays admin-owned until a third, non-admin consumer appears (P-10's three-use rule) — its scope rule is now explicit.

**Complexity: High.** ADR-111 names the hazard directly: converging a virtualized, variable-height, non-columnar log list onto a columnar row model is real work that "could hit a genuine constraint mid-implementation."

**Risk: Medium.** The escape hatch is pre-authorized and must be used honestly: if a genuine variable-height constraint is found, **stop and record the owner's veto in the ledger** (ADR-111's stated reconciliation for NQ-4) rather than half-converging. A half-converged Reports would end the plan on exactly the frozen-migration state ADR-120 exists to prevent.

**Parallel opportunity.** None needed — this is the final sprint. If a second developer is present, they take the Q-3/NQ-13-class audit backlog, which is outside this task set.

**Merge-conflict profile. Narrow.** `features/admin` reports components and the shared table engine.

**Question-resolution items.** None gated. **Exit condition for the plan:** every ledger row opened during Sprints 1–29 has either closed or carries a live owner and review-by date. A row with neither is the failure mode ADR-120 names — "an unmaintained ledger is as misleading as a stale comment."

---

## 9. Rule-compliance check

| Rule (from the kernel / task brief) | How this plan satisfies it |
|---|---|
| No sprint mixes a wide-surface refactor with unrelated risky work | The six wide-surface sprints (3, 9, 12, 16, 19, 27) each carry exactly one workstream. Sprint 9 is the one wide sprint carrying extra tasks — T-116b/c are same-concern config activation, not unrelated work. |
| Every sprint ends deployable | No sprint ends mid-migration. Auth splits 10→11 with a working dual-credential state; the action client splits 15→16→17 with both clients live until 17; barrels split 2→3→4 (publish → migrate → enforce); flashcard splits 27→28 (restructure → enforce). |
| Avoid large refactors inside one sprint | The four multi-sprint splits above, each with a named stable intermediate state. |
| No sprint carries two L tasks | Verified across all 29 sprints; every L-bearing sprint is single-L with full reserve. |
| Gated work opens with its question | **Q-1 and Q-4 in Sprint 1** (Q-4 named early because it has no owner row in the source); Q-4 re-affirmed at Sprint 5 as Wave 2's opener; Q-9/NQ-6 in Sprint 10; Q-12/Q-10 in Sprint 15; Wave 5's [INTENT] gates pre-flighted in Sprint 19 and formally opened in Sprint 21; NQ-3's veto window in Sprint 26. Every gated task carries its ADR-defined fallback. |
| Lint rules land after their migrations | T-101c/T-103b (Sprint 4) after T-101b/T-103a; T-102c (Sprint 5) after T-102b; T-104b (Sprint 28) after T-104a; the `max-lines` error flip (Sprint 28) after the ShareModal split in **Sprint 18**. |
| A CI check is never red by design | T-115b's notification target runs report-only from Sprint 17 and flips to failing in Sprint 21 when T-108a widens the union (backlog §5.4). |
| Parallelization marked, not assumed | Every sprint names a concurrent track; the plan's 29-sprint duration assumes team size 1 throughout. |

## 10. Known incoherence in the binding input

Recorded rather than silently reconciled, per the kernel's own honesty rule. Items 1–4 are confirmed by `01-Validated-Backlog.md` §5, which reached the same findings independently; items 5–6 are this file's own.

1. **Task count — 63, not 50.** The kernel's heading reads "THE TASK SET (50 tasks — fixed)" and its output rules say "each of the ~50 tasks." The **enumerated** set contains **63 task IDs**: 62 wave-assigned plus the unscheduled T-118d. By status: **46 Ready · 16 Gated · 1 Open.** By size: **19 S · 29 M · 14 L · 1 unsized.** Since the kernel binds the IDs, the enumeration is authoritative and the headline is a transcription error. **This plan is sized against 63 throughout** — planning against 50 would have understated the program by roughly a quarter.
2. **Q-4 is a real gate with no owner row.** It gates T-116b/T-116c and is treated as live in ADR-116 and the decision matrix, yet it appears nowhere in `07-Open-Questions.md`'s four groups (only as an aside in NQ-14's row), and 07's own roll-up arithmetic is internally inconsistent (header 26, roll-up 25, groups summing to 32). **Sprint 1 names Q-4 explicitly** so it is not the one gate nobody is assigned to answer.
3. **NQ-3 is gated in the kernel but closed in the source.** T-110b is marked `[GATED NQ-3]`, but 07 §0 lists NQ-3 as resolved-by-decision (default delete, owner-veto note), and the kernel leaves the other four such questions ungated. Treated here as a **veto window, not a blocker**; Sprint 28 is therefore not a gated sprint.
4. **T-115b (Wave 4) checks T-108a's output (Wave 5).** Run failing from Wave 4, the vocabulary check would be red against a divergence already scheduled for repair. Resolved by staging the target, not the task: report-only from Sprint 17, failing from Sprint 21. No wave or ID changed.
5. **The critical path terminates in a gated task.** It ends `… → T-109a → T-108a/d`, and T-108d is Q-5-gated — so the path cannot complete on in-repo work alone. Treated as ending at T-108a (Sprint 21) with T-108d as a gate-bound tail (Sprint 23). Sprint 23 is the one sprint in this plan that can be **genuinely blocked** rather than defaulted, because collapsing unverified read paths would hide pre-migration notifications from users. Stated rather than wished away.
6. **Sprint utilization is 82%.** Task load averages 6.6 d against 8 d of capacity because the no-mixing rule forces single-workstream sprints. The gap is isolation slack, not unplanned capacity — it is the direct cost of the kernel's own sequencing rules, and compressing it would mean putting a wide-surface refactor beside unrelated risky work.
