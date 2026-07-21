# 10 — Pattern Catalog

Discovery Phase, Phase 7: recurring implementation patterns observed in the codebase.

- **Repo root:** `/Users/yuh.nguyenpham/GitHub/japanese`; the Next.js project root is `src/`. All paths below are relative to `src/` unless prefixed otherwise.
- **Method:** every claim below was verified by reading the cited file(s); usage counts come from `grep` over `src/features`, `src/app`, `src/shared`, `src/lib` (and `src/functions/src` where noted), excluding `*.test.*` files and `node_modules`.
- **Stance:** observational only. Where multiple mechanisms coexist for the same concern, each variant is documented with its usage count; no variant is ranked.
- Statements are **Observed** (read directly from code) unless explicitly marked **Inferred**.

---

## 1. Forms

**Mechanism.** No native `<form>` element exists in any non-test `.tsx` file (searched `<form` across `features/`, `app/`, `shared/` — 0 hits). Submission is wired through `Button onClick` handlers and keyboard handlers instead. Two coexisting input-state mechanisms:

### Variant A — `react-hook-form` + `zodResolver` (2 `useForm` call sites)

| Site | Schema | Notes |
|---|---|---|
| `features/flashcard/hooks/useLessonBuilder.ts:60-61` | `lessonMetadataSchema` (`shared/schemas/lesson.schema.ts:12-21`) | `useForm<LessonMetadataInput, unknown, LessonMetadata>`; save path is `handleSubmit(...)` at line 172 |
| `features/flashcard/hooks/useShareInvites.ts:30-31` | `shareInviteSchema` (`shared/schemas/lesson.schema.ts:37-40`) | `handleInvite = handleSubmit(...)` at line 36; uses `setError` for server-side failures |

The hook owns the form instance; presentational components receive `register` as a prop rather than calling `useForm` themselves: `features/flashcard/components/LessonBuilderMeta.tsx:15,55,70` (`register: UseFormRegister<LessonMetadataInput>`) and `features/flashcard/components/ShareCollaboratorsPanel.tsx:28,79` (`registerInvite`).

### Variant B — manual `useState`-controlled inputs (everywhere else)

- `features/flashcard/components/CommentInput.tsx` — `content` / `isSubmitting` state, Enter-to-submit keyboard handler (line 62), `maxLength` prop defaulting to 2000, auto-expanding textarea.
- `app/[locale]/login/page.tsx` — `loading` / `error` state around Google sign-in with a popup→redirect fallback chain.
- Admin filter/search inputs are controlled by a parent-owned state object (see §10 Filtering).

**Inferred:** game/quiz "setup" screens (`features/kana/quiz/components/QuizSetup.tsx`, `app/[locale]/(immersive)/kana/survival/_components/SurvivalSetupScreen.tsx`) configure sessions via button-group selection state rather than form fields, so they do not participate in either form mechanism.

---

## 2. Dialogs / Modals / Drawers

**Mechanism.** Every overlay is built on Base UI's dialog primitive (`@base-ui/react/dialog`). Shared chrome lives in `shared/components/ui/DialogChrome.tsx`: `DIALOG_BACKDROP_CLASSNAME` (line 9-10) and `DialogCloseButton` (line 17-31), consumed by all three shared primitives.

**Shared primitives** (all in `shared/components/ui/`):

| Primitive | File | Shape |
|---|---|---|
| `Modal` | `Modal.tsx:42-72` | titled, scrollable body, `maxWidth` variants `sm…4xl` |
| `ConfirmModal` | `ConfirmModal.tsx:76-154` | icon circle + confirm/cancel, `variant: danger\|warning\|info`, `loading` prop that blocks dismissal (line 92) |
| `Drawer` | `Drawer.tsx:39-62` | slide-in panel, `side: left\|right\|bottom`; docstring notes it is "a positioned Dialog" on the same primitive as Modal |

**Usage counts (JSX render sites, non-test):**

- `<ConfirmModal>` — **7 files**: `features/home/components/HomePage.tsx`, `features/admin/components/content/AdminContentPageContent.tsx`, `features/admin/components/users/UsersActionConfirmModal.tsx`, `features/flashcard/dashboard/components/FlashcardDashboard.tsx`, `features/flashcard/games/study/components/StudySession.tsx`, `features/flashcard/games/study/components/StudyModeSelector.tsx`, `app/[locale]/(main)/settings/SettingsPageClient.tsx`.
- `<Modal>` — **2 files**: `features/admin/components/analytics/AnalyticsDetailModal.tsx`, `features/admin/components/analytics/AnalyticsExportModal.tsx`.
- `<Drawer>` — **0 render sites** outside its own definition (grep `<Drawer` matched only `shared/components/ui/Drawer.tsx`).

**Coexisting variant — direct `Dialog.Root` composition.** Four feature components compose Base UI `Dialog` directly with bespoke popup layouts instead of using the shared primitives:

| Component | Site | Layout |
|---|---|---|
| `ShareModal` | `features/flashcard/components/ShareModal.tsx:278-432` | custom modal with its own header/body |
| `DeckDetailsPanel` | `features/admin/components/content/DeckDetailsPanel.tsx:37-114` | right-edge slide panel; its backdrop uses its own className (`bg-[#3c3c3c]/30`, line 40) rather than `DIALOG_BACKDROP_CLASSNAME` |
| `AdminSidebar` (mobile nav) | `features/admin/components/shared/AdminSidebar.tsx:140-170` | left drawer, `lg:hidden` |
| `CommandPalette` | `features/command-palette/components/CommandPalette.tsx:73-128` | dialog wrapping a `cmdk` `Command` list |

So two dialog mechanisms coexist: shared primitives (9 render sites across 9 files) and direct Base UI composition (4 files).

**Open/close state** is caller-local `useState` throughout; `features/flashcard/dashboard/hooks/useDashboardModals.ts` centralizes the dashboard's share-modal and delete-confirm state (holds `sharingLesson` / `deletingLesson` / `isDeleting`).

**Menus/popovers** use a different Base UI primitive: `shared/components/ui/SettingsMenu.tsx:19-20` (`Menu` + `Switch` from `@base-ui/react`), rendered in `features/kana/hub/components/KanaHub.tsx`.

---

## 3. Tables

**Mechanism.** Admin data grids run on `@tanstack/react-table` wrapped in one shared engine hook, plus a shared chrome-component family. All table code lives under `features/admin/`.

- **Engine:** `features/admin/hooks/useDataTable.ts:49-75` — owns `globalFilter` / `sorting` / `rowSelection` state and the `useReactTable` config; filtering and sorting row models are opt-out flags (lines 30-36).
- **Chrome:** `AdminTableShell.tsx:21-40` (Card container + toolbar + desktop scroll region + mobile list slot + pagination slot) → `AdminTable.tsx:21-27` adds the `<table>` element; `DataTableHeader.tsx:22-82` (thead with `aria-sort` and `columnDef.meta.align`); `DataTableBody.tsx`; `DataTableMobileList.tsx` (all in `features/admin/components/shared/`).
- **Column defs** are built in dedicated hooks: `features/admin/hooks/useUsersTableColumns.tsx`, `features/admin/hooks/useDecksTableColumns.tsx`.

**Consumers:**

| Surface | Files | Configuration |
|---|---|---|
| Users | `features/admin/components/users/UsersTable.tsx` via `features/admin/hooks/useUsersTable.ts` | row selection (permission-gated), sorting, global filter; mobile rows via `UserMobileRow.tsx` |
| Content (decks) | `features/admin/components/content/DecksTable.tsx` | display-only columns; `enableFiltering`/`enableSorting` disabled, filtering happens upstream (documented at `useDataTable.ts:24-35`); mobile rows via `DeckMobileRow.tsx` |
| Reports (logs) | `features/admin/components/reports/AdminReportsPageContent.tsx` | uses `AdminTableShell` directly with a **non-table** virtualized list inside (see §4) |

No table implementations exist outside `features/admin/` (searched `useReactTable`, `<table`, `AdminTable`).

---

## 4. Lists / virtualized lists

**Mechanism.** Two virtualization variants coexist, both on `@tanstack/react-virtual` with dynamic row measurement (`measureElement`):

| Variant | File | Scroll container |
|---|---|---|
| Bounded-container `useVirtualizer` | `features/admin/components/reports/LogsVirtualList.tsx:37-45` | own `div` with inline `maxHeight: 600, overflowY: auto`; `estimateSize: 92`, `overscan: 6`, keyed by log id |
| Window-scroll `useWindowVirtualizer` | `app/[locale]/(main)/notifications/_components/NotificationsVirtualList.tsx` | browser window; `scrollMargin` measured in `useLayoutEffect`; rows flattened from time groups via `flattenNotificationGroups` (`features/notifications/domain/format.ts`) |

The `NotificationsVirtualList` docstring itself records the reason each surface uses its variant (bounded dashboard panel vs. full-page inbox).

**Non-virtualized list patterns** (plain `.map()`): dashboard deck grid (`features/flashcard/dashboard/components/FlashcardDashboard.tsx` + `SortableDeckCard.tsx`), comment threads (`features/flashcard/components/CommentThread.tsx`), leaderboard (`features/game/components/Leaderboard.tsx`), kana chart grid (`features/kana/chart/components/ChartBlockGrid.tsx`).

---

## 5. CRUD operations

Three write-path families coexist, split by domain:

### Variant A — client Firestore SDK service modules (learner-facing features)

Plain exported async functions per entity, in `features/<feature>/services/*.service.ts`; hooks wrap them and add auth/user context. Examples:

- `features/flashcard/services/card.service.ts:107-148` — `createCard` / `updateCard` / `deleteCard` / `reorderCards`.
- `features/flashcard/services/lesson.service.ts:39-117` — `updateLesson`, `reorderLessons`, `shareLessonSettings`, `updateLessonRoles`, `deleteLessonWithCards`; diff-based batch save in `lesson-save.ts` (builds `existingById` map at line 108 and computes create/update/delete sets rather than full replace).
- Wrapping hooks expose write helpers: `features/flashcard/hooks/useLessons.ts:91-219` (`updateLesson`, `deleteLesson`, `saveFullLesson`, …), guarded by `if (!user) return`.
- Firestore path builders are split into dedicated modules per entity: `features/flashcard/services/lesson-paths.ts:13-19` (`lessonsCol`/`lessonDoc`), `comment-paths.ts`, `features/notifications/services/notification-paths.ts` — 3 such modules.

### Variant B — admin server actions (`adminActionClient`) + React Query mutations

- `features/admin/actions/admin.actions.ts` — 20 exported actions, 19 of which run through `adminActionClient` (cookie-session auth + per-action `.metadata({permission})`, defined at `features/admin/services/admin.service.ts:65-85`).
- Client hooks pair them with `useMutation` + key invalidation: `features/admin/hooks/useUsers.ts:48-76` (promote/demote/delete with `invalidateUsers` fanning out to users/stats/dashboard/analytics keys, lines 41-46), `features/admin/hooks/useGlobalContent.ts:46-47`, `features/admin/hooks/useLogs.ts:36-46`.

### Variant C — client-token server actions (`actionClient` with idToken bind-arg)

- `lib/safe-action.ts:16-31` documents the two-client split; `actionClient` actions take the Firebase ID token as first bind arg and verify it inline via `.useValidated()` + `verifyIdToken` (lines 40-45).
- Used by notification emission (`features/notifications/actions/notification.actions.ts:66`) and activity logging (`features/notifications/actions/activity-log.actions.ts` — 5 `actionClient` chains; `lib/logging/user-actions.ts`).

**Result normalization** across B and C: `toActionResult` (`lib/safe-action.ts:52-60`) adapts next-safe-action output to the repo-wide `{ok:true,data} | {ok:false,error}` shape; consuming hooks re-throw for React Query (`useUsers.ts:25`, `useLogs.ts:31`).

**Server-side (Cloud Functions):** `functions/src/fanout.ts` and `functions/src/digest.ts` perform cross-user notification writes with the Admin SDK (clients may only write their own inbox per `firestore.rules`).

---

## 6. Permissions / guards

Two independent RBAC modules exist, each the declared single source of truth for its own domain:

### Admin RBAC — role → permission matrix

- `features/admin/utils/rbac.ts:14-43` — `ROLE_PERMISSIONS` (superadmin/admin × 8 boolean permissions) + `hasPermission()` + `normalizeAdminRole()`.
- **Server enforcement:** `features/admin/services/admin.service.ts` — `getCallerContext` (claims-or-Firestore role resolution, lines 30-38), `assertPermissionFromToken` (40-49), `assertAdminAction` (cookie-based, 51-56), and the `adminActionClient` middleware that runs it for every action (65-85).
- **Client checks:** `features/admin/components/users/AdminUsersPageContent.tsx:54-55` (`canDelete` / `canPromote` gate UI affordances).
- **Route guard:** `features/admin/components/shared/AdminGuard.tsx:24-48` (loading spinner → access-denied `EmptyState` → children), mounted once in `app/[locale]/(main)/admin/layout.tsx:17-25`. Role state comes from `AdminContext` (`features/admin/context/AdminContext.tsx`) backed by `features/admin/hooks/useAdminRoleCheck.ts` (server-verified via `fetchAdminRoleAction`).

### Deck-sharing RBAC — resolution engine + predicates

- `features/flashcard/utils/rbac.ts` — `resolveRole` (5-step priority: owner → explicit role → pending email invite → public link capped at "commenter" → none; lines 97-133), predicates `canView`/`canComment`/`canEdit` (138-150), write-time `sanitizePublicRole` (159-162). The file header carries the full permission matrix as documentation.
- Consumers: `features/flashcard/detail/components/DetailActionsPanel.tsx`, `DetailCardsPanel.tsx`, `DetailCommentsPanel.tsx`, `features/flashcard/components/CommentItem.tsx`, `features/flashcard/dashboard/components/DeckCard.tsx`, `features/flashcard/services/access.service.ts`, `shared.service.ts` (9 non-test files reference the module's exports).

### Rules layer

`src/firestore.rules` mirrors both domains with helper functions `isSignedIn`, `isOwner`, `isSystemAdmin`, `getLesson`, `isPublicLesson`, plus notification validation (`isValidNotificationType`, `withinNotificationSizeLimits`, `notificationImmutableFieldsUnchanged`). `src/storage.rules` also exists (not analyzed in detail here). Rules behavior is exercised by `src/firestore-rules.test.ts`.

---

## 7. Authentication gating

Gating is layered — five distinct mechanisms observed:

1. **Edge redirect** — `src/proxy.ts:60-99` (Next.js 16 `proxy` convention): reads the `auth-token` cookie; unauthenticated requests to non-public paths redirect to `/login`; authenticated requests to `/login` redirect home. Public surface = `PUBLIC_PATHS` (line 9) + `PUBLIC_PATH_PATTERNS` regex for shared-deck landing pages (line 18). Locale-prefix stripping via `splitLocale` (32-41).
2. **Client boot splash** — `lib/providers.tsx:26-47` `AuthGate`: blocks rendering until `isAuthReady`, except for `PUBLIC_ROUTE_PATTERNS` (line 24) which mirror the proxy allowlist (the mirroring is stated in the comment at lines 19-23).
3. **Auth state plumbing** — `features/user/hooks/useFirebaseAuth.ts:38-82`: `onIdTokenChanged` → `setAuthCookie`/`clearAuthCookie` (`shared/utils/cookie.ts`) → zustand `useAppStore.setUser` / `setAuthReady`; also triggers login logging and pending-notification delivery.
4. **Per-page redirects** — `app/[locale]/(main)/settings/SettingsPageClient.tsx:44` and `app/[locale]/(main)/profile/page.tsx:40` (`router.replace("/login")` when auth resolves signed-out); `app/[locale]/login/page.tsx:26` (redirect signed-in users away).
5. **Hook-level early returns** — data hooks no-op without a user: `features/flashcard/hooks/useLessons.ts:57,93` (`if (!user) return`); `features/admin/hooks/useAdminToken.ts` throws `"Not authenticated"`.

Server actions independently re-verify identity (§5, §6) regardless of the client-side layers. The cookie is deliberately not httpOnly so the Firebase client SDK can refresh it (comment at `proxy.ts:48`).

---

## 8. Loading states

| Mechanism | Canonical file | Usage |
|---|---|---|
| Spinner primitive | `shared/components/ui/LoadingSpinner.tsx` (`fullScreen` default true, optional label) | imported in **22** consumer files, e.g. `features/admin/components/shared/AdminGuard.tsx:30`, `app/[locale]/(immersive)/flashcard/[id]/study/page.tsx` |
| Skeletons (`animate-pulse`) | no single primitive; per-surface components | **19** files contain `animate-pulse`; named skeletons: `features/admin/components/shared/ChartSkeleton.tsx` (doubles as the `next/dynamic` loading placeholder for recharts chunks), `features/flashcard/dashboard/components/DashboardLoading.tsx`, `app/[locale]/(main)/notifications/_components/NotificationsPlaceholders.tsx`, inline skeleton in `features/game/components/Leaderboard.tsx` |
| Button-level pending | `shared/components/ui/Button.tsx:118-119,245` (`loading` prop renders spinner, blocks click) | used wherever Buttons submit, e.g. `ConfirmModal.tsx:132` |
| Auth splash | `lib/providers.tsx:31-44` (animated logo + progress bar) | app-wide pre-auth |
| React Query flags | `isLoading` / `isFetching` returned by admin hooks (`useUsers.ts:83-85`, `useLogs.ts:67-68`) | consumed by admin page contents |
| `useTransition` pending | `features/ai/hooks/useAIGeneration.ts:28,37-51` (status enum derived from pending/error/succeeded) | AI card/deck generation |

**Not present:** route-level `loading.tsx` files — `find src/app -name "loading.tsx"` returns none. `<Suspense>` appears in exactly one file (`app/[locale]/(main)/flashcard/shared/[shareId]/page.tsx`).

---

## 9. Pagination

### Variant A — cursor-based (admin; Firestore page tokens)

- **Bookkeeping hook:** `features/admin/hooks/useCursorPagination.ts:18-52` — accumulates a `pageTokens[pageIndex] → cursor` map (sequential discovery; the docstring states Firestore cursors can't jump ahead). Used by **2** pages: `features/admin/components/users/AdminUsersPageContent.tsx` and `features/admin/components/reports/AdminReportsPageContent.tsx`.
- **Fetch side:** server actions return `nextPageToken` (`features/admin/hooks/useUsers.ts:81`, `features/admin/hooks/useLogs.ts:64`); the cursor is part of the React Query key (`useLogs.ts:27`). Page size constants live in `features/admin/utils/queryKeys.ts` (`USERS_PAGE_SIZE`); limits are clamped server-side by `clampLimit` (`features/admin/services/admin.service.ts:20-23`).
- **UI:** `features/admin/components/users/UsersTablePagination.tsx` (used by `UsersTable.tsx`).

### Variant B — grow-the-window resubscribe (notifications; realtime)

`features/notifications/context/NotificationsContext.tsx:39-104` — `PAGE_SIZE = 50`; `loadMore()` increments `pageSize` by 50, which re-subscribes the `onSnapshot` listener with a larger `limit()`; `hasMore` flips false when a page returns short.

**Not present:** offset pagination and `useInfiniteQuery` (grep for `useInfiniteQuery` — 0 hits).

---

## 10. Filtering

| Variant | Implementation | Consumers |
|---|---|---|
| Filter-object + pure function (logs) | `AdminLogFilters` state object owned by the page; `applyLogFilters` in `features/admin/utils/filters.ts` (level/type/user/date-range/free-text; docstring: "Used by both the server-side Service and client-side Hook") | `features/admin/components/reports/LogsFilters.tsx:90-132` (search input + two `Select`s + userId `Input` + `AdminDateRangeFilter`, reset via `onChange({})`); `features/admin/services/log.service.ts` |
| Table-engine filtering | `getFilteredRowModel` + `globalFilterFn` via `useDataTable.ts:69-71` | Users table (`useUsersTable.ts`) |
| Upstream filtering (deliberately outside the table engine) | Content page filters its deck array before `useDataTable`, so empty-state can distinguish "no items" from "no results" — documented at `useDataTable.ts:24-29` | `features/admin/components/content/AdminContentPageContent.tsx` |
| URL-driven tab filter | dashboard tabs `personal\|shared\|discover` read/written via `?tab=` search param (`features/flashcard/dashboard/hooks/useDashboardState.ts:35-42`) | `DashboardTabs.tsx` |
| Local tab filter | notifications `all\|unread` `useState` filter with memoized group re-filtering (`app/[locale]/(main)/notifications/page.tsx:43-55,132-134`) | notifications page |
| Date-range filter | `features/admin/components/shared/AdminDateRangeFilter.tsx` (wraps `shared/components/ui/DatePicker.tsx`) | LogsFilters |

---

## 11. Sorting

Four coexisting variants:

1. **Table-engine sorting** — `getSortedRowModel` + `SortingState` in `useDataTable.ts:58,68`; header toggle + `aria-sort` in `DataTableHeader.tsx:40-74`.
2. **Firestore query `orderBy`** — 12+ call sites, e.g. `features/admin/services/log.service.ts:40` (`timestamp desc`), `features/game/services/leaderboard.service.ts:34` (`score desc, limit(topN)`), `features/notifications/services/notification-subscribe.ts:76` (`createdAt desc`), `features/admin/services/analytics.service.ts:30,72,79,90`.
3. **Client comparators** — `newestFirst` (`features/flashcard/services/lesson-normalize.ts:11`), `sortByOrder` (`shared/utils/reorder.ts`).
4. **User-defined manual ordering** — fractional-indexing string keys (`fractional-indexing` package, `generateNKeysBetween`) in `shared/utils/reorder.ts:1-28`; order changes are persisted via `reorderLessons` (`lesson.service.ts:49`) and `reorderCards` (`card.service.ts:126`); driven by drag-and-drop (§18 Optimistic UI). Legacy numeric `order`/`sortOrder` values are still read-supported (file-header comment, `reorder.ts:10-15`).

---

## 12. Searching

- **Shared input:** `features/admin/components/shared/AdminSearchInput.tsx` — thin wrapper over the `Input` primitive with a `Search` icon; **3** consumers: `AdminContentPageContent.tsx`, `LogsFilters.tsx`, `UsersTableToolbar.tsx`.
- **Matching variants:**
  - tanstack global filter (users table, via `useDataTable`'s `globalFilter`).
  - Concatenated-haystack substring match for logs — `features/admin/utils/filters.ts` joins action/user fields/type/level/entity/`JSON.stringify(metadata)` and lowercase-matches.
  - Upstream array filter for content search (`AdminContentPageContent.tsx`, `searchQuery` state).
  - `cmdk` fuzzy matching in the command palette — `features/command-palette/components/CommandPalette.tsx:7` (`import { Command } from "cmdk"`); the row `value` is the localized label so fuzzy match runs against it (comment at lines 28-31, bilingual keywords carried in `ja.json`).
- **Not present:** input debouncing on any search field (grep `debounce` matches only game-score persistence `features/game/hooks/useGameSession.ts` and an audio-sequencer comment).

---

## 13. Notifications / toasts

Two distinct systems:

### Transient toasts ("alerts")

- `shared/providers/AlertProvider.tsx:48-85` — `showAlert(type, message, options)` renders the themed `shared/components/ui/Alert.tsx` chrome through **sonner** `toast.custom()`; sonner owns timing/stacking/swipe/a11y (docstring lines 42-47). Severity-based durations 4s/4s/6s/8s (lines 32-37), `visibleToasts={3}`, bottom-right.
- Consumed via `useAlert()` — **30** `showAlert(` call sites across 11 files, e.g. `features/flashcard/dashboard/hooks/useDashboardModals.ts` (success/error on deck delete), `features/notifications/components/NotificationRow.tsx`, `app/[locale]/(main)/flashcard/[id]/edit/page.tsx`.

### Persistent in-app notification center

- **Client:** `features/notifications/context/NotificationsContext.tsx` (realtime `onSnapshot` inbox with grow-window pagination, §9B); UI in `features/notifications/components/` (`NotificationRow`, `InviteActions`, `NotificationIcon`) and the virtualized page (§4).
- **Domain:** typed event registry (`features/notifications/domain/registry.ts`), builders (`domain/build.ts`), deterministic IDs (`domain/id.ts`), grouping/formatting (`domain/format.ts`), zod schema (`features/notifications/schema.ts`).
- **Write path:** `emitNotificationSafeAction` (`features/notifications/actions/notification.actions.ts:66`, `actionClient` + idToken bind-arg); cross-user fan-out and digests run in Cloud Functions (`functions/src/fanout.ts`, `functions/src/digest.ts`); pending email-keyed invites are delivered on sign-in via `deliverPendingNotifications` (`features/user/hooks/useFirebaseAuth.ts:70`, service `features/notifications/services/notification-pending.ts`).

---

## 14. Uploads (images / files)

### Card images → Firebase Storage

- `features/flashcard/services/image.service.ts:20-41` — `uploadCardImage`: MIME must start with `image/`, hard 2MB limit (lines 26-31), deterministic path `users/{uid}/cards/{cardId}_{ts}.{ext}`, `uploadBytes` + `getDownloadURL`. `deleteCardImage` (43-51) is best-effort (errors logged, not thrown).
- Callers: `features/flashcard/hooks/useLessonBuilder.ts:180-196` (upload on save, old-image cleanup fire-and-forget); orphan cleanup on card/lesson delete in `features/flashcard/services/lesson-save.ts:115-125` and `lesson.service.ts:133`.
- `src/storage.rules` exists as the rules-side counterpart.

### AI deck-from-images → in-memory only

- Dropzone: `features/flashcard/components/ImportDropzone.tsx:5,34` uses `react-dropzone`'s `useDropzone` (`getRootProps`/`getInputProps`/`isDragActive`); selected `File[]` held in `LessonBuilderImportPane.tsx:47` state.
- Files are base64-encoded via `FileReader.readAsDataURL` (`features/ai/services/gemini-transport.ts:42-49`) and sent to Gemini (`features/ai/hooks/useAIImageDeck.ts`) — never persisted to Storage.

---

## 15. Validation (schemas, input limits)

**Mechanism.** Zod v4 schemas are the declared single source of truth, referenced from forms, services, server actions, and mirrored in Firestore rules.

| Schema module | Limits / rules | Consumers |
|---|---|---|
| `shared/schemas/lesson.schema.ts:12-40` | title trim 1–200, description ≤1000, themeColor 6-digit hex regex; `privacyModeSchema` / `publicRoleSchema` enums (public role can never be "editor" — enforced by the enum itself, comment lines 30-32); `shareInviteSchema` email | LessonBuilder + Share forms via `zodResolver` (§1A) |
| `shared/schemas/comment.schema.ts:8-12` | trim 1–2000 | `features/flashcard/services/comment-validation.ts:12-17` (`validateCommentContent` delegates to the schema); UI `CommentInput` `maxLength` default 2000 |
| `shared/schemas/card.schema.ts`, `shared/schemas/ai-output.schema.ts`, `features/ai/schemas/*` | card / AI-output shapes | AI parsing (`features/ai/services/gemini-parsing.ts`) |
| `features/notifications/schema.ts` | title ≤200 / message ≤2000 — mirrored in `firestore.rules` `withinNotificationSizeLimits` | notification actions + functions |
| `lib/logging/schema.ts` | `systemLogInputSchema` | `lib/logging/user-actions.ts:47-52` (`.parse` before persist) |

**Other validation layers:**

- next-safe-action `.inputSchema()` / `.bindArgsSchemas()` on every server action (`features/admin/actions/admin.actions.ts`, `features/notifications/actions/*.ts`).
- Domain validation with typed error: `validateAtomicCard` (`shared/utils/atomicCard.ts`, re-exported by `features/flashcard/utils/card.validator.ts`) and `CardValidationError` carrying a violations array (`card.validator.ts:17-25`).
- XSS sanitization: `sanitizeCommentContent` (`comment-validation.ts:28-35`) escapes `& < > " '`.
- Numeric clamping: `clampLimit` (`admin.service.ts:20-23`), `clampVolume` (`lib/app-store.ts:33`).
- Rules-side re-validation: `firestore.rules` size limits + immutable-field checks (§6).

---

## 16. Caching

### React Query (server/remote state)

- Single `QueryClient` created in `lib/providers.tsx:53-67`: `staleTime: 30_000`, `refetchOnWindowFocus: false`, `retry: 1` (queries and mutations).
- Centralized key factory for admin: `features/admin/utils/queryKeys.ts` (`adminQueryKeys.dashboard() / content() / logs(filters, cursor) / users(pageToken, size) / stats() / analytics()`), consumed by all 6 admin query hooks.
- Per-query overrides observed: `refetchInterval: 30000` (`useUsers.ts:28`), `staleTime: Infinity, retry: false` for the one-time shared-deck load (`features/flashcard/loaders/useFlashcardLoader.ts:82-93`).
- `useQuery` call sites: **8** across 7 files (all `features/admin/hooks/*` plus `useFlashcardLoader.ts`); `useMutation`: **9**; plus `useQueries` in `features/kana/components/KanaStrokeAnimation.tsx:45` (stroke-SVG fetches keyed `["kana-stroke-svg", char]`) and `useDocumentQuery`/`useCollectionQuery` from `@tanstack-query-firebase/react/firestore` in exactly one file (`features/flashcard/hooks/useEditableLesson.ts:18,43-49`).

### Module-level caches

- `features/ai/services/gemini.service.ts:23-24` — `cardCache` / `deckCache` `Map`s keyed by normalized prompt (+count/level/exclusions, line 72).
- `lib/flags.ts:34-35` — Remote Config server template cached with a 60s TTL (`TEMPLATE_TTL_MS`), stale template re-served on fetch failure.
- `shared/audio/sequencer.ts:74-75` — module `Map`s for running/queued sequences; `shared/audio/voice/googleTranslateTts.ts:129` caches the selected voice URI.

### Persisted client state

`zustand/persist` to localStorage: `lib/app-store.ts:35-69` (name `"app-settings"`, `partialize` excludes auth objects) and `features/kana/store.ts` (name `"kana-ui-state"`).

### Memoization

**65** `useMemo` call sites; exactly **1** `React.memo` component (`features/flashcard/dashboard/components/SortableDeckCard.tsx:20`).

**Not present:** Next.js data-cache APIs — `revalidatePath` / `unstable_cache` / `"use cache"` have 0 hits.

---

## 17. Error handling

### Boundaries

- Four boundary files, all rendering one shared fallback: `app/global-error.tsx`, `app/[locale]/(main)/error.tsx`, `app/[locale]/(immersive)/error.tsx`, `app/[locale]/login/error.tsx`. Each logs with a scope tag and calls `Sentry.captureException` in a `useEffect` (e.g. `(main)/error.tsx:20-22`).
- `app/_components/ErrorFallback.tsx:25-66` — deliberately provider-free (plain `<a>`, props-injected copy) so it renders even when the root layout crashed (docstring lines 12-23). No class-based `ErrorBoundary` components exist (grep 0 hits).

### Feature-level error UI

`features/admin/components/shared/AdminErrorState.tsx` (EmptyState + optional retry; used by admin page contents), `features/flashcard/dashboard/components/DashboardError.tsx`, `features/flashcard/games/speed/components/SpeedConstraintError.tsx`, `shared/components/ui/NotFoundScreen.tsx` (**3** usages — the shared study/match/speed pages under `app/[locale]/(immersive)/flashcard/shared/[shareId]/`).

### Result-shape and throw conventions

- Server boundary returns `{ok:true,data} | {ok:false,error}` (`lib/safe-action.ts:52-60`); React Query hooks convert to throws (`useUsers.ts:25`).
- Typed error classes: `AIServiceError` (`features/ai/services/gemini.service.ts`), `CardValidationError` (`features/flashcard/utils/card.validator.ts:17-25`), comment error mapping in `features/flashcard/services/comment-errors.ts`.
- **36** `catch` occurrences across `features/*/services`; **17** fire-and-forget `.catch(() => {})` sites (activity logging, image cleanup — e.g. `useLessons.ts:109-114`, `lesson.service.ts:133`).
- `console.error` messages carry a bracketed scope tag — `"[useLessons]"`, `"[Firebase]"`, `"[deleteCardImage]"`, `"[flags]"`, `"[error boundary: (main)]"` — a consistent convention across the files read.
- Subscription hooks route errors into state (`error: string | null`) rather than throwing (`useLessons.ts:63-70`).

---

## 18. Additional observed patterns

### 18.1 Realtime Firestore subscriptions

Convention: service exports `subscribeX(args, onData, onError) => unsubscribe`; hooks/contexts open them in `useEffect` and return the unsubscribe. **14** `onSnapshot(` call sites across 10 modules: `features/flashcard/services/lesson-subscriptions.ts` (5), `card.service.ts`, `comment.service.ts`, `features/notifications/services/notification-subscribe.ts` (3), `features/game/services/leaderboard.service.ts`, `stats.service.ts`, `features/user/services/user.service.ts`, plus hook-level listeners in `features/flashcard/hooks/useCardsWithProgress.ts` and `useDeckProgressStatus.ts`. A companion "render-time reset on uid change" idiom (state reset during render instead of an effect) appears in `useLessons.ts:47-54` and `usePublicLessons` (`useLessons.ts:246-253`).

### 18.2 Optimistic drag-and-drop reordering

`@dnd-kit` in **7** files. Local ordered state overrides the subscribed source list mid-drag and until the Firestore write confirms — described in-code at `features/flashcard/dashboard/hooks/useDashboardState.ts:52-54` and `features/flashcard/detail/components/DetailCardsPanel.tsx:50`. Persisted via fractional-indexing order keys (§11.4). The word "optimistic" appears only at these two sites; no React Query `onMutate` optimistic updates exist.

### 18.3 Game-session phase state machines

String-union `phase` state drives phase-switch rendering in every game:

| Game | Phase type | Site |
|---|---|---|
| Match | `"intro" \| "playing" \| "results"` | `features/flashcard/games/match/hooks/useMatchModeSession.ts:40,77` |
| Speed | same 3-phase hook union + engine-level `GamePhase` incl. `"feedback"` with a class-based transition-guard machine | `useSpeedModeSession.ts:32`; `features/flashcard/games/speed/engine/core/GameStateMachine.ts:8-45` |
| Kana quiz | `"setup" \| "playing" \| "done"` | `features/kana/quiz/types.ts:6` |
| Kana survival | `"setup" \| "playing" \| "gameover" \| "leaderboard"` | `features/kana/types/kana.types.ts:3`, `useSurvivalGame.ts:68` |

Shared session sub-patterns: `features/flashcard/hooks/useCardSessionState.ts` (queue/stats/summary machine shared by the three study players) and `features/game/hooks/useGameSession.ts` (start → debounced live score writes → flush on finish).

### 18.4 Activity / audit logging

Central pipeline in `lib/logging/` (`persistUserLog` verifies the idToken and rejects uid spoofing, `user-actions.ts:26-52`; `ActivityAction` enum in `actions.enum.ts`). Three features each keep a thin `actions/activity-log.actions.ts` of typed wrappers (`features/flashcard/`, `features/kana/`, `features/notifications/`) calling `logActivity`. Call sites are fire-and-forget from hooks (`useLessons.ts:109-114,151-160`). Token-fetch glue is unified by `features/notifications/components/withFreshToken.ts`.

### 18.5 i18n (next-intl)

`useTranslations` in **133** files; server-side `getTranslations` in **6** files (e.g. `app/[locale]/layout.tsx`, `app/[locale]/(main)/admin/reports/page.tsx`). Messages in `messages/en.json` + `messages/ja.json`; routing `"as-needed"` with locales `en`/`ja` (`i18n/routing.ts`); navigation goes through the `@/i18n/navigation` wrappers (`useRouter`, `usePathname`, `Link`). Locale-aware auth redirects in `proxy.ts` (§7.1).

### 18.6 Theming / design tokens

Semantic Tailwind classes (`text-text`, `text-muted`, `bg-bg`, `katakana` color family, `border-b-4`/`border-b-8` bottom-border treatment) recur across primitives (`Modal.tsx:54`, `ErrorFallback.tsx:45`). Token modules: `shared/constants/styles.ts` (`SPACING`, `SECTION_HEADING`), `shared/utils/colors.ts` (`SEMANTIC_STATUS`, used in 4 files incl. `ConfirmModal.tsx:55-74`), admin chart theme in `features/admin/domain/chartTheme.ts`, role colors in `features/flashcard/utils/rbac.ts:57-63`. A repo-local `design-system` skill exists at the tooling level (outside `src/`).

### 18.7 Zustand stores

Three stores: global `lib/app-store.ts` (auth + settings, persisted, referenced in **37** consumer files), `features/kana/store.ts` (alphabet mode, persisted), `features/flashcard/hooks/useMatchGameStore.ts` (transient match-grid state, not persisted).

### 18.8 Audio orchestration

`shared/audio/` module family (manager, channels, sequencer, policy, unlock, TTS voice). `playSfx`/`playVoice` used in **11** files (e.g. `features/flashcard/hooks/useCardSessionState.ts:5`); volume/mute gates live on the global store (`app-store.ts:13-20`); `lib/AudioProvider.tsx` mounts it app-wide.

### 18.9 Feature flags

`lib/flags.ts` — Firebase Remote Config *server* template, `DEFAULT_FLAGS` documented as kill-switch-safe, 60s TTL cache. Flags observed: `maintenance_mode` (rendered by `app/_components/MaintenanceScreen.tsx`, gated in `app/[locale]/layout.tsx`) and `locale_switch_enabled` (checked in `app/[locale]/(main)/settings/page.tsx`).

### 18.10 Analytics / monitoring

PostHog: `lib/PostHogProvider.tsx:18` captures `$pageview`; events are reverse-proxied first-party via `/ingest` rewrites in `proxy.ts:63-72`. Sentry: `captureException` in all four error boundaries (§17); `instrumentation.ts` / `instrumentation-client.ts` present at project root.

### 18.11 Code splitting

`next/dynamic` for recharts-based charts with `ChartSkeleton` as the loading placeholder (`features/admin/components/analytics/AdminAnalyticsPageContent.tsx:4`) and for the command palette (`features/command-palette/components/CommandPaletteLauncher.tsx:3`). Motion features are dynamically imported under `LazyMotion strict` (`lib/providers.tsx:78-81`); `motion/react` `m.*` components appear in **16** files.

---

## Uncertainties

- Usage counts are file-level grep counts at a single point in time; call-site counts (e.g. 30 `showAlert(`, 14 `onSnapshot(`) count matching lines, which can differ slightly from semantic invocations (multi-line calls, comments were excluded only where noted).
- `src/storage.rules` and the full body of `src/firestore.rules` were only partially read (header/helpers); the per-collection rule details are not cataloged here.
- Classification of setup screens as "button-driven configuration rather than forms" (§1) is inferred from file structure and the absence of `<form>`/`useForm` in those directories, not from reading every setup screen line-by-line.
- The `e2e/` and Storybook directories were not analyzed; this catalog covers runtime application patterns only.
