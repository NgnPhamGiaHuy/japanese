# 01 — Project Overview

Discovery-phase documentation. Everything below is derived from reading the repository contents directly; paths are relative to the repo root (`/Users/yuh.nguyenpham/GitHub/japanese`). "Observed" statements cite files that were actually read; "Inferred" statements are interpretations and are marked as such.

The application is a Japanese-learning web app (kana practice, flashcards, games, notifications, admin console) built as a Next.js App Router project living in the `src/` subdirectory, backed by Firebase (Auth, Firestore, Storage, Cloud Functions, AI). The Cloud Functions package (`src/functions/`) is a separate npm package.

---

## 1. Repository top-level contents

Observed via directory listing of the repo root:

| Entry | Type | One-line description |
|---|---|---|
| `.DS_Store` | file | macOS Finder metadata. |
| `.claude/` | dir | Claude Code project config (`launch.json`, `skills/`, `worktrees/`). |
| `.env.local` | file | Untracked local environment file at repo root (existence noted; contents not documented here). |
| `.git/` | dir | Git repository data. |
| `.github/` | dir | Contains `workflows/ci.yml` — the single CI workflow (build/lint/unit-test job, Firestore/Auth rules emulator job, Cloud Functions emulator job; `.github/workflows/ci.yml:25,70,102`). |
| `.gitignore` | file | Repo-root ignore rules. |
| `.idea/` | dir | JetBrains IDE project files. |
| `.rules/` | dir | Rules/instructions content (`ai-rules/`, `code.mdc`, `skills/`, `universal_js_commenting_intelligence.yaml`). |
| `docs/` | dir | Project docs: `README.md`, `adr/` (`001-audio-architecture.md`, `002-data-layer-pattern.md`, `003-feature-flags.md`), `testing-notifications.md`. |
| `firestore-debug.log` | file | Firebase emulator debug log. |
| `src/` | dir | The Next.js project root (see §2). |
| `project-discovery/` | dir | Output directory of this discovery phase (created by the documentation agents). |

**Prior-analysis artifacts.** The git status snapshot for this session lists untracked entries `PROJECT_CONTEXT.md`, `architecture-audit/`, `codebase-cleanup/`, `engineering-tasks/`, `implementation-wave-1/`, `requirements-consolidation/`, and `repomix-output.xml` at the repo root. Observed at discovery time: **none of these exist on disk** (verified with `ls`; each returned "No such file or directory"). They are prior-analysis artifacts and are not used as evidence anywhere in this documentation set, per discovery rules. Inferred: they were deleted between the status snapshot and this discovery run.

---

## 2. `src/` structure (depth ~2)

Observed by listing and sampling contents. `src/` is the Next.js project root: it holds `package.json`, `next.config.ts`, `tsconfig.json`, and all app code.

| Path | Purpose (verified by sampling) |
|---|---|
| `src/.husky/` | Git hooks (`pre-commit`; see §6). |
| `src/.storybook/` | Storybook config (`main.ts`, `preview.tsx`; see §5). |
| `src/.vitest-attachments/` | Hash-named `.png` files. Inferred: screenshot attachments from Vitest browser-mode runs. |
| `src/app/` | Next.js App Router tree. `[locale]/` dynamic segment with `(main)` and `(immersive)` route groups plus `login/`; root-level `globals.css`, `global-error.tsx`, `robots.ts`, `sitemap.ts`, `favicon.ico`, and `_components/` (`ErrorFallback.tsx`, `MaintenanceScreen.tsx`, `ReactScan.tsx`). See §8. |
| `src/e2e/` | Playwright E2E specs (`auth.spec.ts`, `realtime.spec.ts`) + `helpers/` (`emulator-auth.ts`, `emulator-firestore.ts`, `sign-in.ts`). |
| `src/features/` | Nine feature modules: `admin`, `ai`, `command-palette`, `flashcard`, `game`, `home`, `kana`, `notifications`, `user` (see §9 table). |
| `src/functions/` | Separate npm package for Firebase Cloud Functions 2nd gen (own `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `src/` sources, `lib/` — inferred: `lib/` is the `tsc` build output, since `package.json` sets `"main": "lib/index.js"` and `"build": "tsc"`; `src/functions/package.json:9-12`). |
| `src/i18n/` | next-intl wiring: `routing.ts`, `request.ts`, `navigation.ts`, `navigation.testshim.ts`. |
| `src/lib/` | App-level singletons and cross-cutting infrastructure: `firebase.ts`, `firebase-admin.ts`, `app-store.ts` (Zustand), `providers.tsx`, `safe-action.ts`, `flags.ts`, `posthog.ts`, `PostHogProvider.tsx`, `AudioProvider.tsx`, `FontSyncer.tsx`, `fonts.ts`, `motionFeatures.ts`, `site.ts`, `app-id.ts`, and `logging/` (activity/system-log write path: `actions.ts`, `activity.ts`, `user-actions.ts`, `browser.ts`, `server.ts`, `public.ts`, `schema.ts`, `actions.enum.ts`). |
| `src/messages/` | i18n message catalogs: `en.json` (~40.8 KB), `ja.json` (~48.8 KB). |
| `src/public/` | Static assets (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`). |
| `src/scripts/` | One operational script: `backfill-notifications.mjs`. |
| `src/shared/` | Shared code: `audio/` (audio subsystem with its own README and unit tests), `components/` (`ui/` primitives + `layout/`), `constants/`, `hooks/`, `providers/` (`AlertProvider`), `schemas/` (Zod schemas + tests), `utils/`. |

Root-level files in `src/` (observed): `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `prettier.config.js`, `eslint.config.mjs`, `proxy.ts`, `instrumentation.ts`, `instrumentation-client.ts`, `playwright.config.ts`, `vitest.config.ts`, `vitest.browser.config.ts`, `vitest.emu.config.ts`, `vitest.shims.d.ts`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `firestore-rules.test.ts`, `storage.rules`, `next-env.d.ts`, `tsconfig.tsbuildinfo`, `firestore-debug.log`.

---

## 3. `src/package.json` in detail

Observed at `src/package.json`. Name `"src"`, version `0.1.0`, `"private": true` (`src/package.json:2-4`).

### Scripts (`src/package.json:5-19`)

| Script | Command | What it runs |
|---|---|---|
| `dev` | `next dev` | Next.js dev server. |
| `build` | `next build` | Production build. |
| `test` | `vitest run` | Default Vitest run (node-env unit project + Storybook browser project; see §7). |
| `test:browser` | `vitest run --config vitest.browser.config.ts` | Real-browser (Chromium) component tests. |
| `test:emu` | `firebase emulators:exec --only firestore,auth "vitest run --config vitest.emu.config.ts"` | Boots Firestore+Auth emulators, then runs emulator-backed tests. |
| `test:functions` | `npm --prefix functions run test:emu` | Delegates to the functions package's emulator test script. |
| `emulators:start` | `firebase emulators:start --only firestore,auth` | Standalone emulators (Firestore+Auth). |
| `emulators:start:all` | `firebase emulators:start --only firestore,auth,functions,storage` | Standalone emulators (all four). |
| `start` | `next start` | Production server. |
| `lint` | `eslint` | ESLint (flat config). |
| `prepare` | `cd .. && husky src/.husky` | Installs husky hooks from the repo root, pointing at `src/.husky`. |
| `storybook` | `storybook dev -p 6006` | Storybook dev server. |
| `build-storybook` | `storybook build` | Static Storybook build. |

A `lint-staged` block also lives in this file (`src/package.json:20-28`): `*.{js,jsx,ts,tsx}` → `eslint --fix` then `prettier --write`; `*.{json,css,md}` → `prettier --write`.

### Dependencies (`src/package.json:29-65`), grouped by role

| Role | Package | Version |
|---|---|---|
| Framework | `next` | `16.2.3` |
| Framework | `react` / `react-dom` | `19.2.4` / `19.2.4` |
| Framework | `server-only` | `^0.0.1` |
| Firebase | `firebase` | `^12.12.0` |
| Firebase | `firebase-admin` | `^13.8.0` |
| UI (headless/primitives) | `@base-ui/react` | `^1.6.0` |
| UI (drag & drop) | `@dnd-kit/core` / `@dnd-kit/sortable` / `@dnd-kit/utilities` | `^6.3.1` / `^10.0.0` / `^3.2.2` |
| UI (icons) | `lucide-react` | `^1.8.0` |
| UI (animation) | `motion` | `^12.42.2` |
| UI (charts) | `recharts` | `^3.9.2` |
| UI (misc) | `cmdk` | `^1.1.1` |
| UI (misc) | `react-confetti` | `^6.4.0` |
| UI (misc) | `react-day-picker` | `^10.0.1` |
| UI (misc) | `react-dropzone` | `^17.0.0` |
| UI (toasts) | `sonner` | `^2.0.7` |
| UI (class utils) | `clsx` / `tailwind-merge` | `^2.1.1` / `^3.5.0` |
| State/data | `zustand` | `^5.0.14` |
| State/data | `@tanstack/react-query` | `^5.101.2` |
| State/data | `@tanstack-query-firebase/react` | `^2.1.1` |
| State/data | `@tanstack/react-table` | `^8.21.3` |
| State/data | `@tanstack/react-virtual` | `^3.14.6` |
| Forms/validation | `react-hook-form` / `@hookform/resolvers` | `^7.81.0` / `^5.4.0` |
| Forms/validation | `zod` | `^4.3.6` |
| Server actions | `next-safe-action` | `^8.5.5` |
| i18n | `next-intl` | `^4.13.2` |
| Observability | `@sentry/nextjs` | `^10.65.0` |
| Observability | `posthog-js` | `^1.402.3` |
| Utilities | `date-fns` | `^4.1.0` |
| Utilities | `fractional-indexing` | `^4.0.0` |
| Tooling (in deps) | `prettier` | `^3.8.2` |

### devDependencies (`src/package.json:66-101`), grouped by role

| Role | Package | Version |
|---|---|---|
| Testing (Vitest) | `vitest` | `^4.1.8` |
| Testing (Vitest) | `@vitest/browser` / `@vitest/browser-playwright` / `@vitest/coverage-v8` | `^4.1.10` / `^4.1.10` / `^4.1.10` |
| Testing (Vitest) | `vitest-browser-react` | `^2.2.0` |
| Testing (E2E) | `@playwright/test` / `playwright` | `^1.61.1` / `^1.61.1` |
| Testing (Firebase) | `@firebase/rules-unit-testing` | `^5.0.1` |
| Testing (mocking) | `msw` | `^2.15.0` |
| Storybook | `storybook` / `@storybook/nextjs-vite` | `^10.5.0` / `^10.5.0` |
| Storybook addons | `@storybook/addon-a11y` / `addon-docs` / `addon-mcp` / `addon-vitest` | `^10.5.0` / `^10.5.0` / `^0.7.0` / `^10.5.0` |
| Storybook | `@chromatic-com/storybook` | `^5.2.1` |
| Lint | `eslint` / `eslint-config-next` / `eslint-plugin-storybook` | `^9` / `16.2.3` / `^10.5.0` |
| Format | `@ianvs/prettier-plugin-sort-imports` / `prettier-plugin-tailwindcss` | `^4.4.1` / `^0.6.11` |
| Git hooks | `husky` / `lint-staged` | `^9.1.7` / `^16.4.0` |
| CSS | `tailwindcss` / `@tailwindcss/postcss` | `^4` / `^4` |
| Build/dev | `vite` / `@vitejs/plugin-react` | `^8.1.4` / `^6.0.3` |
| Firebase tooling | `firebase-tools` | `^15.24.0` |
| Types | `typescript` / `@types/node` / `@types/react` / `@types/react-dom` | `^5` / `^20` / `^19` / `^19` |
| Dev utilities | `react-scan` | `^0.5.7` |
| SEO types | `schema-dts` | `^2.0.0` |

An npm `overrides` block pins `aria-query` to `5.3.2` (`src/package.json:102-104`).

---

## 4. `src/functions/package.json` (separate package)

Observed at `src/functions/package.json`. Name `kana-nihongo-master-functions`, version `1.0.0`, private; description: "Cloud Functions 2nd gen: notification digest scheduler + Cloud Tasks fan-out (E14-T2)" (`src/functions/package.json:2-5`). Node engine pinned to `20`; entry point `lib/index.js` (`src/functions/package.json:6-9`).

| Script | Command |
|---|---|
| `build` | `tsc` |
| `build:watch` | `tsc --watch` |
| `lint` | `eslint` |
| `test` | `vitest run --config vitest.config.ts` |
| `test:emu` | `firebase emulators:exec --config ../firebase.json --project demo-kana-nihongo --only firestore,functions,storage "vitest run --config vitest.config.ts"` |

(`src/functions/package.json:10-16`.)

Dependencies: `firebase-admin` `^13.8.0`, `firebase-functions` `^6.5.0`. devDependencies: `@eslint/js` `^9.39.1`, `eslint` `^9.39.1`, `firebase-tools` `^15.24.0`, `typescript` `^5.9.3`, `typescript-eslint` `^8.46.4`, `vitest` `^3.2.4` (`src/functions/package.json:17-28`). Note the functions package uses Vitest 3.x while the app uses 4.x (observed version strings).

Deployed functions (observed at `src/functions/src/index.ts:7-8`): `dailyNotificationDigest` (from `digest.ts`) and `deliverNotificationTask` + `fanOutNotifications` (from `fanout.ts`).

---

## 5. Build tooling

### `src/next.config.ts`

Observed: the config composes two wrappers — `createNextIntlPlugin()` (next-intl) and `withSentryConfig` (`src/next.config.ts:7,27`). The `NextConfig` object itself only sets `images.remotePatterns` for `lh3.googleusercontent.com` and `firebasestorage.googleapis.com` (`src/next.config.ts:9-22`). Sentry source-map upload is disabled unless `SENTRY_AUTH_TOKEN` is set (`src/next.config.ts:29-31`). There is no `turbopack` or `webpack` key in the config.

Turbopack/webpack signals: `next dev`/`next build` are used without bundler flags (`src/package.json:6-7`). A comment in `src/lib/providers.tsx:69-77` references measuring bundle output "under Turbopack", and `src/vitest.emu.config.ts:21-23` refers to "webpack/turbopack's `react-server` export condition". Inferred: the app builds with Next 16's default bundler (Turbopack) — the config does not state this explicitly.

Sentry runtime init lives in `src/instrumentation.ts` (server/edge; no-op unless `NODE_ENV === "production"` and `SENTRY_DSN` is set; `src/instrumentation.ts:10-12`) and `src/instrumentation-client.ts` (browser; gated on `NODE_ENV === "production"` and `NEXT_PUBLIC_SENTRY_DSN`; `src/instrumentation-client.ts:8-10`).

### `src/tsconfig.json`

Observed: `strict: true` (`src/tsconfig.json:7`); `target: ES2017`, `module: esnext`, `moduleResolution: bundler`, `jsx: react-jsx`, `allowJs`, `skipLibCheck`, `noEmit`, `isolatedModules`, `incremental`, `resolveJsonModule`, `esModuleInterop` (`src/tsconfig.json:3-15`). One path alias: `"@/*": ["./*"]` — i.e. `@/` maps to the `src/` project root (`src/tsconfig.json:21-23`). Excludes: `node_modules`, `**/*.emu.test.ts`, `firestore-rules.test.ts`, `**/__tests__/harness.ts`, `functions/**` (`src/tsconfig.json:33-39`). No additional strictness flags beyond `strict` (no `noUncheckedIndexedAccess` etc. present).

### Tailwind (v4, CSS-based config)

Observed: no `tailwind.config.*` file exists in `src/`; configuration is CSS-first, as in Tailwind v4. `src/postcss.config.mjs:3` registers the single plugin `@tailwindcss/postcss`. `src/app/globals.css:1` is `@import "tailwindcss";` followed by an `@theme` block (`src/app/globals.css:6-42`) defining design tokens: mode colors (`--color-hiragana: #58cc02`, `--color-katakana: #1cb0f6`, `--color-both`, `--color-survival`, `--color-danger`, `--color-teal`, `--color-pink`), neutrals (`--color-bg`, `--color-text`, `--color-muted`, `--color-border`, `--color-danger-bg`), per-hue `-strong`/`-hover` companion shades, custom radii (`--radius-5xl`, `--radius-6xl`), and `--container-8xl`. Font variables (`--font-ui`, `--font-japanese`) are declared under `:root`, fed by `next/font/google` variables from `src/lib/fonts.ts` (Nunito / Noto Sans JP / Klee One, per the comment at `src/app/globals.css:44-63`); a `body.handwriting-font` override switches `--font-japanese` to Klee One. The file is 174 lines total.

### Storybook (`src/.storybook/`)

Observed at `src/.storybook/main.ts`: framework `@storybook/nextjs-vite` (`src/.storybook/main.ts:21`); stories are co-located globs over `../shared/**`, `../features/**`, `../app/**` (`src/.storybook/main.ts:9-13`); addons: `@chromatic-com/storybook`, `@storybook/addon-vitest`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-mcp` (`src/.storybook/main.ts:14-20`); `staticDirs: ["../public"]`. `src/.storybook/preview.tsx` imports `../app/globals.css` and sets a11y test mode `"todo"` (violations shown in test UI, not failing CI; `src/.storybook/preview.tsx:14-19`). Only one story file exists currently (`src/shared/components/ui/Badge.stories.tsx`; see counts in §10).

---

## 6. Linting, formatting, git hooks

### ESLint (`src/eslint.config.mjs`, flat config)

Observed:
- Base: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` (`src/eslint.config.mjs:2-3,8-9`).
- Global ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`, and `functions/**` (the functions package lints itself with its own `eslint.config.mjs`; `src/eslint.config.mjs:11-22`).
- Audio-architecture guard: for `features/**`, `app/**`, `lib/**`, `no-restricted-globals` errors on `Audio`, `AudioContext`, `webkitAudioContext`, `SpeechSynthesisUtterance`, and `no-restricted-properties` on `window.speechSynthesis` — all messages direct callers to `@/shared/audio` (`src/eslint.config.mjs:28-57`; the comment references `docs/adr/001-audio-architecture.md`).
- `max-lines`: warning at 200 lines for all `**/*.{ts,tsx}` (comment states it is a warning because ~46 pre-existing files exceed it; `src/eslint.config.mjs:59-67`).
- `eslint-plugin-storybook` flat/recommended (`src/eslint.config.mjs:68`).

### Prettier (`src/prettier.config.js`)

Observed core options: `semi: true`, `singleQuote: false`, `trailingComma: "all"`, `tabWidth: 4`, `printWidth: 100`, `arrowParens: "always"`, `endOfLine: "auto"` (`src/prettier.config.js:51-59`). Plugins: `@ianvs/prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss` (Tailwind plugin deliberately last; `src/prettier.config.js:60`). The bulk of the file (`src/prettier.config.js:16-49,61-76`) builds a detailed `importOrder`: Node built-ins → `react`/`next` → third-party → `@/` alias + relative imports (depth-ordered `../` patterns up to 16 levels, stylesheets last) → type-only imports mirroring the same tiers.

### Husky + lint-staged

Observed at `src/.husky/pre-commit`: the hook `cd src` then runs three steps — (1) `npx lint-staged` (`src/.husky/pre-commit:12`; config in `src/package.json:20-28`), (2) `prettier --write .` over the whole tree (`src/.husky/pre-commit:16`), (3) `npm run build` as a full production-build safety check (`src/.husky/pre-commit:21`, with a comment noting it can be slow). Husky is installed via the `prepare` script from the repo root (`src/package.json:16`).

---

## 7. Testing setup

Four Vitest configs (three in the app, one in functions) plus Playwright:

| Config | Include / projects | Environment | Invoked by |
|---|---|---|---|
| `src/vitest.config.ts` | Two projects: (1) default node project excluding `*.emu.test.ts`, `firestore-rules.test.ts`, `e2e/**`, `*.browser.test.*`, `functions/**` (`src/vitest.config.ts:30-45`); (2) `storybook` project running story files as browser tests via `@storybook/addon-vitest` plugin, Chromium via Playwright provider, headless (`src/vitest.config.ts:47-75`). | node / real Chromium | `npm test` |
| `src/vitest.browser.config.ts` | `**/*.browser.test.{ts,tsx}` (`src/vitest.browser.config.ts:60`) | Vitest Browser Mode, Chromium (Playwright provider), headless (`src/vitest.browser.config.ts:62-67`). Aliases `@/i18n/navigation` to `i18n/navigation.testshim.ts` (`src/vitest.browser.config.ts:27-30`); defines an empty `process.env` shim; pre-bundles `@base-ui/react/select` and friends via `optimizeDeps` (`src/vitest.browser.config.ts:40-49`). | `npm run test:browser` |
| `src/vitest.emu.config.ts` | `**/*.emu.test.ts` + `firestore-rules.test.ts`; excludes `functions/**` (`src/vitest.emu.config.ts:32,37`) | node, 20s/30s timeouts; injects placeholder `NEXT_PUBLIC_FIREBASE_*` env values and `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` (`src/vitest.emu.config.ts:51-59`); aliases `server-only` to its no-op stub (`src/vitest.emu.config.ts:25-28`). | `npm run test:emu` (wrapped in `firebase emulators:exec --only firestore,auth`) |
| `src/functions/vitest.config.ts` | `src/**/*.emu.test.ts` only — every functions test is emulator-backed (`src/functions/vitest.config.ts:15-21`) | node, 20s/30s timeouts | `npm run test:emu` inside `functions/` (boots firestore,functions,storage emulators; `src/functions/package.json:15`) |

Vitest support files: `src/vitest.shims.d.ts` (observed to exist), `src/vitest.config.ts:19-27` inlines `next-intl` for module resolution.

### Playwright E2E (`src/playwright.config.ts`)

Observed: `testDir: ./e2e`, single `chromium` project (`src/playwright.config.ts:23,32`). Runs against the Firebase Auth+Firestore emulator and a dedicated dev server on port 3100 — never production Firebase (`src/playwright.config.ts:3-13`). Two `webServer` entries: `firebase emulators:start --only firestore,auth --project demo-e2e` and `next dev --port 3100` with fake `NEXT_PUBLIC_FIREBASE_*` env plus `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` (`src/playwright.config.ts:33-60`). E2E helpers: `src/e2e/helpers/emulator-auth.ts` (Admin-SDK custom-token minting against the Auth emulator, per the comment at `src/lib/firebase.ts:52-57`), `src/e2e/helpers/emulator-firestore.ts`, `src/e2e/helpers/sign-in.ts`. Specs: `src/e2e/auth.spec.ts`, `src/e2e/realtime.spec.ts`.

### CI

Observed at `.github/workflows/ci.yml` (224 lines): three jobs — "Build, Lint, Unit Test" (`npm run lint`, `npm run build`, `npm run test`), "Firestore/Auth Rules (Emulator)" (`npm run test:emu`, with a JDK set up for the emulators), and "Cloud Functions (Emulator)" (functions build/lint/test) (`.github/workflows/ci.yml:25,70,102`).

---

## 8. Routing

Observed structure under `src/app/`:

- **Locale segment**: everything lives under `app/[locale]/`. Locales are `en` (default) and `ja` with `localePrefix: "as-needed"` — English at bare paths, Japanese under `/ja` (`src/i18n/routing.ts:9-13`). Messages load per-request in `src/i18n/request.ts:6-14`.
- **Route groups**: `(main)` (standard chrome) and `(immersive)` (full-screen study/game modes) — both under `[locale]`, plus an ungrouped `login/`. Layout files: `app/[locale]/layout.tsx`, `app/[locale]/(main)/layout.tsx`, `app/[locale]/(main)/admin/layout.tsx`, `app/[locale]/(immersive)/layout.tsx` (4 total, observed via `find`).
- **Pages**: 28 `page.tsx` files (observed via `find`). `(main)`: home `/`, `kana` (+ `chart`, `learn`), `flashcard` (+ `create`, `[id]`, `[id]/edit`, `shared/[shareId]`), `notifications`, `profile`, `settings`, and `admin` (+ `analytics`, `content`, `reports`, `settings`, `users`). `(immersive)`: `kana/practice`, `kana/quiz`, `kana/survival`, `flashcard/[id]/{study,match,speed}`, `flashcard/shared/[shareId]/{study,match,speed}`. Plus `login`.
- **Root-level app files**: `global-error.tsx`, `robots.ts`, `sitemap.ts`, `[locale]/not-found.tsx`, `favicon.ico`, `globals.css`, `_components/` (observed listing in §2).
- **Proxy (middleware)**: `src/proxy.ts` exports a `proxy(request)` function — the comment identifies it as the "Next.js 16 `proxy` convention; replaces deprecated `middleware`" (`src/proxy.ts:44`). It: reverse-proxies `/ingest/*` to PostHog hosts for first-party analytics ingestion (`src/proxy.ts:63-72`), bypasses i18n for `/sitemap.xml` and `/robots.txt` (`src/proxy.ts:74-76`), runs next-intl locale routing (`src/proxy.ts:23,78`), and enforces cookie-based auth gating: unauthenticated → redirect to `/login` except for public paths (`/login`, sitemap/robots, and the shared-deck landing pattern `/flashcard/shared/[token]` incl. its opengraph-image; `src/proxy.ts:9-18,83-97`). The matcher excludes `_next/static`, `_next/image`, favicon, and static image extensions (`src/proxy.ts:102-113`).
- **No API routes**: `find src/app -name "route.ts"` returns nothing — there are no `app/api` route handlers. Server mutations go through server actions instead (§9).

---

## 9. Pointers: providers, state, Firebase surface, server actions, features

**Providers/contexts.** The root layout `src/app/[locale]/layout.tsx` wraps the app in `NextIntlClientProvider` → `Providers` (`src/app/[locale]/layout.tsx:57-63`). `src/lib/providers.tsx` is the client shell: it calls `useFirebaseAuth()` and `useActivityTracker()` and nests `LazyMotion` (motion features dynamically imported, `strict`) → `QueryClientProvider` → `AlertProvider` → (`FontSyncer`, `AudioProvider`, `PostHogProvider`) → `AuthGate` (splash screen until Firebase auth resolves, except on public shared-deck routes) → `AdminProvider` → `NotificationsProvider` → children + `CommandPaletteLauncher` (`src/lib/providers.tsx:26-47,78-97`). Feature-level contexts observed: `features/admin/context/`, `features/notifications/context/`; shared `AlertProvider` at `src/shared/providers/AlertProvider.tsx`.

**State management.** Zustand v5: the global store is `src/lib/app-store.ts` (`create` + `persist`; holds `user`, `isAuthReady`, and settings — handwriting font, auto-play, SFX/voice mute and 0–1 volumes; `src/lib/app-store.ts:1-30`). Two feature-local stores: `src/features/kana/store.ts` and `src/features/flashcard/hooks/useMatchGameStore.ts` (the only other files importing `zustand`, observed via grep). React Query (v5): a single `QueryClient` with `staleTime: 30_000`, `refetchOnWindowFocus: false`, `retry: 1` for queries and mutations (`src/lib/providers.tsx:53-67`); usage is comparatively narrow — 9 non-test source files import `@tanstack/react-query` (grep count), alongside the `@tanstack-query-firebase/react` integration package in dependencies (`src/package.json:36`).

**Firebase surface.** `src/firebase.json` declares Firestore rules/indexes, Storage rules, the `functions` codebase (source `functions/`, predeploy `npm run build`), and emulator ports: auth 9099, firestore 8080, functions 5001, storage 9199, UI 4000, `singleProjectMode` (`src/firebase.json:1-36`). `src/lib/firebase.ts` builds the client-SDK singleton from `NEXT_PUBLIC_FIREBASE_*` env (`src/lib/firebase.ts:14-24`), exports `auth`, `db`, `storage`, `googleProvider` (`src/lib/firebase.ts:26-29`), wires emulators only when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"` AND `NODE_ENV !== "production"` (`src/lib/firebase.ts:42-49`), installs a test-only `window.__e2eSignIn` custom-token bridge inside that gate (`src/lib/firebase.ts:58-64`), and exports `firebaseAI` — Firebase AI Logic with the `GoogleAIBackend` (Gemini) (`src/lib/firebase.ts:71`). `src/lib/firebase-admin.ts` initializes the Admin SDK lazily (build runs credential-free), uses a bare projectId when `FIRESTORE_EMULATOR_HOST` is set, service-account cert otherwise, and exposes `adminAuth`, `adminDb`, `adminRemoteConfig` through a `lazyProxy` wrapper (`src/lib/firebase-admin.ts:28-48,60-76`).

**Firestore rules.** `src/firestore.rules` (217 lines) — top-level match blocks under `match /databases/{database}/documents` (`src/firestore.rules:4`):

| Match block | Line |
|---|---|
| `/artifacts/{appId}` | 59 |
| `…/users/{userId}` (with nested `lessons/{lessonId}`, `…/cards/{cardId}/comments/{commentId}`, `cards/{cardId}`, `notifications/{notiId}`, `sharedProgress/{shareId}`, `stats/{gameMode}`) | 61 (65, 81, 95, 107, 126, 135) |
| `…/userProgress/{userId}` (nested `lessons/{lessonId}/cards/{cardId}`, `studyStats/{statId}`) | 146 (149, 153) |
| `…/public/data/game_sessions/{sessionId}` | 165 |
| `…/public/data/{collectionId}/{userId}` (leaderboard_* read/write) | 172 |
| `…/pendingNotifications/{email}/items/{id}` | 179 |
| `/admins/{uid}` | 194 |
| `/system_logs/{logId}` | 199 |
| `/{path=**}/lessons/{lessonId}` (collection-group) | 208 |

`src/storage.rules` (30 lines) has two match blocks: `/users/{userId}/cards/{fileName}` (public read; owner-only write with <2 MB image validation) and `/users/{userId}/avatars/{fileName}` (public read; owner-only write, <1 MB image).

**Server actions / APIs.** Ten files carry the `"use server"` directive (each verified in the file head): `features/admin/actions/admin.actions.ts`, `features/flashcard/actions/access.actions.ts`, `features/flashcard/actions/activity-log.actions.ts`, `features/kana/actions/activity-log.actions.ts`, `features/notifications/actions/activity-log.actions.ts`, `features/notifications/actions/notification.actions.ts`, `features/user/services/auth-logging.service.ts`, `lib/logging/actions.ts`, `lib/logging/activity.ts`, `lib/logging/user-actions.ts` (all under `src/`). An eleventh grep hit is only a comment in `src/app/[locale]/(main)/notifications/_components/NotificationsVirtualList.browser.test.tsx:28`. `next-safe-action` is a dependency with a client at `src/lib/safe-action.ts` (observed to exist). There are no `app/api` route handlers (§8).

**Feature modules** (subdirectories observed by listing; purposes inferred from naming where not sampled deeper):

| Feature | Observed subdirs/files | Purpose (inferred from structure and route usage) |
|---|---|---|
| `admin` | `actions`, `components`, `context`, `domain`, `hooks`, `services`, `types`, `utils` | Admin console (users/content/reports/analytics/settings pages). |
| `ai` | `config.ts`, `hooks`, `prompts`, `schemas`, `services`, `types.ts` | Firebase AI (Gemini) powered generation. |
| `command-palette` | `components`, `data`, `index.ts` | cmdk-based command palette (`CommandPaletteLauncher` mounted in providers). |
| `flashcard` | `actions`, `components`, `dashboard`, `detail`, `domain`, `games`, `hooks`, `loaders`, `services`, `types`, `utils` | Flashcard decks: CRUD, sharing, study/match/speed game modes. |
| `game` | `components`, `domain`, `hooks`, `services` | Shared game infrastructure. |
| `home` | `components`, `hooks`, `index.ts` | Home dashboard. |
| `kana` | `actions`, `chart`, `components`, `data`, `hooks`, `hub`, `learn`, `practice`, `quiz`, `store.ts`, `types` | Kana learning: chart, learn, practice, quiz, survival. |
| `notifications` | `__tests__`, `actions`, `components`, `context`, `domain`, `schema.ts`(+test), `services`, `types` | In-app notification system (paired with the functions digest/fan-out). |
| `user` | `hooks`, `services`, `types` | Auth/user profile (`useFirebaseAuth`, activity tracking). |

---

## 10. Summary counts

All counts computed with `find`/`grep` over `src/` (excluding `node_modules`), 2026-07-18:

| Metric | Count | Method |
|---|---|---|
| Feature modules (`src/features/*`) | 9 | directory listing |
| Page routes (`page.tsx` under `src/app`) | 28 | `find app -name page.tsx` |
| Layout files (`layout.tsx`) | 4 | `find app -name layout.tsx` |
| Component `.tsx` files, `src/features/` (excl. tests/stories) | 151 | `find features -name "*.tsx"` minus `*.test.tsx`/`*.stories.tsx` |
| Component `.tsx` files, `src/shared/` (excl. tests/stories) | 23 | same pattern over `shared` |
| Component `.tsx` files, `src/app/` (excl. `page.tsx`/`layout.tsx`/tests/stories) | 18 | same pattern over `app` |
| Hooks (`use*.ts`/`use*.tsx`, excl. tests) | 67 | `find features shared lib app -name "use*"` |
| Service files (`*.service.ts`, excl. tests) | 21 | `find features shared lib -name "*.service.ts"` |
| Node-env unit test files (`*.test.ts[x]`, excl. `.browser`/`.emu`, excl. rules test) | 22 | `find` + filters (listed individually during discovery) |
| Firestore security-rules test | 1 | `src/firestore-rules.test.ts` (runs under the emulator config) |
| Browser-mode component tests (`*.browser.test.*`) | 14 | `find` |
| Emulator integration tests (`*.emu.test.ts`) | 6 (4 app + 2 functions) | `find` (app: admin content service, notification actions, user service, logging user-actions; functions: `digest`, `fanout`) |
| Playwright E2E specs | 2 | `src/e2e/*.spec.ts` |
| Storybook stories | 1 | `src/shared/components/ui/Badge.stories.tsx` |
| Server-action files (`"use server"` directive) | 10 | grep + per-file head verification (§9) |
| `app/api` route handlers | 0 | `find app -name route.ts` |
| i18n locales / message catalogs | 2 (`en`, `ja`) | `src/i18n/routing.ts:10`, `src/messages/` |

---

## 11. Uncertainties

- **Bundler**: no explicit Turbopack/webpack configuration exists; "builds with Turbopack" is inferred from Next 16 defaults and in-code comments (`src/lib/providers.tsx:69-77`), not from config.
- **`src/functions/lib/`**: inferred to be `tsc` output (from `"main": "lib/index.js"` + `"build": "tsc"`); not independently verified file-by-file.
- **`src/.vitest-attachments/`**: purpose inferred (browser-test screenshot attachments) from hash-named `.png` contents; no config reference to it was located during this pass.
- **Prior-analysis artifacts**: listed as untracked in the session's git status snapshot but absent from disk when checked; the deletion timing is inferred, not observed.
- **Feature purposes**: the per-feature "purpose" column in §9 is inferred from directory/file naming and route wiring; deeper feature-by-feature verification belongs to the sibling discovery documents.
