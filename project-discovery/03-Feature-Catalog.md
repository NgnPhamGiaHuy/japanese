# 03 — Feature Catalog

Discovery-phase document. Source of truth: the code in `/Users/yuh.nguyenpham/GitHub/japanese/src` (Next.js project root) and `/Users/yuh.nguyenpham/GitHub/japanese/src/functions` (separate npm package `kana-nihongo-master-functions`, `src/functions/package.json`). Every claim cites a file path; line numbers refer to the state of the repo at discovery time (2026-07-18, branch `main`).

Conventions used throughout:

- **Observed** = read directly from code/docblocks. **Inferred** = a conclusion drawn from observed code; marked explicitly.
- Route paths are written without a locale prefix. All app routes live under `src/app/[locale]/` with locales `["en", "ja"]` and `defaultLocale: "en"` using "as-needed" prefixing — English is unprefixed, Japanese is served under `/ja/...` (`src/i18n/routing.ts:10-11`, `src/proxy.ts:31-40`).
- `APP_ID` in Firestore paths resolves to `process.env.NEXT_PUBLIC_APP_ID ?? "kana-nihongo-master"` (`src/lib/app-id.ts:1`).
- Two route groups exist: `(main)` wraps children with `BottomNav` (`src/app/[locale]/(main)/layout.tsx`), while `(immersive)` renders children bare with no chrome (`src/app/[locale]/(immersive)/layout.tsx`).

## Feature module enumeration

Observed contents of `src/features/` (from `ls src/features`):

| # | Module | One-line role |
|---|--------|---------------|
| 1 | `admin` | Admin console: dashboard, user management, content moderation, analytics, log reports, settings |
| 2 | `ai` | Gemini-backed content generation via Firebase AI Logic (cards, decks, image decks, distractors, mnemonics) |
| 3 | `command-palette` | ⌘K/Ctrl+K navigation palette |
| 4 | `flashcard` | Deck/card authoring, SRS study, three game modes, sharing/collaboration, comments |
| 5 | `game` | Shared competitive-game infrastructure (sessions, leaderboards, personal bests, tiers, combos, shared screens) |
| 6 | `home` | Home dashboard ("Continue Studying" tile, stats, recent decks) |
| 7 | `kana` | Hiragana/katakana learning: hub, chart, learn, handwriting practice, quiz, survival-game hooks |
| 8 | `notifications` | In-app notification platform (domain registry, server-side writer, real-time inbox, pending invites) |
| 9 | `user` | Auth (Google), user progress document, activity heartbeat, best-scores facade |

---

## 1. `features/home`

### Purpose
Observed — docblock of the feature's single hook: *"useHomeState — Home dashboard state orchestration … Manages progress/lesson data fetching, the recommended-action tile's underlying numbers, live game-stat subscriptions, and deck action modals."* (`src/features/home/hooks/useHomeState.ts:1-7`).

### Responsibilities
- Render the post-login home dashboard: recommended-action ("Continue Studying") tile, stat cards, recent decks, quick actions (`src/features/home/components/HomePage.tsx`).
- Aggregate data from flashcard (lessons, deck progress, recommended action), user (progress/XP), game (live stats), and kana (total character count) (`src/features/home/hooks/useHomeState.ts:12-22`).

### Entry points
- `src/app/[locale]/(main)/page.tsx` → route `/` — a "pure orchestrator" that renders `HomePage` from `@/features/home` (its own docblock, lines 1-9).

### Pages
- `/` only.

### Components (1)
- `HomePage.tsx` — full dashboard UI; renders `ShareModal` and `DeckCard` imported from the flashcard feature (`src/features/home/components/HomePage.tsx:8-9`).

### Hooks (1)
- `useHomeState` — see Purpose.

### Services / Server Actions
- None (directory has none; all data access goes through other features' services).

### Firebase collections
- None accessed directly in this feature's code (no `collection(`/`doc(` literals under `src/features/home`). Data arrives via `flashcard`, `game`, `user` services (Inferred from imports in `useHomeState.ts`).

### Shared dependencies
- `@/shared/components/ui` (ActionCard, Button, ConfirmModal, EmptyState, StatCard), `@/shared/constants` (SECTION_HEADING, SPACING), `@/lib/app-store` (`src/features/home/components/HomePage.tsx:13-14`, `src/features/home/hooks/useHomeState.ts:18`).

### Related features (verified imports)
- `flashcard` (7 imports), `game` (2), `user` (1), `kana` (1 — the static datasets for the total-character count).

---

## 2. `features/kana`

### Purpose
Observed — kana (hiragana/katakana) learning across five surfaces plus a survival game. Sub-module docblocks: *"KanaHub — Central hub for kana learning modes … Orchestrates navigation to different kana learning modes with progress tracking"* (`src/features/kana/hub/components/KanaHub.tsx:1-6`); *"KanaLearn — Main learning mode component"* (`learn/components/KanaLearn.tsx:1-7`); *"KanaPractice — Main practice mode component … Orchestrates navigation, mode switching, and canvas display"* (`practice/components/KanaPractice.tsx:1-7`); *"KanaQuiz … Manages three phases: setup, playing, done"* (`quiz/components/KanaQuiz.tsx:1-7`); *"KanaChart … Handles romaji toggle, alphabet switching, and learned state"* (`chart/components/KanaChart.tsx:1-7`).

### Responsibilities
- Static kana datasets: `HIRAGANA_DATA`, `KATAKANA_DATA`, gojūon chart layouts, and `VISUAL_GROUPS` (visually similar characters "used to generate smart distractors") (`src/features/kana/data/`).
- Alphabet selection persisted in a Zustand `persist` store (`kana-ui-state`) (`src/features/kana/store.ts`).
- Quiz session logic (MC / typed romaji / smart review, wrong-answer reinsertion) — `useKanaQuizSession.ts:1-16`.
- Survival game logic (Infinity / Time Attack / Drop modes) — `useSurvivalGame.ts:1-15` plus the rAF-loop `useDropMode.ts` (split out per its docblock, lines 1-12).
- Handwriting practice (drawing canvas, stroke animation) — `components/DrawingCanvas.tsx`, `components/KanaStrokeAnimation.tsx`.
- Server-side activity logging for quiz/survival completion (`actions/activity-log.actions.ts`).

### Entry points
| page.tsx | Route | Mounts |
|---|---|---|
| `src/app/[locale]/(main)/kana/page.tsx` | `/kana` | `KanaHub` |
| `src/app/[locale]/(main)/kana/chart/page.tsx` | `/kana/chart` | `KanaChart` |
| `src/app/[locale]/(main)/kana/learn/page.tsx` | `/kana/learn` | `KanaLearn` |
| `src/app/[locale]/(immersive)/kana/practice/page.tsx` | `/kana/practice` | `KanaPractice` |
| `src/app/[locale]/(immersive)/kana/quiz/page.tsx` | `/kana/quiz` | `KanaQuiz` |
| `src/app/[locale]/(immersive)/kana/survival/page.tsx` | `/kana/survival` | survival screens that live under `app/` (see App-level surfaces §11) but drive `useSurvivalGame`/`useKanaDataset` from this feature (page lines 5-27) |

### Pages
`/kana`, `/kana/chart`, `/kana/learn`, `/kana/practice`, `/kana/quiz`, `/kana/survival`. The hub, chart, learn are in the `(main)` group; practice, quiz, survival are `(immersive)`.

### Components (21 `.tsx` excluding tests)
- Shared (6): `AlphabetSwitcher` (hiragana/katakana/both toggle), `AnswerFeedback`, `DrawingCanvas` (handwriting canvas), `KanaAudioButton`, `KanaMCOptionsGrid`, `KanaStrokeAnimation` (stroke-order animation).
- `chart/` (4): `KanaChart` (root), `ChartBlockGrid`, `ChartCell`, `ChartSection`.
- `hub/` (1): `KanaHub` (root; settings menu, progress, mode navigation).
- `learn/` (3): `KanaLearn` (root), `LearnCard`, `LearnProgress`.
- `practice/` (3): `KanaPractice` (root), `PracticeCanvasArea`, `PracticeHeader`.
- `quiz/` (4): `KanaQuiz` (root), `QuizPlaying`, `QuizResults`, `QuizSetup`.

### Hooks (8)
- `useKanaDataset` — active dataset + the single alphabet→theme-color mapping (`hooks/useKanaDataset.ts:11-26`).
- `useKanaPlayDeck` — card-deck navigation with optional speech on navigate (`hooks/useKanaPlayDeck.ts`).
- `useKanaQuizSession` — fixed-length quiz session, three modes, Firestore sync via `useGameSession` (`hooks/useKanaQuizSession.ts:1-16`).
- `useSurvivalGame` — orchestrates Infinity/Time Attack/Drop survival modes (`hooks/useSurvivalGame.ts:1-15`).
- `useDropMode` — rAF falling-characters loop, composed by `useSurvivalGame` (`hooks/useDropMode.ts:1-12`).
- `useChartData` — memoized chart blocks per alphabet (`chart/hooks/useChartData.ts:1-6`).
- `useKanaHubState` — hub settings menu, progress calc, theme colors (`hub/hooks/useKanaHubState.ts:1-6`).
- `useQuizState` — quiz phase/mode state machine (`quiz/hooks/useQuizState.ts:1-7`).
- Plus the Zustand store `useKanaStore` (`store.ts`).

### Services / Server Actions
- No `services/` directory. Server actions (`"use server"`): `logKanaQuizCompleted`, `logKanaSurvivalCompleted` — thin wrappers over `@/lib/logging/activity` `logActivity` (`src/features/kana/actions/activity-log.actions.ts:16,43`).

### Firebase collections
- None accessed directly in this feature (no path literals). Writes/reads happen through: `game` services (game sessions/leaderboards/stats — see §5), `user` services (progress doc), and `system_logs` via `logActivity` → `persistSystemLog` (`src/lib/logging/server.ts:33-34`). (Observed for the delegation; the concrete paths are cited in the owning features' sections.)

### Shared dependencies
`@/shared/components/ui` (15 imports), `@/shared/audio` (8 — `playSfx`, `sequence`, `speak`), `@/shared/components/layout` (5 — `ScreenHeader`), `@/shared/utils` (4 — e.g. `checkTypedAnswer`, `getValidRomaji`), `@/lib/firebase` (3), `@/lib/app-store` (2), `@/lib/logging/*` (2).

### Related features (verified)
- `game` (5 imports — `comboMultiplier`, `useGameSession`), `user` (4 — `useUserProgress`, `useBestScores`).

---

## 3. `features/flashcard`

### Purpose
Observed — the deck ("lesson") product: authoring (manual, import, AI), an SM-2 SRS study system with per-user progress, three game modes, sharing/collaboration with RBAC, and threaded comments. Key docblocks: *"SM-2 (SuperMemo 2) implementation with four-button grading"* (`domain/srs.ts:1-15`); *"Strict separation of concerns: Content: Immutable card data (owned by deck creator); Progress: Mutable learning state (owned by individual learner)… enables Multi-tenant learning (N users × 1 deck)"* (`domain/types.ts:1-13`); *"RBAC Engine — deterministic permission resolution for flashcard decks… the single source of truth for all permission decisions"* with an owner/editor/commenter/viewer/none matrix (`utils/rbac.ts:1-20`).

### Responsibilities
- Deck/card CRUD with diff-based atomic saves incl. Storage image GC and fractional-index ordering (`services/lesson-save.ts:1-9`).
- Real-time subscriptions for own / shared-with-me / public decks via `collectionGroup("lessons")` (`services/lesson-subscriptions.ts`).
- Per-user SRS progress layer separate from card content (`services/progress.service.ts:1-18`).
- Study modes: learn/practice/mistake-review players plus a mode selector (`games/study/`, `components/FlashcardLearn.tsx`, `FlashcardPractice.tsx`, `FlashcardMistakeReview.tsx`).
- Match game (tile-pair grid) and Speed game (timed MCQ driven by a class-based `GameEngine` with state machine, timer, scoring, question subsystems — `games/speed/engine/core/GameEngine.ts:1-15`).
- Sharing: share links (`buildShareId`), email invites, collaborator roles, public visibility; server-only preview for the public shared page (`services/access.service.ts:1-8`, `services/shared-preview.service.ts:1-17`).
- Threaded comments with 2-level nesting, RBAC, sanitization (`services/comment.service.ts:1-17`).
- Card import: CSV/TSV/JSON parsing (`utils/parser.ts`), AI bulk generation panel (`components/AIBulkPanel.tsx`).
- Server actions: invite decline via Admin SDK (`actions/access.actions.ts:1-12`) and 8 activity-log actions (`actions/activity-log.actions.ts`).

### Entry points
| page.tsx | Route | Mounts |
|---|---|---|
| `src/app/[locale]/(main)/flashcard/page.tsx` | `/flashcard` | `FlashcardDashboard` |
| `src/app/[locale]/(main)/flashcard/create/page.tsx` | `/flashcard/create` | `LessonBuilder` + `useLessons` |
| `src/app/[locale]/(main)/flashcard/[id]/page.tsx` | `/flashcard/[id]` | `FlashcardDetailLayout`, `ShareModal` |
| `src/app/[locale]/(main)/flashcard/[id]/edit/page.tsx` | `/flashcard/[id]/edit` | `LessonBuilder` + `useEditableLesson` (personal & collaborative edit; `?ownerId=` switches mode) |
| `src/app/[locale]/(main)/flashcard/shared/[shareId]/page.tsx` | `/flashcard/shared/[shareId]` | server component streaming `getPublicSharedLessonPreview` into `SharedLessonPageClient` (page docblock lines 1-15) |
| `src/app/[locale]/(immersive)/flashcard/[id]/study/page.tsx` | `/flashcard/[id]/study` | `StudySession` via `useFlashcardLoader({type:"personal"})` |
| `src/app/[locale]/(immersive)/flashcard/[id]/match/page.tsx` | `/flashcard/[id]/match` | `MatchGame` |
| `src/app/[locale]/(immersive)/flashcard/[id]/speed/page.tsx` | `/flashcard/[id]/speed` | `SpeedGame` (min-4-cards guard → `SpeedConstraintError`) |
| `src/app/[locale]/(immersive)/flashcard/shared/[shareId]/study/page.tsx` (+ `/match`, `/speed` siblings) | `/flashcard/shared/[shareId]/{study,match,speed}` | same game roots via `useFlashcardLoader({type:"shared", shareId})` (study page line 28) |

Also mounted outside its own routes: `DeckCard` and `ShareModal` on the home page (`src/features/home/components/HomePage.tsx:8-9`).

### Pages
The 12 routes above (plus the per-deck `opengraph-image` asset route under `/flashcard/shared/[shareId]`, `src/app/[locale]/(main)/flashcard/shared/[shareId]/opengraph-image.tsx`).

### Components (53 `.tsx` excluding tests)
- `components/` (24): `LessonBuilder` (deck editor shell) + `LessonBuilderCardList`, `LessonBuilderImportPane`, `LessonBuilderMeta`; import trio `ImportDropzone`, `ImportPasteArea`, `ImportPreview`; `AIBulkPanel` (AI deck/image generation); comment stack `CommentInput`, `CommentItem`, `CommentPanel`, `CommentThread`; sharing `ShareModal`, `ShareCollaboratorsPanel`, `SharePrivacyPicker`; players `FlashcardLearn`, `FlashcardPractice`, `FlashcardMistakeReview`; `GradeButtons` (SRS 4-button), `McChoiceGrid`, `DraggableCard`, `FlashcardAudioButton`, `StudyProgressHeader`, `StudySummaryScreen`.
- `dashboard/components/` (7): `FlashcardDashboard` (root; docblock: "Central hub for flashcard management… personal vs. shared vs. discover views", lines 1-9), `DashboardTabs`, `DeckCard`, `SortableDeckCard`, `DashboardEmpty`, `DashboardError`, `DashboardLoading`.
- `detail/components/` (8): `FlashcardDetailLayout` (docblock: "Three-zone interface: Actions (Left), Preview (Center), Comments (Right)", lines 1-14), `DetailHeader`, `DetailActionsPanel`, `DetailCardsPanel`, `DetailCommentsPanel`, `ActionRow`, `CardCommentBadge`, `SortableCardItem`.
- `games/match/components/` (6): `MatchGame` (root), `MatchIntro`, `MatchPlaying`, `MatchGrid`, `MatchCard`, `MatchResults`.
- `games/speed/components/` (5): `SpeedGame` (root), `SpeedIntro`, `SpeedPlaying`, `SpeedResults`, `SpeedConstraintError`.
- `games/study/components/` (3): `StudySession` (root), `StudyModeSelector`, `ModeButton`.

### Hooks (23 in `hooks/` trees + 1 loader hook)
- `hooks/` (15): `useLessons` (lessons state + CRUD + activity logging), `useCards` (real-time card collection), `useCardsWithProgress` ("Primary hook for all study/game modes" — content+progress real-time merge, `useCardsWithProgress.ts:1-15`), `useCardSessionState` (session queue/again-reinsertion), `useCommentCount`, `useCommentPanel`, `useDeckProgressStatus` (new/due/mistake counts), `useEditableLesson` (personal vs shared-edit resolution via tanstack-query-firebase, docblock lines 1-15), `useFlashcardGameBestScore`, `useLessonBuilder` (react-hook-form + zod + AI + image upload orchestration), `useMatchGameStore` (Zustand grid store), `useRevealPronunciation` (speak-on-reveal edge detector), `useShareInvites`, `useSharedLesson`, `useVisibility`.
- `dashboard/hooks/` (2): `useDashboardState`, `useDashboardModals`.
- `games/hooks/` (1): `useGameCompletionLogger` (fires the activity-log action once when phase reaches "results").
- `games/match/hooks/` (2): `useMatchModeSession` (docblock lines 1-20: composes `useGameSession`, `recordGameResult`, `useMatchScoring`, `buildGridItems`), `useMatchScoring`; plus pure `matchGrid.ts`.
- `games/speed/hooks/` (2): `useSpeedModeSession` (docblock lines 1-20), `useGameEngine` (React binding for the `GameEngine` class).
- `games/study/hooks/` (1): `useStudySession` (grading, session building, reset, logging).
- `loaders/useFlashcardLoader.ts` — unified personal/shared data loader with live subscriptions (docblock lines 16-20; pure counterpart `loaders/flashcard-loader.ts`).

### Services / Server Actions
All `services/` files use the **client SDK** except where noted.

| File | Purpose |
|---|---|
| `lesson.service.ts` | Orchestrator: deck metadata writes, deep-deletes, re-exports of the split modules (docblock lines 1-17) |
| `lesson-paths.ts` | Path helpers for lessons collection/doc |
| `lesson-normalize.ts` | Pure read-time schema healing for legacy docs |
| `lesson-subscriptions.ts` | Real-time own/shared/public listeners (collectionGroup) |
| `lesson-save.ts` | `saveLessonWithCards` — diff-based atomic save in one WriteBatch |
| `card.service.ts` | Card CRUD + real-time subscription; delegates grading to progress.service |
| `progress.service.ts` | Per-user SRS state (`userProgress` namespace, docblock lines 1-18) |
| `comment.service.ts` (+ `comment-errors.ts`, `comment-paths.ts`, `comment-validation.ts`) | Threaded comments CRUD/subscribe, RBAC, sanitization |
| `access.service.ts` | Invites, pending-invite→collaborator sync, permission re-exports |
| `shared.service.ts` | Share-link resolution, external session resolution, public deck discovery |
| `shared-preview.service.ts` | **Server-only, Admin SDK** public preview for the shared page (`import "server-only"`, docblock lines 1-17) |
| `image.service.ts` | Firebase **Storage** upload/delete for card images (2 MB cap, `users/{userId}/cards/{cardId}_{timestamp}.ext`, docblock lines 5-19) |

Server actions (`"use server"`):
- `actions/access.actions.ts` — `declineInviteAction` (**Admin SDK**; revokes the pending invite server-side because the invitee cannot write the owner's lesson, docblock lines 4-12).
- `actions/activity-log.actions.ts` — `logDeckCreated/Updated/Deleted`, `logStudySessionCompleted`, `logStudyProgressReset`, `logMatchGameCompleted`, `logSpeedGameCompleted` (lines 8-90), all via `@/lib/logging/activity`.

### Firebase collections
Client SDK:
- `artifacts/{APP_ID}/users/{userId}/lessons/{lessonId}` (`services/lesson-paths.ts:14,18`; also `shared.service.ts:152`)
- `artifacts/{APP_ID}/users/{userId}/cards/{cardId}` — flat collection linked to a lesson by a `lessonId` field (`services/card.service.ts:30,34`)
- `collectionGroup("lessons")` — shared-with-me, public-decks, and shareId-resolution queries (`services/lesson-subscriptions.ts:84,90,134`)
- `artifacts/{APP_ID}/users/{ownerId}/lessons/{lessonId}/cards/{cardId}/comments/{commentId}` (`services/comment-paths.ts:14,37`)
- `artifacts/{APP_ID}/userProgress/{userId}/lessons/{lessonId}/cards/{cardId}` and `artifacts/{APP_ID}/userProgress/{userId}/studyStats/daily` (`services/progress.service.ts:42-74`)

Admin SDK (server):
- `artifacts/{APP_ID}/users/{ownerId}/lessons/{lessonId}` (`actions/access.actions.ts:40`; `services/shared-preview.service.ts:65-69`) and `collectionGroup("lessons")` (`shared-preview.service.ts:111`)

Firebase Storage: `users/{userId}/cards/{cardId}_{timestamp}.{ext}` (`services/image.service.ts` docblock).

`src/functions/` touches nothing on behalf of this feature (its two functions are notification-scoped — see §8).

### Shared dependencies
`@/shared/components/ui` (37), `@/shared/utils` (23, incl. `shareToken`, `atomicCard`, `reorder`), `@/lib/app-store` (17), `@/shared/schemas` (12 — lesson metadata / share invite / generated-card zod schemas), `@/lib/firebase` (9), `@/shared/audio` (8), `@/shared/providers` (6 — `useAlert`), `@/shared/components/layout` (3), `@/lib/firebase-admin` (2), `@/lib/app-id` (2), `@/lib/logging/*` (4), `@/shared/hooks` (1), `@/shared/constants` (1).

### Related features (verified)
- `game` (29 imports — session/leaderboard/stats services, domain combo/tier, shared game screens), `ai` (6 — `useAICard`, `useAIDeck`/`useAIImageDeck` in `AIBulkPanel`/`LessonBuilderImportPane`, `useAIExplanation` in `FlashcardMistakeReview`, `generateMatchDistractors` in `useMatchModeSession`), `user` (3 — `useUserProgress`), `notifications` (3 — `emitNotification`, `notifyInvite` from `access.service.ts:11`).

---

## 4. `features/game`

### Purpose
Observed — cross-mode competitive infrastructure. Docblocks: *"Combo-scoring formulas — the single source of truth kana (quiz + survival), Speed, and Match all import from"* (`domain/combo.ts:1-5`); *"Tier system for competitive game modes. Score thresholds are shared across Match and Speed modes"* (`domain/tier.ts:1-6`); *"Manages a single Firestore game session lifecycle: start → live score updates (debounced) → finish"* (`hooks/useGameSession.ts:13-20`).

### Responsibilities
- Game session documents (create/update/finish) (`services/session.service.ts:13,33,49`).
- Public per-mode leaderboards (real-time top-N; transactional best-score promotion) (`services/leaderboard.service.ts:27,56`; `services/persist-best-score.ts:13-25`).
- Personal-best stats per mode (`services/stats.service.ts:15,33,46` — `subscribePersonalBests`, `recordGameResult`, `subscribeGameStats`).
- Pure domain: `comboMultiplier`/`comboBonusAdditive`, `scoreToTier` + tier metadata.
- Shared presentational game components (intro/results screens, leaderboard, lives, streak HUD, stat grid, tier badge).

### Entry points
- None of its own — no `page.tsx` under `src/app` imports `@/features/game` except the kana-survival screen components in `app/[locale]/(immersive)/kana/survival/_components/` (verified by grep across `src/app`). All other consumption is from other features (`flashcard`, `kana`, `home`, `user`).

### Pages
- No dedicated routes. Appears inside `/kana/quiz`, `/kana/survival`, `/flashcard/[id]/{match,speed,study}` and shared equivalents, and `/` (home stats) via consuming features (Inferred from the import graph in "Related features" sections above).

### Components (8)
`GameIntroScreen`, `GameResultsScreen`, `Leaderboard`, `LivesDisplay`, `MiniLeaderboard`, `StatGrid`, `StreakHud` (exports `GameStreakScoreStack`, `StreakComboBadge`), `TierBadge` (`components/index.ts`).

### Hooks (2)
- `useGameSession` — session identity + debounced score sync (docblock cited above).
- `useLeaderboard` — real-time top-N subscription with rank/current-user computation (`hooks/useLeaderboard.ts:14-17`).

### Services / Server Actions
All **client SDK**; no server actions.
- `session.service.ts` — `createGameSession`, `updateGameScore`, `finishGameSession`.
- `leaderboard.service.ts` — `subscribeLeaderboard`, `submitScore`.
- `stats.service.ts` — `subscribePersonalBests`, `recordGameResult`, `subscribeGameStats`.
- `persist-best-score.ts` — internal transactional writer shared by the three (deliberately not in the barrel, its docblock lines 22-25).

### Firebase collections
- `artifacts/{APP_ID}/public/data/game_sessions` (`services/session.service.ts:7`)
- `artifacts/{APP_ID}/public/data/leaderboard_{gameMode}/{userId}` (`services/persist-best-score.ts:5-7`, `services/leaderboard.service.ts:33`)
- `artifacts/{APP_ID}/users/{userId}/stats/{gameMode}` (`services/persist-best-score.ts:9-11`, `services/stats.service.ts:19,50`)

### Shared dependencies
`@/lib/firebase` (4), `@/shared/components/ui` (2), `@/shared/hooks` (1).

### Related features
- Outbound: none (grep found no `@/features/` imports inside `features/game`). Inbound: `flashcard` (29), `kana` (5), `home` (2), `user` (1).

---

## 5. `features/user`

### Purpose
Observed — authentication and the user's own progress document. Docblocks: *"Firebase Auth integration hook… Uses `onIdTokenChanged` for auth state + cookie management; Delegates login logging to server-side deduplication service"* (`hooks/useFirebaseAuth.ts:13-26`); *"Manages XP, daily streak, and lesson completion counts strictly synced with Firebase"* (`hooks/useUserProgress.ts:11`); *"Hook to track user activity by heartbeat updates to Firestore. Throttled to prevent excessive writes"* (5-minute throttle) (`hooks/useActivityTracker.ts:9-12`).

### Responsibilities
- Google sign-in (popup + redirect fallback), sign-out, and the auth cookie used by the route-guard middleware (`services/auth.service.ts:14-19`; cookie checked in `src/proxy.ts`).
- Server-side login/logout logging with a 30-minute session-dedup window (`services/auth-logging.service.ts:8-9`).
- The user progress document (`progress` field: XP, streak, learnedChars, charStats) — subscribe/update (`services/user.service.ts`).
- Delivering email-keyed pending notifications on login (`hooks/useFirebaseAuth.ts:7`).
- Best-scores facade over game services (`hooks/useBestScores.ts:5-9`).

### Entry points
- Mounted globally: `useFirebaseAuth()` and `useActivityTracker()` run inside the app-shell providers (`src/lib/providers.tsx:51-52`).
- `/login` (`src/app/[locale]/login/page.tsx`) calls `signInWithGoogle`, `signInWithGoogleRedirect`, `completeGoogleRedirectSignIn` (lines 6-10).
- `/settings` and `/profile` call `signOut` and `useUserProgress` (`SettingsPageClient.tsx:9-10`, `profile/page.tsx:11-12`).

### Pages
No routes of its own; participates in `/login`, `/settings`, `/profile`, and every authenticated page via the providers.

### Components
- None (no components directory).

### Hooks (4)
`useFirebaseAuth`, `useUserProgress`, `useActivityTracker`, `useBestScores` (purposes above).

### Services / Server Actions
- `auth.service.ts` — **client SDK** sign-in/out + cookie persistence.
- `auth-logging.service.ts` — `"use server"`, **Admin SDK**; login/logout logging with dedup via `login_sessions` and `persistSystemLog`.
- `user.service.ts` — **client SDK**; progress doc subscribe/transactional update.

### Firebase collections
- `artifacts/{APP_ID}/users/{userId}` (progress doc; `services/user.service.ts:9-10`)
- `login_sessions/{uid}` (Admin SDK; `services/auth-logging.service.ts:8,32,92`)
- `system_logs` via `persistSystemLog` (`src/lib/logging/server.ts:33-34`)

### Shared dependencies
`@/lib/app-store` (4), `@/lib/firebase` (3), `@/shared/utils` (2 — `setAuthCookie`/`clearAuthCookie`), `@/lib/safe-action` (1 — `verifyIdToken`), `@/lib/logging/*` (2), `@/lib/firebase-admin` (1).

### Related features (verified)
- `notifications` (1 — `deliverPendingNotifications` on login), `game` (1 — `submitScore`/`subscribePersonalBests` inside `useBestScores`).

---

## 6. `features/notifications`

### Purpose
Observed — an in-app notification platform. Docblocks: *"The normalized event vocabulary of the notification platform"* (`domain/events.ts:1-9`); *"The notification type registry — the single source of truth mapping each NotificationKind to its policy: priority, category, whether a producer is wired this phase, and how it collapses"* (`domain/registry.ts:1-6`); *"Server-side Notification Service. The single authorized writer for cross-user notifications, using the Admin SDK"* with sender-verified, recipient-derived, idempotent/collapsing writes (`actions/notification.actions.ts:3-17`); *"SECURITY BY CONSTRUCTION: the client sends only IDENTIFIERS… never `senderId`… or `recipientId`"* (`schema.ts:1-10`).

### Responsibilities
- Domain layer (pure): event kinds, policy registry, deterministic collapse IDs (cyrb53 hash), copy/share-link builders, display formatting (`domain/`).
- Server-side authorized writer `emitNotificationAction` + `notifySystemEvent` (**Admin SDK**) (`actions/notification.actions.ts:99,170`).
- Client lifecycle: subscribe (real-time, index-fallback), mark read, soft-delete/restore, batch ops, pending (pre-login, email-keyed) invite creation and login-time delivery (`services/notification.service.ts:1-16`, `services/notification-pending.ts:1-10`).
- One app-wide `onSnapshot` listener lifted into `NotificationsContext` (mounted once in providers; rationale in its docblock, `context/NotificationsContext.tsx:6-22`).
- Activity-log server actions for read/delete/read-all/cleared/delivered (`actions/activity-log.actions.ts:41-137`).
- Cloud Functions (separate package `src/functions/`): `dailyNotificationDigest` (scheduled digest of stale unread notifications, `functions/src/digest.ts:1-14`) and `fanOutNotifications`/`deliverNotificationTask` (durable multi-recipient fan-out via Cloud Tasks; *"No current product action triggers this yet"*, `functions/src/fanout.ts:1-14`).

### Entry points
- `NotificationsProvider` mounted app-wide (`src/lib/providers.tsx:89`).
- `/notifications` page (`src/app/[locale]/(main)/notifications/page.tsx`) — inbox UI using the context, services, and activity-log actions (lines 8-26).
- `BottomNav` unread badge (`src/app/[locale]/(main)/_components/BottomNav.tsx:9`).

### Pages
`/notifications` (the inbox list components live under `app/` — see §11).

### Components (3 + 1 helper)
`NotificationRow`, `NotificationIcon`, `InviteActions` (accept/decline invite buttons; decline calls the flashcard feature's `declineInviteAction`, `components/InviteActions.tsx:8`), plus `withFreshToken.ts` (token-then-act helper, its docblock).

### Hooks
- None as standalone hook files; `useNotifications()` is exported from `NotificationsContext` (Observed in `context/NotificationsContext.tsx` and its consumers).

### Services / Server Actions
Client SDK services: `notification.service.ts` (mutations + re-export hub), `notification-paths.ts` (paths + batch/TTL constants), `notification-pending.ts` (email-keyed pending invites — *"The only client-created notifications"*, docblock lines 5-9), `notification-subscribe.ts` (real-time listener with index fallback), `notify.ts` (fire-and-forget client facade → server writer).
Server actions (**Admin SDK**): `emitNotificationAction`, `notifySystemEvent` (`actions/notification.actions.ts`); activity-log actions (5) (`actions/activity-log.actions.ts`).

### Firebase collections
- `artifacts/{APP_ID}/users/{userId}/notifications/{notificationId}` (`services/notification-paths.ts:30,34`; Admin-side writes in `actions/notification.actions.ts` via `collapseId` doc IDs)
- `artifacts/{APP_ID}/pendingNotifications/{normalizedEmail}/items` (`services/notification-paths.ts:42`)
- Cloud Functions (`src/functions/`): `artifacts/{appId}/users/{recipientId}/notifications/{docId}` (`functions/src/fanout.ts:46-51`, `functions/src/digest.ts:56-60`), `collectionGroup("notifications")` (`digest.ts:122`), `admins/{uid}` for the fan-out caller's admin check (`fanout.ts:121`).

### Shared dependencies
`@/lib/firebase` (5), `@/shared/components/ui` (2), `@/lib/safe-action` (2), `@/lib/firebase-admin` (2), `@/shared/providers` (1), `@/lib/logging/*` (2), `@/lib/app-store` (1), `@/lib/app-id` (1).

### Related features (verified)
- `flashcard` (1 — `declineInviteAction`). Inbound: `flashcard` (3), `admin` (1 — `notifySystemEvent`), `user` (1 — pending delivery).

---

## 7. `features/admin`

### Purpose
Observed — the admin console. Route docblocks: *"Main entry point for the Admin Dashboard… administrative overview and dashboard analytics"* (`src/app/[locale]/(main)/admin/page.tsx:4-8`); *"Admin Users Management Page… searching, filtering, and managing platform users"* (`admin/users/page.tsx:4-7`). RBAC is a two-role permission table (`superadmin`, `admin`) over capabilities like `canDeleteUsers`, `canPromoteUsers`, `canManageContent` (`features/admin/utils/rbac.ts:3-20`).

### Responsibilities
- Dashboard overview (growth/role charts, system health, quick actions) (`components/dashboard/`).
- User management: paginated Firebase Auth user list, role grant/revoke, delete (`services/user.service.ts`, `actions/admin.actions.ts:59-113`).
- Content moderation: global deck list (collectionGroup), deck card inspection, deck deletion incl. orphaned-card cleanup and owner notification (`services/content.service.ts:99-133`).
- Analytics: aggregate charts (engagement, retention, content distribution, log volume/level/top actions) + click-through drill-downs + CSV exports (`services/analytics*.ts`, `hooks/useAnalyticsExport.ts`).
- Reports: paginated, filterable `system_logs` viewer with virtualized list (`components/reports/`, `services/log.service.ts`).
- Settings: explicit "not available" placeholder — *"Global platform configuration is not yet wired to a backend"* (`components/settings/AdminSettingsPageContent.tsx:11-16`).
- Route guarding (`AdminGuard`) + app-wide role context (`context/AdminContext.tsx`, mounted once in `src/lib/providers.tsx:88`).

### Entry points
| page.tsx | Route | Mounts |
|---|---|---|
| `src/app/[locale]/(main)/admin/page.tsx` | `/admin` | `AdminOverviewPage` |
| `.../admin/users/page.tsx` | `/admin/users` | `AdminUsersPageContent` |
| `.../admin/content/page.tsx` | `/admin/content` | `AdminContentPageContent` |
| `.../admin/analytics/page.tsx` | `/admin/analytics` | `AdminAnalyticsPageContent` |
| `.../admin/reports/page.tsx` | `/admin/reports` | `AdminReportsPageContent` |
| `.../admin/settings/page.tsx` | `/admin/settings` | `AdminSettingsPageContent` |

All wrapped by `src/app/[locale]/(main)/admin/layout.tsx` (`AdminGuard` + `AdminSidebar`).

### Pages
The six `/admin*` routes above. `AdminContext` is also consumed on `/profile` (admin badge link, `profile/page.tsx:9`), in `BottomNav`, and by the command palette.

### Components (59 `.tsx` excluding tests)
- `shared/` (17): `AdminGuard` (route guard), `AdminSidebar`, `AdminPageLayout`, `AdminPageHeader`, `AdminCard`, `AdminStatCard`, `AdminChartContainer`, `ChartSkeleton`, `AdminTable`, `AdminTableShell`, `DataTableHeader`, `DataTableBody`, `DataTableMobileList`, `AdminSearchInput`, `AdminDateRangeFilter`, `AdminBulkActionsBar`, `AdminErrorState`.
- `dashboard/` (5): `AdminOverviewPage`, `GrowthChart`, `RoleChart`, `SystemHealthCard`, `QuickActionsCard`.
- `users/` (10): `AdminUsersPageContent`, `UsersTable`, `UsersTableToolbar`, `UsersTablePagination`, `UsersActionConfirmModal`, `UserCell`, `RoleCell`, `ActionsCell`, `UserMobileRow`, `UserIdentityAvatar`.
- `content/` (6): `AdminContentPageContent`, `ContentOverviewStats`, `DecksTable`, `DeckCardItem`, `DeckMobileRow`, `DeckDetailsPanel`.
- `analytics/` (10): `AdminAnalyticsPageContent`, `AnalyticsDetailModal` (drill-down), `AnalyticsExportModal` (CSV), `EngagementChart`, `RetentionChart`, `ContentDistributionChart`, `LogVolumeChart`, `LogLevelChart`, `TopActionsChart`, `ErrorTrendChart`.
- `reports/` (10): `AdminReportsPageContent`, `LogsVirtualList`, `LogsFilters`, `LogsSummaryHeader`, `LogRow`, `LogLevelBadge`, `LogSourceBadge`, `LogTypeBadge`, `LogMetadataViewer`, `LogCopyButton`.
- `settings/` (1): `AdminSettingsPageContent`.

### Hooks (14)
`useAdminToken` (fresh ID token getter), `useAdminRoleCheck` (server-verified role), `useAdminDashboard`, `useAnalytics`, `useAnalyticsDrilldown`, `useAnalyticsExport`, `useLogs` (cursor-paginated logs, react-query), `useUsers` (paginated users + role/delete mutations), `useUsersTable`, `useUsersTableColumns`, `useDecksTableColumns`, `useGlobalContent`, `useDataTable` (@tanstack/react-table wrapper), `useCursorPagination` (Firestore cursor bookkeeping, its docblock). Context: `AdminContext` (`useAdminRole`).

### Services / Server Actions
All services are **server-only Admin SDK** (`import "server-only"` at the top of each):
- `admin.service.ts` — safe-action clients, admin assertion from ID token/cookie, `clampLimit`; re-exports `adminAuth`/`adminDb`.
- `user.service.ts` — Auth user listing/mapping, stats, role writes, `metadata/counters`.
- `content.service.ts` — global lessons (collectionGroup), per-deck cards, deletion with orphan cleanup.
- `log.service.ts` — `system_logs` fetch with filters + test-log write.
- `analytics.service.ts` + `analytics-constants.ts`, `analytics-content.ts`, `analytics-engagement.ts`, `analytics-logs.ts`, `analytics-retention.ts`, `analytics-drilldowns.ts` — chart builders and drill-down queries.

Server actions: 20 exported `*Action` functions in `actions/admin.actions.ts` (fetch users/stats/analytics/logs/dashboard/content/role/drilldowns, set role, delete user, delete deck, create test log, 4 CSV exports; lines 59-353). Deck deletion and role changes also emit `notifySystemEvent` (`actions/admin.actions.ts:7`).

### Firebase collections (all Admin SDK)
- `admins/{uid}` (`services/user.service.ts:10,92,127,148`; `services/admin.service.ts:26`; `services/analytics-drilldowns.ts:99,162`)
- `artifacts/{APP_ID}/users/{uid}` (`services/user.service.ts:39,49-51,75-77`; `services/analytics.service.ts:87-89`; `actions/admin.actions.ts:309-311`; `services/analytics-drilldowns.ts:28-30,69-71`)
- `artifacts/{APP_ID}/users/{ownerId}/cards` (flat; filtered by `lessonId`) (`services/content.service.ts:80-87,117-124`)
- `collectionGroup("lessons")` (`services/user.service.ts:88`; `services/content.service.ts:11-12`; `services/analytics.service.ts:66`; `services/analytics-drilldowns.ts:279`; `actions/admin.actions.ts:333`)
- `metadata/counters` (`services/user.service.ts:65`)
- `system_logs` (`services/log.service.ts:40`; `services/analytics.service.ts:72`; `actions/admin.actions.ts:358`; `services/analytics-drilldowns.ts:149`)
- `analytics_daily` (`actions/admin.actions.ts:278`)
- `artifacts/{APP_ID}/public/data/game_sessions` (`services/analytics.service.ts:74-78`; `services/analytics-drilldowns.ts:154-158`)

### Shared dependencies
`@/shared/components/ui` (38), `@/shared/utils(/cookie)` (4), `@/lib/safe-action` (2), `@/lib/firebase-admin` (2), `@/lib/app-store` (2), `@/lib/logging/*` (3), `@/lib/app-id` (1), `@/shared/hooks` (1).

### Related features (verified)
- `flashcard` (6 — `FlashCard` type / `DEFAULT_DECK_THEME_COLOR` in content components, `useDecksTableColumns`, `content.service.ts`), `notifications` (1 — `notifySystemEvent`).

---

## 8. `features/ai`

### Purpose
Observed — Gemini generation behind Firebase AI Logic. Docblock: *"Public AI generation API — orchestrates the transport (gemini-transport), parsing (gemini-parsing), and dedup (gemini-dedup) modules into the generateCardData/generateDeck/generateDeckFromImages functions"* (`services/gemini.service.ts:1-9`). Transport note: *"All Gemini calls are proxied through Firebase AI Logic — no API key is ever present in client code or the client bundle"* (`services/gemini-transport.ts:8-11`).

### Responsibilities
- Single-card generation (word → meaning/example/hint/mnemonic/cloze etc., `types.ts:1-17`), topic-based deck generation, deck-from-images (multimodal), and Match-mode decoy tiles (`services/gemini-distractors.ts:1-7`).
- Prompt catalog (`prompts/`: `card.generate`, `deck.generate`, `deck.from-images`, `match.distractors`, shared system prompt) and JSON response schemas (`schemas/card.schema.ts`, `schemas/deck.schema.ts`).
- Zod validation of untrusted model output into `GeneratedCard` (`services/gemini-parsing.ts`, using `@/shared/schemas`).
- Dedup of generated decks against existing words (`services/gemini-dedup.ts`).
- Config from `NEXT_PUBLIC_AI_*` env vars with defaults (model `gemini-2.5-flash-lite`, temperature 0.4, 5–30 deck cards) (`config.ts:7-22`).
- In-memory card/deck caches (`services/gemini.service.ts:23-24`).

### Entry points
- None of its own; consumed exclusively by `flashcard` (verified: the only `@/features/ai` imports in the repo are in `features/flashcard` — `AIBulkPanel.tsx`, `LessonBuilderImportPane.tsx`, `useLessonBuilder.ts`, `FlashcardMistakeReview.tsx`, `games/match/hooks/useMatchModeSession.ts`).

### Pages
- No routes. Active on `/flashcard/create`, `/flashcard/[id]/edit` (builder AI panels), `/flashcard/[id]/match` (distractors), and the mistake-review player (memory tips) (Inferred from the consumer list above).

### Components
- None.

### Hooks (5)
`useAIGeneration` (generic transition-backed wrapper, its docblock), `useAICard`, `useAIDeck` (both are `useAIGeneration` bound to one service fn), `useAIImageDeck`, `useAIExplanation` (lazy mnemonic on card reveal, its docblock).

### Services / Server Actions
All **client-side** (Firebase client SDK `firebase/ai`; no server actions):
`gemini.service.ts` (orchestrator/facade), `gemini-transport.ts` (Firebase AI Logic calls), `gemini-parsing.ts` (zod validation + `AIServiceError` classification), `gemini-dedup.ts` (pure), `gemini-distractors.ts` (Match decoys).

### Firebase collections
- None (no Firestore access in this feature).

### Shared dependencies
`@/shared/schemas` (generated-card zod schemas), `@/shared/utils` (`splitAtomicPrimary`, `validateAtomicCard`), `@/lib/firebase` (`firebaseAI`).

### Related features
- Outbound: none. Inbound: `flashcard` (6).

---

## 9. `features/command-palette`

### Purpose
Observed — a ⌘K/Ctrl+K palette. Launcher docblock: *"Always-mounted (cheap: one keydown listener) so ⌘K/Ctrl+K works from any route. The actual cmdk UI is only imported after the first keypress"* (`components/CommandPaletteLauncher.tsx:8-13`).

### Responsibilities
- Global keyboard shortcut + lazy-loaded `cmdk` dialog (`CommandPaletteLauncher.tsx`, `CommandPalette.tsx`).
- Static action registry: `MAIN_ACTIONS` (*"mirrors BottomNav.tsx's route list"*) and `ADMIN_ACTIONS` (*"mirrors AdminSidebar.tsx's route list exactly"*), route+icon only, labels/keywords from the i18n catalog (`data/actions.ts:16-38`).
- Admin actions gated by `useAdminRole()` (`components/CommandPalette.tsx:10`).

### Entry points
- Mounted once app-wide inside the providers tree (`src/lib/providers.tsx:9,91`).

### Pages
- No routes of its own; available on every route.

### Components (2)
`CommandPalette` (cmdk dialog + fuzzy search), `CommandPaletteLauncher` (keydown latch + dynamic import).

### Hooks / Services / Server Actions / Firebase collections
- None / none / none / none.

### Shared dependencies
- None from `@/shared` or `@/lib` (grep found zero; it uses `@/i18n/navigation`, `@base-ui/react`, `cmdk`, `lucide-react`).

### Related features (verified)
- `admin` (1 — `useAdminRole`).

---

## 10. App-level product surfaces (logic outside `features/`)

### 10.1 Login
- **Entry/Pages**: `src/app/[locale]/login/page.tsx` → `/login` (in `PUBLIC_PATHS` of the auth middleware, `src/proxy.ts:9`); own `error.tsx`.
- **Observed**: Google sign-in button; on mount completes a redirect sign-in (`completeGoogleRedirectSignIn`), maps error codes to translated messages, falls back from popup to redirect flow (page lines 6-45). Delegates entirely to `features/user` services.

### 10.2 Settings
- **Entry/Pages**: `src/app/[locale]/(main)/settings/page.tsx` (server) + `SettingsPageClient.tsx` → `/settings`.
- **Observed**: server component reads managed flags via `getFlags()` and passes `locale_switch_enabled` down (page lines 1-8); the flag is described as *"a kill switch for the UI control, not for /ja routing itself"* (`SettingsPageClient.tsx:22`). Client renders: handwriting toggle, audio auto-play, SFX mute, voice mute (all from `@/lib/app-store`), locale switcher, progress reset (`useUserProgress().resetProgress`), sign out (`SettingsPageClient.tsx:26-45`).

### 10.3 Profile
- **Entry/Pages**: `src/app/[locale]/(main)/profile/page.tsx` → `/profile`.
- **Observed**: XP level math (500 XP/level), accuracy from `charStats`, deck count from `useLessons`, admin-role badge via `useAdminRole`, sign out (page lines 9-42).

### 10.4 Notifications inbox UI
- **Entry/Pages**: `src/app/[locale]/(main)/notifications/page.tsx` → `/notifications`, with `_components/`:
  - `NotificationsVirtualList.tsx` — *"Windowed, time-grouped notification list — real virtualization via `@tanstack/react-virtual`"* (its docblock); consumes `NotificationRow`, `flattenNotificationGroups` from the feature and `useNow` from shared hooks (lines 7-9).
  - `NotificationsPlaceholders.tsx` — empty state + skeleton rows.
- Page-level logic: all/unread filter, mark-all-read, clear-all with undo-style restore, activity-log calls (page lines 8-45).

### 10.5 Kana Survival screens
- **Entry/Pages**: `src/app/[locale]/(immersive)/kana/survival/page.tsx` → `/kana/survival`, with `_components/`: `SurvivalSetupScreen`, `SurvivalQuizScreen`, `SurvivalDropScreen`, `SurvivalGameOverScreen`.
- **Observed**: the page wires `useSurvivalGame` + `useKanaDataset` (feature `kana`) and `useBestScores` (feature `user`); the four screens import from `@/features/game` (leaderboard/HUD components) (page lines 5-13; grep of `_components/`).

### 10.6 Bottom navigation
- `src/app/[locale]/(main)/_components/BottomNav.tsx` — main tab bar for the `(main)` group; unread badge from `NotificationsContext`, admin shield tab via `useAdminRole`, profile avatar from `@/lib/app-store` (lines 8-12).

### 10.7 Shared-deck public surface
- `src/app/[locale]/(main)/flashcard/shared/[shareId]/SharedLessonPageClient.tsx` — client half of the shared-deck landing page (unwraps the server preview promise; see §3 entry points).
- `.../opengraph-image.tsx` — per-deck OG image via `next/og`, fetching a Noto Sans JP subset for CJK glyphs (its docblock). The route (and its hashed image asset) is the only public dynamic path pattern in the middleware (`src/proxy.ts:18`).

### 10.8 App shell, errors, SEO
- `src/app/_components/`: `ErrorFallback.tsx`, `MaintenanceScreen.tsx` (*"Rendered by the root layout in place of the app when the maintenance_mode flag (src/lib/flags.ts, Remote Config) is on"*, its docblock; flag defined at `src/lib/flags.ts:21,82`), `ReactScan.tsx`.
- Error boundaries: `app/global-error.tsx`, `app/[locale]/(main)/error.tsx`, `app/[locale]/(immersive)/error.tsx`, `app/[locale]/login/error.tsx`; `app/[locale]/not-found.tsx`.
- SEO: `app/robots.ts`, `app/sitemap.ts`.
- Providers composition (`src/lib/providers.tsx:88-93`): `AdminProvider` → `NotificationsProvider` → children + `CommandPaletteLauncher`, with `useFirebaseAuth()`/`useActivityTracker()` running above them (lines 51-52).
- Auth/i18n middleware: `src/proxy.ts` — next-intl routing plus cookie-based auth gating (`COOKIE_NAME` from `@/shared/utils/cookie`), public paths `/login`, `/sitemap.xml`, `/robots.txt` and the shared-deck pattern; also PostHog ingest proxying (lines 9-22).

---

## Summary table

Counts are `.tsx`/`.ts` files excluding `*.test.*` and barrel `index.ts` files; "components" counts files under `components/` directories; "hooks" counts `use*` files (plus noted stores/contexts); "services" counts files under `services/` (flashcard additionally has 2 action files, kana/notifications/admin actions noted inline).

| Feature | Components | Hooks | Services (files) | Server-action files | Pages (routes) | Firestore paths touched |
|---|---|---|---|---|---|---|
| `home` | 1 | 1 | 0 | 0 | `/` | — (via flashcard/game/user) |
| `kana` | 21 | 8 (+1 store) | 0 | 1 (2 log actions) | `/kana`, `/kana/chart`, `/kana/learn`, `/kana/practice`, `/kana/quiz`, `/kana/survival` | — (via game/user services; `system_logs` via lib/logging) |
| `flashcard` | 53 | 23 (+1 loader hook) | 15 | 2 (`declineInviteAction` + 7 log actions) | `/flashcard`, `/flashcard/create`, `/flashcard/[id]`, `/flashcard/[id]/edit`, `/flashcard/[id]/{study,match,speed}`, `/flashcard/shared/[shareId]`, `/flashcard/shared/[shareId]/{study,match,speed}` | `artifacts/{APP_ID}/users/{uid}/lessons/*`, `.../users/{uid}/cards/*`, `.../lessons/{id}/cards/{id}/comments/*`, `artifacts/{APP_ID}/userProgress/{uid}/**`, `collectionGroup(lessons)`; Storage `users/{uid}/cards/*` |
| `game` | 8 | 2 | 4 | 0 | — (embedded in kana/flashcard/home) | `artifacts/{APP_ID}/public/data/game_sessions`, `.../public/data/leaderboard_{mode}/{uid}`, `.../users/{uid}/stats/{mode}` |
| `user` | 0 | 4 | 3 | (auth-logging is `"use server"`) | `/login` + app-wide providers | `artifacts/{APP_ID}/users/{uid}`, `login_sessions/{uid}`, `system_logs` |
| `notifications` | 3 (+1 helper) | 0 (context) | 5 | 2 (`emitNotificationAction`, `notifySystemEvent` + 5 log actions) | `/notifications` + app-wide provider | `artifacts/{APP_ID}/users/{uid}/notifications/*`, `artifacts/{APP_ID}/pendingNotifications/{email}/items`; Functions: same + `collectionGroup(notifications)`, `admins/{uid}` |
| `admin` | 59 | 14 (+1 context) | 11 | 1 (20 actions) | `/admin`, `/admin/users`, `/admin/content`, `/admin/analytics`, `/admin/reports`, `/admin/settings` | `admins/*`, `artifacts/{APP_ID}/users/*` (+ flat `cards`), `collectionGroup(lessons)`, `metadata/counters`, `system_logs`, `analytics_daily`, `artifacts/{APP_ID}/public/data/game_sessions` |
| `ai` | 0 | 5 | 5 | 0 | — (embedded in flashcard routes) | — (no Firestore) |
| `command-palette` | 2 | 0 | 0 | 0 | — (global overlay) | — |

### Cross-feature import graph (verified by grep)

| From \ To | admin | ai | flashcard | game | kana | notifications | user |
|---|---|---|---|---|---|---|---|
| `admin` | — | | 6 | | | 1 | |
| `command-palette` | 1 | | | | | | |
| `flashcard` | | 6 | — | 29 | | 3 | 3 |
| `home` | | | 7 | 2 | 1 | | 1 |
| `kana` | | | | 5 | — | | 4 |
| `notifications` | | | 1 | | | — | |
| `user` | | | | 1 | | 1 | — |

(`ai` and `game` import from no other feature.)
