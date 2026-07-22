# 05 — Duplicate Implementation Audit

Findings ordered by actionability. The modernization already consolidated the big duplications (theme-color resolvers, SRS math, pass-through wrappers, action clients, table engine, dialog backdrops) — what remains is small and mostly accidental.

## 1. MERGE — accidental duplication (3 groups, all size S)

| # | Group | Implementations | Canonical | Evidence & note |
| --- | --- | --- | --- | --- |
| M1 | **Relative-time formatter** | `notifications/domain/format.ts:14` `formatRelativeTime(ts, now)` (pure, injected clock, tested) vs `flashcard/sharing/components/comments/CommentItem.tsx:62` local `relativeTime(ts)` | notifications version | **Verified line-for-line identical** ("just now / Xm / Xh / Xd / MMM d", both `en-US`). Only difference: CommentItem calls `Date.now()` directly — comments **don't tick live**, a regression vs notifications, not a specialization. notifications→flashcard imports are forbidden (ADR-102), so merge target is `shared/utils/` (joins the time helpers). Merging fixes the tick regression as a side effect |
| M2 | **Admin date-column format** | date-fns `format(d,"MMM d, yyyy")` (English-fixed): `useDecksTableColumns.tsx:121`, `DeckMobileRow.tsx:96` — vs `toLocaleDateString(undefined,…)` (viewer-locale): `useUsersTableColumns.tsx:98,125`, `UserMobileRow.tsx:81`, `AnalyticsDetailModal.tsx:86` | one new `formatAdminDate` in `features/admin/utils/` | Same visual intent, inconsistent locale behavior across adjacent admin tables — user-visible drift, accidental |
| M3 | **Inline `toActionResult` copy** | `notifications/actions/notification.actions.ts:116-118` hand-inlines the serverError/validationErrors→`{ok,…}` adaptation that `lib/safe-action.ts` exports (LDG-21's docblock explicitly names it the long-lived shared adapter) | `toActionResult` | **Verified**; already diverging (`"invalid-input"` vs canonical `"Invalid input"`). 1 call site, trivial |

Also M-adjacent: **hand-rolled spinners** in `CommentInput.tsx:148` + `CommentPanel.tsx:139` (the `animate-spin rounded-full border-2` div) — shared `LoadingSpinner` has ~23 consumers; `Button` already renders `Loader2` when loading. 2 sites, size S.

## 2. INVESTIGATE — needs a judgment call (4 groups)

| # | Group | Detail | Recommendation |
| --- | --- | --- | --- |
| I1 | **Progress-collection listeners hand-rolled in hooks** | `progress.service.ts` exports only refs, so `useCardsWithProgress.ts` and `useDeckProgressStatus.ts` each hand-roll `onSnapshot` on the same `userProgressLessonCol` — 2 listener leaks outside the services-own-IO norm (plus 1 benign query-builder leak in `useEditableLesson`, documented; `user/hooks/useFirebaseAuth.ts` is the sanctioned auth entry) | Add `subscribeLessonProgress` to `progress.service.ts`; both hooks consume it. Closes the dup **and** the boundary leak — highest-value item in this doc |
| I2 | **Survival game-over screen vs `GameResultsScreen`** | `game/components/GameResultsScreen.tsx` (170 ln; confetti/tier/StatGrid/XP/Leaderboard; consumers: SpeedResults, MatchResults) vs `kana/survival/components/SurvivalGameOverScreen.tsx` (74 ln) — same shell/skeleton hand-rolled, skips tier/stats/confetti, adds a third button. Survival already imports `Leaderboard` from game, so the dependency exists. `QuizResults.tsx` (68 ln) is materially less overlapping — genuine specialization | Adopt `GameResultsScreen` with optional-section props for survival (size M); leave QuizResults |
| I3 | **`SharePrivacyPicker` hand-rolled dropdown** | `flashcard/sharing/components/SharePrivacyPicker.tsx:105` — manual open-state + `fixed inset-0` click-away scrim; repo convention is Base UI (`Menu.Root`/`Select`, the latter imported *in this same file*). The only hand-rolled popover in the codebase; loses focus/escape/keyboard behavior | Migrate to Base UI menu (S/M). Behavior change (a11y gain) — not a pure cleanup, schedule consciously |
| I4 | **No shared Skeleton primitive** | 3 domain-shaped skeleton screens + ~16 ad-hoc `animate-pulse` sites; only the pulse-block atom is common | Low value; take only if a 4th skeleton appears |

## 3. KEEP_BOTH_INTENTIONAL — verified healthy

- **NotificationsVirtualList vs LogsVirtualList** — exemplary: each docblock names the other and justifies the divergence (window-virtualizer inbox vs bounded-panel on the shared `useDataTable` engine).
- **Match/speed/study phase routers** — parallel by design; all lean on `features/game` + `games/hooks`.
- **Per-feature `activity-log.actions.ts`** (flashcard/kana/notifications) — now thin wrappers over `lib/logging/activity.ts`; consolidation already happened.
- **Two pagination mechanisms** (CS-10 rule 6) — **holds**: grow-window (`notification-subscribe.ts`, `useLessons.ts`) + cursor (`admin/hooks/useCursorPagination.ts`). No third mechanism found (`shared-preview.service.ts`'s `limit(1000)` is a sitemap bound).
- **Two `rbac.ts` files** — disjoint role universes (deck-sharing vs admin panel), not duplication.
- **kana `kanaDistractors.ts` vs ai `gemini-distractors.ts`** — unrelated responsibilities (quiz options vs AI decoy tiles).

## 4. Boundary spot-checks (clean)

Dialogs: every `Dialog.Root` is Tier-1 shared or one of the four sanctioned Tier-2 compositions — no hand-rolled dialog/backdrop (I3's scrim is a menu). Forms: all multi-field forms on react-hook-form + zodResolver; ad-hoc validators delegate to shared zod. Error handling: one envelope convention, one `ErrorFallback`. Audio: zero `new Audio`/`AudioContext`/`speechSynthesis` outside `shared/audio`. API wrappers: no fetch wrappers, zero `httpsCallable`, one toast system, one clipboard hook. **LDG-20 check: no growth beyond the recorded 7 hand-rolled server files** — and two of them (`auth-logging.service.ts`, `lib/logging/user-actions.ts`) now partially import `lib/safe-action`, i.e. drift is *toward* the unified client. No duplicate exported function names across features.

## 5. Idiom-level observations (no action)

Full-screen shell class string recurs across ~20 immersive screens (layout-component possible, low yield); `MatchPlaying.tsx:86` inlines `mm:ss` beside `formatTime`'s `m:ss` (intentionally different padding); `CommentItem.tsx:74` `ROLE_COLORS` vs `rbac.ts` `ROLE_CONFIG` split role presentation across two maps (cosmetic); admin `user.service.ts` inline role string-compares are deliberate flag-vs-claim separation.

## 6. Score card

| Classification | Count |
| --- | --- |
| MERGE (S) | 3 groups + 1 spinner pair |
| INVESTIGATE | 4 (1 high-value: I1) |
| KEEP_BOTH_INTENTIONAL | 6 verified |
| Boundary violations found | 2 listener leaks (I1) — no others |
