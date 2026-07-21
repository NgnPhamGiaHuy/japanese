# 04 — Sprint 0 / Sprint 1 Approval

**Execution-Readiness, Phase 4.** Adversarial verification of whether Sprint 1 can actually be started, executed and *verified* by a developer with what they plausibly have. This is a verdict document. It creates no tasks and re-plans nothing; where something is missing it is reported as a gap.

**Sources read.** `implementation-planning/` 00–10 (primary), `architecture-decision/` 01/03/04/07 (secondary), `architecture-assessment/` 02/07/09/10/11 and `project-discovery/` 01/11/14 (evidence chain). `requirements-consolidation/` does not exist (deleted pre-discovery, never committed, unrecoverable) — recorded once, per the kernel, and not pursued.

**One deliberate out-of-corpus check.** Two corpus documents contradict each other on the CI job count, and that fact is load-bearing for Sprint 1's acceptance evidence. Rather than average or hand-wave, I read `.github/workflows/ci.yml` directly. This is the only file outside the artifact corpus I opened; no `src/` was read and no rescan was performed. It is labelled as out-of-corpus wherever cited.

**Evidence labelling used throughout:** **[V]** verified from the documents · **[V-X]** verified against a file outside the corpus · **[U]** unverifiable from the documents · **[C]** contradicted.

---

## 1. What Sprint 1 actually is

| Field | Value | Source |
|---|---|---|
| Goal | "Staged work becomes recordable in-repo, and the public-route allowlist stops disagreeing with itself" | `03-Sprint-Plan.md` §3 Sprint 1 |
| Tasks | **T-120a** S(1) · **T-120b** M(3) · **T-120c** S(1) · **T-118a** M(3) | `03` §3 Sprint 1 |
| Load | **8 planning-days** against 8-day capacity — a **fully loaded** sprint with zero reserve inside the task budget | `03` §2 (row 1), §1.1 |
| PRs | **5** — PR-1.1 ledger · PR-1.2 backfill · PR-1.3 docs index · PR-1.4 allowlist module (neutral) · PR-1.5 AuthGate switch (behavioral) | `04-PR-Plan.md` §2 Sprint 1 |
| Wave gates | **None.** "Wave 1 is fully schedulable today — this is deliberate" | `02-Execution-Waves.md` §Wave 1 → Gated items |
| Verdict on record | ✅ READY, "— (pre-flight applies)" | `08-Implementation-Readiness.md` §2 |
| Question items | Q-1, Q-4, Q-2 opened (not answered) | `03` §3 Sprint 1 → Question-resolution items |

**Arithmetic checks I performed rather than accepted [V].** T-120a(1) + T-120b(3) + T-120c(1) + T-118a(3) = **8**, matching `03` §2's load column. Sprint 1's five PRs are consistent with the 93-PR total. `09-Progress-Tracking.md` §3 Wave 1 header ("14 tasks · 14 Ready / 0 Gated") agrees with `02` §Wave 1's "Gated items: **None**." No residue of the erroneous "50 tasks" survives as a live figure: `02`§9, `03`§1.1 and §10.1, `05`§Authority, `06`§Authority, `07`§preamble and `08`§preamble and §6(1) each name **63** and each explicitly labels 50 a transcription error. **Fixed facts hold for Sprint 1.**

---

## 2. The seven axes, item by item

### 2.1 All prerequisites exist — **PARTIAL**

**In-plan prerequisites: none, correctly [V].** `08` §5 opens "Sprint 1 has no in-plan predecessor." `02` §Wave 1 Entry criteria: "None technical — this is the program's start." `04` §8.1 lists Sprint 1's only hard chain as **PR-1.4 → PR-1.5** (internal to the sprint). PR-1.1 → PR-1.2 is the only other ordering. `04` §8.3's three repo-wide merge locks (import migration, action plumbing, flashcard layout) are all Sprints 3, 16–17 and 27 — **none touches Sprint 1**. Merge-conflict profile is "Narrow … Nothing in `features/`" (`03` §3 S1). This axis is genuinely clean *inside the plan*.

**Out-of-plan prerequisites: three of the ten pre-flight items are hard preconditions of Sprint 1's own acceptance criteria, and `08` mislabels them [C].**

`08` §5 closes: *"PF-1, PF-2, PF-3 and PF-7 are the four that change the readiness table. **The rest is hygiene.**"* That sentence is falsified by `08`'s own content in three places:

| Item | Why it is not hygiene for Sprint 1 | Citation |
|---|---|---|
| **PF-6** — name an owner + review-by for every gated question at S1 | T-120a's format makes "a row missing any of the four [fields] **invalid** by the format's own statement"; T-120b's acceptance criterion requires every gated disposition to have a row "with **all four fields populated**". `09` §2.4: "a row missing an owner or a review-by date is **a defect on creation**"; `09` §6.1 rates it **red on any occurrence**. **Without PF-6, T-120b cannot pass its own acceptance criteria** — 3 of Sprint 1's 8 days fail. | `01-Validated-Backlog.md` §T-120a, §T-120b; `09` §2.4, §6.1 |
| **PF-4** — JDK + Firebase CLI on `PATH`, five suites green at HEAD | PR-1.5's named tiers are **E2E and browser**. Playwright boots the Firebase Auth+Firestore emulator as a `webServer` (`disc/01` §222), and the emulator is a JVM process needing a JDK (`07-Risk` §X-11, R-15). **Without a JDK, Sprint 1's only behavioral PR has no verification path.** `08` §5 lists PF-4 as unblocking "S6, S7, S11" — **it omits S1, and that omission is wrong.** | `04` §2 PR-1.5; `disc/01` §222; `07-Risk` §X-11 |
| **PF-5** — baseline green, record the SHA | Every Sprint 1 PR states a `Reverts:` path, and `08` §7(16) makes reverting to "the previous sprint's tagged commit" the sprint-failure path. Sprint 1 *is* the first link; with no recorded baseline SHA there is no revert target for the sprint that introduces the auth-boundary change. | `04` §2 Sprint 1 (Reverts fields); `08` §7(16); PF-9 |

PF-9 (branch/rollback convention) is in the same category — `08` itself justifies it with "there is no CI/CD pipeline and no deployment history (R-13)."

**Finding F-1 [C].** `08` §5's "the rest is hygiene" classification is incorrect. **PF-4, PF-5, PF-6 and PF-9 are Sprint 1 execution preconditions, not hygiene.** The four items `08` promotes (PF-1/2/3/7) change the *readiness table* — a different claim, and true — but the sentence as written invites a reader to start Sprint 1 without a JDK, without a baseline SHA and without owners, at which point T-120b fails and PR-1.5 is unverifiable.

### 2.2 No external blockers — **TRUE FOR EXECUTION, FALSE FOR REALIZATION**

**Execution [V].** Sprint 1 has no gated task. `02` §Wave 1: "Gated items: **None**." `08` §2 row 1 gives Sprint 1 the only unqualified READY in Wave 1 (S2 carries "needs PF-8", S1 carries only "pre-flight applies"). Every Sprint 1 task is `Status Ready` in `01` (§T-120a, §T-120b, §T-120c, §T-118a). **Nothing external prevents the five PRs from being written and merged.** This is verified, and it is the strongest thing in Sprint 1's favour.

**Realization [C — overclaim across three documents].** Sprint 1's headline value is stated three times as a *user-visible* outcome:

- `03` §3 S1: "one **user-visible defect closes**: public routes are now admitted identically…"
- `08` §3: "**and a live user-visible defect closes**"
- `00-INDEX.md` §Where to start: same claim.

Against this, `10-Release-Plan.md` §5.1 states flatly: *"until a hosting decision is made and recorded as an ADR, **none of these units can be deployed anywhere**."* Sprint 1 belongs to release unit **R1** (`10` §3.2: "Ledger and docs (T-120a/b/c) | R1").

Both statements are literally true — the fix lands on `main` — but they cannot both be read at face value. **No user sees Sprint 1's defect fix until PF-1 (hosting) is decided.** The honest phrasing is *merge-visible*, not *user-visible*. This does not block Sprint 1; it means Sprint 1's advertised payoff is deferred and the team should not expect to demonstrate it.

### 2.3 No missing infrastructure — **FALSE. This is the material finding.**

**First, a correction to a premise [C][V-X].** The brief states the corpus establishes "CI has three jobs." Two corpus documents disagree:

- `project-discovery/01-Project-Overview.md` §19 and §226: **three jobs** — "Build, Lint, Unit Test", "Firestore/Auth Rules (Emulator)", "Cloud Functions (Emulator)" (`ci.yml:25,70,102`).
- `architecture-assessment/02-Architecture-Strengths.md` §184–186: **five jobs** — adds `e2e-tests` (`:137-146`) and a `deploy-functions` job gated on `vars.FIREBASE_PROJECT_ID != ''`. `assess/10` §S-11 and `assess/11` §S-11 both record `ci.yml` as "read in full."

I did not average. I read `.github/workflows/ci.yml` (224 lines) **[V-X]**: five jobs — `build-lint-test` (:24), `emulator-rules-tests` (:69), `functions-tests` (:101), `e2e-tests` "Browser Tests (E2E + Component)" (:143), `deploy-functions` (:191). **The assessment is correct; discovery is wrong (it stops at `:102` and misses the last 122 lines); the brief inherits discovery's error.** The consequence *favours* Sprint 1: the browser and E2E tiers PR-1.5 depends on do have a CI home, and the e2e job installs both a JDK (:157) and Playwright browsers (:166). Recorded so no downstream reader plans around a three-job CI.

**Second, the actual infrastructure gap [V] — Sprint 1's stated acceptance evidence does not exist.**

Three documents name the same acceptance evidence for Sprint 1's behavioral change:

- `04` §2 PR-1.5 → **Tests:** "E2E (each public route renders signed-out; each protected route still gates); browser for the splash path."
- `03` §3 S1 → Risk mitigation: "**the E2E public/protected route pass is the acceptance evidence.**"
- `08` §4 S1 row → Test tier: "Unit (allowlist module) + **E2E public/protected route pass** — the sprint plan names this as the acceptance evidence."

That pass does not exist at HEAD. The corpus is unanimous and specific:

- `assess/07` §194: "**E2E covers exactly two flows** (`e2e/auth.spec.ts`, `e2e/realtime.spec.ts`); no game, sharing, study, or admin flow has an e2e path."
- `assess/09` §305: "Playwright e2e is **two specs only**."
- `disc/11` §289 and `disc/01` §42, §222, §303: same two specs, confirmed by file enumeration.
- `assess/10` §250 adjudication 2 re-counts every tier at HEAD and confirms "**2 e2e**".

And the task that *creates* the route matrix is **T-107d — "E2E auth regression pass across protected and public routes" — Wave 3, Sprint 11** (`01` §T-107d; `08` §2 row 11). Its acceptance criteria are to bring that coverage into existence: *"E2E coverage **exists** for: … signed-out access to **each public allowlisted route** (loads without splash)…"*, and *"The public-route cases are **driven by the single allowlist module from T-118a**."*

**Finding F-2 [V].** **Sprint 1 cites, as the acceptance evidence for its only behavioral change, a test artifact authored ten sprints later by a task that is explicitly downstream of Sprint 1.** T-118a's own acceptance criteria (`01` §T-118a) contain no test-authoring obligation, and Sprint 1's 8-day load has no room for one. So one of three things must happen, and no artifact says which:

1. The route-matrix cases are hand-written inside Sprint 1 — **unscheduled work** in an already fully loaded sprint; or
2. PR-1.5 ships against `auth.spec.ts` alone, whose coverage of the *public* allowlist the corpus nowhere establishes — meaning the sprint's stated evidence is **not what actually gates the merge**; or
3. PR-1.5 ships with reduced verification, which under `08` §1 rule 6 ("no applicable test tier") and `09` §6.3 ("PR with no named applicable test tier — **red, any occurrence**") is a recorded quality failure.

This is the single item that moves Sprint 1 off unconditional approval.

**Third, a standing infrastructure caveat [V].** CI's lint step carries `continue-on-error: true`, with an in-file comment reading, per `assess/02` §186, that it should not be flipped to blocking "until the backlog is paid down." Confirmed **[V-X]** at `ci.yml:41-48`. The consequence: the pre-commit gate that `04` §1.1 says "**runs on every PR without exception**" and that `08` §7(1) makes DoD item 1 is enforced by the **local husky hook only**; CI does not fail on lint. A `--no-verify` commit, or a clone without hooks installed, bypasses lint + format + full build entirely and CI will not catch the lint half. A grep of all four planning-artifact sets returns **zero** mentions of `continue-on-error`; the only corpus reference is `architecture-decision/01-Architecture-Principles.md` §52 and §284, which cite it *approvingly* as precedent for ratchet enforcement. **No task among the 63 flips CI lint to blocking.** Sprint 1's blast radius from this is small (documentation plus one module), but it is a standing gap for the whole program and the contract in file 06 carries a rule for it.

### 2.4 No missing environments — **TRUE for execution, with one unstated dependency**

**[V]** Sprint 1 requires exactly one environment beyond an editor: the **local Firebase emulator + Playwright dev server**, and only for PR-1.5. That environment is fully self-contained and requires no external account: `playwright.config.ts` boots `firebase emulators:start --only firestore,auth --project **demo-e2e**` plus `next dev --port 3100` with fake `NEXT_PUBLIC_FIREBASE_*` env and `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`, and is documented as running "**never against production Firebase or a developer's already-running dev server**" (`disc/01` §222; `assess/02` §172).

**The unstated dependency is the JDK.** `07-Risk` §X-11: "the Firestore emulator is a JVM process requiring a JDK on `PATH` (R-15)", and the commit immediately preceding this program (`a0bbbc4`) "was itself a fix to an emulator test crash." `08` §5 PF-4 requires it but scopes it to "S6, S7, S11." **PR-1.5 needs it too.** A developer who has only ever run `npm run test` (the fast lane, no JVM) will discover this at the moment they try to verify Sprint 1's behavioral change. That is precisely the "blocker discovered halfway through" that `08` says it exists to prevent (`08` §preamble).

### 2.5 No missing credentials — **TRUE. Fully clean.**

**[V]** This is the axis Sprint 1 passes without qualification, and it deserves to be stated positively:

- Sprint 1's surface is `docs/`, one new allowlist module, `proxy.ts`, and the AuthGate inside the composition root (`03` §3 S1 merge-conflict profile). No third-party service, no deploy.
- The E2E tier runs on `demo-e2e` with fake env (`disc/01` §222) — **no real Firebase credentials**.
- CI builds credential-free with placeholder env (`assess/02` §130, §186; `ci.yml:50-62` **[V-X]**), which `assess/02` §130 records as a deliberate design property of `lib/firebase-admin.ts`'s lazy Admin-SDK proxy.
- The `deploy-functions` job is gated `if: … && vars.FIREBASE_PROJECT_ID != ''` and "skips cleanly until real credentials are configured" (`assess/02` §184, §186) — so an unprovisioned project does not turn CI red.

**Sprint 1 needs zero secrets to execute and zero secrets to verify.** No credential item is assumed-but-unstated here.

**One adjacent note, not a Sprint 1 blocker:** T-118c (Sprint 2) requires "`.env.example` … **No secret values are present**" (`01` §T-118c) — the credential *hazard* in Wave 1 is committing a secret in Sprint 2, not lacking one in Sprint 1.

### 2.6 No missing approvals — **TRUE for Sprint 1**

**[V]** `08` §5 scopes PF-8 (owner confirmation of the CS-7 barrel-reduction scope) to "**S2, S27** (and S4's flip)". Sprint 1 has no barrel work, so it needs no approval to execute. This is correctly modelled: `08` §2 marks S2 as "READY (needs PF-8)" and S1 as READY with no approval qualifier.

The approval-shaped items that *touch* Sprint 1 are its three question-resolution items — but those are obligations to **open and record**, not to **obtain** (see §3 below). Sprint 1 does not wait on an approval.

**Caveat on reading this result.** Sprint 1 being approval-free must not be generalized. `10` §3.5(4) says explicitly: "**R1's T-118b needs its pre-release check run before merge, which makes an 'ungated' Wave-1 task quietly dependent on Q-1.** Named here so it is not discovered at deploy time." T-118b is **Sprint 2**. Approving Sprint 1 approves Sprint 1.

### 2.7 No hidden migration risks — **TRUE as to change class; one non-undoable consequence**

**Does Sprint 1 contain a non-reverting change class? [V] No.** `10` §3.3 enumerates exactly seven non-reverting classes: (1) T-107a/b/c auth credential cutover, (2) T-108b index/rules deploy, (3) T-108c/d notification data-shape collapse, (4) T-116b/c telemetry activation, (5) T-119d deployed-function deletion, (6) T-118b `APP_ID` unification (conditional), (7) T-114d's alternate analytics branch. **None is in Sprint 1.** Positively confirmed on the other side: `10` §3.2 lists "Ledger and docs (T-120a/b/c) | R1 | **Reverts cleanly.**" and `01` §T-118a gives "Restore the two literal lists from git; the module is additive until both consumers switch, so revert is a **one-commit import swap**."

I specifically checked the known-issue item: **T-118b — the APP_ID data-partition hazard — is Sprint 2, not Sprint 1** (`03` §3 Sprint 2 task list; `04` §2 PR-2.1). Sprint 1 is genuinely the clean sprint. The hazard is real and it is adjacent, which is why §2.6's caveat matters.

**A sharpening the corpus does not make [V, derived].** T-118a's revert is clean in *code* and not clean in *effect*. `01` §T-118a regression scope: "a wrongly-widened list is **an auth-splash bypass**"; `08` §4 S1: "Misjudging the canonical set **exposes a private route** or breaks SEO/OG rendering." Reverting the module restores the code; it does not un-expose a route that was reachable while the wrong list was live — the identical logic `10` §3.3(4) applies to telemetry ("events … **cannot be unsent**"). So:

> **Sprint 1 carries no non-reverting change class, but it does carry one change whose *consequence* is not undone by its revert.**

This is not a blocker. It is the reason findings F-2 and this one **compound**: the one change in Sprint 1 that can cause an unrecoverable consequence is the one whose stated acceptance evidence does not exist. Mitigating F-2 mitigates both.

**Migration risk properly handled [V].** The two-PR split (PR-1.4 behavior-neutral consolidation → PR-1.5 behavioral switch) is exactly `04` §1.2 rule 2 ("Split boundary enforcement from behavior … They never share a PR"), and PR-1.5 is required to state "the before/after admitted set … explicitly in the PR body." `01` §T-118a additionally requires the reconciliation be "recorded as an explicit adjudication … **no route silently changes** between public, splash-gated and redirected without that decision being written down." The plan's handling of this risk is sound; only its evidence is missing.

---

## 3. Q-1, Q-4, Q-2 — can a developer DO these in Sprint 1, or only ASK?

**All three are ASKs. Not one is a DO. [V]**

| Q | Class | Why it cannot be done at a desk | Citation |
|---|---|---|---|
| **Q-1** — which Firebase project is production, what is its provisioned state | [GCP]+[ENV] | Requires console access to a project the corpus records as possibly non-existent: "no `.firebaserc`, demo-only IDs, env-driven with lazy credentials — nothing in-repo substitutes (**verified-absent**)". `07-Risk` §42: this is "a *pre-deployment* codebase". | `architecture-decision/07` §Group B; `07-Risk` §42 |
| **Q-2** — hosting target / canonical URL | Decision | "**A decision to make, not a fact to find.**" No investigation resolves it; it needs a decision-maker. Its output is a *new ADR*. | `architecture-decision/07` §Group B; `01` §T-118d |
| **Q-4** — do production Sentry/PostHog credentials exist; what analytics scope was intended | [GCP]+[INTENT] | Credentials half needs vendor account access; scope half is a privacy-posture product decision (`10` §R2.2: "**Decision, not notice**"). | `03` §3 S1; `10` §4 R2.2 row |

**Known issue 1, verified independently and confirmed [V].** I enumerated `architecture-decision/07-Open-Questions.md`'s groups myself rather than accept the claim. Group A (12) = Q-8, Q-11, Q-13, Q-12, Q-7, Q-17, NQ-7, NQ-8, NQ-10, Q-14, Q-15, Q-16. Group B (6) = Q-1, Q-6, Q-10, Q-9, NQ-1, Q-2. **Q-4 appears in neither, nor in Groups C/D/E, nor in the roll-up.** The claim is accurate: Q-4 has **no owner row, no answering class, no default and no review-by** in the source register. It survives only as an aside in NQ-14's row.

**Known issue 2, verified independently and confirmed [V].** `07`'s section heading reads "**Open questions (26)**" (§30 preamble); its Roll-up row reads "**Total open | 25** (18 blocking … + 7 minor)" (§109); its group tables sum to **32** (A12 + B6 + C2 + D5 + E7). Three figures, none reconciling. `08` §6(4) and `09` §5.2 both report this accurately. `09` §5.2's reading — "the most likely reading is that **Q-4 was the dropped 26th row**" — is a plausible inference, and I label it as an inference, not a verified fact **[U]**.

**What happens to Sprint 1 if all three asks go unanswered? [V] Sprint 1 still completes.**

This is the plan's genuine strength and I verified it rather than assumed it. Each question-resolution item's Sprint 1 deliverable is **a recorded row**, not an answer:

- Q-1 — "Fallback while open: decisions proceed on their fixed directions; only production *verification* waits. **Record Q-1's status as a ledger row in T-120b.**" (`03` §3 S1)
- Q-2 — "**Record it in the ledger** with the `SITE_URL` localhost-fallback hazard flagged … **Do not invent a URL.**" (`03` §3 S1); this is Wave 1 exit criterion 13 (`02` §Wave 1).
- Q-4 — "Naming it here gives it eight sprints of lead time and **a ledger row**." (`03` §3 S1); fallback is "record the deferral and its reason in LDG-13" and `09` §5.1 makes "**Undecided is a task failure, not a deferral**" the explicit standard.

So an unanswered ask produces a *valid* ledger row, and the sprint's exit criteria are met. **Sprint 1 is not schedule-blocked by its own questions.** That is a well-designed property and it survives scrutiny.

**But it rests on one condition and one unstated assumption.**

**The condition [V].** A row is invalid without an **owner** and a **review-by** (`01` §T-120a; `09` §2.4, §6.1). "Open, owner = *unassigned*" is not a valid row — it is the exact defect ADR-120 exists to prevent and the exact state Q-4 is already in. So Sprint 1 can absorb *unanswered* questions but **cannot absorb unassignable ones**. This is PF-6, and it is why §2.1 reclassifies PF-6 out of "hygiene."

**The unstated assumption [U] — the most important thing I could not verify.** Everything above requires that a nameable person exists to own LDG-01…LDG-14 and to answer [INTENT]/[GCP] questions. The corpus establishes team size 1 and bus factor 1 ("all 140 commits single-author", `03` §1 table). It never establishes **who the product owner and project owner are, or whether they are the same person as the developer.** The plan's own position appears exactly once, hedged, buried in a likelihood paragraph of a risk narrative:

> `07-Risk` §X-3, §99: "Medium for the `[INTENT]` cluster, and lower than it looks, because **the sole developer is *plausibly* also the product owner**: these need a decision, not an investigation."

and its inverse, also once:

> `07-Risk` §X-1, §51: "Also triggered *silently* by **the sole developer being the same person who must answer the `[INTENT]` gates** — one absence stalls both execution and gate resolution."

**This assumption is load-bearing for Sprint 1 and it is carried nowhere it matters** — not in `08` §5's pre-flight table, not in `03` §3's Sprint 1 question items, not in `09` §5.3's per-row required fields ("**owner named** — a person, not a class"). If it holds, PF-6 and PF-7 are self-serviceable and Sprint 1 is comfortable. If it does not, PF-6 has nobody to name, T-120b cannot satisfy its acceptance criteria, and Sprint 1's central 3-day task fails on day one. **The plan does not state which world it is in.** That is the assumed-but-unstated item this review was asked to find.

Note the asymmetry that survives either way: even if the developer *is* the product owner, that resolves Q-2's decision half and Q-4's scope half. It does **not** resolve Q-1 or Q-4's credentials half, because those need a *provisioned project*, which is setup work and money, not intent. `07-Risk` §42 states this precisely: seven of the sixteen gates "cannot be answered without a provisioned production Firebase project."

---

## 4. Findings summary

| # | Finding | Class | Severity for Sprint 1 |
|---|---|---|---|
| **F-1** | `08` §5's "the rest is hygiene" misclassifies PF-4, PF-5, PF-6, PF-9 — all are Sprint 1 execution preconditions. PF-6 is a precondition of T-120b's acceptance criteria; PF-4 is a precondition of PR-1.5's verification. | **[C]** | **High** — condition |
| **F-2** | Sprint 1's stated acceptance evidence (E2E public/protected route pass) **does not exist at HEAD**; it is created by T-107d in Sprint 11, which is itself downstream of T-118a. Not in Sprint 1's 8-day load. | **[V]** | **High** — condition |
| **F-3** | Corpus contradicts itself on CI job count (discovery: 3; assessment: 5). **Assessment is correct — five jobs.** Verified out-of-corpus. Consequence favours Sprint 1: browser/E2E tiers are CI-enforced. | **[C]/[V-X]** | Informational — corrects a premise |
| **F-4** | CI lint is `continue-on-error: true`. The "gate runs on every PR without exception" claim (`04` §1.1, `08` §7(1)) is true only of the **local** hook. No task among the 63 flips it. | **[V]/[V-X]** | Low for S1, standing for program |
| **F-5** | Sprint 1's "user-visible defect closes" (`03`, `08`, `00-INDEX`) conflicts with `10` §5.1 "none of these units can be deployed anywhere." Both true; the outcome is **merge-visible**, not user-visible, until PF-1. | **[C]** | Medium — expectation |
| **F-6** | Sprint 1 contains **no non-reverting change class** (checked against all seven in `10` §3.3). T-118b's data-partition hazard is **Sprint 2**. But T-118a's revert restores code, not the consequence of a wrongly-widened allowlist — compounds F-2. | **[V]** | Medium |
| **F-7** | Q-4 confirmed absent from all five groups and the roll-up of `07`; `07`'s counts confirmed as 26 / 25 / 32. Q-4 has no owner, class, default or review-by in the source. | **[V]** | Medium — condition (PF-3) |
| **F-8** | Whether the sole developer is also the product/project owner is **stated once, hedged ("plausibly"), inside a risk-likelihood paragraph**, and carried into no pre-flight or sprint item. It is load-bearing for PF-6 and therefore for T-120b. | **[U]** | **High** — condition |
| **F-9** | Credentials axis is **fully clean**. Sprint 1 needs zero secrets to execute and zero to verify (emulator on `demo-e2e`, credential-free CI build, cleanly-skipped deploy job). | **[V]** | None — positive |

---

## 5. Is a Sprint 0 needed?

**Yes — a short one. Pre-flight items only; no engineering tasks.**

The artifacts define no Sprint 0 — I grepped `implementation-planning/` and `architecture-decision/` for "Sprint 0" / "sprint zero" and found **zero occurrences**. `08` §5 is the closest thing: a ten-item pre-flight table framed as "conditions on starting, not tasks in the plan."

That framing is right in principle and insufficient in practice, for one reason: **`08` §5's own closing sentence tells the reader that six of the ten items are optional** ("the rest is hygiene"), and three of those six are hard preconditions of Sprint 1 (F-1). A pre-flight list that a reader is invited to skip most of is not a gate. Naming the non-skippable subset **Sprint 0** converts it from advice into a bounded, checkable block of work with an exit condition.

**What Sprint 0 contains — verification and recording only, no engineering:**

| # | Item | Source | Why it must precede Sprint 1 |
|---|---|---|---|
| S0-1 | **PF-4** — Node, Firebase CLI and a **JDK** on `PATH`; run all five suites at HEAD and confirm green; pin the CLI and JDK versions. | `08` §5 PF-4 | PR-1.5's named E2E/browser tiers boot the JVM emulator. Without this, Sprint 1's behavioral change is unverifiable. (F-1) |
| S0-2 | **PF-5** — confirm the pre-commit gate green at HEAD; **record the baseline commit SHA**. | `08` §5 PF-5 | The first link in every rollback chain; Sprint 1 has no predecessor to revert to. |
| S0-3 | **PF-9** — agree the branch/tag/revert convention (sprint ends on a tagged deployable commit; the sprint PR set is the revert unit). | `08` §5 PF-9 | `08` justifies it with "no CI/CD pipeline and no deployment history (R-13)." PR-1.5's revert claim depends on it. |
| S0-4 | **Name the owners.** Identify the person answering [INTENT], the person with [GCP] console authority, and the person who decides hosting — even if all three are the same person. Record that fact. | F-8; `09` §5.3 ("owner named — **a person, not a class**") | Resolves the one unstated assumption in the plan. Without it PF-6 cannot be executed and T-120b cannot pass. |
| S0-5 | **PF-6** — assign an owner and a review-by date to every gated question, including **Q-4**. | `08` §5 PF-6, PF-3 | Direct precondition of T-120b's acceptance criteria (`01` §T-120b; `09` §2.4). Depends on S0-4 and PF-3. |
| S0-6 | **Decide PR-1.5's evidence.** Either schedule the public-route E2E cases inside Sprint 1 and accept the load increase, or record — before PR-1.5 opens — what will actually gate it and register the reduced verification. | F-2; `08` §1 rule 6; `09` §6.3 | Prevents Sprint 1's only behavioral change shipping against evidence three documents claim exists and none does. |
| S0-7 | **PF-10** — accept and record the program's shape, including the **two completion definitions**. | `08` §5 PF-10 | `08` states its own purpose here: "Discovering the gated proportion at Wave 5 … is the failure this document exists to prevent." |

**What Sprint 0 does *not* contain, deliberately:** PF-1 (hosting decision), PF-2 (provision Firebase), PF-3's register-correction pass, PF-7 ([INTENT] dispatch), PF-8 (CS-7 confirmation). These are the four that "change the readiness table" plus two more — they are **high-value and none of them blocks Sprint 1.** Putting them in Sprint 0 would gate the one sprint that is genuinely startable behind the hardest external items in the program, which is the opposite of what the plan achieved by design. They should be **dispatched in parallel with Sprint 1**, exactly as `03` §3 S1 and `02` §Wave 1 Entry criteria already prescribe ("Long-lead dispatch: open Q-4, Q-5 + NQ-1, Q-12 **now**").

**Size.** S0-1 through S0-7 are verification, naming and recording. At team size 1 this is well under one day of work and it is not a two-week sprint — call it a **pre-flight block**, run it in a sitting, and start Sprint 1 the same week.

---

## 6. Verdict

# ⚠️ APPROVED WITH CONDITIONS

**Sprint 1 is the right sprint to start, and it is nearly startable.** Its dependency graph is genuinely empty (§2.1), it holds no gated task (§2.2), it needs no credential and no approval (§2.5, §2.6), it contains no non-reverting change class (§2.7), its two-PR behavior/neutrality split is correct (§2.7), and its question items are designed to produce recorded rows rather than to wait on answers (§3). Nothing here is a planning defect — the plan's own quality is not in question.

It is **not** unconditionally approved because two things are true that no artifact currently reconciles: **the acceptance evidence Sprint 1 names for its only behavioral change does not exist** (F-2), and **`08` §5 tells the reader that the pre-flight items Sprint 1 actually depends on are optional** (F-1). A developer following the documents as written would start Sprint 1 without a JDK, without a baseline SHA, without named owners, and would then find that the E2E route pass they were told is the acceptance evidence has never been written. Every one of those is cheap to fix beforehand and expensive to discover mid-sprint.

### Conditions — all seven must be satisfied before PR-1.1 opens

| # | Condition | Discharges |
|---|---|---|
| **C-1** | Run **PF-4** to completion: Node, Firebase CLI and a **JDK** on `PATH`; all five suites executed at HEAD and green; CLI and JDK versions pinned and recorded. Do not treat PF-4 as scoped to S6/S7/S11 — **it is a Sprint 1 item**. | F-1, §2.4 |
| **C-2** | Run **PF-5** and **PF-9**: confirm the pre-commit gate green at HEAD, **record the baseline SHA**, and agree the tag/revert convention. This is the anchor for every `Reverts:` claim in Sprint 1's five PRs. | F-1, §2.1 |
| **C-3** | **Name a human owner** for [INTENT], [GCP]/[OPS] and the hosting decision — even if that is one person, and even if it is the developer. Record it. The plan's "the sole developer is *plausibly* also the product owner" is a hedge in a risk paragraph, not a recorded fact. | F-8 |
| **C-4** | Execute **PF-6** — owner + review-by for every gated question, **Q-4 included** — *before* T-120b, not during it. T-120b's acceptance criteria cannot be met otherwise: a row missing an owner or review-by is invalid by T-120a's own format statement and red by `09` §6.1. | F-1, F-7 |
| **C-5** | **Settle PR-1.5's evidence before it opens.** Either (a) author the public/protected route cases inside Sprint 1 and accept that the sprint exceeds its 8-day load, or (b) record explicitly what gates PR-1.5 instead, and log the reduced verification as a ledger note. **Do not merge PR-1.5 against evidence three documents claim exists and the corpus shows does not.** | F-2, F-6 |
| **C-6** | **Correct the record on CI topology** before anyone plans against it: CI has **five** jobs, not three. `project-discovery/01` §19 and §226 are wrong; `architecture-assessment/02` §184 is right. This is favourable — the browser and E2E tiers PR-1.5 needs are CI-enforced — but it must not be discovered later. | F-3 |
| **C-7** | **Restate Sprint 1's outcome as merge-visible, not user-visible**, in whatever form the team tracks sprint goals. `10` §5.1 is unambiguous that nothing deploys until PF-1. Sprint 1 closes a real defect on `main`; no user sees it yet. | F-5 |

### Recommended, not required

- **R-a.** Dispatch PF-1, PF-2, PF-3, PF-7 **in parallel with Sprint 1**, not before it. They gate nine later sprints and none gates Sprint 1; `02` §Wave 1 already prescribes exactly this ("Long-lead dispatch … **now**").
- **R-b.** Record the CI-lint gap (F-4) as a known standing condition. Sprint 1's exposure is negligible, but from Sprint 4 onward the program flips boundary rules to `error` (`04` §1.2 rule 3) and relies on a gate that CI does not enforce. No task among the 63 addresses this.
- **R-c.** Read this approval as scoped to Sprint 1 only. **Sprint 2 is materially different**: it carries T-118b, whose safe execution requires a production env-var comparison that Q-1 gates (`10` §3.5(4): "makes an 'ungated' Wave-1 task quietly dependent on Q-1"), and it is marked "READY (needs PF-8)". The eight-sprint runway claim is not re-verified here.

**On Sprint 0:** required, as the seven-item pre-flight block in §5 — verification, naming and recording only. It is a sitting, not a sprint. With it discharged, Sprint 1 starts immediately.
