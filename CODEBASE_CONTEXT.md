# Codebase Context — Kana & Nihongo Master

A Japanese-learning web app: hiragana/katakana practice modes plus a full flashcard/deck system with spaced repetition, mini-games, and Google-Docs-style sharing. This document is a from-scratch scan of the codebase as of 2026-07-10, meant as a standing reference for anyone (human or AI) working in this repo.

**Repo layout note**: the git repo root is `/`, but the actual Next.js app lives in the `src/` subdirectory — `src/package.json` is the real manifest, and commands (`npm run build`, `npm run lint`, `npm test`) must run with `--prefix src` or from inside `src/`.

---

## 1. Tech Stack

- **Framework**: Next.js 16.2.3 (App Router, Turbopack), React 19.2.4
- **Language**: TypeScript 5, strict mode, path alias `@/*` → repo-relative from `src/`
- **Styling**: Tailwind CSS v4 (`@theme` token-based config, no `tailwind.config.js`), `clsx` + `tailwind-merge` via a `cn()` helper
- **Backend**: Firebase — client SDK (`firebase`) for client-side reads/writes and auth, `firebase-admin` for server actions, Firestore as the only database
- **State**: Zustand (`app-store`, kana's `store.ts`, match game's `useMatchGameStore`) for client/global UI state; `@tanstack/react-query` for the admin dashboard, the shared-flashcard loader, and kana's stroke-animation fetches; React Context for cross-cutting session-scoped state (Admin role, Notifications)
- **Animation/UX**: `framer-motion`, `react-confetti`, `@dnd-kit/*` (drag-and-drop reordering), `react-dropzone`
- **Forms/validation**: `zod` (server action payloads), no form library (removed `react-hook-form` in a cleanup pass — plain controlled inputs)
- **Charts**: `recharts` (admin analytics)
- **Testing**: `vitest` + `fast-check` (property-based tests), coverage concentrated in `shared/audio/` (manager, sequencer, policy, telemetry, status, transport) plus `speedRules.test.ts` and `ChartCell.test.tsx`
- **Tooling**: ESLint 9 (`eslint-config-next`), Prettier (`@ianvs/prettier-plugin-sort-imports`, `prettier-plugin-tailwindcss` for class-order), Husky + lint-staged pre-commit hook that reformats, lints, and runs a full `next build` before allowing a commit

---

## 2. Routing Architecture (`src/app/`)

Three route groups, no literal path duplication — `(main)` and `(immersive)` serve different concerns (chrome vs. fullscreen), and the only real duplication is **personal vs. shared** within `(immersive)`:

### `(main)/**` — persistent shell (`layout.tsx` renders `<BottomNav>` + mounts `AdminProvider`)
- `page.tsx` — home dashboard (streak, XP, "Continue Studying" tile, kana progress, recent decks)
- `flashcard/page.tsx` — deck list (personal/shared/discover tabs); `flashcard/create`; `flashcard/[id]/page.tsx` (owner detail); `flashcard/[id]/edit`; `flashcard/shared/[shareId]/page.tsx` (shared-deck landing)
- `kana/page.tsx` (hub), `kana/chart`, `kana/learn`
- `notifications`, `profile`, `settings`
- `admin/layout.tsx` (`AdminGuard` + `AdminSidebar`) wrapping `admin/{page,analytics,content,reports,settings,users}`

### `(immersive)/**` — bare passthrough layout, no shell
- `flashcard/[id]/{study,match,speed}` (owned deck) and `flashcard/shared/[shareId]/{study,match,speed}` (shared deck) — every one of these pages is a "Pure Orchestrator": it only resolves `FlashcardData` via `useFlashcardLoader` and renders the same feature component (e.g. `StudySession`), so gameplay UI is never duplicated, only the routing/loader wrapper
- `kana/{practice,quiz,survival}` — `survival` has 4 private `_components` sub-screens (Setup/Quiz/Drop/GameOver), all powered by `features/kana/hooks/useSurvivalGame`

### `login/page.tsx` — the sole public route (Google sign-in, popup + redirect fallback)

### `src/proxy.ts` (Next 16's `middleware.ts` replacement)
Reads the `auth-token` cookie (set client-side by `useFirebaseAuth` via `shared/utils/cookie.ts`, **not** `httpOnly` — the Firebase client SDK needs to read/refresh it). Unauthenticated → redirect to `/login`; authenticated visiting `/login` → redirect to `/`.

---

## 3. Data Model & Security

All Firestore data lives under `artifacts/{APP_ID}/...` (a multi-tenant namespace prefix).

```
artifacts/{appId}/
  users/{userId}/
    lessons/{lessonId}                          — deck metadata + RBAC (roles, collaborators, invitedEmails, isPublic, allowLinkAccess)
      cards/{cardId}/comments/{commentId}        — threaded comments (nested under owner's card)
    cards/{cardId}                               — FlashCardContent (owner-scoped, no SRS fields)
    notifications/{notiId}
    sharedProgress/{shareId}
  userProgress/{userId}/lessons/{lessonId}/cards/{cardId}   — UserCardProgress (per-viewer SRS state)
  pendingNotifications/{email}/items/{id}        — pre-login invite queue, migrated on first login
  public/data/game_sessions, leaderboard_{mode}, stats/{mode}   — Match/Speed/Survival scores

admins/{uid}                                     — admin role doc (fallback when no custom claim)
system_logs/{logId}                              — audit log (admin-readable only)
```

**Why content and progress are split**: a shared deck has *one owner's card content* but *many viewers' independent SRS progress*. `FlashCardContent` (immutable, owner-scoped) and `UserCardProgress` (mutable, per-viewer) are stored in entirely separate collections/subtrees so security rules, caching, and multi-tenant study state stay clean. `CardWithProgress = FlashCardContent & UserCardProgress` is the merged runtime type everything else consumes.

**`firestore.rules` summary** (`src/firestore.rules`):
- A lesson is readable if it's public/link-shared, owned, or the reader has an explicit role; writable (metadata) only by owner or an `editor` role.
- Cards inherit their parent lesson's visibility for reads; writes are owner/editor only, never from a shared/anonymous context.
- Comments follow the same owner/editor/commenter role chain, plus the comment author can edit/delete their own.
- A `{path=**}/lessons/{lessonId}` collection-group rule enables cross-user discovery of public/shared decks.
- `admins/{uid}` and `system_logs/{logId}` are effectively read-only from the client (all writes `false` — done server-side via Admin SDK).

---

## 4. Cross-Cutting Architecture Conventions

- **UI → Hook → Service → API/Firestore layering**, enforced (with rare drift, noted below) across every feature: components are presentational and props-driven; hooks own state and call services or Next.js Server Actions; services are the only code that touches Firestore/Admin SDK directly.
- **Feature-folder structure**: each `src/features/{name}/` typically has `components/`, `hooks/`, `services/`, `types/`, `utils/`, `actions/` subfolders, each with a barrel `index.ts`. Admin, flashcard, kana, user all follow this; notifications was *just* restructured (previously flat) to match.
- **One-directional shared dependencies**: `features/game` and `features/ai` are meant to be pure downstream dependencies — never importing back from `features/flashcard` or `features/kana`. Verified clean by grep as of this scan. (A prior circular dependency between `ai` and `flashcard` was fixed by moving atomic-card validation into `shared/utils/atomicCard.ts` and defining a local `DistractorSourceCard` interface in `gemini.service.ts` instead of importing `flashcard`'s full `FlashCard` type.)
- **`shared/`** must never import from any `features/*`.
- **Server Actions** (`"use server"`) are the API boundary for admin and logging — every mutating admin action re-verifies the caller's ID token and role server-side (the client-side `useAdminRoleCheck`/`AdminContext` role check is UX-only, not a security boundary).
- **Known inconsistencies** (harmless today, worth knowing before extending):
  - `AdminContentPageContent` is exported only from `components/content/index.ts`, not the top-level `admin/components/index.ts` barrel other pages use.
  - `useAnalyticsDrilldown` builds an ad-hoc query key instead of extending `adminQueryKeys` in `utils/queryKeys.ts`.
  - `shared/utils/atomicCard.ts`'s `validateAtomicCard` currently always returns `valid: true` — violation detection appears stubbed/disabled rather than removed.

---

## 5. Feature Deep-Dives

### 5.1 `src/features/flashcard/` (133 files) — the core feature

Decks ("lessons") of flashcards studied via SM-2 spaced repetition, playable through three mini-games, with role-based sharing.

**Structure**: `actions/` (activity logging), `components/` (LessonBuilder + import panes, ShareModal + privacy/collaborators panels, Comment thread UI, Flashcard{Learn,Practice,MistakeReview} flip-card players, GradeButtons), `dashboard/` (deck list + tabs), `detail/` (3-column deck-detail layout), `domain/` (framework-free: `types.ts` + `srs.ts`), `games/{match,speed,study}/` (each self-contained), `hooks/`, `loaders/`, `services/` (one file per Firestore concern: lesson/card/progress/comment/access/shared/image), `types/`, `utils/`.

**Data model** (`domain/types.ts`): `FlashCardContent` (owner-scoped, no SRS) + `UserCardProgress` (per-viewer SM-2 state at `userProgress/{uid}/lessons/{lessonId}/cards/{cardId}`) → merged into `CardWithProgress`. The older `types/flashcard.types.ts` `FlashCard` type flattens both into one interface with identical SRS field names, so `CardWithProgress` structurally satisfies `FlashCard` — that's why Speed/Match (typed against `FlashCard`) can consume loader output with zero conversion. `Lesson` carries the RBAC surface (`roles`, `collaborators`, `invitedEmails`, `publicRole`, `allowLinkAccess`).

**Loaders** (`loaders/useFlashcardLoader.ts`): branches on source type —
- *personal*: live `onSnapshot` via `useLessons()` + `useCardsWithProgress()`, patched into a stable object reference so grading updates the UI instantly with no extra render.
- *shared*: React Query (`queryKey: ["shared-flashcard", shareId, uid]`, `staleTime: Infinity`, `retry: false`) wrapping a one-time `getSharedLesson()` fetch — the only part of the flashcard loading path that uses React Query.

**SRS** (`domain/srs.ts`, pure SM-2): grade `Again|Hard|Good|Easy` → adjusts `easeFactor`/`interval`/`repetitions`; `isMistake` set on Again/Hard, cleared on Good/Easy (persisted). `utils/learningEngine.ts` wraps this: `getDeckStatus()` (new/due/mistake/total counts), `recommendedAction()` (continue/learn/idle), `buildSession(cards, mode)` (queue construction per mode, daily review cap with 3-day overflow spread).

**Three game modes**:
- **Match** — visible tile grid, tap-to-pair; `useMatchModeSession` builds primary+meaning tiles + AI distractor tiles, no shared `GameEngine`.
- **Speed** — timed MCQ via a class-based `GameEngine` (`engine/core/`) composing `GameStateMachine`/`TimerController`/`ScoringEngine`/`ProgressionTracker`/`QuestionEngine`. Rules (adaptive difficulty, scoring, question-type mix) live as plain functions in `engine/speedRules.ts` — inlined from a `SpeedModeStrategy` class since Speed has always been the engine's only mode.
- **Study** — `StudySession` is a pure phase router (`useStudySession` owns all state); renders `FlashcardLearn`/`FlashcardPractice`/`FlashcardMistakeReview` flip-card players over `buildSession()`'s queue.

**Sharing**: `utils/rbac.ts#resolveRole()` is the single source of truth — owner > editor > commenter > viewer > none, resolved by ownerId match → explicit role → pending email invite → public/link access (capped at commenter) → none. `services/access.service.ts` handles invite lifecycle (`inviteByEmail`, `revokeEmailInvite`, promote-on-first-login). `ShareModal` + `useShareInvites` are the UI/hook pair.

**Key hooks**: `useLessons` (CRUD + RBAC + reorder), `useCardsWithProgress` (the core content+progress merge, live), `useCommentPanel`, `useStudySession`, `useShareInvites`, `useLessonBuilder` (deck editor, all input modes), `useDeckProgressStatus` (progress-subcollection-only counts for lightweight dashboard badges).

### 5.2 `src/features/admin/` (93 files) — internal ops console

Behind `/admin/**`, for `admin`/`superadmin` roles only.

**Structure**: `actions/admin.actions.ts` (~20 Server Actions, each `assertAdminAction(permission)`-gated, `{ok,data}|{ok,error}` return shape), `services/` (`"server-only"`, direct Firestore/Auth Admin SDK), `hooks/` (one per domain, react-query-backed where noted), `components/` (subfoldered per page), `context/AdminContext.tsx`, `types/`, `utils/` (`queryKeys.ts`, `rbac.ts`, `filters.ts`, `log.utils.ts`, `export.utils.ts`).

**Role model — two deliberately decoupled layers**:
- *Server (the real boundary)*: `services/admin.service.ts#getCallerContext` verifies the ID token, resolves role from custom claim or `admins/{uid}` fallback; `assertAdminAction` checks `utils/rbac.ts`'s `ROLE_PERMISSIONS[role][action]` before every mutation.
- *Client (UX only)*: `hooks/useAdminRoleCheck.ts` fetches role via a Server Action; both `AdminGuard` and `AdminContext` call it independently (each mounts its own fetch). `AdminProvider` is mounted once in `src/app/(main)/layout.tsx`, above `<BottomNav>`.

**React Query usage** (the one part of the codebase that adopted it first): `useAdminDashboard`, `useAnalytics`, `useUsers`, `useAnalyticsDrilldown`, `useGlobalContent` — keys centralized in `utils/queryKeys.ts`'s `adminQueryKeys`. `useLogs` and `useUsersTable` are hand-rolled instead (manual cursor pagination / TanStack Table).

**Notable**: every mutating action writes to `system_logs` via `persistSystemLog` (surfaced in Reports + dashboard "Operational Feed"); CSV dataset exports (analytics/users/content/logs, 1000-doc server cap) via `useAnalyticsExport`; analytics drilldown modal on chart-segment click; `AdminSettingsPageContent` is an intentional unwired stub; you can't demote/delete your own account or a superadmin via this UI.

### 5.3 `src/features/kana/` (52 files) — hiragana/katakana learning

**Structure**: `store.ts` (Zustand, persisted `alphabet: "hiragana"|"katakana"|"both"`), `data/` (`HIRAGANA_DATA`/`KATAKANA_DATA` flat arrays grouped by row, `chartLayouts.ts`, `visualGroups.ts` for confusable-character MCQ distractors), `hooks/` (cross-mode), `actions/` (completion logging), plus five self-contained sub-features: `chart/` (reference grid), `hub/` (mode-selection dashboard, `/kana` route), `learn/` (sequential flashcard intro), `practice/` (stroke-order drawing canvas), `quiz/` (MCQ / type-romaji / smart-review-by-weakest-char). **Survival** now lives under `src/app/(immersive)/kana/survival/_components/` but is entirely powered by `features/kana/hooks/useSurvivalGame` — no game logic sits under `app/`.

**Key pieces**: `KanaStrokeAnimation` fetches KanjiVG stroke SVGs from `raw.githubusercontent.com` via `useQueries` (`staleTime: Infinity`, one query per character); `KanaAudioButton` (shared play button, dedup'd from 3 prior copies); `useKanaQuizSession` (distractor building, weakest-char-first "smart deck"); `useSurvivalGame` (infinity/time/drop challenge modes — drop mode gates character-group unlocks by elapsed time as its difficulty ramp).

**Progress**: `UserData.learnedChars`/`charStats` (Firestore, via `useUserProgress`) is the single source of truth. The homepage computes kana mastery % against the full combined ~200-char set; `KanaHub` computes the same ratio scoped to the currently selected alphabet.

### 5.4 `src/features/ai/` (18 files) — AI content generation

`services/gemini.service.ts`: direct Gemini REST call (primary) with Firebase AI SDK fallback. Confirmed zero imports from `features/flashcard` — uses a local `DistractorSourceCard` interface instead. Hooks: `useAICard` (one full card from a word), `useAIDeck` (a whole deck from a topic, dedup'd against existing words), `useAIImageDeck` (deck from uploaded images, multimodal), `useAIExplanation` (lazy per-card mnemonic, generated once on reveal if no stored hint). `config.ts` centralizes model name/temperature/token caps, env-overridable.

### 5.5 `src/features/game/` (17 files) — shared game UI/domain

Used by flashcard's Match/Speed and kana's Survival/Quiz. `domain/tier.ts` (`scoreToTier`, shared bronze→diamond thresholds) + `combo.ts`. `services/game.service.ts`: Firestore at `public/data/game_sessions` + per-mode leaderboards + per-user stats; `persistBestScore` is an atomic transaction so leaderboard/personal-best only update on a genuine improvement. Components: `Leaderboard`, `MiniLeaderboard` (live-updating floating rank), `GameResultsScreen`, `StreakHud`, `TierBadge`, `StatGrid` (3 density variants, `large` reused by flashcard's session-summary screens), `LivesDisplay`. Confirmed zero imports back into `flashcard`/`kana`.

### 5.6 `src/features/notifications/` (6 files) — real-time notification center

Just restructured from flat files into `services/`, `context/`, `types/`, `actions/`. `context/NotificationsContext.tsx`: **one** app-wide `onSnapshot` listener (mounted once in `Providers`) — explicitly documented to avoid every consumer opening its own duplicate listener and appearing to "not update in real time" on navigation. `services/notification.service.ts`: `subscribeNotifications` tries a composite-index query first, transparently falls back to a simpler query + client-side filtering if the index isn't built; pre-login invites queue in `pendingNotifications/{email}` and migrate to the user's own collection on first login. Legacy `read: boolean` field still supported alongside canonical `status: "unread"|"read"` via `isUnread()`'s fallback check.

### 5.7 `src/features/user/` (11 files) — auth & profile/progress

`useFirebaseAuth`: `onIdTokenChanged` listener sets the `auth-token` cookie (non-`httpOnly`) for `proxy.ts`, dedup-logs login via a 30-min Firestore transaction, triggers pending-notification delivery. `useUserProgress`: XP/streak (streak logic: same day no-op, consecutive day +1, gap resets to 1)/lessonsCompleted/learnedChars/charStats. `useBestScores`, `useActivityTracker` (throttled heartbeat).

---

## 6. Shared Infrastructure

### 6.1 `src/shared/`

- **`components/ui/`** — `ActionCard`, `Alert`, `Badge`, `Button`, `Card`, `ConfirmModal`, `DatePicker`, `EmptyState`, `Input`, `LoadingSpinner`, `Modal`, `ModeSelectionCard`, `NotFoundScreen`, `ReorderItem`/`ReorderList`, `Select`, `SettingsMenu`, `StatCard`, `Textarea`, `UserAvatar`, `UserMeta`. `Button` is the most heavily used primitive: `variant` (primary/secondary/outline/ghost) × `size` (md/icon/icon-sm) × `color` (named theme or raw hex, falls back to inline style) × `alphabet` sugar (hiragana/katakana/both → green/blue/purple); built on `motion.button` with a Duolingo-style 3D border-bottom press effect.
- **`components/layout/`** — `ScreenHeader` family (title + back + right-slot sticky bar; `ScreenHeaderRow` supports a 3-slot symmetric-sidebar centered-title layout).
- **`hooks/`** — `useDialogA11y` (focus trap + Escape + return-focus), `useCopyToClipboard` (just extracted from 4 duplicate copy+timeout implementations).
- **`utils/`** — `cn` (clsx+tailwind-merge), `atomicCard` (card-splitting validation, shared with `features/ai` since "neither feature owns this concept"), `colors` (hex→theme-name mapping), `reorder` (fractional-index drag reordering), `time`, `array` (Fisher-Yates shuffle), `cookie` (auth-token helpers), `romaji`.
- **`audio/`** — the whole sound system, rebuilt 2026-07-10 (see `docs/adr/001-audio-architecture.md` and `shared/audio/README.md`). `manager.ts` is the single owner, and `shared/audio/index.ts` is the only public API (`playSfx`, `speak`, `sequence`, `stopAllAudio`, `configureAudio`, `suspendAudioContext`, `subscribeAudioEvents`, `useAudioStatus`); `channels.ts` owns the one `AudioContext`; `unlock.ts` owns the single gesture-unlock listener set; `sequencer.ts` orders cues with per-key interruption policies; `policy.ts` blocks prompt-stage autoplay so audio can't leak an answer; `telemetry.ts`/`status.ts` make every failure branch observable. `voice/googleTranslateTts.ts` still uses the Google Translate TTS endpoint with a Web Speech fallback — known-unreliable, isolated behind the manager so it can be swapped without touching call sites. **Feature code must never touch `AudioContext`/`Audio`/`speechSynthesis` directly** (enforced by a `no-restricted-globals` rule in `eslint.config.mjs`), and all scheduling goes through `sequence()` rather than ad-hoc timers, and every `speak()` carries `trigger: "auto" | "user"` so the user's auto-play setting is enforced centrally rather than at each call site.
- **`providers/AlertProvider`** — FIFO toast stack, capped at 3.
- **`constants/`** — `SPACING`/`SECTION_HEADING` (styles.ts), `TYPOGRAPHY` scale (typography.ts) — both dated from a 2026-07-03 design-token audit.

### 6.2 `src/lib/`

- **`firebase.ts`** — client SDK singleton (guarded by `getApps().length`); exports `auth`/`db`/`storage`/`googleProvider`/`APP_ID`/`firebaseAI`.
- **`firebase-admin.ts`** — `"server-only"`, lazily constructs the Admin app inside a `Proxy` so builds/CI never need credentials unless admin code actually runs.
- **`app-store.ts`** — Zustand + `persist`: `user`/`isAuthReady` (transient), `useHandwriting`/`globalAutoPlay`/`sfxMuted`/`voiceMuted`/`sfxVolume`/`voiceVolume` (persisted to localStorage).
- **`AudioProvider.tsx`** — mounted once in `providers.tsx`; injects the audio settings into `shared/audio`'s manager and owns audio lifecycle (stop on route change, `pagehide` and tab-hide; suspend the `AudioContext` when hidden) plus the sampled failure-telemetry sink.
- **`providers.tsx`** — root nesting: `QueryClientProvider` (staleTime 30s, no refetch-on-focus, retry 1) → `AlertProvider` → `FontSyncer` + `AuthGate` (splash until `isAuthReady`) → `AdminProvider` → `NotificationsProvider` → app.
- **`logging/`** — the audit pipeline: `actions.enum.ts` (canonical dot-namespaced action strings), `schema.ts` (zod validation), `server.ts` (`persistSystemLog`, sanitizes + 12k-char metadata cap), `user-actions.ts`/`actions.ts` (`"use server"`, re-verify the caller's ID token before persisting — prevents spoofed `userId`), `browser.ts` (fire-and-forget client wrapper). Flow: client hook → `browser.ts` → token-verified server action → `system_logs` Firestore collection.

---

## 7. State Management at a Glance

| Mechanism | Used for |
|---|---|
| Zustand (`app-store.ts`) | Global user/auth-ready state + persisted UI prefs |
| Zustand (`kana/store.ts`) | Persisted alphabet selection |
| Zustand (`useMatchGameStore`) | Match game's tile-grid interaction state |
| React Query | Admin dashboard/analytics/users/content; flashcard's shared-deck loader; kana's stroke-animation SVG fetches |
| React Context | `AdminContext` (role), `NotificationsContext` (single shared listener) |
| Firestore `onSnapshot` (direct) | Personal-deck cards/progress, lessons, game leaderboards/stats, notifications — anything needing true real-time push |

---

## 8. Things Worth Knowing Before Making Changes

- Always run build/lint/test with `--prefix src` (or `cd src` first) — the actual `package.json` is not at the repo root.
- The pre-commit hook runs a full `next build`, so commits are slow but reliably catch type errors before they land.
- `features/ai` and `features/game` must stay one-directional dependencies — never import from `features/flashcard`/`features/kana`.
- The client-side admin role check (`useAdminRoleCheck`) is UX-only; every real permission boundary is enforced server-side in `admin.actions.ts`/`admin.service.ts`.
- The `auth-token` cookie is intentionally not `httpOnly` — required for the Firebase client SDK to refresh it; `proxy.ts` is the only consumer that needs it non-JS-readable-would-be-nice-but-isn't.
- Personal decks stay on direct Firestore `onSnapshot` subscriptions (not React Query) so grading a card updates the UI with zero latency; only the shared/read-only deck path uses React Query's cache.
