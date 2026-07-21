# 05 — Hook Inventory

Discovery-phase documentation. Source of truth: the code under `/Users/yuh.nguyenpham/GitHub/japanese/src/` as of the current working tree. All relative paths below are relative to that `src/` directory.

## Scope and method

- **Observed**: Enumerated every `use*.ts` / `use*.tsx` file under `src/features/`, `src/shared/`, `src/app/`, `src/lib/` with `find` (excluding `node_modules`). Files matching the `use*` glob that are not hooks (`user.service.ts`, `user.types.ts`, `user-actions.ts`, `*.emu.test.ts`) are excluded here and covered in `06-Service-Inventory.md`.
- **Observed**: Additionally grepped for `export (function|const) use[A-Z]` to catch hooks defined in files not named `use*` — this found hooks in `features/admin/context/AdminContext.tsx`, `features/kana/store.ts`, `features/notifications/context/NotificationsContext.tsx`, `lib/app-store.ts`, `shared/providers/AlertProvider.tsx`, and a second hook (`usePublicLessons`) inside `features/flashcard/hooks/useLessons.ts`.
- "Used by" lists come from grepping each hook name across `src/` (excluding its own definition file, tests, and `node_modules`). Barrel `index.ts` re-exports are omitted from the lists.

## Totals

| Group | Hooks |
|---|---|
| Admin | 15 |
| AI | 5 |
| Flashcard — core (`features/flashcard/hooks/`) | 16 |
| Flashcard — dashboard | 2 |
| Flashcard — games | 6 |
| Flashcard — loaders | 1 |
| Game | 2 |
| Home | 1 |
| Kana | 9 |
| User | 4 |
| Notifications | 1 |
| Shared / lib | 6 |
| **Total** | **68** |

---

## Admin (15)

All under `features/admin/`. Every data hook goes through `useAdminToken` for a fresh Firebase ID token and calls server actions from `features/admin/actions/admin.actions.ts` (see 06-Service-Inventory).

| Hook | File | Purpose (from docblock/code) | Params → Return | State managed | Services / actions called | Used by |
|---|---|---|---|---|---|---|
| `useAdminToken` | `hooks/useAdminToken.ts` | Returns a callback that resolves the current user's Firebase ID token (throws if unauthenticated) | `()` → `() => Promise<string>` | none (reads `useAppStore` user) | `user.getIdToken()` (Firebase Auth) | all other admin data hooks (`useAdminDashboard`, `useAdminRoleCheck`, `useUsers`, `useLogs`, `useAnalytics`, `useAnalyticsDrilldown`, `useAnalyticsExport`, `useGlobalContent`) |
| `useAdminRoleCheck` | `hooks/useAdminRoleCheck.ts` | Resolves current user's admin role via server-verified ID token; single source of truth for the admin role check (docblock, lines 15–23) | `()` → `{ role, isAdmin, isLoading }` | `useState` role/isLoading; reads `useAppStore` | `fetchAdminRoleAction` | `context/AdminContext.tsx` |
| `useAdminRole` | `context/AdminContext.tsx` (line 26) | Context consumer for the admin role resolved once by `AdminProvider` | `()` → `{ role, isLoading }` | `useContext` | — | 7 files grep-match `useAdminRole` incl. the provider; consumers are admin guard/layout components |
| `useAdminDashboard` | `hooks/useAdminDashboard.ts` | Dashboard overview query | `()` → TanStack `useQuery` result | react-query cache (`adminQueryKeys.dashboard()`) | `fetchDashboardOverviewAction` | `components/dashboard/AdminOverviewPage.tsx` |
| `useAnalytics` | `hooks/useAnalytics.ts` | Analytics dataset query | `()` → `useQuery` result | react-query (`adminQueryKeys.analytics()`) | `fetchAnalyticsAction` | `components/analytics/AdminAnalyticsPageContent.tsx` |
| `useAnalyticsDrilldown` | `hooks/useAnalyticsDrilldown.ts` | Manages analytics drilldown modal state, selection, and query fetching; supports log-derived drilldowns (docblock lines 31–37) | `()` → `{ selection, data, isLoading, error, openDrilldown, closeDrilldown }` | `useState` selection + react-query | `fetchDrilldownUsersAction`, `fetchDrilldownFeatureAction`, `fetchDrilldownContentAction`, `fetchDrilldownLogsAction` | `components/analytics/AdminAnalyticsPageContent.tsx` |
| `useAnalyticsExport` | `hooks/useAnalyticsExport.ts` | Owns AnalyticsExportModal's dataset selection and CSV export orchestration | `(onClose)` → `{ datasets, selectedDataset, setSelectedDataset, status, errorMessage, handleStartExport }` | `useState` selection/status/error | `exportAnalyticsAction`, `exportUsersDatasetAction`, `exportContentDatasetAction`, `exportLogsDatasetAction`, `exportToCSV` util | `components/analytics/AnalyticsExportModal.tsx` |
| `useCursorPagination` | `hooks/useCursorPagination.ts` | Shared Firestore cursor-pagination bookkeeping (`pageTokens` / `currentPage` map) | `()` → `{ pageTokens, currentPage, currentPageToken, totalDiscoveredPages, hasPreviousPage, goToNextPage, goToPreviousPage, goToPage, reset }` | `useState` token array + page index | — | `components/users/AdminUsersPageContent.tsx`, `components/reports/AdminReportsPageContent.tsx` |
| `useDataTable` | `hooks/useDataTable.ts` | Shared `@tanstack/react-table` engine: generic sorting/selection/filtering wiring for admin tables | `({ data, columns, enableRowSelection?, globalFilterFn?, enableFiltering?, enableSorting? })` → `{ table, globalFilter, setGlobalFilter, setRowSelection }` | `useState` globalFilter/sorting/rowSelection + `useReactTable` | — | `components/content/DecksTable.tsx`, `hooks/useUsersTable.ts` |
| `useDecksTableColumns` | `hooks/useDecksTableColumns.tsx` | Column configurations for the admin Content (decks) table — all display columns | `({ onView, onDelete, isDeleting })` → `ColumnDef[]` | none (i18n via `useTranslations`) | — | `components/content/DecksTable.tsx` |
| `useGlobalContent` | `hooks/useGlobalContent.ts` | Global content list + per-deck card loading + deck deletion, with cache invalidation | `()` → query result spread + `{ deleteCard, isDeleting, loadCards, isLoadingCards, cards, selectedDeckPath, setSelectedDeckPath }` | `useState` selectedDeckPath; react-query query + 2 mutations | `fetchGlobalContentAction`, `fetchDeckCardsAction`, `deleteGlobalFlashcardAction` | `components/content/AdminContentPageContent.tsx` |
| `useLogs` | `hooks/useLogs.ts` | Paginated system logs, one cursor page per call; derives per-level/per-type counts | `(filters, cursorId?)` → `{ logs, nextPageToken, countsByLevel, countsByType, isLoading, isFetching, error, refetch, createTestLog, isCreatingTestLog }` | react-query query + mutation, `useMemo` counts | `fetchLogsAction`, `createTestLogAction` | `components/reports/AdminReportsPageContent.tsx` |
| `useUsers` | `hooks/useUsers.ts` | Paginated user list (30 s refetch), admin stats, promote/demote/delete mutations with cross-key invalidation | `(pageToken?, pageSize?)` → `{ users, usersTotal, nextPageToken, stats, …loading/error flags, refetchUsers, refetchStats, promoteUser, demoteUser, removeUser }` | react-query 2 queries + 3 mutations | `fetchUsersAction`, `fetchAdminStatsAction`, `setAdminRoleAction`, `deleteUserAction` | `components/users/AdminUsersPageContent.tsx`, `hooks/useLogs.ts` (docblock reference only — no import; observed: `useLogs.ts` mentions it in a comment) |
| `useUsersTable` | `hooks/useUsersTable.ts` | State/logic hook for the Users table: table config, filtering, sorting, pending bulk-action confirm flow | `({ users, canDelete, canPromote, onPromote, onDemote, onDelete })` → `{ table, globalFilter, setGlobalFilter, setRowSelection, pendingAction, setPendingAction, isProcessing, handleConfirmAction }` | `useState` pendingAction/isProcessing; delegates to `useDataTable` | — (invokes caller-supplied mutation callbacks) | `components/users/UsersTable.tsx` |
| `useUsersTableColumns` | `hooks/useUsersTableColumns.tsx` | Column configurations for the Users table; delegates cell rendering to `UserCell`/`RoleCell`/`ActionsCell` | `({ canDelete, canPromote, onPromote, onDemote, onDelete })` → `ColumnDef[]` | none | — | `hooks/useUsersTable.ts` |

## AI (5)

All under `features/ai/hooks/`. All call the Gemini service layer (`features/ai/services/gemini.service.ts`, client-side via Firebase AI Logic).

| Hook | File | Purpose | Params → Return | State managed | Services called | Used by |
|---|---|---|---|---|---|---|
| `useAIGeneration` | `hooks/useAIGeneration.ts` | Generic wrapper around a single Gemini generation call: `useTransition`-backed pending state, `status` enum, shared error fallback | `(generateFn)` → `{ status, error, generate, reset }` | `useTransition` + `useState` error/succeeded | the injected `generateFn` | `useAICard`, `useAIDeck` |
| `useAICard` | `hooks/useAICard.ts` | `useAIGeneration` bound to `generateCardData` | `()` → same shape as `useAIGeneration` | via `useAIGeneration` | `generateCardData` | `features/flashcard/hooks/useLessonBuilder.ts`, `useAIExplanation` |
| `useAIDeck` | `hooks/useAIDeck.ts` | `useAIGeneration` bound to `generateDeck` | `()` → same shape | via `useAIGeneration` | `generateDeck` | `features/flashcard/components/AIBulkPanel.tsx` |
| `useAIExplanation` | `hooks/useAIExplanation.ts` | Lazy-loads an AI mnemonic ("Memory Tip") for a card on first reveal; resets per card | `(card, audioText, revealed)` → `{ explanation, loading, error }` | `useState` explanation; effects keyed on `card.id`/`revealed` | `useAICard().generate` (falls back to `card.hint`) | `features/flashcard/components/FlashcardMistakeReview.tsx` |
| `useAIImageDeck` | `hooks/useAIImageDeck.ts` | Generates a deck (title/description/cards) from uploaded images | `()` → `{ generate(files, existingWords?), loading, error }` | `useState` loading/error | `generateDeckFromImages` | `features/flashcard/components/LessonBuilderImportPane.tsx` |

## Flashcard — core (16)

All under `features/flashcard/hooks/` (barrel: `features/flashcard/hooks/index.ts`).

| Hook | File | Purpose | Params → Return | State managed | Services / actions called | Used by |
|---|---|---|---|---|---|---|
| `useCards` | `useCards.ts` | Real-time cards for a user/lesson context (own or shared-preview via `ownerId`), plus CRUD callbacks | `(lessonId?, ownerId?)` → `{ cards, loading, error, createCard, updateCard, deleteCard, reorderCards, resetCard, resetLesson }` | `useState` cards/loading/error, render-time reset on params change | `card.service`: `subscribeCards`, `createCard`, `updateCard`, `deleteCard`, `reorderCards`, `resetCardProgress`, `resetLessonProgress` | `app/[locale]/(main)/flashcard/[id]/page.tsx`, `useEditableLesson` |
| `useCardsWithProgress` | `useCardsWithProgress.ts` | Primary hook for study/game modes: subscribes to card content and user progress in real time and merges them into `CardWithProgress[]` | `(lessonId, ownerId)` → `{ cards, loading, error }` | `useState` merged state; `useRef` latest content/progress snapshots | `card.service.subscribeCards`; direct `onSnapshot` on `progress.service.userProgressLessonCol` | `useStudySession`, `useFlashcardLoader` |
| `useCardSessionState` | `useCardSessionState.ts` | Shared session queue/stats/summary state machine for the three study-mode players | `(cards, onAnswer)` → `{ queue, card, currentIndex, progress, stats, showSummary, submitGrade }` | `useState` queue/index/stats/summary | `playSfx` (shared audio); fires caller `onAnswer` | `FlashcardLearn.tsx`, `FlashcardPractice.tsx`, `FlashcardMistakeReview.tsx` |
| `useCommentCount` | `useCommentCount.ts` | Real-time comment totals + unresolved count for a card | `(ownerId, lessonId, cardId)` → `{ totalComments, unresolvedCount }` | `useState` two counters | `comment.service.subscribeToComments` | `detail/components/CardCommentBadge.tsx` |
| `useCommentPanel` | `useCommentPanel.ts` | Owns CommentPanel's real-time subscription, scroll-to-latest, and CRUD handlers | `({ ownerId, lessonId, cardId, currentUserId, currentUserName?, currentUserEmail?, isOwner })` → `{ comments, loading, isNetworkError, showResolved, setShowResolved, listRef, sorted, resolvedCount, handleAdd, handleReply, handleResolve, handleEdit, handleDelete }` | `useState` comments/loading/error/showResolved; `useRef` list/scroll | `comment.service`: `subscribeToComments`, `addComment`, `replyToComment`, `resolveComment`, `updateComment`, `deleteComment`; `useAlert` | `components/CommentPanel.tsx` |
| `useDeckProgressStatus` | `useDeckProgressStatus.ts` | Computes deck status (new/due/mistake/total) from the user's progress subcollection + stored cardCount | `(lessonId, cardCount)` → `DeckStatus` | `useState` status | direct `onSnapshot` on `progress.service.userProgressLessonCol` | `features/home/hooks/useHomeState.ts` |
| `useEditableLesson` | `useEditableLesson.ts` | Resolves the lesson + cards being edited: personal (realtime) vs shared collaboration (one-shot via tanstack-query-firebase) | `(id, ownerId \| null)` → `{ lesson, cards, loading, isSharedEdit, saveFullLesson, deleteLesson }` | react-query (`useDocumentQuery`/`useCollectionQuery`); delegates to `useLessons`/`useCards` | `lesson.service.lessonDoc`, `normalizeLesson`, `card.service.cardsCol` | `app/[locale]/(main)/flashcard/[id]/edit/page.tsx` |
| `useFlashcardGameBestScore` | `useFlashcardGameBestScore.ts` | Real-time personal best score for one game mode | `(userId \| undefined, gameMode)` → `number` | `useState` bestScore | `game/services.subscribeGameStats` | `games/match/components/MatchGame.tsx`, `games/speed/components/SpeedGame.tsx` |
| `useLessonBuilder` | `useLessonBuilder.ts` | The whole LessonBuilder editor: react-hook-form metadata, card list editing, paste/CSV sync, AI fill, image upload/cleanup, save/delete | `({ initialLesson?, initialCards?, onSave, onDelete?, onClose })` → large object (`saving, handleSave, handleDelete, register, cards, setCards, inputMode, pasteText, previewRows, themeHex, aiStatus, handleLiveSync, handleAIFillCard, handleImportConfirm, updateCard, addCard, deleteCard, addTag, removeCategory, handleImageChange, existingWordsForAI, …`) | `useForm` + `useState` cards/pasteText/previewRows/tagInput/inputMode/aiStatus/saving + `useRef` cleared image paths | `useAICard().generate`; `image.service`: `uploadCardImage`, `deleteCardImage`; `parseText` util | `components/LessonBuilder.tsx` |
| `useLessons` | `useLessons.ts` | Real-time personal + shared-with-me lessons; write helpers (update, delete-with-cards, diff-based full save, share settings, roles, reorder), with audit logging | `()` → `{ lessons, sharedLessons, loading, error, updateLesson, deleteLesson, saveFullLesson, shareLesson, updateLessonRoles, reorderLessons }` | `useState` lessons state, render-time reset on uid change | `lesson.service` (`subscribeLessons`, `subscribeSharedLessons`, `updateLesson`, `deleteLessonWithCards`, `saveLessonWithCards`, `shareLessonSettings`, `updateLessonRoles`, `reorderLessons`); actions `logDeckCreated/Updated/Deleted` | `useHomeState`, `useDashboardModals`, `useDashboardState`, `useEditableLesson`, `useFlashcardLoader`, `FlashcardDashboard.tsx`, and app pages (`flashcard/[id]`, `flashcard/create`, `flashcard/shared/[shareId]`, `profile`) |
| `usePublicLessons` | `useLessons.ts` (line 240) | Real-time publicly discoverable decks from all users (collectionGroup), excluding own decks | `()` → `{ publicLessons, loading, error }` | `useState` list/loading/error | `lesson.service.subscribePublicLessons` | `useDashboardState` |
| `useMatchGameStore` | `useMatchGameStore.ts` | Zustand store for the Match game grid: tiles, selection, matched pairs, processing flag, shake animation | Zustand hook / `.getState()` | Zustand store (`create`) | — | `games/match`: `MatchGrid.tsx`, `MatchPlaying.tsx`, `useMatchModeSession.ts`, `useMatchScoring.ts` |
| `useRevealPronunciation` | `useRevealPronunciation.ts` | Speaks the card once on the transition into revealed state (edge-detected; 250 ms flip-midpoint delay) | `(revealed, card, source)` → `void` | `useRef` edge detector | `shared/audio.sequence` (+ `getAudioText` util) | `FlashcardLearn.tsx`, `FlashcardPractice.tsx`, `FlashcardMistakeReview.tsx` |
| `useShareInvites` | `useShareInvites.ts` | Owns ShareModal's email-invite flow: form state, validation, invite/revoke calls | `({ lesson, setSaving })` → `{ register, control, handleInvite, handleRevokeEmailInvite, inviteError }` | `useForm` (zod `shareInviteSchema`) | `access.service`: `inviteByEmail`, `revokeEmailInvite`; `useAlert` | `components/ShareModal.tsx` |
| `useSharedLesson` | `useSharedLesson.ts` | Fetches and resolves a lesson for the shared preview page; defers until auth ready; distinguishes not-found vs retriable errors | `(shareId)` → `{ result, status, error }` | `useState` result/status/error | `shared.service.getSharedLesson` | `app/[locale]/(main)/flashcard/shared/[shareId]/SharedLessonPageClient.tsx` |
| `useVisibility` | `useVisibility.ts` | Resolves and memoizes the visibility configuration (icon/label/color) for a lesson | `(lesson)` → `VisibilityConfig & { effectiveColor }` | `useMemo` only | `getVisibilityConfig`, `resolveVisibilityColor` utils | `dashboard/components/DeckCard.tsx` |

## Flashcard — dashboard (2)

Under `features/flashcard/dashboard/hooks/`.

| Hook | File | Purpose | Params → Return | State managed | Services / actions called | Used by |
|---|---|---|---|---|---|---|
| `useDashboardModals` | `useDashboardModals.ts` | Modal state for share + delete-confirmation modals, with the delete flow | `()` → `{ sharingLesson, setSharingLesson, deletingLesson, setDeletingLesson, isDeleting, handleDelete, shareLesson, updateLessonRoles }` | `useState` two modal targets + isDeleting | via `useLessons`: `deleteLesson`, `shareLesson`, `updateLessonRoles`; `useAlert` | `FlashcardDashboard.tsx`, `features/home/hooks/useHomeState.ts` |
| `useDashboardState` | `useDashboardState.ts` | Dashboard orchestration: URL-driven tab state (personal/shared/discover), game-stats subscription, optimistic drag-reorder with fractional indexing | `()` → `{ activeTab, handleTabChange, lessons, sharedLessons, publicLessons, orderedLessons, loading, error, handleLessonsReorder, getGameStats }` | `useState` gameStats/orderedLessons (+ render-time sync); reads `useSearchParams` | `useLessons`, `usePublicLessons`, `game/services.subscribeGameStats`, `reorderLessons` (via `useLessons`), `reorderWithFractionalIndex` util | `FlashcardDashboard.tsx` |

## Flashcard — games (6)

| Hook | File | Purpose | Params → Return | State managed | Services / actions called | Used by |
|---|---|---|---|---|---|---|
| `useGameCompletionLogger` | `games/hooks/useGameCompletionLogger.ts` | Logs a game-completion analytics event once, the first time `phase` reaches `"results"` (shared by Match and Speed) | `({ phase, score, user, lessonId, lessonTitle, logFn })` → `void` | `useRef` logged flag | caller-supplied `logFn` (`logMatchGameCompleted` / `logSpeedGameCompleted`); `user.getIdToken()`; `scoreToTier` | `games/match/components/MatchGame.tsx`, `games/speed/components/SpeedGame.tsx` |
| `useMatchModeSession` | `games/match/hooks/useMatchModeSession.ts` | Match Mode session controller: difficulty/grid prep (with optional AI distractors), countdown, lives, end-game detection, persistence | `({ cards, gameMode, userId?, displayName?, addXP })` → `{ phase, difficulty, setDifficulty, config, prepLoading, score, streak, maxStreak, wrongAttempts, timeLeft, timeUnlimited, livesLeft, livesTotal, showLives, pairCount, matchedPairs, comboPopup, progress, startGame, onCellTap, resetToIntro, closeSession }` | `useState` phase/difficulty/timers/lives; many `useRef` stable-callback refs; grid state in `useMatchGameStore` | `generateMatchDistractors` (Gemini), `useGameSession`, `recordGameResult`, `useMatchScoring`, `buildGridItems` | `games/match/components/MatchGame.tsx` |
| `useMatchScoring` | `games/match/hooks/useMatchScoring.ts` | Pair resolution, score/streak/combo state, and tap handling for Match Mode (split from the session hook, E11-T4 per docblock) | `({ cards, userIdRef, syncScoreRef, livesModeRef, setLivesLeft })` → `{ score, setScore, streak, maxStreak, wrongAttempts, comboPopup, scoreRef, resetScoring, onCellTap }` | `useState` score/streak/combo; reads/writes `useMatchGameStore` imperatively | `card.service.gradeCard` (SRS write), `playSfx`, `sequence` (audio) | `useMatchModeSession` |
| `useGameEngine` | `games/speed/hooks/useGameEngine.ts` | React adapter for the imperative `GameEngine` class; owns lifecycle, session persistence, and feedback pronunciation | `({ cards, gameMode, userId?, displayName?, addXP })` → `{ state, startGame, submitAnswer, reset }` | `useState` engine state snapshot; `useRef` engine + stable callbacks | `useGameSession`, `recordGameResult`, `playSfx`, `sequence` | `useSpeedModeSession` |
| `useSpeedModeSession` | `games/speed/hooks/useSpeedModeSession.ts` | Speed Mode session controller: maps the engine's 4-phase model to the UI's 3-phase interface, difficulty config, timer UI helpers | `({ allCards, lessonExists, gameMode, userId?, displayName?, addXP })` → `{ phase, questionIndex, score, streak, maxStreak, correctCount, answerStatus, selectedOption, timerFraction, currentCard, currentQuestion, options, difficultyConfig, ui, startGame, handleAnswer, resetToIntro, closeSession }` | `useMemo` derivations only; state lives in `useGameEngine` | via `useGameEngine` | `games/speed/components/SpeedGame.tsx` |
| `useStudySession` | `games/study/hooks/useStudySession.ts` | Owns StudySession's mode/queue state, live-card subscription, grading, completion/reset logging | `(data: FlashcardData, initialMode)` → `{ mode, setMode, showExitModal, session, status, action, handleClose, handleConfirmExit, handleCancelExit, handleAnswer, handleComplete, handleReset }` | `useState` mode/exit-modal; `useMemo` session/status | `useCardsWithProgress`, `useUserProgress` (`addXP`, `completedLesson`), `progress.service`: `gradeCardForUser`, `resetLessonProgressForUser`; actions `logStudySessionCompleted`, `logStudyProgressReset` | `games/study/components/StudySession.tsx` |

## Flashcard — loaders (1)

| Hook | File | Purpose | Params → Return | State managed | Services called | Used by |
|---|---|---|---|---|---|---|
| `useFlashcardLoader` | `loaders/useFlashcardLoader.ts` | Loads flashcard data for game/study routes: personal decks via live subscriptions, shared decks via one-time cached query | `(source: FlashcardSource)` → `FlashcardLoaderState` (`{ data, isLoading, isReady, isNotFound, error }`) | react-query (shared decks, `staleTime: Infinity`); delegates to `useLessons` + `useCardsWithProgress` | `loadFlashcardData` (→ `shared.service.getSharedLesson`) | 6 immersive app pages: `flashcard/[id]/{study,match,speed}` and `flashcard/shared/[shareId]/{study,match,speed}` |

## Game (2)

Under `features/game/hooks/`.

| Hook | File | Purpose | Params → Return | State managed | Services called | Used by |
|---|---|---|---|---|---|---|
| `useGameSession` | `useGameSession.ts` | Manages a single Firestore game-session lifecycle: start → debounced live score updates (500 ms) → finish | `({ userId, userName, gameMode })` → `{ startSession, syncScore, endSession, isSessionActive }` | `useRef` sessionId/debounce/lastSynced; `useState` isSessionActive | `session.service`: `createGameSession`, `updateGameScore`, `finishGameSession` | `useGameEngine`, `useMatchModeSession`, `useKanaQuizSession`, `useSurvivalGame` |
| `useLeaderboard` | `useLeaderboard.ts` | Real-time top-N leaderboard for a game mode, merged with the current in-progress score; computes ranks | `(gameMode \| null, topN?, currentUser?, currentScore?)` → `{ entries, userRank, loading, error }` | `useState` entries/loading/error; `useMemo` computed board | `leaderboard.service.subscribeLeaderboard` | `components/Leaderboard.tsx`, `components/MiniLeaderboard.tsx` |

## Home (1)

| Hook | File | Purpose | Params → Return | State managed | Services called | Used by |
|---|---|---|---|---|---|---|
| `useHomeState` | `features/home/hooks/useHomeState.ts` | Home dashboard orchestration: progress/lessons, recommended-action numbers, live game stats, kana progress %, deck modals | `()` → `{ userData, progressLoading, lessons, lessonsLoading, recentLessons, topLesson, deckStatus, action, primaryCount, gameStats, learnedCount, totalKanaChars, kanaPct, sharingLesson, …modal state, handleDelete, shareLesson, updateLessonRoles }` | `useState` gameStats; composes `useUserProgress`, `useLessons`, `useDeckProgressStatus`, `useDashboardModals` | `game/services.subscribeGameStats`; `recommendedAction` util | `features/home/components/HomePage.tsx` |

## Kana (9)

| Hook | File | Purpose | Params → Return | State managed | Services / actions called | Used by |
|---|---|---|---|---|---|---|
| `useKanaStore` | `features/kana/store.ts` | Persisted Zustand store for the alphabet selection (`hiragana`/`katakana`/`both`), localStorage key `kana-ui-state` | Zustand hook → `{ alphabet, setAlphabet }` | Zustand + `persist` | — | 3 files (incl. `useKanaDataset`) |
| `useKanaDataset` | `hooks/useKanaDataset.ts` | Returns the active dataset and the single canonical alphabet→theme-color mapping | `()` → `{ dataset, alphabet, setAlphabet, themeColor }` | `useMemo`; reads `useKanaStore` | — (static `HIRAGANA_DATA`/`KATAKANA_DATA`) | `KanaChart.tsx`, `KanaQuiz.tsx`, `KanaLearn.tsx`, `KanaPractice.tsx`, `useKanaHubState`, `app/.../kana/survival/page.tsx` |
| `useChartData` | `chart/hooks/useChartData.ts` | Builds chart blocks for hiragana/katakana/both; memoizes combined-section pairing | `(alphabet)` → `{ isBoth, singleBlocks, combinedSections, headingColorSingle }` | `useMemo` only | — | `chart/components/KanaChart.tsx` |
| `useKanaPlayDeck` | `hooks/useKanaPlayDeck.ts` | Deck navigation for learn/practice: index/random navigation, visit callback, speak-on-navigate | `({ dataset, alphabet, onVisit?, speakOnNavigate? })` → `{ char, currentIndex, isRandom, next, prev, playCurrent, autoPlayCurrent, toggleRandom }` | `useState` navigation; `useRef` onVisit | `shared/audio.speak` | `learn/components/KanaLearn.tsx`, `practice/components/KanaPractice.tsx` |
| `useKanaQuizSession` | `hooks/useKanaQuizSession.ts` | Kana quiz session controller (fixed target score 20): question generation with visual/phonetic distractors, smart-review deck, answer processing, Firestore session sync | `({ dataset, gameMode, bestScore?, userId?, displayName?, onCorrectCombo?, session? })` → `{ question, questionType, options, status, score, streak, targetScore, generateQuestion, buildSmartDeck, processAnswer, startQuiz, finishQuiz, setStatus, resetEngine }` | `useState` question/options/status/score/streak; `useRef` deck/streak/saved | `useGameSession` (own or injected), `useUserProgress.recordCharStat`, `playSfx`, `sequence` | `quiz/components/KanaQuiz.tsx`, `useSurvivalGame`, `useDropMode` |
| `useQuizState` | `quiz/hooks/useQuizState.ts` | Quiz phase/mode state (setup/playing/done); MC + typed answer handling; completion logging | `({ dataset, alphabet, userId?, displayName?, session })` → `{ quizMode, typedInput, phase, setTypedInput, setPhase, startQuiz, handleMCAnswer, handleTypeAnswer }` | `useState` quizMode/typedInput/phase | `logKanaQuizCompleted` action; `checkTypedAnswer` util; `auth.currentUser.getIdToken()` | `quiz/components/KanaQuiz.tsx` |
| `useSurvivalGame` | `hooks/useSurvivalGame.ts` | Survival Mode controller for three challenge modes (infinity/time/drop): lives, time-attack countdown + streak bonuses, game-over persistence, completion logging | `({ dataset, alphabet, userId, userName, onSaveScore })` → `{ phase, setPhase, challengeMode, setChallengeMode, timeMinutes, setTimeMinutes, timeLeft, timeAttackPeak, lives, localName, setLocalName, errorFlash, lastPoints, pointsAnimKey, activeModeKey, engine, dropState, dropScore, dropStreak, dropTick, startGame, handleAnswer, handleDropTyping }` | `useState` phase/mode/time/lives/etc.; many stable-callback `useRef`s | `useGameSession`, `useKanaQuizSession` (injected session), `useDropMode`, `logKanaSurvivalCompleted` action | `app/.../kana/survival/page.tsx` + 4 `_components/Survival*Screen.tsx` |
| `useDropMode` | `hooks/useDropMode.ts` | Drop Mode: requestAnimationFrame falling-character loop with progressive difficulty, keyboard typing matcher, score sync, game-over handling | `({ dataset, alphabet, userId, phase, challengeMode, …shared refs/setters, engine })` → `{ dropState, dropScore, dropStreak, dropTick, resetDrop, handleDropTyping }` | `useState` dropScore/dropStreak/dropTick; `useRef` word/loop state | `logKanaSurvivalCompleted` action, `playSfx`, `sequence`, `comboMultiplier`; parent-supplied session refs | `useSurvivalGame` |
| `useKanaHubState` | `hub/hooks/useKanaHubState.ts` | Kana hub orchestration: settings menu, progress %, theme colors, best-infinity score, reset flow | `()` → `{ alphabet, setAlphabet, showSettings, …, progressPct, learnedCount, totalChars, isBeginner, isBoth, themeColors, bestInfinity, handleResetProgress }` | `useState` showSettings/showConfirmReset | via `useKanaDataset`, `useUserProgress.resetProgress`, `useBestScores`, `useAppStore` settings toggles | `hub/components/KanaHub.tsx` |

## User (4)

Under `features/user/hooks/`.

| Hook | File | Purpose | Params → Return | State managed | Services called | Used by |
|---|---|---|---|---|---|---|
| `useFirebaseAuth` | `useFirebaseAuth.ts` | Firebase Auth integration: `onIdTokenChanged` listener, auth cookie management, server-deduplicated login logging, pending-notification delivery | `()` → `void` | writes to `useAppStore` (`setUser`, `setAuthReady`) | `setPersistence`, `setAuthCookie`/`clearAuthCookie`, `auth-logging.service.logUserLogin`, `notifications/services.deliverPendingNotifications` | `lib/providers.tsx`; also imported by `user/services/auth.service.ts` (docblock reference — observed as grep match; the service references it in comments) |
| `useUserProgress` | `useUserProgress.ts` | XP, daily streak, learned chars, per-char stats, lesson counts — synced with Firestore | `()` → `{ userData, addXP, completedLesson, markLearned, recordCharStat, resetProgress, loading }` | `useState` userData/loading | `user.service`: `subscribeUserProgress`, `updateUserProgress` (transactional) | 11 files: `useHomeState`, `useStudySession`, `MatchGame.tsx`, `SpeedGame.tsx`, `KanaLearn.tsx`, `KanaChart.tsx`, `useKanaQuizSession`, `useKanaHubState`, `settings/SettingsPageClient.tsx`, `profile/page.tsx` |
| `useBestScores` | `useBestScores.ts` | Syncs personal best scores from Firestore; exposes a score-submit helper | `()` → `{ bestScores, saveScore }` | `useState` bestScores map | `game/services`: `subscribePersonalBests`, `submitScore` | `useKanaHubState`, `app/.../kana/survival/page.tsx` |
| `useActivityTracker` | `useActivityTracker.ts` | Heartbeat `lastSeenAt` updates to Firestore on route change, throttled to 5 min | `()` → `void` | `useRef` last-update timestamp | `user.service.updateLastSeen` | `lib/providers.tsx` |

## Notifications (1)

| Hook | File | Purpose | Params → Return | State managed | Services called | Used by |
|---|---|---|---|---|---|---|
| `useNotifications` | `features/notifications/context/NotificationsContext.tsx` (line 209) | Consumer of the app-shell-level notifications context: one Firestore listener shared by all consumers (badge, page); grows the live window for pagination | `()` → `{ notifications, groups, unreadCount, loading, loadingMore, hasMore, loadMore, error, retry }` | provider: `useState` items/loading/pageSize/retryNonce; consumer: `useContext` | provider calls `notification-subscribe.subscribeNotifications` | 3 files grep-match (provider itself + consumers, e.g. bottom-nav badge / notifications page per the file's docblock) |

## Shared / lib (6)

| Hook | File | Purpose | Params → Return | State managed | Services called | Used by |
|---|---|---|---|---|---|---|
| `useAppStore` | `lib/app-store.ts` | Global Zustand store: Firebase user + `isAuthReady`, and persisted settings (handwriting, auto-play, SFX/voice mute + volume); persists settings only under key `app-settings` | Zustand hook / `.getState()` | Zustand + `persist` | — | 38 files across features/app/lib |
| `useAudioStatus` | `shared/audio/useAudioStatus.ts` | Subscribes a component to pronunciation health via `useSyncExternalStore` | `()` → `AudioStatus` | external store subscription | `shared/audio/status`: `getAudioStatus`, `subscribeAudioStatus` | `FlashcardAudioButton.tsx`, `KanaAudioButton.tsx` |
| `useCopyToClipboard` | `shared/hooks/useCopyToClipboard.ts` | Clipboard write + auto-resetting `copied` flag | `(resetDelayMs = 2000)` → `{ copied, copy }` | `useState` copied | `navigator.clipboard` | `LogCopyButton.tsx`, `ShareModal.tsx`, `SharedLessonPageClient.tsx`, `flashcard/[id]/page.tsx` |
| `useNow` | `shared/hooks/useNow.ts` | Current epoch-ms clock re-rendering on an interval (default 30 s) for live relative timestamps | `(intervalMs = 30000)` → `number` | `useState` + interval | — | `notifications/domain/format.ts`, `NotificationsVirtualList.tsx` |
| `usePrefersReducedMotion` | `shared/hooks/usePrefersReducedMotion.ts` | OS reduced-motion preference via `matchMedia` + `useSyncExternalStore`; for JS-driven motion only (CSS handled globally) | `()` → `boolean` | external store subscription | — | `game/components/GameResultsScreen.tsx` |
| `useAlert` | `shared/providers/AlertProvider.tsx` (line 79) | Global alert/toast API (`showAlert(type, message, options?)`) rendered through sonner's `toast.custom` with the app's `Alert` chrome; throws outside provider | `()` → `{ showAlert }` | `useContext` (provider: `useCallback`/`useMemo` only) | sonner `toast` | 12 files (e.g. `useDashboardModals`, `useDashboardState`, `useCommentPanel`, `useLessonBuilder`, `useShareInvites`) |

---

## Cross-cutting observations

- **Observed — stable-callback-ref pattern**: `useMatchModeSession`, `useGameEngine`, `useSurvivalGame`, `useKanaQuizSession`, `useDropMode`, and `useMatchScoring` all mirror callbacks/values into refs inside a `useLayoutEffect` to avoid engine/session rebuilds (each file documents this in its own comments).
- **Observed — render-time state reset pattern**: `useCards`, `useCardsWithProgress`, `useLessons`, `usePublicLessons`, `useCommentPanel`, `useDashboardState`, `useLessonBuilder`, and `NotificationsContext` reset derived state during render when an identity key changes, rather than in an effect (several cite React's documented derived-from-props pattern).
- **Observed — store hooks**: three Zustand stores exist (`useAppStore` in `lib/app-store.ts`, `useKanaStore` in `features/kana/store.ts`, `useMatchGameStore` in `features/flashcard/hooks/useMatchGameStore.ts`); the first two use `persist`.
- **Observed — react-query usage**: confined to the admin hooks, `useEditableLesson` (via `@tanstack-query-firebase/react`), and `useFlashcardLoader`'s shared-deck branch. All other data hooks use raw Firestore `onSnapshot` subscriptions through service modules.
- **Inferred**: `useDataTable`'s consumers indicate the Users and Content admin tables share one table engine; this is stated in the hook's docblock and consistent with the grep results, but no other admin table was found.

## Uncertainties

- `features/flashcard/games/match/hooks/matchGrid.ts` and `features/flashcard/games/match/config.ts` grep-match `useMatchModeSession`/`useMatchScoring` only in comments/type references; they are not hook consumers in the call-graph sense.
- The `useNotifications` consumer list ("BottomNav badge, NotificationsPage") is taken from the context file's own docblock (lines 10–22); the grep-confirmed consumer files are the provider file plus 2 others matching the hook name.
