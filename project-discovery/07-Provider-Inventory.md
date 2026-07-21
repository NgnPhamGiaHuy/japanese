# 07 — Provider & Context Inventory

> Discovery-phase documentation. Source of truth: the code under `/Users/yuh.nguyenpham/GitHub/japanese/src` as of commit `a0bbbc4`. Paths are relative to `src/` unless prefixed. Statements are **Observed** unless marked **Inferred**.

---

## 1. Composition roots

### 1.1 Server root — `app/[locale]/layout.tsx`

The locale layout is the outermost provider mount point (observed, lines 53–65):

```tsx
// app/[locale]/layout.tsx:53-65
<html lang={locale} className={fontVariables}>
    <body suppressHydrationWarning>
        <ReactScan />
        <NextIntlClientProvider>
            {flags.maintenance_mode ? (
                <MaintenanceScreen />
            ) : (
                <Providers>{children}</Providers>
            )}
        </NextIntlClientProvider>
    </body>
</html>
```

- `NextIntlClientProvider` is mounted with **no explicit props** (line 57); locale + messages come from the server request config `i18n/request.ts:6–14` (`getRequestConfig` resolves the locale against `routing.locales` and imports `../messages/${locale}.json`).
- When the `maintenance_mode` flag from `getFlags()` (`lib/flags.ts`, Firebase Remote Config per the `MaintenanceScreen` docblock) is on, the entire `Providers` subtree is **not mounted** — only `MaintenanceScreen` renders inside the intl provider (lines 58–62).
- `app/global-error.tsx` replaces this layout entirely when the root layout crashes; it renders its own `<html>/<body>` with **no providers at all** (global-error.tsx docblock, lines 14–18).

### 1.2 Client root — `lib/providers.tsx`

`Providers` is the single client-side composition root (observed, whole file). Exact nesting:

```tsx
// lib/providers.tsx:50-99 (abridged to structure; order and siblings exact)
export function Providers({ children }) {
    useFirebaseAuth();          // line 51
    useActivityTracker();       // line 52
    const [queryClient] = useState(() => new QueryClient({ ... })); // lines 53-67

    return (
        <LazyMotion features={() => import("@/lib/motionFeatures").then(m => m.default)} strict>  // 78-81
            <QueryClientProvider client={queryClient}>       // 82
                <AlertProvider>                              // 83
                    <FontSyncer />                           // 84
                    <AudioProvider />                        // 85
                    <PostHogProvider />                      // 86
                    <AuthGate>                               // 87
                        <AdminProvider>                      // 88
                            <NotificationsProvider>          // 89
                                {children}                   // 90
                                <CommandPaletteLauncher />   // 91
                            </NotificationsProvider>
                        </AdminProvider>
                    </AuthGate>
                </AlertProvider>
            </QueryClientProvider>
        </LazyMotion>
    );
}
```

Nesting order, outermost → innermost: **LazyMotion → QueryClientProvider → AlertProvider → AuthGate → AdminProvider → NotificationsProvider → children (+ CommandPaletteLauncher)**. `FontSyncer`, `AudioProvider`, `PostHogProvider` are render-null side-effect siblings mounted directly under `AlertProvider` (lines 84–86).

Supporting pieces inside `providers.tsx`:

- **`AuthGate`** (internal component, lines 26–47): not a context provider — it reads `useAppStore((s) => s.isAuthReady)` and renders a full-screen splash until Firebase auth resolves, **except** on public routes matching `PUBLIC_ROUTE_PATTERNS = [/^\/flashcard\/shared\/[^/]+$/]` (line 24), which render immediately so crawlers can see the shared-deck SEO preview (comment, lines 19–23).
- **`useFirebaseAuth()`** (`features/user/hooks/useFirebaseAuth.ts:38`): sets Firebase persistence, subscribes `onIdTokenChanged`, writes `user`/`isAuthReady` into the Zustand store, manages the auth cookie, and delegates login logging to a server-side deduplication service (file docblock).
- **`useActivityTracker()`** (`features/user/hooks/useActivityTracker.ts:13`): throttled (5-minute) `lastSeen` heartbeat writes to Firestore keyed off pathname changes.

---

## 2. React contexts

`grep -rn "createContext"` across `src/` (excluding tests) yields exactly **three** contexts (observed):

| Context | File | Provider component | Mounts | Consumer hook |
|---|---|---|---|---|
| `AlertContext` | `shared/providers/AlertProvider.tsx:29` | `AlertProvider` (line 48) | **1** — `lib/providers.tsx:83` | `useAlert` (line 79) |
| `AdminContext` | `features/admin/context/AdminContext.tsx:14` | `AdminProvider` (line 19, default export) | **1** — `lib/providers.tsx:88` | `useAdminRole` (line 26) |
| `NotificationsContext` | `features/notifications/context/NotificationsContext.tsx:63` | `NotificationsProvider` (line 80) | **1** — `lib/providers.tsx:89` | `useNotifications` (line 209) |

Mount counts were verified by grepping every `<AlertProvider|AdminProvider|NotificationsProvider` occurrence in `src/`: each provider is mounted exactly once, in `lib/providers.tsx`. No Storybook-level mounts exist (`.storybook/preview.tsx` contains only `parameters`, no decorators — observed).

### 2.1 AlertContext — `shared/providers/AlertProvider.tsx`

- **Exposed state** (interface `AlertContextType`, lines 19–27): a single imperative API `showAlert(type: AlertType, message: string, options?: { action?: AlertAction; durationMs?: number })`. Default context value is `undefined`; `useAlert` throws outside the provider (lines 79–85).
- **Behavior** (docblock lines 39–47 + body): `showAlert` renders the shared `Alert` component through sonner's `toast.custom()`; sonner owns timing/stacking/positioning/swipe-dismiss/live region. Per-severity durations: success/info 4000 ms, warning 6000 ms, error 8000 ms (lines 32–37).
- **Third-party element mounted here**: sonner's `<Toaster position="bottom-right" visibleToasts={3} gap={12} containerAriaLabel={t("toastRegion")} />` rendered as a sibling of `children` (lines 69–74).
- **Consumers of `useAlert` (11 files)** (observed via grep): `app/[locale]/(main)/flashcard/shared/[shareId]/SharedLessonPageClient.tsx`, `app/[locale]/(main)/flashcard/[id]/edit/page.tsx`, `app/[locale]/(main)/flashcard/[id]/page.tsx`, `app/[locale]/(main)/notifications/page.tsx`, `features/flashcard/dashboard/hooks/useDashboardState.ts`, `features/flashcard/dashboard/hooks/useDashboardModals.ts`, `features/flashcard/components/ShareModal.tsx`, `features/flashcard/hooks/useShareInvites.ts`, `features/flashcard/hooks/useCommentPanel.ts`, `features/flashcard/hooks/useLessonBuilder.ts`, `features/notifications/components/NotificationRow.tsx`.
- Barrel: `shared/providers/index.ts` re-exports everything from `./AlertProvider` (line 1).

### 2.2 AdminContext — `features/admin/context/AdminContext.tsx`

- **Exposed state** (lines 9–12): `{ role: AdminRole | null; isLoading: boolean }`. Default value `{ role: null, isLoading: true }` (lines 14–17) — no throw-outside-provider guard; consumers outside the tree would silently get the default (**Observed** shape; the "silently" consequence is **Inferred** from `createContext` semantics).
- **Behavior**: the provider delegates entirely to `useAdminRoleCheck()` (`../hooks`, line 5) and memoizes `{ role, isLoading }` (lines 20–21).
- **Mount count**: 1 (`lib/providers.tsx:88`). Two code comments record this as deliberate: `app/[locale]/(main)/layout.tsx:3–6` ("AdminProvider is intentionally NOT mounted here — it's already mounted once, app-wide, at the true root … A second mount here used to cause a redundant admin-role check") and `app/[locale]/(main)/admin/layout.tsx:6–9` (same statement for the admin segment). `AdminGuard`'s docblock likewise references the historical "two AdminProvider mounts" (`features/admin/components/shared/AdminGuard.tsx:1–9`). These are code-comment claims about history; the current tree observably has a single mount.
- **Consumers of `useAdminRole` (5 files)**: `app/[locale]/(main)/_components/BottomNav.tsx:112` (admin nav item gating), `app/[locale]/(main)/profile/page.tsx:23`, `features/admin/components/shared/AdminGuard.tsx:26` (route guard for `/admin`), `features/admin/components/users/AdminUsersPageContent.tsx:31` (permission checks), `features/command-palette/components/CommandPalette.tsx:59` (admin commands gating).

### 2.3 NotificationsContext — `features/notifications/context/NotificationsContext.tsx`

- **Purpose** (file docblock, lines 3–22): lifts the Firestore `onSnapshot` subscription to a single app-shell-level context "mounted once in Providers, never torn down" so every consumer shares one live listener and there is no cold-start delay when navigating to `/notifications`.
- **Exposed state** (interface `NotificationsContextValue`, lines 46–61): `notifications: AppNotification[]`, `groups: NotificationGroup[]`, `unreadCount: number`, `loading`, `loadingMore`, `hasMore`, `loadMore()`, `error: Error | null`, `retry()`. A non-throwing default object is provided (lines 63–73).
- **Behavior highlights** (observed in body): initial live window `PAGE_SIZE = 50`, grown by `loadMore()` re-subscribing with a bigger `limit()` (lines 42, 102–105); render-time pagination reset on user change (lines 113–117); render-time guard against showing a previous user's cached items during an A→B account switch (lines 156–159); `hasMore` heuristic = last page came back full (line 167); subscription effect keyed on `[currentUid, retryNonce, pageSize]` (line 154).
- **Consumers of `useNotifications` (2 files)**: `app/[locale]/(main)/_components/BottomNav.tsx:111` (unread badge), `app/[locale]/(main)/notifications/page.tsx:41` (full inbox state).

---

## 3. Third-party providers in the tree

| Provider | Mount | Configuration (observed) |
|---|---|---|
| `NextIntlClientProvider` (next-intl) | `app/[locale]/layout.tsx:57` | No props; inherits locale/messages from `i18n/request.ts` request config. Locale validated against `routing.locales` with `notFound()` fallback (layout lines 46–48) |
| `LazyMotion` (motion/react) | `lib/providers.tsx:78–81` | `features={() => import("@/lib/motionFeatures").then(mod => mod.default)}` — async so `domMax` code-splits into its own chunk (`lib/motionFeatures.ts` exports `domMax`, lines 10–12); `strict` — throws if a bare `motion.*` component renders instead of `m.*` (comment, lines 70–77) |
| `QueryClientProvider` (@tanstack/react-query) | `lib/providers.tsx:82` | Client created once in `useState` (lines 53–67): `queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 }`, `mutations: { retry: 1 }` |
| `Toaster` (sonner) | inside `AlertProvider`, `shared/providers/AlertProvider.tsx:69–74` | `position="bottom-right"`, `visibleToasts={3}`, `gap={12}`, localized `containerAriaLabel` |

Not providers but adjacent: `@base-ui/react` Dialog/Popover/Menu/Select portals used by the shared UI components mount their own portal roots per-instance (see `04-Component-Inventory.md` §1.2); no app-level Base UI provider exists (observed — no such import anywhere in `src/`).

---

## 4. Render-null side-effect components mounted in the provider tree

These are mounted like providers but expose no context; each renders `null`:

| Component | File | Mount | Responsibility (observed) |
|---|---|---|---|
| `FontSyncer` | `lib/FontSyncer.tsx:16` | `lib/providers.tsx:84` | Syncs `useAppStore.useHandwriting` to the `body.handwriting-font` CSS class, which drives the `--font-japanese` custom property (file docblock lines 3–11; note: docblock says `html.handwriting-font`, the code toggles the class on `document.body`, lines 20–25) |
| `AudioProvider` | `lib/AudioProvider.tsx:66` | `lib/providers.tsx:85` | (1) settings injection — at **module scope** wires `configureAudio({ getSettings: readAudioSettings })` reading the Zustand store at call time (line 53); (2) stops all audio on route change/pagehide/tab-hide (lines 70–102); (3) sampled remote telemetry sink for audio failures — 5% sample, ≤20 events/session, via `enqueueClientLog` (lines 20–22, 104–122) |
| `PostHogProvider` | `lib/PostHogProvider.tsx:9` | `lib/providers.tsx:86` | Calls `initPostHog()` once and captures a manual `$pageview` per pathname change, production + key-gated (lines 12–19). `lib/posthog.ts` init config: `api_host: "/ingest"`, `person_profiles: "identified_only"`, `autocapture: false`, `capture_pageview: false`, `capture_pageleave: false` (posthog.ts:20–27) |
| `ReactScan` | `app/_components/ReactScan.tsx:5` | `app/[locale]/layout.tsx:56` (outside `Providers`, inside `<body>`) | Dev-only dynamic import of `react-scan`, `scan({ enabled: true })` (lines 6–12) |
| `CommandPaletteLauncher` | `features/command-palette/components/CommandPaletteLauncher.tsx` | `lib/providers.tsx:91` (inside NotificationsProvider, sibling of `children`) | Always-mounted ⌘K/Ctrl+K keydown listener; lazily imports the cmdk palette UI on first use (file docblock lines 1–6). Renders the palette when opened, so not strictly render-null after first open |

---

## 5. Module-level singletons acting as state providers

These are not React contexts; components subscribe directly via hooks or module imports. Full state-field coverage belongs to the state-management discovery file; pointers only:

| Singleton | File | Kind | Consumers (count/notes) |
|---|---|---|---|
| `useAppStore` | `lib/app-store.ts:35` | Zustand store with `persist` (storage key `"app-settings"`, `partialize` persists settings only — "never auth objects", lines 55–60) | 37 files across `app/`, `features/`, `lib/`, `shared/` (grep count). Holds `user`, `isAuthReady`, `useHandwriting`, `globalAutoPlay`, `sfxMuted`, `voiceMuted`, `sfxVolume`, `voiceVolume` + setters (lines 6–31) |
| `useKanaStore` | `features/kana/store.ts:11` | Zustand store with `persist` (key `"kana-ui-state"`) | 2 files: `features/kana/chart/components/KanaChart.tsx`, `features/kana/hooks/useKanaDataset.ts`. Holds `alphabet: AlphabetMode` + setter |
| `useMatchGameStore` | `features/flashcard/hooks/useMatchGameStore.ts:30` | Plain Zustand store (no persistence) | `features/flashcard/games/match/components/MatchPlaying.tsx`, `MatchGrid.tsx`, `games/match/hooks/useMatchModeSession.ts`, `useMatchScoring.ts`. Holds the match-game grid state (`grid`, `selectedIds`, `matchedPairIds`, `processing`, `shakeCellIds` + actions) |
| Audio manager | `shared/audio/manager.ts` | Framework-free module state; receives its live settings source once via `configureAudio` called at module scope of `lib/AudioProvider.tsx:53` (manager.ts:55 comment: "Injects the live settings source. Called once by `AudioProvider`") | Game/study components play sounds through `@/shared/audio` exports; the manager reads settings from `useAppStore.getState()` at call time (AudioProvider.tsx:31–34) |
| PostHog client | `lib/posthog.ts` | Module singleton around `posthog-js` with an `initialized` latch (line 3) | `lib/PostHogProvider.tsx` plus any direct `posthog` imports |
| Firebase app/auth/firestore | `lib/firebase.ts` (client), `lib/firebase-admin.ts` (server) | Module singletons | App-wide (not enumerated here) |

---

## 6. Provider-related route-level structure

- The `(main)` and `(immersive)` route groups add **no** providers: `(main)/layout.tsx` only appends `BottomNav` (lines 7–14); `(immersive)/layout.tsx` is a pass-through fragment (whole file). The `/admin` segment adds `AdminGuard` + `AdminSidebar` (`app/[locale]/(main)/admin/layout.tsx:15–27`) — `AdminGuard` consumes `AdminContext`, it does not provide anything.
- **Under maintenance mode, none of the client providers exist** (§1.1), so any component calling `useAlert`/`useAdminRole`/`useNotifications` cannot render in that state; the only component rendered is `MaintenanceScreen` (**Observed** for the tree shape; the consequence is **Inferred**).
- `app/global-error.tsx` renders with no `NextIntlClientProvider` and no `Providers` — its `ErrorFallback` copy is hard-coded English for that reason (global-error.tsx comment, lines 33–38).

## Uncertainties

- Consumer lists come from static import grep; indirect consumption (e.g. a hook re-exporting `useAlert`) was not found but not exhaustively proven absent.
- `useAppStore` consumer count (37 files) includes both React-hook subscriptions and imperative `useAppStore.getState()` calls (e.g. `lib/AudioProvider.tsx:32`); the two access patterns were not tallied separately.
- The `AdminContext`/`NotificationsContext` "historically double-mounted" statements are code comments about past behavior (cited in §2.2), not something verifiable from the current tree; the current single-mount claim is what was verified.
