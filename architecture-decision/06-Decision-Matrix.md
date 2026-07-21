# 06 — Decision Matrix

**Phase 10 — Architecture Decision (traceability).** This document is the full audit trail for the twenty decisions fixed in the decision kernel (AD-01 … AD-20; ADR file numbering **ADR-101 … ADR-120**, mapping 1:1 to AD-01 … AD-20). It traces every decision back to the assessment corpus and forward-checks that the corpus's ranked debts, risks, opportunities, and evidence clusters are each accounted for. It decides nothing new; it evidences and cross-references the kernel.

- **Binding input:** `scratchpad/decision-kernel.md` (positions are fixed there; this file may not contradict them).
- **Sole corpus:** `project-discovery/` (Q-1…Q-17 in file 13) and `architecture-assessment/` (readiness file 10, evidence matrix file 11 clusters C1…C16, questions file 12 NQ-1…NQ-14). The two other named input directories (`architecture-audit/`, `requirements-consolidation/`) are absent from disk — recorded as an input-state note, not searched.
- **Finding-ID legend:** W = weakness, RC = root cause, CX = complexity, PC = pattern-consistency, TD = technical debt, R = risk, OP = opportunity, S = strength, C# = evidence cluster.
- **Gate legend:** Q-x / NQ-x = an open validation question the decision is conditional on; “—” = decision-ready, no external fact changes it.

---

## 1. Master traceability table

| AD / ADR | Decision (one line) | Status | Priority | Gate | Driving findings | Cluster | Corpus files |
|---|---|---|---|---|---|---|---|
| **AD-01** / ADR-101 | Feature public APIs are enforced (one root barrel per feature; deep cross-feature imports become lint violations) | Accepted | P1 | — | W-3, S-1 (+enables C3; TD-4) | C3 | assess/03, 02, 11; disc/08, 10 |
| **AD-02** / ADR-102 | Dependency direction is one-way flashcard → notifications; notifications becomes feature-agnostic via a registry/injection seam | Accepted | P1 | — | W-1, RC-1, TD-4 | C3 | assess/03, 04, 07, 11; disc/08 |
| **AD-03** / ADR-103 | `lib` never imports `features`; the type-only back-edge is relocated to its owning layer; composition root stays the sole upward edge | Accepted | P2 | — | W-2, RC-12, S-1 | C3 | assess/03, 04, 11 |
| **AD-04** / ADR-104 | Flashcard remains ONE feature with enforced internal sub-module barrels; no top-level split | Accepted | P2 | — | W-4, CX-2, OP-18 (+R-4) | C15 | assess/03, 05, 09, 11; disc/11 |
| **AD-05** / ADR-105 | One placement rule: feature code in `features/<name>`; routes hold only orchestrators; kana-survival relocates to `features/kana/survival/` | Accepted | P2 | NQ-5 (resolved-by-decision; label only) | W-5, PC-15, CX-9, RC-8, TD-10, OP-17 | C4 | assess/03, 06, 05, 07, 09; disc/13 |
| **AD-06** / ADR-106 | Two write-path families, one action-client architecture; families B/C converge on a single verified-identity action client with per-action permission metadata | Accepted | P1 | NQ-9 (resolved-by-decision) | PC-5, CX-3, RC-11, W-12, OP-1 | C10 | assess/06, 05, 04, 03, 09; disc/13 |
| **AD-07** / ADR-107 | Auth end-state: an httpOnly, server-verified session credential; edge gate stays a routing-UX check, real verification server-side | Accepted | P1 | — (App Check D-2 / Q-14 refines residual; NQ-12 refines XSS residual) | W-15, R-11, TD-15, RC-4 | C7 | assess/03, 08, 07, 04, 11 |
| **AD-08** / ADR-108 | Stored notification vocabulary is authoritative; TS union widens to the 10 written values; dual paths/indexes/fields get a defined removal gate | **Accepted-conditional** | P1 | Q-5, Q-7, NQ-1 | W-7, RC-2, RC-3, TD-1, R-5, OP-4, OP-15 | C1, C2 | assess/03, 04, 07, 08, 09, 11; disc/13 |
| **AD-09** / ADR-109 | Validation lives at the write boundary; the three zero-consumer schemas are wired-in or deleted (per-schema); multi-field forms standardize on RHF + zodResolver | Accepted (per-schema disposition conditional) | P1 | Q-12 | W-9, TD-5, R-16, PC-1, PC-7, OP-11 | C5 | assess/03, 06, 07, 08, 09; disc/13 |
| **AD-10** / ADR-110 | One dialog pattern, two sanctioned tiers (shared primitives; bespoke `Dialog.Root` via DialogChrome); backdrop straggler converges; `Drawer` delete-unless-claimed | Accepted (Drawer branch conditional) | P2 | NQ-3 (resolved-by-decision; Drawer default = delete) | PC-3, OP-2, OP-12, W-21, TD-11 | C12 | assess/06, 09, 03, 07, 11 |
| **AD-11** / ADR-111 | One table engine (shared react-table); Reports converges onto it; engine lifts out of admin only on a third non-admin consumer (three-use rule) | Accepted | P2 | NQ-4 (resolved-by-decision) | PC-2, CX-12 | — (PC-2) | assess/06, 05; disc/13 |
| **AD-12** / ADR-112 | Two pagination mechanisms are codified as THE two (cursor-token for jumpable admin lists; grow-window resubscribe for realtime); no third may be added | Accepted | P3 | — | PC-11, OP-3 | — (PC-11) | assess/06, 09 |
| **AD-13** / ADR-113 | Four-tier state model (ADR-002) affirmed; per-entity realtime listeners centralize into single shared subscriptions | Accepted | P1 (listener) / P3 (affirmation) | — (magnitude informational: NQ-14) | S-14, R-1, PC-16 | (R-1 → C-scale) | assess/02, 08, 06; disc/07, 09 |
| **AD-14** / ADR-114 | Data-layer guardrails: every listener carries an explicit bound; dashboards render absent data as absent; never-written analytics read paths removed or a real writer defined | Accepted (analytics branch conditional) | P1 | Q-9 (analytics); NQ-6 (public-listener scale) | R-2, W-11, TD-8, RC-5, OP-16, R-19 | C6 | assess/03, 04, 07, 08, 09, 11 |
| **AD-15** / ADR-115 | Two RBAC engines affirmed as two domains; the five inline deck-access re-derivations converge on the engine; vocabulary agreement becomes an automated check | Accepted | P1 (inline predicates) / P2 (automation) | — (deck-sharing); Q-10 (admin-authority alignment only) | OP-5, OP-6, OP-7, OP-19, OP-20, W-13, TD-9, RC-9 | C11 | assess/09, 03, 04, 06, 11 |
| **AD-16** / ADR-116 | Observability activates; the 17 swallow-sites adopt report-then-handle via the existing logging pipeline; boundaries surface, services report | Accepted-conditional (activation) / Accepted (policy) | P1 | Q-4 (activation) | W-17, R-6, OP-21, OP-22 | C13 | assess/03, 08, 09, 11 |
| **AD-17** / ADR-117 | Coverage follows risk; five-suite topology affirmed; floors set; highest-risk untested units (SRS math, sharing-RBAC resolver, flashcard data services) are the allocation priority | Accepted | P1 | — (Q-14 contextual for AI test scope) | S-10, W-16, TD-2, OP-23, OP-24 | C8 | assess/02, 03, 07, 09, 11 |
| **AD-18** / ADR-118 | Configuration is single-sourced (one allowlist module, one APP_ID derivation, `.env.example` for ~30 vars); hosting decision remains OPEN | Accepted; hosting Open | P1 | NQ-2 (allowlist resolved-by-decision); Q-2 (hosting Open); Q-1/Q-6 (env verification) | W-20, TD-14, TD-16, TD-13, R-13, R-14 | C14 | assess/03, 07, 08, 11; disc/13 |
| **AD-19** / ADR-119 | Dead surfaces default to deletion behind named gates (7 kinds, 8 actions, handler-less admin buttons, un-called fan-out, 1-story Storybook); kana-practice logging gap resolved by its gate | **Accepted-conditional** | P2 | Q-8, Q-11, Q-13, Q-6, Q-17 | W-8, W-10, TD-6, TD-7, TD-12, TD-11(via AD-10), RC-7, CX-7, OP-8/9/10/13/14 | C12 | assess/03, 07, 09, 05, 11; disc/13 |
| **AD-20** / ADR-120 | Every staged change records completion state (intended end state, current stage, owner, review-by) in an in-repo ledger; ADRs continue for decisions | Accepted | P1 (highest leverage) | — | RC-2/3/5/6/7/10 (cross-cutting), CX-7, W-21, TD-13 | C16 | assess/04, 05, 03, 07, 11 |

---

## 2. Reverse-trace (a) — ranked debts and top risks → addressing decision

### 2a. Technical debt (all 16, ranked; top-10 threshold marked)

| Rank | TD (score) | Addressed by | Coverage |
|---:|---|---|---|
| 1 | TD-1 Notification migration frozen (8) | **AD-08** | Addressed; resolution gated Q-5/Q-7/NQ-1 |
| 2 | TD-2 Coverage topology inverted (8) | **AD-17** | Addressed |
| 3 | TD-5 Authority-claiming schemas unconsumed (7) | **AD-09** | Addressed; per-schema disposition gated Q-12 |
| 4 | TD-8 Writer-less analytics + fabricated zeros (6) | **AD-14** | Addressed; writer-vs-delete gated Q-9 |
| 5 | TD-3 200-line ceiling warn-only, 44 files (6) | **— (no dedicated decision)** | **⚠ FLAG — see below** |
| 6 | TD-7 Live admin UI with no behavior (5) | **AD-19** | Addressed; delete-unless-claimed gated Q-13 |
| 7 | TD-14 Hosting decision unrecorded (5) | **AD-18** | Addressed *as an open item* — AD-18 leaves hosting Open (Q-2) by design |
| 8 | TD-9 Public-access predicate triplicated (5) | **AD-15** | Addressed |
| 9 | TD-4 Two import cycles, no cycle tooling (5) | **AD-01, AD-02, AD-03** | Addressed (boundaries enforced by lint) |
| 10 | TD-13 No README / `.env.example`; ADR index drift (5) | **AD-18, AD-20** | Addressed |
| — | TD-15 ID token in JS-readable cookie (4) | AD-07 | Addressed |
| — | TD-6 Dormant vocabularies incl. unlogged kana-practice (4) | AD-19 | Addressed; gated Q-8/Q-11 |
| — | TD-10 Survival split across layers (4) | AD-05 | Addressed |
| — | TD-12 Storybook toolchain for one story (4) | AD-19 | Addressed; gated Q-17 |
| — | TD-16 Dual APP_ID env vars (3) | AD-18 | Addressed |
| — | TD-11 `Drawer` zero render sites (3) | AD-10 | Addressed; delete-unless-claimed gated NQ-3 |

**⚠ FLAG — TD-3 (top-10 debt, rank 5) has NO dedicated decision.** The self-imposed 200-line ESLint ceiling being warn-only and exceeded by 44 files is *not* resolved by any of the twenty decisions. This is a **deliberate deferral, not an oversight**: CX-8 established the ceiling as a working "team-law" warn gate (intentionally non-blocking), and the mega-feature file-size question rolls up into AD-04 at the architecture level. Tightening the rule to `error` and clearing the 44 warnings is downstream cleanup, not an architecture decision — recorded here so it is not silently lost, and repeated in the coverage statement (§5).

### 2b. Risk (all 19, ranked; top-8 threshold marked)

| Rank | R | Addressed by | Coverage |
|---:|---|---|---|
| 1 | R-12 Single-author knowledge concentration | AD-20, AD-17, AD-18/TD-13 | **⚠ Mitigated only** — not architecturally resolvable (see below) |
| 2 | R-1 Progress fan-out + per-mount listener multiplication | **AD-13** | Addressed (structure); magnitude informational (NQ-14) |
| 3 | R-11 Non-httpOnly cookie + presence-only gate | **AD-07** | Addressed |
| 4 | R-6 Fire-and-forget swallowed writes | **AD-16** | Addressed; activation gated Q-4 |
| 5 | R-2 Unbounded public-lesson listener | **AD-14** | Addressed (bound required); scale gated NQ-6 |
| 6 | R-13 No hosting/deploy decision | **AD-18** | Addressed *as an open item* (Q-1/Q-2 by design) |
| 7 | R-8 Admin bootstrap out-of-band | AD-15 (partial) | **⚠ Gated, not resolved** — Q-10 (see below) |
| 8 | R-3 Leaderboard world-readable PII | **— (no decision)** | **⚠ FLAG — recorded open (NQ-7); see below** |
| — | R-4 Feature-size skew | AD-04 | Addressed (weight is judgment, bucket-3) |
| — | R-5 Migration-era machinery live | AD-08 | Addressed; gated Q-5/Q-7 |
| — | R-7 Transaction coverage gaps | — | In-repo audit NQ-11 (see 07); not a kernel decision |
| — | R-9 Emulator-vs-prod gap | AD-18/AD-08 context | Gated Q-1/Q-5 |
| — | R-10 Bundle + per-screen listener load | AD-13 (listener), AD-04 (bundle context) | Partial; magnitude NQ-14 |
| — | R-14 Split APP_ID deploy | AD-18 | Addressed |
| — | R-15 JDK/emulator test topology | AD-17 context | Affirmed (accepted cost) |
| — | R-16 Validation narrower than writes | AD-09 | Addressed; gated Q-12 |
| — | R-17 XSS surfaces | AD-07 (residual) | In-repo audit NQ-12 refines |
| — | R-18 World-readable card-image Storage | — | Recorded open (NQ-8); see below |
| — | R-19 Out-of-repo indexes/TTL | AD-14/AD-08 | Gated Q-1/Q-5/Q-9 |

**⚠ Top-8 risk coverage caveats (three items are not cleanly "resolved by a decision"):**

- **R-1 (rank 1) R-12 — single-author concentration** is an organizational/staffing risk that no architecture decision can eliminate. The decision set *mitigates* it: AD-20 (record intent/completion state so the code is legible to a second maintainer), AD-17 (tests as executable knowledge), AD-18/TD-13 (README + `.env.example` onboarding). Honest coverage = mitigation, not resolution.
- **R-8 (rank 7) — admin bootstrap out-of-band** is gated on **Q-10** (production fact: claims vs `admins/{uid}`). AD-15 converges the three divergent admin-authority predicates (OP-7) *only after Q-10 answers which source is live*; until then the bootstrap ritual is undecidable from documents.
- **R-3 (rank 8) — leaderboard world-readable PII** has **no addressing decision**. Whether anonymous uid↔displayName readability is intended product behavior is **NQ-7 (product intent)**. The kernel deliberately does not decide privacy-posture questions that require the product owner; recorded open in 07-Open-Questions. Same class: **R-18 → NQ-8** (world-readable card images).

**Net (a):** Top-10 debts — **9 of 10 addressed**, TD-3 deliberately deferred (flagged). Top-8 risks — **5 of 8 cleanly addressed** (R-1, R-11, R-6, R-2, R-13), R-12 mitigated-only, R-8 gated on Q-10, R-3 recorded open on NQ-7.

---

## 3. Reverse-trace (b) — every OP-1 … OP-24 → adopted / rejected / gated

| OP | Opportunity | Disposition | By decision | Gate |
|---|---|---|---|---|
| OP-1 | Three write families could be fewer | **Adopted** (converge B/C) | AD-06 | — |
| OP-2 | Two dialog mechanisms; bespoke backdrops | **Adopted** | AD-10 | — |
| OP-3 | Two pagination mechanisms | **Rejected-with-reason** (affirmed as THE two; channel-forced, no unification) | AD-12 | — |
| OP-4 | Type union vs stored values | **Adopted** (union widens) | AD-08 | Q-7, Q-5 |
| OP-5 | Inline deck-access re-derivations (one semantically divergent) | **Adopted** (converge on engine) | AD-15 | — |
| OP-6 | Two RBAC engines share pattern shape | **Rejected-with-reason** (affirmed as two domains; principled duplication, near-zero consolidatable surface) | AD-15 | — |
| OP-7 | Three divergent admin-authority predicates | **Adopted** (align) | AD-15 | Q-10 |
| OP-8 | 7 inactive `NotificationKind`s | **Gated** (delete-unless-claimed) | AD-19 | Q-8 |
| OP-9 | 8 never-emitted `ActivityAction`s + `cloud_function` source | **Gated** (delete-unless-claimed) | AD-19 | Q-11 |
| OP-10 | Inert admin surfaces | **Gated** (delete-unless-claimed) | AD-19 | Q-13 |
| OP-11 | Three unenforced schemas | **Adopted** (enforce-or-delete, per-schema) | AD-09 | Q-12 |
| OP-12 | `Drawer` zero render sites | **Gated** (delete-unless-claimed; default delete) | AD-10 | NQ-3 |
| OP-13 | Storybook toolchain vs one story | **Gated** (delete-unless-claimed) | AD-19 | Q-17 |
| OP-14 | `fanOutNotifications` zero callers | **Gated** (delete-unless-claimed) | AD-19 | Q-6 |
| OP-15 | Legacy notification compatibility machinery | **Adopted** (removal gate defined) | AD-08 | Q-5 |
| OP-16 | Reads on never-written collections | **Adopted** (remove read paths or define writer) | AD-14 | Q-9 |
| OP-17 | Kana-survival placement parity | **Adopted** | AD-05 | — |
| OP-18 | Flashcard internal size skew | **Adopted-partial** (internal sub-module barrels; no split) | AD-04 | — |
| OP-19 | Cross-artifact vocabulary agreements human-enforced | **Adopted** (automate check) | AD-15 (+AD-08 for the notification-type target) | Q-7 (notif target) |
| OP-20 | Rules-coverage agreement human-enforced | **Adopted** (automate) — feasibility caveat (bucket-3) | AD-15 (+AD-14, AD-17 rules suite) | — |
| OP-21 | Dormant credential-gated telemetry | **Adopted** (activate) | AD-16 | Q-4 |
| OP-22 | 17 swallow sites, no telemetry path | **Adopted** (report-then-handle) | AD-16 | — |
| OP-23 | Zero-coverage features; largest untested surfaces | **Adopted** | AD-17 | — |
| OP-24 | Rules-test covers a minority of the surface | **Adopted** | AD-17 | — |

**Net (b):** All 24 opportunities accounted for — **22 adopted (7 gated on validation), 2 rejected-with-reason** (OP-3 pagination unification, OP-6 RBAC consolidation — both principled-divergence / channel-forced). No opportunity is silently dropped.

---

## 4. Reverse-trace (c) — the 16 evidence clusters (C1 … C16) → decisions

| Cluster | Underlying fact | Decision(s) | Gate |
|---|---|---|---|
| C1 | Notification type/vocabulary drift (4-value union vs 10 stored) | AD-08 | Q-7, Q-5 |
| C2 | Migration-era dual machinery (fields/queries/indexes/backfill) | AD-08 | Q-5, NQ-1 |
| C3 | The cycle pair (flashcard↔notifications; admin↔lib/logging) | AD-01, AD-02, AD-03 | — (decision-ready) |
| C4 | Survival placement (UI route-side, logic feature-side) | AD-05 | NQ-5 (label; resolved) |
| C5 | Unenforced "source of truth" schemas | AD-09 | Q-12 |
| C6 | Analytics zeros (read-but-never-written collections) | AD-14 | Q-9 |
| C7 | Cookie/proxy auth gate (presence-only over JS-readable token) | AD-07 (mechanics) + AD-18 (allowlist) | — mechanics; NQ-2 allowlist (resolved); D-2/Q-14 refines |
| C8 | Coverage topology (well-tested leaves, untested core) | AD-17 | — (decision-ready) |
| C9 | Knowledge concentration (one author, out-of-band rituals, undoc env) | AD-20, AD-18/TD-13 (mitigation) | Q-10 (bootstrap), Q-1 (env) |
| C10 | Three write-path families | AD-06 | NQ-9 (resolved) |
| C11 | Shared-deck access predicate ×3 + inline re-derivations | AD-15 | — (decision-ready) |
| C12 | Dormant capability stratum | AD-19 + AD-10 (Drawer) | Q-6/Q-8/Q-11/Q-13/Q-17, NQ-3 |
| C13 | Swallowed errors / dark telemetry | AD-16 | Q-4 |
| C14 | Config-sync hazards (allowlists ×2, APP_ID ×2, SITE_URL, no `.env.example`) | AD-18 | NQ-2 (resolved), Q-2 (hosting Open) |
| C15 | Mega-feature concentration | AD-04 | — (facts ready; weight = judgment) |
| C16 | Meta-pattern: unrecorded completion state | AD-20 | — (highest-leverage decision) |

**Net (c):** All 16 clusters map to at least one decision. The five decision-ready clusters (C3, C4, C8, C11, C15 — per file 10 §Readiness) are addressed by decisions with no external gate; the validation-blocked mass (C1, C2, C5, C6, C12, C13) is addressed by **Accepted-conditional** decisions whose *direction* is fixed and whose *removal/execution* waits on a named gate. C16 — the corpus's own meta-finding — is the driver behind AD-20, the kernel's stated highest-leverage decision.

---

## 5. Coverage statement — what the decision set deliberately does NOT address, and why

The twenty decisions are complete for the architecture questions the repository can answer. Six areas are **intentionally left undecided**; each is recorded so the omission is auditable rather than accidental:

1. **Runtime-magnitude unknowns (NQ-14; R-1/R-2/R-10 severity).** The decisions set *structural* policy — AD-13 centralizes listeners, AD-14 bounds queries — but do not size the problem. No profiling, bundle analysis, or read-count telemetry exists in-repo; magnitude is deferred to measurement (07-Open-Questions, in-repo/measure class). Prioritization (P1 on AD-13's listener consolidation) rests on the *structural* bucket-1 facts, not on an unmeasured magnitude.

2. **The 200-line file-size ceiling (TD-3, top-10 debt).** No decision tightens the warn-only ESLint ceiling or clears its 44 over-ceiling files. This is deliberate: CX-8 shows the ceiling functioning as an intentional non-blocking "team-law" warn gate; the file-size question at the feature level is subsumed by AD-04 (flashcard stays one feature). Converting warn→error is cleanup, not architecture. **Flagged in §2a** so it is not mistaken for coverage.

3. **Single-author knowledge concentration (R-12, top risk).** Not architecturally resolvable — a staffing/organizational matter. The set *mitigates only* (AD-20 legibility, AD-17 executable knowledge, AD-18/TD-13 onboarding docs). No decision claims to fix bus-factor-of-one.

4. **Privacy-posture product questions.** Leaderboard uid↔displayName readability (R-3 / NQ-7), world-readable card-image Storage (R-18 / NQ-8), and the client-gated no-SSR rendering model (W-14 / NQ-10) are **product-owner intent** calls, not architecture decisions. They are recorded open, with defaults noted where one is in force, rather than decided by the kernel.

5. **Hosting / deployment (Q-1, Q-2, Q-6; R-13, TD-14).** Cannot be settled from documents. AD-18 fixes everything single-sourceable and **explicitly leaves hosting Open** — the one place a decision is named as deferred inside the accepted set.

6. **In-repo audits not yet run (NQ-11 transaction invariants / R-7; NQ-12 sanitization paths / R-17; NQ-13 a11y / W-22).** Resolvable *without* production access, but they are audit/measurement work whose *output* would feed a later decision — they are not themselves kernel decisions. Recorded open with a `[REPO]` answer-class so they are queued, not lost.

Additionally, seven **minor intent gaps (m-1 … m-7)** from file 12 Part C block no decision and are carried forward informationally in 07-Open-Questions.

**Bottom line.** Every C1…C16 cluster, all 24 opportunities, and 9 of 10 top debts map onto a decision. The gaps are honest and named: one deferred debt (TD-3), one unresolvable-by-architecture risk (R-12, mitigated), two privacy risks routed to product intent (R-3, R-18), and the standing hosting/measurement/audit deferrals — all of which live as tracked open questions in **07-Open-Questions.md**.
