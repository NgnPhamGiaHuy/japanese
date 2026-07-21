# 10 — Decision Readiness

**Phase 8 — Architecture Assessment (synthesis).** This document classifies every finding in the assessment corpus (02–09: S-1…S-21, W-1…W-22, RC-1…RC-12, CX-1…CX-12, PC-1…PC-18, TD-1…TD-16, R-1…R-19, OP-1…OP-24 — 144 finding IDs) by **what a decision-making phase can rely on**. It evaluates and classifies only; it proposes no remedies, libraries, refactors, or tasks.

- **Repo root:** `/Users/yuh.nguyenpham/GitHub/japanese`; Next.js project root `src/`. Verified against HEAD `a0bbbc4` (branch `main`) on 2026-07-19.
- **Method:** all eight wave-1 files were read in full; every claim that looked inconsistent between files was spot-re-verified directly in the repository before adjudication (results in §5 and in `11-Evidence-Matrix.md`). Observation and interpretation are separated throughout: bucket membership is this document's *interpretation*; the facts behind each ID live in the source file and are indexed in `11-Evidence-Matrix.md`.

## Bucket definitions

| Bucket | Definition | Decision posture |
|---|---|---|
| **1 — Strongly evidence-supported** | The finding's decision-relevant claim rests on verified `file:line` facts, exhaustive greps, or git history; nothing outside the repo changes its meaning. | Decisions can rely on it now. |
| **2 — Needs further investigation** | The finding is real (its factual core is verified), but its severity, meaning, or resolution branch depends on facts the repo cannot contain: production/deployment state, live data, runtime measurements, or product-owner intent. | A decision made now would be a guess on the gated dimension; the specific resolver is listed per ID and expanded in `12-Questions-Requiring-Validation.md`. |
| **3 — Assumptions / interpretations** | The finding's headline is an evaluative framing or an intent-reading that reasonable people could weigh differently, even with all facts on the table. The underlying measurements are usually bucket-1 grade. | Usable as input; should be weighed, not treated as fact. |

**Totals: 85 findings in bucket 1, 49 in bucket 2, 10 in bucket 3 (144).**

A finding sits in exactly one bucket, assigned by its *headline decision-relevant claim*; where a finding splits (verified core + gated branch, or verified core + evaluative frame), the split is noted inline.

---

## 1. Bucket 1 — Strongly evidence-supported (85)

### Strengths (20 of 21)

| ID | One-line justification |
|---|---|
| S-1 | Unidirectional layer imports proven by exhaustive greps at HEAD; the single exception read directly. |
| S-2 | Feature structure and thin-route pattern verified by directory listings and file reads. |
| S-3 | `server-only` (10 files) and `"use server"` (10 files) counts are exhaustive greps. |
| S-4 | Both safe-action clients read in full; zero route handlers verified by `find`. |
| S-5 | Full authorization pipeline (token verify → zod → server-derived recipient) read directly; rules mirror read. |
| S-6 | `firestore.rules` read directly, incl. immutable-field guard; emulator rules suite exists and runs in CI. |
| S-7 | `lib/firebase-admin.ts` lazy-Proxy design read in full; CI placeholder-env corroboration read. |
| S-8 | All four transaction sites and the collapse-ID module read directly with their rationale comments. |
| S-9 | Notifications `domain/` purity + colocated tests verified by listing and header reads. |
| S-10 | Five-suite architecture verified via the four configs + functions package. *Split:* the per-tier file counts in the source were wrong (see §5, adjudication 2 — actual 22 unit / 12 browser / 4 emu + 1 rules / 2 functions / 2 e2e); the structural claim is unaffected. |
| S-11 | `.github/workflows/ci.yml` read in full; job↔suite parity confirmed. |
| S-12 | Tiered error policy verified at every cited swallow/fail-open/typed-error site. |
| S-13 | Config modules and flag fallbacks read in full; ADR-003 exists. |
| S-14 | Store `partialize`, QueryClient defaults, key factory, ADR-002 all read directly. |
| S-15 | ESLint audio ban, ADR-001, audio README, and 6 test files verified directly. |
| S-16 | Primitive inventory, base-ui imports, schema tests, reorder utility all verified. |
| S-17 | 803/803 key parity computed independently by two agents with identical results; consumer count reconciled (151 `useTranslations` + 6 `getTranslations` = 157, re-verified here). |
| S-18 | Every cited performance mechanism read directly. *Scope note:* claims mechanisms only; runtime outcomes are explicitly not claimed (measurement gap noted in bucket 2's R-10). |
| S-20 | Pre-commit hook, conventional-commit history, ADRs, code→ADR cross-references all verified. |
| S-21 | Logging facade, spoof rejection (emu-tested), Sentry/PostHog gating verified. Production *activation* is Q-4 (bucket 2 territory), but the strength claims code, not deployment. |

### Weaknesses (14 of 22)

| ID | One-line justification |
|---|---|
| W-1 | Both cycle legs are direct import statements, re-verified by grep. |
| W-2 | `lib/logging/public.ts:1` type-import and both reverse edges verified. |
| W-3 | Barrel census (2/9), deep-import counts, and absence of boundary lint rules all grep-verified. |
| W-5 | Survival file placement verified by `find`; sibling contrast verified. (Intent question routed to bucket 2 via RC-8/NQ-5 — the cost claim stands regardless.) |
| W-6 | Git history is exhaustive evidence of single authorship. *Split:* the arithmetic in the source (133+7 = "138") is wrong — actual 140 across all refs, 138 on `main` (see §5, adjudication 1); single-author conclusion unaffected. |
| W-7 | Union (4 values) vs writers (10 distinct stored values) is a pure code fact, verified independent of production data. |
| W-13 | Three encodings of the shared-deck policy read directly; the rules-bypass property of the Admin-SDK path verified. |
| W-15 | Presence-only gate, non-httpOnly cookie, 7-day max-age, and all compensating server-side verifications read in full. |
| W-16 | Test inventory is exhaustive (re-verified here: 41 real test files — 39 app-side + 2 functions); zero-test claims checked per module. |
| W-17 | 59 `console.error` / 17 promise-swallows / 2 `enqueueClientLog` callers all grep-verified (swallow split re-verified here: 14 + 3). Production-Sentry residual is Q-4 but the visibility-gap claim holds in-repo. |
| W-18 | Per-keystroke query-key mechanism and grow-the-window resubscribe traced in code; absence of debounce grep-verified. |
| W-19 | All three uncontracted-endpoint call sites verified, incl. the `master`-branch KanjiVG pin. |
| W-20 | All four config-sync facts verified; the allowlist *inequality* re-verified here (proxy admits `/login`, sitemap, robots, OG-pattern; AuthGate only the deck landing page). Whether the divergence is intended is NQ-2, but the hand-sync weakness stands. |
| W-21 | 44-file over-ceiling recount, 1-story Storybook, 0-consumer `Drawer` (re-verified here — the only `<Drawer` hits are the primitive's own type annotation and doc-comment), stale ADR index all verified. |

### Root causes (6 of 12)

| ID | One-line justification |
|---|---|
| RC-1 | The causal mechanism (write-side inversion exists, render/act-side doesn't) is observable structure, and git shows both cycle halves landing in one commit (`ca8a654`). |
| RC-2 | Two-vocabulary migration dated by git; "no reconciliation commit since" verified; the unrecorded end-state is a verified *absence*. (The end-state itself is Q-7 — but the root-cause claim is complete in-repo.) |
| RC-4 | The structural argument (client-SDK refresh loop forbids httpOnly; Edge cannot cheaply verify) is verified in code and commit history. *Split:* "conscious trade-off, not oversight" is an intent-reading (bucket-3 flavored) — noted, not load-bearing. |
| RC-9 | The ADR-002 / SSR-epic collision and the three predicate copies are all read directly; the duplication is 2 days old and fully dated. |
| RC-11 | Three-era timeline is git-dated; the formalize-not-unify choice is documented in `lib/safe-action.ts`'s own docstring. |
| RC-12 | The type-only inversion and its April-vs-July ownership history verified directly. |

### Complexity (10 of 12)

| ID | One-line justification |
|---|---|
| CX-2 | Accretion narrative fully git-dated; measurements re-verified here (142 non-test files / 16,606 non-test lines; 146 / 16,940 incl. tests). The *harm* question is explicitly left open by the source — that judgment lives in bucket 3 as W-4. |
| CX-3 | Era boundaries and the compatibility-motivated preservation are documented in code and commits. |
| CX-4 | The 61-barrel count and the removal→re-adoption git arc are verified facts; "why the reversal" is a minor intent gap (File 12 addendum). |
| CX-5 | Both boundaries' intent, mechanism, and dates are first-party documented (ADR-001, in-code comments). |
| CX-6 | All five gating layers and their dates verified; the "which parts are redundant" reading is labeled interpretation in the source. |
| CX-8 | The size-ceiling convention is enforced in config with its own rationale comment; split commits dated. |
| CX-9 | Two placement conventions and the absence of any written tiebreaker are verified (absence of a rule is checkable). |
| CX-10 | Locale-routing costs are structural to the framework pattern and verified at every leakage site; flag-gating verified (live value is Q-3, noted). |
| CX-11 | Effect and irreversibility verified; the origin story is *labeled conjecture in the source* and treated as such here — the decision-relevant content (layout is load-bearing, dual env var) is bucket-1. |
| CX-12 | Pattern isolation measured (React Query, react-table, RBAC modules); growth wave git-dated. |

### Pattern consistency (18 of 18)

PC-1 through PC-18 all sit in bucket 1: every variant inventory was re-verified by grep/read at HEAD, verdicts follow directly from the inventories, and the file explicitly separates its intent-unknowns (which are routed to `12-Questions-Requiring-Validation.md` rather than weakening the verdicts). Caveats preserved from the source: PC-10, PC-12, PC-13 are medium-confidence on inventory *completeness* (grep cannot prove no further variant exists); PC-16's role-mapping ("stores hold data, contexts hold resources") is labeled interpretation; PC-18's "all strings extracted" is explicitly *not* claimed (only catalog parity is). None of these caveats gates a decision — they bound claim scope.

| IDs | One-line justification |
|---|---|
| PC-1…PC-18 | Every count in the scorecard re-verified by the source agent at HEAD; six discovery-count discrepancies were caught and corrected by that file itself (its §"Discrepancies"), which this synthesis spot-checked without finding errors. |

### Technical debt (7 of 16)

| ID | One-line justification |
|---|---|
| TD-2 | Coverage topology rests on an exhaustive test census (re-verified here) and per-module zero-test checks; explicitly claims existence/placement, not percentages. |
| TD-3 | 44-file recount re-verified here; warn-only status and stale config comment read directly. |
| TD-4 | Both cycles' every edge verified; tooling absence verified. |
| TD-9 | All three predicate copies read at cited lines; the unauthenticated Admin-SDK render path verified. |
| TD-10 | Placement facts verified (same core as W-5). |
| TD-13 | README absence, 30-env-var inventory, missing `.env.example`, ADR-index drift all verified. |
| TD-16 | Both env-var reads verified at cited lines; the fix needs no external fact (whether prod values *currently* agree is R-14/D-6, bucket 2). |

### Risks (3 of 19)

| ID | One-line justification |
|---|---|
| R-11 | Cookie/gate mechanics and every compensating control verified; the architecture decision this informs needs no missing fact. *Split:* the source's `cookie.ts:63-74` citation is impossible (file is 25 lines) — facts right, lines wrong (see §5, adjudication 9). App Check state (D-2) refines but does not gate. |
| R-12 | Authorship measured exhaustively from git; present-state, not projection. |
| R-15 | JDK/emulator test topology fully code/doc-evidenced; the source itself marks "what would lower uncertainty: n/a". |

### Opportunities (7 of 24)

| ID | One-line justification |
|---|---|
| OP-2 | Dialog-mechanism overlap and backdrop drift verified; no unknown gates the standardization question (Drawer branch aside — NQ-3). |
| OP-5 | The inline re-derivations *and one semantic divergence* (`shared.service.ts`'s `isOwner` via `roles[uid]` vs the engine's `ownerId ?? userId`) are verified code facts — this is the closest thing in the corpus to a discovered live bug. |
| OP-17 | Placement parity break directly observable; source lists no prerequisite unknowns. |
| OP-19 | The manual vocabulary agreements verifiably exist, are verifiably unchecked, and one has verifiably drifted. |
| OP-22 | All 17 swallow sites + ~20 bare catches + the four-boundary-only Sentry surface verified. |
| OP-23 | Zero-coverage module census exhaustive. |
| OP-24 | Covered/uncovered rules blocks read directly from the 415-line test file against the rules file. |

---

## 2. Bucket 2 — Needs further investigation (49)

Format: **ID — what is verified / what is gated — what would resolve it** (cross-refs: Q-# = `project-discovery/13`, NQ-# = `12-Questions-Requiring-Validation.md`).

### Strengths (1)

- **S-19 (a11y as testable contract)** — primitive-level contracts are proven in a real browser; the *page-level/systemic* posture is unproven (no axe/WCAG automation, 1 story). → Resolved by an actual accessibility audit (in-repo/browser work; no production access needed). [NQ-13]

### Weaknesses (5)

- **W-8 (dormant vocabularies)** — zero-producer status verified per member; whether each member is roadmap or abandoned decides delete-vs-complete. → Product-owner intent. [Q-8, Q-11]
- **W-9 (unenforced schemas)** — zero-consumer state verified; unfinished-adoption vs overtaken-artifact decides opposite treatments of the same files. → Author/product intent. [Q-12]
- **W-10 (inert admin UI + orphan permission)** — inertness verified; pending-vs-abandoned decides the branch. → Product intent. [Q-13]
- **W-11 (writer-less analytics collections)** — read-without-write asymmetry verified repo-wide; severity ("operators see fabricated zeros") depends on whether an out-of-repo pipeline populates the collections. → Live Firestore inspection / ops records. [Q-9]
- **W-22 (a11y sample)** — the `SharePrivacyPicker` gap is verified (that sub-fact is bucket-1 grade); the overall posture claim is a sample, not an audit. → Accessibility audit. [NQ-13]

### Root causes (6)

- **RC-3 (migration pinned by unknowable data state)** — the machinery and its stated retirement condition are verified; whether the backfill ran and legacy docs remain is a production-data fact. → Live data sample + deployment records. [Q-5, NQ-1]
- **RC-5 (consumer-first analytics, producer never built)** — in-repo absence verified; "never built anywhere" cannot be fully verified from the repo. → Live project inspection. [Q-9]
- **RC-6 (schema adoption stopped at compatibility line)** — the line itself is documented in code; whether full adoption is still intended is unrecorded. → Author intent. [Q-12]
- **RC-7 (vocabulary-first convention)** — dormancy verified (and the kana-practice omission is demonstrably an omission — bucket-1 sub-fact); per-member intent is a roadmap fact. → Product intent. [Q-8, Q-11]
- **RC-8 (survival placement)** — the four survived restructures are git-verified; drift-vs-considered-Convention-B cannot be settled from the repo. → Author intent. [NQ-5]
- **RC-10 (no in-repo admin bootstrap)** — the absence is verified exhaustively; the actual out-of-band mechanism (claims vs doc, how minted) is a production fact. → Ops records / GCP console. [Q-10]

### Complexity (2)

- **CX-1 (notifications compatibility machinery)** — machinery verified; whether it is still load-bearing is entirely a data-state question. → Live data sample. [Q-5]
- **CX-7 (capability-first stratum)** — the inventory is fully verified; roadmap-vs-residue per item is unknowable, and the epic-program attribution is an inference. → Product intent per item. [Q-6, Q-8, Q-13, Q-17, NQ-3]

### Technical debt (8)

- **TD-1 (migration frozen mid-flight)** — every code fact verified, including the runbook's "NOT yet deployed" heading (re-verified here at `docs/testing-notifications.md:30`); retirement decisions are gated on production data + deploy state. → Deployment records + data sample. [Q-5, Q-7, NQ-1]
- **TD-5 (authority-claiming schemas)** — gap verified; branch gated on intent. → Author intent. [Q-12]
- **TD-6 (dormant vocabularies)** — as W-8. → Product intent. [Q-8, Q-11]
- **TD-7 (no-behavior admin UI)** — as W-10. → Product intent. [Q-13]
- **TD-8 (fabricated-zero analytics)** — as W-11. → Live project inspection. [Q-9]
- **TD-11 (unused `Drawer`)** — dormancy verified (re-verified here); adopt-vs-delete gated on intent; no discovery Q covers it. → Author intent. [NQ-3]
- **TD-12 (Storybook toolchain)** — 8-package : 1-story state verified; adoption status unknowable. → Author intent. [Q-17]
- **TD-14 (hosting decision unrecorded)** — the TODO and localhost fallback verified; resolution requires a product/ops decision to be made and recorded, which no repo fact can substitute for. → Hosting decision. [Q-2]

### Risks (15)

- **R-1 (listener fan-out)** — structure verified; runtime magnitude never profiled. → Runtime listener/read telemetry. [NQ-14]
- **R-2 (unbounded public-lesson listener)** — query + mount verified; severity scales with production public-deck count. → Live count / growth expectation. [NQ-6]
- **R-3 (world-readable leaderboard)** — rule verified; whether anonymous readability is intended product behavior decides if this is a defect. → Product intent. [NQ-7]
- **R-5 (live migration machinery)** — verified; load-bearing status is a data-state fact. → Data sample. [Q-5, Q-7]
- **R-6 (swallowed writes)** — pattern verified; operational severity depends on whether any monitoring DSN exists in production. → Production env config. [Q-4]
- **R-7 (transaction coverage gaps)** — the three transactional sites are verified; whether the *un*-transactional multi-doc writes actually carry read-modify-write races is an inferred gap. → **In-repo invariant audit — no production access needed.** [NQ-11]
- **R-8 (out-of-band admin bootstrap)** — as RC-10. → Ops records. [Q-10]
- **R-9 (emulator-vs-prod gap)** — structural gap verified; consequence depends on deployed rules/index/TTL state. → GCP console / deploy records. [Q-1, Q-5]
- **R-10 (bundle + per-screen load)** — imports verified; weight and listener counts unprofiled. → Bundle analysis + profiling. [NQ-14]
- **R-13 (no deploy decision)** — as TD-14. → Hosting decision. [Q-1, Q-2]
- **R-14 (split APP_ID across deploy units)** — split verified (TD-16); whether prod values currently agree is unknowable. → Production env config. [Q-6/D-6]
- **R-16 (validation narrower than writes)** — facts verified; consequence + direction gated on schema intent. → Author intent. [Q-12]
- **R-17 (XSS surfaces)** — both sinks and the write-time escape verified; "does every path pass the sanitizer" is unresolved. → **In-repo write-path audit — no production access needed.** [NQ-12]
- **R-18 (image handling)** — mechanics verified; whether world-readable card images are accepted product behavior is an intent fact. → Product intent. [NQ-8]
- **R-19 (out-of-repo indexes/TTL)** — declared artifacts verified; deployed state unknowable. → GCP console. [Q-1, Q-5, Q-9]

### Opportunities (12)

- **OP-4 (type-union reconciliation)** — divergence verified; direction gated on the recorded end-state. → Author intent + data sample. [Q-7, Q-5]
- **OP-7 (three admin-authority predicates)** — divergence verified; safe alignment gated on which source production relies on. → Ops records. [Q-10]
- **OP-8 (7 inactive kinds)** — → Product intent. [Q-8]
- **OP-9 (never-emitted logging vocabulary)** — → Product intent. [Q-11]
- **OP-10 (inert admin surfaces)** — → Product intent. [Q-13]
- **OP-11 (unenforced schemas)** — → Author intent. [Q-12]
- **OP-12 (`Drawer`)** — dormancy verified; intent gap flagged by the source as uncovered by any Q. → Author intent. [NQ-3]
- **OP-13 (Storybook + scaffold assets)** — → Author intent. [Q-17]
- **OP-14 (caller-less fan-out callable)** — no in-repo caller verified; out-of-repo operator invocation cannot be excluded. → Deployment/ops records. [Q-6]
- **OP-15 (legacy notification machinery)** — → Data sample. [Q-5]
- **OP-16 (reads on never-written collections)** — → Live project inspection. [Q-9]
- **OP-21 (dormant telemetry)** — gating verified; both branches conditional on production credentials and analytics scope intent. → Production env config + product intent. [Q-4, Q-2, Q-1]

---

## 3. Bucket 3 — Assumptions / interpretations (10)

Format: **ID — the judgment it embeds**. The measurements underneath each are bucket-1 grade unless noted.

- **W-4 (flashcard as mega-feature weakness)** — Embeds a judgment about optimal feature size: the measurements (146 files / 16,940 lines incl. tests; 46% of feature code) are verified, but whether concentration matching the product's domain weight is a *weakness* is contested inside the corpus itself — CX-2 (same author corpus, same facts) reads it as "concentration matching domain weight, not pathology per se," and W-4's own severity confidence is Medium. Adjudication: rely on the numbers and the verified seam costs (cycle, deep imports — bucket 1 via W-1/W-3); weigh the "must be split" implication as judgment.
- **W-12 (three write families as weakness)** — Embeds a cost-weighting of documented, partly Firebase-forced splits; the source itself rates the cost interpretation Medium, and CX-3 frames the same facts as load-bearing convention. The *existence* of the three families is bucket-1.
- **W-14 (SSR largely defeated)** — Embeds (a) a cost framing of a coherent, ADR-less architectural choice and (b) an unmeasured cost magnitude. The facts (AuthGate, 244 client files, 0 `loading.tsx`, 1 Suspense) are verified. Whether the choice is *wrong* needs the rendering-strategy intent + a measurement. [NQ-10 refines]
- **TD-15 (cookie as debt)** — Embeds the classification judgment the source itself flags ("Medium on classifying it as debt rather than a settled tradeoff"). The facts are identical to W-15/R-11 (bucket 1); what differs across the three files is only the lens — see §5, adjudication 11.
- **R-4 (feature-skew risk rating)** — Same facts as W-4/CX-2; the Med/Med rating is a defensible but weighable judgment ("fully code-evidenced; a defect-density signal would refine it").
- **OP-1 (write-family reduction headroom)** — Embeds the assumption that fewer than three families is structurally available; the source rates this Medium and notes part of the split is deliberate and Firebase-forced.
- **OP-3 (pagination unification headroom)** — Source-rated Low: the two mechanisms sit on different data channels with documented channel-specific rationale; unification may not exist.
- **OP-6 (two-RBAC consolidation headroom)** — Source-rated Low: overlap is in pattern shape, not data, rules, or callers; the consolidatable surface may be near-zero.
- **OP-18 (flashcard internal re-boundary headroom)** — Embeds "size implies available seams"; the source itself concedes size alone doesn't prove it.
- **OP-20 (rules-coverage automation feasibility)** — The manual correspondence is verified; whether it is *expressible as a checkable invariant* is not established — a feasibility assumption.

---

## 4. Per-file confidence profile

| Wave-1 file | Findings | Bucket 1 | Bucket 2 | Bucket 3 | Profile reading |
|---|---:|---:|---:|---:|---|
| 02 Strengths | 21 | 20 | 1 | 0 | Near-fully decision-grade; the corpus's most verifiable file (strengths were deliberately claimed only where mechanically checkable). |
| 03 Weaknesses | 22 | 14 | 5 | 3 | Factual core solid; the bucket-2 slice is the intent-gated dead-surface family; the bucket-3 slice is the three "how bad is it really" framings. |
| 04 Root causes | 12 | 6 | 6 | 0 | Exactly half the root causes terminate in an out-of-repo fact — consistent with the file's own meta-finding (six RCs share the "unrecorded completion state" cause). |
| 05 Complexity | 12 | 10 | 2 | 0 | Cause attributions are unusually well-evidenced (ADRs, config comments, git arcs); only the two capability/migration entries are gated. |
| 06 Pattern consistency | 18 | 18 | 0 | 0 | The most rigorously re-verified file (its counts corrected discovery in six places; spot-checks here found no errors). Its intent-unknowns were routed to File 12 rather than weakening verdicts. |
| 07 Technical debt | 16 | 7 | 8 | 1 | Half the ranked debt has a branch (delete-vs-complete, retire-vs-keep) chosen by an unanswered question — the ranking is reliable, the *treatment direction* often is not. |
| 08 Risk | 19 | 3 | 15 | 1 | By design: risk severity in a pre-deployment repo is dominated by production/scale/intent unknowns, and the file itself segregates them (§D) and refuses to inflate ratings. Low bucket-1 share is a property of the subject, not of the file's rigor. |
| 09 Opportunities | 24 | 7 | 12 | 5 | The conditional (two-branch) framing was used correctly: 12 opportunities are explicitly gated on Q-numbers; the 5 bucket-3 entries are the ones whose *headroom* (not facts) is assumed. |
| **Total** | **144** | **85 (59%)** | **49 (34%)** | **10 (7%)** | |

---

## 5. Inter-file adjudications (spot-verified this session)

Where wave-1 files disagreed — with each other or with the repo — the repo was checked directly. Repo wins in every case.

1. **Commit count (W-6 vs R-12 vs S-1/S-20/04/06).** `git rev-list --count main` = **138**; `--all` = **140**; `git shortlog -sne --all` = 133 + 7 = **140**. W-6's "133 + 7 … 138 total" is an arithmetic slip; R-12's 140 is correct for `--all`; the files citing 138 are correct for `main`. Single-authorship conclusion unaffected everywhere.
2. **Test tier counts (S-10 vs discovery/R-15).** Actual at HEAD: **22 unit / 12 browser / 4 app-emu + 1 rules / 2 functions-emu / 2 e2e specs**; total real test files **41** (39 app + 2 functions). S-10's "23 unit / 14 browser / 6 emu" counted two `__screenshots__` *directories* (named after their test files) as browser tests and mis-split the remainder; discovery's original 22/12/5 was correct. The 41-file totals in W-16/TD-2/OP-23 are correct. S-10's five-suite structural claim is unaffected.
3. **`onSnapshot` basis (PC discrepancy-list vs R-1).** Direct `onSnapshot(` calls: **14 sites across 9 files** (re-verified) — PC is right at the direct-call level. R-1's "13 files" counts files *participating in* realtime subscription channels (including hooks/contexts that consume subscribe services, e.g. `NotificationsContext.tsx`, `useLessons.ts`). Both stand once the counting basis is named; use 9/14 for "who touches the SDK", R-1's list for "who holds a live channel".
4. **Flashcard share of the codebase (W-4 vs CX-2 vs OP-18 vs R-4).** Re-measured: 146 files / 16,940 lines incl. tests; 142 / 16,606 non-test; all-features total 36,842 incl. tests. So: **34% of the whole `src/` tree** (R-4's label is correct), **46% of feature code incl. tests** (OP-18 correct), **~45% non-test** (CX-2 correct). W-4's "34% of all feature code" mislabels its denominator — the figure is the src-tree share. No number is wrong; one label is.
5. **Admin feature file count (CX-2's 105 vs OP-18's 109).** Both right: 105 non-test, 109 including 4 test files (re-verified).
6. **Notifications LOC (CX-1's "2,248 non-test" vs R-4's 3,211).** Re-measured: **3,211 incl. tests, 2,381 non-test**. R-4 correct; CX-1's non-test figure is off by ~130 lines (basis unclear; immaterial to its finding).
7. **Stored notification-type value count (RC-2/W-7/TD-1's 10 vs OP-4's "11th value").** Re-verified composition: 7 schema-accepted client-emitted kinds + `content_removed` (server-internal) + `invite` (client pending path) + `digest` (function) = **10 distinct stored values**. RC-2's enumeration is exact; OP-4's "an 11th value" for `digest` is an off-by-one slip (it is the 10th). Also: W-7's phrase "the server writer persists `type: input.kind` for any of the 9 active kinds" over-attributes — the server action's schema accepts 7 kinds (+1 internal); `invite` reaches storage via the client pending path, not the server writer. The 4-vs-10 headline is unaffected.
8. **Notifications test-file count (W-16's "9 files" vs TD-2's 8).** Actual: **8** (5 domain + `schema.test` + `types/notification.grouping.test` + `actions/notification.actions.emu.test`), re-verified. TD-2 correct.
9. **`cookie.ts` line citations (R-11 vs W-15/RC-4).** The file is **25 lines**; R-11's `cookie.ts:63-74` citation is impossible (its facts — non-httpOnly, SameSite=Lax, conditional Secure — are all correct and sit at lines 2–13). W-15/RC-4 cite correctly.
10. **Storybook package count (discovery's 7 vs TD-12/OP-13's 8).** Re-verified: **8** storybook-related devDependencies (7 Storybook packages + `eslint-plugin-storybook`). TD-12/OP-13 correct.
11. **Cookie posture rated three ways (W-15 weakness / TD-15 debt rank 11 / R-11 risk rank 3).** Not a contradiction — three lenses on one verified fact set. The spread itself is informative: as a *code fact* it is fully settled (bucket 1); as *debt* its classification is contested (bucket 3); as *risk* its severity is conditional on XSS/App Check facts. Decision phase should treat the mechanics as settled and the priority as open.
12. **i18n consumer counts (S-17's 157 vs PC-18's 133/151).** Reconciled and re-verified: 133 `.tsx` + 18 `.ts` = 151 `useTranslations` files, + 6 `getTranslations` files = **157**. Both files correct on their own basis.
13. **`Drawer` zero-consumer claim (W-21/PC-3/TD-11/OP-12).** A naive `<Drawer` grep returns 2 hits — both *inside* `Drawer.tsx` (a type annotation and a doc-comment usage example). **Zero render sites confirmed**; all four findings stand.
14. **Allowlist "mirroring" (discovery §10) vs inequality (W-20a).** Re-verified: the two lists are **unequal** (proxy: `/login`, `/sitemap.xml`, `/robots.txt`, and the OG-image pattern; AuthGate: only `/flashcard/shared/[^/]+`). W-20's correction of discovery is right; whether the divergence is intended is NQ-2.

---

## 6. Readiness verdict

### Ready for a decision phase now (bucket-1-dominated areas)

1. **Module boundaries, cycles, and layering** (W-1/W-2/W-3, RC-1/RC-12, TD-4, S-1) — every edge is verified; no external fact changes the picture.
2. **Test-coverage allocation** (W-16/TD-2/OP-23/OP-24 against S-10/S-11's verified infrastructure) — the census is exhaustive and the harnesses demonstrably exist; only *percent* coverage is unmeasured, and no decision listed depends on it.
3. **Standards enforcement and declared-vs-real gaps** (W-21, TD-3, PC-17 token tail) — counts verified; the decisions are about enforcement posture, fully informed.
4. **Overlay/dialog standardization** (OP-2, PC-3) — ready except the Drawer adopt-vs-delete branch (NQ-3).
5. **Inline RBAC divergence** (OP-5) — ready, and urgent to *examine* regardless of any broader decision: the `isOwner` semantic divergence is a verified behavioral difference in an access path.
6. **Auth/cookie architecture** (W-15, RC-4, R-11, CX-6) — all mechanics and compensating controls verified; this is a values-and-priorities decision that new facts (App Check state, D-2) would refine but not unblock.
7. **Configuration-sync surface** (W-20, TD-13, TD-16) — verified; the allowlist-intent question (NQ-2) affects which behavior gets canonicalized, not whether the sync hazard is real.
8. **Placement conventions** (W-5/RC-8/PC-15/TD-10/OP-17/CX-9) — ready *with an intent caveat*: the facts and costs are complete; author intent (NQ-5) would change only the narrative label (drift vs. choice), and either answer leaves the same decision open (write the rule).

### Blocked on validation (bucket-2-dominated areas)

1. **Notifications migration end-state** — blocked on Q-5 + Q-7 + NQ-1 (backfill/data state, reconciliation target, deploy status). Largest single cluster in the corpus (TD-1, RC-2, RC-3, CX-1, R-5, OP-4, OP-15, W-7-treatment).
2. **Admin analytics pipeline** — blocked on Q-9 (does anything populate the collections). Delete-vs-complete cannot be chosen (W-11, TD-8, RC-5, OP-16).
3. **Admin authority & bootstrap** — blocked on Q-10 (claims vs doc in production). Predicate alignment (OP-7) is unsafe without it (RC-10, R-8).
4. **Dormant vocabularies and inert surfaces** — blocked on Q-8/Q-11/Q-13 product intent (W-8, W-10, RC-7, TD-6, TD-7, OP-8/9/10).
5. **Unenforced schemas** — blocked on Q-12 (target-state vs overtaken); the two readings imply opposite treatments (W-9, RC-6, TD-5, R-16, OP-11).
6. **Observability activation** — blocked on Q-4 (production credentials + intended analytics scope) (OP-21, R-6 severity, W-17's production dimension).
7. **Deployment/hosting family** — blocked on Q-1/Q-2/Q-6 and the hosting decision itself (TD-14, R-13, R-14, R-9, R-19, OP-14).
8. **Scale/performance risk sizing** — blocked on measurement, not intent: listener counts, bundle analysis, public-deck growth (R-1, R-2, R-10, NQ-6/NQ-14).
9. **Accessibility posture** — blocked on an audit (S-19, W-22, NQ-13) — in-repo work, no production access needed.
10. **Capability-adoption branch picks** (Drawer, Storybook, fan-out callable) — blocked on Q-17/Q-6/NQ-3 intent answers (TD-11, TD-12, OP-12/13/14, CX-7).

Two "blocked" items are resolvable **without any production access** and could be cleared by in-repo audit work alone: the transaction-invariant audit (R-7/NQ-11) and the sanitization-path trace (R-17/NQ-12) — plus the a11y audit (NQ-13). Everything else in the blocked list requires GCP console state, live data, deployment records, or product-owner intent, catalogued in `12-Questions-Requiring-Validation.md`.
