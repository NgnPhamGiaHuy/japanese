# 06 — Feature Structure Analysis

Per-feature internal shape, ownership calls, and the de-facto standard derived from data. Boundary health headline: **zero runtime deep cross-feature imports, zero `features→app` imports, zero `shared→features` imports; all 9 features have curated, documented barrels; both mandated sub-module regimes (flashcard, kana) are fully barreled.** The modernization's structural work (ADR-101/104, T-104a/105a/105b) held.

## 1. Per-feature verdicts

| Feature | Files | Verdict | Notes |
| --- | --- | --- | --- |
| **game** | 23 | ✅ Exemplary | Leaf-dependency contract stated in barrel and verified (imports nothing; consumed by flashcard×27, kana×8, home, user — all barrel-level). One naming wobble: `services/persist-best-score.ts` among `*.service.ts` siblings |
| **user** | 17 | ✅ Clean | Fully norm-conformant. Its gap is what it *doesn't* own: login screen + XP/level math live in `app/` (§3) |
| **ai** | 26 | ✅ Clean | Root `types.ts`/`config.ts` files instead of dirs — fine at this size. Its `prompts/schemas` (JSON examples for the model) deliberately mirror `shared/schemas/ai-output.schema.ts` (zod) — documented two-site invariant, not duplication debt |
| **command-palette** | 5 | ✅ Clean | Barrel is the only one without a doc header (P4). `data/actions.ts` mirrors BottomNav's route list by comment convention only — silent coupling, nothing enforces agreement (§4) |
| **home** | 4 | ✅ Clean, one leak | The repo's **only deep cross-feature imports**: `useHomeState.browser.test.tsx:20-21` (type-only, test-only) reach into `flashcard/utils/learningEngine` and `user/types/user.types` — because `UserData` isn't exported from user's barrel at all. Fix = export the types, not move files |
| **kana** | 66 | ✅ Clean with nits | 3 single-file dirs (`hub/components/`, `hub/hooks/`, `practice/utils/`); `store.ts` loose at root (repo's only zustand store — acceptable one-off); `hooks/kanaDistractors.ts` is a non-hook module in `hooks/`; **over-exported barrel**: `TIME_ATTACK_MAX_STREAK_BONUS_SEC`/`TIME_ATTACK_WRONG_PENALTY_SEC` re-exported at root with zero consumers outside kana (verified) |
| **flashcard** | 166 | ✅ Remarkable for its size | ADR-104 worked. Nits: `services/` is 22 files flat (prefix-grouped informally — split only if it grows); `games/match/hooks/matchGrid.ts` non-hook in `hooks/`; `games/speed/engine/{core,memory,questions}` is the repo's deepest nesting (5 levels) — earned complexity, leave it. Root `notifications.ts` is the documented ADR-102 seam registration, not debt |
| **admin** | 113 | ✅ Clean with nits | `components/shared/` is a 20-file grab-bag of three concerns: admin chrome, the DataTable engine (6+ files incl. `hooks/useDataTable.ts`), and inputs/filters — extract the table-engine grouping. Sub-barrel coverage inconsistent (content/reports/shared have barrels; analytics/dashboard/users don't). `context/` is single-file |
| **notifications** | 40 | ⚠️ Feature clean, **screen mis-homed** | The only material T-105b breach: the 202-line inbox page lives in `app/`, while the feature exports only the parts (§3.1). Also: `components/withFreshToken.ts` is a utility in `components/`; root `schema.ts` would sit naturally in `domain/`; `types/index.ts` declares types directly (all siblings use `*.types.ts`) |

## 2. Cross-feature import matrix (all barrel-level unless noted)

| From \ To | flashcard | admin | kana | notif | ai | game | user |
|---|---|---|---|---|---|---|---|
| admin | 4 + 2×`/server` | — | | 1×`/server` | | | |
| command-palette | | 1 | | | | | |
| flashcard | — | | | 4 | 6 | 27 | 3 |
| home | 3 (+1 deep, test-only) | | 1 | | | 2 | 1 (+1 deep, test-only) |
| kana | | | — | | | 8 | 5 |
| user | | | | 1 | | 1 | — |

Leaves (import nothing): **ai, game, notifications**. The ADR-102 flashcard→notifications seam is verified intact — flashcard registers handlers into notifications, never the reverse.

## 3. Route layer (`app/`) — where the real findings are

Thin-orchestrator status verified page-by-page. Compliant: all kana pages (5–9 lines), all admin pages (12–27), all 9 immersive game pages (31–46), `flashcard/create` (36), the flashcard detail/edit pages (119/106 — borderline but defensible: guards + wiring, no domain rules), `shared/[shareId]/page.tsx` (100 — legitimate server-side metadata/JSON-LD).

**Logic-bearing route files (the T-105b residue):**

| # | File | Lines | Problem | Disposition |
| --- | --- | --- | --- | --- |
| 1 | `(main)/notifications/page.tsx` | 202 | Full inbox screen: filter state, unread rule, mark-all-read + clear-all-with-undo orchestration. The feature exports all the pieces; assembly lives route-side | **Move**: create `NotificationsInbox` screen root in `features/notifications/components/`, page becomes a thin mount |
| 2 | `login/page.tsx` | 149 | Popup→redirect fallback policy + auth error-code→message mapping — auth-flow logic; `user` already exports all three sign-in functions for exactly this screen | **Move** logic into `features/user` (e.g. `useLoginFlow` hook) |
| 3 | `(main)/profile/page.tsx` | 226 | `level = Math.floor(userData.xp / 500) + 1` (line 29) + accuracy aggregation — progression domain rules defined nowhere else | **Move the math** to a `features/user` domain helper; screen itself can stay route-side (§5) |
| 4 | `(main)/flashcard/shared/[shareId]/SharedLessonPageClient.tsx:176-226` | 272 | `handleDuplicate` hand-builds duplicated lesson/cards incl. SRS reset values (`easeFactor: 2.5, interval: 0, repetitions: 0`) duplicated from `domain/srs.ts`, with `as unknown as Lesson` casts as the tell | **Move**: a `duplicateLesson` service in flashcard; medium risk (touches save path) |
| 5 | `(main)/settings/SettingsPageClient.tsx` | 301 | Largest route file; 4 locally-defined components; self-contained, no feature home | **Leave** (INVESTIGATE only if it grows — don't create a feature for symmetry) |

`app/_components` (ErrorFallback, MaintenanceScreen, ReactScan) and `BottomNav` are all correctly homed root-layout/error infrastructure with exactly the consumers they should have.

## 4. Ownership calls

| Item | Current home | Verdict |
| --- | --- | --- |
| `shared/utils/romaji.ts` (`getValidRomaji`, `checkTypedAnswer`) | shared | **MOVE_TO_FEATURE(kana)** — consumed only by `kana/quiz` + `kana/survival`; kana domain logic |
| `shared/utils/shareToken.ts` | shared | **INVESTIGATE** — flashcard-only (re-exported through flashcard's barrel); its "dependency-free for server bundles" justification predates `flashcard/server.ts` existing |
| `shared/utils/atomicCard.ts` | shared | KEEP_SHARED — flashcard + ai, explicitly documented as owned by neither |
| `shared/schemas/*` | shared | KEEP_SHARED — deliberate zod-contract layer (the Q-12-gated three aside) |
| flashcard's `DeckCard` + `ShareModal` consumed by home | flashcard | KEEP — domain-specific components; the barrel export is the right mechanism, promotion to shared would be wrong |
| game's component set consumed by 2 features | game | KEEP — game *is* the shared game-UI platform by design |
| command-palette route list ↔ BottomNav | both | INVESTIGATE — silent comment-only coupling; a shared route-registry constant would enforce agreement, but is new abstraction (weigh in doc 10) |

**No shared-promotion candidates found** — nothing inside a feature is consumed by 2+ other features outside the sanctioned barrel mechanism.

## 5. The de-facto standard (from data, n=9)

Directory patterns by adoption: `index.ts` curated barrel 9/9 (doc-commented 8/9) · `hooks/` 7 · `services/` 6 · `components/` 6 · `actions/` (`*.actions.ts`, zero deviations) 5 · `types/` dir 5 · `context/` 4 · `domain/` 4 · sub-modules with own barrels 2 (flashcard, kana) · `server.ts` 2 (flashcard, notifications).

Settled two-tier type convention: `types/*.types.ts` at feature level, plain `types.ts` file at sub-module level (8 sub-module dirs follow this).

Naming norms and their total deviation count across 469 files: hooks `useX.ts` (2 deviations: `kanaDistractors.ts`, `matchGrid.ts`) · services `*.service.ts` or kebab-case helpers (1: `persist-best-score.ts`) · actions `*.actions.ts` (0) · tests colocated, `__tests__/` only for fixtures/harnesses (0).

This becomes the normative standard in doc 08 — the codebase already follows it; the standard is descriptive, not aspirational.

## 6. Consolidated structural-debt register

Carried to docs 08–10: (a) notifications inbox screen move; (b) login-flow logic move; (c) profile level-math move; (d) `duplicateLesson` service extraction; (e) `romaji.ts` move to kana; (f) `shareToken.ts` investigation; (g) admin table-engine grouping split; (h) home test-import barrel fix (+ lint-zone test-file exemption check); (i) kana barrel over-export trim; (j) 6 single-file dirs (flatten-or-leave); (k) 3 naming renames; (l) `withFreshToken.ts` + `schema.ts` relocations in notifications; (m) command-palette↔BottomNav coupling; (n) `.DS_Store` local noise (gitignored, delete locally); (o) admin sub-barrel consistency.
