# 09 — File Move Map

Every proposed move, with import impact measured (grep-counted consumers) and risk. **No file has been moved.** All moves are `git mv` + import-path rewrites only — file contents byte-identical unless a row says otherwise. Barrel updates (removing the old `shared/*/index.ts` line, adding to the target barrel where conventions call for it) ride along with each move.

## Group A — shared → feature (12 files + 2 splits; from doc 07)

| # | Current | Target | Import sites to rewrite | Risk |
| --- | --- | --- | --- | --- |
| A1 | `shared/components/ui/SettingsMenu.tsx` (+`.browser.test.tsx`) | `features/kana/hub/components/` | 1 (`KanaHub.tsx`) + shared/ui barrel line | Low. Screenshot baselines for the browser test may need re-pathing (vitest browser names artifacts by file path) |
| A2 | `shared/components/ui/ModeSelectionCard.tsx` | `features/kana/quiz/components/` | 1 (`QuizSetup`) + barrel | Low |
| A3 | `shared/components/ui/DatePicker.tsx` (+test) | `features/admin/components/shared/` | 1 (`AdminDateRangeFilter`) + barrel | Low; same screenshot note as A1 |
| A4 | `shared/utils/romaji.ts` | `features/kana/utils/` (new dir) | 2 (`quiz/hooks/useQuizState.ts`, `survival/hooks/useDropMode.ts`) + shared/utils barrel | Low. New dir arrives with ≥2 files (A4 + kanaDistractors from C1 + formatTime from A8) |
| A5 | `shared/utils/shareToken.ts` | `features/flashcard/utils/` | 4 service files + 1 emu test + barrel | Low |
| A6 | `shared/utils/reorder.ts` (+`.test.ts`) | `features/flashcard/utils/` | 8 flashcard files + barrel | **Medium — content freeze required**: carries the L11 legacy-order compat (doc 03). Move must be `git mv` byte-identical; any "tidy while moving" is forbidden |
| A7 | `shared/schemas/lesson.schema.ts` (+test) | `features/flashcard/types/` | 7 flashcard files + shared/schemas barrel | **Medium — gated cargo**: `privacyModeSchema`/`publicRoleSchema` (Q-12, LDG-04/05) ride along. Same-change obligation: update both ledger rows' path references. Delete nothing |
| A8 | `shared/utils/time.ts` — **split** | `isOnline` → `features/admin/utils/`; `formatTime` → `features/kana/utils/`; delete emptied file | admin: 1 · kana: 2 (`MatchPlaying` uses flashcard's own? no — verify at execution: grep shows kana consumers) + barrel | Low-medium: split = 2 new homes + 1 file deletion; verify no lingering `@/shared/utils` `formatTime` import |
| A9 | `shared/utils/colors.ts` — **split** | `hexToThemeColor` → `features/flashcard/utils/`; `SEMANTIC_STATUS` stays in slimmed `colors.ts` | flashcard: consumers of `hexToThemeColor`; shared/ui keeps `SEMANTIC_STATUS` | Low |
| A10 | `shared/schemas/comment.schema.ts` (+test) | `features/flashcard/services/` | 3 (comment-validation, CommentInput, CommentPanel) + barrel | Low |
| A11 | `shared/schemas/ai-generate-input.schema.ts` (+test) | `features/flashcard/builder/` | 1–2 (builder hooks/panel) + barrel | Low. Fix the `AIGenerateMode` doc-comment here too (D3, doc 04) |
| A12 | `shared/schemas/ai-output.schema.ts` (+test) | `features/ai/schemas/` — **rename** (e.g. `generated-output.zod.ts`) | 1 (`gemini-parsing.ts`) + barrel | Low; rename avoids collision with the prompt-example JSON modules already in target dir |
| A13 | `shared/hooks/useNow.ts` | `features/notifications/hooks/` (new dir) | 2 (`NotificationsVirtualList.tsx`, `domain/format.ts`) + shared/hooks barrel | Low. **Sequencing:** doc 05 M1 moves `formatRelativeTime` → `shared/utils/`; if M1 lands first, `format.ts`'s `useNow` coupling changes — do A13 and M1 in the same PR to avoid churn |
| A14 | `shared/hooks/usePrefersReducedMotion.ts` | `features/game/hooks/` | 1 (`GameResultsScreen`) + barrel | Low |

Declined moves (recorded so they aren't re-proposed): `Modal.tsx`, `Textarea.tsx` (primitive-family), `UserAvatar.tsx` (investigate only), `NotFoundScreen.tsx`, `UserMeta.tsx`, `Alert.tsx` (weak-but-sufficient shared standing).

## Group B — route-layer logic → features (from doc 06 §3)

| # | Current | Target | Import impact | Risk |
| --- | --- | --- | --- | --- |
| B1 | `app/[locale]/(main)/notifications/page.tsx` (202 ln) — screen body | New `features/notifications/components/NotificationsInbox.tsx`; page becomes thin mount | Page keeps its route identity; `NotificationsPlaceholders` in `_components` moves with it or gets imported by the feature | Low-medium: pure relocation, but big diff; verify with existing browser tests + manual smoke |
| B2 | `app/[locale]/login/page.tsx` (149 ln) — flow logic | `features/user` (`useLoginFlow` hook or `LoginScreen` component) | Page keeps route + thin mount | Low-medium: auth path — E2E `auth.spec.ts` is the regression net |
| B3 | `app/[locale]/(main)/profile/page.tsx:29` — level/accuracy math only | `features/user` domain helper (e.g. `domain/progression.ts`) | 1 page | Low. Screen itself stays route-side |
| B4 | `SharedLessonPageClient.tsx:176-226` — `handleDuplicate` body | New `duplicateLesson` in `features/flashcard/services/` | 1 client component | **Medium**: touches the save path; removes `as unknown as Lesson` casts and re-uses `domain/srs.ts` defaults instead of hand-copied values. Needs an emu-test before the move (currently untested logic) |

## Group C — in-feature tidy (from docs 04/06)

| # | Current | Target | Import impact | Risk |
| --- | --- | --- | --- | --- |
| C1 | `features/kana/hooks/kanaDistractors.ts` (+test) | `features/kana/utils/` | 1 (`useKanaQuizSession.ts`) | Low |
| C2 | `features/flashcard/games/match/hooks/matchGrid.ts` | `features/flashcard/games/match/` | in-module relatives | Low |
| C3 | `features/notifications/components/withFreshToken.ts` | `features/notifications/services/` | in-feature relatives | Low |
| C4 | `features/notifications/schema.ts` (+`schema.test.ts`) | `features/notifications/domain/` | grep-count at execution (feature-internal + possible server.ts) | Low |
| C5 | `features/admin/components/shared/` table engine (`DataTable*`, `AdminTable*` ≈6 files) | `features/admin/components/table/` | admin-internal + `components/index.ts` | Low; mechanical |
| C6 | `features/admin/components/content/index.ts` | **delete** (D1) | 0 importers (verified) | None |
| C7 | Empty `app/.../kana/survival/_components/` | **rmdir** (D5) | 0 | None |

## Execution rules (bind all groups)

1. One group ≠ one commit: each **row** is independently revertable; batch only rows touching disjoint files.
2. `git mv` so history follows; no content edits in the same commit as a move **except** the import-path rewrites it forces.
3. After each batch: `npm run lint` (the import-boundary zones will catch wrong-direction rewrites), `npm test`, `npm run test:browser` for component moves, full `next build` (the pre-commit hook runs it anyway).
4. A6/A7 (compat/gated cargo): reviewer must diff-confirm byte-identical content post-move; A7 additionally updates LDG-04/05 path references in `docs/migrations-ledger.md` in the same PR.
5. ESLint zone check: moves into features change what the `import/no-restricted-paths` zones see — `shared→feature` moves are direction-safe by construction (consumers are in the same feature), but run the probe suite anyway.
