# 01 — Readiness Review (Phase 1: cross-artifact consistency)

**Execution-readiness phase — adversarial review.** Scope: consistency across `architecture-decision/` (00–08) and `implementation-planning/` (00–10). Every row below is backed by a citation on **both** sides of the comparison. Claims I could not confirm from the documents are labelled **Unverifiable**, not passed.

**Input-state note (recorded once, per kernel).** `requirements-consolidation/` does not exist on disk. Every planning file states this and none cites a Requirement-ID or Recommendation-ID. Verified by inspection of the directory listing and of the honest-labelling headers in `00-INDEX.md` §Provenance, `01` §1.1, `03` ¶3, `04` ¶3, `05` ¶Honest-labeling, `09` ¶Honest-labeling. **No further mention.**

---

## 1. Verdict table

| # | Check | Verdict | Evidence (both sides cited) | Severity |
|---|---|---|---|---|
| C1 | No conflicting ADRs | **PARTIAL** | ADR-106 §Success-criteria ("*Every* server action declares `.metadata({permission})`") vs ADR-115 §Decision ("two RBAC engines … **no merge**") + `01` T-119c AC ("7 remaining live permissions"). No document adjudicates which permission vocabulary a deck-sharing action declares. | **Major** |
| C2 | No conflicting standards | **PARTIAL** | `04-Coding-Standards` CS-2 table: Review tier enforcement `max-lines: ["warn", 400]`, Hard tier `max-lines: ["error", 400]` — same rule, same threshold, two severities. Barrel policy vs public-API decision: **no conflict** (reasoning in §3). | **Minor** |
| C3 | No duplicated tasks | **PASS** | 63 unique IDs enumerated in `01` §3 and reconciled against `01` §4.1/4.2/4.4, `05` Part A/D, `09` §3, `04` §8.4. Overlap candidates traced (`01` T-120b AC-2 vs T-108e AC-1 — same LDG-01 row) are staged create→finalise, not duplicated work. | — |
| C4 | No missing dependencies | **FAIL** | `01` T-115a §Regression-scope: "**Requires T-117b and T-117d complete first**" vs `05` §D.2 "T-117d … **nothing downstream depends on it**" and §D.3 listing T-117d among tasks that can slip "**out of the program … without blocking anything**". T-117d is named as prerequisite/oracle by **seven** tasks in `01`. | **Major** |
| C5 | No missing ownership | **FAIL** | `architecture-decision/07-Open-Questions.md` — Q-4 has **no row in any of the four groups** (verified by exhaustive read + grep: its only appearance is inside NQ-14's row, "couples to Q-4"), while ADR-116 §Status makes it a live gate. | **Major** (source doc) |
| C6 | No missing acceptance criteria | **PASS** | 63/63 task blocks carry `**Acceptance criteria**`, `**Regression scope**`, `**Rollback**`, `**Standards**` (mechanical count on `01`). 17 sampled across all 6 waves — none restates its title; sample and weakest cases in §7. | — |
| C7 | No contradictory implementation rules | **PARTIAL** | Revert granularity: `01` T-106b §Rollback "**Per-action revert**" vs `10` §3.1 "**Revert granularity is the release unit, not the PR**" + §3.4 (partial R4.2 revert is broken). Also `08` §7.4 vs `04` PR-1.1/1.2/1.3 "Tests: **gate only**". | **Major** / **Minor** |

**Known-issues verification** (items 1, 2, 6, 7, 8, 9, 10) — verdicts in §8. Summary: **1 confirmed-worse**, **2 confirmed**, **6 confirmed**, **7 confirmed-and-handled**, **8 PASS (genuinely recorded, not asserted)**, **9 PASS**, **10 confirmed-with-a-third-item**.

---

## 2. C1 — Conflicting ADRs

### Method
Read ADR-101…120 in full (`architecture-decision/03`, 555 lines). For each ADR's **Decision** and **Success criteria** I looked for an obligation another ADR forbids, then checked whether any `implementation-planning/01` task discharges both.

### C1-a — ADR-106 vs ADR-115: unadjudicated permission-vocabulary collision *(Major)*

Both sides, quoted:

- **ADR-106 §Success criteria, bullet 2:** "**Every server action declares `.metadata({ permission })`** (grep: zero actions without metadata; today only family B has this)." §Consequences repeats it: "extending S-4's compile-time property **from admin to all**."
- **`01` T-106a AC-1** hardens this: "per-action permission metadata is **structurally required** — an action without `.metadata({ permission })` **does not compile**."
- **`01` T-106c AC-1:** "All former `actionClient` actions run on the unified client; **each now declares permission metadata it previously lacked**." These are the user-initiated sharing / invite / comment writes (T-106c §Regression scope).
- **ADR-115 §Decision:** "The **two RBAC engines are affirmed as two domains** (principled duplication, CX-12/PC-8 — **no merge**)." §Success criteria bullet 3: "the two RBAC engines **remain separate**, each the documented source of truth for its domain."
- **`01` T-119c AC-3:** "The `PermissionSet` matrix stays shape-compatible for its **7 remaining live permissions**."

The collision: T-106c must attach a permission declaration to deck-sharing actions. The only permission vocabulary in the repo is the admin `PermissionSet` (7 live members after T-119c). Drawing from it merges the deck-sharing domain into the admin domain — the merge ADR-115 forbids. Not drawing from it requires a second permission vocabulary that **neither ADR sanctions and no task creates**. ADR-106's hedge ("configured thinly per surface") is about *transport*, not about the permission grammar; its compile-time requirement admits no third option.

Neither ADR names the other on this point: ADR-106 §Alternatives considered does not mention RBAC domains; ADR-115 §Alternatives considered does not mention the action client. No `01` acceptance criterion resolves it.

**Verdict: Major.** Blocks T-106c (Wave 4, Sprint 17). Not Sprint-1-blocking.

### C1-b — Checked and cleared (with reasoning, not assertion)

| Pair | Suspected conflict | Finding |
|---|---|---|
| ADR-101 vs ADR-104 | ADR-104 §Alt-2 rejects "a single root barrel over a 27-file grab-bag" — yet T-101a creates exactly that in Wave 1 and T-104a only fixes it in Wave 6. | **Not a conflict — a documented 24-sprint interim.** `05` Part A Wave 6 owns it: "T-104a is what stops T-101a's barrel degenerating into 'everything is public'." But **no task bounds the interim and no ledger row tracks it**, despite `05` Wave-1 edge note stating "T-101a/b is itself staged work … and per ADR-120 **must record its completion state**." See defect D-17. |
| ADR-102 vs CS-1 / CS-3 | T-102a builds a registry seam whose stated purpose is future kinds ("Adding an actionable kind requires **zero** new imports"), which CS-3 calls "capability-first infrastructure … **registry entry** … built for a future that has not arrived." | **Not a conflict.** CS-3's bar is a *live consumer*; T-102a AC-2 has one on day one (flashcard's invite accept/decline). CS-1's three-use rule governs *extraction to a shared location*, not an ADR-mandated dependency inversion. Cleared. |
| ADR-103 vs ADR-119 | T-103a relocates the `LogSource` declaration; T-119b deletes members from it. | **Caught and resolved upstream.** `05` Part B row 13 records it HARD, 5←1, and flags it as "*not named in the kernel; derived from ADR-103*". This is the "one latent conflict found and resolved" `00-INDEX` §Phase-7 claims — **verified true**. |
| ADR-112 vs ADR-114 | T-114a bounds the public-lesson listener and must serve "see more" without adding a third pagination mechanism. | **Not a conflict.** `01` T-114a AC-2 names the sanctioned mechanism explicitly ("grow-window resubscribe for this realtime channel, **not a third**"), matching ADR-112 §Decision's channel binding. Cleared. |
| ADR-113 vs ADR-002 (in-repo) | ADR-113 both affirms ADR-002 and extends it. | Cleared. ADR-113 §Status splits priority (P1 centralisation / P3 affirmation); T-113b AC-3 discharges the affirmation leg. `01` T-120c AC-3 records 001–003 remain in force. |

**Success-criteria arithmetic verified:** `01` §4.4 claims "The 20 ADRs' 60 Success Criteria are distributed across the 63 tasks with no criterion unassigned." I counted the bullets under **Success criteria** in `architecture-decision/03` for all twenty ADRs: **3 each, 60 total.** Claim holds.

---

## 3. C2 — Conflicting standards

### C2-a — CS-2's enforcement column contradicts itself *(Minor)*

`04-Coding-Standards` CS-2 table, both rows quoted verbatim:

| Tier | Range | Enforcement |
|---|---|---|
| Review | 251–400 | `max-lines: ["warn", 400]` + review checklist |
| Hard | > 400 | `max-lines: ["error", 400]`, test-glob override |

A single ESLint `max-lines` rule cannot simultaneously be `warn` at 400 and `error` at 400. The *intent* is legible (error at 400; the review band is a human checkpoint), but as written the standard specifies two mutually exclusive configurations of one rule — and `04-PR-Plan` PR-28.2 §Concern reproduces both ("green ≤250, review 251–400, hard error >400"), so the ambiguity propagates into the PR that implements it.

### C2-b — The two questions posed in the brief, answered

**Does the file-size ceiling conflict with any structural decision?** No — but it collides with the *schedule*, three ways (defect D-12):

- `08` §7 item 7 (Standing definition of done, "**Applies to every task in every sprint**"): "CS-2 file ceiling applies to every file the task touches: … **> 400 blocking**." In force from Sprint 1.
- CS-2 §Conflicts and missing information: "**this one split is a prerequisite to turning the rule to `error`**" — the split is `ShareModal.tsx`, delivered by PR-18.4 (Sprint 18).
- `03` §9 and Sprint 28 rider (a), and `04` PR-28.2: the `max-lines` error flip lands **Sprint 28**.

Three different answers to "when is >400 blocking". Sprint 1's tasks (T-120a/b/c, T-118a) touch no >400 file, so this is not Sprint-1-blocking — but "done" is not defined consistently between S1 and S28.

**Does the barrel policy conflict with the public-API decision?** **No.** Both sides checked:

- CS-7 §Barrel policy sanctions barrels at exactly (a) feature root, (b) flashcard's enforced sub-modules, (c) four `shared/` locations.
- ADR-101 §Decision: "Every feature exposes exactly **one** root barrel (`features/<name>/index.ts`) as its **only** legal cross-feature import surface."

(a) is (ADR-101), (b) is (ADR-104). The suspected gap — `lib/logging` becomes a public surface under ADR-103 but is unsanctioned by CS-7 — is **not** a conflict: CS-7 governs where `index.ts` barrels may exist, and ADR-101's lint rule scope is *cross-feature* only (`01` T-101c AC-3). `features → lib` is an allowed edge under CS-9. **Cleared.**

### C2-c — CS-7's unresolved owner question sits inside the "clean runway" *(Major — see §6)*

CS-7's own §Conflicts note: "because it partially reverses a demonstrated preference, **the owner should confirm the reduction scope before lint-enforcing it**." `08` §5 PF-8 carries this and states it unblocks "**S2, S27 (and S4's flip)**". `04` PR-28.1 §After repeats it: "Confirm the CS-7 barrel-reduction scope with the owner before merging."

Against this: `00-INDEX` §Where to start — "Sprints 1–8 form an unbroken ~16-week runway with **zero external dependencies** … **No question needs answering before Sprint 1 begins**", and `08` §5's own closing line classifies PF-8 as "**the rest is hygiene**."

An owner decision required by Sprint 2 is an external dependency. See defect D-4.

---

## 4. C4 — Missing dependencies **(FAIL)**

`05` Part B's header claims: "**Every edge that crosses a wave boundary.**" I tested that claim by walking every `01` task description and regression-scope line that names another task ID, then looking for the corresponding edge in `05`.

### C4-a — T-117d: declared a pure leaf, is a prerequisite for seven tasks *(Major)*

`05` says, in three places:

- Part A Wave 2: "**Wave 2 tasks with NO task dependency** … T-117d, T-117e (**no downstream dependent anywhere in the plan**)"
- §D.2: "T-117d Rules-suite coverage | L | 2 | … **nothing downstream depends on it**"
- §D.3 (pure leaves): "**Nothing in the plan waits on these** … They can slip to the end of their wave, **or out of the program**, without blocking anything" — T-117d is listed.

`01` says the opposite, in seven places:

| `01` line | Task | Text |
|---|---|---|
| 656 | **T-115a** | "**Requires T-117b and T-117d complete first**" |
| 653 | T-115a | "verified against T-117b's `resolveRole` tests and **T-117d's rules tests**" |
| 526 | T-114a | "The rules-suite collection-group read test (**T-117d**) passes against the bounded query" |
| 680 | T-115c | "The `admins` rules-suite test (**T-117d**) passes against the aligned predicates" |
| 711 | T-106b | "verified against **T-117d's `admins` rules tests**" |
| 770 | T-108b | "Rules changes must be verified against **T-117d's suite** before deployment, not after" |
| 856 | T-119c | "verified against **T-117d's `admins` tests**" |
| 624 | T-109d | "**T-117b and T-117d are the net**" |

And T-117d's own AC-3/AC-4 close the loop from the other side: "giving **T-114a and T-115a** a rules-side oracle" / "relevant to the Q-10 question **T-115c** is gated on."

Wave ordering (T-117d is Wave 2; all consumers are Waves 3–5) happens to satisfy the sequence. The defect is not the schedule — it is that `05` explicitly authorises dropping T-117d "**out of the program**" as float, which would silently remove the verification oracle for an access-control convergence (T-115a), an admin-authority alignment (T-115c), an admin-mutation migration (T-106b), and a rules deploy (T-108b). `06` §Risk 2 compounds this: it reasons that "cutting T-117d/e saves 13 d of *off-path* work while leaving the path unchanged." Also relevant: `08` §7 item 6 makes "Rules changes carry a rules-suite test" a **standing definition of done** — undeliverable without T-117d.

### C4-b — Three further cross-wave edges absent from Part B *(Major, same class)*

| Stated in `01` | Absent from `05` |
|---|---|
| T-107d AC-2: "The public-route cases are driven by the **single allowlist module from T-118a**"; T-107c §Regression: "Interacts with T-118a"; T-107b §Regression: "the AuthGate splash path (which **T-118a also touches**)" | No T-118a → T-107x row in Part B (3←1 crossing) |
| T-119d §Regression: "Removing the wrong binding could break **the digest path, which T-108a depends on**" | `05` Part A Wave 5: "Tasks with NO task dependency: T-119a, T-119c, **T-119d**, T-119e … **mutually independent**" |
| T-109d AC-3: "the vocabulary agrees with the deck-access engine's role set (**checkable by T-115b's mechanism**)" | `05` Part A Wave 4: "T-115b (**independent of everything in the wave**; only its *consumer* T-108a is downstream)" |

The T-119d ↔ T-108a case is the one that matters: `05` licenses parallelising T-119d against everything, while `01` warns that a mis-scoped deletion breaks the digest binding T-108a's widened union depends on.

---

## 5. C5 — Missing ownership **(FAIL — in the source document)**

### C5-a — Q-4 has no row *(Major; independently confirmed, and worse than reported)*

I read `architecture-decision/07-Open-Questions.md` end to end and grepped for `Q-4` across all four artifact directories. Findings:

- **Group A** (12): Q-8, Q-11, Q-13, Q-12, Q-7, Q-17, NQ-7, NQ-8, NQ-10, Q-14, Q-15, Q-16
- **Group B** (6): Q-1, Q-6, Q-10, Q-9, NQ-1, Q-2
- **Group C** (2): Q-5, NQ-6 · **Group D** (5): NQ-14, NQ-11, NQ-12, NQ-13, Q-3 · **Group E** (7): m-1…m-7
- **Q-4 appears in none of them.** Its only occurrence in that file is a parenthetical inside NQ-14's row: "([ENV]/[DATA] for real-usage, **couples to Q-4**)". It is also absent from the §Roll-up table and from the §Standing-defaults summary.

Against that, Q-4 is treated as live in four places: `03-Architecture-Decisions` ADR-116 §Status ("**Accepted-conditional on Q-4** (activation leg)"), `06-Decision-Matrix` (four rows: §1 AD-16, §2b rank 4, §3 OP-21, §4 C13), `01-Architecture-Principles` §P-8, and `02-Target-Architecture` §12.1 + its conditional-destinations register.

**The known issue understates it.** It is reported as "no owner row." The register has **no row at all** — so Q-4 has no owner *class*, no standing default, no review-by date, and no roll-up entry. `08` §5 PF-6 assigns owners "by reading `07-Open-Questions.md`", so the very mechanism designed to prevent unanswered gates skips Q-4 structurally. `09` §5.2 reaches the same conclusion independently and tracks Q-4 as `Unassigned` rather than `Not asked`, correctly distinguishing the two failure modes.

**Compensation verified, and its limit stated:** `03` Sprint 1 §Question-resolution items assigns Q-4 an owner eight sprints early with the reasoning in-plan; `03` §9 and §10.2 record it; `07-Risk-and-Mitigation` X-13 analyses it; `08` PF-3 escalates the source fix. **The compensation is real. It lives in the plan, not in the source of truth** — `07-Open-Questions.md` remains wrong, and `01` §5.2 has to *infer* Q-4's answering class from ADR-116's prose.

### C5-b — Ownership sweep beyond Q-4

`07-Risk-and-Mitigation` X-13 §Contingency (3) asks for an audit of "any *other* question cited by an ADR but absent from the tables." I ran it: cross-referenced every Q-n / NQ-n / m-n cited in `03-Architecture-Decisions`, `06-Decision-Matrix` and `02-Target-Architecture` against `07`'s five group tables. **Q-4 is the only one missing.** Every other cited question resolves to a row. *(Verified — this is the one row in this document where a "Pass" is a real search result, not an assumption.)*

**Task ownership:** all 63 tasks carry an owning ADR (`01` §4.4 maps 20 ADRs → 63 IDs; I re-derived the per-wave counts 14/8/10/12/10/8/1 = 63 and they reconcile to `01` §4.1, `09` §3 wave headers, and `02`'s per-wave task tables). **No task lacks an owner.**

**One piece of scheduled work has no owning task** — see defect D-11: the CS-2 400-line error flip (`04` PR-28.2, `03` Sprint 28 rider (a)) is attached to T-104b, but `01` T-104b's acceptance criteria never mention it, `01` §4.5 does not list CS-2 against T-104b, `01` §2.1's rider assignments (M-5/M-6/M-7) do not cover it, and `09` §1.1's list of cross-cutting items with named owners omits it.

---

## 6. C7 — Contradictory implementation rules

Compared `03` §1/§9 (sprint rules), `04` §1.2/§8 (PR rules), `09` §1.4/§4.1 (tracking rules), `10` §3 (release rules) pairwise.

### C7-a — Revert granularity *(Major)*

| Document | Rule |
|---|---|
| `01` T-106b §Rollback | "**Per-action revert**; migrate in reviewable batches, not one commit." (T-106c: "Per-action revert.") |
| `10` §3.1 | "**Revert granularity is the release unit, not the PR.** Reverting one PR out of a converged set — **T-106b without T-106a** … produces exactly the half-migrated state the kernel forbids." |
| `10` §3.2 | "Action client (T-106a/b/c/d) | R4.2 | Revert **the whole unit**." |
| `10` §3.4 | "**Reverting T-106b while keeping T-106d leaves migrated call sites with no client at all.**" |
| `08` §5 PF-9 | "sprint PRs are **the revert unit**" — a third granularity. |

`01`'s per-action rollback is valid only *before* T-106d lands; `01` states no such precondition. `10` catches the hazard, `08` PF-9 states a third answer. Three documents, three revert units, for the same change set.

### C7-b — "Done" when no test tier applies *(Minor, but it lands in Sprint 1)*

- `08` §7 item 4 (standing DoD): "The change is proved by **at least one of the five tiers** … **A change with no applicable tier is a readiness failure, not a task.**"
- `04` PR-1.1 (T-120a), PR-1.2 (T-120b), PR-1.3 (T-120c): **"Tests: gate only."** The "gate" is lint + format + build, which `04` §1.1 explicitly says "runs on every PR without exception and **is not repeated below**" — i.e. it is not one of the five tiers.
- `09` §1.4 uses the softer "The **applicable** test tiers named in the PR body are green," which permits none.

The three tasks caught are Sprint 1's ledger work — the head of the critical path — all declared **Ready** in `01`. Under `08` §7.4 read literally they are readiness failures. Resolution is obvious (docs tasks are inspection-verified), but the rule as written does not permit it.

### C7-c — Gate-handling: the executable/inaction split does not survive contact with `01` *(Major)*

`09` §1.2 splits the 16 gated tasks **12 executable / 4 inaction** and names T-119d among the executable: "The default names an action **the task can carry out today**." The kernel carries the same 12/4 as a fixed fact.

Three documents contradict it:

- `01` T-119d §Fallback: "Delete the un-called fan-out (the standing default), **but only after the deployment-facts half of the gate is satisfied** — the default covers intent, not deployment state." AC-1: "**A code-only search is insufficient evidence here.**"
- `04` §8.4: "PR-22.2 | Q-6 | delete **only if** an out-of-repo invocation is ruled out; else a retention ledger row."
- `10` §3.3 (5): "It is verified against the **live function inventory (Q-6)** before deletion, not just against the repo's zero in-repo callers." §4.1 lists R5.2's live-function inventory under "**Verifiable only in a real environment**."

Deployment facts require production access, which is exactly what Q-1 does not currently provide (`10` §4.3). **T-119d's fallback is not executable today.** The honest split is **11 executable / 4 inaction / 1 conditional**. This matters for Wave 5 capacity planning, which `09` §1.2 justifies precisely on this distinction ("sprint planning can tell the difference between *blocked* and *awaiting a decision*").

A weaker instance of the same shape: T-119a is classed executable, yet `10` §4.1 lists "whether production documents carry the 7 dormant kinds (Q-8)" as real-environment-only, while `01` T-119a AC-4 argues it in-repo from zero-producer status ("verified, not assumed"). The in-repo argument is sound; noting the tension only.

### C7-d — Wave-exit criteria: `09` diverges from the document it declares canonical *(Minor, Sprint 1)*

`09` §4 opens: "**`02` owns the canonical exit criteria** … **If the two diverge, `02` wins.**" It then diverges, in Wave 1:

| Source | Wave-1 ledger requirement |
|---|---|
| `01` T-120b AC-1 | rows for "every gated disposition in the ADR set (**ADR-108, -109, -110, -114, -118, -119**)" = **12 rows** |
| `02` §Wave 1 exit criterion 11 | "every gated disposition across **ADR-108/109/110/114/118/119** has a row" = **12 rows** ✔ agrees with `01` |
| `03` Sprint 1 | "a row for every in-flight staged change (notification migration, gated dispositions, **in-progress convergences**)" + "**Record Q-1's status as a ledger row in T-120b**" |
| `04` PR-1.2 §Scope | the 12 groups "**plus Q-1 and Q-2 as rows**" |
| `09` §2.3 | **14** enumerated rows (adds LDG-13 Sentry/PostHog **ADR-116** and LDG-14 admin predicates **ADR-115**) + 1 conditional (LDG-15) — and **no Q-1 row** |
| `09` §4.2 Wave 1 | "The ledger exists in-repo with **all fourteen initial rows** populated" |

Five specifications of one Sprint-1 deliverable. `09` §4.2's exit criterion is not dischargeable by `01`'s task as written, and contradicts `02`, which `09` names authoritative two paragraphs earlier. Resolvable by taking the union (16 rows) — which is why this is Minor, not GO-blocking, despite landing in Sprint 1.

### C7-e — Checked and cleared

- **"Every sprint ends deployable"** — stated identically in `03` §1 table, `02` ¶7, `09` §4.1(3), `10` §3.5(1), `08` §7(16). No divergence.
- **"Lint rules land after their migrations"** — `04` §1.2(3) names the five flip PRs (PR-4.1, 4.2, 5.1, 28.1, 28.2); `03` §9 names the same set by sprint; `05` Part A encodes each as HARD (T-101b→T-101c, T-102b→T-102c, T-103a→T-103b, T-104a→T-104b). **Consistent across four documents.**
- **Gate-handling rule 3** ("every wave containing gated tasks opens with a question-resolution item") — `02` per-wave §Gated items, `03` per-sprint §Question-resolution items, `09` §5.4 wave-opening ritual. Consistent.

---

## 7. C6 — Acceptance criteria **(PASS)**

**Mechanical count on `01-Validated-Backlog.md`:** 63 `#### T-` headings · 63 `**Acceptance criteria**` blocks · 63 `**Regression scope**` · 63 `**Rollback**` · 63 `**Standards**`. No task is missing a required field. This confirms `00-INDEX` §Phase-7's "63 of 63" claim by count.

**Seventeen sampled for observability** (the brief asked for ≥12), spread across all six waves. "Observable" = an outcome a reviewer could witness failing.

| Wave | Task | Strongest criterion sampled | Verdict |
|:--:|---|---|---|
| 1 | T-101b | "count of external import sites into `flashcard/types` is **0** (was 43)" | Observable, with baseline |
| 1 | T-102b | "search of `features/notifications/` for `@/features/` returns **zero**"; accept **and** decline work end-to-end | Observable |
| 1 | T-118a | "the reconciliation of the two currently-unequal sets is recorded as an **explicit adjudication** … no route silently changes" | Observable — forces the ambiguity into writing |
| 1 | T-120a | ledger exists at a documented path; four mandatory fields; "a row missing any of the four is **invalid by the format's own statement**" | Observable by inspection only (see soft spots) |
| 2 | T-117a | "a **deliberately introduced off-by-one** in the interval calculation fails at least one test — the suite **discriminates**, it does not merely execute" | Strongest in the set (mutation-grade) |
| 2 | T-116a | "count of report-less swallows on real-state writes is **0** (was 17)" | Observable, with baseline |
| 2 | T-116b | "decided and recorded against Q-4 … **An undecided state is a failure of this task**" | Observable — converts a gate into a decidable outcome |
| 3 | T-113a | "Mounting N components … opens **one** listener, not N — assertable in a test that mounts multiple consumers" | Observable |
| 3 | T-114b | "**No code path substitutes a literal `0`** for a missing metric — a search … returns zero fabricating fallbacks" | Observable |
| 4 | T-106a | "an action without `.metadata({ permission })` **does not compile**" | Compile-time — strongest possible form |
| 4 | T-115a | "`isOwner` semantics match `ownerId ?? userId` everywhere … the behavioral delta … is the one deliberate, recorded change" | Observable, and names its own intended delta |
| 4 | T-109b | "imported by a real write path **or removed** — the 'source of truth' header is **true or gone**" | Binary |
| 5 | T-108a | "a deliberately non-exhaustive switch over the union **fails typecheck**" | Compile-time |
| 5 | T-119e | "the `addon-vitest` removal **does not disturb the four real test configs** — all five suites run unchanged" | Observable |
| 6 | T-104a | "the flat `components/` directory **no longer exists**" | Observable |
| 6 | T-105b | "**No `_components/` file under `app/` imports feature hooks, domain, or services**" | Observable |
| 6 | T-112a | "a search confirms **no offset pagination and no `useInfiniteQuery`**" | Observable |

**No sampled criterion merely restates its task title.** Many carry a *from-value* (43 → 0, 17 → 0, 0 → >0), which is the property that makes them falsifiable rather than aspirational.

**Soft spots found (reported, not counted as failures):**

1. **`01` T-104a AC-5** — "Boundary calls at the contested seams (progress touches study and dashboard) are **decided and documented**, not left implicit." Requires a decision to exist; states no test of its adequacy. Weakest sampled criterion.
2. **T-120a / T-120c / T-105b** carry inspection-grade criteria only (a document exists / a rule is written). Defensible for documentation tasks — but see C7-b, where `08` §7.4 declares exactly this shape a readiness failure.

---

## 8. Known-issues verification (own finding on each)

| # | Issue as stated | My finding |
|:--:|---|---|
| **1** | Q-4 has no owner row in `07-Open-Questions.md` | **CONFIRMED — and worse than stated.** Q-4 has **no row at all**, in any group, and no roll-up entry (§5a). "No owner row" implies a row missing an owner; there is nothing to miss. Consequence: no answering class, no standing default, no review-by date. |
| **2** | Register counts don't reconcile (26 / 25 / 32) | **CONFIRMED exactly.** Section heading "Open questions (**26**)"; §Roll-up "Total open **25**"; groups A 12 + B 6 + C 2 + D 5 + E 7 = **32**. All three re-derived by hand from the tables. `09` §5.2's reading ("Q-4 was the dropped 26th row") is plausible: 25 non-minor + Q-4 = 26 matches the heading. **Do not adopt that as fact** — the group sum still fails by 6 either way (the roll-up's 25 excludes the 7 minors that its own rows include). Needs a corrective pass, not a chosen number. |
| **6** | Sprint-count conflict: 02/06 ≈20, 03 = 29, 00-INDEX reconciles to 29 | **CONFIRMED.** `02` ¶27 and `06` §2 both state "197 d ≈ **20 sprints** ≈ 40 weeks"; `03` §1.2 states "190 task-days · **29 sprints** · 58 weeks". **02 and 06 are internally consistent with their own model** — `02` ¶378's gate-lead-time argument ("roughly 14 sprints") is derived correctly from the 20-sprint scale — so the brief's suspicion of *internal* inconsistency is **not** borne out. The real defects are external: (a) neither `02` nor `06` carries any pointer to the reconciliation (grepped for `29` and `reconcil` in both — nothing); (b) the two documents claim **different "plan standard" conversions** — `02` ¶11 "the plan's standard S=1 / M=3 / **L=6.5**" vs `03` §1.1 "S = 1d, M = 3d, **L = 6d**"; (c) the number **20** collides — it is `02`/`06`'s program duration and simultaneously `00-INDEX`/`08`'s count of READY sprints ("**20 of 29 sprints are READY**"). |
| **7** | NQ-3 closed-by-decision in `07` but gated in planning | **CONFIRMED, and handled consistently.** `07` §0 lists NQ-3 under "Closed — RESOLVED-BY-DECISION", default = delete, owner-veto note. The kernel marks T-110b `[GATED NQ-3]`. Every downstream document flags it and treats it identically as a veto window: `01` §5.3 + T-110b, `03` §10.3 + §2 ("Sprint 28 is **not** gated"), `04` §8.4 ("veto window, **not a gate**" — and PR-28.4 excluded from the five genuinely-blockable PRs), `05` Part C ("the lone inconsistency among the five resolved-by-decision questions"), `08` §6.3, `09` §5.1 row. **Residual:** the headline "16 gated / 46 ready" therefore counts one task that four documents say is not gated; `08` §4 nonetheless marks S28 NOT READY "per the kernel." Cosmetic, fully disclosed. |
| **8** | T-115b/T-108a wave inversion, resolved via report-only staging — verify it is *recorded*, not asserted | **PASS — genuinely recorded in six documents, not asserted once.** `01` §5.4 **and** in both tasks' acceptance criteria (T-115b AC-3 "runs in report-only mode"; T-108a AC-4 "moved from report-only to failing"); `03` §9 rule row "A CI check is never red by design" + §10.4; `04` §8.1 Notification-migration chain ("flips from report-only to failing at PR-21.1"); `05` Part B row 10; `10` §4.1 R4.1 ("must **not** be counted as a passing check until it flips in R5.1") + §4.5 step 0. This is the best-evidenced resolution in the artifact set. **One residual risk, flagged as inference not fact:** only the *notification* target is staged report-only. T-115b AC-4 also names **`LogSource`** a covered target, while T-119b (Wave 5) reports `cloud_function` has **zero producers** — so if the check treats "union member with no writer" as a disagreement, the LogSource target may be red from S17 until T-119b lands at S24. Cannot be resolved from the documents; should be settled at T-115b's design. |
| **9** | 63 authoritative; verify no residue of 50 | **PASS.** Grepped all of `implementation-planning/` and `architecture-decision/` for `50 task` / `~50`. **Seven hits, all errata notices** explicitly labelling 50 wrong: `01` §5.1, `02` ¶9, `03` §10.1, `05` ¶Authority, `06` ¶Authority, `07` ¶Binding-input, `08` ¶Binding-input + §6.1. **No operative count of 50 survives anywhere.** I also re-derived 63 independently from `01` §3's task headings (14+8+10+12+10+8+1) and confirmed it against `01` §4.1/§4.2 (19 S + 29 M + 14 L + 1 unsized = 63), `09` §3 wave headers, and `04` ¶1. All agree. |
| **10** | Coverage gaps deliberately carried: one top-10 debt with no task; two privacy risks routed to product intent | **CONFIRMED — recorded, not dropped; but the count is off by one item.** `01` §2.2 carries them: (a) "Tighten the 200-line ceiling to `error` and clear its 44 warnings (**TD-3, a top-10 debt**) — **Deliberate deferral, explicitly flagged in the source** … Recorded here so the omission stays auditable"; (b) "Leaderboard PII readability (**R-3/NQ-7**); world-readable card-image Storage (**R-18/NQ-8**); **the client-gated no-SSR model (W-14/NQ-10)**". That row bundles **three** items, only two of which are privacy risks. `00-INDEX` §Phase-7 then says "**two** top-corpus items intentionally carry no task (a deferred debt item and two privacy risks)" — which is 1 + 2 = three things described as two. Cross-checked against `07` Group A: NQ-7 and NQ-8 both carry "*None in kernel* — recorded open" and "**R-3 / R-18 remains an open risk, not decided**". **Recording verified; arithmetic wrong.** |
| *(3, 4, 5 — other reviewers)* | — | Noted in passing, no verdict claimed: **item 3** (critical path terminates in gated T-108d) is recorded in `01` §5.5, `03` §1.3 + §10.5, `05` Part C, `06` §⚠, `08` §6.5, `00-INDEX` §Two-things — six documents, consistent. **Item 4** (T-118d `[OPEN]` gates verification) is `08` §6.2 and PF-1. **Item 5** (T-118b APP_ID) — I did not adjudicate, but note the artifacts do not agree on its Wave-1 status: `05` §D.1 lists T-118b as a day-one "zero predecessors, zero gates" parallel start, while `10` §3.3(6) calls R1 "a latent data-partition change whose severity is unknown", §4.2 says "**Holding it out is the recommended default**", and §3.5(4) says it "makes an 'ungated' Wave-1 task **quietly dependent on Q-1**". `05` §D.1 carries no such caveat. |

---

## 9. Consolidated defect list, ranked

**Critical (blocks Sprint 1): none.**

Stated deliberately rather than omitted. Sprint 1 is T-120a, T-120b, T-120c, T-118a (`03` Sprint 1). I checked each against every defect below: none prevents starting. The only Sprint-1-touching defects are **D-9** (ledger scope stated five ways — resolvable by taking the union) and **D-13** (a DoD rule that literally disqualifies the three ledger tasks — resolvable by reading "applicable" as `09` §1.4 does). Neither blocks execution.

### Major — blocks a later wave

| ID | Defect | Evidence | Document(s) that must change | Blocks GO? |
|---|---|---|---|:--:|
| **D-1** | T-117d is declared a droppable pure leaf while seven `01` tasks name it a prerequisite or verification oracle | `05` §D.2/§D.3 + Part A Wave 2 vs `01` lines 526, 624, 653, **656**, 680, 711, 770, 856; `08` §7(6) makes rules-suite tests a standing DoD | **`05`** (Part A Wave 2, §D.2, §D.3, Part B), **`06`** §Risk 2 | No — but fix before Wave 2 planning |
| **D-2** | ADR-106's universal `.metadata({permission})` obligation vs ADR-115's no-merge obligation: no document says which permission vocabulary a deck-sharing action declares | ADR-106 §SC-2 + `01` T-106a AC-1, T-106c AC-1 vs ADR-115 §Decision/§SC-3 + `01` T-119c AC-3 | **`architecture-decision/03`** (ADR-106 or ADR-115), then `01` T-106c AC | No — blocks Sprint 17 |
| **D-3** | T-119d classed executable-by-fallback; three documents require out-of-repo deployment facts first. The 12/4 split is really 11/4/1 | `09` §1.2 vs `01` T-119d AC-1 + §Fallback, `04` §8.4 PR-22.2, `10` §3.3(5) + §4.1 | **`09`** §1.2 (and the kernel's fixed-fact split) | No — distorts Wave 5 capacity |
| **D-4** | PF-8 (CS-7 barrel-reduction owner confirmation) is an external dependency needed at S2/S4, inside the runway claimed to have "zero external dependencies" through S8 | CS-7 §Conflicts + `08` §5 PF-8 ("unblocks S2, S27, and S4's flip") + `04` PR-28.1 vs `00-INDEX` §Where-to-start ("**zero external dependencies** … **No question needs answering before Sprint 1**") and `08` §5 ("the rest is hygiene") | **`00-INDEX`** §Where to start, **`08`** §3/§5 | No — Sprint 1 is clean; the claim is not |
| **D-5** | Three different revert units for the same change set | `01` T-106b/c §Rollback ("per-action") vs `10` §3.1/§3.2/§3.4 ("the release unit … revert **the whole unit**") vs `08` PF-9 ("sprint PRs are the revert unit") | **`01`** (add the "before T-106d" precondition) or **`10`**/**`08`** | No |
| **D-6** | Three further cross-wave edges stated in `01` but absent from `05` Part B, which claims to contain "every edge that crosses a wave boundary" | T-118a→T-107d (`01` T-107d AC-2); T-108a↔T-119d digest binding (`01` T-119d §Regression vs `05` Wave 5 "mutually independent"); T-115b→T-109d (`01` T-109d AC-3 vs `05` Wave 4 "independent of everything") | **`05`** Part A/B | No |

### Minor — documentation hygiene

| ID | Defect | Evidence | Must change |
|---|---|---|---|
| **D-7** | `07-Open-Questions.md`: no Q-4 row; counts 26 / 25 / 32 | §Open-questions heading, §Roll-up, group tables A12+B6+C2+D5+E7 | **`architecture-decision/07`** (already escalated as `08` PF-3) |
| **D-8** | `02`/`06` state 20 sprints with no in-document reconciliation; two conflicting "plan standard" L-conversions (6.5 vs 6.0); "20" collides with "20 of 29 READY" | `02` ¶11/¶27, `06` §2 vs `03` §1.1/§1.2, `00-INDEX` §Phase-7 + §Where-to-start | **`02`**, **`06`** (add the pointer; align or label the conversion) |
| **D-9** | Sprint-1 ledger backfill scope specified five ways; `09` §4.2 diverges from `02`, which `09` §4 declares canonical | `01` T-120b AC-1 (12) · `02` exit 11 (12) · `03` S1 (12 + Q-1 + "convergences") · `04` PR-1.2 (12 + Q-1 + Q-2) · `09` §2.3 (14+1) · `09` §4.2 ("all fourteen") | **`09`** §2.3/§4.2, or **`01`** T-120b AC |
| **D-10** | CS-2's enforcement column configures one rule two ways: `["warn", 400]` and `["error", 400]` | `04-Coding-Standards` CS-2 table, rows 2–3 | **`architecture-decision/04`** |
| **D-11** | The CS-2 400-error lint flip is scheduled and PR'd with **no owning task, no acceptance criteria, no named owner** | `04` PR-28.2 ("CS-2 rider on `T-104b`"), `03` S28 rider (a) vs `01` T-104b AC (no mention), `01` §4.5 (CS-2 row omits T-104b), `01` §2.1 (no M-n row), `09` §1.1 (omits it from the named-owner list) | **`01`** (assign as an M-n rider) |
| **D-12** | Three answers to when >400 becomes blocking: S1, S18, S28 | `08` §7(7) vs CS-2 §Conflicts vs `03` §9 / `04` PR-28.2 | **`08`** §7(7) |
| **D-13** | `08` §7(4) "a change with no applicable tier is a readiness failure, not a task" disqualifies T-120a/b/c, the head of the critical path | `08` §7(4) vs `04` PR-1.1/1.2/1.3 "Tests: **gate only**", `04` §1.1, `09` §1.4 | **`08`** §7(4) |
| **D-14** | PR-28.2's "only one non-test violator" precondition is anchored to the pre-program census, not to the S28 codebase | `04` PR-28.2 §Reviewable + CS-2 §Why ("the **only current** non-test violator") vs `01` T-106b §Standards (`admin.actions.ts` at 380 "in the review tier — **split by responsibility if the migration makes it two**") | **`04`** PR-28.2 (re-verify at flip time) |
| **D-15** | Wide-surface sprint list stated three ways | `03` §1.1 & §9 = {3,9,12,16,19,27}; `03` §1.2 = {3,12,16,19,27}; `04` headings mark {3,16,19,27} | **`03`**, **`04`** |
| **D-16** | "Two top-corpus items" then names three (1 debt + 2 privacy risks); `01`'s row also bundles a third, non-privacy item | `00-INDEX` §Phase-7 row 3 vs `01` §2.2 (R-3/NQ-7, R-18/NQ-8, **W-14/NQ-10**) | **`00-INDEX`** |
| **D-17** | Ledger cardinality understated; two ADR-required rows are in no enumeration | `09` §2.2 ("14 rows + 1 conditional") vs `01` T-106a AC-4 ("The convergence contract is recorded in the ledger") and `05` Wave-1 edge note ("T-101a/b is itself staged work and per ADR-120 **must record its completion state**") — neither appears in LDG-01…15 | **`09`** §2.3 |
| **D-18** | The raw-hex tail (38 across 29 files) is assigned only to dialog + table surfaces, but repo-wide clearance is a wave-exit criterion | `01` §2.1 M-6 ("rides along with the dialog and table work. **Not a standalone task**") vs `02` Wave 6 exit criterion 13 ("**zero** arbitrary-value hex classNames outside the carve-out (was 38 across 29 files)") and `09` §4.2 Wave 6 ("the raw-hex tail is **cleared**") | **`01`** M-6 or **`02`**/**`09`** exit criteria |
| **D-19** | *(inference, not confirmed)* T-115b's `LogSource` target may be red-by-design S17→S24; only the notification target is staged report-only | `01` T-115b AC-3 (notification target only) + AC-4 (`LogSource` is a covered target) vs T-119b §Description (`cloud_function` has zero producers) and `03` §9 ("A CI check is never red by design") | Settle at T-115b design; **`01`** T-115b AC if confirmed |

---

## 10. Bottom line for the GO decision

**Nothing found in Phase 1 is Sprint-1-blocking.** Sprint 1's four tasks (T-120a/b/c, T-118a) carry complete, observable acceptance criteria, have no unsatisfied dependency in `05` Part A, and are unaffected by every Major defect above. Sprint 1 can start.

**Three findings should qualify a GO rather than block it:**

1. **D-4 falsifies the runway claim, not the runway.** "Sprints 1–8, zero external dependencies" (`00-INDEX`) is contradicted by `08`'s own PF-8, an owner decision needed at S2 and S4. The work is still executable; the claim needs correcting so nobody discovers at S4 that a lint flip is waiting on an unasked question. Since the brief names that claim as the crux of GO, this is the finding most likely to change a verdict.
2. **D-1 is a live hazard, not a paperwork error.** `05` and `06` both invite a scheduler under pressure to cut T-117d as off-path float. Doing so removes the verification oracle that `01` names for T-115a (an access-control change to "the closest thing in the corpus to a discovered live bug"), T-115c, T-106b and T-108b. Fix `05` §D.2/§D.3 before Wave 2 is planned.
3. **D-3 mis-sizes Wave 5.** T-119d cannot execute on its default without production access. Wave 5's executable-fallback count is 11, not 12 — and `09` §1.2's entire justification is that this distinction drives sprint loading.

**One thing I could not verify and will not pass silently:** whether T-115b's `LogSource` target goes red between S17 and S24 (D-19) cannot be determined from the documents — it depends on a check semantics decision no artifact records. **Unverifiable from documents**, not false.
