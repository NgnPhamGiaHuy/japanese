# 14 — Evidence Appendix

Raw, reproducible evidence backing the discovery corpus. Every block is a command + its verbatim output, run from the repo root `/Users/yuh.nguyenpham/GitHub/japanese` on 2026-07-18 at commit `a0bbbc4`. Exclusions applied everywhere: `node_modules`, `.next`, `coverage`, and repo-root prior-analysis artifacts.

---

## 1. Git repository facts

```sh
git rev-parse HEAD
git branch --show-current
git rev-list --count HEAD
git log --reverse --format=%ad --date=iso | head -1   # first commit
git log -1 --format=%ad --date=iso                     # latest commit
```

```text
a0bbbc422a9fbba4835265a2f7326470bfe0fc0b
main
138
2026-04-12 15:57:29 +0700
2026-07-18 22:09:56 +0700
```

| Fact | Value |
| --- | --- |
| HEAD | `a0bbbc422a9fbba4835265a2f7326470bfe0fc0b` |
| Branch | `main` |
| Total commits | 138 |
| First commit date | 2026-04-12 15:57:29 +0700 |
| Latest commit date | 2026-07-18 22:09:56 +0700 |

---

## 2. Directory tree of `src/` to depth 3

```sh
find src -type d \( -name node_modules -o -name .next -o -name coverage -o -name __screenshots__ \) -prune \
  -o -type d -print | awk -F/ 'NF<=4' | sort
```

```text
src
src/.husky
src/.husky/_
src/.storybook
src/.vitest-attachments
src/app
src/app/[locale]
src/app/[locale]/(immersive)
src/app/[locale]/(main)
src/app/[locale]/login
src/app/_components
src/e2e
src/e2e/helpers
src/features
src/features/admin
src/features/admin/actions
src/features/admin/components
src/features/admin/context
src/features/admin/domain
src/features/admin/hooks
src/features/admin/services
src/features/admin/types
src/features/admin/utils
src/features/ai
src/features/ai/hooks
src/features/ai/prompts
src/features/ai/schemas
src/features/ai/services
src/features/command-palette
src/features/command-palette/components
src/features/command-palette/data
src/features/flashcard
src/features/flashcard/actions
src/features/flashcard/components
src/features/flashcard/dashboard
src/features/flashcard/detail
src/features/flashcard/domain
src/features/flashcard/games
src/features/flashcard/hooks
src/features/flashcard/loaders
src/features/flashcard/services
src/features/flashcard/types
src/features/flashcard/utils
src/features/game
src/features/game/components
src/features/game/domain
src/features/game/hooks
src/features/game/services
src/features/home
src/features/home/components
src/features/home/hooks
src/features/kana
src/features/kana/actions
src/features/kana/chart
src/features/kana/components
src/features/kana/data
src/features/kana/hooks
src/features/kana/hub
src/features/kana/learn
src/features/kana/practice
src/features/kana/quiz
src/features/kana/types
src/features/notifications
src/features/notifications/__tests__
src/features/notifications/actions
src/features/notifications/components
src/features/notifications/context
src/features/notifications/domain
src/features/notifications/services
src/features/notifications/types
src/features/user
src/features/user/hooks
src/features/user/services
src/features/user/types
src/functions
src/functions/lib
src/functions/src
src/i18n
src/lib
src/lib/logging
src/messages
src/public
src/scripts
src/shared
src/shared/audio
src/shared/audio/voice
src/shared/components
src/shared/components/layout
src/shared/components/ui
src/shared/constants
src/shared/hooks
src/shared/providers
src/shared/schemas
src/shared/utils
```

Note: `src/functions/lib/` contains compiled JS output; `src/scripts/` contains one `.mjs` file (`backfill-notifications.mjs`); `src/messages/` contains `en.json` and `ja.json`.

---

## 3. `src/package.json` — scripts and dependency blocks (verbatim)

```sh
python3 -c "import json; d=json.load(open('src/package.json')); import sys; json.dump({k:d[k] for k in ('scripts','dependencies','devDependencies')}, sys.stdout, indent=2)"
```

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "test:browser": "vitest run --config vitest.browser.config.ts",
    "test:emu": "firebase emulators:exec --only firestore,auth \"vitest run --config vitest.emu.config.ts\"",
    "test:functions": "npm --prefix functions run test:emu",
    "emulators:start": "firebase emulators:start --only firestore,auth",
    "emulators:start:all": "firebase emulators:start --only firestore,auth,functions,storage",
    "start": "next start",
    "lint": "eslint",
    "prepare": "cd .. && husky src/.husky",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "@base-ui/react": "^1.6.0",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^5.4.0",
    "@sentry/nextjs": "^10.65.0",
    "@tanstack-query-firebase/react": "^2.1.1",
    "@tanstack/react-query": "^5.101.2",
    "@tanstack/react-table": "^8.21.3",
    "@tanstack/react-virtual": "^3.14.6",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "firebase": "^12.12.0",
    "firebase-admin": "^13.8.0",
    "fractional-indexing": "^4.0.0",
    "lucide-react": "^1.8.0",
    "motion": "^12.42.2",
    "next": "16.2.3",
    "next-intl": "^4.13.2",
    "next-safe-action": "^8.5.5",
    "posthog-js": "^1.402.3",
    "prettier": "^3.8.2",
    "react": "19.2.4",
    "react-confetti": "^6.4.0",
    "react-day-picker": "^10.0.1",
    "react-dom": "19.2.4",
    "react-dropzone": "^17.0.0",
    "react-hook-form": "^7.81.0",
    "recharts": "^3.9.2",
    "server-only": "^0.0.1",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "zod": "^4.3.6",
    "zustand": "^5.0.14"
  },
  "devDependencies": {
    "@chromatic-com/storybook": "^5.2.1",
    "@firebase/rules-unit-testing": "^5.0.1",
    "@ianvs/prettier-plugin-sort-imports": "^4.4.1",
    "@playwright/test": "^1.61.1",
    "@storybook/addon-a11y": "^10.5.0",
    "@storybook/addon-docs": "^10.5.0",
    "@storybook/addon-mcp": "^0.7.0",
    "@storybook/addon-vitest": "^10.5.0",
    "@storybook/nextjs-vite": "^10.5.0",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^6.0.3",
    "@vitest/browser": "^4.1.10",
    "@vitest/browser-playwright": "^4.1.10",
    "@vitest/coverage-v8": "^4.1.10",
    "eslint": "^9",
    "eslint-config-next": "16.2.3",
    "eslint-plugin-storybook": "^10.5.0",
    "firebase-tools": "^15.24.0",
    "husky": "^9.1.7",
    "lint-staged": "^16.4.0",
    "msw": "^2.15.0",
    "playwright": "^1.61.1",
    "prettier-plugin-tailwindcss": "^0.6.11",
    "react-scan": "^0.5.7",
    "schema-dts": "^2.0.0",
    "storybook": "^10.5.0",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vite": "^8.1.4",
    "vitest": "^4.1.8",
    "vitest-browser-react": "^2.2.0"
  }
}
```

Counts: 13 scripts, 35 `dependencies`, 34 `devDependencies`.

### 3.1 `src/functions/package.json` (verbatim, full file)

```sh
cat src/functions/package.json
```

```json
{
  "name": "kana-nihongo-master-functions",
  "version": "1.0.0",
  "private": true,
  "description": "Cloud Functions 2nd gen: notification digest scheduler + Cloud Tasks fan-out (E14-T2).",
  "engines": {
    "node": "20"
  },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "lint": "eslint",
    "test": "vitest run --config vitest.config.ts",
    "test:emu": "firebase emulators:exec --config ../firebase.json --project demo-kana-nihongo --only firestore,functions,storage \"vitest run --config vitest.config.ts\""
  },
  "dependencies": {
    "firebase-admin": "^13.8.0",
    "firebase-functions": "^6.5.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "eslint": "^9.39.1",
    "firebase-tools": "^15.24.0",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.46.4",
    "vitest": "^3.2.4"
  }
}
```

---

## 4. `src/firebase.json` (verbatim)

```sh
cat src/firebase.json
```

```json
{
    "firestore": {
        "rules": "firestore.rules",
        "indexes": "firestore.indexes.json"
    },
    "storage": {
        "rules": "storage.rules"
    },
    "functions": [
        {
            "source": "functions",
            "codebase": "default",
            "ignore": ["node_modules", ".git", "*.emu.test.ts", "vitest.config.ts"],
            "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
        }
    ],
    "emulators": {
        "auth": {
            "port": 9099
        },
        "firestore": {
            "port": 8080
        },
        "functions": {
            "port": 5001
        },
        "storage": {
            "port": 9199
        },
        "ui": {
            "enabled": true,
            "port": 4000
        },
        "singleProjectMode": true
    }
}
```

### 4.1 `src/firestore.rules` — match-block skeleton (paths + allow lines only)

File is 217 lines total (`wc -l src/firestore.rules`); `src/storage.rules` is 30 lines. Skeleton extracted with:

```sh
grep -nE 'match |allow ' src/firestore.rules
```

```text
4:  match /databases/{database}/documents {
59:    match /artifacts/{appId} {
61:      match /users/{userId} {
63:        allow read, write: if isOwner(userId);
65:        match /lessons/{lessonId} {
68:          allow read: if isPublicLesson(resource.data)
72:          allow create: if isOwner(userId);
75:          allow update: if isOwner(userId)
78:          allow delete: if isOwner(userId);
81:          match /cards/{cardId}/comments/{commentId} {
82:            allow read: if isOwner(userId)
86:            allow create: if isOwner(userId)
89:            allow update, delete: if isOwner(userId)
95:        match /cards/{cardId} {
98:          allow read: if isOwner(userId)
103:          allow write: if isOwner(userId)
107:        match /notifications/{notiId} {
108:          allow read: if isOwner(userId);
117:          allow create: if isOwner(userId);
121:          allow update: if isOwner(userId) && notificationImmutableFieldsUnchanged();
126:        match /sharedProgress/{shareId} {
128:          allow read, write: if isOwner(userId);
135:        match /stats/{gameMode} {
136:          allow read, write: if isOwner(userId);
146:      match /userProgress/{userId} {
147:        allow read, write: if isOwner(userId);
149:        match /lessons/{lessonId}/cards/{cardId} {
150:          allow read, write: if isOwner(userId);
153:        match /studyStats/{statId} {
154:          allow read, write: if isOwner(userId);
165:      match /public/data/game_sessions/{sessionId} {
166:        allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
167:        allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
168:        allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
169:        allow delete: if false;
172:      match /public/data/{collectionId}/{userId} {
173:        allow read: if collectionId.matches('leaderboard_.*');
174:        allow write: if collectionId.matches('leaderboard_.*') && isOwner(userId);
179:      match /pendingNotifications/{email}/items/{id} {
181:        allow read, delete: if isSignedIn() && request.auth.token.email.lower() == email.lower();
185:        allow create: if isSignedIn()
194:    match /admins/{uid} {
195:      allow read: if isSignedIn() && request.auth.uid == uid;
196:      allow write: if false;
199:    match /system_logs/{logId} {
200:      allow read: if isSystemAdmin();
201:      allow create, update, delete: if false;
208:    match /{path=**}/lessons/{lessonId} {
209:      allow read: if resource.data.isPublic == true
```

(Multi-line `allow` conditions continue past the lines shown; only lines containing `match ` or `allow ` are listed. Helper functions `isOwner`, `isSignedIn`, `isPublicLesson`, `isSystemAdmin`, `notificationImmutableFieldsUnchanged` are defined in the elided lines.)

---

## 5. TypeScript path aliases (verbatim)

`src/tsconfig.json`, `compilerOptions.paths` (lines 21-23) plus include/exclude for context:

```json
        "paths": {
            "@/*": ["./*"]
        }
```

```json
    "include": [
        "next-env.d.ts",
        "**/*.ts",
        "**/*.tsx",
        ".next/types/**/*.ts",
        ".next/dev/types/**/*.ts",
        "**/*.mts"
    ],
    "exclude": [
        "node_modules",
        "**/*.emu.test.ts",
        "firestore-rules.test.ts",
        "**/__tests__/harness.ts",
        "functions/**"
    ]
```

`src/functions/tsconfig.json` defines no `paths` aliases (`grep -n 'paths\|baseUrl' src/functions/tsconfig.json` → no matches).

Vitest mirrors the alias in `src/vitest.config.ts:13-17`:

```ts
    resolve: {
        alias: {
            "@": fileURLToPath(new URL(".", import.meta.url)),
        },
    },
```

---

## 6. Vitest config include patterns (verbatim)

### 6.1 `src/vitest.config.ts` (unit + storybook projects)

No explicit `include` — the unit project uses Vitest's default include pattern with explicit excludes (lines 34-44):

```ts
                    exclude: [
                        "**/node_modules/**",
                        "**/.next/**",
                        "**/*.emu.test.ts",
                        "**/firestore-rules.test.ts",
                        "**/e2e/**",
                        "**/*.browser.test.{ts,tsx}",
                        // functions/ is a separate Node package with its own
                        // vitest.config.ts — tested independently.
                        "**/functions/**",
                    ],
```

A second project in the same file is the Storybook browser project (`name: "storybook"`, chromium via `@vitest/browser-playwright`).

### 6.2 `src/vitest.browser.config.ts` (lines 60-61)

```ts
        include: ["**/*.browser.test.{ts,tsx}"],
        exclude: ["**/node_modules/**", "**/.next/**"],
```

### 6.3 `src/vitest.emu.config.ts` (lines 32, 37)

```ts
        include: ["**/*.emu.test.ts", "**/firestore-rules.test.ts"],
        exclude: ["**/node_modules/**", "**/functions/**"],
```

### 6.4 `src/functions/vitest.config.ts` (line 18)

```ts
        include: ["src/**/*.emu.test.ts"],
```

---

## 7. Key counting commands — raw outputs

### 7.1 Total TS/TSX files and lines in `src/`

```sh
find src -type d \( -name node_modules -o -name .next -o -name coverage \) -prune \
  -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print | wc -l
# → 586
find src -type d \( -name node_modules -o -name .next -o -name coverage \) -prune \
  -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print | xargs wc -l | tail -1
# → 49883 total
```

### 7.2 Files by first path segment

```sh
find src -type d \( -name node_modules -o -name .next -o -name coverage \) -prune \
  -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print | sed 's|^src/||' | awk -F/ '{print $1}' | sort | uniq -c | sort -rn
```

```text
 404 features
  77 shared
  53 app
  23 lib
   7 functions
   5 e2e
   4 i18n
   2 .storybook
   1 vitest.shims.d.ts
   1 vitest.emu.config.ts
   1 vitest.config.ts
   1 vitest.browser.config.ts
   1 proxy.ts
   1 playwright.config.ts
   1 next.config.ts
   1 next-env.d.ts
   1 instrumentation.ts
   1 instrumentation-client.ts
   1 firestore-rules.test.ts
```

### 7.3 App-router structure counts

```sh
ls -d src/features/*/ | wc -l          # → 9
find src/app -name 'page.tsx' | wc -l   # → 28
find src/app -name 'layout.tsx' | wc -l # → 4
find src/app -name 'route.ts' | wc -l   # → 0
```

Feature module list (`ls src/features`): `admin`, `ai`, `command-palette`, `flashcard`, `game`, `home`, `kana`, `notifications`, `user`.

### 7.4 Client/server directive counts

```sh
grep -rl '"use client"' src --include='*.tsx' --include='*.ts' --exclude-dir=node_modules | wc -l
# → 244
grep -rl '"use server"' src --include='*.ts' --include='*.tsx' --exclude-dir=node_modules | wc -l
# → 11   (10 source files + 1 browser test containing the string; list in 11-Code-Metrics.md §4.1)
grep -rl "'use server'" src --include='*.ts' --include='*.tsx' --exclude-dir=node_modules | wc -l
# → 0
```

### 7.5 Hook / service / context counts

```sh
find src -type d -name node_modules -prune -o -type f \( -name 'use*.ts' -o -name 'use*.tsx' \) -print | grep -v '\.test\.' | wc -l
# → 67
find src -type d -name node_modules -prune -o -type f -name '*.service.ts' -print | grep -v '\.test\.' | wc -l
# → 21
find src -type d -name node_modules -prune -o -type f -path '*/services/*' -name '*.ts' -print | grep -v '\.test\.' | wc -l
# → 47
grep -rl 'createContext' src --include='*.ts' --include='*.tsx' --exclude-dir=node_modules
# → src/features/admin/context/AdminContext.tsx
#   src/features/notifications/context/NotificationsContext.tsx
#   src/shared/providers/AlertProvider.tsx
```

### 7.6 Test-file census

```sh
find src -type d -name node_modules -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | wc -l
# → 41
find src -name '*.browser.test.*' -type f -not -path '*/node_modules/*' | wc -l
# → 12
find src -name '*.emu.test.ts' -not -path '*/node_modules/*'
```

```text
src/features/notifications/actions/notification.actions.emu.test.ts
src/features/user/services/user.service.emu.test.ts
src/features/admin/services/content.service.emu.test.ts
src/functions/src/fanout.emu.test.ts
src/functions/src/digest.emu.test.ts
src/lib/logging/user-actions.emu.test.ts
```

Browser test file list (the 12 matches of `**/*.browser.test.{ts,tsx}`):

```text
src/features/flashcard/components/LessonBuilderMeta.browser.test.tsx
src/features/flashcard/components/ShareCollaboratorsPanel.browser.test.tsx
src/features/admin/components/content/DeckDetailsPanel.browser.test.tsx
src/features/admin/components/shared/DataTable.browser.test.tsx
src/features/admin/components/reports/LogsVirtualList.browser.test.tsx
src/shared/providers/AlertProvider.browser.test.tsx
src/app/[locale]/(main)/notifications/_components/NotificationsVirtualList.browser.test.tsx
src/shared/components/ui/Modal.browser.test.tsx
src/shared/components/ui/SettingsMenu.browser.test.tsx
src/shared/components/ui/DatePicker.browser.test.tsx
src/shared/components/ui/ConfirmModal.browser.test.tsx
src/shared/components/ui/Select.browser.test.tsx
```

Rules test: `src/firestore-rules.test.ts` (415 lines). Remainder (41 − 12 browser − 6 emu − 1 rules) = 22 unit-config test files.

Playwright e2e (`find src/e2e -type f`):

```text
src/e2e/realtime.spec.ts
src/e2e/auth.spec.ts
src/e2e/helpers/sign-in.ts
src/e2e/helpers/emulator-auth.ts
src/e2e/helpers/emulator-firestore.ts
```

### 7.7 Dependency counts

```sh
python3 -c "
import json
for p in ['src/package.json','src/functions/package.json']:
    d=json.load(open(p))
    print(p, 'prod=', len(d.get('dependencies',{})), 'dev=', len(d.get('devDependencies',{})))
"
```

```text
src/package.json prod= 35 dev= 34
src/functions/package.json prod= 2 dev= 6
```

### 7.8 Messages JSON

```sh
wc -l src/messages/*.json
```

```text
     909 src/messages/en.json
     930 src/messages/ja.json
    1839 total
```

### 7.9 Analysis-tool availability check

```sh
ls src/node_modules/.bin | grep -iE '^(madge|cloc|depcruise|dependency-cruiser|sloc|tokei)'
# → (no matches, exit 1)
which cloc tokei madge
# → cloc not found / tokei not found / madge not found
```

Consequently: circular-dependency analysis and code/comment/blank LOC splits are **not measured — tool not present** (no packages were installed during discovery).
