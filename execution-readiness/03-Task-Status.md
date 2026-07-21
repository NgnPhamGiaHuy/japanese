# 03 — Task Status (adversarial re-classification of all 63 tasks)

**Phase 12 — Execution Readiness.** This document assigns a status to every one of the 63 tasks **independently**, using the readiness-kernel vocabulary: `READY` · `READY WITH ASSUMPTIONS` · `BLOCKED` · `OBSOLETE` · `MERGED` · `REMOVED`.

It does **not** inherit `01-Validated-Backlog.md`'s Ready/Gated/Open split. That split was tested against one rule:

> **A task is not READY if executing it safely requires information the project does not have.**

**Sources read:** `implementation-planning/01`–`10` (all), `architecture-decision/07-Open-Questions.md`. **Not read:** `src/` (kernel prohibits rescanning). **Absent input recorded once:** `requirements-consolidation/` does not exist and is unrecoverable; no Requirement-ID or Recommendation-ID is cited anywhere below.

**The line applied consistently.** An assumption downgrades a task from READY only when it affects **what to build** or **whether an acceptance criterion can be discharged**. An assumption that affects **only later production verification** does *not* downgrade the status — it is already covered by `08 §7` DoD #15 ("Emulator-green is never reported as production-verified"). Without this line, hosting being `[OPEN]` would make all 63 tasks non-READY and the review would carry no signal.

---

## 1. Status summary

| Status | Count | % |
|---|---:|---:|
| **READY** | 36 | 57% |
| **READY WITH ASSUMPTIONS** | 19 | 30% |
| **BLOCKED** | 8 | 13% |
| **OBSOLETE** | 0 | 0% |
| **MERGED** | 0 | 0% |
| **REMOVED** | 0 | 0% |
| **Total** | **63** | 100% |

**MERGED is deliberately zero.** `01 §2.1` records nine merges (M-1…M-9), but every one collapsed a *candidate* into an ID before the ID set was fixed. No task in the enumerated 63 is folded into another. Same for OBSOLETE/REMOVED — nothing in the set is superseded by anything else in the set.

### 1.1 How this compares to the artifacts

| | Artifacts (`01 §4.3`, `08 §2`) | This review |
|---|---|---|
| Executable **with no assumption** | 46 ("Ready") | **36** |
| Executable **on a named, recorded assumption** | 0 (the category does not exist in `08`) | **19** |
| **Cannot start** | 17 (16 Gated + 1 Open) | **8** |

**The artifacts' binary split errs in both directions simultaneously.** `08 §1` rule 2 states the policy that produces this: *"a `[GATED]` task is NOT READY until its question answers — **regardless of fallback**. The fallback governs what ships anyway; it does not confer readiness."* That rule is defensible for sprint verdicts and indefensible for task verdicts — it makes T-119e (delete a Storybook toolchain, entirely in-repo, git-restorable) and T-108d (collapse notification read paths, fallback strictly *do nothing*, non-reverting data effects) the same status. Ten of the sixteen gated tasks have a fallback that is a **real, completing action**; six do not.

Conversely, ten nominally-"Ready" tasks rest on information or acts the plan does not have — one of them (**T-118b**) hazardously so.

### 1.2 Contradiction with a kernel fixed fact

The kernel fixes: *"of the 16 gated, **12 executable-by-fallback / 4 inaction**."* Flagged, per instruction:

**My split is 10 executable-by-fallback / 6 no-fallback-permits-work.** Two tasks move:

- **T-109b** (`cardContentSchema`) — `01`'s own fallback is *"**Do not guess.** Hold at documented 'pending disposition'"*. Holding does not discharge the AC (*"The schema is either imported by a real write path **or removed**"*). The only executable part is correcting the misleading header — a fragment, not the task.
- **T-119d** (`fanOutNotifications`) — `01`'s fallback is *"Delete the un-called fan-out (the standing default), **but only after** the deployment-facts half of the gate is satisfied — the default covers intent, not deployment state."* The default is explicitly conditioned on facts the gate itself withholds. `05 Part C` states the fallback without that condition (*"Delete the un-called callable unless an operator invocation is confirmed"*), which is where the 12/4 count comes from. **`01` and `05` state different fallbacks for the same task; `01` governs (`05 §Authority`: "Where this file and the backlog state the same fact, the backlog governs").**

---

## 2. Delta table — every task where my status differs from the artifacts'

**20 of 63 re-classified.** Grouped by direction.

### 2.1 Downgrades: artifacts said Ready — 10 tasks

| Task | Artifacts | **This review** | Reasoning + citation |
|---|---|---|---|
| **T-118b** | Ready | **BLOCKED** | Full adjudication in §3. Safe execution requires comparing two env vars' **production** values; that is Q-6, which needs Q-1, which needs Q-2/T-118d `[OPEN]`. Failure is silent (`10 §5.2`: "nothing errors") and non-reverting (`10 §3.3(6)`: "No code revert reunites them"). `10 §4.2`: **"Holding it out is the recommended default."** |
| **T-118a** | Ready | **READY WITH ASSUMPTIONS** | The *direction* is fixed (NQ-2 closed-by-decision) but the **content of the canonical public set is not pre-committed anywhere**. `01` AC#3 demands "an explicit adjudication … which proxy-only entries the AuthGate must now honor" and names no decider. `07 §0` NQ-2's veto note leaves open that "the narrower AuthGate list was a deliberate duty-difference." Failure mode is a security one: `01 Regression scope` — "a wrongly-widened list is an auth-splash bypass." **Assumption:** the executor's adjudication (proxy list ⊇ canonical) stands without owner sign-off. |
| **T-120b** | Ready | **READY WITH ASSUMPTIONS** | AC requires **all four** ledger fields populated, including **owner** — which no repository fact supplies. `08 PF-6` puts owner-naming for all 16 gates *outside* the plan, and makes it depend on `PF-3` (adding a Q-4 row to the source register). Separately: **T-120b's AC enumerates ADR-108, -109, -110, -114, -118, -119 and omits ADR-116** — so the ledger backfill designed to catch unrecorded gated dispositions structurally omits Q-4, the one gate the plan itself identifies as having no owner anywhere. **Assumption:** owner = the sole developer; unknown production stages are recorded as "gated/unknown," not as facts. |
| **T-101a** | Ready | **READY WITH ASSUMPTIONS** | `08 §2` already annotates S2 "needs PF-8" and `08 PF-8` explains why: `04-Coding-Standards` flags that the CS-7 barrel policy "partially reverses a demonstrated preference (CX-4 — a June barrel removal was reverted in July)," so "the owner should confirm the reduction scope **before** lint-enforcing it." **Assumption:** PF-8 confirmation lands; the barrel-reduction scope is not vetoed. *(Formalizes a caveat `08` already carries in prose.)* |
| **T-101c** | Ready | **READY WITH ASSUMPTIONS** | Same PF-8 dependency — `08 PF-8` explicitly lists "S2, S27 (**and S4's flip**)". S4 is T-101c. Setting a contested rule to `error` is `07-Risk` X-10's worst case, and `01` notes the pre-commit gate then "blocks every commit." |
| **T-117d** | Ready | **READY WITH ASSUMPTIONS** | `01` AC#4 requires asserting "that admin authority cannot be self-granted from the client" — the **Q-10** territory that is unanswered. `01 Regression scope` demands "each deny case must derive from the **intended access model**, not from observed behavior" — but for the leaderboard (NQ-7) and card-image Storage (NQ-8) the intended model is explicitly undecided and `01 §2.2` records that they deliberately carry **no task**. `03 S7` supplies the workable fallback and in doing so **contradicts `01`'s AC**: "Assert the current rule as current, and note in the ledger that it is unratified." **Assumption:** current rules are canonized as *unratified*, per `03`, not derived from intent, per `01`. |
| **T-116a** | Ready | **READY WITH ASSUMPTIONS** | All four AC are in-repo checkable, so the task completes. But `03 S9` risk (b) makes a build decision depend on unavailable data: "a report on a hot path (SRS counters fire per review) can generate log volume that **costs money** or drowns signal. **Sampling decisions belong in this sprint, not after.**" Production volume is unprofiled (NQ-14, `07` Group D). `08 §4 S9` adds: "With Q-4 open the reports may terminate in a pipeline nobody reads (D-1)." **Assumption:** the in-repo `system_logs` pipeline is an acceptable terminus, and sampling rates are set on an unprofiled estimate. |
| **T-114a** | Ready | **READY WITH ASSUMPTIONS** | The **bound value** is a build decision. `08 §4 S13`: "its *value* is a product choice to record, not default silently." `10 §4.1` R3.2: "Whether the query bound truncates real result sets — depends on production public-deck volume (**NQ-6**)," an open `[DATA]` question. `01` concedes "NQ-6 sizes urgency only." **Assumption:** the bound is chosen without volume data and recorded as a product choice. |
| **T-108a** | Ready *(Q-7 default in force — `01 §5.6`)* | **READY WITH ASSUMPTIONS** | Vocabulary translation of `01`'s own position, not a substantive disagreement. `01 §5.6` insists it be "recorded as **Ready (Q-7 default in force)** rather than silently ungated" — which is precisely `READY WITH ASSUMPTIONS`. One added note: `07 Q-7`'s answer class is "Author intent (**+[DATA] Q-5 for the value census**)", so the count of 10 rests on `08 S21`'s claim that "W-7 is a pure code fact," not on a data sample. |
| **T-104a** | Ready | **READY WITH ASSUMPTIONS** | `08 §2` already annotates S27 "needs PF-8." Same barrel-scope confirmation as T-101a. *(Formalization.)* |

### 2.2 Upgrades: artifacts said Gated (⇒ NOT READY) — 10 tasks

Each has a fallback that is a **completing action**, executable today, with a recoverable failure mode.

| Task | Gate | **This review** | The fallback that permits the work |
|---|---|---|---|
| **T-116b** Sentry | Q-4 | **READY WITH ASSUMPTIONS** | The task's own AC#1 makes deferral a *pass*: "activation is **decided and recorded** against Q-4 — live with confirmed credentials **or explicitly deferred with the reason logged in the ledger**. An undecided state is a failure of this task." `03 S9` agrees outright: "this sprint is therefore **READY even with Q-4 open**." **Assumption:** deferral-by-default is accepted as the recorded decision. |
| **T-116c** PostHog | Q-4 | **READY WITH ASSUMPTIONS** | Same shape; the analytics-scope half is also discharged by a recorded deferral. The non-reverting hazard (`10 §3.3(4)`, "events cannot be unsent") lives on the *activation* branch, which the fallback does not take. |
| **T-114d** analytics reads | Q-9 | **READY WITH ASSUMPTIONS** | `01`'s fallback is a real action ("Delete the dead reads and their zero-fabricating fallbacks") and `10 §3.3(7)` confirms it "reverts cleanly — read-side only." ⚠ **But see §6.1 — `01` and `05` state opposite fallbacks for this task.** **Assumption:** no out-of-repo analytics writer exists. |
| **T-109c** `privacyModeSchema` | Q-12 | **READY WITH ASSUMPTIONS** | `08 §4 S20` recommends exactly this: "delete `privacyModeSchema` and `publicRoleSchema` (S-sized, zero-consumer, git-restorable) and hold only `cardContentSchema`." `07 Q-12`'s default is per-schema wire-or-delete. ⚠ `01`'s fallback says "hold" — see §6.2. |
| **T-109d** `publicRoleSchema` | Q-12 | **READY WITH ASSUMPTIONS** | Same. |
| **T-119a** 7 dormant kinds | Q-8 | **READY WITH ASSUMPTIONS** | Delete-unless-claimed; `08 §4 S24`: "Deletions are behavior-neutral by construction… If a deletion changes behavior, the premise was wrong and it should stop." **Assumption:** zero in-repo producers ⇒ zero stored documents. ⚠ `01` AC demands this be "**verified, not assumed**" and `10 §4.6` routes the verification to production `[DATA]` — see §6.3. |
| **T-119b** 8 `ActivityAction`s | Q-11 | **READY WITH ASSUMPTIONS** | Delete unclaimed + resolve the kana-practice asymmetry. ⚠ `01` and `08` state **opposite** defaults for the kana leg — see §6.4. HARD-depends on T-103a (in-plan). |
| **T-119c** inert admin surfaces | Q-13 | **READY WITH ASSUMPTIONS** | The cleanest of the ten. `10 §4.6`: "Confirmed inert — **verified in-repo**; the gate is product intent, not existence." No production access needed at all. |
| **T-119e** Storybook + SVGs | Q-17 | **READY WITH ASSUMPTIONS** | Wholly in-repo; blast radius is lint/test config, locally verifiable. `01`: "Q-17's answerability is rated **Low** … under ADR-119 an undecidable gate resolves to the default." |
| **T-110b** `Drawer` | NQ-3 | **READY WITH ASSUMPTIONS** | **NQ-3 is not open.** `07 §0` lists it under "Closed — RESOLVED-BY-DECISION," default = delete, owner-veto only. `01 §5.3`, `05 Part C` and `08 §6.3` all independently reach this. **Assumption:** the owner does not exercise the veto; "an unanswered veto window simply expires" (`01`). |

**Not upgraded (I agree with NOT READY):** T-109b, T-115c, T-108b, T-108c, T-108d, T-119d — see §2.1's kernel-fact flag and the main table.

---

## 3. The T-118b adjudication

**Verdict: BLOCKED.** Not READY, and not READY WITH ASSUMPTIONS.

### 3.1 What the plan says, in its own words

| Document | Position on T-118b |
|---|---|
| `01 §4.1`, `§4.3` | **Ready.** Wave 1: "14 tasks / **14 Ready / 0 Gated**" |
| `01 T-118b` AC#3 | "carries a ledger row noting that **production agreement is verified by Q-6 before the old variable retires**" |
| `01 T-118b` Regression scope | "**Tenant-root split is the failure mode being eliminated and also the risk of the change itself**" |
| `02 §T-118b sub-gate note` | Reconciles by splitting the task: "the **single derivation lands in Wave 1** (an in-repo change, ungated, verifiable by grep), and **retirement of the superseded env var is a ledger row gated on Q-6**" |
| `02` gate table | Q-6 → "T-119d *(**and T-118b's old-var retirement**)*" |
| `05 Part B #17` | Same reconciliation, classed `GATE`, crossing 5 ← 1 |
| `05 Part D.1` | Listed as a **day-1 zero-dependency parallel-start candidate** |
| `03 S2` | "this sprint lands the single derivation and records a verification-pending ledger row" |
| `04 PR-2.1` | "Reviewable: one derivation, two consumers; **the PR body states which env var wins and why**" · Tests: "unit; **the emulator run** proves the functions package resolves the same root" |
| `07-Risk §X` | Cites T-118b as a **mitigation**: "Both land before any deployment can misconfigure them" |
| `09` task table | **Ready**, ledger `LDG-15 †` |
| `09 †` footnote | "…unifying them repoints one package at a different `artifacts/{APP_ID}` root, which is **a data migration rather than a config cleanup**. Which world is real **cannot be read from the repo** (Q-1/Q-6)" |
| `10 §3.3(6)` | "**No code revert reunites them.** … **R1, the 'safe internal foundations' release, contains a latent data-partition change whose severity is unknown**" |
| `10 §4.2` | "Cannot be determined (Q-1 unanswered — **the current state**) → T-118b ships with an explicit recorded assumption that the values agree, **or is held out of R1. Holding it out is the recommended default**" |
| `10 §3.5 #4` | "R1's T-118b needs its pre-release check run before merge, **which makes an 'ungated' Wave-1 task quietly dependent on Q-1**" |
| `10 §5.2(1)` | "`APP_ID` derivation (T-118b) — **must flip in both packages together.** Any window where one package has the new derivation and the other has the old is a live tenant split: writes land in one partition, reads look in another, and **nothing errors**" |
| `08` | **Silent.** `§4 S2` verdict "✅ READY (needs PF-8)"; public-API column reads "✅ Additive"; test tier "Compiler + pre-commit gate." The hazard, Q-1, Q-6 and PF-2 are not mentioned in S2's row at all |

### 3.2 Why the 02/05 reconciliation does not hold

`02` and `05` defend the "Ready" label with one move: *the derivation is ungated; only the retirement waits on Q-6.* **That reconciliation is inconsistent with `01`'s own acceptance criteria, which `05 §Authority` says govern.**

- `01` AC#1: "`APP_ID` has **exactly one derivation** consumed by both packages; a search finds **no two independent** `?? "kana-nihongo-master"`-style default literals."
- `01` AC#2: "The functions package and the app resolve **the same namespace root** from the same source."

AC#2 is decisive. If a single derivation makes both packages resolve the **same** root, and in production the two variables currently resolve to **different** roots, then the derivation *is* the repartition — the retirement is irrelevant. There is no way to satisfy AC#2 and simultaneously preserve two divergent production values. The rollback note ("both remain readable during the transition") only helps if the derivation prefers each package's own variable — which would leave them resolving differently, failing AC#2.

`04 PR-2.1` proves the point without meaning to: **"the PR body states which env var wins and why."** *Which variable wins* **is** the partition decision. `10 §5.2(1)` confirms it from the deploy side — the derivation "must flip in both packages together," and any skew is "a live tenant split… nothing errors."

### 3.3 The chain of unavailability

The needed fact — *do `NEXT_PUBLIC_APP_ID` and `NOTIFICATIONS_APP_ID` resolve to the same value in the deployed environment?* — is **Q-6**, verbatim: `07 Group B` states Q-6 as *"Are the Cloud Functions deployed/operating; **do APP_ID vars agree in prod?**"*, answer class `[GCP]/[OPS]`.

`Q-6` requires knowing which project is production → **Q-1** (`07 Group B`, `[GCP]+[ENV]`) → which is downstream of the hosting decision → **Q-2 / T-118d**, which `01 §2.3` records as *"**not schedulable**"* and `08 §6.2` states plainly: *"the plan therefore requires in Wave 1 an answer whose precondition it declares unschedulable. … **the plan cannot unblock itself.**"*

So the information is not merely absent — it is **unobtainable within the plan**.

### 3.4 Why BLOCKED rather than READY WITH ASSUMPTIONS

`10 §4.2` does offer an assumption route ("ships with an explicit recorded assumption that the values agree"). It fails all three tests that make an assumption legitimate:

1. **The assumption's falsity is undetectable.** `10 §5.2(1)`: "nothing errors." A recorded assumption you cannot later check is a guess with a paper trail.
2. **The failure is non-reverting.** `10 §3.3(6)`: "No code revert reunites them." Every other READY WITH ASSUMPTIONS task in this document has a git-restorable or redeployable failure path.
3. **The plan's own release document declines it.** `10 §4.2`: "**Holding it out is the recommended default**, because the failure mode is silent."

By the kernel rule — *not READY if executing it safely requires information the project does not have* — T-118b is BLOCKED. The in-repo half (write the shared derivation module, leave both consumers reading their existing variable, open LDG-15) is real preparatory work, but it does not discharge AC#2 and is therefore a **partial start**, not the task.

### 3.5 Consequence for Wave 1

1. **Wave 1 cannot meet its own exit criterion.** `02 §Wave-1 exit` criterion 9 — *"`APP_ID` has one derivation shared by app and functions (grep: not two independent `?? "kana-nihongo-master"` literals)"*, cited as **ADR-118 SC-2** — is unreachable. `09 §Wave-1 completion` carries the same clause. Both must be marked **carried**, not met.
2. **Wave 1 is 13 of 14 tasks, not 14 of 14.** `01 §4.1`'s "Wave 1 · 14 Ready / **0 Gated**" is false by `02`'s own gate table, which lists Q-6 against T-118b.
3. **Sprint 2 drops from 8 d to 5 d** (T-118c 1 + T-101a 3 + T-103a 1). The sprint still ships; nothing downstream depends on T-118b (`05 Part D.3` lists it among the plan's leaves in effect — no task waits on it).
4. **R1 loses its only non-reverting change.** With T-118b held out, `10`'s "safe internal foundations" release becomes genuinely safe. This is the argument *for* holding it out, not against.
5. **`08` needs a correction**, not just a caveat. S2's row must carry PF-2/Q-1 as a dependency and a real-environment verification tier; "Compiler + pre-commit gate" cannot detect a tenant split, and `10 §4.1` already contradicts it by listing R1's `APP_ID` comparison as **"Verifiable only in a real environment."**

**T-118b is not a planning defect.** Every fact needed to reach this verdict is already written down — in `10`, `09`'s footnote, and `01`'s own regression scope. What failed is that the **status field** (`01`, `09`) and the **readiness verdict** (`08`) were not updated to match what the release plan discovered. The hazard is documented and mis-labelled, which is worse than undocumented: a reader who consults only `01`/`08`/`09` — the three documents an executor most naturally reads — will ship it in Sprint 2.

---

## 4. The full 63-task table

**Legend.** *Artifacts* = `01 §4.3` status (`08 §2` maps Gated ⇒ NOT READY). *Blocker/assumption* names the specific missing information.

### Wave 1 — Platform Foundations (14)

| ID | W | Artifacts | **This review** | Assumption or blocker | Evidence |
|---|:-:|---|---|---|---|
| T-120a | 1 | Ready | **READY** | — In-repo doc artifact, fixed schema, rollback = delete file | `01 T-120a`; `05 D.1` (head of critical path, zero predecessors) |
| T-120b | 1 | Ready | **READY WITH ASSUMPTIONS** | Owner field unavailable from repo; production stages unknown; **AC omits ADR-116/Q-4** | `01 T-120b` AC (enumerates ADR-108/109/110/114/118/119 only); `08 PF-6` (depends on PF-3) |
| T-120c | 1 | Ready | **READY** | — File-count comparison against `docs/adr/*.md` | `01 T-120c`; `05 D.1` "wholly isolated" |
| T-118a | 1 | Ready | **READY WITH ASSUMPTIONS** | Canonical public-route set is an executor adjudication with no named decider | `01 T-118a` AC#3; `07 §0` NQ-2 veto note; `08 §4 S1` "⚠ Behavioral" |
| **T-118b** | 1 | Ready | **BLOCKED** | Requires production values of two env vars (Q-6 ⟸ Q-1 ⟸ Q-2/T-118d `[OPEN]`); silent + non-reverting | **§3** · `10 §3.3(6)`, `§4.2`, `§3.5 #4`, `§5.2(1)`; `09 †` |
| T-118c | 1 | Ready | **READY** | — Greppable enumeration; no secrets; dev-reachable on demo IDs | `01 T-118c`; `10 §5.4` ("documents the surface; does not provision it") |
| T-101a | 1 | Ready | **READY WITH ASSUMPTIONS** | PF-8 barrel-reduction scope unconfirmed (CX-4 reversal precedent) | `08 §2` S2 "needs PF-8"; `08 PF-8` |
| T-101b | 1 | Ready | **READY** | — Import-specifier rewrite; failures are compile errors | `01 T-101b`; `08 §4 S3` |
| T-101c | 1 | Ready | **READY WITH ASSUMPTIONS** | PF-8; `error`-severity flip on a contested rule blocks every commit (X-10) | `08 PF-8` ("and S4's flip"); `01 T-101c` Regression scope |
| T-103a | 1 | Ready | **READY** | — Type-only relocation; normalizer preserved | `01 T-103a`; `05 D.1` |
| T-103b | 1 | Ready | **READY** | — After T-103a (in-plan) | `05 Wave-1 edges` |
| T-102a | 1 | Ready | **READY** | — Design work, wholly in-repo | `01 T-102a`; `08 §4 S4` |
| T-102b | 1 | Ready | **READY** | — Verified on the existing realtime E2E path | `01 T-102b` AC#2 |
| T-102c | 1 | Ready | **READY** | — After T-102b (in-plan) | `05 Wave-1 edges` |

### Wave 2 — Safety Net (8)

| ID | W | Artifacts | **This review** | Assumption or blocker | Evidence |
|---|:-:|---|---|---|---|
| T-117a | 2 | Ready | **READY** | — Pure unit, no emulator; discriminating-test AC is self-checking | `01 T-117a` AC#3/#4 |
| T-117b | 2 | Ready | **READY** | — Pure unit; ADR-115 fixes which semantics are authoritative | `01 T-117b`; `05 Part B #7` (HARD, safety-critical) |
| T-117c | 2 | Ready | **READY** | — Emulator/JDK is a local toolchain (PF-4), provisionable, demonstrably working at HEAD `a0bbbc4` | `08 PF-4`; `03 S6` |
| T-117d | 2 | Ready | **READY WITH ASSUMPTIONS** | Intended access model undecided (NQ-7/NQ-8 carry **no task**); Q-10 unanswered for the `admins` assertion | `01 T-117d` AC#4 + Regression scope **vs** `03 S7` ("assert the current rule as current… unratified") |
| T-117e | 2 | Ready | **READY** | — Pure unit, additive, zero downstream dependents | `05 D.2`, `D.3` |
| T-116a | 2 | Ready | **READY WITH ASSUMPTIONS** | Hot-path sampling rates set without profiling (NQ-14); reports may terminate unobserved (D-1) | `03 S9` risk (b); `08 §4 S9`; `10 §4.1` R2.1 |
| T-116b | 2 | **Gated Q-4** | **READY WITH ASSUMPTIONS** | Deferral-by-default accepted as the recorded decision | `01 T-116b` AC#1; `03 S9` ("READY even with Q-4 open") |
| T-116c | 2 | **Gated Q-4** | **READY WITH ASSUMPTIONS** | Same; analytics scope "accepted by decision" rather than widened | `01 T-116c` AC#1; `10 §3.3(4)` (hazard is on the activation branch only) |

### Wave 3 — Security & Data Layer (10)

| ID | W | Artifacts | **This review** | Assumption or blocker | Evidence |
|---|:-:|---|---|---|---|
| T-107a | 3 | Ready | **READY** | — Direction fixed; Q-1/Q-2 affect **verification only**, covered by DoD #15. Build requirement (independent cookie-clearing path) is in-repo satisfiable | `08 §4 S10`; `10 §3.3(1)` pre-release requirement; `08 §7` #15 |
| T-107b | 3 | Ready | **READY** | — Searchable AC ("zero `document.cookie` reads") | `01 T-107b` AC#1 |
| T-107c | 3 | Ready | **READY** | — Lifetime tracks the server-verifiable session; in-repo decidable | `01 T-107c` |
| T-107d | 3 | Ready | **READY** | — E2E bridge (`window.__e2eSignIn`, R-9) limits what the tier *proves*, not what the task *delivers* | `08 §4 S11` |
| T-113a | 3 | Ready | **READY** | — AC requires a listener **count**, not a profile | `01 T-113a` AC#1; `08 §4 S12` (NQ-14 caveat is about claims, not execution) |
| T-113b | 3 | Ready | **READY** | — "a count, not a percentage" is observable in-browser | `01 T-113b` AC#4 |
| T-114a | 3 | Ready | **READY WITH ASSUMPTIONS** | The **bound value** needs production deck volume (NQ-6, open `[DATA]`) | `08 §4 S13`; `10 §4.1` R3.2; `01 T-114a` AC#4 |
| T-114b | 3 | Ready | **READY** | — Ungated policy on *both* Q-9 branches | `01 §2.1` DEL-7 split; `07 Q-9` |
| T-114c | 3 | Ready | **READY** | — Same | `01 T-114c` |
| T-114d | 3 | **Gated Q-9** | **READY WITH ASSUMPTIONS** | No out-of-repo writer exists; default branch is read-side-only and git-restorable. ⚠ `01`↔`05` state opposite fallbacks (§6.1) | `01 T-114d` Fallback **vs** `05 Part C` T-114d; `10 §3.3(7)` |

### Wave 4 — Contracts & Convergence (12)

| ID | W | Artifacts | **This review** | Assumption or blocker | Evidence |
|---|:-:|---|---|---|---|
| T-109a | 4 | Ready | **READY** | — AC carries an explicit escape ("documented as unenforced-by-decision"); read side unaffected. Production-rejection risk is verification-only | `01 T-109a` AC#2; `10 §4.1` R4.1 |
| T-109b | 4 | **Gated Q-12** | **BLOCKED** | `01`'s fallback is "**Do not guess.** Hold at pending disposition" — holding does not discharge "enforced **or removed**." Enforcing against non-conforming stored data is a data migration (TD-5) | `01 T-109b` Fallback + Regression scope; `08 §4 S20` ("hold only `cardContentSchema`") |
| T-109c | 4 | **Gated Q-12** | **READY WITH ASSUMPTIONS** | Zero-consumer, S-sized, git-restorable; delete branch is behavior-neutral | `08 §4 S20` recommendation; `07 Q-12` default |
| T-109d | 4 | **Gated Q-12** | **READY WITH ASSUMPTIONS** | Same | `08 §4 S20`; `07 Q-12` |
| T-109e | 4 | Ready | **READY** | — In-repo; incremental by design | `01 T-109e` |
| T-115a | 4 | Ready | **READY** | — Behavioral delta is deliberate and recorded; nets (T-117b/d) are in-plan | `01 T-115a` AC#2; `05 Part B #7` |
| T-115b | 4 | Ready | **READY** | — Report-only staging is **recorded, not merely asserted**: `02 §staging note` + exit criterion 10, `03 S17`+`S21`, `04 PR-21.1`, `09 §§4.2/402/453`, `10 §4.1`+`§4.5 step 0` | Kernel known-issue 8 — **verified resolved** |
| T-115c | 4 | **Gated Q-10** | **BLOCKED** | Fallback is inaction: "**Do nothing to the predicates.**" Aligning to the wrong source "could lock out all admins or grant authority too broadly" | `01 T-115c` Fallback + Regression scope; `07 Q-10` |
| T-106a | 4 | Ready | **READY** | — Additive; both legacy clients stay functional | `08 §4 S15` |
| T-106b | 4 | Ready | **READY** | — Characterization tests first (X-7), in-plan | `08 §4 S16` |
| T-106c | 4 | Ready | **READY** | — Sequenced after T-107a/b (in-plan) | `01 T-106c` Regression scope |
| T-106d | 4 | Ready | **READY** | — Must land after T-106b/c; missed callers are compile errors | `08 §4 S17`; `10 §3.4` (revert the *unit*) |

### Wave 5 — Migration Completion (10)

| ID | W | Artifacts | **This review** | Assumption or blocker | Evidence |
|---|:-:|---|---|---|---|
| T-108a | 5 | Ready *(Q-7 default)* | **READY WITH ASSUMPTIONS** | Q-7's standing default holds; the 10-value census is taken from code, though `07 Q-7` couples it to `[DATA]` Q-5 | `01 §5.6`; `07 Q-7`; `08 §4 S21` ("W-7 is a pure code fact") |
| T-108b | 5 | **Gated NQ-1** | **BLOCKED** | AC requires the deploy state be "**established and recorded**" — needs console/deployment records. Fallback degrades the deliverable to "unknown" | `01 T-108b` AC#1 + Fallback; `10 §5.3` |
| T-108c | 5 | **Gated Q-5** | **BLOCKED** | Fallback is inaction ("**Retain everything**"); premature removal "silently hides pre-migration notifications" and rollback is asymmetric | `01 T-108c` Fallback + Rollback; `10 §3.3(3)` |
| T-108d | 5 | **Gated Q-5** | **BLOCKED** | Fallback is inaction ("**Do not collapse**"). **Terminal node of the critical path** — the program has no in-repo completion condition | `01 §5.5`; `05 §Gate observations`; `08 §6.5` (X-14) |
| T-108e | 5 | Ready | **READY** | — AC explicitly survives the gates: "including honestly recording '**still gated**' if it is" | `01 T-108e` AC#2; `05 Part B #12` (needs only T-120a) |
| T-119a | 5 | **Gated Q-8** | **READY WITH ASSUMPTIONS** | Zero in-repo producers ⇒ zero stored documents. ⚠ `01` AC says "**verified, not assumed**"; `10 §4.6` routes it to production `[DATA]` (§6.3) | `01 T-119a` AC#4 **vs** `10 §4.6`; `08 §4 S24` |
| T-119b | 5 | **Gated Q-11** | **READY WITH ASSUMPTIONS** | Same, for `system_logs`. ⚠ `01` and `08` give **opposite** defaults for the kana-practice leg (§6.4) | `01 T-119b` Fallback **vs** `08 §4 S24`; `05 Part B #13` (HARD on T-103a) |
| T-119c | 5 | **Gated Q-13** | **READY WITH ASSUMPTIONS** | Delete default; inertness is **in-repo verified** — no production access needed | `10 §4.6`; `01 T-119c` Fallback |
| T-119d | 5 | **Gated Q-6** | **BLOCKED** | `01`'s own fallback is conditioned on facts the gate withholds: delete "**but only after** the deployment-facts half of the gate is satisfied — the default covers intent, not deployment state." Deleting a deployed callable is not repo-revertible | `01 T-119d` Fallback; `10 §3.3(5)`, `§4.6`; `03 S22` ("do not delete on assumption") |
| T-119e | 5 | **Gated Q-17** | **READY WITH ASSUMPTIONS** | Delete default; Q-17 answerability rated **Low**, and an undecidable gate resolves to the default. Blast radius (lint/test config) is locally verifiable | `01 T-119e` Fallback + Regression scope |

### Wave 6 — Structure & Patterns (8)

| ID | W | Artifacts | **This review** | Assumption or blocker | Evidence |
|---|:-:|---|---|---|---|
| T-105a | 6 | Ready | **READY** | — Behavior-neutral move; NQ-5 closed-by-decision with a recorded veto path | `07 §0` NQ-5; `08 §4 S26` |
| T-105b | 6 | Ready | **READY** | — Dependency test is search-verifiable | `01 T-105b` AC#1 |
| T-104a | 6 | Ready | **READY WITH ASSUMPTIONS** | PF-8 barrel-reduction scope | `08 §2` S27 "needs PF-8" |
| T-104b | 6 | Ready | **READY** | — After T-104a; rule scoped to `features/flashcard/**` | `01 T-104b` AC#2 |
| T-110a | 6 | Ready | **READY** | — Hex→token mapping is an in-repo adjudication the AC already requires be explicit | `01 T-110a` AC#4 |
| T-110b | 6 | **Gated NQ-3** | **READY WITH ASSUMPTIONS** | **NQ-3 is closed** in the source (`07 §0`), default = delete, owner-veto only | `01 §5.3`; `05 Part C`; `08 §6.3` |
| T-111a | 6 | Ready | **READY** | — NQ-4 closed-by-decision; NQ-4's veto is the recorded escape hatch | `07 §0` NQ-4; `08 §4 S29` |
| T-112a | 6 | Ready | **READY** | — Documentation + search checks | `01 T-112a` |

### Unscheduled (1)

| ID | W | Artifacts | **This review** | Assumption or blocker | Evidence |
|---|:-:|---|---|---|---|
| T-118d | — | **Open (Q-2)** | **BLOCKED** | Not schedulable. Output is a *decision producing a new ADR*, not code. The localhost fallback is inaction, not a fallback that permits work | `01 §2.3`; `08 §6.2`, `PF-1`; `10 §5.1` |

---

## 5. The Sprints 1–8 runway — task by task

`00-INDEX §Where to start`: *"**Sprints 1–8 form an unbroken ~16-week runway with zero external dependencies.** … No question needs answering before Sprint 1 begins."*
`08 §3`: *"**Eight consecutive READY sprints with zero external dependencies.** Nothing in S1–S8 waits on a production project, a product-owner decision, or a deployment record."*

Tested against all 19 tasks in S1–S8:

| Sprint | Task | **Status** | Does it wait on something outside the plan? |
|:-:|---|---|---|
| **1** | T-120a | READY | No |
| **1** | T-120b | RWA | **Yes** — PF-6 owner designation for 16 gates, itself dependent on PF-3 (a **source-document fix** to `architecture-decision/07`) |
| **1** | T-120c | READY | No |
| **1** | T-118a | RWA | **Yes (soft)** — the canonical public-route set is an unassigned adjudication; NQ-2's veto note keeps the narrower list defensible |
| **2** | **T-118b** | **BLOCKED** | **Yes — production env-var values (Q-6 ⟸ Q-1 ⟸ Q-2/T-118d `[OPEN]`)** |
| **2** | T-118c | READY | No |
| **2** | T-101a | RWA | **Yes** — PF-8 owner confirmation of the CS-7 barrel-reduction scope |
| **2** | T-103a | READY | No |
| **3** | T-101b | READY | No |
| **4** | T-101c | RWA | **Yes** — PF-8 (`08 PF-8` names "S4's flip" explicitly) |
| **4** | T-103b | READY | No |
| **4** | T-102a | READY | No |
| **4** | T-102b | READY | No |
| **5** | T-102c | READY | No |
| **5** | T-117a | READY | No |
| **5** | T-117b | READY | No |
| **6** | T-117c | READY | No — PF-4 is a **local toolchain** condition, provisionable, proven at HEAD `a0bbbc4` |
| **7** | T-117d | RWA | **Yes (soft)** — the intended access model for NQ-7/NQ-8/Q-10 is undecided; `03 S7` supplies a workaround that contradicts `01`'s AC |
| **8** | T-117e | READY | No |

### 5.1 Verdict on the runway claim

**The claim as written does not survive. The runway itself substantially does.**

- **"Zero external dependencies" is false.** Five of nineteen tasks wait on something outside the plan, and one of them — **T-118b — is BLOCKED, not merely caveated.** `10 §3.5 #4` already says this in as many words: *"which makes an 'ungated' Wave-1 task quietly dependent on Q-1."*
- **"No question needs answering before Sprint 1 begins" is false as stated, true in effect.** Nothing must be *answered*; but three acts must be *performed* (PF-3 source-register fix, PF-6 owner designation, PF-8 barrel-scope confirmation), and one task must be *deferred* (T-118b). None is engineering work; none is zero.
- **`08 §3`'s own supporting text overstates the S2 deliverable.** It lists "one `APP_ID` derivation across both deploy units" as an S2 outcome. That outcome is exactly what cannot be safely produced.

**The corrected claim, which does survive:**

> Sprints 1–8 form an unbroken ~16-week runway of **18 executable tasks**, delivering enforced boundaries, a live ledger, a broken feature cycle, `.env.example`, and the full Wave-2 regression net. **One task (T-118b, 3 d) must be deferred** pending Q-6. **Three non-engineering pre-flight acts** (PF-3, PF-6, PF-8) must be performed before S1/S2/S4. Sprint 2 falls to 5 d; no downstream task is affected, because nothing in the plan depends on T-118b (`05 Part D`).

The end-of-S8 outcome `08 §3` describes — *"enforced boundaries, single-sourced config, a live ledger, a broken cycle, and a regression net over exactly the code Waves 3–4 rewrite"* — is reached, with one asterisk on "single-sourced config."

---

## 6. Contradictions found between planning documents

Each is a live conflict where an executor following one document would do the opposite of another. Reported, not resolved.

**6.1 — T-114d's fallback is stated two ways.**
`01 T-114d` and `01 §2.4`: *"**Remove the dead read paths** and their zero-fabricating fallbacks"* (standing default). `05 Part C`: *"**Do not delete the reads** — an out-of-repo pipeline may exist… T-114d becomes a ledger row that may carry into Wave 5."* The source register does not settle it: `07 Q-9`'s default makes deletion **conditional** ("if no writer exists → remove read paths"), which is what Q-9 asks. `01`'s claim of a pre-committed delete is unsupported by `07`.

**6.2 — T-109c/d's fallback is stated two ways.**
`01`: *"Hold at documented pending disposition."* `08 §4 S20`: *"**Recommended if Q-12 stays open:** delete `privacyModeSchema` and `publicRoleSchema`."* `07 Q-12`'s default sides with `08` ("wire into the write path if adoption was intended, **else delete**").

**6.3 — T-119a's "verified" is not verifiable where it is scheduled.**
`01 T-119a` AC#4: *"no stored document carries a dormant kind — **verified, not assumed**."* `10 §4.6` routes that verification to production data (`Q-8 / [DATA]`). A code-only fact (zero producers) is offered by `08 §4 S24` as sufficient. The AC as written cannot be met without production access; as intended, it can.

**6.4 — T-119b's kana-practice leg has opposite defaults.**
`01 T-119b` Fallback: *"resolve the kana-practice gap **in the deletion direction** and record the asymmetry as intended."* `08 §4 S24`: *"the kana-practice logging gap is a *provable* omission… **do not delete it by default**."* `07 Q-11` is neutral ("resolved in the direction its gate answers"). These are contradictory instructions for the same fallback.

**6.5 — Two documents each claim a *different* task has the plan's only inaction fallback.**
`01 §2.4` on T-115c: *"This is **the one gate** whose default is *inaction*."* `05 Part C` on T-108d: *"The **only** strictly-*do-nothing* fallback in the plan."* Both are wrong: T-108b ("retain"), T-108c ("retain everything"), T-108d ("do not collapse") and T-115c ("do nothing to the predicates") are all inaction — **four**, exactly matching the kernel's fixed "4 inaction" count. Each document's uniqueness claim contradicts the other and both contradict the kernel.

**6.6 — `08` and `10` disagree on R1/S2's verification tier.**
`08 §4 S2` test tier: *"Compiler + pre-commit gate."* `10 §4.1` R1: *"Verifiable **only in a real environment**: `APP_ID` value comparison (Q-1/Q-6)."* Neither a compiler nor a pre-commit hook can detect a tenant split.

**6.7 — `03` and `08` disagree on whether Sprint 9 is READY.**
`03 S9`: *"this sprint is therefore **READY even with Q-4 open**, which is the exception among the gated sprints and is worth stating."* `08 §2`: S9 **⛔ NOT READY**. This is `08 §1` rule 2 applied mechanically. My task-level verdict sides with `03`.

**6.8 — `05`'s "all sixteen fallbacks are pre-committed" is false for Q-4.**
`05 §Gate observations`: *"All sixteen fallbacks are pre-committed positions. Per `07-Open-Questions`: 'each default is the pre-committed position'."* **Q-4 appears nowhere in `07`** — not in Groups A–E, not in the roll-up, not in the standing-defaults summary. Independently confirmed: `07`'s heading says **26** open questions, its roll-up totals **25**, and its group tables sum to **32** (A 12 + B 6 + C 2 + D 5 + E 7). T-116b/c's fallback was **constructed by the planning phase**, not carried from the source. It is a good fallback; it is not pre-committed, and `05`'s citation of `07` to justify it is unsupported.

**6.9 — `01 §4.1`'s "Wave 1: 0 Gated" contradicts `02`'s own gate table**, which lists Q-6 against *"T-119d (**and T-118b's old-var retirement**)"*.

---

## 7. Verified / Unverifiable / Contradicted (kernel output rule)

**Verified from the documents:**
- The 63-task enumeration is internally consistent across `01 §4`, `02`, `05`, `09` (14+8+10+12+10+8+1). No "50" residue survives — every one of `01 §5.1`, `02 §9`, `03 §10`, `05 §Authority`, `06 §Authority`, `07-Risk §5`, `08 §5`/`§6.1` records it as a confirmed transcription error.
- **T-115b's report-only staging is genuinely recorded, not merely asserted** (kernel known-issue 8): `02 §staging note` + Wave-4 exit criterion 10 + Wave-5 exit criterion 2; `03 S17` staging note + `S21` flip; `04 PR-21.1`; `09` footnote § + health indicator + wave-boundary action; `10 §4.1` R4.1 + `§4.5` step 0.
- Acceptance criteria, regression scope and rollback exist for all 62 wave-assigned tasks (`08 §1` verification note), spot-checked against `01` for every task in this table. **No task in this document is BLOCKED for a planning defect** — all eight are blocked by absent external information.
- Q-4's absence from `07` and that register's non-closing arithmetic (26 / 25 / 32) — confirmed by direct reading.

**Unverifiable from the documents:**
- Whether the two `APP_ID` values actually agree in production. This is the crux of §3 and is unobtainable in-repo by construction.
- Whether `T-119a`/`T-119b`'s deletions are truly behavior-neutral against **stored** data (`10 §4.6` says only production can answer).
- Whether the ~30 env vars in `T-118c`'s scope is the true count — `01`, `08`, `10` all say "~30" with no cited enumeration.

**Contradicted:** the nine items in §6, plus the kernel's fixed "12 executable-by-fallback / 4 inaction" split (§1.2).

---

## 8. Conclusion — immediately-executable count

| Measure | Count |
|---|---:|
| Executable today, **no assumption required** | **36 of 63** (57%) |
| Executable today, **on a named and recorded assumption** | **19** (30%) |
| **Total startable today** | **55 of 63** (87%) |
| **Cannot start** | **8** (13%) |

**The eight BLOCKED tasks, in full:** T-118b (Q-6/Q-1), T-109b (Q-12), T-115c (Q-10), T-108b (NQ-1), T-108c (Q-5), T-108d (Q-5), T-119d (Q-6), T-118d (Q-2, not schedulable).

**Seven of the eight cluster on two facts:** *which Firebase project is production* (Q-1 ⇒ Q-6 ⇒ T-118b, T-119d; and NQ-1 ⇒ T-108b) and *what is in its notification data* (Q-5 ⇒ T-108c, T-108d). T-109b and T-115c are the only blocks that are neither — one an author-intent question with a data-migration tail, one an ops question whose wrong answer locks out every admin.

**The headline is not that the plan is over-optimistic.** It is that the plan's binary status field is **too coarse in both directions**: it withholds READY from ten tasks that can be completed today on a documented default, and grants it to ten that cannot be completed without information nobody has — including one, **T-118b**, whose failure mode the plan's own release document describes as silent, non-reverting, and best avoided by not shipping it.

Every fact needed to reach these verdicts was already written down somewhere in `implementation-planning/`. What is missing is not analysis. It is that `01`'s status column, `08`'s sprint verdicts, and `10`'s release hazards were never reconciled against one another.

---

*Scope note: this file assigns task status only. Question classification is Phase 2's; sprint and release verdicts are Phase 4's; the program GO / GO-WITH-CONDITIONS / NOT-READY verdict is the coordinator's.*
