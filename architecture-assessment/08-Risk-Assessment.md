# 08 — Risk Assessment

**Phase 8 — Architecture Assessment.** This document assesses *risk*: where the system is likely to hurt, when, and how badly. It names no libraries, proposes no refactors, and prescribes no tasks. For each risk the final field ("What would lower uncertainty") is a one-line statement of the *class* of information or action that would resolve it — not a mitigation design.

**Method & evidence base.** Repo is source of truth. Every code-evidenced risk cites `file:line` verified at HEAD `a0bbbc4` (branch `main`). Git evidence (`git shortlog -sn --all`, authorship, date range, churn) backs the knowledge/evolution claims. The discovery corpus (`project-discovery/`) was used as a cross-check, not as primary evidence; discrepancies with it are listed at the end. **Production-state unknowns are segregated into §D** — they *lower confidence*, they do not *raise severity*. Where evidence is insufficient to rate a dimension, that is stated.

**Scope note on rigor.** This is a single-author, ~3-month-old (2026-04-12 → 2026-07-18), pre-deployment codebase (no `.firebaserc`, no `hosting` block). Many risks below are latent — they read as Low likelihood *now* precisely because there is one developer and, apparently, no production traffic yet. The Horizon column is where the weight is: most of these bite at deployment, at team growth, or at user scale, not today.

---

## 1. Risk matrix (likelihood × impact)

Placement uses each risk's *current* likelihood and its *blast-radius* impact. Read together with Horizon — an "at-scale"/"at-team-growth" risk sits low-likelihood today by definition.

| ↓ Impact \ Likelihood → | **Low** | **Medium** | **High** |
|---|---|---|---|
| **High** | R-2 (public-lesson unbounded listener), R-8 (Admin-SDK bootstrap out-of-band), R-13 (no hosting/deploy decision) | R-1 (per-user progress fan-out + listener fan-out), R-6 (fire-and-forget swallowed writes), R-11 (auth-token cookie non-httpOnly + presence-only gate) | — |
| **Medium** | R-3 (leaderboard world-readable PII), R-9 (emulator-vs-prod behavioral gap), R-14 (two-package independent deploy + APP_ID env split), R-16 (schema/rules validation drift) | R-4 (flashcard feature-size skew), R-5 (pattern divergence / migration-era machinery), R-7 (transaction coverage gaps), R-10 (bundle: recharts + realtime listener load), R-15 (emulator/JDK test topology) | R-12 (single-author knowledge concentration) |
| **Low** | R-17 (XSS surfaces: markdown + JSON-LD), R-18 (image handling), R-19 (index/TTL runtime dependency) | — | — |

---

## 2. Ranked list (highest concern first)

1. **R-12** — Single-author knowledge concentration (140/140 commits, one person). *High likelihood, Medium+ impact.*
2. **R-1** — Firestore per-user progress fan-out + per-mount `onSnapshot` fan-out (13 realtime files, listeners multiply per consumer). *Med / High.*
3. **R-11** — Non-httpOnly `auth-token` cookie + presence-only proxy gate (no server-side verification at the edge). *Med / High.*
4. **R-6** — Fire-and-forget writes with swallowed errors on real state (SRS counters, images, notifications, logs). *Med / High.*
5. **R-2** — Unbounded public-lesson `collectionGroup` listener (no `limit()`), mounted on the dashboard. *Low-now / High-at-scale.*
6. **R-13** — No hosting/deploy decision recorded (no `.firebaserc`, no `hosting` block, localhost `SITE_URL`). *Low / High.*
7. **R-8** — Admin authority bootstrap is entirely out-of-band; no code sets custom claims. *Low / High.*
8. **R-3** — Leaderboard collection is world-readable and exposes uid + displayName. *Low / Med.*
9. **R-4** — Feature-size skew: `flashcard` ≈ 17k LOC / 146 files (34% of `src/`). *Med / Med.*
10. **R-5** — Pattern divergence and migration-era machinery (dual notification vocabularies, legacy fallbacks, three return channels). *Med / Med.*
11. **R-7** — Transaction usage is inconsistent vs plain `setDoc`/`writeBatch` on multi-doc invariants. *Med / Med.*
12. **R-10** — Bundle & runtime: recharts (9 charts), LazyMotion boundary, concurrent listener count per screen. *Med / Med.*
13. **R-14** — Two independently-deployed packages, APP_ID sourced from two different env vars. *Low / Med.*
14. **R-9** — Emulator-vs-prod behavioral gap (rules/index/TTL/claims only ever exercised against emulator). *Low / Med.*
15. **R-15** — Test topology depends on JDK + Firebase emulator (4 configs, 3 tiers). *Med / Med.*
16. **R-16** — Declared schemas/rules validate a narrower surface than the code actually writes. *Med / Med.*
17. **R-17** — XSS surfaces: hand-rolled markdown renderer + JSON-LD injection. *Low / Low.*
18. **R-18** — Image handling: raw `<img>`, public-read Storage, 2 MB client-only cap. *Low / Low.*
19. **R-19** — Runtime dependency on out-of-repo Firestore indexes + TTL policy. *Low / Low.*

---

## 3. Code-evidenced risks

### R-1 — Per-user progress fan-out and per-mount realtime-listener multiplication
- **Area:** Scalability / Performance (Firestore data model + `onSnapshot` dominance).
- **Evidence:** SRS progress is fanned out per user under `artifacts/{APP_ID}/userProgress/{userId}/lessons/{lessonId}/cards/{cardId}` (`src/features/flashcard/services/progress.service.ts:55-71`), disjoint from the flat card-content collection `artifacts/{APP_ID}/users/{userId}/cards` (`src/features/flashcard/services/card.service.ts:29-33`). Reading a deck for study therefore opens **two** independent listeners that are merged in refs (`src/features/flashcard/hooks/useCardsWithProgress.ts:110-140`). Realtime is the dominant channel — 13 production files subscribe via `onSnapshot` (verified list: `useCardsWithProgress.ts`, `useDeckProgressStatus.ts`, `useEditableLesson.ts`, `useLessons.ts`, `card.service.ts`, `comment.service.ts`, `lesson-subscriptions.ts`, `useLeaderboard.ts`, `leaderboard.service.ts`, `stats.service.ts`, `NotificationsContext.tsx`, `notification-subscribe.ts`, `user.service.ts`). Crucially, `useUserProgress` opens **one listener per consuming component** (`src/features/user/services/user.service.ts:12-31`; consumers verified: `useHomeState`, `useStudySession`, `MatchGame`, `SpeedGame`, `KanaLearn`, `KanaChart`, `useKanaQuizSession`, `useKanaHubState`, `SettingsPageClient`, `profile/page` — 10 mount sites), in explicit contrast to the single centralized notifications listener (`src/features/notifications/context/NotificationsContext.tsx:136-151`).
- **Likelihood:** Med — the multiplication is structural, not conditional; it happens on every render of those hooks. What is unmeasured is the *concurrent* count at runtime (discovery §7 flags this too).
- **Impact:** High — blast radius is every authenticated screen. Concurrent listener count drives Firestore connection cost, client memory, and read-quota billing; the fan-out data model makes a single deck's study view a multi-collection join maintained live.
- **Horizon:** at-scale (per-user data growth) and at-incident (listener storms on reconnect).
- **Confidence:** High on structure; Low on runtime magnitude (never profiled).
- **What would lower uncertainty:** runtime listener/read-count telemetry under realistic multi-deck, multi-tab usage.

### R-2 — Unbounded public-lesson collection-group listener
- **Area:** Scalability (leaderboard/public reads; virtualization boundaries).
- **Evidence:** `subscribePublicLessons` runs `query(collectionGroup(db, "lessons"), where("isPublic", "==", true))` with **no `limit()`** (`src/features/flashcard/services/lesson-subscriptions.ts:120-127`), and it is a live `onSnapshot` (not a one-shot). It is mounted on the flashcard dashboard via `usePublicLessons` → `FlashcardDashboard` (`src/features/flashcard/hooks/useLessons.ts:240-270`; `src/features/flashcard/dashboard/components/FlashcardDashboard.tsx:57,119`). The same screen simultaneously holds the owner-lessons listener and the shared-lessons collection-group listener (`useLessons.ts:60,74`), the latter with a roles-query→collaborators-query fallback (`lesson-subscriptions.ts:82-110`). No virtualization is applied to the public/own/shared deck grids (virtualization exists only for admin logs and the notifications list — `src/features/admin/components/reports/LogsVirtualList.tsx`, `src/app/[locale]/(main)/notifications/_components/NotificationsVirtualList.tsx`).
- **Likelihood:** Low *now* (few public decks, one user) — but the query cost grows linearly and unboundedly with the global count of public decks, live, for every dashboard visitor.
- **Impact:** High — every viewer streams the entire public-deck corpus into memory and re-renders an un-virtualized grid on any change to any public deck anywhere.
- **Horizon:** at-scale (as soon as public decks are non-trivial in number).
- **Confidence:** High (query and mount site both verified).
- **What would lower uncertainty:** production count/growth of `isPublic == true` lessons.

### R-3 — Leaderboard collection is world-readable and exposes uid + display name
- **Area:** Security / Privacy (public leaderboard readability).
- **Evidence:** `firestore.rules` gates leaderboard reads on nothing but the collection-name pattern — `match /public/data/{collectionId}/{userId} { allow read: if collectionId.matches('leaderboard_.*'); }` (`src/firestore.rules:170-173`) — i.e. **no `isSignedIn()` check**, readable by anonymous clients. Each document ID is the player's Firebase **uid** and the body stores `displayName` (truncated to 20 chars) and `score` (`src/features/game/services/persist-best-score.ts:51-58`). By contrast the sibling `game_sessions` reads are correctly owner-scoped (`firestore.rules:161-167`).
- **Likelihood:** Low — requires someone to enumerate the collection; but it is trivially reachable by anyone who knows the project config.
- **Impact:** Med — leaks the uid↔displayName mapping for every ranked player to unauthenticated readers; uid is a stable cross-collection key.
- **Horizon:** now (the moment rules are deployed with real users).
- **Confidence:** High.
- **What would lower uncertainty:** confirmation of whether anonymous/public leaderboard reads are an intended product requirement.

### R-4 — Feature-size skew concentrates risk in `flashcard`
- **Area:** Maintainability (feature size skew).
- **Evidence:** `flashcard` is 146 files / 16,940 lines — ~34% of the 49,883-line `src/` tree and larger than the next three features combined (`admin` 8,781, `kana` 4,176, `notifications` 3,211) per discovery §1.3, re-derivable via `wc -l`. It owns the largest files in the repo: `ShareModal.tsx` (436), `FlashcardPractice.tsx` (396), `progress.service.ts` (335), and the deepest single component functions (`ShareModal` ≈ 367-line body, `progress.service.ts:55-71` path helpers plus multi-write flows). It also concentrates churn: `LessonBuilder.tsx` (27 commits), `ShareModal.tsx` (24) top the file-churn list.
- **Likelihood:** Med — any flashcard change touches a large, dense surface.
- **Impact:** Med — blast radius is contained to one feature, but that feature is the product's core and its most-changed code.
- **Horizon:** at-team-growth (large modules are hardest for new contributors) and now (change friction).
- **Confidence:** High.
- **What would lower uncertainty:** n/a (fully code-evidenced); a defect-density signal would refine it.

### R-5 — Pattern divergence and live migration-era machinery
- **Area:** Maintainability / Reliability (pattern divergence; migration-era machinery).
- **Evidence:** Multiple half-completed migrations coexist in production paths: (a) **two notification vocabularies** — `NotificationType` (4 values, `src/features/notifications/types/index.ts:5`) vs the 9 kinds actually written (`notification.actions.ts:209`) plus the Function's `type:"digest"` (`src/functions/src/digest.ts:82`); the file itself says they "are reconciled as producers migrate" (`events.ts:11-15`). (b) **Four `@deprecated` notification fields** kept "for existing Firestore docs" with a legacy `isUnread()` fallback (`types/index.ts:70-81,104-109`) and a paired legacy subscribe query (`notification-subscribe.ts:24-33`). (c) **Roles→collaborators fallback** in the shared-lessons listener (`lesson-subscriptions.ts:82-110`). (d) **Three distinct return channels** (realtime push / React Query one-shot / fire-and-forget) documented as an accepted convention (discovery §2), which is coherent but raises the count of shapes a maintainer must hold. (e) A one-time backfill script still in-tree (`scripts/backfill-notifications.mjs`).
- **Likelihood:** Med — the divergences are load-bearing today (fallbacks execute on real data shapes).
- **Impact:** Med — mostly comprehension cost and the "compile-time lie" where TS types are narrower than runtime values (`AppNotification.type`).
- **Horizon:** at-team-growth and at-incident (a maintainer trusting the narrow type is the failure mode).
- **Confidence:** High.
- **What would lower uncertainty:** whether the migrations are still intended to complete (product/roadmap fact — see R-16 / §D).

### R-6 — Fire-and-forget writes with swallowed errors on real state
- **Area:** Reliability (fire-and-forget writes; swallowed catch behavior).
- **Evidence:** A `.catch(() => {})` / `catch {}` swallow pattern is applied to writes that mutate real persisted state, not just telemetry:
  - `incrementDailyReviewCount(userId).catch(() => {})` — the daily-review counter feeding the dashboard is best-effort (`src/features/flashcard/services/progress.service.ts:157`).
  - Image cleanup on card edit/delete/save swallows failure, orphaning Storage objects: `deleteCardImage(...).catch(() => {})` at `src/features/flashcard/hooks/useLessonBuilder.ts:181,196`, `src/features/flashcard/services/lesson-save.ts:115,125`, `src/features/flashcard/services/lesson.service.ts:133`; and `deleteCardImage` itself catches internally (`image.service.ts:44-49`).
  - `updateDoc(cardDoc(...), { alternatives: [] }).catch(() => {})` clears card alternatives best-effort (`src/features/flashcard/services/card.service.ts:88`).
  - Notification emission is designed to "never surface a failure" (`src/features/notifications/services/notify.ts:10-12,24-26`); every activity-log action returns `Promise<void>` with errors swallowed (`activity-log.actions.ts:19-24`).
  - `deliverPendingNotifications(...).catch(() => {})` on login (`src/features/user/hooks/useFirebaseAuth.ts:70`) — pending-invite delivery failures are invisible.
  Answer-grade write-backs also swallow: `onAnswer(card, grade).catch(() => {})` (`FlashcardPractice.tsx:147`, `useCardSessionState.ts:80`).
- **Likelihood:** Med — these paths fail silently under any transient Firestore/network error; no signal reaches the user or (absent Sentry in prod — §D) any operator.
- **Impact:** High — blast radius includes silent SRS-counter drift, orphaned Storage objects that accrue cost, and lost notifications/audit entries, none observable without the live DB.
- **Horizon:** at-scale and at-incident.
- **Confidence:** High on the pattern; Med on consequence (some swallows are genuinely benign telemetry — the risk is that owner-state writes use the identical idiom).
- **What would lower uncertainty:** whether an error-monitoring DSN is actually set in production (would at least surface the swallowed failures) — a production-config fact (§D, R-11-adjacent).

### R-7 — Inconsistent transactional guarantees on multi-document invariants
- **Area:** Reliability (transaction usage vs plain `setDoc`/`writeBatch`).
- **Evidence:** Transactions are used in exactly three places — `persistBestScore` (leaderboard+personalBest read-check-write, `persist-best-score.ts:42`), `updateUserProgress` (added specifically to close a lost-update race, `user.service.ts:49`, commit `f03fe8e`), and the notification collapse-write (`notification.actions.ts:205`). Everything else that spans multiple docs uses `writeBatch` (atomic but no read-check) or bare `setDoc`/`updateDoc`: SRS grade is `setDoc`-or-`updateDoc` followed by a *separate* fire-and-forget counter increment (`progress.service.ts:147-157`); lesson save, card reorder, and cascade operations use `writeBatch` (`lesson-save.ts:69`, `card.service.ts:127`, `lesson.service.ts:50,120`, `progress.service.ts:210,317`). The `updateUserProgress` doc comment explicitly notes a plain merge-write there previously raced (`user.service.ts:33-41`), establishing that the same class of race is possible wherever the transactional pattern was *not* applied.
- **Likelihood:** Med — concurrent writers to the same user's progress (multi-tab, rapid grading) are plausible; the one place already known to race was patched reactively, implying others were not audited.
- **Impact:** Med — lost updates to progress/XP/streak counters; user-visible but recoverable, scoped per user.
- **Horizon:** at-scale (concurrency) and at-incident.
- **Confidence:** Med — the boundary between "safe with batch" and "needs transaction" is not documented; this is an inferred gap, not a proven bug.
- **What would lower uncertainty:** an invariant-level audit of which multi-doc writes have read-before-write dependencies.

### R-8 — Admin authority bootstrap is entirely out-of-band
- **Area:** Security (Admin SDK isolation; RBAC bootstrap).
- **Evidence:** Server role resolution accepts a custom claim (`superadmin`/`admin`) or an `admins/{uid}` doc (`src/features/admin/services/admin.service.ts:25-38`; mirrored in `firestore.rules:16-22` and `functions/src/fanout.ts:120-124`). **No repo code ever calls `setCustomUserClaims`** (repo-wide grep; only *reads* of `customClaims` at `user.service.ts:22,142`). Client writes to `admins/{uid}` are hard-denied (`firestore.rules:194-197`, `allow write: if false`); the only in-repo writer is `setAdminRole` (Admin SDK, `user.service.ts:127`), reachable only via `setAdminRoleAction` requiring `canPromoteUsers` — a superadmin-only permission (`rbac.ts:14-34`). Therefore the *first* superadmin cannot be created by any code path in the repo.
- **Likelihood:** Low — a one-time provisioning event, not a recurring operation.
- **Impact:** High — the entire admin surface (user promotion, content removal, analytics) hangs off an authority whose origin, rotation, and current holders are invisible to the codebase; misconfiguration here is a full-admin-access failure.
- **Horizon:** at-deployment and at-incident (no in-repo way to recover a lost superadmin).
- **Confidence:** High that the code cannot bootstrap it; the operational mechanism is a §D unknown.
- **What would lower uncertainty:** the documented out-of-band procedure (console/gcloud/script) and current claim-vs-doc source of truth in production.

### R-9 — Emulator-vs-production behavioral gap
- **Area:** Reliability (emulator-vs-prod behavioral gaps) / Deployment.
- **Evidence:** All security-critical behavior — `firestore.rules`, composite indexes, TTL reaping, custom claims — is only ever exercised against the emulator. The emulator project IDs are demo-only (`demo-e2e`, `demo-kana-nihongo`, `demo-notifications`; discovery §U-17). Rules-dependent code is written to *tolerate* the production reality being different: the notification listener "transparently falls back" if the composite index is missing (`notification-subscribe.ts:28-33,105-110`), and the shared-lessons listener falls back from the roles query to the collaborators query (`lesson-subscriptions.ts:100-108`). TTL is "configured in GCP, not here" (`notification-paths.ts:18-21`). E2E and emulator test suites sign in via a test-only bridge `window.__e2eSignIn` (`src/lib/firebase.ts:55-63`) that does not exist in prod.
- **Likelihood:** Low — but conditional on first real deploy, where index/rule/TTL/claim divergence surfaces for the first time.
- **Impact:** Med — degraded queries (fallback paths), unreaped documents (TTL), or over-broad reads if deployed rules lag the repo.
- **Horizon:** at-deployment.
- **Confidence:** Med (the gap is structural; its production consequence is unverifiable from the repo).
- **What would lower uncertainty:** confirmation that deployed rules/indexes/TTL match the repo artifacts and were validated against a real project.

### R-10 — Bundle and per-screen runtime load
- **Area:** Performance (bundle: LazyMotion/code-splitting, recharts split; realtime listener counts per screen).
- **Evidence:** Good signals exist: LazyMotion defers `domMax` to a code-split chunk (`src/lib/providers.tsx:78-97`), the command palette is `dynamic(..., { ssr:false })` (`CommandPaletteLauncher.tsx:6`), and all 9 admin charts are `dynamic()`-imported (`AdminAnalyticsPageContent.tsx:20-52`). Residual load: recharts backs **9 chart components** (`RoleChart`, `GrowthChart`, `EngagementChart`, `ContentDistributionChart`, `RetentionChart`, `LogLevelChart`, `ErrorTrendChart`, `LogVolumeChart`, `TopActionsChart`) — a heavy dependency, split but still shipped to any admin who opens analytics. Per-screen realtime load compounds this: the flashcard dashboard concurrently holds ≥3 collection-group/collection listeners (own + shared + unbounded public, R-2) plus each `useUserProgress` consumer's own listener (R-1). 35 runtime `dependencies` in `src/package.json`.
- **Likelihood:** Med — admin analytics and the dashboard are normal navigation targets.
- **Impact:** Med — heavier initial payload on admin routes; sustained listener/CPU load on the dashboard.
- **Horizon:** at-scale and now (admin experience).
- **Confidence:** Med — no bundle-size measurement was taken (no analyzer in tree); the recharts weight and listener counts are inferred from imports, not profiled.
- **What would lower uncertainty:** a production bundle analysis and a per-route active-listener count.

### R-11 — Non-httpOnly auth cookie behind a presence-only edge gate
- **Area:** Security (non-httpOnly auth-token cookie; presence-only proxy gate).
- **Evidence:** The `auth-token` cookie is written client-side and **deliberately not httpOnly** so the Firebase SDK can refresh it — `setAuthCookie` uses `document.cookie` with `SameSite=Lax`, `Secure` only over HTTPS, no `HttpOnly` (`src/shared/utils/cookie.ts:63-74`; rationale comment lines 65-66). The Next.js proxy gate checks only **presence**, never validity: `const token = request.cookies.get(COOKIE_NAME)?.value; if (!token && !isPublic) redirect(/login)` (`src/proxy.ts:80-92`) — it does **not** call `verifyIdToken` at the edge. The cookie is therefore (a) readable by any JS running on the origin (XSS-exfiltratable) and (b) sufficient, if merely *present* (any non-empty string), to pass the route gate; real authorization happens only downstream at `firestore.rules` and in server actions (`verifyIdToken`, `safe-action.ts:40-45`).
- **Likelihood:** Med — the design is intentional and the downstream checks are real, so this is not an open door; but the edge gate provides *no* security guarantee, and the cookie's JS-readability turns any XSS (see R-17) into token theft.
- **Impact:** High — a stolen ID token is a full user-session compromise; the "protected" routes offer no server-verified protection, only a redirect for missing cookies.
- **Horizon:** at-incident (paired with any XSS or a shared-device scenario).
- **Confidence:** High on the mechanics; the residual risk depends on whether any XSS vector lands (R-17) — currently Low-probability.
- **What would lower uncertainty:** whether App Check / server-side session verification is intended to backstop the edge (an intent/config fact).

### R-12 — Single-author knowledge concentration
- **Area:** Knowledge concentration (git authorship distribution — measured).
- **Evidence:** `git shortlog -sn --all` and `git log --format='%an <%ae>'` show **all 140 commits by one person** under two name spellings on the *same email* (`133 NgnPhamGiaHuy`, `7 Nguyễn Phạm Gia Huy`, both `yuh.nguyenpham@gmail.com`). History spans 2026-04-12 → 2026-07-18 (~3 months). There is a bus factor of **1** across every subsystem — Firestore data model, security rules, the Cloud Functions package, the emulator test topology, and the RBAC/claims bootstrap (R-8) all live entirely in one person's head. Convention is captured partly in `docs/adr/` (3 ADRs) and `docs/testing-notifications.md`, but much of the migration state (R-5) exists only as inline comments.
- **Likelihood:** High — this is the present state, not a projection.
- **Impact:** Med-to-High — no blast radius in code, but total continuity risk: onboarding, incident response, and the out-of-band admin/deploy procedures (R-8, R-13) have no second owner and limited written record.
- **Horizon:** at-team-growth and at-incident (immediate if the sole author is unavailable).
- **Confidence:** High.
- **What would lower uncertainty:** n/a for the metric; the gap is written runbooks for the out-of-band procedures.

### R-13 — No hosting or deployment decision recorded
- **Area:** Deployment (no `.firebaserc`/hosting decision; env-var surface).
- **Evidence:** An in-code `TODO(E3-T5/ADR-10)` states no hosting platform has been chosen; `SITE_URL` falls back to `http://localhost:3000` and feeds `sitemap.ts`, `robots.ts`, and page metadata (`src/lib/site.ts:1-5`). Confirmed: **no `.firebaserc`** at repo root or in `src/` (verified absent), `firebase.json` has **no `hosting` block** (only firestore/storage/functions/emulators — `src/firebase.json`), no `vercel.json`, and `docs/adr/` has no hosting ADR (only 001-audio, 002-data-layer, 003-flags). `public/` still holds the untouched create-next-app scaffold SVGs with zero references (discovery §U-1). The production Firebase project identity is unknown (all in-repo IDs are demo/emulator).
- **Likelihood:** Low — this is a one-time decision, not a recurring failure.
- **Impact:** High — nothing about the deploy target, domain, CDN, env-var provisioning, or the two-package deploy order is decided or reproducible; a first deploy has no defined shape.
- **Horizon:** at-deployment (blocks it) and now (metadata/OG/sitemap resolve to localhost).
- **Confidence:** High.
- **What would lower uncertainty:** the chosen hosting target and the production env-var set (`NEXT_PUBLIC_SITE_URL`, Firebase project, Admin credentials).

### R-14 — Two packages deploy independently with a split APP_ID source
- **Area:** Deployment / Operational complexity (two packages deploying independently; env-var surface).
- **Evidence:** The Next.js app (`src/`) and the Cloud Functions package (`src/functions/`, its own `package.json`, predeploy `npm run build` — `firebase.json`) deploy on separate lifecycles. They resolve the *same* logical namespace from **different env vars**: the app uses `NEXT_PUBLIC_APP_ID` (`src/lib/app-id.ts:1`), while both Functions read `NOTIFICATIONS_APP_ID` (`functions/src/fanout.ts:126`, `functions/src/digest.ts:151`), each defaulting to `"kana-nihongo-master"`. If the two env values ever diverge, the digest/fan-out Functions write to a different `artifacts/{APP_ID}/...` tree than the app reads — a silent, data-partitioning failure. The Functions package also carries its own `db`/`firebase-admin.ts` duplicate (discovery §7 duplicate-name scan).
- **Likelihood:** Low — defaults agree today; the risk is env drift across two deploy surfaces.
- **Impact:** Med — silent notification-delivery breakage (digests written to an orphan path), hard to diagnose because both sides "work" in isolation.
- **Horizon:** at-deployment and at-team-growth (two env surfaces to keep in sync).
- **Confidence:** High on the split; the failure is conditional on misconfiguration.
- **What would lower uncertainty:** confirmation that both env vars are set to the same value in the production/Functions environments.

### R-15 — Test topology depends on JDK + Firebase emulator across three tiers
- **Area:** Operational complexity / Team onboarding (emulator-dependent test topology; JDK/emulator prerequisites).
- **Evidence:** Tests are split across **four vitest configs** plus Playwright (discovery §5): unit (22 files), `*.browser.test` (12), `*.emu.test` + `firestore-rules.test` (5), and a separate config inside `functions/` (2). The emulator tiers require a **JVM** — `docs/testing-notifications.md:23` states "a Java runtime must be on PATH (the Firestore emulator is a JVM process)". `test:emu` wraps vitest in `firebase emulators:exec` (`package.json:10`), `test:functions` shells into the functions package (`package.json:11`), and Playwright boots its own emulator with `--project demo-e2e` (`playwright.config.ts:33-35`). A contributor cannot run the full suite without the Firebase CLI, a JDK, and knowledge of which tier covers what.
- **Likelihood:** Med — every new contributor hits this; even the sole author's most recent commit (`a0bbbc4`) is a fix to an emulator test crash.
- **Impact:** Med — onboarding friction and a real chance that emulator-tier tests are skipped locally (and thus rot), scoped to the security-critical rules/functions code that has no other coverage.
- **Horizon:** at-team-growth.
- **Confidence:** High.
- **What would lower uncertainty:** n/a (fully code/doc-evidenced).

### R-16 — Declared validation is narrower than what the code writes
- **Area:** Security / Maintainability (firestore.rules coverage vs collections actually written; schemas declared but unenforced).
- **Evidence:** Validation surface and write surface diverge in several places: (a) `cardContentSchema` — the self-described "single validation source of truth" — has **zero non-test consumers**; write paths use the narrower `validateAtomicCard` instead, so `meaning`/`example`/`hint`/`clozeTemplate` caps are enforced nowhere (`shared/schemas/card.schema.ts:63-80` vs `lesson-save.ts:61`, `parser.ts:147`, `gemini.service.ts:39`; discovery §U-10). (b) `privacyModeSchema`/`publicRoleSchema` likewise have no consumers (`lesson.schema.ts:33,35`; discovery §U-11). (c) `firestore.rules` validates notification `type in ['invite','comment','reply','role_change']` **only** on the client `pendingNotifications` path (`firestore.rules:39-41,181-188`); every server (Admin SDK) write bypasses rules entirely and stores a wider set (R-5). (d) Rules validate size caps (`title<=200`, `message<=2000`) only on that same client path. So the collections the app writes most (cards via Admin/client, notifications via Admin SDK) are validated by *code that may or may not run the schema*, not by rules.
- **Likelihood:** Med — malformed data can enter through any path that skips the unused schema; the atomic-only validator is genuinely narrower.
- **Impact:** Med — data-integrity drift (over-long or malformed card fields, notification shapes outside the TS union) that surfaces as render/logic bugs downstream, not as write failures.
- **Horizon:** at-scale (more data, more edge shapes) and at-team-growth (a contributor trusting the "source of truth" schema).
- **Confidence:** High on the import-graph facts; Med on real-world consequence.
- **What would lower uncertainty:** whether the unused schemas are the intended future validators (adoption unfinished) or overtaken artifacts — a design-intent fact (§D).

### R-17 — XSS surfaces: hand-rolled markdown renderer and JSON-LD injection
- **Area:** Security (XSS surfaces — `dangerouslySetInnerHTML` / JSON-LD).
- **Evidence:** Two `dangerouslySetInnerHTML` sites in production (grep-verified, excluding node_modules): (a) comment rendering — `renderMarkdown(comment.content)` (`CommentItem.tsx:180`), a hand-rolled regex markdown transformer (`CommentItem.tsx:45-60`) that emits `<strong>`, `<em>`, `<code>`, `<a href="$1">`, and `<br>`. It is defended by escape-at-write-time (`sanitizeCommentContent` escapes `& < > " '` — `comment-validation.ts:28-35`, called in `comment.service.ts:62,117,263`), so the render step assumes pre-escaped input. The residual risk is any comment document that reaches render **without** having passed `sanitizeCommentContent` (e.g. legacy/imported/Admin-written docs), and the auto-link regex constructing `href` from user text. (b) JSON-LD — `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}` on the shared-deck page (`SharedLessonPageClient.tsx:88`), where `jsonLd` embeds `preview.title`, `description`, and `ownerName` (`SharedLessonPageClient.tsx:70-84`); `JSON.stringify` does not escape `</script>` sequences.
- **Likelihood:** Low — the comment path is escaped at the sole in-app write site, and the values are project-owned; exploitation needs an unsanitized ingestion path.
- **Impact:** Low-to-Med if it lands — but note the pairing with R-11: any successful XSS here steals the JS-readable `auth-token`.
- **Horizon:** at-incident.
- **Confidence:** Med — the write-time escape is real and consistent; the "does every path go through it" guarantee is the uncertain part (title/ownerName come from lesson metadata whose sanitization was not traced end-to-end).
- **What would lower uncertainty:** confirmation that *all* comment and lesson-metadata write paths escape before persistence (a code audit, resolvable in-repo).

### R-18 — Image handling: raw `<img>`, public-read storage, client-only size cap
- **Area:** Performance / Security (image handling).
- **Evidence:** Card images render via raw `<img>` (not `next/image`) in learning/practice/dropzone components (`FlashcardLearn.tsx`, `FlashcardPractice.tsx`, `DraggableCard.tsx`, `ImportDropzone.tsx`, `SortableCardItem.tsx` — grep-verified), so there is no automatic resizing/format optimization for user-uploaded content. Storage rules make card images **world-readable** (`storage.rules:8-9`, `allow read: if true`) to support share links. The 2 MB size cap and `image/*` MIME check exist in **client code only** (`image.service.ts:24-30`) but are *also* enforced in Storage rules (`storage.rules:12-15`), so the server-side cap holds; the gap is content-type spoofing (MIME is checked, magic-bytes are not) and unbounded public read of any uploaded image.
- **Likelihood:** Low.
- **Impact:** Low — unoptimized image payloads (perf) and public readability of all card images (already an intended share feature); MIME-spoof is a minor vector given the 2 MB cap.
- **Horizon:** at-scale (bandwidth) and now (share-image privacy expectations).
- **Confidence:** Med.
- **What would lower uncertainty:** whether public readability of every card image is an accepted product decision.

### R-19 — Runtime dependency on out-of-repo indexes and TTL policy
- **Area:** Operational complexity (TTL/index dependencies stated in code).
- **Evidence:** Correct behavior of realtime features depends on GCP-side provisioning the repo cannot assert: 7 composite indexes + 2 field overrides declared in `firestore.indexes.json`, with the notification and shared-lesson listeners written to *fall back* if an index is missing (`notification-subscribe.ts:28-33`, `lesson-subscriptions.ts:100-108`); the digest Function *requires* a collection-group composite index (`status ASC, createdAt ASC`) and will error without it (`functions/src/digest.ts:110-127`). Notification reaping depends on a TTL policy "configured in GCP, not here" (`notification-paths.ts:18-21`). The `analytics_daily` and `metadata/counters` collections are **read but never written** by any repo code (`analytics.service.ts:27-33`, `user.service.ts:65`; discovery §U-12/§U-13), so admin dashboards silently run on zeroed fallback data unless an out-of-repo pipeline populates them.
- **Likelihood:** Low — declared indexes usually deploy with the rules; the risk is the TTL policy and the phantom analytics writers.
- **Impact:** Low-to-Med — degraded queries, unbounded notification growth (no TTL), and permanently-zero admin activity metrics.
- **Horizon:** at-deployment and at-scale.
- **Confidence:** Med — index deployment is likely fine; the TTL and the unwritten analytics collections are the real gaps, and both are §D unknowns.
- **What would lower uncertainty:** confirmation of deployed indexes, an active TTL policy, and whatever (if anything) populates `analytics_daily` / `metadata/counters`.

---

## 4. §D — Production-state unknowns (insufficient evidence; confidence-lowering, not severity-raising)

These are risks whose *severity cannot be rated from the repo* because the deciding fact is a runtime/ops/product state outside version control. They are listed to be explicit about insufficiency — **an unknown here should reduce confidence in the paired code-evidenced risk above, never inflate its rating.**

| # | Unknown | Which risk it gates | Why code cannot answer |
|---|---|---|---|
| D-1 | Is any error-monitoring DSN set in production? (Sentry double-gated on `NODE_ENV` + `SENTRY_DSN`) | R-6 (swallowed errors invisible if no DSN) | DSN lives in prod env, not repo (§U-15) |
| D-2 | Is App Check enforced? (no App Check code in repo) | R-11, R-17 (token/XSS backstop), R-2 (abuse of public reads) | Console/backend config (§U-18) |
| D-3 | Are `firestore.rules` / indexes / TTL actually deployed and matching HEAD? | R-9, R-19 | Deployment state not in repo (§U-20) |
| D-4 | Who holds superadmin; are claims or `admins/{uid}` docs the live source? | R-8 | Provisioned out-of-band (§U-14) |
| D-5 | Production Firebase project identity + Admin credentials | R-13, R-14 | No `.firebaserc`; all in-repo IDs are demo (§U-17) |
| D-6 | Do `NEXT_PUBLIC_APP_ID` and `NOTIFICATIONS_APP_ID` agree in prod? | R-14 | Two env surfaces, neither in repo (§U-19) |
| D-7 | Are the Cloud Functions (digest/fan-out/tasks) actually deployed? Is the Cloud Tasks queue / Scheduler job provisioned? | R-14, R-19 | Deployment fact; `fanOutNotifications` has no in-app caller (§U-19) |
| D-8 | Does anything populate `analytics_daily` / `metadata/counters`? | R-19 | Read-only in repo; writer (if any) is out-of-band (§U-12/13) |
| D-9 | Live feature-flag values (`maintenance_mode`, `locale_switch_enabled`); is a Remote Config template published? | (gates whether ja locale UI is even reachable) | Remote Config backend (§U-3) |
| D-10 | Are the deprecated-shape notification docs / legacy `collaborators` decks still present? | R-5 (whether fallbacks are load-bearing) | Data-state fact (§U-2) |

---

## 5. Discrepancies vs the discovery corpus

The discovery documents are accurate where they overlap this assessment; the differences are of *framing*, plus a small count nuance:

- **`onSnapshot` file count.** Discovery §2 / §6 cite "13 files" subscribing to realtime. Re-verified: exactly 13 non-test production files (list in R-1). **No discrepancy** — confirmed.
- **Custom-hook count.** Discovery §00-INDEX says "68 custom hooks"; §11-Code-Metrics §4 measures **67** (`use*.ts`/`use*.tsx`, excl. tests). Minor internal inconsistency in the corpus (68 vs 67); immaterial to risk.
- **`messages/*.json` line counts.** Discovery §11 §1.2 lists en=909 / ja=930; the same doc's §U-3 narrative says "803-key parity." Line-count vs key-count — not a contradiction, but the two figures sit unreconciled in the corpus.
- **Framing gap — discovery documents state, it does not rank.** Discovery correctly and neutrally *records* the public-lesson listener, the world-readable leaderboard rule, the non-httpOnly cookie, and the swallowed-error idiom as observations. This assessment newly **rates** them: R-2 (unbounded public listener) and R-3 (leaderboard PII exposure) are, in my judgment, higher-consequence than their neutral discovery mentions convey, and R-11 (cookie + presence-only gate) is a genuine security posture, not just a documented fact. No discovery claim was contradicted by the repo.
- **Leaderboard read rule.** Worth flagging explicitly because discovery's §U inventory frames leaderboard readability as a design choice: `firestore.rules:170-172` gates leaderboard reads on the collection-name pattern with **no `isSignedIn()`** — i.e. anonymous-readable. Verified in the rules file; this is the basis for R-3.
- **Everything else checks out.** Feature LOC skew (§1.3), the three return channels (§2/§9), the deprecated notification fields (§U-2), the unused schemas (§U-10/11), the APP_ID env split (§U-19), and the single-author history all reproduced exactly against the repo and git.

---

### Assessment confidence & insufficiency statement

Code-evidenced risks (R-1…R-19) are grounded in verified `file:line` references and git facts and carry the confidence noted per risk. **Any risk touching deployed behavior, live data shape, or ops configuration is bounded by §D** — this is a pre-deployment repository with no `.firebaserc`, demo-only project IDs, and no observable production traffic, so the *actual* severity of R-2, R-3, R-6, R-8, R-9, R-13, R-14, R-19 depends on facts this repo cannot contain. Those unknowns lower confidence; they were not used to inflate any rating.
