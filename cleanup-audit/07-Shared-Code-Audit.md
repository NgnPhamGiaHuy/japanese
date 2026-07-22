# 07 — Shared Code Audit (`shared/` + `lib/`)

Full import-graph trace (2,657 import statements resolved, incl. barrels one hop, dynamic and side-effect imports). `functions/`, `scripts/`, `e2e/` import nothing from `shared/`/`lib/` (verified). **Zero-consumer files: 0.** One near-miss — `shared/audio/unlock.ts` — is alive via side-effect `import "./unlock"` in `manager.ts`.

**Dumping-ground verdict: mild, concentrated in `shared/schemas/`.** 4 of 5 schema modules are single-feature (effectively flashcard-owned). Naming hygiene is good — no `helpers.ts`/`misc.ts`; the generically-named utils (array, time, colors, cookie) all have real multi-consumer usage. `shared/` is not a junk drawer, but it carries a tail of single-feature code that landed there speculatively.

## 1. MOVE_TO_FEATURE — 12 firm candidates (all single-feature consumers, spot-verified)

| Item | Sole consumer(s) | Target | Notes |
| --- | --- | --- | --- |
| `ui/SettingsMenu.tsx` (+browser test) | kana (`hub/components/KanaHub.tsx`) — verified | `features/kana/hub/components/` | Single consumer since inception |
| `ui/ModeSelectionCard.tsx` | kana (`quiz` setup) | `features/kana/quiz/components/` | |
| `ui/DatePicker.tsx` (+browser test) | admin (`AdminDateRangeFilter`) | `features/admin/components/shared/` | Test + screenshots relocate too |
| `utils/romaji.ts` | kana (`quiz`, `survival`) | `features/kana/utils/` (new dir, matches convention) | Kana domain logic (also flagged independently in doc 06) |
| `utils/shareToken.ts` | flashcard (4 service files + emu test) | `features/flashcard/utils/` | Its "dependency-free for server bundles" rationale predates `flashcard/server.ts` |
| `utils/reorder.ts` (+test) | flashcard (8+ files) — verified | `features/flashcard/utils/` | ⚠️ Contains the L11 legacy-order compat (doc 03) — move must not alter behavior; `OrderedEntity` export is test-only |
| `schemas/lesson.schema.ts` (+test) | flashcard (7 files) | `features/flashcard/types/` or services-adjacent | ⚠️ Carries Q-12-gated `privacyModeSchema`/`publicRoleSchema` — **update ledger rows LDG-04/05 with the new path; do not delete** |
| `schemas/comment.schema.ts` (+test) | flashcard (comment-validation, CommentInput, CommentPanel) | `features/flashcard/services/` (next to comment-validation.ts) | |
| `schemas/ai-generate-input.schema.ts` (+test) | flashcard (`builder/useAIBulkForm`) — verified; features/ai never imports it despite the name | `features/flashcard/builder/` | |
| `schemas/ai-output.schema.ts` (+test) | ai (`gemini-parsing.ts`) | `features/ai/schemas/` | Target dir holds prompt-example JSON modules with colliding names — rename on arrival (e.g. `generated-card.zod.ts`) |
| `hooks/useNow.ts` | notifications (VirtualList + `domain/format.ts` — 2 files, one feature) | `features/notifications/hooks/` (new dir) | |
| `hooks/usePrefersReducedMotion.ts` | game (`GameResultsScreen`) | `features/game/hooks/` (exists) | |

**Per-export splits (2):** `utils/time.ts` — `isOnline` is admin-only → `features/admin/utils/`; `formatTime` is kana-only → kana; the split empties the file. `utils/colors.ts` — `hexToThemeColor` is flashcard-only → `features/flashcard/utils/`; `SEMANTIC_STATUS` stays shared (Alert/Badge/ConfirmModal).

**Weak candidates (recommend KEEP):** `ui/Modal.tsx` (admin-only today, but part of the documented Modal/ConfirmModal/DialogChrome primitive family) and `ui/Textarea.tsx` (flashcard-only, but part of the Input/Select/Textarea family). Moving primitives out of a design-system family for a usage-count snapshot is churn; the family argument wins.

**INVESTIGATE (1):** `ui/UserAvatar.tsx` — zero feature consumers; used only by `app/.../BottomNav.tsx`. Candidate home: `app/[locale]/(main)/_components/`. Low value either way.

## 2. KEEP_SHARED — confirmed multi-consumer core (~40 items)

- **ui:** Button (7 features + app), Card, ConfirmModal, EmptyState, LoadingSpinner, Badge, Input, Select, ActionCard, StatCard, UserMeta, NotFoundScreen (weak — app-only but generic 404), Alert (via AlertProvider → 3 consumers), DialogChrome (admin + command-palette + flashcard + shared — *nit: not exported from the ui barrel, consumers deep-import; add to barrel for consistency*)
- **layout:** ScreenHeader family (app, flashcard, kana)
- **utils:** cn, array/shuffleArray (26 uses), cookie/COOKIE_NAME (admin, user, proxy), atomicCard (flashcard + ai, documented as owned by neither)
- **schemas:** card.schema.ts stays — coupled to atomicCard, transitively serves ai; carries Q-12-gated `cardContentSchema` (recorded)
- **hooks:** useCopyToClipboard (app, admin, flashcard)
- **constants:** styles.ts (app, flashcard, home), public-routes.ts (proxy + lib — deliberate edge/render split, T-118a)
- **providers:** AlertProvider (app, flashcard, notifications, lib)
- **audio (all 11 modules):** ADR-001 settled infrastructure; external consumers flashcard + kana; test-only seams are sanctioned in the barrel docs

## 3. `lib/` — all 24 modules KEEP (infrastructure) or GATED

Highlights: `safe-action.ts`'s `toActionResult` (LDG-21) has live admin consumers — the ledger keep is validated. `logging/actions.ts` + `user-actions.ts` match their LDG-20 record (lib-internal only). Gated: `flags.ts` (kill switch), `site.ts` (Q-2), `app-id.ts` (Q-6 — and multi-feature anyway), `posthog.ts`/`PostHogProvider.tsx` (Q-4). Weakest live chain verified end-to-end: `posthog.ts` ← `PostHogProvider` ← `providers.tsx` ← root layout.

## 4. Dead *exports* (~14 names — no dead runtime code)

All are never-imported **type** exports or unnecessary `export` keywords on internally-used values. Trim opportunistically (P4), never worth a dedicated PR:

- `shared/audio`: `SequenceOptions`, `SequencePolicy`, `SequenceStatus`, `SequenceStep`, `AudioEventSink`, `PlaybackStatus`, `VoicePlaybackOptions`, `SpeechPolicyInput`; `isListeningType`'s export keyword (used internally only). Counterpoint: the audio barrel docblock frames types as documented public API — trimming is optional.
- `shared/utils/colors.ts`: `SemanticStatus` type; `shared/constants/public-routes.ts`: `PublicRoute`/`PublicRouteKind` types, `PUBLIC_ROUTES` (test-only)
- `lib`: `logging/public.ts` `inferLogTypeFromEntity` export keyword; `logging/schema.ts` two internal schemas; `fonts.ts` three internal font exports; `flags.ts` `FlagKey`/`Flags` types
- `shared/audio/index.ts` barrel type re-exports `AudioStatus`, `PlaybackHandle`, `SfxCue`, `SpeakOptions` (value API all heavily used: `playSfx` 25, `speak` 33, `sequence` 17)

## 5. Promotion candidates (inverse check — feature code acting as shared)

`features/game` operates as a de-facto shared library (LivesDisplay, MiniLeaderboard, useGameSession, comboMultiplier, GameStatEntry, subscribeGameStats — consumed by flashcard, kana, home, user). `features/user`'s `useUserProgress` serves flashcard, home, kana, app. `features/notifications`' `emitNotification` serves flashcard + app. **All flow through barrels and are lint-legal.** Promotion to `shared/` would only matter if the team wants shared/ to be the *sole* cross-feature layer — the current ADR-101 position (features may consume other features' barrels) makes these correct as-is. **Recommendation: no promotions.** `game` being a platform-feature is its documented design.

## 6. Score card

| Classification | Count |
| --- | --- |
| KEEP_SHARED / KEEP | ~40 files |
| MOVE_TO_FEATURE (firm) | 12 files (+2 per-export splits) |
| MOVE weak / declined | 2 (Modal, Textarea — family argument) |
| INVESTIGATE | 1 (UserAvatar) |
| **DELETE (files)** | **0** |
| Dead exports (P4 trims) | ~14 names |
| GATED confirmed in place | 8 |
