# 02 — Open Questions (Execution-Readiness Review)

**Phase 2 · Adversarial review.** This is a *verification* pass over `architecture-decision/07-Open-Questions.md` and the question-handling in `implementation-planning/`. It creates no new questions and answers none. Where a prior document's arithmetic, ownership, or classification does not hold up, it is named and cited rather than smoothed.

**Note on inputs.** `requirements-consolidation/` does not exist (deleted pre-discovery, never committed). Recorded once here; not treated as a gap in what follows.

**Method.** Every count below was re-derived by enumerating the register's group tables directly, not by reading its roll-up. Every classification was checked against the task that the question gates, not against the register's self-description.

---

## 0. Headline findings

| # | Finding | Verdict |
|---|---|---|
| 1 | **Q-4 has no row in any of `07`'s five group tables.** It survives only as a parenthetical inside NQ-14's "Who can answer" cell. | **VERIFIED — confirmed** |
| 2 | **The true count of distinct open items is 33** — 26 substantive (incl. Q-4) + 7 minor. The register's header (26), roll-up (25), and group sums (32) each capture a different subset; none is simply "wrong," but no two agree. | **VERIFIED — reconciled below** |
| 3 | **The "12 executable / 4 inaction" gated split does not survive inspection.** My tally: **6 unconditionally executable · 2 record-only · 3 partial · 1 conditional-on-external-fact · 4 inaction.** The 4-inaction figure is exactly right; the 12 is reachable only under the loosest reading of four disputed classes. | **CONTRADICTED (in part)** |
| 4 | **No enumerated question (Q-n / NQ-n) blocks Sprint 1.** Verified task-by-task against all four S1 tasks' acceptance criteria. | **VERIFIED** |
| 5 | **Two unregistered decisions condition Sprint 1's *completion*** (not its start): T-118a's allowlist adjudication and T-120b's owner designation. Neither has a question ID, an owner, or a default anywhere in the corpus. | **NEW — not previously flagged** |
| 6 | **`01-Validated-Backlog.md` contradicts itself on Q-12's default** — §2.4's table says "wire or delete"; the task bodies say "do not guess, hold at pending disposition." Opposite instructions, same document. | **NEW — not previously flagged** |
| 7 | **Q-1 blocks a Wave-1 task's safe execution (T-118b), which `08`'s readiness table records as unblocked.** `10` says so plainly; `08` does not. | **CONTRADICTED — 08 vs 10** |

---

## 1. Blocks-Sprint-1 shortlist

**This is the list that feeds the GO decision. It is short.**

### 1.1 Enumerated questions blocking Sprint 1: **none**

Verified by walking each of Sprint 1's four tasks (`03-Sprint-Plan.md` §Sprint 1 · Wave 1 — T-120a S(1), T-120b M(3), T-120c S(1), T-118a M(3), 8 d) against its acceptance criteria in `01-Validated-Backlog.md`:

| Task | Needs an external answer? | Evidence |
|---|---|---|
| **T-120a** — create the ledger artifact | **No.** Documentation with a fixed schema. | `01` T-120a acceptance criteria — file path, format, four mandatory fields, worked example. All in-repo. |
| **T-120b** — backfill ledger rows | **No — and it is satisfied *by* the questions being open.** Its criterion is that the hosting row "records Q-2 as **Open**". An unanswered question is the required content, not an obstacle. | `01` T-120b, criterion 3 |
| **T-120c** — fix the docs ADR index | **No.** In-repo docs fix. | `01` T-120c |
| **T-118a** — one allowlist module | **No for execution; yes for one adjudication** — see §1.2. | `01` T-118a; `03` §Sprint 1 |

This corroborates `08-Implementation-Readiness.md` §3's claim that the S1–S8 runway is "reachable without answering a single open question" **for Sprint 1 specifically**. It does **not** corroborate the claim for Sprint 2 — see §1.3.

### 1.2 Two unregistered items that condition Sprint 1's *completion*

Neither has a question ID, an owner class, a default, or a review-by date anywhere in the corpus. Both were found by reading task acceptance criteria rather than the register — the same method that surfaced Q-4, and exactly the audit `07-Risk-and-Mitigation.md` X-13 contingency (3) recommends ("audit the register once for any *other* question cited by an ADR but absent from the tables").

| Item | What it is | Classification | Blocks S1? | Default available? |
|---|---|---|---|---|
| **U-1 — the allowlist adjudication** | T-118a's criterion 3 requires "the reconciliation of the two currently-unequal sets … recorded as an explicit adjudication (which proxy-only entries the AuthGate must now honor)". **NQ-2 is closed-by-decision only on "divergence = defect" — it is silent on which set is canonical.** The corpus decides *that* the lists unify, never *to what*. | **Needs Security Decision** | **Blocks S1's exit, not its start.** `03` §S1 splits the work into "neutral consolidation, then the behavior switch" — PR 1 ships without the adjudication; PR 2 cannot. | **No safe mechanical default.** Union = auth-splash bypass; intersection = SEO/share-link breakage (`01` T-118a Regression scope). The adjudication is the work. |
| **U-2 — owner designation** | T-120b requires every gated disposition to have a ledger row with **all four fields populated**, one of which is `owner`. `09-Progress-Tracking.md` §5.1 tightens this to "**owner named (a person, not a class)**". **No artifact in the corpus names a single human for any role.** Every owner value in `07` is a role ("Product owner", "Author intent"). | **Needs Business Decision** | **Blocks S1's exit, not its start.** | **Yes, implicitly** — `07-Risk-and-Mitigation.md` §X-3 states "the sole developer is plausibly also the product owner." Self-designation discharges it. But that is an inference the plan makes in passing, never a recorded decision. |

**Severity: low, but real.** Both are minutes of decision-making, not weeks. They are listed because the plan's own promise is that Sprint 1 is unconditionally READY, and two of its four tasks carry a criterion no artifact discharges.

### 1.3 Sprint 2 is *not* free of external dependency — and the readiness table says it is

This is the single most consequential disagreement I found between two planning documents.

- **`08-Implementation-Readiness.md` §2** records **S2 · READY · Blocker(s): —**, and §3 asserts eight consecutive READY sprints with "**zero external dependencies**."
- **`10-Release-Plan.md` §4.2** says of T-118b (Sprint 2, 3 of its 8 days): *"**Cannot be determined** (Q-1 unanswered — the current state) → T-118b ships with an explicit recorded assumption that the values agree, or is held out of R1. **Holding it out is the recommended default.**"*
- **`10` §3.5 (4)** states it outright: *"R1's T-118b needs its pre-release check run before merge, which makes an 'ungated' Wave-1 task quietly dependent on Q-1."*
- **`10` §3.3 (6)** classifies T-118b as one of the seven non-reverting change classes: if the two `APP_ID` values differ in production, unifying them "repoints one package at a different `artifacts/{APP_ID}` partition… **No code revert reunites them.**"

**Adjudication: `10` is authoritative.** It reasons from the specific failure mode (silent tenant split, TD-16/R-14) and names the pre-release check; `08` records a blocker-free cell with no counter-argument. The correct entry for S2 is **READY WITH ASSUMPTIONS** (assumption: the two `APP_ID` env vars agree in the deployed environment) or, on `10`'s own recommended default, **S2 minus T-118b** — a 5-day sprint.

**Consequence for the GO decision: Q-1 blocks a Wave-1 task's *safe* execution.** It does not block Sprint 1. The "S1–S8 unbroken runway" claim survives for S1 and for S3–S8; it fails at S2 unless T-118b is deferred or shipped on a recorded assumption.

---

## 2. Verification tasks (a)–(d)

### (a) Does Q-4 have an owner row? — **CONFIRMED: no**

I read all five group tables in `architecture-decision/07-Open-Questions.md` directly and enumerated every ID:

| Group | IDs present | Count |
|---|---|---|
| A — [INTENT] product/author | Q-8, Q-11, Q-13, Q-12, Q-7, Q-17, NQ-7, NQ-8, NQ-10, Q-14, Q-15, Q-16 | 12 |
| B — [GCP]/[OPS] | Q-1, Q-6, Q-10, Q-9, NQ-1, Q-2 | 6 |
| C — [DATA] | Q-5, NQ-6 | 2 |
| D — [REPO]/[MEASURE] | NQ-14, NQ-11, NQ-12, NQ-13, Q-3 | 5 |
| E — minor intent gaps | m-1 … m-7 | 7 |
| §0 — closed by decision | NQ-2, NQ-3, NQ-4, NQ-5, NQ-9 | 5 |

**Q-4 appears in none of them.** Its only occurrence in the entire file is `07` line 75, inside NQ-14's "Who can answer" cell: *"[MEASURE] local profiling + bundle analyzer ([ENV]/[DATA] for real-usage, **couples to Q-4**)"*.

**Q-4 is real, and the rest of the corpus treats it as live:**
- `project-discovery/13` line 33 defines it: *"Do production observability credentials exist (Sentry DSNs, PostHog key), and what analytics scope was intended?"*
- `architecture-assessment/12` line 20 carries it into the validation set.
- `architecture-decision/06-Decision-Matrix.md` names it as AD-16's gate in **four** places (lines 31, 71, 122, 147).
- `architecture-decision/03-Architecture-Decisions.md` line 451: **"Status. Accepted-conditional on Q-4 (activation leg)."**
- The planning kernel gates **T-116b** and **T-116c** on it.

**Also verified: the Q-1…Q-17 sequence is complete except for Q-4.** `07` carries Q-1, Q-2, Q-3, Q-5, Q-6, Q-7, Q-8, Q-9, Q-10, Q-11, Q-12, Q-13, Q-14, Q-15, Q-16, Q-17 — sixteen of seventeen. Q-4 is the single omission. All fourteen NQ-n are present (nine open, five closed). **A dropped row, not a systemic loss.**

**Downstream handling is adequate, and is the reason this is not a GO-blocker.** Four planning documents caught it independently: `01` §5.2, `07-Risk-and-Mitigation.md` X-13, `08` §6 incoherence 4, `09` §5.2, and `10` §1.1/§7.1. `03-Sprint-Plan.md` §Sprint 1 assigns Q-4 an owner **eight sprints before it bites**. `09` §5.1 tracks it as `Unassigned` rather than `Not asked`, correctly distinguishing the two failure modes.

**Residual, and it is the part that matters:** the compensation lives in the plan, not the source. `architecture-decision/07-Open-Questions.md` is still wrong on disk. The next reader of that register reaches the same wrong conclusion. **PF-3 is the fix and it is one paragraph of work.**

### (b) The count discrepancy — **reconciled; the true count is 33**

The three figures in `07` are each a count of a *different set*. None is a simple arithmetic slip, which is why "picking a number" would have been the wrong move.

| Figure | Where | What it actually counts | Correct for that set? |
|---|---|---|---|
| **26** | `07` §"Open questions (26)" heading | Substantive open questions **including Q-4** (25 enumerated + Q-4) | ✅ **Yes** |
| **25** | `07` Roll-up, "Total open" | Substantive open questions **as actually enumerated** (Q-4 missing) | ✅ Yes — and it equals A+B+C+D exactly |
| **32** | Group tables A+B+C+D+E | All open items **including the 7 minor gaps** | ✅ Yes — 12+6+2+5+7 |
| **18** | Roll-up parenthetical, "18 blocking a decision or a future decision" | — | ❌ **Not reconstructible** |

**The header's "26" is right, and that is the most interesting thing in this section.** 25 enumerated + Q-4 = 26. The most economical explanation is that **Q-4's row was drafted and then lost**, leaving the heading count as residue. *(Inference from the arithmetic, not a documented fact — labelled as such.)* It also means the corrective pass is smaller than it looks: restore one row and the header is already correct.

**The "18" does not survive.** Counting the questions in Groups A–D whose "Decisions gated" cell names a decision: Group A yields 7 (NQ-7, NQ-8, NQ-10, Q-15, Q-16 all read "None"); Group B yields 6; Group C yields 2; Group D yields 0–2 depending on whether NQ-12's "Refines AD-07" and NQ-14's "Informational" count. **The total is 15, 16, or 17 — never 18, under any reading of the register's own column.** This figure was not previously flagged by any planning document and should be dropped rather than corrected.

**AUTHORITATIVE COUNT — the number to carry forward:**

> **33 distinct open items = 26 substantive (Q-4 restored) + 7 minor informational gaps.**
> Plus **5 closed-by-decision** (NQ-2, NQ-3, NQ-4, NQ-5, NQ-9), of which **NQ-3 is contested** — see §4.

### (c) The 16 gated tasks — **my own tally contradicts the 12/4 claim**

The claim under test: `09-Progress-Tracking.md` §282 — *"Gated fallback split: **12 executable · 4 inaction** (T-115c, T-108b, T-108c, T-108d)."*

**Test applied:** does executing the fallback *unilaterally, with no external answer*, discharge the task's own stated deliverable? I read each fallback string in `01-Validated-Backlog.md` rather than the summary table.

| # | Task | Gate | Wave | Fallback (quoted from `01`) | Plan | **Mine** |
|---|---|---|:--:|---|:--:|:--:|
| 1 | T-116b Activate Sentry | Q-4 | 2 | "Defer activation, record the deferral and its reason in the ledger." | E | **R** |
| 2 | T-116c Activate PostHog | Q-4 | 2 | "Defer, record, and leave the wiring untouched." | E | **R** |
| 3 | T-114d analytics read paths | Q-9 | 3 | "Delete the dead reads and their zero-fabricating fallbacks." | E | **E** ✅ |
| 4 | T-109b `cardContentSchema` | Q-12 | 4 | "**Do not guess.** Hold at documented 'pending disposition' … the misleading header is removed or corrected." | E | **P** |
| 5 | T-109c `privacyModeSchema` | Q-12 | 4 | "Hold at documented pending disposition with a ledger row and review-by date." | E | **P** |
| 6 | T-109d `publicRoleSchema` | Q-12 | 4 | "Hold at documented pending disposition with a ledger row and review-by date." | E | **P** |
| 7 | T-115c admin predicates | Q-10 | 4 | "**Do nothing to the predicates** — the standing default is 'no alignment yet.'" | I | **I** ✅ |
| 8 | T-108b index/rules deploy | NQ-1 | 5 | "**Retain** dual indexes, dual queries and dual fields." | I | **I** ✅ |
| 9 | T-108c `@deprecated` fields | Q-5 | 5 | "**Retain everything.**" | I | **I** ✅ |
| 10 | T-108d collapse dual paths | Q-5 | 5 | "**Retain the dual machinery. Do not collapse.**" | I | **I** ✅ |
| 11 | T-119a 7 dormant kinds | Q-8 | 5 | "Delete each unclaimed kind (the standing default)." | E | **E** ✅ |
| 12 | T-119b 8 actions + LogSource | Q-11 | 5 | "Delete unclaimed members…" | E | **E** ✅ |
| 13 | T-119c inert admin UI | Q-13 | 5 | "Delete (behavior-neutral — these controls do nothing today)." | E | **E** ✅ |
| 14 | T-119d `fanOutNotifications` | Q-6 | 5 | "Delete the un-called fan-out … **but only after** the deployment-facts half of the gate is satisfied — the default covers intent, not deployment state." | E | **C** |
| 15 | T-119e Storybook | Q-17 | 5 | "Delete. Q-17's answerability is rated **Low**…" | E | **E** ✅ |
| 16 | T-110b `Drawer` | NQ-3 | 6 | "**Delete.** … an unanswered veto window simply expires." | E | **E** ✅ |

**Legend.** **E** executable (fallback discharges the deliverable) · **R** record-only (acceptance criterion met, zero functional delivery) · **P** partial (a code change happens, but explicitly *not* the task's named disposition) · **C** conditional (fallback cannot fire without the very external fact that is missing) · **I** inaction.

**MY TALLY: 6 E · 2 R · 3 P · 1 C · 4 I.**

**Where the plan's 12 comes from, and why it overstates:**

1. **T-116b / T-116c → R, not E.** The tasks are titled "Activate Sentry" / "Activate PostHog." Their fallback is *don't activate*. The classification is *technically* defensible — ADR-116's success criterion accepts "explicitly deferred with the reason logged in the ledger," so the criterion **is** met — but the delivery is a ledger row and the observability gap is 100% intact. `10` §1 itself concedes it: R2.2's "Ships independently?" is **No**. Calling this "executable" makes the telemetry hole look smaller than it is. **This is the one I would push back on hardest.**
2. **T-119d → C, not E.** The fallback is conditioned on satisfying "the deployment-facts half of the gate" — which is [GCP]/[OPS] and unanswerable in-repo. `10` §4.6 confirms: T-119d is "**the only one with deployed state**." A fallback gated on the missing fact is not an executable fallback.
3. **T-109b/c/d → P, not E** — **and `01-Validated-Backlog.md` contradicts itself here.** Its §2.4 table gives Q-12's default as *"Per-schema: wire into the write path if adoption was intended, else delete. **No schema stays declared-but-unenforced.**"* (matching `07`'s standing-defaults summary). Its task bodies give *"**Do not guess.** Hold at documented 'pending disposition'."* **These are opposite instructions in the same file.** Under §2.4 they are E; under the task bodies they are P. **Not previously flagged by any document.** The task bodies are the safer reading and should be treated as authoritative — guessing a schema's intended enforcement point is precisely the "declared-but-unenforced" failure ADR-109 exists to end.

**What survives:** the **4-inaction figure is exactly right** — T-115c, T-108b, T-108c, T-108d, confirmed verbatim. The release checklist in `10` §6 hard-codes those four by name (*"No task with an INACTION fallback is included in this release"*), so the operational control is correct even though the headline split is generous.

**Net effect on the GO decision: small.** All disputed reclassifications sit in Waves 2, 4, and 5. **None touches Sprint 1 or the S3–S8 runway.** The honest restatement is: *of 16 gated tasks, **6 can be fully discharged on their defaults**; 2 more can be formally closed with no functional delivery; 3 can be partially advanced; and **5 cannot be worked at all** without an external answer.*

### (d) What blocks Sprint 1 — **nothing enumerated**

Covered in §1. Restated for the GO decision:

- **Zero** of the 33 open items blocks Sprint 1's execution.
- **Two unregistered decisions** (U-1 allowlist adjudication, U-2 owner designation) condition Sprint 1's *exit criteria*. Both are self-dischargeable within the team.
- **`08` §5's framing is overstated.** It calls all ten pre-flight items "conditions on starting," which would make PF-1 (the hosting decision, Q-2) a Sprint-1 blocker and contradict both `08` §2's own S1 verdict and `08` §3's runway claim. **Adjudication: only PF-4 (toolchain + suites green), PF-5 (baseline green, SHA recorded), and PF-9 (branch/rollback convention) are genuine Sprint-1 entry conditions.** PF-1, PF-2, PF-3, PF-7 are lead-time actions for Waves 2–5; PF-8 conditions S2/S4/S27; PF-6 and PF-10 are hygiene. All three genuine ones are in-house engineering acts requiring no external answer.
- **Caveat carried forward:** PF-5's "pre-commit gate green at HEAD" needs re-examination against the repository's CI configuration — see the note in §5.

---

## 3. Consolidated register

**Columns.** ID · Question · Classification (fixed vocabulary) · Blocks Sprint 1? · Blocks which wave · Work on a documented default? · Owner class · Answer-latency risk.

**A note on the vocabulary.** The six fixed classes are decision classes. Several items in this register are **fact-findings, not decisions** — Q-1, Q-3, Q-5, Q-6, Q-9, NQ-1 are answered by looking at a console or a data sample, not by anyone choosing. Each is assigned its nearest owner-routing class and flagged `†`. This is a gap in the vocabulary, not in the register.

### 3.1 Group B — production / deployment state (6, +Q-4 restored)

| ID | Question | Classification | Blocks S1? | Blocks wave | Default? | Owner class | Answer-latency risk |
|---|---|---|:--:|---|---|---|---|
| **Q-1** | Which Firebase project is production; what is its provisioned state? | **Needs Infrastructure Decision** † | **No** | **W1 (partial — T-118b safe execution), then verification of W2/3/5** | **Yes** — decisions proceed on fixed directions; only production *verification* waits (`07` Group B). But T-118b's *safe* execution has no default: `10` §4.2's recommended default is **hold it out of R1**. | Infra / ops (whoever can provision or name a Firebase project) | **Days if the answer is "provision one"; indefinite if it waits on Q-2.** Meanwhile every production verification is deferred and T-118b either slips or ships on a recorded assumption. **Highest-leverage single answer in the set.** |
| **Q-2** | Where is the app deployed; what is the canonical URL? | **Needs Business Decision** | **No** | **Blocks *deployment* of every wave; blocks no task's execution** | **Yes** — `SITE_URL` localhost fallback stands, flagged by T-120b's ledger row. | Product + ops owner. **`07` is explicit: "a decision to make, not a fact to find."** | **Indefinite — it has no natural forcing function.** T-118d is `[OPEN]`/not-schedulable, so **the plan cannot resolve it from inside itself** (`08` §6 incoherence 2). Meanwhile ten verified releases accumulate on `main` with nowhere to go. |
| **Q-4** ⚠ | Do production Sentry/PostHog credentials exist, and what analytics scope was intended? | **Needs Product Decision** (scope + privacy posture; credentials sub-part is Infrastructure) | **No** | **W2** (T-116b, T-116c) | **Yes** — defer activation, record the reason. ADR-116's policy leg (T-116a) is unconditional and carries S9's value. | **NONE IN THE REGISTER.** Inferred [GCP]+[INTENT] by `09` §5.2. `03` §S1 assigns it in-plan. | **Highest latency risk in the set — not because it is hard, but because it has no owner by construction.** `09` §5.2: "Unassigned gates do not age — they are simply never answered." Mitigated by S1 naming it 8 sprints early. |
| **Q-6** | Are the Cloud Functions deployed; do `APP_ID` vars agree in production? | **Needs Infrastructure Decision** † | **No** | **W1 (T-118b's pre-release check), W5 (T-119d)** | **Partial.** Delete-unless-claimed covers *intent*; the deployment half has no default (`01` T-119d). | Ops / GCP console | **Answerable in minutes given console access; indefinite without it.** Meanwhile T-119d cannot fire its fallback and T-118b's `APP_ID` comparison cannot run. |
| **Q-9** | What populates `analytics_daily` / `metadata/counters` in production? | **Needs Infrastructure Decision** † | **No** | **W3** (T-114d) | **Yes** — remove the dead reads (honest-UI is policy on both branches). | Data / GCP | **Low risk.** Fallback is genuinely executable and the honest-UI legs ship ungated. If it answers "a writer exists," the alternate branch is the **only non-reverting branch** (`10` §3.3 (7)). |
| **Q-10** | How is admin authority provisioned (claims vs `admins/{uid}`)? | **Needs Security Decision** | **No** | **W4** (T-115c) | **No.** "The one gate whose default is *inaction*" (`01` §2.4). Aligning blind risks locking out real admins or over-granting. | Ops / GCP + security owner | **Medium.** T-115c holds indefinitely; R4.1 ships without it and LDG-14 carries the deferral (`10` §1.1). The three divergent predicates stay divergent — a *known* insecurity, not a growing one. |
| **NQ-1** | Is the runbook's "NOT yet deployed" status for notification indexes/rules still current? | **Needs Infrastructure Decision** † | **No** | **W5** (T-108b) | **No.** Default is *retain* — inaction. | Ops / GCP | **Medium-High.** `07`: "a stale note that outlived a deploy would be worse than none." Meanwhile the dual-schema tax persists and R5.1's gated half cannot sequence. |

### 3.2 Group C — live data sample (2)

| ID | Question | Classification | Blocks S1? | Blocks wave | Default? | Owner class | Answer-latency risk |
|---|---|---|:--:|---|---|---|---|
| **Q-5** | Actual state of the notification schema migration in production data? | **Needs Infrastructure Decision** † | **No** | **W5** (T-108c, T-108d) | **No.** "Retain everything" — inaction. | Data + ops | **Highest structural risk in the program.** T-108d is the **critical path's terminal node** (X-14) — the program has no in-repo completion condition. Downstream of Q-1, downstream of Q-2. Meanwhile TD-1, the corpus's **#1-ranked debt**, survives the entire program with only its type-level half fixed. |
| **NQ-6** | What public-deck scale is expected; is the unbounded listener acceptable at it? | **Needs Product Decision** | **No** | **None — sizes, does not gate** | **Yes** — an explicit conservative bound plus paging, recorded in the ledger (`03` §S13). AD-14 mandates a bound regardless. | Product owner + data | **Low.** Only sizes urgency. Risk if unanswered: a bound set too low reads to users as data loss (`03` §S13 Risk). |

### 3.3 Group A — product / author intent (12)

| ID | Question | Classification | Blocks S1? | Blocks wave | Default? | Owner class | Answer-latency risk |
|---|---|---|:--:|---|---|---|---|
| **Q-7** | Intended end state of `NotificationType` (4) vs `NotificationKind` (16)? | **Needs Engineering Decision** | **No** | **None** — T-108a is Ready with the default in force | **Yes** — union widens to the 10 written values. | Author | **Low.** The valuable half (T-108a) ships ungated in S21. |
| **Q-8** | Which of the 7 inactive `NotificationKind`s are still intended to ship? | **Needs Product Decision** | **No** | **W5** (T-119a) | **Yes** — delete unclaimed. | Product owner | **Low-Medium.** Executable fallback. Part of the `[INTENT]` cluster: **one sitting clears five questions and three sprints** (`08` PF-7). |
| **Q-11** | Are the 8 never-emitted `ActivityAction`s + `cloud_function` `LogSource` planned or dead? | **Needs Product Decision** | **No** | **W5** (T-119b) | **Yes** — delete unclaimed; kana-practice gap resolves in the gate's direction. | Product owner | **Low-Medium.** Same sitting as Q-8. |
| **Q-12** | Where were `cardContentSchema` / `privacyModeSchema` / `publicRoleSchema` meant to be enforced? | **Needs Engineering Decision** | **No** | **W4** (T-109b/c/d) | **Contested — see §2(c) 3.** §2.4 says wire-or-delete; task bodies say hold-at-pending. **Treat the task bodies as authoritative.** | Author intent | **Medium.** `02` §88 calls Q-12 "the cheapest answer in the set to obtain and should not wait for Wave 4." Meanwhile three schemas stay declared-but-unenforced — the exact state ADR-109 exists to end. |
| **Q-13** | Intended behavior of admin Quick Actions, Settings stub, `canChangeSettings`? | **Needs Product Decision** | **No** | **W5** (T-119c) | **Yes** — delete (behavior-neutral). | Product owner | **Low.** Same sitting. Deletion is behaviour-neutral today. |
| **Q-14** | Is Firebase AI Logic operational; is App Check actually enforced? | **Needs Security Decision** | **No** | **None** — refines AD-07/R-11 residual severity only | **Yes** — AD-17 proceeds on structural test floors. | Product owner + GCP | **Low for the schedule; open-ended for the risk picture.** An unenforced App Check leaves the cookie/XSS residual unsized. Blocks nothing; **resolves nothing either.** |
| **Q-15** | Is Google Translate TTS an accepted operating risk; production failure rate? | **Needs Product Decision** | **No** | **None** — informational | **Yes** — tiered-fallback boundary preserved regardless. | Author + data | **None.** Purely informational. |
| **Q-16** | Is the runtime KanjiVG fetch from GitHub `master` a permanent design? | **Needs Engineering Decision** | **No** | **None** — informational | **Yes** — the fetch stands. | Author | **None for the schedule.** ⚠ Worth noting: an unpinned moving-branch fetch at runtime is a **supply-chain exposure** the register treats as informational. No task touches it. |
| **Q-17** | Is Storybook adoption active; are scaffold artifacts deliberate? | **Needs Engineering Decision** | **No** | **W5** (T-119e) | **Yes** — delete. `07`: answerability rated **Low**; "nobody decided" is a live answer that resolves to the default. | Author | **Low.** The one question whose *unanswerability* is itself a documented resolution path. |
| **NQ-7** ⚠ | Is anonymous leaderboard readability (uid + displayName) intended? | **Needs Security Decision** | **No** | **None — and no task addresses it** | **No decision.** World-readable rule stands; **R-3 remains an open risk.** | Product owner | **⚠ Indefinite, and it never surfaces again.** `07-Risk-and-Mitigation.md` §5: "**No task in this plan touches** any of them, so executing this plan in full leaves all three exactly where they are." A live PII exposure with no owner, no task, and no forcing function. |
| **NQ-8** ⚠ | Is world-readable card-image Storage accepted? | **Needs Security Decision** | **No** | **None — and no task addresses it** | **No decision.** Public-read Storage stands; **R-18 remains open.** | Product owner | **⚠ Indefinite.** Same as NQ-7. |
| **NQ-10** | Is the client-gated, no-SSR rendering model a deliberate permanent choice? | **Needs Engineering Decision** | **No** | **None** | **Yes** — the client-splash model stands; future work must not assume SSR semantics. | Author + measurement | **Low.** Couples to a future rendering decision no ADR yet contemplates. |

### 3.4 Group D — in-repo audit / local measurement (5)

**These need no production access and no external person.** They are the only open items the team can clear entirely on its own — and **none is in the task set** (`07-Risk-and-Mitigation.md` §5).

| ID | Question | Classification | Blocks S1? | Blocks wave | Default? | Owner class | Answer-latency risk |
|---|---|---|:--:|---|---|---|---|
| **Q-3** | Is a Remote Config server template published; live values of `maintenance_mode` / `locale_switch_enabled`? | **Needs Infrastructure Decision** † | **No** | **None** — informational | **Yes** — in-repo `DEFAULT_FLAGS` (locale switch hidden) stands. | GCP console | **Low for the schedule.** ⚠ But see `05-Risk-Register.md` §2.4: this is the **only question touching the repo's flag system**, and the plan never uses that system for migration safety. |
| **NQ-11** | Which multi-document writes carry read-modify-write invariants? | **Needs Engineering Decision** | **No** | **None** | **No decision** — R-7 is an *inferred* gap; the audit decides whether it graduates to a defect list. | In-repo audit (self) | **Indefinite.** No task, no owner, no trigger. Clearable in-house at any time. |
| **NQ-12** | Do all persisted-content paths pass sanitization before the two `dangerouslySetInnerHTML` sinks? | **Needs Security Decision** | **No** | **None** — refines AD-07's XSS residual | **Yes** — AD-07's httpOnly target reduces token-theft impact regardless. | In-repo trace (self) | **Indefinite.** ⚠ A **security** audit with no task and no owner, resolvable in-house. The cheapest unclaimed risk reduction in the corpus. |
| **NQ-13** | What is the actual page-level accessibility state? | **Needs Engineering Decision** | **No** | **None** | **No decision** — remediation scope waits; the one verified gap (`SharePrivacyPicker`) stands recorded. | In-repo audit (self) | **Indefinite.** No task. |
| **NQ-14** | What are the runtime magnitudes (listeners, reads, bundle)? | **Needs Engineering Decision** | **No** | **None** — informational to AD-13/AD-14 prioritization | **Yes** — structural decisions proceed on shape alone. | Local profiling (self) | **Low for the schedule; material for reporting.** `07-Risk-and-Mitigation.md` §5: without it "the plan… **cannot demonstrate improvement** on R-1, R-2 or R-10 beyond the structural change." |

### 3.5 Group E — minor intent gaps (7)

`07` §Group E, carried verbatim from `architecture-assessment/12` Part C. **Every decision path is open regardless of the answer; no default and no gate.**

| ID | Gap | Classification | Blocks S1? | Blocks wave | Default? | Owner | Latency risk |
|---|---|---|:--:|:--:|---|---|---|
| m-1 | Why the June barrel-removal commit (`c474f64`) was reversed by July re-accretion | Resolved ‡ | No | None | n/a | — | ⚠ **Not purely informational** — this is CX-4, the precedent behind **PF-8** (confirm CS-7 barrel scope before lint-enforcing it). Materially conditions S2/S4/S27. |
| m-2 | Skeleton non-consolidation (19 hand-rolled `animate-pulse`) | Resolved ‡ | No | None | n/a | — | None |
| m-3 | Per-game state idioms (Zustand vs class machine vs hook state) | Resolved ‡ | No | None | n/a | — | None |
| m-4 | Module caches' exemption from ADR-002 | Resolved ‡ | No | None | n/a | — | None |
| m-5 | Tab-filter mechanism split (URL-param vs local state) | Resolved ‡ | No | None | n/a | — | None |
| m-6 | `artifacts/{APP_ID}` layout origin | Resolved ‡ | No | None | n/a | — | None — layout is irreversible either way |
| m-7 | Motion vs audio enforcement asymmetry | Resolved ‡ | No | None | n/a | — | None |

**‡ Vocabulary caveat.** These are not *resolved* — they are **recorded with no decision pending**. The fixed six-class vocabulary has no such class, and forcing them into a "Needs X Decision" bucket would manufacture work no artifact requires. `Resolved` is assigned as the nearest fit; the honest label is "archaeology, closed." **Flagged as a gap in the classification vocabulary itself.**

**⚠ m-1 is misfiled.** It is listed as "blocking nothing," but `08` PF-8 makes it a pre-flight item conditioning three sprints: *"the policy 'partially reverses a demonstrated preference' (CX-4)… so the owner should confirm the reduction scope **before** lint-enforcing it."* A Group-E item with a pre-flight dependency is not blocking nothing.

### 3.6 Closed by decision (5) — one contested

| ID | Question | Classification | Contested? |
|---|---|---|---|
| NQ-2 | Proxy-vs-AuthGate public-allowlist divergence intended? | **Resolved** (AD-18 — divergence is a defect) | ⚠ **Partially.** Resolved on *whether* to unify; **silent on what the canonical set is.** That residue is item **U-1** in §1.2. |
| **NQ-3** | `Drawer`: pending adoption or removable? | **Resolved** (AD-10 — default = delete) | ⚠ **Yes.** `07` §0 lists it closed; the planning kernel marks T-110b `[GATED NQ-3]`. `01` §5.3 confirms it is "the lone inconsistency among the five resolved-by-decision questions" — NQ-2/4/5/9 are all treated as ungated. **Verified: known issue 7 is real.** Practically harmless — T-110b is Ready-on-default and cannot stall; an unanswered veto window simply expires. **A one-line owner confirmation flips S28 to READY** (`08` §3). |
| NQ-4 | Why is Reports outside the shared table engine? | **Resolved** (AD-11 — converge) | No — flagged in `07` §0 as "the one soft tension between corpus and kernel," reconciled by an owner-veto note. |
| NQ-5 | Is kana-survival's route-side placement considered? | **Resolved** (AD-05 — relocate) | No |
| NQ-9 | Should write families B and C converge transports? | **Resolved** (AD-06 — converge) | No |

---

## 4. Cross-document contradictions found

Named rather than averaged, per the review mandate.

| # | Claim A | Claim B | Adjudication |
|---|---|---|---|
| 1 | `08` §2: **S2 READY, blockers "—"**; §3: S1–S8 have "zero external dependencies" | `10` §4.2 / §3.5(4): T-118b is "quietly dependent on Q-1"; recommended default is to **hold it out of R1** | **`10` authoritative.** It reasons from the failure mode and names the check. S2 is **READY WITH ASSUMPTIONS** or 5 days, not 8. |
| 2 | `01` §2.4: Q-12 default = "wire into the write path… else delete. No schema stays declared-but-unenforced" | `01` T-109b/c/d bodies: "**Do not guess.** Hold at documented 'pending disposition'" | **Task bodies authoritative.** Same document, opposite instructions. **Not previously flagged.** |
| 3 | `09` §282: 12 executable / 4 inaction | This review: 6 E · 2 R · 3 P · 1 C · 4 I | **The 4-inaction figure is correct and verbatim-verified. The 12 is generous** — see §2(c). |
| 4 | `08` §5: all ten PF items are "conditions on starting" Sprint 1 | `08` §2: S1 verdict **READY**; §3: runway needs no answers | **§2/§3 authoritative.** Only PF-4, PF-5, PF-9 genuinely gate Sprint 1. |
| 5 | `07` §0: NQ-3 **closed** by decision | Kernel + `01`/`08`/`09`: T-110b `[GATED NQ-3]` | **`07` authoritative on the decision; the kernel authoritative on the task status.** Both hold — it is a veto window, not a blocker. Known issue 7 **verified**. |
| 6 | `07-Risk-and-Mitigation.md` §318 and `08` PF-9: "**there is no CI/CD pipeline**" | `.github/workflows/ci.yml` exists and runs all five suites plus a `deploy-functions` job | **CONTRADICTED.** See §5. |

---

## 5. Out-of-corpus verification: the "no CI/CD" claim is false

**Method note.** The kernel forbids rescanning the repository. I made **one** targeted check outside the document corpus, because two planning documents rest a pre-flight item on a claim about repository state that is cheap to falsify and material to both this file and `05-Risk-Register.md`. Labelled explicitly as out-of-corpus evidence.

**The claim:**
- `implementation-planning/07-Risk-and-Mitigation.md` §318 — *"there is **no CI/CD pipeline** and no deployment history to roll back to (R-13)."*
- `implementation-planning/08-Implementation-Readiness.md` PF-9 — *"There is **no CI/CD pipeline** and no deployment history (R-13)."*

**The evidence:** `/Users/yuh.nguyenpham/GitHub/japanese/.github/workflows/ci.yml` exists. It runs on `pull_request` and `push` to `main` and defines **five jobs**:

| Job | Contents | Blocking? |
|---|---|---|
| `build-lint-test` | npm ci · **lint** · `next build` (incl. typecheck) · unit tests | Build/test blocking; **lint is `continue-on-error: true`** |
| `emulator-rules-tests` | JDK 21 + `npm run test:emu` (Firestore/Auth rules) | Blocking |
| `functions-tests` | `src/functions` build + lint + emulator tests | Blocking |
| `e2e-tests` | Playwright E2E + Vitest Browser Mode, Chromium | Blocking; uploads report, `retention-days: 14` |
| `deploy-functions` | `firebase-tools deploy --only functions`, on push to `main`, **skips cleanly while `vars.FIREBASE_PROJECT_ID` is unset** | CD path, currently dormant |

**What this changes:**

1. **The claim is wrong as stated.** All five test suites the plan depends on already run automatically on every PR. R-13 in `architecture-assessment/08-Risk-Assessment.md` §163 is *"No hosting or deployment decision recorded"* — the planning documents **widened it into "no CI/CD pipeline," which the source never says.** An inherited overstatement, not a source error.
2. **PF-9's advice survives; its rationale does not.** Tagging sprint boundaries as revert units is still correct. But it is not true that the deployable-per-sprint rule is "the plan's **only** rollback mechanism."
3. **Q-1 has a pre-built answer slot.** `deploy-functions` is gated on `vars.FIREBASE_PROJECT_ID` and `secrets.FIREBASE_SERVICE_ACCOUNT`. The functions half of `10` §5.2's two-package deploy topology is **already automated and waiting on exactly the fact Q-1 supplies.** This materially lowers PF-2's cost and is unmentioned anywhere in the plan.
4. **X-10 gains harder evidence — and a complication the plan misses.** X-10 predicts that flipping lint to `error` creates a blocking backlog. The CI file already carries an in-file comment: *"the repo has pre-existing lint errors… Do not flip this to blocking… until that backlog is paid down."* **So Wave 1's lint-to-`error` tasks (T-101c, T-103b, T-102c) interact with a CI setting no planning document mentions**, and **PF-5's "pre-commit gate green at HEAD" is not equivalent to "CI green at HEAD"** — CI lint is currently red-but-tolerated by design.

**Not falsified:** "no deployment history." The deploy job skips while the project variable is unset, so it is plausible nothing has ever deployed. That half of the claim stands unverified rather than refuted.

---

## 6. Verified / Unverifiable / Contradicted

**Verified from the documents**
- Q-4 has no row in any of `07`'s five group tables (§2a).
- Q-1…Q-17 is complete except Q-4; all fourteen NQ-n are present (§2a).
- Group sums: A 12 · B 6 · C 2 · D 5 · E 7 = 32 (§2b).
- The 4 inaction-fallback tasks are exactly T-115c, T-108b, T-108c, T-108d (§2c).
- NQ-3 is closed in `07` §0 and gated in the kernel — known issue 7 confirmed (§3.6).
- No enumerated question blocks Sprint 1 (§1.1).
- Three risks (R-3/NQ-7, R-18/NQ-8, R-7/NQ-11) have no addressing task and survive the program (§3.3, §3.4) — **coverage gaps recorded, not silently dropped** (known issue 10 confirmed).
- The critical path terminates in T-108d, gated on Q-5 (§3.2) — known issue 3 confirmed.

**Unverifiable from the documents**
- Whether the **18** in `07`'s roll-up parenthetical was ever derivable. It reconstructs to 15–17 under every reading. **Unverifiable ≠ false, but it should be dropped rather than corrected.**
- Whether Q-4's row was drafted and lost (the header-26 hypothesis, §2b) or the header was simply miscounted. The arithmetic favours the former; nothing in the documents settles it.
- Whether the sole developer is in fact the product owner. `07-Risk-and-Mitigation.md` §51/§99 says "plausibly" and "the same person who must answer the `[INTENT]` gates" — **asserted, never recorded as a fact.** The entire `[INTENT]` cluster's latency estimate rests on it.
- Whether any deployment has ever occurred (§5).

**Contradicted**
- "12 executable fallbacks" — overstated by 4 (§2c).
- `08`'s S2-blockers-`—` versus `10` §4.2 (§4 #1).
- `01` §2.4 versus `01`'s T-109b/c/d bodies on Q-12's default (§4 #2).
- `08` §5's "conditions on starting" framing versus `08` §2/§3 (§4 #4).
- "There is no CI/CD pipeline" (§5).

---

## 7. Verdict for the GO decision

**Sprint 1 is genuinely startable.** No enumerated open question blocks it. Its three real entry conditions (PF-4, PF-5, PF-9) are in-house engineering acts. The two unregistered items (U-1, U-2) condition its exit, not its start, and both are self-dischargeable.

**Three corrections should land before or during Sprint 1, all of them cheap:**
1. **Add Q-4's row to `architecture-decision/07-Open-Questions.md` Group B, drop the unreconstructible "18," and restate the counts as 26 substantive + 7 minor** (PF-3). Restoring the row also makes the existing header correct.
2. **Reclassify S2 as READY WITH ASSUMPTIONS** — or adopt `10` §4.2's recommended default and hold T-118b out of R1. The current blocker-free cell is the plan's one materially optimistic readiness verdict.
3. **Resolve `01`'s internal contradiction on Q-12's default** in favour of the task bodies.

**The honest shape of the question set:** 33 open items; **5 of them cannot be worked at all** without an external answer; **6 can be fully discharged on their defaults**; and **the two most consequential (Q-2, then Q-1) are a single decision and its immediate consequence.** Making the hosting decision is the highest-leverage act available to this program, and the plan explicitly cannot perform it from inside itself.
