# 02 — Fallback Audit

Every fallback implementation in `src/`, classified with call-site evidence. **Headline: zero fallbacks are obsolete.** Every one found is either (a) ledger-gated, (b) load-bearing runtime resilience, or (c) test-only infrastructure. Nothing in this document is a deletion candidate.

Classifications: `FALLBACK_REQUIRED` (condition can genuinely occur; removal breaks users) · `FALLBACK_STILL_USED` (legacy-data driven; see doc 03) · `GATED(id)` (ledger-tracked; out of scope by definition) · No `FALLBACK_OBSOLETE`, `FALLBACK_UNCLEAR`, or `FALLBACK_SECURITY_RISK` items were found.

## 1. Runtime-resilience fallbacks (KEEP — all verified load-bearing)

| # | Location | Falls back from → to | Callers | Why removal is unsafe |
| --- | --- | --- | --- | --- |
| F1 | `shared/audio/voice/googleTranslateTts.ts:212-268` — `playMediaPronunciation` → browser `speechSynthesis` | Undocumented Google Translate TTS endpoint → `JAPANESE_VOICE_PRIORITY` browser voice → first `ja` voice → telemetered failure | `speakNow` — the sole pronunciation transport for every game/study surface | The primary tier is rate-limited and uncacheable by design (docblock lines 4-13); ADR-001 already flags this file as the known-fragile surface awaiting a real TTS provider. App-wide silent loss of pronunciation without it |
| F5 | `lib/flags.ts:20-23,62,85-87` — Remote Config → stale cached template → `DEFAULT_FLAGS` | Live RC template → last-good → kill-switch-safe defaults | `getFlags()` in root layout + settings page | An RC outage must not flip `maintenance_mode` unsafely. Both declared flags verified live: `maintenance_mode` gates `MaintenanceScreen` in root layout; `locale_switch_enabled` gates the settings locale control. **No obsolete flag keys exist** |
| F6 | `lib/firebase-admin.ts:35-38` — projectId chain ending in `"demo-notifications"` | `GCLOUD_PROJECT` → `FIREBASE_ADMIN_PROJECT_ID` → demo id | All Admin-SDK singletons | Emulator-only branch (guarded by `FIRESTORE_EMULATOR_HOST`); prevents a documented `aud`-mismatch failure in emu tests |
| F7 | `i18n/request.ts:8` — invalid locale → `defaultLocale` | Requested segment → `en` via `hasLocale` | next-intl runtime | Standard framework handling; removal 404s bad locale segments |
| F8 | `app/_components/ErrorFallback.tsx` | Crashed segment → provider-free static screen | Every `error.tsx` + `global-error.tsx` | Deliberately provider-free so it renders even when the root layout crashed |
| F9 | `app/_components/MaintenanceScreen.tsx` | Whole app → maintenance screen | Root layout, behind `maintenance_mode` | The kill switch's render surface (ADR 003) |
| F10 | `shared/components/ui/UserAvatar.tsx:28-36` — missing `src` → Trophy icon | Photo → icon | Leaderboard/user-meta surfaces | Users without photos exist. *Hygiene note:* no `onError` for **broken** (non-empty) URLs, while `admin/components/users/UserIdentityAvatar.tsx` handles that case — optional harmonization, tracked in doc 10 as P4 |
| F13 | `features/flashcard/utils/parser.ts:42-46` | JSON parse → CSV/TSV parse | Lesson import pane | Dual input format is the feature, not a fallback smell |
| F14 | `features/flashcard/utils/displayEngine.ts:124` | Malformed cloze card → standard-card rendering | All study/game renderers | Cannot prove no malformed doc exists in prod; crash otherwise |
| F15 | `features/flashcard/hooks/useEditableLesson.ts:39-49` — `"_disabled_"` sentinel | Real `ownerId` → sentinel while query disabled | Shared-edit page | Firestore ref objects must be constructible while `enabled: false`; removal reintroduces a hook-order crash |
| F16 | `features/flashcard/games/match/hooks/useMatchModeSession.ts:172-200` | Gemini distractors → locally computed | Match mode | AI is best-effort; game must not break on AI outage |
| F17 | `features/ai/services/gemini-distractors.ts:95-128` | Model output → static word lists → `"Item N"` filler | AI generation + match/speed | Guarantees exact distractor count |
| F18 | `features/kana/hooks/kanaDistractors.ts:32-40` | Visual/phonetic pool → random dataset top-up when pool < 3 | `useKanaQuizSession` | Small visual groups can't fill 3 distractors; quiz needs 4 options |
| F19 | `flashcard/games/speed/engine/` (4 sites: `speedRules.ts:39`, `DistractorBuilder.ts:104`, `CardSelector.ts:61`, `QuestionTypeSelector.ts:24`) | Empty history → level 1; semantic → shuffled pool; SRS pick → random; question type → degrade | Speed engine internals | Deterministic behavior on sparse data |
| F20 | `features/flashcard/hooks/useCardsWithProgress.ts:135` | Progress-read failure → fresh SRS state | Study surfaces | Non-fatal degradation: study must not be blocked by a progress-read error |
| F21 | `admin/components/reports/{LogTypeBadge,LogLevelBadge,LogsSummaryHeader}.tsx` | i18n key → verbatim raw value | Admin logs UI | Log vocabulary is open-ended by design |
| F22 | `app/[locale]/login/page.tsx:24,54` | Google popup sign-in → redirect sign-in | Login page | Popup blockers / mobile browsers |
| F23 | `features/ai/config.ts:1-4` — `asNumber(env, fallback)` | Env var → numeric default | AI config | Standard config default |
| F27 | `lib/app-store.ts:58-59` — zustand `persist` partialize | Missing persisted keys → in-code defaults | App-wide settings store | The additive-keys strategy deliberately replaces a persisted-state migration; removal breaks hydration for existing users |

## 2. Gated fallbacks (ledger-tracked; listed so nobody rediscovers them)

| # | Location | Gate | Ledger row |
| --- | --- | --- | --- |
| F2 | `features/notifications/services/notification-subscribe.ts:82-126` — composite-index query → `createdAt`-only + client-side filter, with backoff | Q-5 + NQ-1 | LDG-01 |
| F3 | `lib/site.ts:5` — `NEXT_PUBLIC_SITE_URL` → `http://localhost:3000` (repo's only TODO) | Q-2 | LDG-08 |
| F4 | `lib/app-id.ts:1` — `NEXT_PUBLIC_APP_ID` → `"kana-nihongo-master"` | Q-6 | LDG-09 |
| F11 | `admin/services/user.service.ts:65-92` — `metadata/counters` cache → live `.count()` aggregation | Q-9 | LDG-07 |
| F12 | `admin/actions/admin.actions.ts:278-286` + `analytics.service.ts:29` — `analytics_daily` snapshots → synthesized row | Q-9 | LDG-07 |
| F24 | Sentry (`instrumentation*.ts`) + PostHog (`lib/posthog.ts`, `PostHogProvider.tsx`, `/ingest` rewrite in `proxy.ts:61-68`) | Q-4 | LDG-18 |
| F28 | `notifications/domain/utils.ts:22-31` — `toMillis` accepting `Timestamp` / `{seconds}` / legacy client-clock `number` / unresolved serverTimestamp | Q-5 + NQ-1 (the `number` branch only; the serverTimestamp branch is permanent latency-compensation) | LDG-01 adjunct |

## 3. Test-only fallbacks (KEEP; not shipped)

| # | Location | Purpose |
| --- | --- | --- |
| F25 | `vitest.browser.config.ts:55-57` — `define: {"process.env": {}}` | next/link internals read `process.env` outside a Next runtime in Browser Mode |
| F26 | `i18n/navigation.testshim.ts` | Aliased only in `vitest.browser.config.ts:26-28` (verified zero app imports); works around a documented Vite dep-optimizer double-bundling bug. Re-check on next Vitest/Vite upgrade |

## 4. Areas swept and found clean

- **TODO/FIXME/HACK/XXX:** exactly one actionable TODO in all of `src/` — `lib/site.ts:1`, already gated (F3). Zero FIXME/HACK/XXX.
- **localStorage/sessionStorage fallbacks:** none hand-rolled; only zustand `persist` (F27). Firebase manages its own persistence.
- **Mock fallbacks:** none outside test files. `notifications/__tests__/fixtures.ts` deliberately fabricates the three legacy doc shapes — that is test coverage *of* the gated compat, and correct.
- **Polyfills/shims:** none in app code (F25/F26 are test-only).
- **Error boundaries:** every `error.tsx` delegates to the single shared `ErrorFallback` — no duplicate boundary implementations.
- **i18n:** single canonical locale fallback (F7); no per-message chains; exactly the two routed locales exist.
- **Config `??`/`||` defaults:** all inventoried above; `next.config.ts` contains none; `lib/logging/public.ts`'s `??` uses are data normalization, not config fallbacks.

## 5. Verdict

| Classification | Count |
| --- | --- |
| FALLBACK_REQUIRED (keep) | 19 |
| GATED (keep per ledger) | 7 |
| Test-only (keep) | 2 |
| **FALLBACK_OBSOLETE (removable)** | **0** |
| FALLBACK_UNCLEAR | 0 |
| FALLBACK_SECURITY_RISK | 0 |

The one candidate for *simplification* rather than removal: none currently — F1's tiered TTS chain is the documented ADR-001 interim design, and simplifying it is a product/vendor decision (cloud-TTS credential), not a cleanup.
