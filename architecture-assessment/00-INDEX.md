# Architecture Assessment — Index

> ## ⚠ HISTORICAL — sealed snapshot, do not read as current state
>
> **Assessed at `a0bbbc4` (2026-07-19). HEAD is now 82+ commits later.** The 63-task
> modernization program this assessment produced has since **executed**, followed by a
> structural cleanup program that moved or deleted many of the files cited here.
>
> **Roughly half the W / TD / OP findings are now closed.** Verified closed: the
> `flashcard ↔ notifications` cycle (W-1), the `lib`→`features` type inversion (W-2), the
> barrel/boundary gap (W-3 — all 9 features now have barrels, `import/no-restricted-paths`
> is at `error`), kana-survival's split placement (W-5), the dead `Drawer` and Storybook
> (W-21), the admin Quick Actions / Settings stubs (W-10), the notification type-vocabulary
> drift (W-7), the unbounded public-lesson listener (R-2), and the missing `.env.example`.
> **Still true and still unaddressed:** W-6 (bus factor), W-11 (`analytics_daily` has no
> writer), W-13, W-14, W-15 (edge gate is presence-only), W-19 (uncontracted external
> endpoints), R-3 / R-18 (world-readable leaderboard PII and card images), TD-3, TD-8, TD-14.
>
> **Do not navigate by the file paths in this corpus** — a large fraction point at moved or
> deleted files. For current state read **[`project-memory/00-INDEX.md`](../project-memory/00-INDEX.md)**;
> for live migration state read **[`docs/migrations-ledger.md`](../docs/migrations-ledger.md)**.
>
> Kept unedited because the ADR-101…120 series is only legible against the findings that
> produced it. Its most durable files are **02** (strengths — still the best onboarding
> read), **04** (root-cause chains, true even where symptoms are fixed), and **10 §5**
> (14 adjudicated defects in this corpus's own numbers — read before quoting any figure).

Assessment of the repository at HEAD `a0bbbc4` (branch `main`, 2026-07-19), built on the `project-discovery/` corpus with every load-bearing claim re-verified against the repository (the repository always wins on conflict; ten discovery-level count discrepancies were corrected here). The assessment evaluates and explains only — no libraries, implementations, refactors, or tasks are proposed anywhere in it. Every finding carries Observation / Evidence / Interpretation / Confidence and a stable ID.

**Finding families:** S (strengths) · W (weaknesses) · RC (root causes) · CX (complexity sources) · PC (pattern consistency) · TD (technical debt) · R (risks) · OP (opportunities) — 144 findings total, cross-mapped in file 11 and classified for decision-readiness in file 10.

| # | Document | Contents |
|---|----------|----------|
| 01 | [Executive Summary](01-Executive-Summary.md) | Overall verdict, headline strengths and cost clusters, the "unrecorded completion state" meta-finding, readiness snapshot, confidence statement |
| 02 | [Architecture Strengths](02-Architecture-Strengths.md) | S-1–S-21 across all 20 evaluation dimensions; code ownership explicitly claims no strength; insufficient-evidence areas listed |
| 03 | [Architecture Weaknesses](03-Architecture-Weaknesses.md) | W-1–W-22: cycles, unenforced boundaries, mega-feature, vocabulary drift, unenforced schemas, fabricated zeros, config drift (unequal allowlists), inverted coverage, a11y sample |
| 04 | [Root Cause Analysis](04-Root-Cause-Analysis.md) | RC-1–RC-12 with Symptom→Root-Cause chains and git-dated evidence; cross-cutting meta-cause: staged work with no recorded completion state |
| 05 | [Complexity Analysis](05-Complexity-Analysis.md) | CX-1–CX-12 by cause category; closing taxonomy of deliberate vs historical-strata vs drift complexity |
| 06 | [Pattern Consistency](06-Pattern-Consistency.md) | PC-1–PC-18 scorecard: 3 consistent / 12 mostly-consistent / 3 divergent, with git-dated explanations of why each variant exists |
| 07 | [Technical Debt](07-Technical-Debt.md) | TD-1–TD-16 across 8 categories, ranked by an explicit impact+urgency+cost-of-delay rubric; production-unknowns segregated, not ranked |
| 08 | [Risk Assessment](08-Risk-Assessment.md) | R-1–R-19 with likelihood × impact × horizon; ranked matrix topped by knowledge concentration, listener fan-out, and the auth-gate posture |
| 09 | [Improvement Opportunities](09-Improvement-Opportunities.md) | OP-1–OP-24 described without prescription; 11 framed as conditional on unanswered intent questions |
| 10 | [Decision Readiness](10-Decision-Readiness.md) | All 144 findings bucketed: 85 strongly supported / 49 need investigation / 10 interpretations; 8 decision areas ready, 10 blocked |
| 11 | [Evidence Matrix](11-Evidence-Matrix.md) | Master ID→evidence→verification→confidence table; 16 cross-family clusters; 10 inter-file discrepancies adjudicated against the repo |
| 12 | [Questions Requiring Validation](12-Questions-Requiring-Validation.md) | 17 inherited discovery questions (referenced, extended) + 14 new assessment-raised questions (NQ-1–NQ-14) + 7 minor non-blocking intent gaps |
