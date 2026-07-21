# 05 — Risk Register (Execution-Readiness Review)

**Phase 5 · Adversarial review of risk *coverage*.** This is not a new risk analysis and it re-rates none of X-1…X-14 or R-1…R-19. It asks one question of nine operational areas: **does the artifact set actually cover this, and if not, does the gap block Sprint 1 or a later wave?**

**Absence is a finding.** Three of the nine areas are covered by nothing. That is the most useful output of this file.

---

## 1. Coverage matrix

| # | Area | Verdict | Blocks? |
|---|---|:--:|---|
| 1 | **Rollback strategy** | **Adequate** | No — strongest section in the corpus; one false rationale to correct |
| 2 | **Release boundaries** | **Adequate** | No |
| 3 | **Migration safety** | **Adequate** (notifications) / **Thin** (`APP_ID`) | **Wave 1** — T-118b's "values differ" branch has no procedure |
| 4 | **Feature flags** | **ABSENT** | **Wave 3** — R3.1's lockout risk is unmitigated by a mechanism the repo already ships |
| 5 | **Production risks** | **Thin** | **Wave 4** — R4.1/R4.2 lean on monitoring that may never exist |
| 6 | **Data-migration risks** | **Adequate** | Wave 5 — one concrete safeguard is missing from the checklist |
| 7 | **Monitoring** | **Thin** | **Wave 4** — no alerting, thresholds, or post-release watch anywhere |
| 8 | **Observability** | **Thin** | Wave 2 — pipeline planned; the reading end is undefined |
| 9 | **Disaster recovery** | **ABSENT** | **Wave 5** — irreversible data operations with no stated backup posture |

**Nothing in this matrix blocks Sprint 1.** The two Absent areas and the two most consequential Thin ones bite in Waves 3–5, which gives them between eight and forty weeks of lead time. That is the good news; the bad news is that none of them is currently owned by anyone.

---

## 2. Area-by-area assessment

### 2.1 Rollback strategy — **Adequate**

**What the artifacts provide.**

| Provision | Where | Substance |
|---|---|---|
| Governing rule | `10-Release-Plan.md` §3.1 | **"Revert granularity is the release unit, not the PR."** Reverting one PR out of a converged set "produces exactly the half-migrated state the kernel forbids." |
| Clean-revert inventory | `10` §3.2 | 16 change classes with per-class reasoning (e.g. type widening — "`NotificationType` is compile-time only; **no write behavior changes**, so no data is affected either way"). |
| Non-reverting inventory | `10` §3.3 | Seven classes — assessed separately in §3 below. |
| Partial-revert trap | `10` §3.4 | R4.2: reverting T-106d after T-106b/c "leaves call sites pointing at a client that no longer exists in the shape they expect." **Recorded because it is the change most likely to be reverted badly under pressure.** |
| Ordering implications | `10` §3.5 | Four rules, incl. "**a non-reverting unit never ships ahead of its verification capability.**" |
| Operational form | `10` §6 | Checklist ROLLBACK block: revert command at unit granularity · checked against §3.3 · irreversibility named · forward-fix path defined · pre-release state captured · **rollback owner** in sign-off. |
| Program-level fallback | `07-Risk-and-Mitigation.md` §4 (1) | "A sprint that cannot meet its exit criteria **reverts; it does not extend**." |

**Assessment.** This is the most rigorous section in the artifact set. The unit-granularity rule and §3.4's near-miss analysis are the kind of thing that is normally learned from an incident rather than written in advance.

**Gaps.**
1. **"Rollback rehearsed where the unit permits it"** (`10` §6) is an unqualified checkbox. Nothing defines what rehearsal means or which units permit it. Given that the plan has no staging environment (Q-1/Q-2 open), it is not obvious that *any* unit permits it. **A checklist line that cannot be truthfully ticked is worse than no line** — it is precisely the standards-decay pattern `09` §402 guards against elsewhere.
2. **The rationale for the program-level fallback is false.** `07` §4 (1) and `08` PF-9 both state "**there is no CI/CD pipeline** and no deployment history to roll back to (R-13)." `.github/workflows/ci.yml` exists and runs all five suites on every PR to `main`. R-13 in `architecture-assessment/08` §163 says only *"No hosting or deployment decision recorded"* — **the planning documents widened it into a claim the source never makes.** The advice (tag sprint boundaries as revert units) survives; the reasoning does not. **The plan even contradicts itself here:** `01` T-107d's acceptance criteria require "The pass runs in **CI** alongside the other four suites."

**Blocks?** No. Correct PF-9's rationale and define or delete the rehearsal line.

---

### 2.2 Release boundaries — **Adequate**

**What the artifacts provide.** `10` §1 defines **10 release units** across 6 waves, each with wave, contents, user-visible?, ships-independently?, and gate columns. §1.1 gives per-unit detail. §2.1 fixes the order; §2.2 gives the constraints that fix it; §2.3 states what can move (R2.2 "any time after Q-4 answers, including out of order"; R5.1 "splits into its schedulable half and its gate-bound tail"). §5.2 defines the two-package deploy topology with **three shared app↔functions contracts**, each a deploy-ordering constraint, under one general rule:

> **"For any contract change, the tolerant side deploys first. Widening reads before narrowing writes; never the reverse."**

**Assessment.** The unit decomposition is coherent and the tolerant-side-first rule is a correct, reusable invariant rather than a per-case instruction. §2.2 #3's honesty is notable: R2.2-before-R3.1 is "**wanted, not guaranteed** … If Q-4 has not answered by Wave 3, the auth cutover ships with no production error reporting."

**Gaps.**
1. **R5.1 is defined once as a unit and twice as two units.** §1 lists it as a single release unit; §2.3 and §1.1 say it "splits into its schedulable half (T-108a + T-108e) and its gate-bound tail (T-108b/c/d)." The unit table was not updated. Cosmetic, but the release checklist is copied *per release unit* — so the operator must know to copy it twice.
2. **"Ships independently? No" is used for two different conditions.** R2.2's "No" means *gated*; R3.1's "No" means *sequencing-constrained*. Same cell value, different meanings.

**Blocks?** No.

---

### 2.3 Migration safety — **Adequate** (notifications) / **Thin** (`APP_ID`)

**What the artifacts provide.**

- **The structural mechanism is ADR-120's migration ledger**, and it is the plan's first task. `01` T-120a/T-120b (Sprint 1) require every staged change to carry **intended end state · current stage · owner · review-by date**, with a row-missing-a-field declared invalid by the format's own statement. This is a real, in-repo, Sprint-1-deliverable answer to the corpus's meta-finding (six of twelve root causes reduce to staged work with no recorded status).
- **NS-8 is the safety invariant**: nothing legacy-compatible is stripped before its gate answers (`08` §178).
- **`10` §4.5 is the single best operational artifact in the corpus** — R5.1's release-time sequence, eight numbered steps, including step 2 "capture the currently-deployed ruleset so a rollback target exists" and step 4 "**Wait for the build to complete** — this is asynchronous and is not instant." It ends: "Steps 4–7 out of order produce failing queries or hidden documents."
- **`10` §4.4** explicitly guards against over-trusting a green emulator suite: it lists what emulators *can* prove and what they *cannot*, concluding "A green suite is necessary and nowhere near sufficient."
- **X-2** covers the mid-migration dual-state windows; `07` §4 (5) requires irreversible acts to be re-confirmed immediately before execution.

**The gap: `APP_ID` (T-118b) has a detection procedure and no migration procedure.**

`10` §4.2 specifies the detection precisely — do the two vars resolve to the same value? — with three branches. But the dangerous branch is a stub:

> **"Different** → T-118b is a data-partition migration. Open LDG-15, **re-plan T-118b as a migration with its own end state**, and do **not** ship it inside R1."

*Re-plan it as a migration* is a placeholder, not a plan. The only sketch of the actual mechanism is one clause in `10` §5.2 (1): "staged through a transition period where both IDs are read and one is written." **No task implements that transition, no ADR covers it, and no ledger row template exists for it.** Meanwhile §3.3 (6) states the consequence in full: *"Documents written before the change live under the old ID; documents written after live under the new one. **No code revert reunites them.**"*

**Blocks?** **Wave 1.** If Q-1/Q-6 answer "the values differ," Wave 1 acquires an unplanned data migration. `10`'s own recommended default (hold T-118b out of R1) is the correct handling and should be adopted rather than treated as a fallback — see `02-Open-Questions.md` §1.3.

---

### 2.4 Feature flags — **ABSENT**

**This is the finding I would most want surfaced.**

**What the artifacts provide: nothing.** A grep for `feature flag`, `featureflag`, `remote config`, `DEFAULT_FLAGS`, `kill switch`, `flag-gated`, `canary`, `staged rollout`, `blue-green`, and `dark launch` across **all eleven files** in `implementation-planning/` returns **zero matches**. Not "considered and rejected" — absent.

**What the repository already has**, per the discovery corpus:

| Fact | Source |
|---|---|
| `src/lib/flags.ts` — server-only, Firebase **Remote Config server templates**, 60 s template TTL, **stale template re-served on fetch failure**, never throws | `project-discovery/06-Service-Inventory.md` §164; `/10-Pattern-Catalog.md` §303, §384 |
| `DEFAULT_FLAGS` **documented as kill-switch-safe** | `project-discovery/10` §384 |
| **`maintenance_mode`** — resolved in the root layout; when on, **the entire `Providers` subtree is not mounted** and only `MaintenanceScreen` renders | `project-discovery/07-Provider-Inventory.md` §19–30; `/02-Architecture-Discovery.md` §13.2 |
| `locale_switch_enabled` — kill switch for the locale-switch UI control | `project-discovery/03-Feature-Catalog.md` §500 |
| The choice of Remote Config over PostHog flags is **already an ADR** — `docs/adr/003-feature-flags.md` | `project-discovery/02` §399 |
| `architecture-decision/01` §215 already reasons about flag semantics: "A flag defaulting to its kill-switch state is honest (the default *is* the intended off-state, **ADR-003**)" | `architecture-decision/01-Architecture-Principles.md` §215 |

**So: a working, ADR-backed, server-side kill-switch system with a whole-app blast-radius control already exists — and the 63-task remediation plan never once considers using it.**

**Where its absence is sharpest — R3.1, the auth credential cutover:**

- It is the plan's only release requiring **advance user notice** (`10` §7.2).
- Its named failure mode is **lockout** (X-6, "user-visible credential change whose failure mode is lockout").
- Its rollback is explicitly **not free**: "rollback costs a **second forced re-authentication** … Plan the forward-fix path as the default response, with revert as the last resort" (`10` §3.3 (1)).
- Its stated mitigations are scheduling and discipline: "do not start without full capacity" (`08` §2, S11).
- **And it will ship with no production error reporting** if Q-4 has not answered (`10` §2.2 #3).

A `maintenance_mode` window around the cutover would bound the blast radius of a lockout, and the mechanism is already built, already wired at the root layout, and already governed by an ADR.

**The near-miss that proves the point.** `01` **T-107a's Rollback field** reads:

> "The new issuance path **should ship behind a switch** so the previous cookie path can be restored without a redeploy; without that, rollback is a revert plus a forced re-authentication of all sessions."

That is a feature flag, correctly motivated, in the right place — **and it is the only such proposal in the entire plan.** It appears in a *Rollback note*, not in T-107a's four acceptance criteria. It is not in `10` §3.3 (1)'s pre-release requirement, not in the §6 checklist, and not connected to `lib/flags.ts`. **A "should" in a non-binding field on the program's riskiest task is a mitigation that can be silently skipped, and nothing would catch it.** The same pattern appears once more, unremarked: T-116b's rollback is "Disable via the existing credential gate — no code change needed" — flag-shaped thinking that is never generalized.

**Fair caveats, stated so this finding is not overclaimed.**
- **Q-3 is open**: whether a Remote Config server template has *ever been published* is unknown (`07` Group D). The flag system may be dormant in production. But the code "explicitly tolerates a never-published template" and falls back to `DEFAULT_FLAGS`, so publishing one is configuration, not engineering.
- **Flags carry their own risk.** A flag is another staged change — exactly the C16 pattern ADR-120 exists to end. Any adoption would need its own ledger row.
- **Adding a progressive-delivery ADR would be re-planning**, which this review must not do. The finding is therefore precisely this: **an existing, ADR-backed safety mechanism was never evaluated for a program whose three riskiest changes are irreversible.** Whether to use it is a decision for the owner; that it was never considered is a coverage gap.

**Blocks?** **Wave 3** (R3.1). Not Sprint 1. There are roughly twenty sprints of lead time, and the decision costs one conversation.

---

### 2.5 Production risks — **Thin**

**What the artifacts provide.** `10` §4.3 is candid and well-structured: a seven-row table of what cannot be established without Q-1, closing with *"the five test suites can prove this plan's code correct. They cannot prove it correct **against production**, because production is not currently identified."* X-8 is ranked the program's #1 risk. `10` §7 assigns a communication audience per unit and — genuinely good — pre-identifies **changes that will READ as regressions** (honest-UI zeros, shorter bounded lists, newly-visible errors), so three deliberate corrections are not mistaken for three defects.

**Gaps.**

1. **There is no post-release procedure.** The `10` §6 checklist ends at sign-off. Nothing specifies what to watch after a release, for how long, against what threshold, or what would trigger the rollback the plan spent §3 preparing. **The plan defines how to roll back but never defines what would make you decide to.**
2. **Two release units lean on a capability that may never exist.** `10` §7.1 records R4.1 as "Silent, **monitored**" and R4.2 as "Failure mode is loud (actions stop working), so **monitoring covers it**." R4.1/R4.2 are **Wave 4**. The only monitoring in the plan is R2.2, **Wave 2, gated on Q-4** — the one gate with no owner row. If Q-4 never answers, "monitoring covers it" is false and two Wave-4 units ship with their stated mitigation absent. **Not flagged anywhere.**
3. **R-3 and R-18 survive the program.** `07` §5 states it plainly and correctly: R-3 (world-readable leaderboard PII / NQ-7) and R-18 (world-readable card-image Storage / NQ-8) have no addressing decision and **"no task in this plan touches any of them, so executing this plan in full leaves all three exactly where they are."** This is recorded, not dropped — the disclosure is adequate. But these are *production* risks that the production-risk coverage never revisits.

**Blocks?** **Wave 4.** Sprint 1 is unaffected.

---

### 2.6 Data-migration risks — **Adequate**

**What the artifacts provide.** The strongest single passage in the corpus is `10` §3.3 (3):

- Documents written during the window are written in the **new shape**; reverting the code restores the old read path but "does not rewrite those documents."
- Removing the `isUnread()` legacy fallback means "**legacy-shaped documents stop being readable**. If the backfill never ran, those documents become invisible to users."
- *"There is no 'try it and roll back' here — a rollback restores the code but not the interim writes, and cannot restore the user trust lost by notifications disappearing."*

Supported by: the ordered release sequence (§4.5); the emulator-limits section (§4.4); the pre-deletion check table (§4.6, one row per R5.2 deletion); X-2 (dual-state windows); X-9 (a late gate answer contradicting an executed default); and `07` §4 (5) (irreversible acts re-confirmed immediately before execution). The standing default across the whole cluster is **retain** — the asymmetry is reasoned, not assumed: *"Retention costs a two-schema tax. Removal without confirmation costs user-visible data loss"* (`10` §5.3).

**Gap — the one concrete data-protection act is not in the operational checklist.** A pre-collapse Firestore export appears exactly twice in the corpus:

- `07` X-2 contingency (2): *"**Before S23, take a documented Firestore export of the notification collections**; the collapse is code-reversible but a mistaken read-path collapse over legacy documents is only diagnosable if the pre-state was recorded."*
- `08` §178 (S23): *"⚠ Rollback is code-reversible but data effects are not — take a documented Firestore export…"*

It does **not** appear in `10` §4.5's eight-step release sequence, and `10` §6's checklist reduces it to a generic parenthetical: *"pre-release state captured (previous ruleset / **current data sample** / config snapshot)."* A "data sample" is not an export. The program's single highest-value irreversible-change safeguard lives in two prose asides and is absent from both operational instruments that would execute it.

**Blocks?** **Wave 5**, and it is a one-line fix: add the export as a step to `10` §4.5 between steps 3 and 4.

---

### 2.7 Monitoring — **Thin**

**What the artifacts provide.** Only ADR-116 and its three tasks. The unconditional half is real and measurable — `architecture-decision/03` ADR-116 success criteria: *"the count of report-less swallows on real-state writes is 0, was 17"* and *"At least one non-boundary layer (service/hook/action) reports errors."* T-116a is on the critical path and explicitly ungated.

**What is absent.** A grep across `implementation-planning/` for `alerting`, `alert threshold`, `SLO`, `SLA`, `on-call`, `oncall`, `paging`, `incident response`, and `smoke test` returns **zero matches** in all eleven files. There are no dashboards, no error-rate baselines, no thresholds, no notification targets, no escalation path, and no definition of who looks at what or when.

**Assessment.** The plan builds a **reporting pipeline**, not a **monitoring capability**. Those are different things and the artifacts conflate them: `10` §7.1 twice treats "monitored" as an available state. The word "monitoring" appears in the planning corpus **twice**, both times as an assumption about an unbuilt capability, never as a deliverable.

The one genuinely honest line is `08` §149 on Sprint 9: *"With Q-4 open the reports may terminate in a pipeline nobody reads (D-1) — the **code** is verifiable, the **observability** is not."* That sentence is correct and should have propagated into `10` §7.1; it did not.

**Blocks?** **Wave 4** — where two release units' stated mitigation is monitoring that may not exist. Sprint 1 unaffected.

---

### 2.8 Observability — **Thin**

**What the artifacts provide.** ADR-116's **policy leg is Accepted unconditionally** and lands at S9 as T-116a — 17 swallow sites adopt report-then-handle, boundaries surface, services report. `08` §149 confirms T-116a is on the critical path and "**explicitly not gated**." `01` T-116a's regression scope is thoughtful, naming both hazards: converting a fire-and-forget site into a throwing one, and the logging pipeline itself becoming a failure amplifier.

**Gaps.**

1. **The reading end is undefined.** If Sentry stays dark (Q-4), T-116a's reports land in "the in-repo pipeline." **No artifact states what that pipeline does with them, whether anything persists them, or whether any human surface displays them.** The repository has an admin **Reports** log surface (it is the subject of NQ-4/AD-11 and gets converged onto the shared table engine in R6), but **no document connects T-116a's output to it.** The plan's fallback for its own observability gate is a destination it never names.
2. **Activation is gated on the one question with no owner row.** Covered in `02-Open-Questions.md` §2(a).
3. **NQ-14 means improvement cannot be demonstrated.** `07` §5: with no profiling or bundle analysis, "the plan does not size R-1, R-2 or R-10, so **it cannot demonstrate improvement on them** beyond the structural change." A 29-sprint program with no before/after measurement on three of its named risks.

**Blocks?** **Wave 2** for the activation leg; the unconditional policy leg is unblocked and lands regardless. Sprint 1 unaffected.

---

### 2.9 Disaster recovery — **ABSENT**

**What the artifacts provide: nothing.** A grep across `implementation-planning/` for `disaster recovery`, `backup`, `restore from`, `point-in-time`, `RTO`, `RPO`, `incident response`, `on-call`, and `data loss` returns **zero matches** in all eleven files, with two narrow exceptions, both scoped to a single release:

1. **Capture the previously-deployed Firestore ruleset** before a rules deploy (`10` §3.3 (2), §4.5 step 2, §6 checklist). Correct and specified — but it is a rollback target for one deploy, not a backup posture.
2. **A Firestore export of the notification collections** before S23 (`07` X-2 contingency 2; `08` §178) — and, per §2.6 above, it is missing from both operational instruments.

**What is nowhere:** Firestore scheduled backups or point-in-time recovery posture; any restore procedure; any recovery-objective statement; any incident-response path; any second holder of the deploy or admin credentials.

**Why "pre-deployment, so it is premature" does not fully hold.** The plan performs **irreversible data operations**:

| Operation | Unit | Irreversibility |
|---|---|---|
| Notification dual-machinery collapse | R5.1 | Legacy-shaped documents become unreadable; interim writes are not rewritten by a revert |
| `APP_ID` unification, "values differ" branch | R1 | Data lands in a different `artifacts/{APP_ID}` partition; "**no code revert reunites them**" |
| Telemetry activation | R2.2 | "Events transmitted to Sentry and PostHog **cannot be unsent**" |
| Composite index deletion | R5.1 | Rebuild is asynchronous; dependent queries fail during it |

**Performing four irreversible data operations against a datastore with no stated backup or recovery posture is a coverage gap, not a scheduling one.**

**The assessment corpus already flagged this and the plan did not pick it up.** `architecture-assessment/08-Risk-Assessment.md` §158: *"no blast radius in code, but total continuity risk: onboarding, **incident response**, and the out-of-band admin/deploy procedures (R-8, R-13) have no second owner and limited written record."* This is an evidence-chain item that fell out between phases.

**Compounding factor.** X-1 is bus-factor-1 over ~58 weeks. In a one-person program, the recovery procedure and the only person who could execute it are the same single point of failure. `01` T-118c (`.env.example`) is the plan's only continuity artifact, and `10` §5.4 is careful about its limits: *"It documents the surface; it does not provision it."*

**Blocks?** **Wave 5** hard (R5.1's collapse), **Wave 1** conditionally (the `APP_ID` "different" branch). Not Sprint 1.

---

## 3. The seven non-reverting change classes — specified, or merely named?

`10` §3.3 opens: *"Seven change classes. **Each needs a pre-release decision, not a post-incident one.**"* Tested one by one: is the pre-release verification an **executable procedure**, or a **statement that one is required**?

| # | Class | Unit | Stated pre-release requirement | Verdict |
|---|---|:--:|---|:--:|
| **1** | Auth credential cutover (T-107a/b/c) | R3.1 | "The cookie-clearing path must work independently of the verification path, so a rollback can invalidate stale credentials rather than leaving users in a broken middle state." | **Named** |
| **2** | Index + rules deployment (T-108b) | R5.1 | "The previous ruleset is captured before any deploy." Sequenced at `10` §4.5 step 2; ticked in the §6 checklist. | **Specified** (partial) |
| **3** | Notification data-shape changes (T-108c/d) | R5.1 | Q-5 and NQ-1 are hard gates; §4.5's eight-step sequence; §4.4's emulator limits; §4.6's per-deletion confirmations. | **Specified** ✅ |
| **4** | Telemetry activation (T-116b/c) | R2.2 | "The privacy-posture question … is settled **before** activation, not after." | **Named** (partial) |
| **5** | `fanOutNotifications` deletion (T-119d) | R5.2 | "Verified against the live function inventory (Q-6) before deletion, not just against the repo's zero in-repo callers." §4.6 restates it. | **Specified** ✅ |
| **6** | `APP_ID` unification (T-118b) | R1 | §4.2: run the comparison; three branches, each with a defined action; a recommended default when undeterminable. | **Specified** ✅ (detection only) |
| **7** | New analytics writer (T-114d, alternate branch) | R3.2 | "The branch choice is a release-gating decision, not an implementation detail." | **Merely named** ❌ |

**Tally: 3 specified · 2 specified-with-caveats · 2 named-only.**

**Per-item detail on the four that fall short:**

**(1) Auth cutover — the most consequential shortfall.** The requirement is correct and correctly motivated. But:
- **It is not an acceptance criterion.** T-107a's four criteria cover httpOnly, demonstrable server verification, complete mint/refresh/revoke lifecycle, and preserved compensating controls. **None mentions independent cookie-clearing.**
- **The switch that would make it operable is a "should" in a Rollback note** — `01` T-107a: "The new issuance path *should* ship behind a switch so the previous cookie path can be restored without a redeploy." Not a criterion, not in the checklist, not connected to `lib/flags.ts` (see §2.4).
- **No test names it.** T-107d's E2E matrix covers signed-out/signed-in/public routes, sign-out mid-session, and expired-session behaviour — **but not rollback-with-stale-credentials**, which is the exact state the requirement exists to prevent.
- **Verdict:** the plan's highest-impact irreversible change has a pre-release requirement stated in prose, absent from acceptance criteria, absent from tests, and absent from the checklist. **This is the single most actionable gap in this file.**

**(2) Index/rules capture.** The *act* is specified and sequenced. The *artifact* is not: no command, no storage location, no retention, and no statement of who verifies the captured ruleset is restorable. Cannot execute against Q-1/Q-2 anyway.

**(4) Telemetry.** The privacy decision is required but no procedure supports it. Partial credit: T-116c does carry a real verification criterion — *"Whatever is captured carries no user-identifying content beyond what the recorded scope decision authorizes."* That is checkable. But nothing defines how the scope decision is reached or recorded beyond "in the ledger," and `10` §7.1 correctly escalates it to "**Decision, not notice**."

**(7) Analytics alternate branch — the clearest omission.** `10` §3.3 (7) states the asymmetry precisely: the default branch reverts cleanly, the alternate branch writes new documents in a new shape that "persist through any code revert." **Only one of the two branches is reversible — and the irreversible one has no pre-release verification at all.** Not in §4.1's verification table (which covers R3.2 only for the query-bound question), not in §4.6, not in the checklist. It is a hypothetical branch (it fires only if Q-9 reveals or creates a real producer), which is presumably why it was left thin — but that is exactly the branch that would be executed under discovery pressure.

**Systemic observation.** The three fully-specified items (2, 3, 5, 6) are all **notification/config** changes concentrated in `10` §4.5 and §4.6 — the two sections written as operational sequences. The three that fall short (1, 4, 7) each live **only** in §3.3's prose and were never carried into an operational instrument. **The failure mode is structural, not per-item: a pre-release requirement that never reaches §4 or §6 is a requirement nobody executes.**

---

## 4. Verified / Unverifiable / Contradicted

**Verified from the documents**
- Zero occurrences of feature-flag, Remote Config, kill-switch, canary, staged-rollout, blue-green, or dark-launch terminology in any of the eleven `implementation-planning/` files (§2.4).
- Zero occurrences of disaster-recovery, backup, RTO/RPO, incident-response, on-call, SLO/SLA, alerting, or smoke-test terminology in the same eleven files (§2.7, §2.9).
- The Firestore export appears exactly twice, in `07` X-2 and `08` §178, and in neither `10` §4.5 nor `10` §6 (§2.6).
- T-107a's rollback switch is a "should" in a Rollback field and appears in none of its four acceptance criteria (§3).
- `10` §7.1 records R4.1/R4.2 as monitored; the only monitoring unit is R2.2, Wave 2, gated on Q-4 (§2.5).
- The repository's flag system is documented across five discovery files and carries its own ADR (`docs/adr/003-feature-flags.md`) (§2.4).
- R-3, R-18 and R-7 have no addressing task and are **recorded as such** in `07` §5 — known issue 10 confirmed, coverage gaps carried openly rather than dropped.

**Unverifiable from the documents**
- Whether the Remote Config server template has ever been published (**Q-3**), and therefore whether `maintenance_mode` is a live production path or dead-by-default. This determines how cheap the §2.4 mitigation actually is.
- Whether "rollback rehearsed" (`10` §6) is achievable for any unit given no staging environment.
- Whether any deployment has ever occurred. The `deploy-functions` CI job skips cleanly while `vars.FIREBASE_PROJECT_ID` is unset, so "no deployment history" is plausible but unproven.
- Whether the in-repo logging pipeline persists T-116a's reports anywhere a human reads (§2.8).

**Contradicted**
- **"There is no CI/CD pipeline"** (`07` §4 (1); `08` PF-9) — refuted by `.github/workflows/ci.yml`, which runs all five suites on every PR to `main` and carries a dormant `deploy-functions` job. R-13 in `architecture-assessment/08` §163 makes no such claim. **The plan also contradicts itself**: `01` T-107d requires "The pass runs in **CI** alongside the other four suites."
- **`10` §7.1's "monitoring covers it"** for R4.2 — the monitoring is Wave 2, gated, and may never ship (§2.5).
- **`10` §1's single R5.1 unit** versus §2.3's two-half split (§2.2).

---

## 5. Verdict

**Nothing in this review blocks Sprint 1.** Sprint 1 lands the migration ledger, backfills it, fixes the docs index, and closes a live allowlist defect. None of that touches rollback, migration, flags, monitoring, or DR.

**Five corrections, in descending order of value:**

1. **Make T-107a's rollback switch binding.** Promote it from a Rollback note to an acceptance criterion, and decide explicitly whether it uses the existing `lib/flags.ts` Remote Config mechanism. This is the plan's highest-impact irreversible change and its stated mitigation is currently optional. *(Wave 3 — ~20 sprints of lead time.)*
2. **Evaluate the existing flag system for migration safety, once, and record the outcome either way.** `maintenance_mode` is an ADR-backed, already-wired, whole-app kill switch. "We considered it and chose not to use it" is a complete and acceptable answer; **silence is not**, and silence is what the artifacts currently contain. *(Wave 3.)*
3. **Add the pre-collapse Firestore export to `10` §4.5 as a numbered step and to the §6 checklist.** The program's single highest-value data safeguard exists only in two prose asides. One-line fix. *(Wave 5.)*
4. **State a backup/recovery posture before Wave 5**, or record explicitly that none exists and that the notification collapse proceeds without one. Four irreversible data operations against an undeclared datastore posture. *(Wave 5; decidable now.)*
5. **Correct the "no CI/CD pipeline" claim in `07` §4 (1) and `08` PF-9**, and either define or delete `10` §6's "rollback rehearsed" line. *(Now.)*

**Overall coverage judgement.** Rollback, release boundaries, and data-migration risk are covered to a standard well above what a single-developer program normally produces — `10` §3.3, §4.4 and §4.5 in particular. The gaps are not sloppiness; they are **a consistent blind spot at the boundary between "the code is correct" and "the running system is safe."** The artifact set reasons superbly about reverts and shapes and sequences, and barely at all about kill switches, alarms, watch periods, and recovery. That boundary is exactly where a pre-deployment codebase has no experience to draw on — which is why it is worth naming here rather than discovering it in Wave 5.
