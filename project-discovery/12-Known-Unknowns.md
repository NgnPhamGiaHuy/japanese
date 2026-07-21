# 12 — Known Unknowns

**Phase 9 — Discovery.** This document lists things whose intent, status, or production state **cannot be determined from the code alone**. It documents; it does not recommend. Every item separates **Observed** (verified by reading the cited files) from **Inferred** (a reading of what the observation implies), and states confidence in the inference.

Repo root: `/Users/yuh.nguyenpham/GitHub/japanese`. Next.js project root: `src/`. Cloud Functions package: `src/functions/` (separate npm package). All paths below are relative to `src/` unless prefixed with `/`.

**Sweeps performed:** TODO/FIXME/HACK/`@deprecated`/"temporary"/"for now"/"WIP" grep; feature-flag wiring trace; discriminated-union member production audit (`NotificationKind`, `NotificationType`, `LogSource`, `ActivityAction`); no-behavior UI control scan (all admin components rendering `<Button` checked for `onClick`); fetched-but-unrendered data trace; schema-export consumer trace; env-gated integration audit; 5+-line commented-out-code scan (both `//` runs and `/* */` blocks); generated/vendored file inventory; external-service inventory; unimported-file scan (custom resolver over `@/` and relative imports, all of `app/ features/ shared/ lib/ i18n/ e2e/ scripts/` as importers).

---

## 1. Marker sweep (TODO / FIXME / HACK / deprecated)

The marker sweep across `app/ features/ shared/ lib/ i18n/ scripts/ functions/src/ e2e/` found **one true TODO** and **four `@deprecated` fields**; every other hit was prose (e.g. "temporary visual feedback" in `features/admin/components/reports/LogCopyButton.tsx:14`).

| Marker | Location | Text |
|---|---|---|
| `TODO` | `lib/site.ts:1-5` | `TODO(E3-T5/ADR-10): no hosting platform decision has been recorded yet (no docs/adr/0xx-hosting.md, no firebase.json/vercel.json) — this falls back to localhost so metadata/OG/sitemap URLs resolve correctly in dev until a real production domain is set via NEXT_PUBLIC_SITE_URL.` |
| `@deprecated` | `features/notifications/types/index.ts:71-81` | `deckId`, `deckTitle`, `link`, `read` — all "Kept for existing Firestore docs." |

### U-1: Hosting platform and production domain

- **What is unclear:** Where (or whether) this app is deployed, and what its production URL is. `SITE_URL` falls back to `http://localhost:3000` (`lib/site.ts:5`) and feeds `app/sitemap.ts`, `app/robots.ts`, and page metadata.
- **Evidence:** `lib/site.ts:1-5`; `docs/adr/` contains only `001-audio-architecture.md`, `002-data-layer-pattern.md`, `003-feature-flags.md` (no hosting ADR, confirming the TODO's claim); no `vercel.json`; `firebase.json` configures Firestore/Storage/Functions/emulators but no `hosting` block. `public/` still contains the untouched create-next-app scaffold SVGs (`next.svg`, `vercel.svg`, `globe.svg`, `file.svg`, `window.svg`) with **zero references** in any source file (Observed).
- **Why code alone cannot answer it:** Deployment target, DNS, and the `NEXT_PUBLIC_SITE_URL` value are runtime/ops facts that live outside the repository.

### U-2: Whether legacy notification documents still exist

- **What is unclear:** Whether any Firestore notification documents still carry only the legacy shape (`read: boolean`, `deckId`, `deckTitle`, `link`, no `status`), i.e. whether the four `@deprecated` fields and the `isUnread()` legacy fallback (`features/notifications/types/index.ts:104-109`) are still load-bearing.
- **Evidence:** `features/notifications/types/index.ts:70-81` (fields kept "for existing Firestore docs"); `scripts/backfill-notifications.mjs:1-30` is a **one-time** backfill that stamps `status`/`isDeleted`/`expiresAt` onto legacy docs; `features/notifications/services/notification-subscribe.ts:24-33` maintains a fallback query path; `firestore.indexes.json` defines **both** a `read+isDeleted` index and a `status+isDeleted` index for `notifications`.
- **Why code alone cannot answer it:** Whether the backfill script was ever executed against production, and what document shapes exist in the live database, are data-state facts not recorded in the repo.

---

## 2. Feature flags (Firebase Remote Config)

### U-3: Live flag values and template publication state

- **What is unclear:** The production values of the app's two feature flags, and whether a Remote Config **server template** has ever been published for the project.
- **Evidence (Observed):**

| Flag | Declared | Gates |
|---|---|---|
| `maintenance_mode` | `lib/flags.ts:21` (default `false`) | `app/[locale]/layout.tsx:51,58` — replaces the entire app with `app/_components/MaintenanceScreen.tsx` |
| `locale_switch_enabled` | `lib/flags.ts:22` (default `false`) | `app/[locale]/(main)/settings/page.tsx:5-7` → `SettingsPageClient.tsx:21` — kill switch for the locale-switch UI control ("not for /ja routing itself") |

  Resolution: `lib/flags.ts:37-65` fetches a server template via `adminRemoteConfig.getServerTemplate()` with a 60 s TTL; `flags.ts:52-56` explicitly handles `remote-config/not-found` as "No server template published yet; using defaults" — the code is written to run correctly in a project where the template **has never been created**.
- **Why code alone cannot answer it:** Remote Config templates live in the Firebase console/backend. The repo carries only defaults (`maintenance_mode: false`, `locale_switch_enabled: false`); whether either flag is currently on in production — and whether the locale switch has ever been enabled for users — is unknowable here. Note this means the ja locale UI (`i18n/routing.ts` routes both `en` and `ja`; `messages/ja.json` is at full 803-key parity with `messages/en.json`) has an in-repo default state of "switch hidden".

---

## 3. Declared-but-never-produced union/enum members

### U-4: `NotificationKind` — 7 of 16 kinds are declared but inactive

- **What is unclear:** Whether the 7 `active: false` kinds are a committed roadmap, an abandoned plan, or a mix.
- **Evidence (Observed):** `features/notifications/domain/events.ts:24-42` declares 16 kinds. The registry `features/notifications/domain/registry.ts:47-164` marks these `active: false` with no producer anywhere in the repo (verified by grepping all `kind:` literals; producers found only for the 9 active kinds):

| Inactive kind | Registry lines |
|---|---|
| `invite_declined` | 63-69 |
| `deck_updated` | 105-111 |
| `deck_deleted` | 112-118 |
| `privacy_changed` | 126-132 |
| `overtaken` | 142-148 |
| `leaderboard_top3` | 149-155 |
| `achievement` | 157-163 |

  Active kinds and their verified producers: `invite` (`features/notifications/services/notification-pending.ts:86-111`, client write), `invite_accepted` (`features/flashcard/services/access.service.ts:80`), `role_change`/`access_revoked` (`features/flashcard/components/ShareModal.tsx:252-269`), `comment`/`reply`/`comment_resolved` (`features/flashcard/services/comment.service.ts:78-180`), `deck_duplicated` (`app/[locale]/(main)/flashcard/shared/[shareId]/SharedLessonPageClient.tsx:210-211`), `content_removed` (`features/admin/actions/admin.actions.ts:196-201`, server-internal). The server input schema `features/notifications/schema.ts:74-82` accepts only the 7 client-emitted kinds.
- **Why code alone cannot answer it:** The registry comment (`registry.ts:27-30`) says planned kinds are "declared … but not yet wired — flip to true when the producer lands", but whether anyone still intends to land those producers (and in what order) is a product-roadmap fact, not a code fact. **Inferred (medium confidence):** the comments read as forward-looking, but comments do not expire.

### U-5: Legacy `NotificationType` (4 values) vs. what is actually stored in `type`

- **What is unclear:** Whether the 4-value `NotificationType` union is intended to stay authoritative for stored documents, given the server writer stores a superset.
- **Evidence (Observed):**
  - `features/notifications/types/index.ts:5` — `NotificationType = "invite" | "comment" | "reply" | "role_change"`, and `AppNotification.type` uses it (`types/index.ts:47`).
  - The server writer stores `type: input.kind` (`features/notifications/actions/notification.actions.ts:209`), i.e. any of the 9 active kinds — 5 of which (`invite_accepted`, `comment_resolved`, `access_revoked`, `deck_duplicated`, `content_removed`) are outside the declared union.
  - The daily digest Cloud Function writes yet another value, `type: "digest"` (`functions/src/digest.ts:82`), also outside both unions.
  - `NotificationIcon` (`features/notifications/components/NotificationIcon.tsx`) switches on `type: string` and covers the 9 kinds plus a default Bell branch (which is what `"digest"` gets).
  - Firestore rules validate `type in ['invite','comment','reply','role_change']` **only** for the client-written `pendingNotifications` path (`firestore.rules:39-41,185-188`); server writes bypass rules.
  - `events.ts:11-15` states the two vocabularies "are reconciled as producers migrate".
- **Why code alone cannot answer it:** The end-state of the reconciliation (retire `NotificationType`? widen it? keep the compile-time lie?) is an unrecorded design decision. What is a code fact: the TypeScript type of `AppNotification.type` is narrower than the runtime values the same codebase writes.

### U-6: `LogSource` member `"cloud_function"` has no producer

- **What is unclear:** Whether Cloud Functions were intended to write into `system_logs` with `source: "cloud_function"`.
- **Evidence (Observed):** `features/admin/types/log.types.ts:4` declares `LogSource = "client" | "server" | "cloud_function"`. `lib/logging/public.ts:38-43` normalizes unknown sources to `"server"`. A grep of `functions/src/` finds **no** reference to `system_logs` or `cloud_function` — the functions package logs only via `firebase-functions/logger` (`functions/src/digest.ts`, `functions/src/fanout.ts`). `features/admin/components/reports/LogSourceBadge.tsx` exists to render the source.
- **Why code alone cannot answer it:** The member could be forward provisioning for the functions package or a leftover from a removed writer; no producer or comment settles it.

### U-7: 8 of 32 `ActivityAction` members are never emitted

- **What is unclear:** Whether these audit-log action names are pending wiring or dead vocabulary.
- **Evidence (Observed):** `lib/logging/actions.enum.ts` declares the canonical action set ("All logging calls across the system MUST use these constants"). Grepping all non-test source for each member (and for the raw string values, e.g. `"deck.shared"`) finds **zero producers** for:

| Member | `actions.enum.ts` line |
|---|---|
| `DECK_SHARED` | 16 |
| `DECK_UNSHARED` | 17 |
| `CARD_CREATED` | 19 |
| `CARD_UPDATED` | 20 |
| `CARD_DELETED` | 21 |
| `SHARE_INVITE_SENT` | 30 |
| `SHARE_INVITE_REVOKED` | 31 |
| `KANA_PRACTICE_COMPLETED` | 37 |

  The other 24 members each have at least one non-test producer (verified per-member).
- **Why code alone cannot answer it:** Nothing in the enum distinguishes "not yet wired" from "no longer wired". Notably, kana practice **exists** as a route (`app/[locale]/(immersive)/kana/practice/page.tsx`) yet never logs `KANA_PRACTICE_COMPLETED`, while its quiz and survival siblings do log theirs — whether that asymmetry is intentional is unknowable.

---

## 4. UI controls with no behavior

### U-8: Admin dashboard "Quick Actions" — three buttons with no handler

- **What is unclear:** What "Global Settings", "Content Audit", and "Security Review" were meant to do.
- **Evidence (Observed):** `features/admin/components/dashboard/QuickActionsCard.tsx:21-41` renders three `<Button variant="ghost">` elements with **no `onClick`, no `href`, no form context** (the shared `Button` — `shared/components/ui/Button.tsx:99,123` — has optional `onClick` and defaults to a plain `type="button"`). The card is live on the admin overview page (`features/admin/components/dashboard/AdminOverviewPage.tsx:9,132`). The JSDoc (`QuickActionsCard.tsx:13-14`) claims it "Provides immediate access to frequent administrative tasks", which the rendered output does not.
  This was the **only** no-behavior control found: every other admin component rendering a `<Button` without a local `onClick` was verified to get behavior another way (e.g. `DeckDetailsPanel.tsx:59-69` passes the button to Base UI's `Dialog.Close render={...}`).
- **Why code alone cannot answer it:** The intended targets of the three actions were never written down in code; two plausibly correspond to existing routes (`/admin/settings`, `/admin/content`), "Security Review" corresponds to nothing in the repo.

### U-9: Admin Settings page is an explicit stub

- **What is unclear:** What "global platform configuration" was supposed to cover, and whether the `canChangeSettings` permission was minted for it.
- **Evidence (Observed):** `features/admin/components/settings/AdminSettingsPageContent.tsx:13-16` — "Global platform configuration is not yet wired to a backend. This page renders an explicit 'not available' state instead of a form that appears to save but persists nothing." The route exists (`app/[locale]/(main)/admin/settings/page.tsx`). The permission `canChangeSettings` is declared in the RBAC matrix (`features/admin/utils/rbac.ts:11,23,33` — superadmin-only) and in the safe-action metadata enum (`features/admin/services/admin.service.ts:76`), but **no server action anywhere declares `permission: "canChangeSettings"`** (grep over all of `features/`).
- **Why code alone cannot answer it:** The intended settings surface (flags? quotas? content policy?) is not specified anywhere in code.

---

## 5. Schemas/validators declared but not enforced on any write path

### U-10: `cardContentSchema` has zero non-test consumers

- **What is unclear:** Which write path `cardContentSchema` was meant to guard.
- **Evidence (Observed):** `shared/schemas/card.schema.ts:63-80` defines the full card-content schema (atomic primary, cloze-template `___` token rule, difficulty literals, length caps). Its own file header (`card.schema.ts:1-5`) calls it "the single validation source of truth shared by client forms (LessonBuilder, via @hookform/resolvers), server actions, and runtime parsing of AI/import output". A repo-wide grep finds **no import of `cardContentSchema` outside `shared/schemas/` and its tests.** What the write paths actually use is the narrower legacy path: `validateAtomicCard` (primary-field-only) in `features/flashcard/services/lesson-save.ts:61`, `features/flashcard/utils/parser.ts:147`, and `features/ai/services/gemini.service.ts:39` — which delegates to `checkAtomicPrimaryViolations` (`shared/utils/atomicCard.ts:42-43`). Meaning: `meaning`/`example`/`hint`/`clozeTemplate` constraints encoded in the schema are enforced **nowhere**.
- **Why code alone cannot answer it:** Whether the schema is the intended future validator (adoption unfinished) or an overtaken artifact is not decidable; the header comment asserts a role the import graph contradicts.

### U-11: `privacyModeSchema` and `publicRoleSchema` have zero non-test consumers

- **Evidence (Observed):** `shared/schemas/lesson.schema.ts:33,35`. Grep finds no imports outside the schema file and tests. The sibling `shareInviteSchema` (line 37) **is** consumed (`features/flashcard/hooks/useShareInvites.ts:10,31`), as is `lessonMetadataSchema` (`features/flashcard/hooks/useLessonBuilder.ts:12,61`; `features/flashcard/services/lesson-save.ts:14,54`). The file comment (`lesson.schema.ts:29-31`) says the enums mirror ShareModal's `PrivacyMode` and enforce the "never editor via public link" cap "by the enum itself" — but nothing parses with them.
- **Why code alone cannot answer it:** Same as U-10 — intended enforcement point unrecorded.

---

## 6. Data read from collections no repo code writes

### U-12: `analytics_daily` — read twice, written never

- **What is unclear:** What (if anything) produces the "pre-aggregated" daily analytics documents in production.
- **Evidence (Observed):** Reads: `features/admin/services/analytics.service.ts:27-33` ("Fetches pre-aggregated analytics from the 'analytics_daily' collection") and `features/admin/actions/admin.actions.ts:277-281` (`exportAnalyticsAction`). Writers: **none** in `app/`, `features/`, `lib/`, `functions/src/`, or `scripts/` (repo-wide grep for `analytics_daily`). Both readers carry empty-state fallbacks: `analytics.service.ts:36-48` fabricates a single zeroed base row; `admin.actions.ts:284-299` synthesizes one export row from live counts (with hardcoded `newUsers: 0`, `featureUsage: { flashcards: 0, kana: 0, matching: 0 }`).
- **Why code alone cannot answer it:** Either an out-of-repo pipeline (scheduled job, manual export, deleted function) populates it, or the collection is empty in production and the admin analytics/exports always run on fallback data. Only the live database can tell.

### U-13: `metadata/counters` — read once, written never

- **Evidence (Observed):** `features/admin/services/user.service.ts:65` is the **only** reference to the `metadata` collection in the repo. `getAdminStats()` (`user.service.ts:63-115`) treats it as a cache for `totalUsers`, `totalFlashcards`, `activeUsersToday`, `totalSessions`, `errorRate`; with no cached doc it falls back to live `count()` queries for the first two and **`0` for the last three** ("Only use real values from cache — never fabricate activity metrics"). Those three zeros feed the admin dashboard stat cards and `SystemHealthCard` (`features/admin/components/dashboard/AdminOverviewPage.tsx:79-130`) and the role/engagement analytics.
- **Why code alone cannot answer it:** Whether "Active users today: 0 / Error rate: 0" on the deployed dashboard is truth or an unpopulated cache is a data-state question.

---

## 7. Admin identity provisioning

### U-14: How the first admin comes to exist; who sets custom claims

- **What is unclear:** The bootstrap path for admin authority.
- **Evidence (Observed):**
  - Server-side role resolution accepts either a **custom claim** (`decoded.superadmin === true` / `decoded.admin === true`) or an **`admins/{uid}` Firestore doc** (`features/admin/services/admin.service.ts:25-38`); Firestore rules mirror this (`firestore.rules:16-22`) and the fan-out callable checks only the doc (`functions/src/fanout.ts:120-124`).
  - **No code in the repo ever calls `setCustomUserClaims`** (repo-wide grep; the only `customClaims` references are *reads* at `features/admin/services/user.service.ts:22,142`).
  - Client writes to `admins/{uid}` are denied outright (`firestore.rules:194-197`, `allow write: if false`); the only in-repo writer is `setAdminRole` (`features/admin/services/user.service.ts:127`, Admin SDK), reachable via `setAdminRoleAction` which requires `canPromoteUsers` — a permission only the `superadmin` role has (`features/admin/utils/rbac.ts:14-34`).
  - Therefore, granting admin from within the app requires an already-existing superadmin, and the `superadmin` role can come from a claim no repo code sets, or a Firestore doc no repo code can create first.
- **Why code alone cannot answer it:** The first superadmin must have been provisioned out-of-band (console, gcloud, deleted script). The mechanism, and whether claims or docs are the operative source in production, is unknowable from the repo.

---

## 8. Env-gated integrations whose production state is unknowable

### U-15: Sentry

- **Evidence (Observed):** Server/edge init is double-gated: `NODE_ENV === "production"` **and** `SENTRY_DSN` set (`instrumentation.ts:10-14`). Browser init likewise on `NEXT_PUBLIC_SENTRY_DSN` (`instrumentation-client.ts:8-24`, with Replay fully masked). Source-map upload is disabled without `SENTRY_AUTH_TOKEN` — comment: "which no dev/CI environment here has — disabled until real credentials exist" (`next.config.ts:24-31`). Four error boundaries call `Sentry.captureException` (`app/global-error.tsx:27`, `app/[locale]/(main)/error.tsx:21`, `app/[locale]/(immersive)/error.tsx:21`, `app/[locale]/login/error.tsx:21`).
- **Unknowable:** whether a DSN exists in the production environment at all — i.e. whether the app currently has *any* error monitoring — and whether uploaded releases have readable stack traces (auth token).

### U-16: PostHog

- **Evidence (Observed):** Init is prod-gated and key-gated (`lib/posthog.ts:13-27`); events are proxied first-party via `/ingest` rewrites to hardcoded US-cloud hosts `us.i.posthog.com` / `us-assets.i.posthog.com` (`proxy.ts:20-21`). The **only** event the entire codebase captures is a manual `$pageview` (`lib/PostHogProvider.tsx:18`); autocapture is off; no `posthog.identify` call exists. The init comment promises "manual $pageview + product events", but no product events exist.
- **Unknowable:** whether `NEXT_PUBLIC_POSTHOG_KEY` is set in production (analytics on/off), and whether the missing "product events" are pending or descoped.

### U-17: Firebase project config and Admin credentials

- **Evidence (Observed):** Client SDK config is entirely env-driven (`lib/firebase.ts:14-21`, six `NEXT_PUBLIC_FIREBASE_*` vars). Admin SDK requires `FIREBASE_ADMIN_PROJECT_ID`/`FIREBASE_ADMIN_CLIENT_EMAIL`/`FIREBASE_ADMIN_PRIVATE_KEY` unless an emulator host is set (`lib/firebase-admin.ts:28-48`); init is deliberately lazy so builds run credential-free. Emulator wiring in the client requires both `NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"` and non-production `NODE_ENV` (`lib/firebase.ts:41-49`) and installs a test-only `window.__e2eSignIn` bridge (`lib/firebase.ts:55-63`).
- **Unknowable:** the identity of the production Firebase project (no `.firebaserc` in `src/`; project IDs referenced in configs are `demo-e2e` / `demo-kana-nihongo` / `demo-notifications` — all emulator-only demo IDs), and whether prod secrets exist wherever the app deploys.

### U-18: Firebase AI Logic (Gemini) runtime configuration

- **Evidence (Observed):** All Gemini calls go through Firebase AI Logic with the Google AI backend — `lib/firebase.ts:68-71` (`getAI(app, { backend: new GoogleAIBackend() })`); `features/ai/services/gemini-transport.ts:8-16` documents "no API key is shipped to the browser … Firebase App Check / project config governs abuse", and that a legacy `NEXT_PUBLIC_GEMINI_API_KEY` path "has been removed entirely". Model and generation knobs are env-overridable with in-repo defaults: `gemini-2.5-flash-lite`, temperature 0.4, topP 0.9, maxOutputTokens 2048, deck size 5–30 (`features/ai/config.ts:7-22`).
- **Unknowable:** whether AI Logic is enabled/billed on the production project, whether App Check is actually enforced (no App Check code exists in the repo), and whether env overrides change the model in production.

---

## 9. Cloud Functions, Cloud Tasks, and scheduler — deployed state

### U-19: Two deployable functions; one has no caller anywhere

- **Evidence (Observed):** `functions/src/index.ts` exports exactly three bindings: `dailyNotificationDigest` (scheduled, `"every day 09:00"` UTC, us-central1, retryCount 2 — `functions/src/digest.ts:152-159`), `deliverNotificationTask` (Cloud Tasks consumer), and `fanOutNotifications` (admin-only callable). The fan-out file states its own status: "**No current product action triggers this yet**: every notification producer in the app today … derives exactly one recipient server-side" (`functions/src/fanout.ts:7-15`) and "Not called from any existing app code path today; exists so the durable fan-out capability is actually reachable and deployable rather than dead code" (`fanout.ts:128-134`). Confirmed: no `httpsCallable`/`getFunctions` usage exists anywhere in the Next.js app code.
- **Why code alone cannot answer it:** Whether these functions are actually **deployed** (and hence whether the daily digest runs, whether the `deliverNotificationTask` Cloud Tasks queue exists in GCP, and whether any operator ever invokes the callable) is a deployment fact. The functions and app packages also each default `APP_ID` to `"kana-nihongo-master"` from **different** env vars (`NEXT_PUBLIC_APP_ID` — `lib/app-id.ts:1`; `NOTIFICATIONS_APP_ID` — `functions/src/fanout.ts:126`, `functions/src/digest.ts:151`); whether the two are kept in agreement in production env config is likewise unknowable.

### U-20: Firestore composite indexes and TTL policy — provisioned state

- **Evidence (Observed):** `firestore.indexes.json` declares 7 composite indexes + 2 field overrides. The notification listener is written to survive the index **not** existing ("If Firestore rejects it (index not yet built), transparently fall back" — `features/notifications/services/notification-subscribe.ts:28-33,105-110`). TTL: read/soft-deleted notifications get `expiresAt` timestamps precisely so a TTL policy can reap them, and the code says outright: "The TTL policy itself is **configured in GCP, not here**" (`features/notifications/services/notification-paths.ts:18-21`).
- **Why code alone cannot answer it:** Whether the indexes were deployed and the TTL policy created on the production project cannot be read from the repo; the defensive fallback path exists exactly because the code cannot assume it.

---

## 10. External services the code can reach — full inventory

| Service | Wiring (in repo) | Requires runtime state NOT in repo |
|---|---|---|
| Firebase Auth (Google OAuth popup/redirect) | `lib/firebase.ts:26,29`; `features/user/services/auth.service.ts:40-52` (popup + redirect + `getRedirectResult`, all consumed by `app/[locale]/login/page.tsx`) | Project + OAuth consent config; authorized domains |
| Cloud Firestore | `lib/firebase.ts:27`; rules `firestore.rules`; indexes `firestore.indexes.json` | Deployed rules/indexes; TTL policy (U-20); data state (U-2, U-12, U-13) |
| Firebase Storage | `lib/firebase.ts:28`; `features/flashcard/services/image.service.ts:35-46`; `storage.rules` | Bucket + deployed rules |
| Firebase AI Logic → Gemini | `lib/firebase.ts:68-71`; `features/ai/` (transport/parsing/dedup/distractors) | AI Logic enablement, billing, App Check (U-18) |
| Firebase Remote Config (server templates) | `lib/firebase-admin.ts:74-76`; `lib/flags.ts` | Published server template + live values (U-3) |
| Cloud Functions 2nd gen (schedule + tasks + callable) | `src/functions/` package; `firebase.json` functions block | Deployment; Cloud Tasks queue; Cloud Scheduler job (U-19) |
| Firebase Admin SDK (server actions) | `lib/firebase-admin.ts` | Service-account credentials (U-17) |
| Sentry (`@sentry/nextjs`) | `instrumentation.ts`, `instrumentation-client.ts`, `next.config.ts`, 4 error boundaries | DSNs, auth token, org/project (U-15) |
| PostHog (`posthog-js`) | `lib/posthog.ts`, `lib/PostHogProvider.tsx`, `/ingest` reverse proxy in `proxy.ts:20-21,` | Project key; US-cloud account (U-16) |
| Google Translate TTS (undocumented endpoint) | `shared/audio/voice/googleTranslateTts.ts:31` — `https://translate.google.com/translate_tts`; header calls it "the known-fragile one: an undocumented, rate-limited, uncacheable endpoint" (lines 4-13); browser `speechSynthesis` fallback | No contract at all: availability, rate limits, and continued existence of the endpoint are entirely outside anyone's control |
| KanjiVG stroke data (GitHub raw) | `features/kana/components/KanaStrokeAnimation.tsx:14` — fetches `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/{hex}.svg` at runtime, pinned to the **moving `master` branch** | GitHub availability; upstream repo layout/content stability |
| Google Fonts CSS API (server-side, OG image only) | `app/[locale]/(main)/flashcard/shared/[shareId]/opengraph-image.tsx:30` fetches `fonts.googleapis.com/css2` at render time (page fonts themselves are self-hosted via `next/font` — `lib/fonts.ts:1-11`) | Google Fonts availability at OG-render time |
| Google user avatars / Storage images | `next.config.ts:11-19` allows `lh3.googleusercontent.com`, `firebasestorage.googleapis.com` | — |

---

## 11. Commented-out code, generated files, vendored code

### U-21: Commented-out code blocks — none found

- **Evidence (Observed):** A scan for runs of 5+ consecutive `//` lines produced 21 candidates; each was inspected and **all are prose** (rationale comments), not disabled code. A separate scan for 5+-line `/* */` blocks with code-like content produced one candidate, which on inspection is live JSX (a false regex hit on a `"image/*"` glob string in `features/flashcard/components/ImportDropzone.tsx:36-40`). There is no `console.log`-only handler and no empty `onClick={() => {}}` anywhere in non-test source.

### U-22: Generated and untracked artifacts

| File | Status (Observed) |
|---|---|
| `src/next-env.d.ts` | Present, **untracked** (Next.js-generated) |
| `src/tsconfig.tsbuildinfo` | Present, untracked (tsc incremental state) |
| `src/firestore-debug.log` and `/firestore-debug.log` (repo root) | Present, untracked — Firestore-emulator byproducts; the root-level copy implies the emulator was at some point launched from the repo root rather than `src/` |
| `src/vitest.shims.d.ts` | Tracked (deliberate shim) |
| `public/*.svg` (5 files) | Tracked create-next-app scaffold assets, zero references (see U-1) |

- **Why this is an unknown at all:** whether the scaffold SVGs and the root-level emulator log are deliberate keeps or forgotten leftovers is intent, not code.

---

## 12. Incomplete or single-consumer infrastructure

### U-23: Storybook — full toolchain, one story

- **Evidence (Observed):** `package.json` carries `storybook`/`build-storybook` scripts and seven Storybook devDependencies (incl. `@storybook/addon-a11y`, `addon-vitest`, `addon-mcp`). Exactly **one** story exists in the entire repo: `shared/components/ui/Badge.stories.tsx`.
- **Unknowable:** whether Storybook adoption is beginning, stalled, or abandoned.

### U-24: Audio telemetry counters have no production consumer

- **Evidence (Observed):** `shared/audio/telemetry.ts:111-117` exports `getAudioCounters`/`resetAudioTelemetry`; outside tests, `getAudioCounters` is referenced only in a comment (`lib/AudioProvider.tsx:38`: failures "stay in the local counters (`getAudioCounters`) and the dev console"). The event **stream** does have one production consumer: `lib/AudioProvider.tsx:107-121` samples reportable events into the activity log as `AUDIO_PLAYBACK_FAILED`.
- **Unknowable:** whether the counter surface is a debugging affordance meant to stay, or a stub for an unbuilt diagnostics UI.

### U-25: Unimported-file sweep — effectively clean

- **Evidence (Observed):** The custom resolver found only 4 candidate never-imported files, and each has an out-of-band consumer: `i18n/request.ts` (next-intl plugin convention, loaded via `next.config.ts:1-7`), `i18n/navigation.testshim.ts` (aliased in `vitest.browser.config.ts:26-28`), `shared/audio/unlock.ts` (side-effect import `import "./unlock"` at `shared/audio/manager.ts:29`, which the `from`-based resolver missed), and `features/notifications/__tests__/harness.ts` (emulator-test helper; its consumers are `*.emu.test.ts` files). No orphaned feature module was found.

