# 01 — Current State Inventory

Snapshot at commit `4ce20cc` (2026-07-22). Counts are `.ts`/`.tsx` files excluding `node_modules`, `.next`, `test-results`.

## 1. Top level of `src/`

| Entry | Kind | Notes |
| --- | --- | --- |
| `app/` | Route layer | Next.js App Router; orchestrator-only per T-105b audit |
| `features/` | 9 feature modules | Barrel-gated public APIs (ADR-101), lint-enforced boundaries |
| `shared/` | Cross-feature UI + utilities | `components/ (28)`, `audio/ (18)`, `utils/ (11)`, `schemas/ (11)`, `hooks/ (4)`, `constants/ (4)`, `providers/ (3)` |
| `lib/` | App-lifecycle infrastructure | 27 files: Firebase clients, auth session, logging pipeline, safe-action, store, analytics wiring, fonts/flags/site |
| `functions/` | Cloud Functions package | 6 files: `index.ts`, `fanout.ts`, `digest.ts`, `firebase-admin.ts` + 2 emu tests |
| `i18n/` | next-intl config | `routing.ts`, `navigation.ts`, `request.ts`, `navigation.testshim.ts` |
| `messages/` | Locale catalogs | `en.json` / `ja.json` — 33 namespaces, 795 keys each (in sync) |
| `scripts/` | Operational scripts | `backfill-notifications.mjs` (gated Q-5/NQ-1), `check-vocabulary-agreement.mjs` (+test, wired as `npm run check:vocab`) |
| `e2e/` | Playwright | `auth.spec.ts`, `realtime.spec.ts`, `helpers/` |
| Root files | Framework/config | `proxy.ts` (Next 16 middleware convention), `instrumentation.ts` + `instrumentation-client.ts` (Sentry, gated Q-4), `env-contract.test.ts`, `firestore-rules.test.ts`, 3 vitest configs, `playwright.config.ts`, `next.config.ts`, `firebase.json`, `firestore.indexes.json`, `eslint.config.mjs` (contains the LDG-16 lint-ratchet baseline) |

## 2. Feature modules (by size)

| Feature | Files | Internal shape |
| --- | --- | --- |
| **flashcard** | 166 | Sub-modularized (ADR-104, T-104a): `dashboard/14 · detail/12 · games/57 (match 13 · speed 25 · study 16 · hooks 3) · sharing/13 · builder/13` + root-level cross-sub-module infra: `services/23 · utils/9 · hooks/8 · domain/4 · loaders/4 · actions/2 · context/2 · types/2` + `index.ts`, `server.ts`, `notifications.ts`. Sub-modules carry their own barrels; boundaries lint-enforced (T-104b) |
| **admin** | 113 | `components/66 (analytics 10 · reports 12 · shared 20 · users 10 · content 8 · dashboard 5 · 1 loose) · hooks/15 · services/15 · types/6 · utils/5 · domain/2 · actions/2 · context/1` |
| **kana** | 66 | Sub-modularized: `survival/10 · chart/9 · quiz/8 · practice/6 · learn/5 · hub/3` + root `components/8 · hooks/6 · data/5 · types/2 · actions/2 · store.ts` |
| **notifications** | 40 | `domain/13 · components/7 · services/6 · actions/5 · types/2 · context/1 · __tests__/2` + root `schema.ts` (+test), `index.ts`, `server.ts`. Feature-agnostic by contract (ADR-102, lint-enforced T-102c) |
| **ai** | 26 | `services/8 · prompts/7 · hooks/5 · schemas/3` + root `types.ts`, `config.ts`, `index.ts` |
| **game** | 23 | `components/9 · domain/5 · services/5 · hooks/3` — shared game infrastructure (leaderboards, sessions, tiers) consumed by flashcard + kana |
| **user** | 17 | `hooks/5 · services/5 · actions/2 · context/2 · types/2` |
| **command-palette** | 5 | `components/2 · data/2` |
| **home** | 4 | `components/1 · hooks/2` |

All 9 have root `index.ts` barrels; flashcard and notifications also have `server.ts`.

## 3. `shared/` full inventory

- **components/ui (27):** ActionCard, Alert, Badge, Button, Card, ConfirmModal, DatePicker, DialogChrome, EmptyState, Input, LoadingSpinner, Modal, ModeSelectionCard, NotFoundScreen, Select, SettingsMenu, StatCard, Textarea, UserAvatar, UserMeta + `index.ts` + 6 browser tests
- **components/layout (2):** ScreenHeader (+barrel)
- **audio (18):** the ADR-001 sanctioned system — manager, policy, sequencer, channels, status, telemetry, unlock, sfx.presets, types, useAudioStatus, voice/googleTranslateTts (+6 tests)
- **utils (11):** array, atomicCard, cn, colors, cookie, reorder (+test), romaji, shareToken, time + barrel
- **schemas (11):** ai-generate-input, ai-output, card, comment, lesson (each +test) + barrel — *card schema family contains the three Q-12-gated zero-consumer schemas*
- **hooks (4):** useCopyToClipboard, useNow, usePrefersReducedMotion + barrel
- **constants (4):** public-routes (+test), styles + barrel
- **providers (3):** AlertProvider (+browser test) + barrel

## 4. `lib/` full inventory (27)

Firebase: `firebase.ts`, `firebase-admin.ts` · Auth: `auth-session.ts` (+emu test) · Actions: `safe-action.ts` (+emu test; contains LDG-21 `toActionResult`) · Logging pipeline (9): `actions.enum`, `actions`, `activity`, `browser`, `log-types`, `public`, `schema`, `server`, `user-actions` (+emu test) · State: `app-store.ts` · Analytics: `posthog.ts`, `PostHogProvider.tsx` (gated Q-4) · Composition: `providers.tsx`, `AudioProvider.tsx`, `FontSyncer.tsx` · Misc: `site.ts` (gated Q-2), `app-id.ts` (gated Q-6), `flags.ts` (kill-switch infra, ADR 003), `fonts.ts`, `motionFeatures.ts`

## 5. Route layer (`app/`)

Two route groups under `[locale]`: `(main)` — flashcard, kana, notifications, profile, settings, admin (6 sub-routes) — and `(immersive)` — flashcard game modes, kana practice/quiz/survival. Plus `login`, root files, `app/_components` (ErrorFallback, MaintenanceScreen, ReactScan) and `app/[locale]/(main)/_components` (BottomNav).

## 6. Migration-related files still present (all deliberate)

| File | Why it exists | Tracking |
| --- | --- | --- |
| `scripts/backfill-notifications.mjs` | One-time legacy-doc backfill, **not yet run** against prod | LDG-01, gate Q-5/NQ-1 |
| `features/notifications/services/notification-subscribe.ts` | Primary/fallback dual listener over old+new index shapes | LDG-01 |
| `features/notifications/types/index.ts` | 4 `@deprecated` fields + `isUnread()` legacy branch | LDG-01 |
| `lib/safe-action.ts` `toActionResult` | Envelope adapter retained post-unification | LDG-21 (keep) |
| `eslint.config.mjs` ratchet baseline | 12 files pinned to `warn` so CI lint could become blocking | LDG-16 (shrinks via T-116a/T-109a ownership) |

## 7. Legacy/compatibility folders

**None exist.** There is no `legacy/`, `old/`, `deprecated/`, `v1/`, or compat directory anywhere in `src/`. The modernization program deleted its dead surfaces as it went (Storybook toolchain, 7 dormant notification kinds, 8 dormant activity actions, inert admin controls, the Drawer primitive, superseded action clients). What remains legacy-shaped is individually tracked in the ledger, not foldered.

## 8. Observations carried into later docs

1. `features/admin/components/` holds 66 files — the largest single directory tree; one file sits loose outside its 6 sub-groups (→ 06).
2. `shared/schemas/` mixes live schemas with the three Q-12-gated dead ones — confusing to readers, but resolution is gated (→ 02/10).
3. `flashcard/notifications.ts` sits at feature root (the ADR-102 registry hookup) — placement reviewed in 06.
4. `i18n/navigation.testshim.ts` — a test shim living next to prod config; ownership reviewed in 04/07.
5. Two `__screenshots__/` directories under flashcard exist but are empty in the working tree (vitest browser-test artifacts, non-empty only after test runs; `.gitignore`-status checked in 04).
