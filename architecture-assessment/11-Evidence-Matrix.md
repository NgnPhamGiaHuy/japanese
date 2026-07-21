# 11 — Evidence Matrix

**Phase 8 — Architecture Assessment (synthesis).** One master index of all 144 finding IDs across the eight wave-1 files, with each finding's primary evidence, evidence type, verification status, and confidence. Classification only — no remedies or tasks.

- **Repo root:** `/Users/yuh.nguyenpham/GitHub/japanese`; project root `src/` (paths below relative to `src/` unless prefixed). Matrix compiled 2026-07-19 against HEAD `a0bbbc4`.
- **Evidence type legend:** **DC** = direct code read (file:line) · **GH** = git history (commits/authorship/`--follow`) · **M** = measurement (exhaustive grep count, computed diff, `wc`) · **XI** = cross-file inference (conclusion assembled from multiple verified facts) · **PU** = production-unknown-gated (factual core in-repo, decision meaning depends on out-of-repo state/intent).
- **Verification legend:** every wave-1 file claims re-verification of load-bearing citations at HEAD (“src ✓”). “spot ✓” = additionally re-verified by this synthesis session. “⚠ adj-N” = a defect was found and adjudicated — see `10-Decision-Readiness.md` §5, adjudication N. A ⚠ marks a *detail* error; no finding's headline was overturned by any spot-check.
- **Confidence:** as assigned by the source file; where two files rate the same underlying fact differently, the adjudicated value is shown and the divergence is noted in §2.

---

## 1. Master table

### 02 — Strengths (S-1 … S-21)

| ID | Finding (one line) | Primary evidence | Type | Verification | Confidence |
|---|---|---|---|---|---|
| S-1 | Unidirectional layer imports; one documented composition-root exception | greps over `src/shared`, `src/features`, `src/lib`; `lib/providers.tsx:8-11`, `lib/logging/public.ts:1` | M+DC | src ✓ | High |
| S-2 | Consistent feature grammar; thin route orchestrators | `app/[locale]/(main)/kana/learn/page.tsx:1-8`; feature dir listings | DC | src ✓ | High |
| S-3 | Physically fenced server/client split (10 `server-only` + 10 `"use server"`) | exhaustive greps; `lib/firebase-admin.ts:1`, `lib/safe-action.ts:1` | M+DC | src ✓ | High |
| S-4 | Single server-action architecture, zero route handlers | `lib/safe-action.ts:9-60`; `features/admin/services/admin.service.ts:65-85`; `find app -name route.ts` → 0 | DC+M | src ✓ | High |
| S-5 | Server-derived authorization (identity/target/role never client-trusted) | `features/notifications/actions/notification.actions.ts:9-16,66-97,123-162`; `features/flashcard/utils/rbac.ts:1-38,97,159`; `firestore.rules:66-78` | DC | src ✓ | High |
| S-6 | Firestore rules mirror app RBAC incl. immutable-field guards | `firestore.rules:16-22,50-56,66-78,84-93,106-123`; `firestore-rules.test.ts` | DC | src ✓ | High |
| S-7 | Lazy Proxy Admin-SDK singletons; credential-free builds | `lib/firebase-admin.ts:13-76`; `.github/workflows/ci.yml:50-62` | DC | src ✓ | High |
| S-8 | Transactions/idempotency where races exist | `features/user/services/user.service.ts:33-62`; `notification.actions.ts:196-252`; `domain/id.ts:1-40`; `progress.service.ts:288-298` | DC+GH | src ✓ | High |
| S-9 | Pure, unit-tested notifications domain core | `features/notifications/domain/` listing; `registry.ts:1-44`; `id.ts:12-16` | DC | src ✓ | High |
| S-10 | Five-suite test architecture, each tier proving its own claim | 4 vitest/playwright configs; `functions/package.json` | DC+M | spot ✓ **⚠ adj-2** (tier counts wrong: actual 22 unit / 12 browser / 4 emu + 1 rules / 2 functions / 2 e2e; structure claim stands) | High (structure); counts corrected |
| S-11 | CI mirrors local suites job-for-job | `.github/workflows/ci.yml:10-146` | DC | src ✓ | High |
| S-12 | Layered per-failure-class error policy | `progress.service.ts:274-298`; `lib/flags.ts:50-88`; `notification.actions.ts:99-189`; `lib/logging/browser.ts:9-21` | DC | src ✓ | High |
| S-13 | Centralized default-safe configuration | `features/ai/config.ts:1-22`; `lib/flags.ts:14-88`; `docs/adr/003` | DC | src ✓ | High |
| S-14 | Four-tier state model codified in ADR-002 | `lib/app-store.ts:56-67`; `lib/providers.tsx:53-67`; `features/admin/utils/queryKeys.ts:1-17`; `docs/adr/002` | DC+GH | src ✓ | High |
| S-15 | ESLint-enforced audio boundary from a real incident | `eslint.config.mjs:23-57`; `shared/audio/README.md:1-40`; ADR-001 | DC | src ✓ | High |
| S-16 | Tested shared primitives, schemas, reorder util, game engine reuse | `shared/components/ui/` listing; `shared/utils/reorder.ts:1-17`; cross-feature import greps | DC+M | src ✓ | High |
| S-17 | i18n zero key drift (803/803), locale-aware copy | computed flatten-and-diff of `messages/en.json`/`ja.json`; shared page `:40-63` | M+DC | spot ✓ (consumer counts reconciled: 151 `useTranslations` + 6 `getTranslations` = 157; adj-12) | High |
| S-18 | Measured, mechanism-backed performance engineering | `lib/providers.tsx:69-81`; `lib/fonts.ts:1-13`; shared page `:87-98`; virtual lists | DC | src ✓ (mechanisms only; runtime outcomes not claimed) | High (mechanisms) |
| S-19 | A11y as testable contract at primitive level | `Modal.browser.test.tsx:8-71`; aria grep (48 files); `.storybook/main.ts:17` | DC+M | src ✓ (page-level breadth explicitly unproven) | Medium |
| S-20 | Heavy gates, traceable history, reasoned code | `.husky/pre-commit`; `git log`; ADR cross-refs at `eslint.config.mjs:27`, `lib/flags.ts:4-5` | DC+GH | src ✓ | High |
| S-21 | Non-blocking spoof-resistant audit-log pipeline; gated observability | `lib/logging/browser.ts:9-21`; `lib/logging/user-actions.ts` (+emu test); `proxy.ts:20-21,50-55`; `firestore.rules:199-202` | DC | src ✓ | High (pipeline) / Med (server internals detail) |

### 03 — Weaknesses (W-1 … W-22)

| ID | Finding (one line) | Primary evidence | Type | Verification | Confidence |
|---|---|---|---|---|---|
| W-1 | `flashcard` ↔ `notifications` directory-level value-import cycle | `ShareModal.tsx:12`, `comment.service.ts:29`, `access.service.ts:11`; `InviteActions.tsx:8` | DC | src ✓ | High |
| W-2 | `lib/logging` imports types from `features/admin` (layer inversion) | `lib/logging/public.ts:1`; reverse edges `log.service.ts:8-9`, `admin.actions.ts:8` | DC | src ✓ | High |
| W-3 | No enforced feature public API; deep cross-feature imports | barrel census (2/9); deep-import counts (43× `flashcard/types`, …); `eslint.config.mjs:23-58` | M | src ✓ | High |
| W-4 | `flashcard` is a mega-feature (146 files / 16,940 lines) | `wc -l`/`find` measures; discovery §11 spot-checks | M | spot ✓ **⚠ adj-4** (“34% of all feature code” mislabels denominator — 34% of `src/`, 46% of feature code) | High (measures) / Med (severity) |
| W-5 | Kana-survival UI split across `app/`/`features/` layers | `find "app/[locale]/(immersive)/kana/survival"`; `features/kana/` listing | DC | src ✓ | High |
| W-6 | Bus factor of one (single author) | `git shortlog -sne --all`; `git rev-list --count main` | GH | spot ✓ **⚠ adj-1** (133+7=140 all-refs, 138 on main; source's “138 total” is an arithmetic slip) | High |
| W-7 | `AppNotification.type` typed 4 values; codebase writes 10 | `types/index.ts:5,47`; `notification.actions.ts:209`; `digest.ts:82` | DC | spot ✓ **⚠ adj-7** (server-writer attribution: schema accepts 7 kinds + 1 internal; `invite` via client path; 4-vs-10 headline stands) | High |
| W-8 | Dormant vocabularies (7/16 kinds, 8/32 actions, 1 log source) | per-member producer greps; `registry.ts` `active:false` ×7 | M+PU | spot ✓ (sampled: `DECK_SHARED`, `KANA_PRACTICE_COMPLETED` → 0 producers) | High (dormancy) / intent unknowable |
| W-9 | “Source of truth” schemas enforced on no write path | grep: `cardContentSchema` 0 consumers; `lesson-save.ts:61`, `parser.ts:147`, `gemini.service.ts:39` use `validateAtomicCard` | M+DC+PU | spot ✓ | High (gap) / intent unknowable |
| W-10 | Admin ships non-functional UI + unenforceable permission | `QuickActionsCard.tsx:21-41`; `AdminSettingsPageContent.tsx:13-16`; `canChangeSettings` grep | DC+M+PU | src ✓ | High (inertness) |
| W-11 | Admin metrics read never-written collections, fabricate zeros | `analytics.service.ts:29,37-49`; `user.service.ts:65,96-104`; writer grep → 0 | M+DC+PU | spot ✓ (`analytics_daily` readers-only re-grepped) | High (in-repo asymmetry) |
| W-12 | Three server-write families + duplicated UI mechanisms | `lib/safe-action.ts:16-31`; `admin.service.ts:65-85`; `NotificationsContext.tsx:42,96-100` | DC+XI | src ✓ | High (existence) / Med (cost) |
| W-13 | Shared-deck access policy encoded three times | `shared-preview.service.ts:1-16`; `utils/rbac.ts`; `firestore.rules` mirror | DC | src ✓ (rules body not exhaustively diffed) | Med |
| W-14 | Server rendering defeated by client auth gate | `lib/providers.tsx:19-47`; counts (244 `"use client"`, 0 `loading.tsx`, 1 Suspense) | DC+M | src ✓ | Med (facts High; cost unmeasured) |
| W-15 | Presence-only edge gate over JS-readable ID-token cookie | `proxy.ts:44-48,81-97`; `shared/utils/cookie.ts:1-25` | DC | spot ✓ (cookie.ts is 25 lines; citations correct here — contrast R-11) | High (facts) / Med (impact) |
| W-16 | Test coverage inverted vs risk | exhaustive test census + per-module diff | M | spot ✓ **⚠ adj-8** (notifications test files = 8, not “9”; census total 41 stands) | High |
| W-17 | Thin client-side error/audit visibility | 59 `console.error`, 17 swallows, 2 `enqueueClientLog` callers | M | spot ✓ (swallows = 14 + 3 re-verified) | High |
| W-18 | Per-keystroke server queries; window re-reads; ~no memoization | `LogsFilters.tsx:90-94` → `useLogs.ts:27-33`; `NotificationsContext.tsx:96-100` | DC | src ✓ | Med-High (a) / High (b) / Med (c) |
| W-19 | Uncontracted external endpoints (TTS, KanjiVG `master`, Google Fonts) | `googleTranslateTts.ts:31`; `KanaStrokeAnimation.tsx:14`; `opengraph-image.tsx:30` | DC | src ✓ | High |
| W-20 | Hand-synchronized config: unequal allowlists, dual APP_ID, no `.env.example`, localhost SITE_URL | `proxy.ts:9-18` vs `lib/providers.tsx:24`; `lib/app-id.ts:1` vs `functions/src/fanout.ts:126`; `lib/site.ts:1-5` | DC+M | spot ✓ (allowlist inequality re-verified; adj-14) | High |
| W-21 | Declared standards diverge from enforced reality | `eslint.config.mjs:59-65` + recount 44; 1 story; `<Drawer` → 0 renders; docs index missing ADR-003 | M+DC | spot ✓ (44 re-verified; Drawer 0 renders re-verified, adj-13) | High |
| W-22 | A11y sample largely sound; one bespoke popover gap | `SharePrivacyPicker.tsx:90-131`; aria/tabIndex greps | DC+M | src ✓ (sample, not audit — self-declared) | Low-Med overall / High (specific gap) |

### 04 — Root causes (RC-1 … RC-12)

| ID | Finding (one line) | Primary evidence | Type | Verification | Confidence |
|---|---|---|---|---|---|
| RC-1 | Cycle exists because the platform has no render/act-side inversion point | import sites; `notify.ts` write-side facade; both halves born in `ca8a654` | DC+GH+XI | src ✓ | High |
| RC-2 | Type drift = unfinished two-vocabulary migration with unrecorded end state | `events.ts:11-15`; `git log --follow types/index.ts` (`725633b`→`ca8a654`, nothing since) | DC+GH+PU | spot ✓ (10-value composition confirmed; adj-7) | High (state) / end-state unknowable |
| RC-3 | Dual machinery pinned by unrecordable backfill-completion fact | `notification.service.ts:59-63` (retirement condition in code); `scripts/backfill-notifications.mjs` | DC+PU | src ✓ | High (mechanism) / Q-5-gated |
| RC-4 | Presence-only gate is structural to client-SDK-first auth mirror | `proxy.ts:43-48`; `cookie.ts:1-15`; `useFirebaseAuth.ts:46-53`; commits `fa99063`, `afdc948` | DC+GH | src ✓ (the “conscious trade-off” reading is intent inference) | High (structure) |
| RC-5 | Analytics built consumer-first; producer never landed (3-month server-compute gap) | reader cites; `functions/src/index.ts` exports; commits `36d3931`→`7bd2256` | DC+GH+PU | spot ✓ (readers-only re-grepped) | High (in-repo) / Q-9-gated |
| RC-6 | Validation epic stopped at documented compatibility line; header claims end-state as current | `card.schema.ts:1-5,25-27`; consumer greps; sole commit `8fd3f2f` | DC+GH+PU | spot ✓ | High (line) / intent Q-12 |
| RC-7 | Vocabulary-first convention; no liveness mechanism; kana-practice is a proven omission | `registry.ts:27-30`; per-member greps; practice-vs-siblings asymmetry | M+DC+PU | spot ✓ (sampled) | High (facts) / intent Q-8/Q-11 |
| RC-8 | Survival placement survived ≥4 deliberate passes; drift vs convention unsettleable | `git log --follow` on survival dir; commits `9e1893f`, `348c484`, `918b2d5` | GH+DC+PU | src ✓ | High (history) / intent NQ-5 |
| RC-9 | Share resolution duplicated by ADR-002 × SSR-epic collision; no SDK-neutral domain home | `shared.service.ts:144-256`; `shared-preview.service.ts:55-91`; `a7963ea` | DC+GH | src ✓ | High |
| RC-10 | Admin bootstrap assumption never discharged (no claim writer anywhere) | `setCustomUserClaims` grep → 0; `firestore.rules:194-197`; rbac chain | M+DC+PU | src ✓ | High (absence) / mechanism Q-10 |
| RC-11 | Three write families = staged evolution, formalized not unified | `lib/safe-action.ts:14-31,47-60`; era commits (04-12 → 07-16); ADR-002 | DC+GH | src ✓ | High |
| RC-12 | Log vocabulary born in the viewer; pipeline moved, ownership didn't | `public.ts:1`; `schema.ts:3` duplicate enum; April-vs-E17-T4 dating | DC+GH | src ✓ | High |

### 05 — Complexity (CX-1 … CX-12)

| ID | Finding (one line) | Primary evidence | Type | Verification | Confidence |
|---|---|---|---|---|---|
| CX-1 | Notifications = migration frozen at second-to-last step (legacy compatibility) | dual-machinery cites; `ca8a654` +2,844/−337; retirement condition in code | DC+GH+PU | spot ✓ **⚠ adj-6** (non-test LOC 2,381, not 2,248; immaterial) | High |
| CX-2 | Flashcard growth = accretion at sprint speed (≈1 subsystem/day, April) | dated commit chain `f6a4418`…`70a7b62`; size measures | GH+M | spot ✓ (142/16,606 non-test confirmed) | High (narrative) / Med (harm) |
| CX-3 | Write families = fossilized trust-boundary eras, formalization deliberate | era commits; `safe-action.ts` docstring; ADR-002 | GH+DC | src ✓ | High |
| CX-4 | 61 barrels: convention that survived its own revocation | `find` count; commits `6c1ae07`, **`c474f64` (removal)**, `94a9ef4` (re-growth) | M+GH | src ✓ (reversal intent unrecorded — File 12 addendum) | High |
| CX-5 | Motion/audio constraints = purchased, enforced boundaries (asymmetric enforcement) | `eslint.config.mjs:23-57`; `providers.tsx:70-81`; ADR-001 | DC | src ✓ | High |
| CX-6 | Five stacked auth layers = defense accumulation, each distrusting the one above | layer cites + dates; `useFirebaseAuth` "previous failed approaches" header | DC+GH | src ✓ | High |
| CX-7 | Capability-ahead-of-consumer stratum (two flavors: documented staging vs undocumented aspiration) | Drawer/fanout/Storybook/PostHog/vocab/telemetry cites | M+DC+PU | spot ✓ (Drawer, Storybook re-verified) | Med-High (inventory High; attribution Med) |
| CX-8 | File-splitting program: size ceilings as team law | `eslint.config.mjs:60-66`; split commits E11/E17; suffix taxonomy | DC+GH | src ✓ | High |
| CX-9 | Two placement conventions, no recorded tiebreaker | the four `_components/` dirs; ADR absence | DC+M | src ✓ | High |
| CX-10 | Locale routing: framework-imposed pervasiveness; benefit flag-gated dark | `7447e76`; `proxy.ts:25-76`; `lib/flags.ts:22` | DC+GH+PU | src ✓ | Med-High |
| CX-11 | `artifacts/{APP_ID}` layout: least reversible decision, origin unrecoverable | path builders; rules nesting; dual env vars | DC+PU | src ✓ (origin story labeled conjecture) | Med |
| CX-12 | Admin = parallel sub-application; patterns-per-surface | React Query/react-table isolation measures; April wave commits | M+GH | src ✓ | High |

### 06 — Pattern consistency (PC-1 … PC-18)

| ID | Finding (one line) | Primary evidence | Type | Verification | Confidence |
|---|---|---|---|---|---|
| PC-1 | Forms divergent (2 `useForm` files vs manual state; 0 `<form>`) | grep counts; `8fd3f2f` dating | M+GH | src ✓ | High |
| PC-2 | Tables mostly-consistent; Reports outside the engine, reason undocumented | `useDataTable.ts:24-35`; `684482e`, `fe7d1b5` | DC+GH+PU | src ✓ (exclusion intent → NQ-4) | High |
| PC-3 | Dialogs: two deliberate tiers + 1 backdrop straggler; Drawer 0 consumers | `5669430` names bespoke tier as migrated end-state; `DeckDetailsPanel` backdrop | DC+GH | spot ✓ (Drawer) | High |
| PC-4 | Lists/virtualization: one library, two documented scroll strategies | both components + docstrings; same-day commits | DC+GH | src ✓ | High |
| PC-5 | CRUD divergent: three documented families | family cites; `toActionResult` bridge | DC | src ✓ | High |
| PC-6 | API access consistent (0 route handlers; single surface type) | `find` + greps | M | src ✓ | High |
| PC-7 | Validation mostly-consistent: zod at boundaries + retained legacy validators | `shared/schemas/` (07-16); `validateAtomicCard` sites | DC+GH | src ✓ | High |
| PC-8 | Two RBAC engines for disjoint domains, same filename | both `utils/rbac.ts` files; April dating | DC+GH | src ✓ | High |
| PC-9 | Toasts/notification-center: one mechanism each, no overlap | 30 `showAlert` sites / 11 files; replacement (not accretion) history | M+GH | src ✓ | High |
| PC-10 | Loading: 6 context-mapped mechanisms; skeletons unconsolidated (19 files) | mechanism census | M | src ✓ (completeness not provable) | Medium |
| PC-11 | Pagination: two constraint-documented variants; admin side just unified | `useCursorPagination.ts` docstring; `d9a8d5d` | DC+GH | src ✓ | High |
| PC-12 | Filter/sort/search: highest variant count (6/4/4); partially undocumented | variant census; no debounce anywhere | M | src ✓ (completeness not provable) | Medium |
| PC-13 | Error handling: 3 surfacing styles mapped to context; rule unwritten | 4 boundary files; 17 swallows; style census | M+DC | spot ✓ (swallow count) | Medium |
| PC-14 | Caching: ADR-governed division + ad-hoc module caches outside it | ADR-002; regime census | DC | src ✓ | High |
| PC-15 | Placement mostly-consistent; survival outlier survived 3 restructures | `3123798`, `9e1893f`, `918b2d5`; placement listing | GH+DC+PU | src ✓ (intent → NQ-5) | High |
| PC-16 | State: 3 stores / 3 contexts / local, coherent but unwritten rule | exact censuses; per-game idiom variance | M+XI | src ✓ (role-mapping labeled interpretation) | Medium |
| PC-17 | Theming: token system converging; 38 raw-hex classNames across 29 files | hex census; `4992e62`→`0e6340c` arc; `chartTheme.ts` carve-out | M+GH | src ✓ | High |
| PC-18 | i18n consistent: one mechanism, 803/803 parity; extraction tail | parity computation; navigation-wrapper census | M | spot ✓ (counts reconciled, adj-12) | High (mechanism) / Low (“all strings extracted”) |

### 07 — Technical debt (TD-1 … TD-16)

| ID | Finding (one line) | Primary evidence | Type | Verification | Confidence |
|---|---|---|---|---|---|
| TD-1 | Notification migration frozen mid-flight (score 8) | union/writer/digest cites; dual indexes; `docs/testing-notifications.md:30` “NOT yet deployed” | DC+PU | spot ✓ (runbook heading re-verified) | High |
| TD-2 | Coverage topology inverted (score 8) | exhaustive census; per-module zero-test checks; `resolveRole` grep → 0 test refs | M | spot ✓ (per-feature counts confirmed) | High |
| TD-5 | Authority-claiming schemas unconsumed (score 7) | consumer greps; header claims | M+DC+PU | spot ✓ | High (gap) / Med (intent) |
| TD-8 | Writer-less analytics + fabricated fallbacks (score 6) | reader/writer greps; fallback reads | M+DC+PU | spot ✓ | High |
| TD-3 | 200-line ceiling warn-only, 44 files over (score 6) | `eslint.config.mjs:59-67`; recount | M+DC | spot ✓ (44 confirmed) | High |
| TD-7 | Live admin UI with no behavior (score 5) | `QuickActionsCard.tsx:11-42`; permission grep | DC+M+PU | src ✓ | High |
| TD-14 | Hosting decision unrecorded; localhost feeds prod URLs (score 5) | `lib/site.ts:1-5` (repo's only TODO); consumer cites; no hosting config | DC+M+PU | src ✓ | High |
| TD-9 | Public-access predicate triplicated (score 5) | three predicate sites incl. `shared-preview.service.ts:76,102` | DC | src ✓ | High |
| TD-4 | Two import cycles, no cycle tooling (score 5) | all edges; tool absence | DC+M | src ✓ | High |
| TD-13 | No README / `.env.example` (30 env vars); ADR index drift (score 5) | env-var inventory; `docs/README.md` vs `docs/adr/` | M+DC | src ✓ | High |
| TD-15 | ID token in JS-readable cookie: accepted risk, no ADR (score 4) | `proxy.ts:48`; `cookie.ts:5-13` | DC | src ✓ | High (facts) / Med (debt classification) |
| TD-6 | Dormant vocabularies incl. shipped-but-unlogged kana practice (score 4) | registry lines; per-member greps; practice route | M+DC+PU | spot ✓ (sampled) | High (facts) / Low (intent) |
| TD-10 | Survival split across layers (score 4) | placement + import cites | DC | src ✓ | High |
| TD-12 | Storybook toolchain for one story (score 4) | 8 packages; 1 story; configs | M | spot ✓ (8 confirmed, adj-10) | High (facts) / Low (intent) |
| TD-16 | Dual `APP_ID` env vars across deploy units (score 3) | `lib/app-id.ts:1`; `fanout.ts:126`; `digest.ts:151` | DC | src ✓ | High (facts) / Med (unintentionality) |
| TD-11 | `Drawer` built, exported, zero render sites (score 3) | grep; barrel export; two bespoke drawers | M+DC | spot ✓ (adj-13) | High |

### 08 — Risks (R-1 … R-19)

| ID | Finding (one line) | Primary evidence | Type | Verification | Confidence |
|---|---|---|---|---|---|
| R-1 | Per-user progress fan-out + per-mount listener multiplication | `progress.service.ts:55-71`; `user.service.ts:12-31` + 10 mount sites | DC+M+PU | spot ✓ **⚠ adj-3** (“13 files” = subscription-consumer basis; direct `onSnapshot(` = 9 files / 14 sites) | High (structure) / Low (magnitude) |
| R-2 | Unbounded public-lesson `collectionGroup` listener on the dashboard | `lesson-subscriptions.ts:120-127`; mount chain via `useLessons.ts:240-270` | DC+PU | src ✓ | High (code) / scale unknown |
| R-3 | Leaderboard world-readable; exposes uid + displayName | `firestore.rules:170-173`; `persist-best-score.ts:51-58` | DC+PU | src ✓ | High (rule) / intent NQ-7 |
| R-4 | Feature-size skew concentrates change risk | size + churn measures | M | src ✓ | High (facts; rating is judgment) |
| R-5 | Live migration-era machinery in production paths | dual-vocabulary + fallback cites | DC+PU | src ✓ | High |
| R-6 | Fire-and-forget with swallowed errors on real state | swallow-site census incl. `progress.service.ts:157`, `useFirebaseAuth.ts:70` | M+DC+PU | spot ✓ (17 swallows) | High (pattern) / Med (consequence) |
| R-7 | Inconsistent transactional guarantees on multi-doc invariants | 3 transaction sites vs `writeBatch`/`setDoc` sites; `user.service.ts:33-41` race comment | DC+XI | src ✓ | Med (inferred gap — NQ-11 resolves in-repo) |
| R-8 | Admin bootstrap entirely out-of-band | `setCustomUserClaims` grep → 0; rules deny; superadmin-only grant chain | M+DC+PU | src ✓ | High (absence) |
| R-9 | Emulator-vs-prod behavioral gap (rules/index/TTL/claims) | demo project IDs; fallback code cites; `firebase.ts:55-63` e2e bridge | DC+PU | src ✓ | Med |
| R-10 | Bundle (recharts ×9) + per-screen listener load | dynamic-import cites; chart census; listener co-mounts | DC+M+PU | src ✓ (never profiled) | Med |
| R-11 | Non-httpOnly cookie behind presence-only gate | `proxy.ts:80-92`; `cookie.ts` | DC | spot ✓ **⚠ adj-9** (`cookie.ts:63-74` citation impossible — file is 25 lines; facts correct) | High (mechanics) |
| R-12 | Single-author knowledge concentration (140 commits, one person) | `git shortlog -sn --all` | GH | spot ✓ (140 `--all` / 138 `main`; adj-1) | High |
| R-13 | No hosting/deploy decision (no `.firebaserc`, no hosting block) | `lib/site.ts:1-5`; config absences | DC+M+PU | src ✓ | High |
| R-14 | Two-package deploy, split APP_ID sources | same cites as TD-16 + `firebase.json` predeploy | DC+PU | src ✓ | High (split) / conditional failure |
| R-15 | Test topology requires JDK + emulator across tiers | `docs/testing-notifications.md:23`; `package.json` scripts; playwright config | DC | src ✓ | High |
| R-16 | Declared validation narrower than written surface | schema greps; `firestore.rules:39-41,181-188` | M+DC+PU | spot ✓ | High (facts) / Med (consequence) |
| R-17 | XSS surfaces: hand-rolled markdown + JSON-LD stringify | `CommentItem.tsx:45-60,180`; `SharedLessonPageClient.tsx:70-88`; `comment-validation.ts:28-35` | DC | src ✓ | Med (end-to-end sanitize coverage untraced — NQ-12 resolves in-repo) |
| R-18 | Raw `<img>`, world-readable Storage, client-side-plus-rules 2MB cap | `storage.rules:8-15`; `image.service.ts:24-30`; `<img>` greps | DC+PU | src ✓ | Med |
| R-19 | Runtime dependency on out-of-repo indexes/TTL/writers | `firestore.indexes.json`; `notification-paths.ts:18-21`; `digest.ts:110-127` | DC+PU | src ✓ | Med |

### 09 — Opportunities (OP-1 … OP-24)

| ID | Finding (one line) | Primary evidence | Type | Verification | Confidence |
|---|---|---|---|---|---|
| OP-1 | Three write families could be fewer | `safe-action.ts:14-31`; family cites | DC+XI | src ✓ | Medium (headroom assumed) |
| OP-2 | Two dialog mechanisms; backdrops already diverged | 4 `Dialog.Root` files; `DeckDetailsPanel.tsx:40` vs `DialogChrome.tsx:9-10` | DC+M | src ✓ | High |
| OP-3 | Two pagination mechanisms | `useCursorPagination.ts:18-52`; `NotificationsContext.tsx:39-104` | DC | src ✓ | Low (channel-forced) |
| OP-4 | Type union vs stored values could agree (direction = Q-7) | union/writer/digest/rules cites; `NotificationRow.tsx:178` | DC+PU | spot ✓ **⚠ adj-7** (“11th value” slip — `digest` is the 10th distinct value) | High (divergence) |
| OP-5 | Access predicates re-derived inline; one derivation semantically diverges | `rbac.ts:94-134` vs `shared.service.ts:181-188` (`isOwner` via `roles[uid]` vs `ownerId ?? userId`) | DC | src ✓ | High |
| OP-6 | Two RBAC engines share pattern shape | both `rbac.ts` modules | DC+XI | src ✓ | Low |
| OP-7 | Three divergent admin-authority predicates | `admin.service.ts:30-38`; `firestore.rules:16-22`; `fanout.ts:120-124` | DC+PU | src ✓ | High (divergence) / direction Q-10 |
| OP-8 | 7 inactive kinds: delete-or-complete | registry `active:false` lines; schema union | DC+PU | spot ✓ (7 confirmed) | High (dormancy) |
| OP-9 | 8 actions + 1 log source never produced: delete-or-complete | per-member greps; practice asymmetry | M+PU | spot ✓ (sampled) | High (dormancy) |
| OP-10 | Inert admin surfaces: delete-or-complete | QuickActions/settings/permission cites | DC+PU | src ✓ | High (inertness) |
| OP-11 | Unenforced schemas: enforce-or-remove | consumer greps; header claims | M+PU | spot ✓ | High |
| OP-12 | `Drawer`: adopt-or-delete (intent gap — no Q covers it) | grep → 0 renders; two bespoke drawers | M+DC+PU | spot ✓ (adj-13) | High (dormancy) |
| OP-13 | Storybook (8 pkgs : 1 story) + 5 scaffold SVGs: adopt-or-delete | package.json; story census; `public/` greps | M+PU | spot ✓ (adj-10) | High (state) |
| OP-14 | `fanOutNotifications`: zero in-repo callers | `fanout.ts:7-15,128-134`; `httpsCallable` grep → 0 | DC+M+PU | src ✓ | High (no callers) |
| OP-15 | Legacy notification machinery: removable iff Q-5 answers | dual-machinery cites | DC+PU | src ✓ | Medium (conditional) |
| OP-16 | Reads on never-written collections: delete-or-complete | reader/writer greps; fallback cites | M+PU | spot ✓ | High (asymmetry) |
| OP-17 | Survival placement parity | placement listing | DC | src ✓ | High |
| OP-18 | Flashcard internal size skew | recounted sizes; subdirectory census | M | spot ✓ (adj-4 basis note) | Medium (seam availability assumed) |
| OP-19 | Cross-artifact vocabulary agreements human-enforced; one drifted | three-declaration disagreement; dual APP_ID; enum “MUST” | DC+M | src ✓ | High |
| OP-20 | Rules↔written-path agreement is prose-comment-enforced | `firestore.rules:80,131-160` comments; path-builder spread | DC | src ✓ | Medium (checkability assumed) |
| OP-21 | Telemetry dormant-by-default: activate-or-acknowledge | gating cites; 1 `$pageview`; 4 `captureException` sites | DC+PU | src ✓ | High (gating) |
| OP-22 | 17 promise-swallows + ~20 bare catches, no reporting below boundaries | swallow census; sole counter-example `AudioProvider.tsx:116` | M+DC | spot ✓ | High |
| OP-23 | Four zero-coverage features; largest untested surfaces | census; per-module diffs | M | spot ✓ | High |
| OP-24 | Rules test covers a minority of the rules surface | `firestore-rules.test.ts:73-392` vs `firestore.rules` blocks | DC | src ✓ | High |

---

## 2. Cross-reference: clusters of findings sharing one underlying fact

Multiple families repeatedly cite the same repository fact. For decision purposes each cluster is **one** underlying issue with several lenses — they should be counted once, and any validation answer resolves the whole cluster at once.

| # | Cluster (underlying fact) | Members (by file) | Core evidence | Gating question(s) |
|---|---|---|---|---|
| C1 | **Notification type/vocabulary drift** — 4-value union vs 10 distinct stored values | W-7 · RC-2 · TD-1(a) · R-5(a) · OP-4 · OP-19(a) | `types/index.ts:5` · `notification.actions.ts:209` · `digest.ts:82` · `firestore.rules:39-41` | Q-7 (+Q-5 data sample) |
| C2 | **Migration-era dual machinery** — deprecated fields, dual queries/indexes, backfill, “NOT yet deployed” runbook | RC-3 · CX-1 · TD-1(b–f) · R-5(b,e) · OP-15 | `notification.service.ts:59-63` · `firestore.indexes.json:36-51` · `scripts/backfill-notifications.mjs` · `docs/testing-notifications.md:30` | Q-5, NQ-1 |
| C3 | **The cycle pair** — flashcard↔notifications (value) and admin↔lib/logging (type-only) | W-1+RC-1 (cycle A) · W-2+RC-12 (cycle B) · TD-4 (both) — enabled by W-3, obscured by CX-4 barrels | the four import sites (`ShareModal.tsx:12` … `public.ts:1`) | none — decision-ready |
| C4 | **Survival placement** — one mode's UI route-side, logic feature-side | W-5 · RC-8 · CX-9 · PC-15 · TD-10 · OP-17 | `app/[locale]/(immersive)/kana/survival/_components/` vs `features/kana/` | NQ-5 (label only; decision-ready) |
| C5 | **Unenforced schemas** — zero-consumer “source of truth” validators | W-9 · RC-6 · TD-5 · R-16(a,b) · OP-11 | `card.schema.ts:1-5,63-80` · consumer greps · `validateAtomicCard` sites | Q-12 |
| C6 | **Analytics zeros** — read-but-never-written collections with fabricated fallbacks | W-11 · RC-5 · TD-8 · R-19(partial) · OP-16 · CX-12(context) | `analytics.service.ts:29,37-49` · `user.service.ts:65,96-104` · writer grep → 0 | Q-9 |
| C7 | **Cookie/proxy auth gate** — presence-only edge check over a JS-readable token mirror | W-15 · RC-4 · TD-15 · R-11 · CX-6 (+W-20a allowlists) | `proxy.ts:44-48,81-97` · `cookie.ts:1-25` | none for mechanics; D-2 App Check refines; NQ-2 for allowlists |
| C8 | **Coverage topology** — well-tested leaves, untested core services/hooks/RBAC | W-16 · TD-2 · OP-23 · OP-24 (+R-15 harness cost; strength-side S-10/S-11) | exhaustive test census; `resolveRole` 0 test refs; rules-test block map | none — decision-ready |
| C9 | **Knowledge concentration** — one author, out-of-band rituals, undocumented env | W-6 · R-12 · TD-13 · RC-10(amplified) · W-20(c) (mitigation: S-20) | `git shortlog` · README/env absences · `setCustomUserClaims` grep → 0 | Q-10 (bootstrap ritual), Q-1 (env) |
| C10 | **Three write-path families** | W-12 · RC-11 · CX-3 · PC-5 · OP-1 (contrast PC-6: single API surface) | `safe-action.ts:14-31` + family cites | NQ-9 (B/C convergence intent) |
| C11 | **Shared-deck access predicate ×3 (+inline re-derivations)** | W-13 · RC-9 · TD-9 · OP-5 · OP-20 (+OP-24: rules side untested) | `shared.service.ts:186` · `shared-preview.service.ts:76` · `firestore.rules:29-31` · inline sites | none for the divergence; OP-5's semantic diff is decision-ready |
| C12 | **Dormant capability stratum** — inactive kinds, unemitted actions, Drawer, Storybook, fan-out, `canChangeSettings`, PostHog promise | W-8 · W-10 · W-21(b,c) · RC-7 · CX-7 · TD-6/7/11/12 · OP-8/9/10/12/13/14 | per-item producer/consumer greps | Q-6, Q-8, Q-11, Q-13, Q-17, NQ-3 |
| C13 | **Swallowed errors / dark telemetry** | W-17 · R-6 · PC-13 · OP-21 · OP-22 — *dual reading:* the same sites are strength-side deliberate policy in S-12/S-21 | swallow census; 4-boundary Sentry surface; gating cites | Q-4 (whether anything reports in prod) |
| C14 | **Config-sync hazards** — allowlists ×2, APP_ID ×2, SITE_URL localhost, no `.env.example` | W-20 · CX-6(a) · CX-11/TD-16/R-14 (APP_ID) · TD-14/R-13 (SITE_URL) · TD-13 (env docs) | `proxy.ts:9-18` vs `providers.tsx:24` · `app-id.ts:1` vs `fanout.ts:126` · `site.ts:1-5` | NQ-2; Q-2; Q-6/D-6 |
| C15 | **Mega-feature concentration** | W-4 · CX-2 · R-4 · OP-18 (+TD-3: the hot oversized files are flashcard's) | size/churn measures | none — facts ready; weight is judgment (bucket 3) |
| C16 | **Meta-pattern: unrecorded completion state** — six RCs and the CX closing note reduce to “staged work whose later step has no recorded status” | RC-2/3/5/6/7/10 · CX-7 · CX closing note · (TD-1/5/6/7/8 are its instances) | the per-instance cites above | the entire Q/NQ catalogue is, in effect, this cluster's resolution |

**Reading note.** Cluster C16 is the corpus's own meta-finding, stated independently by 04 (cross-cutting observation) and 05 (closing note): the majority of bucket-2 residency in `10-Decision-Readiness.md` traces to this single generator. Clusters C3, C4, C8, C11(OP-5), C15 are fully decision-ready; C1/C2/C5/C6/C12/C13 are the validation-blocked mass.
