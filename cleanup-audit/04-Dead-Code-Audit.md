# 04 — Dead Code Audit

Merged results of two sweeps: `features/` (460 files, full import graph + per-symbol `git grep -w` verification) and the non-feature surface (`shared/`, `lib/`, `app/`, `i18n/`, `messages/`, `functions/`, `scripts/`, `e2e/`, configs — 2,657 import statements resolved). Every DELETE was re-verified manually, including dynamic-import, string-reference, App Router convention, `"use server"` form-action, and test-entry checks.

**Headline: across ~600 source files, the hard-delete surface is 4 code symbols, 1 redundant barrel file, and 1 empty directory.** The modernization program genuinely already removed the dead mass.

## 1. SAFE_TO_DELETE (all evidence re-verified directly)

| # | Item | Evidence | False-positive checks done |
| --- | --- | --- | --- |
| D1 | `features/admin/components/content/index.ts` (redundant local barrel) | 0 importers; `admin/index.ts:23` imports the concrete file `./components/content/AdminContentPageContent` directly, bypassing it. All 3 modules it re-exports stay alive via direct imports | No dynamic `import()`, no string refs, not an App Router file, no `"use server"` content |
| D2 | `getComments` in `features/flashcard/services/comment.service.ts:199` (+ its one test case) | Only non-test hit repo-wide is the definition. Production uses the subscribe path (`useCommentPanel`/`useCommentCount`); the `export *` in `services/index.ts` has no consumer of this name (namespace imports member-checked) | Not `"use server"`, no dynamic refs |
| D3 | `AIGenerateMode` type in `features/ai/types.ts:20` (+ barrel re-export `ai/index.ts:20`) | 2 code hits: definition + re-export. One *doc-comment* mention in `shared/schemas/ai-generate-input.schema.ts:5` — update that comment in the same change | Type-only; no annotation uses anywhere |
| D4 | `signOutUser`, `wipeDoc` in `features/flashcard/services/__tests__/emu-auth.ts` | 1 hit each (definitions) — unused even by the 5 emu tests importing the helper | Test-infra only |
| D5 | `app/[locale]/(immersive)/kana/survival/_components/` (empty directory) | 0 files (verified `ls -la`); untracked (git cannot track empty dirs) — local residue of the T-105a move | `rmdir`, zero risk |

## 2. TRIM_EXPORT — barrel over-exports (modules alive; fix = remove the export line)

ADR-101 frames barrels as public API, so an unused barrel export *may* be intentional surface. These are "over-exported API" findings, not deletions. Grouped by certainty:

**Clear trims (consumers demonstrably use another path):**

| Barrel | Symbols | Actual consumer path |
| --- | --- | --- |
| `admin/components/reports/index.ts` | 9 of 10 re-exports (all but `LogRow`) | Sole barrel importer is `AdminOverviewPage.tsx:10` wanting `LogRow`; page content is served via `components/index.ts`; badges/filters imported relatively |
| `admin/components/shared/index.ts` | `AdminGuard`, `AdminSidebar` | App layout gets both via `admin/index.ts → ./components` |
| `admin/index.ts:31` | `AdminLog`, `LogLevel`, `LogSource`, `LogType` types | Consumers import from feature-internal `types/` or `@/lib/logging/*` |
| `flashcard/index.ts:62` | `declineInviteAction` | Real consumer is `flashcard/notifications.ts:18` importing the file directly. Symbol itself is LDG-20 KEEP — only the unused barrel path is the finding |
| `flashcard/server.ts` | `Lesson`, `PublicSharedLessonPreview` type re-exports | Consumers use the root index (incl. inline `import("@/features/flashcard").Lesson`) |
| `kana/index.ts` | `TIME_ATTACK_*` ×2, `AnswerFeedback`, `KanaMCOptionsGrid`, `useKanaDataset`, `AlphabetMode` | All consumers use sub-barrels/subpaths (independently re-verified for `TIME_ATTACK_*`) |
| `kana/survival/index.ts` | `useSurvivalGame`, `ChallengeMode`, `DropWord`, `SurvivalPhase` | Consumers import `../hooks` |
| `notifications/index.ts:19-20` | `NotificationRow`, `flattenNotificationGroups` | Only feature-internal relative imports |

**Low-priority trims:** ~17 `*Props`/mode-union type re-exports across `game/components/index.ts`, `kana/{chart,learn,practice,quiz}/index.ts`, `notifications/index.ts:29-30` — conventional props-type surface, near-zero cost either way. Optional: 4 unused type re-exports on the `shared/audio` barrel (`AudioStatus`, `PlaybackHandle`, `SfxCue`, `SpeakOptions`) — the audio barrel explicitly documents its type surface as public API, so keeping is defensible.

## 3. INVESTIGATE (do not delete on this evidence)

| Item | Why held back |
| --- | --- |
| `notifications/domain/action-registry.ts` — `getNotificationActions`, `hasNotificationActions` | Test-only today, but they complete the deliberate quartet API of the brand-new ADR-102 act-side seam (T-102a). Trimming a 3-sprint-old intentional API on a usage snapshot is premature |
| `flashcard/builder/hooks/useLessonBuilder.ts` — `makeCard` export | Used in-file + by `GameEngine.test.ts` as a fixture. Inline a fixture there first, then un-export |
| `@vitest/coverage-v8` devDependency | Zero config/script references — but its only purpose is ad-hoc `vitest run --coverage`. Ask the owner whether coverage runs happen before removing |
| `getCallerContext` in `admin/services/admin.service.ts:49` | Internal + emu-test-only — but this file is the Q-10-gated admin-predicate surface (LDG-15). **GATED, leave untouched** |

## 4. Confirmed alive / clean (the important negatives)

- **Zero-importer files elsewhere: none.** Near-miss `shared/audio/unlock.ts` is alive via side-effect `import "./unlock"`.
- **npm dependencies:** 35/35 runtime deps used; 25/26 devDeps used (`@vitest/coverage-v8` above); `functions/` 8/8. `react-dom`/`playwright` are peer requirements, not dead. `prettier` sits in `dependencies` instead of `devDependencies` — placement oddity, P4.
- **Env vars:** bidirectionally complete — all 31 `process.env` reads documented in `.env.example`, all keys read by code, and the invariant is machine-enforced by `env-contract.test.ts` (T-118c). Nothing to do, ever, until the contract test says so.
- **i18n:** en/ja in perfect 795-key lockstep; all 33 namespaces have `useTranslations`/`getTranslations` call sites; 278-key targeted sample found zero orphans. (Key-level certainty is impossible due to dynamic `t(\`…\`)` construction — namespace level is the honest unit.)
- **Feature flags:** exactly 2 declared, both read (`maintenance_mode`, `locale_switch_enabled`). No obsolete flags.
- **Routes/e2e/scripts:** no dead route segments; all 5 `_components` used; all e2e helpers consumed; `check:vocab` wired into CI.
- **Config drift:** one stale comment — `vitest.browser.config.ts` (~line 36) references "vitest.config.ts's storybook project," which no longer exists (T-119e residue). Comment-only trim. `firebase.json`, `playwright.config.ts`, CI workflow, tsconfig aliases all verified consistent.
- **Unreachable branches:** none. Branches over the 8 deleted `ActivityAction`s / 7 deleted `NotificationKind`s cannot survive compilation (closed enum/union) and none do. The `isUnread()` legacy branch is GATED (LDG-01), not unreachable.
- **`__screenshots__/` dirs:** gitignored vitest-browser artifacts; `.DS_Store` ×6 gitignored Finder noise — local hygiene only, no repo change.
- **Excluded non-findings (~40 symbols):** exported types participating in exported signatures, and in-file-used values whose `export` keyword is merely unnecessary — all verified alive; listing them would be padding.

## 5. Score card

| Classification | Count |
| --- | --- |
| SAFE_TO_DELETE | 1 file + 4 symbols + 1 empty dir |
| TRIM_EXPORT (clear) | 8 barrel groups (~20 export lines) |
| TRIM_EXPORT (low-priority/optional) | ~21 type names |
| TRIM (comments) | 1 stale config comment + 1 schema doc-comment |
| INVESTIGATE | 3 (+1 gated) |
| Everything else | Alive, gated, or framework-required |
