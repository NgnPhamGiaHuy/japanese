# 10 — Cleanup Candidates (master list, final decision-gate classification)

Single source of truth. Only `SAFE_TO_DELETE` / `SAFE_TO_MOVE` / `SAFE_TO_MERGE` may proceed without further decisions. Every ID traces to its evidence doc.

## SAFE_TO_DELETE (6 items + barrel trims)

| ID | Item | Evidence |
| --- | --- | --- |
| D1 | `features/admin/components/content/index.ts` (redundant barrel, 0 importers) | 04 §1 (re-verified) |
| D2 | `getComments` + its test case (`comment.service.ts:199`) | 04 §1 (re-verified) |
| D3 | `AIGenerateMode` type + `ai/index.ts:20` line (+ fix the stale mention in `ai-generate-input.schema.ts:5`) | 04 §1 |
| D4 | `signOutUser`, `wipeDoc` (unused test helpers, `__tests__/emu-auth.ts`) | 04 §1 |
| D5 | Empty dir `app/[locale]/(immersive)/kana/survival/_components/` (`rmdir`) | 04 §1 |
| D6 | Stale comments: Storybook reference in `vitest.browser.config.ts:~36`; "Legacy or computed" docblock on `isPublic` (`flashcard.types.ts:152` — field is live, docblock wrong) | 04 §4, 03 §4 |
| D7 | Clear barrel over-export trims (8 groups, ~20 lines): admin reports/shared barrels, `admin/index.ts:31` types, `flashcard/index.ts:62` `declineInviteAction` line (symbol stays — LDG-20), `flashcard/server.ts` type dupes, `kana/index.ts` 6 names, `kana/survival/index.ts` 4 names, `notifications/index.ts:19-20` | 04 §2 (consumer paths verified). *Caveat: ADR-101 frames barrels as API — if the owner prefers "exported = intentional surface," downgrade any row to KEEP without loss* |

## SAFE_TO_MERGE (4 items)

| ID | Item | Evidence |
| --- | --- | --- |
| M1 | `relativeTime` (CommentItem) ⇒ canonical `formatRelativeTime` relocated to `shared/utils/` (fixes comments' no-tick regression) | 05 §1 (verified verbatim copy) |
| M2 | Admin date-column formatting ⇒ one `formatAdminDate` in `features/admin/utils/` (5 call sites, settles locale inconsistency) | 05 §1 |
| M3 | Inline `toActionResult` copy in `notification.actions.ts:116-118` ⇒ import from `lib/safe-action` | 05 §1 (verified) |
| M4 | 2 hand-rolled comment spinners ⇒ `LoadingSpinner` / `Button` loading state | 05 §1 |

## SAFE_TO_MOVE (23 rows — full impact detail in doc 09)

- **A1–A14** shared→feature: SettingsMenu, ModeSelectionCard, DatePicker, romaji, shareToken, reorder⚠, lesson.schema⚠, time-split, colors-split, comment.schema, ai-generate-input.schema, ai-output.schema (rename), useNow, usePrefersReducedMotion. ⚠A6/A7 carry compat/gated cargo — byte-identical move + ledger path updates (LDG-04/05) in the same PR.
- **B1–B3** route→feature: NotificationsInbox extraction, login-flow logic → user, profile level-math → user domain helper.
- **C1–C5** in-feature tidy: kanaDistractors→utils, matchGrid relocation, withFreshToken→services, notifications schema→domain, admin table-engine → `components/table/`.

## NEEDS_MIGRATION (4 — safe only with tests/design first)

| ID | Item | Why held |
| --- | --- | --- |
| N1 | B4: `handleDuplicate` → `duplicateLesson` service in flashcard | Save-path logic currently untested; write the emu test first, then move |
| N2 | I1: add `subscribeLessonProgress` to `progress.service.ts`; two hooks stop hand-rolling `onSnapshot` | Behavior-preserving refactor of live listeners; needs listener-lifecycle care |
| N3 | I2: SurvivalGameOverScreen adopts `GameResultsScreen` (optional-section props) | UI change, needs visual verification |
| N4 | I3: `SharePrivacyPicker` → Base UI menu | Behavior change (a11y gain, focus/escape) — deliberate, not mechanical |

## NEEDS_PRODUCT_DECISION (6)

| ID | Item | The question |
| --- | --- | --- |
| P1 | `@vitest/coverage-v8` devDependency | Does anyone run ad-hoc coverage? If no → delete |
| P2 | `action-registry.ts` quartet trim (`getNotificationActions`, `hasNotificationActions` test-only) | Trim a 3-sprint-old deliberate API on a usage snapshot, or keep the quartet? |
| P3 | `UserAvatar.tsx` relocation to `app/.../_components/` | Zero feature consumers; move or leave |
| P4 | command-palette route list ↔ BottomNav silent coupling | Introduce a shared route-registry constant (new abstraction) or accept comment-convention |
| P5 | Barrel-trim policy confirmation for D7 | "Unused barrel export = rot" vs "= reserved API" |
| P6 | `makeCard` export serving another module's test fixture | Inline a fixture in `GameEngine.test.ts`, then un-export — trivial but touches another team's test intent |

## NEEDS_PRODUCTION_EVIDENCE (2 clusters — no code action possible now)

| ID | Item | Blocking evidence |
| --- | --- | --- |
| E1 | Everything gated: notifications legacy shape + dual listener + backfill (Q-5/NQ-1), 3 schemas (Q-12), analytics reads (Q-9), Sentry/PostHog (Q-4), fanout (Q-6), SITE_URL (Q-2), APP_ID (Q-6), admin predicates (Q-10), ratchet baseline, LDG-20/21 | The gates themselves — tracked in `docs/migrations-ledger.md`, re-verified in place by this audit (02/03/04) |
| E2 | Flashcard legacy-doc compat cluster (L5/L7/L8/L9/L10/L11/L12 — doc 03 §2) | A lessons/cards backfill that does not exist. **Safe now:** add ledger row (proposed LDG-22) documenting the cluster + its end state — documentation, not code |

## KEEP (recorded so nothing is re-litigated)

All 19 runtime-resilience fallbacks (02 §1) · L6 legacy-role security guard · L13 analytics type-compat · L14 logs adapter · L19 OG-image UA workaround · L20 vocab-checker regex arm · Modal/Textarea (primitive family) · NotFoundScreen/UserMeta/Alert (weak-but-sufficient shared) · game-as-platform, no promotions (07 §5) · QuizResults (real specialization) · both virtual lists · two pagination mechanisms · settings screen route-side · single-file `context/` dirs & kana sub-module dirs (convention consistency) · props-type barrel re-exports (~17, low value to trim) · `react-dom`/`playwright` (peer deps) · all env vars, all i18n namespaces, all feature flags.

## UNKNOWN

None. Every examined item reached a classification.

## P4 cosmetic tail (bundle opportunistically, never a dedicated PR)

`persist-best-score.ts` rename · `prettier` → devDependencies · DialogChrome added to ui barrel · command-palette barrel doc header · UserAvatar `onError` harmonization · ~14 dead type exports in shared/lib + optional audio-barrel type trims · admin sub-barrel consistency (pick one convention) · local `.DS_Store` cleanup (gitignored already).
