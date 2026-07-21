# 13 — Questions Before Refactoring

**Phase 10 — Discovery.** This document converts the unknowns in `12-Known-Unknowns.md` (referenced below as U-1 … U-25), plus structural observations that raise questions, into concrete questions to answer **before** any refactoring. It asks; it does not answer, and it does not propose solutions.

Repo root: `/Users/yuh.nguyenpham/GitHub/japanese`. Next.js project root: `src/`; Cloud Functions package: `src/functions/`. Paths below are relative to `src/` unless noted. Questions are ordered by **breadth of affected modules, widest first**.

---

## Q-1: Which Firebase project is production, and what is its provisioned state?

- **Question:** What is the identity of the production Firebase project, and which of the repo's env-driven prerequisites actually exist there — the six `NEXT_PUBLIC_FIREBASE_*` client vars, the `FIREBASE_ADMIN_*` service-account credentials, and deployed Firestore/Storage rules?
- **Reason:** Every data-touching module in the repo is written against an environment the repo does not identify. The only project IDs present anywhere are emulator demo IDs (`demo-e2e`, `demo-kana-nihongo`, `demo-notifications`); there is no `.firebaserc` in `src/`. Any refactor of data access, auth, rules, or server actions is unverifiable against production without knowing what production *is* (U-17).
- **Affected modules:** `lib/firebase.ts`, `lib/firebase-admin.ts`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `firebase.json`, all of `features/*/services/`, all server actions (`features/*/actions/`), `src/functions/` (both functions), `e2e/`, `playwright.config.ts`.
- **Potential impact:** Whether server actions can run at all (Admin SDK credentials), whether client SDK config resolves, which rules/indexes are actually enforced, and which project the Cloud Functions package would deploy into all depend on the answer.
- **Confidence level:** High — the code is fully env-driven with lazy credential loading (`lib/firebase-admin.ts:14-27` exists specifically because builds run credential-free), so nothing in the repo can substitute for this answer.

## Q-2: Where is the app deployed, and what is its canonical production URL?

- **Question:** Is the app deployed anywhere today; on what platform; and what value (if any) does `NEXT_PUBLIC_SITE_URL` hold there?
- **Reason:** `lib/site.ts:1-5` records in a TODO that no hosting decision exists, and `SITE_URL` falls back to `http://localhost:3000`. Sitemap, robots, OG/metadata URLs, the PostHog first-party `/ingest` proxy, and the public shared-deck surface all embed or depend on the canonical origin. Refactoring routing, middleware (`proxy.ts`), or SEO surfaces without knowing the deployment target risks changing behavior that only manifests on the real host (U-1).
- **Affected modules:** `lib/site.ts`, `app/sitemap.ts`, `app/robots.ts`, `proxy.ts`, `app/[locale]/(main)/flashcard/shared/[shareId]/` (incl. `opengraph-image.tsx`), `next.config.ts`, `public/`.
- **Potential impact:** Correctness of every absolute URL the app emits; whether the PostHog reverse proxy and crawler files have ever served real traffic; whether the localhost fallback is currently live in production metadata.
- **Confidence level:** High — the TODO itself states the decision was never recorded, and no hosting config exists in the repo.

## Q-3: Has a Remote Config server template been published, and what are the live values of `maintenance_mode` and `locale_switch_enabled`?

- **Question:** Does the production Firebase project have a published Remote Config **server template**; and what are the current live values of the two flags?
- **Reason:** `maintenance_mode` gates the **entire app** at the root layout (`app/[locale]/layout.tsx:51,58`); `locale_switch_enabled` gates the locale-switch UI (`app/[locale]/(main)/settings/page.tsx:5-7`). The code explicitly tolerates a never-published template (`lib/flags.ts:52-56`), so the repo cannot distinguish "flags system in active use" from "flags system never activated". Refactoring the layout, the flag module, or the settings page changes different things depending on which is true (U-3).
- **Affected modules:** `lib/flags.ts`, `lib/firebase-admin.ts:74-76`, `app/[locale]/layout.tsx`, `app/_components/MaintenanceScreen.tsx`, `app/[locale]/(main)/settings/` (page + `SettingsPageClient.tsx`), `i18n/routing.ts`, `messages/ja.json`.
- **Potential impact:** Whether the ja locale switch has ever been user-visible (its in-repo default is hidden); whether maintenance mode is a tested production path or dead-by-default; what a change to `DEFAULT_FLAGS` would actually alter in production.
- **Confidence level:** High — flag live state is by design outside the repo, and both flags gate real, wide surfaces.

## Q-4: Do production observability credentials exist (Sentry DSNs, PostHog key), and what analytics scope was intended?

- **Question:** Are `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN` and `NEXT_PUBLIC_POSTHOG_KEY` set in the production environment; and were the "product events" promised by `lib/posthog.ts`'s comment (beyond the single manual `$pageview` at `lib/PostHogProvider.tsx:18`) descoped or are they pending?
- **Reason:** Both integrations are prod- and credential-gated no-ops without these values (`instrumentation.ts:10-14`, `instrumentation-client.ts:8-11`, `lib/posthog.ts:13-27`, `next.config.ts:27-31`). A refactor that assumes error monitoring or analytics exists — or that removes "unused" wiring — behaves very differently depending on whether the credentials exist and whether more instrumentation was planned (U-15, U-16).
- **Affected modules:** `instrumentation.ts`, `instrumentation-client.ts`, `next.config.ts`, `lib/posthog.ts`, `lib/PostHogProvider.tsx`, `proxy.ts:20-21` (`/ingest` rewrite), `app/global-error.tsx`, `app/[locale]/(main)/error.tsx`, `app/[locale]/(immersive)/error.tsx`, `app/[locale]/login/error.tsx`.
- **Potential impact:** Whether production errors are currently observed anywhere; whether the `/ingest` proxy path carries traffic; whether the near-empty PostHog event surface is a gap or a decision.
- **Confidence level:** High — the gating code is unambiguous, and the comment/implementation mismatch on "product events" is observed, not inferred.

## Q-5: What is the actual state of the notification schema migration in production data?

- **Question:** Was `scripts/backfill-notifications.mjs` ever run against production; do documents with only the legacy shape (`read` without `status`, `deckId`/`deckTitle`/`link`) still exist; are the composite indexes in `firestore.indexes.json` deployed; and is the Firestore TTL policy on `expiresAt` configured in GCP?
- **Reason:** The notifications feature carries dual read paths (`isUnread()` legacy fallback, `features/notifications/types/index.ts:104-109`), dual query strategies with runtime index-missing fallback (`notification-subscribe.ts:28-33,105-110`), dual indexes (`read+isDeleted` and `status+isDeleted`), and four `@deprecated` fields kept "for existing Firestore docs". Whether any of this compatibility machinery is still load-bearing is a data-state question; refactoring it either way without the answer changes what old documents render as (U-2, U-20).
- **Affected modules:** `features/notifications/` (types, services, domain, actions, components), `scripts/backfill-notifications.mjs`, `firestore.indexes.json`, `features/notifications/services/notification-paths.ts` (TTL constants), `firestore.rules:107-124`.
- **Potential impact:** Which of the two listener paths runs in production; whether unread counts are correct for pre-migration docs; whether read/deleted notifications are actually being reaped (TTL) or accumulating indefinitely.
- **Confidence level:** High — the code states outright that the TTL policy is "configured in GCP, not here" and the backfill is one-time; both are unknowable in-repo.

## Q-6: Are the Cloud Functions deployed and operating (digest schedule, Cloud Tasks queue, fan-out callable)?

- **Question:** Are `dailyNotificationDigest`, `deliverNotificationTask`, and `fanOutNotifications` deployed to the production project; does the Cloud Scheduler job fire; does the `deliverNotificationTask` queue exist in GCP; has any operator ever invoked the `fanOutNotifications` callable (which has zero in-repo callers); and are `NOTIFICATIONS_APP_ID` (functions) and `NEXT_PUBLIC_APP_ID` (app) kept in agreement in production env config?
- **Reason:** `functions/src/fanout.ts:7-15,128-134` self-describes as deployed-but-untriggered; the digest writes user-visible inbox documents daily **if** deployed (`functions/src/digest.ts:152-159`). A refactor of the notifications write path or of the functions package needs to know whether these are live production behavior or latent code — and the two packages derive the same `APP_ID` default from different env vars (U-19).
- **Affected modules:** `src/functions/` (entire package: `index.ts`, `digest.ts`, `fanout.ts`, `firebase-admin.ts`), `firebase.json` (functions block), `lib/app-id.ts`, `features/notifications/` (digest docs land in the same collection/schema the app renders).
- **Potential impact:** Whether users receive digest notifications today; whether removing or changing the digest's `type: "digest"` document shape affects live inboxes; whether the fan-out primitive can be treated as unreachable.
- **Confidence level:** High — deployment state is inherently out-of-repo, and the fan-out file's own comments confirm the no-caller status.

## Q-7: What is the intended end state of the `NotificationType` (4-value) vs `NotificationKind` (16-value) reconciliation?

- **Question:** Is the legacy 4-value `NotificationType` union (`features/notifications/types/index.ts:5`) meant to be retired, widened to the kind vocabulary, or kept as-is — given that the server writer already stores `type: input.kind` for 9 kinds (`notification.actions.ts:209`) and the digest function stores a tenth value, `"digest"` (`functions/src/digest.ts:82`)?
- **Reason:** `AppNotification.type` is statically typed narrower than the values the same codebase writes. Any refactor that trusts the TypeScript union (exhaustive switches, narrowing, validation) would be refactoring against a type that does not describe the data. `events.ts:11-15` says the two vocabularies "are reconciled as producers migrate", but the target is unrecorded (U-5).
- **Affected modules:** `features/notifications/types/index.ts`, `features/notifications/domain/events.ts`, `features/notifications/components/NotificationRow.tsx` (branches on `type === "invite"`), `features/notifications/components/NotificationIcon.tsx`, `features/notifications/actions/notification.actions.ts`, `firestore.rules:39-41` (rules validate only the 4 legacy values on the pending path), `functions/src/digest.ts`.
- **Potential impact:** Which stored `type` values every consumer must handle; whether rules and TypeScript types should agree with the writer; how digest documents are classified.
- **Confidence level:** High — the type/runtime divergence is directly observed at cited lines.

## Q-8: Which of the 7 inactive `NotificationKind`s are still intended to ship?

- **Question:** For each of `invite_declined`, `deck_updated`, `deck_deleted`, `privacy_changed`, `overtaken`, `leaderboard_top3`, `achievement` (`features/notifications/domain/registry.ts:63-163`, all `active: false`, zero producers): is a producer still planned, or is the kind abandoned?
- **Reason:** The registry, the emit schema (`features/notifications/schema.ts:74-82`), collapse-key logic, and rendering all carry weight for kinds that may never exist. Whether that surface is roadmap or dead determines what a notifications refactor must preserve (U-4).
- **Affected modules:** `features/notifications/domain/registry.ts`, `features/notifications/domain/events.ts`, `features/notifications/schema.ts`, `features/notifications/domain/id.ts` / `format.ts` (kind-driven), `features/game/` (`overtaken`/`leaderboard_top3` presuppose leaderboard producers), `functions/src/digest.ts` (digest copy references non-collapsing kinds).
- **Potential impact:** Whether the registry's extension points must survive restructuring intact; whether game-feature refactors need to leave room for competitive notification producers.
- **Confidence level:** Medium — the inactive status is observed with certainty, but "roadmap vs abandoned" is inference from forward-looking comments only.

## Q-9: What populates `analytics_daily` and `metadata/counters` in production?

- **Question:** Does any out-of-repo process (scheduled job, deleted function, manual export) write the `analytics_daily` collection and the `metadata/counters` document — or are the admin dashboard and analytics permanently running on their zero/fallback branches?
- **Reason:** Both are read by admin features and written by nothing in the repo (U-12, U-13). `getAdminStats()` substitutes `0` for `activeUsersToday`/`totalSessions`/`errorRate` without the cache (`features/admin/services/user.service.ts:96-105`); `exportAnalyticsAction` synthesizes a row with hardcoded zeros (`features/admin/actions/admin.actions.ts:284-299`). Refactoring admin analytics without knowing whether real aggregation exists elsewhere risks either preserving a dead read path or severing a live external pipeline's contract.
- **Affected modules:** `features/admin/services/analytics.service.ts`, `features/admin/services/user.service.ts`, `features/admin/actions/admin.actions.ts`, `features/admin/components/dashboard/` (stat cards, `SystemHealthCard`), `features/admin/components/analytics/`, `features/admin/hooks/useAnalytics.ts` / `useAnalyticsExport.ts`.
- **Potential impact:** Whether dashboard metrics shown to admins are real; whether the collection/document schemas are an external contract that must not be changed unilaterally.
- **Confidence level:** High — the read-without-write asymmetry is verified repo-wide; only the live project can resolve it.

## Q-10: How is admin authority provisioned in production (first superadmin, custom claims vs `admins/{uid}` docs)?

- **Question:** By what out-of-band mechanism were the first `admins/{uid}` document and/or the `admin`/`superadmin` custom claims created, and which of the two sources is operative for current admins?
- **Reason:** No repo code calls `setCustomUserClaims`; client writes to `admins` are rules-denied; the only in-repo grant path requires an already-existing superadmin (U-14). Refactoring the RBAC stack, the rules helper (`firestore.rules:16-22`), or the functions-side check (`functions/src/fanout.ts:120-124`) requires knowing which source production actually relies on — the two are checked in different combinations at different sites.
- **Affected modules:** `features/admin/services/admin.service.ts`, `features/admin/services/user.service.ts`, `features/admin/utils/rbac.ts`, `features/admin/hooks/useAdminRoleCheck.ts`, `firestore.rules`, `functions/src/fanout.ts`.
- **Potential impact:** Whether consolidating the claim-check and doc-check paths would lock out (or fail to lock out) real admins; what the `system_logs` read rule (`firestore.rules:199-202`) effectively grants.
- **Confidence level:** High — the absence of any claim-setting code is verified; a provisioning mechanism must exist outside the repo for the feature to work at all.

## Q-11: Are the never-emitted logging vocabulary members planned producers or dead declarations?

- **Question:** For the 8 `ActivityAction` members with zero producers (`DECK_SHARED`, `DECK_UNSHARED`, `CARD_CREATED`, `CARD_UPDATED`, `CARD_DELETED`, `SHARE_INVITE_SENT`, `SHARE_INVITE_REVOKED`, `KANA_PRACTICE_COMPLETED` — `lib/logging/actions.enum.ts:16-37`) and the `"cloud_function"` `LogSource` member with no writer (`features/admin/types/log.types.ts:4`): are producers still intended, or is this vocabulary dead?
- **Reason:** The admin reports UI filters and renders by these vocabularies (`features/admin/components/reports/`), and analytics discovery pools key off logged actions (`features/admin/services/analytics-*`). Whether the gaps are wiring debt (e.g. kana practice completing without logging while its quiz/survival siblings log) or descoped features changes what a logging refactor must keep (U-6, U-7).
- **Affected modules:** `lib/logging/actions.enum.ts`, `lib/logging/public.ts`, `features/admin/types/log.types.ts`, `features/admin/components/reports/`, `features/admin/services/analytics-engagement.ts` / `analytics-drilldowns.ts`, `features/kana/` (practice mode), `src/functions/` (candidate `cloud_function` producer).
- **Potential impact:** Whether admin analytics undercount activity by design or by omission; whether enum pruning would remove names an external consumer (log data already in Firestore) still carries.
- **Confidence level:** Medium — zero-producer status is verified per member; intent is not recoverable from code.

## Q-12: Where were `cardContentSchema`, `privacyModeSchema`, and `publicRoleSchema` supposed to be enforced?

- **Question:** Which write paths were `shared/schemas/card.schema.ts:63-80` (`cardContentSchema`) and `shared/schemas/lesson.schema.ts:33,35` (`privacyModeSchema`, `publicRoleSchema`) intended to guard, given each has zero non-test consumers while sibling schemas in the same files are consumed?
- **Reason:** `card.schema.ts:1-5` claims the schema is "the single validation source of truth" for forms, server actions, and AI/import parsing — but the actual write paths validate only the primary field via `validateAtomicCard`. A refactor of card/lesson validation must first know whether the schema is the target state (unfinished adoption) or superseded, because the two readings imply opposite treatments of the same file (U-10, U-11).
- **Affected modules:** `shared/schemas/card.schema.ts`, `shared/schemas/lesson.schema.ts`, `shared/utils/atomicCard.ts`, `features/flashcard/utils/card.validator.ts`, `features/flashcard/services/lesson-save.ts`, `features/flashcard/utils/parser.ts`, `features/ai/services/gemini.service.ts` / `gemini-parsing.ts`, `features/flashcard/components/ShareModal.tsx` (privacy modes).
- **Potential impact:** Whether `meaning`/`example`/`hint`/`clozeTemplate` constraints are supposed to be enforced anywhere; whether the "never editor via public link" cap has an intended schema-level enforcement point beyond UI convention.
- **Confidence level:** High — the consumer graph is verified; the header comment's claim is contradicted by observed imports, so the intent question is real.

## Q-13: What were the admin "Quick Actions" and the Settings page meant to do, and is `canChangeSettings` reserved for them?

- **Question:** What are the intended behaviors of the three handler-less buttons in `features/admin/components/dashboard/QuickActionsCard.tsx:21-41` ("Global Settings", "Content Audit", "Security Review"); what backend was the stub Settings page (`features/admin/components/settings/AdminSettingsPageContent.tsx:13-16`) waiting for; and is the never-used `canChangeSettings` permission (`features/admin/utils/rbac.ts:11`; `features/admin/services/admin.service.ts:76`) reserved for that surface?
- **Reason:** These are the repo's only shipped-but-inert UI/permission surfaces (U-8, U-9). An admin-feature refactor must know whether to treat them as pending features (preserve and wire) or abandoned (their removal is behavior-neutral) — the code cannot say which.
- **Affected modules:** `features/admin/components/dashboard/QuickActionsCard.tsx`, `features/admin/components/dashboard/AdminOverviewPage.tsx`, `features/admin/components/settings/AdminSettingsPageContent.tsx`, `app/[locale]/(main)/admin/settings/page.tsx`, `features/admin/utils/rbac.ts`, `features/admin/services/admin.service.ts`.
- **Potential impact:** Whether the RBAC permission enum and the admin dashboard layout carry obligations to unbuilt features; what admins currently experience when clicking three visible buttons that do nothing.
- **Confidence level:** High — the no-op status is directly observed; only intent is missing.

## Q-14: Is Firebase AI Logic operational on the production project, and is App Check actually enforced?

- **Question:** Is AI Logic (Gemini backend) enabled and billed on the production project; is App Check enforcement active (no App Check code exists in the repo despite `gemini-transport.ts:8-16` citing it as the abuse control); and do any `NEXT_PUBLIC_AI_*` env overrides change the model/limits in production from the in-repo defaults (`features/ai/config.ts:7-22`)?
- **Reason:** The entire AI feature (card/deck/image generation, match-mode distractors) is client-initiated against project-level configuration the repo cannot see. Refactoring the AI service split or its error taxonomy (`gemini-parsing.ts` classifies errors) needs to know what failure modes production actually produces — quota, App Check rejection, or none (U-18).
- **Affected modules:** `lib/firebase.ts:68-71`, `features/ai/` (config, transport, service, parsing, dedup, distractors, hooks), `features/flashcard/components/AIBulkPanel.tsx`, `features/flashcard/games/match/hooks/useMatchModeSession.ts`.
- **Potential impact:** Whether AI generation works at all in production; which model's output the parsing/dedup layers are actually tuned against; whether the documented no-client-key security posture is backed by enforced App Check or only by intention.
- **Confidence level:** Medium — the wiring is fully verified, but the enforcement claim lives only in a comment, and project-side state is unknowable.

## Q-15: Is the Google Translate TTS dependency an accepted operating risk, and what is its observed production failure rate?

- **Question:** Is the undocumented `translate.google.com/translate_tts` endpoint (`shared/audio/voice/googleTranslateTts.ts:31`) an accepted long-term dependency, and does the sampled `AUDIO_PLAYBACK_FAILED` activity-log data (`lib/AudioProvider.tsx:107-121`) show it working in production?
- **Reason:** The module's own header calls it "the known-fragile one: an undocumented, rate-limited, uncacheable endpoint" and says it is confined "so a tiered provider chain can replace it". Whether a replacement was ever planned, and how often the fallback chain currently fails users, are prerequisite facts for any audio-subsystem refactor — and the failure data lives in production `system_logs`, not the repo (U-24; inventory §10).
- **Affected modules:** `shared/audio/voice/googleTranslateTts.ts`, `shared/audio/` (sequencer, channels, unlock, telemetry, manager), `lib/AudioProvider.tsx`, kana/flashcard pronunciation call sites.
- **Potential impact:** Whether the telemetry taxonomy and tiered-fallback structure are load-bearing scaffolding for a planned provider swap or final architecture; what real-world reliability any restructuring must not regress.
- **Confidence level:** Medium — fragility is documented in-code (observed); the "replace later" intent and live failure rates are outside the repo.

## Q-16: Is the runtime KanjiVG fetch from GitHub `master` intentional as a permanent design?

- **Question:** Is fetching stroke-order SVGs at runtime from `raw.githubusercontent.com/KanjiVG/kanjivg/master/...` (`features/kana/components/KanaStrokeAnimation.tsx:14`) — unpinned, third-party, per-character — the intended permanent design, or an interim shortcut (e.g. pending vendoring/pinning)?
- **Reason:** The dependency tracks a moving branch of an external repo; upstream file renames or removals change app behavior with no repo change. Whether stroke animation is refactor-safe as-is or presumed-temporary cannot be determined from code (inventory §10).
- **Affected modules:** `features/kana/components/KanaStrokeAnimation.tsx` and the kana learn/chart surfaces that render it.
- **Potential impact:** Availability of stroke animations; licensing/attribution posture for KanjiVG content (CC-licensed upstream) — the repo contains no attribution notice for it.
- **Confidence level:** Medium — the unpinned fetch is observed; intent (permanent vs interim) is not recoverable.

## Q-17: Is Storybook adoption active, and are the scaffold/generated artifacts deliberate?

- **Question:** Is the full Storybook toolchain (7 devDependencies, 2 npm scripts) with exactly one story (`shared/components/ui/Badge.stories.tsx`) the start of active adoption or abandoned tooling; and are the tracked create-next-app scaffold SVGs in `public/` (zero references) and the untracked emulator/build artifacts (`firestore-debug.log` at both repo root and `src/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`) deliberate keeps?
- **Reason:** Tooling refactors (dependency pruning, CI, repo hygiene) need intent that the file state does not carry: one story could justify seven packages if adoption is planned, or none if it is not (U-22, U-23).
- **Affected modules:** `package.json` (devDependencies, scripts), `shared/components/ui/Badge.stories.tsx`, `public/*.svg`, `src/next-env.d.ts`, `src/tsconfig.tsbuildinfo`, `/firestore-debug.log`, `src/firestore-debug.log`.
- **Potential impact:** Whether component-development workflow assumptions (stories as documentation/tests, incl. `@storybook/addon-vitest`) hold for future UI work; whether the unreferenced assets are safe to treat as inert.
- **Confidence level:** Low — the observations are certain but low-stakes, and "adoption status" may simply be "nobody decided", which no answer source may resolve crisply.

