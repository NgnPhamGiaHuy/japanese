# 11 — Code Metrics

Objective measurements only. Every number lists the exact command that produced it so it can be re-run. No interpretation is attached to any figure.

**Measurement context**

| Fact | Value |
| --- | --- |
| Measured at commit | `a0bbbc422a9fbba4835265a2f7326470bfe0fc0b` (branch `main`) |
| Measurement date | 2026-07-18 |
| Working directory for all commands | `/Users/yuh.nguyenpham/GitHub/japanese` (repo root) |
| Exclusions applied to all metrics | `node_modules`, `.next`, `coverage`, and the repo-root prior-analysis artifacts (`PROJECT_CONTEXT.md`, `architecture-audit/`, `codebase-cleanup/`, `engineering-tasks/`, `implementation-wave-1/`, `requirements-consolidation/`, `repomix-output.xml`, `project-discovery/`) |
| Line-count method | `wc -l` = raw physical lines (includes blank lines and comments). `cloc` is not installed (see §12), so no code/comment/blank split is available. |

---

## 1. Total lines of code — `src/` TypeScript/TSX

Command:

```sh
find src -type d \( -name node_modules -o -name .next -o -name coverage \) -prune \
  -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print | xargs wc -l | tail -1
```

| Metric | Value |
| --- | --- |
| Total `.ts`/`.tsx` files | 586 |
| Total physical lines | 49,883 |

### 1.1 Breakdown by top-level directory

Command (per directory `$d`):

```sh
find src/$d -type d \( -name node_modules -o -name .next -o -name coverage \) -prune \
  -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print | xargs wc -l | tail -1
```

| Directory | Files | Lines |
| --- | ---: | ---: |
| `src/features/` | 404 | 36,842 |
| `src/shared/` | 77 | 6,346 |
| `src/app/` | 53 | 3,566 |
| `src/lib/` | 23 | 1,305 |
| `src/functions/` (TS sources only; compiled `lib/` is `.js`) | 7 | 599 |
| `src/e2e/` | 5 | 246 |
| `src/i18n/` | 4 | 50 |
| `src/.storybook/` | 2 | (included in total) |
| `src/` root-level files (configs, `proxy.ts`, `instrumentation*.ts`, `firestore-rules.test.ts`, d.ts shims) | 11 | 882 |

File-count check: 404 + 77 + 53 + 23 + 7 + 5 + 4 + 2 + 11 = 586. Verified with:

```sh
find src -type d \( -name node_modules -o -name .next -o -name coverage \) -prune \
  -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print | sed 's|^src/||' | awk -F/ '{print $1}' | sort | uniq -c | sort -rn
```

### 1.2 `src/messages/` JSON (translations)

Command: `wc -l src/messages/*.json`

| File | Lines |
| --- | ---: |
| `src/messages/en.json` | 909 |
| `src/messages/ja.json` | 930 |
| **Total (2 files)** | **1,839** |

### 1.3 Per-feature-module breakdown (`src/features/*`)

Command (per module `$m`):

```sh
find src/features/$m -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
find src/features/$m -type f \( -name '*.ts' -o -name '*.tsx' \) -exec cat {} + | wc -l
```

| Feature module | Files | Lines |
| --- | ---: | ---: |
| `flashcard` | 146 | 16,940 |
| `admin` | 109 | 8,781 |
| `kana` | 55 | 4,176 |
| `notifications` | 33 | 3,211 |
| `game` | 20 | 1,453 |
| `ai` | 22 | 1,022 |
| `user` | 12 | 700 |
| `home` | 3 | 343 |
| `command-palette` | 4 | 216 |

---

## 2. Top 25 largest files by line count

Command:

```sh
find src -type d \( -name node_modules -o -name .next -o -name coverage \) -prune \
  -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print | xargs wc -l | sort -rn | grep -v ' total$' | head -25
```

| # | Path | Lines | Kind |
| ---: | --- | ---: | --- |
| 1 | `src/features/flashcard/components/ShareModal.tsx` | 436 | component |
| 2 | `src/firestore-rules.test.ts` | 415 | test (rules) |
| 3 | `src/features/flashcard/components/FlashcardPractice.tsx` | 396 | component |
| 4 | `src/features/admin/actions/admin.actions.ts` | 380 | server actions |
| 5 | `src/features/admin/services/analytics-drilldowns.ts` | 379 | service |
| 6 | `src/features/kana/hooks/useDropMode.ts` | 367 | hook |
| 7 | `src/features/flashcard/services/progress.service.ts` | 335 | service |
| 8 | `src/features/flashcard/games/speed/engine/core/GameEngine.ts` | 334 | domain/engine |
| 9 | `src/shared/audio/voice/googleTranslateTts.ts` | 329 | shared module |
| 10 | `src/features/flashcard/games/match/hooks/useMatchModeSession.ts` | 325 | hook |
| 11 | `src/shared/audio/voice/googleTranslateTts.test.ts` | 321 | test (unit) |
| 12 | `src/features/kana/hooks/useKanaQuizSession.ts` | 319 | hook |
| 13 | `src/features/flashcard/components/FlashcardMistakeReview.tsx` | 318 | component |
| 14 | `src/features/flashcard/components/AIBulkPanel.tsx` | 310 | component |
| 15 | `src/features/flashcard/services/comment.service.ts` | 302 | service |
| 16 | `src/app/[locale]/(main)/settings/SettingsPageClient.tsx` | 302 | page client component |
| 17 | `src/features/kana/hooks/useSurvivalGame.ts` | 299 | hook |
| 18 | `src/features/flashcard/dashboard/components/DeckCard.tsx` | 286 | component |
| 19 | `src/features/flashcard/games/speed/components/SpeedPlaying.tsx` | 285 | component |
| 20 | `src/features/flashcard/types/flashcard.types.ts` | 276 | types |
| 21 | `src/features/flashcard/hooks/useLessons.ts` | 272 | hook |
| 22 | `src/features/flashcard/hooks/useLessonBuilder.ts` | 271 | hook |
| 23 | `src/app/[locale]/(main)/flashcard/shared/[shareId]/SharedLessonPageClient.tsx` | 270 | page client component |
| 24 | `src/features/kana/hub/components/KanaHub.tsx` | 264 | component |
| 25 | `src/features/flashcard/components/CommentItem.tsx` | 264 | component |

(Next after the cut: `src/shared/components/ui/Button.tsx` — 256 lines.)

---

## 3. Largest files by category (top 10 each)

### 3.1 Components (`*.tsx` under any `components/` directory)

Command:

```sh
find src -type d -name node_modules -prune -o -type f -name '*.tsx' -path '*/components/*' -print \
  | xargs wc -l | sort -rn | grep -v ' total$' | head -10
```

| # | Component | Lines |
| ---: | --- | ---: |
| 1 | `src/features/flashcard/components/ShareModal.tsx` | 436 |
| 2 | `src/features/flashcard/components/FlashcardPractice.tsx` | 396 |
| 3 | `src/features/flashcard/components/FlashcardMistakeReview.tsx` | 318 |
| 4 | `src/features/flashcard/components/AIBulkPanel.tsx` | 310 |
| 5 | `src/features/flashcard/dashboard/components/DeckCard.tsx` | 286 |
| 6 | `src/features/flashcard/games/speed/components/SpeedPlaying.tsx` | 285 |
| 7 | `src/features/kana/hub/components/KanaHub.tsx` | 264 |
| 8 | `src/features/flashcard/components/CommentItem.tsx` | 264 |
| 9 | `src/shared/components/ui/Button.tsx` | 256 |
| 10 | `src/features/flashcard/components/ImportPreview.tsx` | 254 |

### 3.2 Hooks (`use*.ts` / `use*.tsx`, excluding `*.test.*`)

Command:

```sh
find src -type d -name node_modules -prune -o -type f \( -name 'use*.ts' -o -name 'use*.tsx' \) -print \
  | grep -v '\.test\.' | xargs wc -l | sort -rn | grep -v ' total$' | head -10
```

| # | Hook | Lines |
| ---: | --- | ---: |
| 1 | `src/features/kana/hooks/useDropMode.ts` | 367 |
| 2 | `src/features/flashcard/games/match/hooks/useMatchModeSession.ts` | 325 |
| 3 | `src/features/kana/hooks/useKanaQuizSession.ts` | 319 |
| 4 | `src/features/kana/hooks/useSurvivalGame.ts` | 299 |
| 5 | `src/features/flashcard/hooks/useLessons.ts` | 272 |
| 6 | `src/features/flashcard/hooks/useLessonBuilder.ts` | 271 |
| 7 | `src/features/flashcard/games/match/hooks/useMatchScoring.ts` | 247 |
| 8 | `src/features/flashcard/hooks/useCommentPanel.ts` | 225 |
| 9 | `src/features/flashcard/games/speed/hooks/useSpeedModeSession.ts` | 217 |
| 10 | `src/features/flashcard/games/study/hooks/useStudySession.ts` | 161 |

### 3.3 Services (`*.service.ts` or any `.ts` under a `services/` directory, excluding `*.test.*`)

Command:

```sh
find src -type d -name node_modules -prune -o -type f \( -name '*.service.ts' -o -path '*/services/*.ts' \) -print \
  | grep -v '\.test\.' | sort -u | xargs wc -l | sort -rn | grep -v ' total$' | head -10
```

| # | Service | Lines |
| ---: | --- | ---: |
| 1 | `src/features/admin/services/analytics-drilldowns.ts` | 379 |
| 2 | `src/features/flashcard/services/progress.service.ts` | 335 |
| 3 | `src/features/flashcard/services/comment.service.ts` | 302 |
| 4 | `src/features/flashcard/services/shared.service.ts` | 251 |
| 5 | `src/features/admin/services/log.service.ts` | 196 |
| 6 | `src/features/flashcard/services/card.service.ts` | 190 |
| 7 | `src/features/notifications/services/notification.service.ts` | 172 |
| 8 | `src/features/flashcard/services/access.service.ts` | 159 |
| 9 | `src/features/admin/services/analytics-content.ts` | 157 |
| 10 | `src/features/flashcard/services/lesson-save.ts` | 155 |

---

## 4. Structural counts

| Metric | Count | Command |
| --- | ---: | --- |
| Feature modules (`src/features/*/`) | 9 | `ls -d src/features/*/ \| wc -l` |
| `page.tsx` route files | 28 | `find src/app -name 'page.tsx' \| wc -l` |
| `layout.tsx` files | 4 | `find src/app -name 'layout.tsx' \| wc -l` |
| `route.ts` API route files | 0 | `find src/app -name 'route.ts' \| wc -l` |
| Custom hooks (`use*.ts`/`use*.tsx`, excl. `*.test.*`) | 67 | `find src -type d -name node_modules -prune -o -type f \( -name 'use*.ts' -o -name 'use*.tsx' \) -print \| grep -v '\.test\.' \| wc -l` |
| Hook files inside `hooks/` directories (excl. tests and `index.ts`) | 61 | `find src -type d -name node_modules -prune -o -type f -path '*/hooks/*' \( -name '*.ts' -o -name '*.tsx' \) -print \| grep -v '\.test\.' \| grep -v 'index.ts' \| wc -l` |
| `*.service.ts` files (excl. tests) | 21 | `find src -type d -name node_modules -prune -o -type f -name '*.service.ts' -print \| grep -v '\.test\.' \| wc -l` |
| `.ts` files under `services/` directories (excl. tests) | 47 | `find src -type d -name node_modules -prune -o -type f -path '*/services/*' -name '*.ts' -print \| grep -v '\.test\.' \| wc -l` |
| Files containing `"use server"` | 11 | `grep -rl '"use server"' src --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \| wc -l` |
| Files containing `"use client"` | 244 | `grep -rl '"use client"' src --include='*.tsx' --include='*.ts' --exclude-dir=node_modules \| wc -l` |
| Total `.ts`/`.tsx` files (denominator, all) | 586 | see §1 |
| Total `.ts`/`.tsx` files excluding `*.test.*` | 551 | same `find` piped through `grep -v '\.test\.'` |
| Files calling `createContext` | 3 (2 occurrences each = 6 lines) | `grep -rl 'createContext' src --include='*.ts' --include='*.tsx' --exclude-dir=node_modules` / `grep -rc ...` |
| `index.ts` barrel files | 62 | `find src -type d -name node_modules -prune -o -type f -name 'index.ts' -print \| wc -l` |
| Files importing `"server-only"` | 11 | `grep -rl '"server-only"' src --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \| wc -l` |
| Utility files (`*/utils/*` or `*utils.ts`, excl. tests) | 25 | `find src -type d -name node_modules -prune -o -type f \( -path '*/utils/*' -o -name '*.utils.ts' -o -name '*utils.ts' \) \( -name '*.ts' -o -name '*.tsx' \) -print \| grep -v '\.test\.' \| sort -u \| wc -l` |
| Type files (`*.types.ts`, `*/types/*.ts`, `*.d.ts`) | 22 | `find src -type d -name node_modules -prune -o -type f \( -name '*.types.ts' -o -path '*/types/*.ts' -o -name '*.d.ts' \) -print \| sort -u \| wc -l` |
| Files with `schema` in the name (incl. tests) | 13 (8 non-test) | `find src -type d -name node_modules -prune -o -type f -name '*schema*' -print` |
| Files importing `zod` | 10 | `grep -rl 'from "zod"' src --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \| wc -l` |
| Story files (`*.stories.*`) | 1 (`src/shared/components/ui/Badge.stories.tsx`) | `find src -type d -name node_modules -prune -o -type f -name '*.stories.*' -print` |

### 4.1 `"use server"` file list (raw grep output)

`src/features/admin/actions/admin.actions.ts`, `src/features/flashcard/actions/activity-log.actions.ts`, `src/features/flashcard/actions/access.actions.ts`, `src/features/kana/actions/activity-log.actions.ts`, `src/features/notifications/actions/activity-log.actions.ts`, `src/features/notifications/actions/notification.actions.ts`, `src/features/user/services/auth-logging.service.ts`, `src/lib/logging/activity.ts`, `src/lib/logging/actions.ts`, `src/lib/logging/user-actions.ts`, and `src/app/[locale]/(main)/notifications/_components/NotificationsVirtualList.browser.test.tsx` (the string also appears in this test file; 10 of the 11 matches are non-test source files). The single-quoted variant `'use server'` matches 0 files.

### 4.2 `createContext` files

- `src/features/admin/context/AdminContext.tsx` (2 occurrences)
- `src/features/notifications/context/NotificationsContext.tsx` (2 occurrences)
- `src/shared/providers/AlertProvider.tsx` (2 occurrences)

### 4.3 Providers in the composition root (`src/lib/providers.tsx`)

Method: read `src/lib/providers.tsx` and count JSX elements wrapped around `{children}` in `Providers`, plus sibling always-mounted components. Raw list, outermost first:

| Position | Element | Wraps children? |
| ---: | --- | --- |
| 1 | `LazyMotion` (motion/react, dynamic `motionFeatures` import, `strict`) | yes |
| 2 | `QueryClientProvider` (@tanstack/react-query) | yes |
| 3 | `AlertProvider` (`src/shared/providers`) | yes |
| 4 | `FontSyncer` (`src/lib/FontSyncer`) | no (sibling) |
| 5 | `AudioProvider` (`src/lib/AudioProvider`) | no (sibling) |
| 6 | `PostHogProvider` (`src/lib/PostHogProvider`) | no (sibling) |
| 7 | `AuthGate` (defined in the same file) | yes |
| 8 | `AdminProvider` (`src/features/admin/context/AdminContext`) | yes |
| 9 | `NotificationsProvider` (`src/features/notifications/context/NotificationsContext`) | yes |
| 10 | `CommandPaletteLauncher` (`src/features/command-palette`) | no (sibling) |

Hooks called in `Providers` body: `useFirebaseAuth()`, `useActivityTracker()`, `useState` (QueryClient).

### 4.4 `.tsx` component files by area (excluding `*.test.*` and `*.stories.*`)

Command: `find src/<area> -type f -name '*.tsx' | grep -v '\.test\.' | grep -v '\.stories\.' | wc -l`

| Area | `.tsx` files |
| --- | ---: |
| `src/features/` | 151 |
| `src/app/` | 50 |
| `src/shared/` | 23 |
| Other (`src/lib/`: FontSyncer, AudioProvider, PostHogProvider, providers; `src/.storybook/preview.tsx`) | 5 |
| **Total** | **229** |

---

## 5. Test files by config type

Total `*.test.ts`/`*.test.tsx` files (whole `src/`, node_modules excluded): **41**

```sh
find src -type d -name node_modules -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -print | wc -l
```

Classification per the three vitest configs' `include` patterns (verbatim patterns in `14-Evidence-Appendix.md` §6):

| Config | Include pattern | Files matched | Count |
| --- | --- | --- | ---: |
| `vitest.browser.config.ts` | `**/*.browser.test.{ts,tsx}` | 12 files (list in Evidence Appendix §7.6) | 12 |
| `vitest.emu.config.ts` | `**/*.emu.test.ts` + `**/firestore-rules.test.ts` (excludes `functions/**`) | 4 app `.emu.test.ts` + `src/firestore-rules.test.ts` | 5 |
| `src/functions/vitest.config.ts` | `src/**/*.emu.test.ts` (inside `functions/`) | `fanout.emu.test.ts`, `digest.emu.test.ts` | 2 |
| `vitest.config.ts` (unit; default include, explicit excludes for browser/emu/rules/e2e/functions) | everything else | remainder | 22 |
| **Total** | | | **41** |

Playwright e2e (separate; `playwright.config.ts`): `src/e2e/` contains 2 spec files (`auth.spec.ts`, `realtime.spec.ts`) and 3 helpers (`helpers/sign-in.ts`, `helpers/emulator-auth.ts`, `helpers/emulator-firestore.ts`).

```sh
find src/e2e -type f
```

---

## 6. Dependency counts

Command:

```sh
python3 -c "import json; d=json.load(open('src/package.json')); print(len(d['dependencies']), len(d['devDependencies']))"
python3 -c "import json; d=json.load(open('src/functions/package.json')); print(len(d['dependencies']), len(d['devDependencies']))"
```

| Package | `dependencies` | `devDependencies` |
| --- | ---: | ---: |
| `src/package.json` | 35 | 34 |
| `src/functions/package.json` | 2 (`firebase-admin`, `firebase-functions`) | 6 |

Full verbatim blocks are in `14-Evidence-Appendix.md` §3.

---

## 7. Duplicate-name observation (exported declarations defined in 2+ files)

Method: grep all `export [default] [async] function|const|class <Name>` declarations, extract `<Name>`, and list names declared in more than one file. Test files (`*.test.*`) and story files (`*.stories.*`) excluded. This method does not catch `export { X }` re-export lists, `export type`/`export interface`, or default-exported anonymous values.

Command:

```sh
grep -rEn 'export (default )?(async )?(function|const|class) [A-Za-z0-9_]+' src \
  --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=.next \
  | grep -v '\.test\.' | grep -v '\.stories\.' \
  | sed -E 's/^([^:]+):[0-9]+:.*export (default )?(async )?(function|const|class) ([A-Za-z0-9_]+).*/\5\t\1/' \
  | sort -u \
  | awk -F'\t' '{c[$1]++; f[$1]=f[$1] " " $2} END {for (n in c) if (c[n]>1) print c[n], n, f[n]}' | sort -rn
```

Raw result — 2 collision names found:

| Name | Files | Paths |
| --- | ---: | --- |
| `generateMetadata` | 6 | `src/app/[locale]/(main)/admin/analytics/page.tsx`, `src/app/[locale]/(main)/admin/content/page.tsx`, `src/app/[locale]/(main)/admin/reports/page.tsx`, `src/app/[locale]/(main)/admin/settings/page.tsx`, `src/app/[locale]/(main)/flashcard/shared/[shareId]/page.tsx`, `src/app/[locale]/layout.tsx` (Next.js per-route metadata export convention) |
| `db` | 2 | `src/functions/src/firebase-admin.ts`, `src/lib/firebase.ts` (separate npm packages) |

---

## 8. Long functions (top 12 by heuristic)

Heuristic: awk scan over non-test `.ts`/`.tsx` files. A "function start" is a line at column 0 matching `[export ][default ][async ]function <name>` or `[export ]const <name> = (…` / `=> {`. The function is considered to end at the next line that is exactly `}`, `};`, or `})` at column 0. **Limits of this method:** it measures top-level declarations only (nested/indented functions invisible); if a file's first closing brace at column 0 belongs to something else the length is wrong; multiple top-level functions per file are measured but only the first unclosed one at a time; interface/object literals closed at column 0 can truncate a measurement early. Treat as an approximation.

Command:

```sh
find src -type d \( -name node_modules -o -name .next \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print \
 | grep -v '\.test\.' | xargs awk '
/^(export )?(default )?(async )?function [A-Za-z0-9_]+/ || /^(export )?const [A-Za-z0-9_]+( = |: [A-Za-z<>,\[\] ]+ = )(async )?(\(|[A-Za-z0-9_]+ =>)/ {
  if (!infn) { infn=1; start=FNR; name=$0; sub(/\(.*/,"",name); fname=FILENAME } }
infn && /^};?\)?$|^}$/ { print FNR-start+1 "\t" fname ":" start "\t" name; infn=0 }' | sort -rn | head -12
```

| # | Approx. lines | Declaration | Location |
| ---: | ---: | --- | --- |
| 1 | 367 | `const ShareModal =` | `src/features/flashcard/components/ShareModal.tsx:68` |
| 2 | 333 | `const FlashcardPractice =` | `src/features/flashcard/components/FlashcardPractice.tsx:62` |
| 3 | 321 | `export function useDropMode` | `src/features/kana/hooks/useDropMode.ts:47` |
| 4 | 261 | `const DeckCard =` | `src/features/flashcard/dashboard/components/DeckCard.tsx:24` |
| 5 | 258 | `const FlashcardMistakeReview =` | `src/features/flashcard/components/FlashcardMistakeReview.tsx:59` |
| 6 | 257 | `export function useMatchModeSession` | `src/features/flashcard/games/match/hooks/useMatchModeSession.ts:69` |
| 7 | 246 | `export default function KanaHub` | `src/features/kana/hub/components/KanaHub.tsx:19` |
| 8 | 239 | `export const useSurvivalGame =` | `src/features/kana/hooks/useSurvivalGame.ts:61` |
| 9 | 226 | `const SpeedPlaying =` | `src/features/flashcard/games/speed/components/SpeedPlaying.tsx:58` |
| 10 | 224 | `const AIBulkPanel =` | `src/features/flashcard/components/AIBulkPanel.tsx:85` |
| 11 | 221 | `export function useKanaQuizSession` | `src/features/kana/hooks/useKanaQuizSession.ts:99` |
| 12 | 219 | `export function useLessonBuilder` | `src/features/flashcard/hooks/useLessonBuilder.ts:53` |

---

## 9. Deepest indentation nesting (top 12 files)

Method: maximum count of leading spaces on any line, divided by the project's Prettier `tabWidth: 4` (`src/prettier.config.js:55`). Non-integer values occur where Prettier aligns continuation lines at a half-step; the raw space count is the objective figure. This measures formatting depth (JSX nesting, callbacks, object literals alike), not specifically JSX element depth. Test files excluded.

Command:

```sh
find src -type d \( -name node_modules -o -name .next \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' \) -print \
 | grep -v '\.test\.' | xargs awk '
{ match($0, /^[ ]*/); if (RLENGTH>m[FILENAME]) m[FILENAME]=RLENGTH }
END { for (f in m) print m[f]/4 "\t" f }' | sort -rn | head -12
```

| # | Max depth (units of 4 spaces) | Max leading spaces | File |
| ---: | ---: | ---: | --- |
| 1 | 17.5 | 70 | `src/features/admin/components/analytics/AnalyticsDetailModal.tsx` |
| 2 | 16.5 | 66 | `src/features/flashcard/dashboard/components/FlashcardDashboard.tsx` |
| 3 | 16 | 64 | `src/features/flashcard/components/SharePrivacyPicker.tsx` |
| 4 | 14 | 56 | `src/shared/components/ui/SettingsMenu.tsx` |
| 5 | 14 | 56 | `src/features/flashcard/components/ShareModal.tsx` |
| 6 | 13 | 52 | `src/features/flashcard/components/ImportPreview.tsx` |
| 7 | 13 | 52 | `src/features/admin/components/analytics/AnalyticsExportModal.tsx` |
| 8 | 12.5 | 50 | `src/features/flashcard/components/AIBulkPanel.tsx` |
| 9 | 12.5 | 50 | `src/features/admin/components/reports/AdminReportsPageContent.tsx` |
| 10 | 12 | 48 | `src/features/kana/hub/components/KanaHub.tsx` |
| 11 | 12 | 48 | `src/features/game/components/Leaderboard.tsx` |
| 12 | 12 | 48 | `src/features/flashcard/components/ShareCollaboratorsPanel.tsx` |

---

## 10. Circular dependencies

**Not measured — tool not present.** Checked with:

```sh
ls src/node_modules/.bin | grep -iE '^(madge|cloc|depcruise|dependency-cruiser|sloc|tokei)'   # no matches (exit 1)
which cloc tokei madge   # all "not found"
```

Neither `madge` nor `dependency-cruiser` is installed in `src/node_modules`, and no such tool is on the system PATH. Per discovery rules, no package was installed to compute this.

## 11. LOC tool availability

`cloc`, `tokei`, and `sloc` are not installed (same check as §10). All line counts in this document are raw `wc -l` physical lines.
