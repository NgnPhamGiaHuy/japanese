# 07 — Go / No-Go Decision

## Verdict: **GO WITH CONDITIONS**

Implementation may begin. **Sprint 0 (a sitting, not a sprint) then Sprint 1 are approved.** Seven conditions attach, three of which must be discharged before specific later waves rather than before Sprint 1.

This verdict rests on four independent adversarial reviews that were briefed to falsify the plan rather than confirm it. They found **no defect that blocks Sprint 1's start** — and several that would have caused real damage later had implementation proceeded on the artifacts as written. Two of those are serious enough to name in the verdict itself.

## Why GO

- **Sprint 1 is clean at the start line.** Its four tasks (the migration ledger, its backfill, the ADR-index fix, and the allowlist unification) have an empty dependency graph, no gated task, no credential requirement, and no non-reverting change class. All four reviewers independently reached this conclusion.
- **The work is real and load-bearing.** Sprint 1 establishes the ledger that ADR-120 makes the program's highest-leverage decision, and repairs a live defect (the two route allowlists that already silently diverged).
- **55 of 63 tasks are startable** (36 READY, 19 READY WITH ASSUMPTIONS) — higher than the artifacts claimed, because ten gated tasks have fallbacks that are genuinely completing actions.
- **The verification infrastructure is better than documented.** CI runs five jobs including emulator-rules, functions, and E2E tiers — not three, and not "no CI/CD pipeline" as two planning documents assert. Discovery under-counted because it stopped reading the workflow file at line 102.

## Why CONDITIONS, not unconditional GO

Two findings are structural rather than cosmetic. Neither blocks Sprint 1; both would have compromised the program's central commitment if discovered later.

**1. The boundary-enforcement strategy currently rests on a gate that does not block.** CI lint runs with `continue-on-error: true`, and **not one of the 63 tasks flips it**. From Sprint 4 the program converts import-boundary rules to `error` and treats that as enforcement for ADR-101/102/103 — the "boundaries are enforced, not documented" commitment that is the plan's first wave and its first principle. Those rules would fail into a non-blocking job. The corpus never caught this because it cites the non-blocking lint *approvingly*, as an honest CI design. **This is the single most important finding of the review**: without it, Wave 1 ships the appearance of enforcement.

**2. Sprint 1's stated acceptance evidence does not exist.** Three documents name an "E2E public/protected route pass" as the acceptance evidence for Sprint 1's only behavioral change. Only two E2E specs exist at HEAD; the task that builds the route matrix is Sprint 11 — and is itself downstream of Sprint 1's allowlist task. Sprint 1 would merge against a test that cannot be run.

## Conditions

| # | Condition | Before | Why |
|---|---|---|---|
| **C-1** | Run **Sprint 0** — the 7 pre-flight items: JDK/emulator toolchain check, baseline SHA capture, CI-record correction, name human owners, assign gate owners **including Q-4**, settle Sprint 1's acceptance evidence, confirm ledger scope. A sitting, not a sprint; no engineering. | Sprint 1 | Three of these are preconditions of Sprint 1 task acceptance, not hygiene |
| **C-2** | Restate Sprint 1's acceptance evidence as something that exists at HEAD (merge-visible + the CI tiers that actually run). Do not schedule the route-matrix E2E into Sprint 1. | Sprint 1 opens | Finding F-2 |
| **C-3** | **Hold `T-118b` (APP_ID unification) out of Wave 1.** Reclassify BLOCKED. Wave 1 exits at 13 of 14 tasks and cannot claim ADR-118's second success criterion. | Sprint 2 | The "split the task" reconciliation contradicts the task's own acceptance criterion; production values are unobtainable within the plan |
| **C-4** | Correct the two documents that describe **`T-117d` (rules-suite coverage) as droppable float**. Seven tasks name it a prerequisite or verification oracle. | Sprint 5 planning | It is the oracle for an access-control convergence — the one area with a discovered live bug |
| **C-5** | **Flip CI lint to blocking** (or explicitly accept that boundary rules are advisory and record that as an ADR amendment). | Sprint 4 — the first lint flip | Finding G-1 |
| **C-6** | Decide the **feature-flag posture** for the auth cutover and the **disaster-recovery/backup position** for the four irreversible data operations. | Wave 3 | Both are absent from all 11 planning files; the repo ships an ADR-backed kill switch the plan never uses, and `T-107a`'s rollback note says the cutover "should" ship behind a switch — in a non-binding field, absent from its acceptance criteria |
| **C-7** | Adjudicate the **ADR-106 / ADR-115 collision**: which permission vocabulary a deck-sharing server action declares. | Wave 4 | ADR-106 requires per-action permission metadata at compile time; ADR-115 forbids merging the RBAC domains; nothing specifies the answer |

## Approved scope

**Sprint 0** — the seven pre-flight items above. Discharge in one working session.

**Sprint 1 — APPROVED** (8 task-days, 5 PRs):

| Task | What it delivers |
|---|---|
| **T-120a** | Create the in-repo migration ledger — format, location, required fields (intended end state / current stage / owner / review-by) |
| **T-120b** | Backfill ledger rows for all in-flight staged work, including every gated disposition |
| **T-120c** | Fix the docs ADR index (ADR-003 omitted) and record the ADR process note |
| **T-118a** | Single module owns the public-path allowlist; the proxy and the auth gate both consume it — repairing the divergence that already exists |

Sprint 1's outcome should be stated as **merge-visible** (one allowlist module with two consumers; a ledger with a row per in-flight migration), verified by the CI tiers that actually run — not by the non-existent route-matrix E2E.

**Sprints 3–8 — conditionally approved** on C-1/C-2 and the standing conditions. **Sprint 2 — approved at reduced scope** (`T-118b` held out per C-3).

**Not approved for start:** Waves 3–6, pending their wave-entry conditions (C-5, C-6, C-7) and their gate answers.

## Corrections the artifacts require

These do not block the GO but leave the document set wrong on disk:

- **`Q-4` has no row** in the open-questions register — one dropped row, not systemic. The true count is **33** (26 substantive including Q-4, plus 7 minor). The register's fourth figure, "18 blocking," is **not reconstructible under any reading** and should be deleted rather than corrected.
- **The gated-task split is not 12/4.** Reviewers independently produced 10/6 and 6+2+3+1/4. The four-inaction figure is verbatim-correct; the executable side is over-generous — two tasks are titled "activate telemetry" with "don't activate" as their fallback, and three schema tasks are contradicted *inside a single document* ("wire or delete" in a table vs. "do not guess" in the task bodies).
- **"There is no CI/CD pipeline"** appears in two planning documents and is false.
- **The "zero external dependencies" runway claim fails at Sprint 2** (three reviewers converged on this independently). It holds for Sprint 1 and Sprints 3–8.
- **`T-114d`'s fallback is stated in opposite directions** in two documents (delete the read paths vs. do not delete).
- **No artifact establishes who is assignable as an owner.** The assumption that the sole developer is also the product owner appears once, hedged, inside a risk-likelihood paragraph. If false, the ledger backfill cannot pass its own acceptance criteria.

## What this verdict does not certify

- **Nothing about production.** The production project identity is unknown and the hosting decision is open, so no change in this program can be verified against the real environment until that is resolved. The plan cannot unblock itself here — it is escalated, by construction, outside the plan.
- **Nothing about the program's completion.** The critical path terminates in a gated task; Sprints 1–22 can execute flawlessly and the path still ends one node short, leaving the corpus's top-ranked debt alive.
- **Monitoring adequacy.** The only monitoring work sits in Wave 2 behind an unanswered gate, while two Wave-4 release units name "monitored" as their mitigation.

## Review integrity note

Every artifact reviewed here was produced earlier in the same session by sibling agents working from a coordinator-written kernel — a shared origin and therefore a shared blind spot. The four reviewers were briefed adversarially: falsify rather than confirm, and delete any "Pass" that lacks a citation. They broke three coordinator-supplied premises (the 12/4 gated split, the three-job CI record, the T-118b reconciliation), found two defects no prior phase had seen (the non-blocking lint gate, the non-existent Sprint 1 acceptance evidence), and cleared two suspicions as genuinely resolved (the vocabulary-check staging, the task-count residue). One reviewer read a single repository file outside the no-rescan rule because the fact was load-bearing for Sprint 1, and disclosed it — the resulting correction favors the plan. The verdict is as adversarially tested as the document set permits.
