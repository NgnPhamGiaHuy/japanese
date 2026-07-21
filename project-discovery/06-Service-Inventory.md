# 06 — Service Inventory

Discovery-phase documentation. Source of truth: the code under `/Users/yuh.nguyenpham/GitHub/japanese/src/` as of the current working tree. All relative paths below are relative to that `src/` directory unless noted.

## Scope and method

- **Observed**: Enumerated every file in `features/*/services/` and `features/*/actions/`, the service-like modules in `lib/` (Firebase wrappers, logging, PostHog, feature flags, safe-action layer), and `functions/src/` (Cloud Functions). Test files (`*.emu.test.ts`, `*.test.ts`) are listed but not documented as services.
- Execution context was verified per file via directives and imports: `"use server"` directive, `import "server-only"`, `@/lib/firebase` (client SDK) vs `@/lib/firebase-admin` (Admin SDK), and `firebase-functions` (Cloud Functions).
- Firestore/Storage paths are taken from string literals in the files.
- Callers come from grepping imports across `src/` (excluding tests and `node_modules`).

## Totals

| Group | Modules documented (excl. barrels & tests) |
|---|---|
| Flashcard services | 14 |
| Flashcard actions | 2 |
| Game services | 4 |
| User services | 3 |
| Notifications services | 5 |
| Notifications actions | 2 |
| AI (Gemini) services | 5 |
| Admin services | 11 |
| Admin actions | 1 |
| Kana actions | 1 |
| `lib/` service modules | 13 |
| Cloud Functions (`functions/src/`) | 3 |
| **Total** | **64** |

Barrels observed: `features/flashcard/services/index.ts`, `features/game/services/index.ts`, `features/user/services/index.ts`, `features/notifications/services/index.ts`, `features/{admin,kana,notifications}/actions/index.ts`, `functions/src/index.ts`. Test files observed: `features/admin/services/content.service.emu.test.ts`, `features/user/services/user.service.emu.test.ts`, `features/notifications/actions/notification.actions.emu.test.ts`, `lib/logging/user-actions.emu.test.ts`, `functions/src/{digest,fanout}.emu.test.ts`.

## Execution-context legend

| Context | Meaning (verified via) |
|---|---|
| **client** | Client Firebase SDK (`@/lib/firebase`), runs in the browser |
| **use server** | Next.js Server Action module (`"use server"` directive) |
| **server-only** | `import "server-only"`; Admin SDK (`@/lib/firebase-admin`); importable from server components/actions only |
| **cloud function** | `firebase-functions` v2 triggers in `src/functions/` (separate deploy target) |

---

## Flashcard services — `features/flashcard/services/`

All **client** context except `shared-preview.service.ts` (**server-only**). Base Firestore namespace used throughout: `artifacts/{APP_ID}/…` (`APP_ID` from `lib/app-id.ts`, default `"kana-nihongo-master"`).

| File | Purpose | Exported functions | Context | Firestore/Storage paths |
|---|---|---|---|---|
| `lesson-paths.ts` | Firestore path helpers for lessons + share-ID re-export (split from lesson.service, per docblock E11-T3) | `lessonsCol(userId)`, `lessonDoc(userId, lessonId)`, re-export `buildShareId` | client | `artifacts/{APP_ID}/users/{uid}/lessons[/{lessonId}]` |
| `lesson-normalize.ts` | Normalizes raw lesson docs into the `Lesson` shape; newest-first comparator | `normalizeLesson(raw)`, `newestFirst(a, b)` | client | — |
| `lesson-subscriptions.ts` | The three real-time lesson listeners | `subscribeLessons(userId, onUpdate, onError)` — own lessons; `subscribeSharedLessons(…)` — collectionGroup where user has a role (falls back to legacy `collaborators` array-contains query on error); `subscribePublicLessons(currentUserId, …)` — collectionGroup `isPublic == true`, excluding own | client | `lessonsCol`; `collectionGroup("lessons")` |
| `lesson-save.ts` | `saveLessonWithCards` — diff-based, non-destructive atomic save: validation, diff vs existing cards, Storage image cleanup, fractional-index order re-stamping, one WriteBatch | `saveLessonWithCards(userId, lesson, cards, isNew)` | client | `lessonsCol`, `cardsCol`, `cardDoc`; deletes Storage images via `deleteCardImage` |
| `lesson.service.ts` | Orchestrator: keeps simple write ops and re-exports the split modules so old import paths keep working | `updateLesson`, `reorderLessons` (batch order writes), `shareLessonSettings` (writes `shareId`, `allowLinkAccess`, `publicRole`, `isPublic`, `lastShared*`), `updateLessonRoles`, `deleteLessonWithCards` (batch-deletes lesson + cards + Storage images); re-exports from lesson-paths/-normalize/-subscriptions/-save | client | `lessonDoc`, `cardsCol` |
| `card.service.ts` | Card documents: real-time subscription (with legacy-schema healing), CRUD, batch reorder, SRS grading/reset delegation | `cardsCol`, `cardDoc` (path helpers); `subscribeCards(userId, onUpdate, onError, lessonId?)`, `createCard`, `updateCard`, `deleteCard`, `reorderCards`, `gradeCard` (delegates to progress.service), `resetCardProgress`, `resetLessonProgress` | client | `artifacts/{APP_ID}/users/{uid}/cards[/{cardId}]` |
| `progress.service.ts` | Per-user SRS state layer (replaces SRS fields on card docs, per file header); grading, resets, daily anti-burnout stats, catch-up redistribution | `userProgressLessonCol`, `userProgressCardDoc`, `dailyStatsDoc` (path helpers); `getUserLessonProgress`, `gradeCardForUser` (computes next SRS, upserts progress doc, increments daily count), `resetCardProgressForUser`, `resetLessonProgressForUser`, `getDailyProgress`, `incrementDailyReviewCount`, `redistributeOverdueCards` | client | `artifacts/{APP_ID}/userProgress/{uid}/lessons/{lessonId}/cards/{cardId}`; `artifacts/{APP_ID}/userProgress/{uid}/studyStats/daily` |
| `access.service.ts` | Access control for sharing: pending email invites → collaborator conversion, invite/revoke | `syncInviteToCollaborator(user, lesson, ownerId, lessonId)`, `inviteByEmail(…)`, `revokeEmailInvite(…)`; re-exports `canEdit`/`canComment`/`canStudy` from `utils/rbac` | client | `lessonDoc` (`roles`, `collaborators`, `invitedEmails`, `collaboratorMeta`, `lastShared*` fields) |
| `shared.service.ts` | Public/link deck sharing resolution: share-token decode, RBAC gate, paginated card fetch, progress merge; typed `SharedLoadError` | `getSharedLesson(shareId, currentUserId?, currentUser?)`, `SharedLoadError` class; re-export `decodeShareId` | client | `artifacts/{APP_ID}/users/{ownerId}/lessons/{lessonId}`; `cardsCol(ownerId)` (paginated at 200/page); progress via `getUserLessonProgress` |
| `shared-preview.service.ts` | Server-only Admin-SDK preview for the public shared-deck page (SEO/first paint) and sitemap listing; only public/link-accessible decks resolve | `getPublicSharedLessonPreview(shareId)` (wrapped in React `cache()`), `listPublicSharedLessonUrls()` (sitemap, `isPublic` only, capped 1000) | **server-only** | Admin SDK: `artifacts/{APP_ID}/users/{ownerId}/lessons/{lessonId}`; `collectionGroup("lessons").where("isPublic","==",true)` |
| `comment-paths.ts` | Comment path helpers | `commentsCol(ownerId, lessonId, cardId)`, `commentDoc(…, commentId)` | client | `artifacts/{APP_ID}/users/{ownerId}/lessons/{lessonId}/cards/{cardId}/comments[/{commentId}]` |
| `comment-errors.ts` | Typed comment errors + Firestore error mapping | `CommentErrorCode` enum, `CommentError` class, `mapFirestoreCommentError` | client | — |
| `comment-validation.ts` | Content validation and XSS-safe sanitization | `validateCommentContent`, `sanitizeCommentContent` | client | — |
| `comment.service.ts` | Threaded comment CRUD (2-level nesting: replies stored as array on parent doc; RBAC via deck roles, per docblock) | `addComment`, `replyToComment`, `resolveComment`, `getComments`, `subscribeToComments`, `updateComment`, `deleteComment`; re-exports errors/paths/validation | client | `commentsCol` / `commentDoc` |
| `image.service.ts` | Card image upload/delete on Firebase Storage; image-type + 2 MB validation | `uploadCardImage(file, userId, cardId)`, `deleteCardImage(imagePath)` | client | **Storage**: `users/{userId}/cards/{cardId}_{timestamp}.{ext}` |

**Callers (observed imports)**: flashcard hooks (`useCards`, `useCardsWithProgress`, `useLessons`, `useEditableLesson`, `useSharedLesson`, `useCommentCount`, `useCommentPanel`, `useShareInvites`, `useLessonBuilder`, `useDeckProgressStatus`), games hooks (`useMatchScoring`, `useStudySession`), loaders, dashboard components; `shared-preview.service` is imported by `app/sitemap.ts` and `app/[locale]/(main)/flashcard/shared/[shareId]/{page.tsx, opengraph-image.tsx}`; `notifications/domain/build.ts` imports from flashcard services (share-link building).

## Flashcard actions — `features/flashcard/actions/`

| File | Purpose | Exported functions | Context | Paths | Callers |
|---|---|---|---|---|---|
| `activity-log.actions.ts` | Per-feature audit-log wrappers over `lib/logging/activity.logActivity` | `logDeckCreated`, `logDeckUpdated`, `logDeckDeleted` (level `warn`), `logStudySessionCompleted`, `logStudyProgressReset` (warn), `logMatchGameCompleted`, `logSpeedGameCompleted` | **use server** | writes land in `system_logs` (via logging chain) | `useLessons`, `useStudySession`, `MatchGame.tsx`, `SpeedGame.tsx` |
| `access.actions.ts` | Admin-SDK invite decline: revokes the caller's own pending email invite (invitee has no write access to owner's lesson, per docblock) | `declineInviteAction(idToken, ownerId, lessonId)` | **use server** (Admin SDK) | `artifacts/{APP_ID}/users/{ownerId}/lessons/{lessonId}` (`invitedEmails.{email}` FieldValue.delete) | `features/notifications/components/InviteActions.tsx` |

## Game services — `features/game/services/`

All **client** context.

| File | Purpose | Exported functions | Firestore paths | Callers |
|---|---|---|---|---|
| `session.service.ts` | Game-session lifecycle docs | `createGameSession(userId, userName, gameMode)`, `updateGameScore(sessionId, score)`, `finishGameSession(sessionId, finalScore, userId, displayName, gameMode)` (also flushes best score) | `artifacts/{APP_ID}/public/data/game_sessions` | `useGameSession` |
| `leaderboard.service.ts` | Top-N leaderboard subscription + standalone submit | `subscribeLeaderboard(gameMode, topN, onUpdate, onError?)`, `submitScore({userId, displayName, gameMode, score})` | `artifacts/{APP_ID}/public/data/leaderboard_{gameMode}` | `useLeaderboard`, `useBestScores` |
| `stats.service.ts` | Personal-best subscriptions + game-result recording | `subscribePersonalBests(userId, onUpdate)`, `recordGameResult(userId, displayName, gameMode, score)`, `subscribeGameStats(userId, onUpdate)` | `artifacts/{APP_ID}/users/{uid}/stats` | `useBestScores`, `useFlashcardGameBestScore`, `useHomeState`, `useDashboardState`, `useGameEngine`, `useMatchModeSession` |
| `persist-best-score.ts` | Atomic transaction writing leaderboard + personal best iff new high; docblock: "deliberately not part of the public barrel" | `persistBestScore(userId, displayName, gameMode, score)` | `…/public/data/leaderboard_{gameMode}/{userId}`; `…/users/{uid}/stats/{gameMode}` | `session.service`, `leaderboard.service`, `stats.service` (internal only) |

## User services — `features/user/services/`

| File | Purpose | Exported functions | Context | Paths | Callers |
|---|---|---|---|---|---|
| `user.service.ts` | User progress doc: subscription, transactional read-modify-write, heartbeat | `subscribeUserProgress(userId, onUpdate, onError?)`, `updateUserProgress(userId, updateFn, db?)` (Firestore transaction on nested `progress` object), `updateLastSeen(userId)` | client | `artifacts/{APP_ID}/users/{uid}` (fields `progress`, `lastSeenAt`) | `useUserProgress`, `useActivityTracker` |
| `auth.service.ts` | Google sign-in (popup + redirect), sign-out, auth-cookie persistence, login/logout logging | `signInWithGoogle()`, `signInWithGoogleRedirect()`, `completeGoogleRedirectSignIn()`, `signOut()` | client (Firebase Auth) | — (cookie via `shared/utils`) | `app/[locale]/login/page.tsx`, `settings/SettingsPageClient.tsx`, `profile/page.tsx` |
| `auth-logging.service.ts` | Server-side login/logout logging with 30-minute session-window deduplication via Firestore transaction (docblock lines 57–80) | `logUserLogin(idToken, metadata)`, `logUserLogout(idToken, uid)` | **use server** (Admin SDK) | `login_sessions/{uid}`; logs to `system_logs` via `persistSystemLog` | `auth.service`, `useFirebaseAuth` |

## Notifications services — `features/notifications/services/`

All **client** context.

| File | Purpose | Exported functions | Firestore paths | Callers |
|---|---|---|---|---|
| `notification-paths.ts` | Path helpers, batch-size constants (`UPDATE_CHUNK` 400 / `DELIVERY_CHUNK` 200), TTL constants (read 180 d, deleted 30 d) and `expiresAt` helper | `notificationsCol(userId)`, `notificationDoc(userId, id)`, `pendingNotificationsCol(email)`, `expiresAtFromNow(ttlMs, nowMs?)`, constants | `artifacts/{APP_ID}/users/{uid}/notifications[/{id}]`; `artifacts/{APP_ID}/pendingNotifications/{normalizedEmail}/items/{id}` | other notification modules |
| `notification-subscribe.ts` | Real-time listener with composite-index query, index-missing fallback, capped exponential-backoff resubscribe, and a growing live window for pagination (docblock) | `subscribeNotifications(userId, onUpdate, onError?, limitCount = 50)` | `notificationsCol` | `NotificationsContext.tsx` |
| `notification-pending.ts` | Pre-signup (email-keyed) notification creation and idempotent login-time delivery (destination doc reuses pending doc ID) | `createPendingNotification(toEmail, payload)`, `deliverPendingNotifications(userId, email)`, `notifyInvite({toEmail, senderId, …})` | `pendingNotificationsCol`, `notificationsCol` | `useFirebaseAuth` (delivery), `access.service` (`notifyInvite`) |
| `notification.service.ts` | Mark-read / soft-delete / restore mutations (chunked batches; dual-writes legacy `read` boolean alongside `status`); re-exports pending + subscribe | `markNotificationRead`, `markAllNotificationsRead` (queries both legacy `read==false` and `status=="unread"`), `deleteNotification`, `deleteAllNotifications` (paged; returns IDs for Undo), `restoreNotifications` | `notificationsCol` / `notificationDoc` | notifications page components |
| `notify.ts` | Client facade producers call to emit a notification; routes to the authorized server writer; always fire-and-forget | `emitNotification(input)` | — (delegates to `emitNotificationAction`) | `comment.service`, `access.service` |

## Notifications actions — `features/notifications/actions/`

| File | Purpose | Exported functions | Context | Paths | Callers |
|---|---|---|---|---|---|
| `notification.actions.ts` | The single authorized writer for cross-user notifications (Admin SDK): verifies sender from ID token, authorizes against lesson roles, derives the recipient server-side, idempotent/collapsing write via deterministic `collapseId` inside a transaction (file header, lines 3–17) | `emitNotificationAction(idToken, rawInput)` (next-safe-action wrapped, returns `{ok, error?}`), `notifySystemEvent({kind:"content_removed", recipientId, lessonId, lessonTitle?})` (server-to-server, no token) | **use server** (Admin SDK) | `artifacts/{APP_ID}/users/{ownerId}/lessons/{lessonId}` (read); `artifacts/{APP_ID}/users/{recipientId}/notifications/{collapseId}` (write) | `notify.ts`, `admin.actions.ts` (`notifySystemEvent`) |
| `activity-log.actions.ts` | Audit-log wrappers over `lib/logging/activity` | `logNotificationRead`, `logNotificationDeleted`, `logNotificationsReadAll`, `logNotificationsCleared`, `logNotificationsDelivered` | **use server** | `system_logs` via logging chain | `notification-pending.ts`, notifications page |

## AI (Gemini) services — `features/ai/services/`

All **client** context; transport goes through Firebase AI Logic (`firebaseAI` from `lib/firebase.ts`) — no API key in client code (module header of `gemini-transport.ts`).

| File | Purpose | Exported functions | Callers |
|---|---|---|---|
| `gemini.service.ts` | Public AI generation API orchestrating transport/parsing/dedup; module-level result caches (`cardCache`, `deckCache`) | `generateCardData(word)`, `generateDeck(topic, count, level, existingWords?)`, `generateDeckFromImages(files, context?, existingWords?)`; re-exports `AIServiceError`, `generateMatchDistractors` | `useAICard`, `useAIDeck`, `useAIImageDeck`, `useMatchModeSession` |
| `gemini-transport.ts` | Raw Firebase AI Logic call primitives + JSON fence stripping | `generateContent(modelName, prompt)`, `generateMultimodalContent(modelName, prompt, files)`, `extractJSON(raw)` | `gemini.service`, `gemini-distractors` |
| `gemini-parsing.ts` | Response parsing/validation + error classification | `AIServiceError` class, `parseCard`, `parseCardArray`, `classifyError` | `gemini.service` |
| `gemini-dedup.ts` | Token normalization + deck-level dedup against exclusions | `normalizeToken`, `dedupeDeckCards` | `gemini.service` |
| `gemini-distractors.ts` | AI-generated distractor tiles for Match Mode | `generateMatchDistractors(pool, count)` | via `gemini.service` re-export → `useMatchModeSession` |

## Admin services — `features/admin/services/`

All **server-only** (either directly via `import "server-only"` — `admin.service`, `user.service`, `analytics.service`, `content.service`, `log.service` — or transitively, as the `analytics-*` builder modules are only imported by those). Admin SDK throughout.

| File | Purpose | Exported functions | Firestore paths |
|---|---|---|---|
| `admin.service.ts` | Admin auth/authorization core: role resolution from custom claims or `admins` collection, permission asserts, and the `adminActionClient` safe-action client whose middleware runs the cookie-session + permission check before any action body (docblock lines 58–64) | `clampLimit`, `getCallerContext(idToken)`, `assertPermissionFromToken(idToken, action)`, `assertAdminAction(action)`, `adminActionClient`; re-exports `adminAuth`, `adminDb`, `APP_ID` | `admins/{uid}` |
| `user.service.ts` | Paginated user listing (Auth + Firestore merge), admin stats, role grant/revoke, user deletion | `getUsersPaginated`, `getAdminStats`, `setAdminRole(targetUid, grant, …)`, `deleteUser(targetUid, callerUid)` | `admins/{uid}`, `artifacts/{APP_ID}/users/{uid}`, `metadata/counters` |
| `analytics.service.ts` | Orchestrates the analytics dataset: pre-aggregated `analytics_daily` + chart series from the builder modules | `getAdminAnalytics(days = 30)`, `getDashboardOverview()`; re-exports the four drilldown functions | `analytics_daily` |
| `analytics-constants.ts` | Shared constants for analytics builders | `DISCOVERY_LIMIT` (1000), `FEATURE_ALIASES` | — |
| `analytics-content.ts` | Content-distribution chart builder | `buildContentDistribution(…)` | — (operates on snapshots) |
| `analytics-engagement.ts` | Engagement chart builder | `buildEngagementData(…)` | — |
| `analytics-logs.ts` | Log-derived chart builder | `buildLogCharts(logsSnap)` | — |
| `analytics-retention.ts` | Retention chart builder | `buildRetentionData(usersSampleSnap)` | — |
| `analytics-drilldowns.ts` | Drilldown queries behind the analytics modal | `getUsersByDate(date)`, `getUsersByRole(role)`, `getFeatureUsageDetails(feature)`, `getContentBreakdown(category)` | `artifacts/{APP_ID}/users`, `admins`, `system_logs`, `artifacts/{APP_ID}/public/data/game_sessions` |
| `content.service.ts` | Global content administration: paginated deck listing across all users, per-deck cards, deck deletion | `getGlobalContentPaginated(limit = 50)`, `getDeckCards(path)`, `deleteGlobalFlashcard(path, …)` | `collectionGroup("lessons")` (+ `count()`), `artifacts/{APP_ID}/users/{uid}/cards` |
| `log.service.ts` | System-log reads (cursor pagination, filters), drilldowns, and write helpers | `getLogs(filters, cursor?)`, `getLogsDrilldown(filter)`, `recordLog(log)`, `logAdminAction(…)` | `system_logs` |

## Admin actions — `features/admin/actions/admin.actions.ts`

- **Context**: **use server**; every action runs through `adminActionClient` — identity from the `auth-token` session cookie, per-action permission via `.metadata()` (file docblock lines 40–49); results adapted to `{ok,data}|{ok,error}` via `toActionResult`.
- **Exported actions** (20): `fetchUsersAction`, `fetchAdminStatsAction`, `setAdminRoleAction`, `deleteUserAction`, `fetchAnalyticsAction`, `fetchLogsAction`, `createTestLogAction`, `fetchDashboardOverviewAction`, `fetchDeckCardsAction`, `fetchGlobalContentAction`, `deleteGlobalFlashcardAction`, `fetchAdminRoleAction`, `fetchDrilldownUsersAction`, `fetchDrilldownFeatureAction`, `fetchDrilldownContentAction`, `fetchDrilldownLogsAction`, `exportAnalyticsAction`, `exportUsersDatasetAction`, `exportContentDatasetAction`, `exportLogsDatasetAction`.
- **Paths**: delegates to the admin services above; also reads `analytics_daily` directly (line 278, export path).
- **Callers**: the admin hooks (`useAdminDashboard`, `useAdminRoleCheck`, `useAnalytics`, `useAnalyticsDrilldown`, `useAnalyticsExport`, `useGlobalContent`, `useLogs`, `useUsers`) via `../actions` imports.
- **Cross-service**: calls `notifySystemEvent` (notifications actions) when an admin removes content; logs via `log.service.logAdminAction`.

## Kana actions — `features/kana/actions/activity-log.actions.ts`

- **Context**: **use server**. Wrappers over `lib/logging/activity.logActivity`.
- **Exports**: `logKanaQuizCompleted(idToken, userId, alphabet, stats)`, `logKanaSurvivalCompleted(idToken, userId, alphabet, challengeMode, stats)`.
- **Callers**: `useQuizState`, `useSurvivalGame`, `useDropMode`.

## `lib/` service modules

| File | Purpose | Exports | Context | Callers |
|---|---|---|---|---|
| `firebase.ts` | Client Firebase singleton: app, `auth`, `db` (Firestore), `storage`, `googleProvider`, `firebaseAI` (Firebase AI Logic, Google AI backend); double-gated emulator wiring + E2E sign-in bridge (`NEXT_PUBLIC_USE_FIREBASE_EMULATOR` and non-production only) | `auth`, `db`, `storage`, `googleProvider`, `APP_ID`, `firebaseAI` | client | every client service module |
| `firebase-admin.ts` | Lazily-initialized Admin SDK singletons behind a `Proxy` (build stays credential-free; emulator mode via `FIRESTORE_EMULATOR_HOST`, per docblock) | `adminAuth`, `adminDb`, `adminRemoteConfig` | **server-only** | all Admin-SDK modules (admin services, notification/access/auth-logging actions, `shared-preview.service`, `lib/logging/server`, `lib/flags`, `lib/safe-action`) |
| `app-id.ts` | Single source of the Firestore namespace id | `APP_ID` (`NEXT_PUBLIC_APP_ID` ?? `"kana-nihongo-master"`) | isomorphic | `firebase.ts`, Admin-SDK modules |
| `safe-action.ts` | Server-action safety layer: base `actionClient`, shared `verifyIdToken`, and `toActionResult` adapter; docblock documents the two action families (idToken bind-arg vs admin cookie-session) | `actionClient`, `verifyIdToken(idToken)`, `toActionResult(result)` | **server-only** | `notification.actions`, `activity-log` chain (`lib/logging/user-actions`), `auth-logging.service`, `admin.actions`, `admin/services/log.service` |
| `flags.ts` | Server-side feature flags via Firebase Remote Config server templates; 60 s template TTL; never throws — falls back to `DEFAULT_FLAGS` (`maintenance_mode: false`, `locale_switch_enabled: false`) | `getFlags()`, types `FlagKey`/`Flags` | **server-only** | `app/[locale]/layout.tsx`, `app/[locale]/(main)/settings/page.tsx`, `app/_components/MaintenanceScreen.tsx` |
| `posthog.ts` | PostHog init, prod- and key-gated; autocapture/pageview capture off — only explicit events | `initPostHog()`, `posthog` | client | `lib/PostHogProvider.tsx`; `/ingest` reverse-proxy referenced in `proxy.ts` |
| `PostHogProvider.tsx` | Mount-once component: init + manual `$pageview` capture on route change | `PostHogProvider` | client component | `lib/providers.tsx` (Inferred from providers pattern; observed grep: `lib/PostHogProvider.tsx` self + `proxy.ts` matches `lib/posthog`) |
| `logging/public.ts` | Canonical log model shared by both runtimes: `SYSTEM_LOGS_COLLECTION = "system_logs"`, record types, entity↔logType mapping, admin-view adapter | `SYSTEM_LOGS_COLLECTION`, `firestoreDataToSystemRecord`, `inferLogTypeFromEntity`, `logTypeToEntityType`, `systemLogToAdminView`, types | isomorphic (no SDK imports) | `logging/server.ts`, `admin/services/log.service.ts`, `logging/activity.ts` |
| `logging/schema.ts` | Zod schema for system-log input | `systemLogInputSchema` | isomorphic | `logging/server.ts`, `logging/user-actions.ts` |
| `logging/actions.enum.ts` | `ActivityAction` enum of every logged action name | `ActivityAction` | isomorphic | all activity-log action modules, `AudioProvider` |
| `logging/server.ts` | The single Admin-SDK log writer: validates, sanitizes/truncates metadata (12 000-char cap), writes to `system_logs` | `persistSystemLog(raw)` | **server-only** | `logging/user-actions.ts`, `auth-logging.service.ts` |
| `logging/user-actions.ts` | Verifies idToken, rejects userId spoofing, persists a client-attributed log; shared core for the two entry points (docblock lines 18–24) | `persistUserLog(idToken, input, options?)`, `logUserActionServer(idToken, input)` | **use server** | `logging/activity.ts`, `logging/actions.ts` |
| `logging/activity.ts` | Shared scaffolding for the per-feature activity-log server actions (builds the `USER_ACTION` metadata shape) | `logActivity(idToken, userId, action, entityType, entityId, extraMetadata?, level?)` | **use server** | flashcard/kana/notifications `activity-log.actions.ts` |
| `logging/actions.ts` | Client-append entry point returning `{ok}`/`{ok:false,error}` | `appendClientLogAction(idToken, input)` | **use server** | `logging/browser.ts` |
| `logging/browser.ts` | Non-blocking client audit log; swallows all errors | `enqueueClientLog(getIdToken, input)` | client | `lib/AudioProvider.tsx` (audio failure telemetry, sampled 5 %, capped 20/session) |

## Cloud Functions — `src/functions/src/` (separate deploy target)

| File | Purpose | Exports | Context | Firestore paths |
|---|---|---|---|---|
| `firebase-admin.ts` | Eager Admin SDK init for the functions package (no lazy proxy needed — cold-start init, per docblock) | `db` | cloud function | — |
| `digest.ts` | Daily digest sweep (`onSchedule`, every day 09:00 UTC, us-central1, retryCount 2): finds recipients with notifications unread ≥ 24 h and writes ONE digest-summary notification per recipient per UTC day, keyed `digest:{YYYY-MM-DD}` for idempotency; 2000-doc sweep cap (logged, self-healing) | `dailyNotificationDigest` (trigger), `runDigestSweep(firestore, appId, nowMs?)`, `groupStaleByRecipient(docs)`, `writeDigestForUser(…)` | cloud function | `collectionGroup("notifications")` where `status=="unread"`; writes `artifacts/{appId}/users/{uid}/notifications/digest:{period}`; `appId` from `NOTIFICATIONS_APP_ID` ?? `"kana-nihongo-master"` |
| `fanout.ts` | Durable multi-recipient notification fan-out via Cloud Tasks: one retrying task per recipient (max 500/call); admin-only callable entry point; file header states no current product action triggers it yet | `deliverNotificationTask` (`onTaskDispatched`, 5 attempts), `fanOutNotifications` (`onCall`, admin-gated via `admins/{uid}`), `deliverOneNotification(…)`, `enqueueNotificationFanout(…)` | cloud function | `admins/{uid}` (auth check); writes `artifacts/{appId}/users/{recipientId}/notifications/fanout:{type}:{lessonId}:{senderId}` |
| `index.ts` | Deploy entry point | re-exports `dailyNotificationDigest`, `deliverNotificationTask`, `fanOutNotifications` | cloud function | — |

---

## Service-to-service imports (observed)

| Importer | Imports from |
|---|---|
| `flashcard/services/card.service.ts` | `progress.service` (grading/reset delegation) |
| `flashcard/services/lesson.service.ts` | `card.service` (`cardsCol`), `image.service`, `lesson-paths` (+ re-exports `lesson-normalize`, `lesson-subscriptions`, `lesson-save`) |
| `flashcard/services/lesson-save.ts` | `card.service`, `image.service`, `lesson-paths` |
| `flashcard/services/shared.service.ts` | `access.service`, `card.service`, `lesson.service`, `progress.service` |
| `flashcard/services/access.service.ts` | `@/features/notifications/services` (`emitNotification`, `notifyInvite`), `lesson.service` |
| `flashcard/services/comment.service.ts` | `@/features/notifications/services` (`emitNotification`), `comment-errors`/`comment-paths`/`comment-validation` |
| `game/services/{session,leaderboard,stats}.service.ts` | `persist-best-score` |
| `user/services/auth.service.ts` | `auth-logging.service` |
| `user/services/auth-logging.service.ts` | `lib/firebase-admin`, `lib/logging/server`, `lib/safe-action` |
| `notifications/services/notify.ts` | `notifications/actions/notification.actions` (client → server-action boundary) |
| `notifications/services/notification-pending.ts` | `notification-paths`, `notifications/actions` (`logNotificationsDelivered`) |
| `admin/services/analytics.service.ts` | `admin.service`, `log.service`, `user.service` (admin), the five `analytics-*` builders |
| `admin/actions/admin.actions.ts` | `admin.service`, `analytics.service`, `content.service`, `log.service`, `user.service` (admin), `notifications/actions` (`notifySystemEvent`), `lib/safe-action`, `lib/logging/actions.enum` |
| `flashcard/kana/notifications` `activity-log.actions.ts` | `lib/logging/activity` → `lib/logging/user-actions` → `lib/logging/server` + `lib/safe-action` |
| `ai/services/gemini.service.ts` | `gemini-transport`, `gemini-parsing`, `gemini-dedup`, `gemini-distractors`; transport → `lib/firebase` (`firebaseAI`) |
| `flashcard/services/shared-preview.service.ts` | `lib/firebase-admin`, `lib/app-id` |
| `notifications/actions/notification.actions.ts` | `lib/app-id`, `lib/firebase-admin`, `lib/safe-action` |

## Cross-cutting observations

- **Observed — two server-action auth families** (documented in `lib/safe-action.ts` lines 14–31): (1) client-supplied ID token as first bind arg (`actionClient` + `verifyIdToken`) — notifications emission and activity logging; (2) session-cookie identity + per-action permission metadata (`adminActionClient` in `features/admin/services/admin.service.ts`) — all admin actions.
- **Observed — single log sink**: every audit path (`activity-log` actions, client `enqueueClientLog`, auth login/logout, admin `logAdminAction`) converges on the `system_logs` collection via `lib/logging/server.persistSystemLog` (or `admin/services/log.service.recordLog`, which writes the same collection).
- **Observed — client/server SDK separation**: `shared.service.ts` (client SDK) and `shared-preview.service.ts` (Admin SDK) intentionally duplicate shared-deck resolution for the two runtimes; the split is documented in `shared-preview.service.ts` lines 5–16.
- **Observed — Firestore namespace**: with the exception of `system_logs`, `login_sessions`, `admins`, `metadata/counters`, and `analytics_daily` (all top-level, Admin-SDK-only), every collection lives under `artifacts/{APP_ID}/…`.
- **Observed — dead-by-design entry point**: `functions/src/fanout.ts` states that no product action triggers the fan-out today; `fanOutNotifications` is its only deployed entry point.

## Uncertainties

- The `analytics-*` builder modules under `features/admin/services/` do not themselves import `server-only`; their server-only classification is **inferred** from being imported exclusively by `server-only` modules (`analytics.service.ts`) and (for three of them) importing `firebase-admin/firestore` types.
- `lib/PostHogProvider.tsx` mounting location: `lib/providers.tsx` exists and mounts providers, but I verified only the grep-level match for `lib/posthog` importers (`PostHogProvider.tsx`, `proxy.ts`); the exact mount site of `PostHogProvider` inside `providers.tsx` was not read line-by-line.
- `features/admin/services/log.service.ts` internals (26–196) were verified for exports and `system_logs` usage via grep, not a full read; per-function behavior beyond names/paths is not documented above.
- `features/flashcard/services/comment.service.ts` and `notification.actions.ts` bodies beyond the portions read (first ~120 lines each plus export lists) were verified for export names and paths via grep, not full reads.
