# Current Project Memory

**The single starting point before modifying this codebase.** Describes the codebase **as it is at `e629c25`**, not as any plan intended it.

**Verified:** 2026-08-09, against working tree at commit `e629c25`, by direct code inspection + full execution of all five test suites.
**Confidence key:** `[HIGH]` directly verified in code this session · `[MED]` multiple documents + partial code evidence · `[LOW]` inferred, needs validation.

> **Authority order when sources disagree** (this is new; nothing previously stated one):
> 1. **The code** — what actually runs.
> 2. **`docs/migrations-ledger.md`** — the live, in-repo record of staged-change state (ADR-120). It is *current*; the planning corpus is *historical intent*.
> 3. **`docs/adr/`** — why it is built this way. Two series, both in force: `001`–`003` and `1xx-refactor-decisions.md` (ADR-101…120).
> 4. **This directory** — the reconciliation between the three above.

---

## 1. Project overview

Japanese-learning web app ("Kana & Nihongo Master"): kana drills, SRS flashcard decks with collaborative sharing, arcade-style game modes, an admin console, and a notification platform.

| | |
|---|---|
| Stack | Next.js 16.2.3 (App Router, Turbopack) · React 19.2.4 · TypeScript · Tailwind v4 |
| Data | Firebase — Firestore, Auth, Storage, Cloud Functions (2nd gen), Remote Config |
| Server logic | Next.js Server Actions via `next-safe-action` · Firebase Admin SDK |
| Client state | Zustand (`lib/app-store.ts`) · TanStack Query · React Context for realtime |
| UI | Base UI primitives wrapped in `shared/components/ui` · `motion` v12 · lucide-react |
| i18n | `next-intl`, `[locale]` routes, en + ja in 795-key lockstep |
| Tests | 5 suites — unit, browser (Playwright-backed Vitest), emulator, E2E, rules |
| CI | `.github/workflows/ci.yml` — **5 jobs**: `build-lint-test` · `emulator-rules-tests` · `functions-tests` · `e2e-tests` · `deploy-functions`. Lint is **blocking** |

**Package root is `src/`, not the repo root.** `npm` commands run from `src/`. `[HIGH]`

**There IS a deployment job — for Cloud Functions only.** `deploy-functions` runs on push to `main` and would `firebase deploy --only functions`, but it is gated behind `vars.FIREBASE_PROJECT_ID != ''` and currently **skips cleanly** because that repo variable and the `FIREBASE_SERVICE_ACCOUNT` secret are not configured (`.github/workflows/ci.yml:183-244`). This does **not** deploy the Next.js app — app hosting remains genuinely undecided (Q-2 / LDG-08). `[HIGH]`

---

## 2. Current architecture `[HIGH]`

```
src/
├── app/          45 files   Next.js App Router. Routes are thin mounts.
├── features/    493 files   9 features. THE primary unit of organization.
├── shared/       62 files   Cross-cutting UI, hooks, utils, providers, audio.
├── lib/          27 files   Framework/infra: firebase, auth-session, logging, store.
├── functions/               Cloud Functions (own package.json, own CI job).
├── e2e/           5 files   Playwright specs.
├── i18n/ messages/          next-intl config + en/ja catalogs.
└── scripts/                 check-vocabulary-agreement.mjs, backfill-notifications.mjs
```

### The 9 features and their sizes

| Feature | Files | Internal structure |
|---|---:|---|
| `flashcard` | 179 | Sub-modules with own barrels: `builder/ dashboard/ detail/ games/{match,speed,study}/ sharing/` + shared root `actions/ context/ domain/ hooks/ loaders/ services/ types/ utils/` |
| `admin` | 116 | `actions/ components/{analytics,content,dashboard,reports,shared,table,users}/ context/ domain/ hooks/ services/ types/ utils/` |
| `kana` | 72 | Mode sub-modules `chart/ hub/ learn/ practice/ quiz/ survival/` + `actions/ components/ data/ hooks/ types/ utils/` |
| `notifications` | 42 | `actions/ components/ context/ domain/ services/ types/` — **headless, imports no other feature** |
| `ai` | 28 | `hooks/ prompts/ schemas/ services/` |
| `game` | 26 | `components/ domain/ hooks/ services/` — platform feature, consumed by kana + flashcard |
| `user` | 21 | `actions/ context/ domain/ hooks/ services/ types/` |
| `command-palette` | 5 | `components/ data/` — deliberately flat |
| `home` | 4 | `components/ hooks/` — deliberately flat |

**No folder exists without ≥2 files. Small features stay flat — symmetry is not a goal.** `[HIGH]`

### Layer contract (lint-enforced, `error` severity)

```
app/ (routes: thin mounts)
  └─> features/<f>  via its ROOT BARREL only  →  @/features/<f>  or  @/features/<f>/server
        ├─ components/  UI only
        ├─ hooks/       orchestration, no Firestore
        ├─ services/    ALL Firestore I/O lives here
        ├─ domain/      pure logic, no React, no Firebase
        └─ actions/     "use server" Server Actions
  └─> shared/, lib/     (features may import these; lib may NOT import features)
```

**Verified invariants** `[HIGH]` — each re-checked this session:

| Invariant | Evidence |
|---|---|
| Every one of 9 features has a root `index.ts` barrel | direct `ls` |
| **Zero** external deep-imports into `features/flashcard/types` | grep: 0 hits outside the feature (42 hits are intra-feature self-imports, which are legitimate) |
| `lib/` → `features/` only from `lib/providers.tsx` | grep: 1 file, the sanctioned composition root |
| `features/notifications/` imports **no** other feature | grep: 0 hits |
| **Every** real `onSnapshot(` call is in a `services/` file | grep across all features: 12 call sites, 12 in `services/` |
| Boundary rules are `error`, not `warn` | `eslint.config.mjs` — `import/no-restricted-paths` ×3 at `"error"` |

That last one is the strongest architectural property this codebase has. **Do not open a Firestore listener outside a service.**

---

## 3. Core patterns (what to copy when adding code) `[HIGH]`

| Concern | The pattern | Reference implementation |
|---|---|---|
| Read realtime data | Service exports `subscribeX(...)` returning `Unsubscribe`; a Context mounts it **once**; components read the context | `features/flashcard/services/lesson-subscriptions.ts` → `context/LessonsContext.tsx` |
| Read one-shot | tanstack-query-firebase bridge | `features/flashcard/hooks/useEditableLesson.ts` |
| Write (client) | Service function → `writeBatch`/`setDoc` | `features/flashcard/services/lesson-save.ts` |
| Write (privileged/cross-user) | `"use server"` action on `userActionClient` (verifies ID token server-side, derives recipient) | `features/notifications/actions/notification.actions.ts` |
| Action result envelope | `toActionResult()` → `{ok:true,data}` \| `{ok:false,error}` | `lib/safe-action.ts` — **permanent, see LDG-21** |
| Validation | zod schema colocated with its consumer; `zodResolver` for RHF forms | `features/flashcard/types/lesson.schema.ts` |
| Auth | httpOnly server-minted session cookie; client never reads credentials from `document.cookie` | `lib/auth-session.ts` |
| Permissions (decks) | `resolveRole()` — **never** re-derive inline | `features/flashcard/utils/rbac.ts` |
| Permissions (admin) | separate engine, deliberately NOT merged with deck RBAC (ADR-115) | `features/admin/` |
| Dialogs | Base UI `Dialog.Root` + `DIALOG_BACKDROP_CLASSNAME` from the ui barrel | `shared/components/ui/DialogChrome.tsx` |
| Menus/selects | Base UI `Menu` / `Select` — gives Escape + outside-click free | `features/flashcard/sharing/components/SharePrivacyPicker.tsx` |
| Tables | `useDataTable` engine + `admin/components/table/` | `features/admin/components/table/` |
| Styling | Tailwind + design tokens; `cn()` from `@/shared/utils`. **No raw hex, no bracket values** | `.claude/skills/design-system/` |
| Ordering | fractional-indexing string keys | `features/flashcard/utils/reorder.ts` |
| Logging | `enqueueClientLog` / activity-log server actions | `lib/logging/` |

---

## 4. Permission & auth model `[HIGH]`

- **Two RBAC engines, deliberately separate** (ADR-115): deck-sharing roles (`owner > editor > commenter > viewer > none`) and admin authority. They are *not* merged; do not "unify" them.
- Deck access resolves through `resolveRole()` only. Public link access is capped at `commenter` — `editor` is never granted via link.
- Server actions derive the recipient/actor **server-side from a verified ID token**. The client supplies intent, never identity.
- Session = httpOnly cookie minted by `lib/auth-session.ts`. The edge proxy is **routing-UX only**, not an authorization boundary.
- Public routes come from **one** module: `shared/constants/public-routes.ts` (consumed by both the proxy and the AuthGate).

---

## 5. What is verifiably complete

All **63** backlog tasks (T-101a … T-120c) reached a terminal state, **except T-118b (BLOCKED) and T-118d (OPEN)** — both deliberately, with adjudications on file. Every task ID except those two appears in a commit message. `[HIGH]`

Plus a later **cleanup program** (12 commits, `c982a64`…`f4dd766`) covering dead-code removal, shared→feature relocation, route-layer extraction, and a11y migrations. Its own audit set was deleted after completion (recoverable at `c982a64`). `[HIGH]`

Full detail: `DO_NOT_REPEAT.md`.

---

## 6. Known technical debt (verified, prioritized)

| # | Debt | Evidence | Severity |
|---|---|---|---|
| D-1 | **52 files exceed the 200-line ceiling**; rule is `warn`, never flipped to `error` | `eslint.config.mjs:64`; count measured 2026-08-04 | Medium — explicitly deferred, see below |
| D-2 | ~~`check-vocabulary-agreement.mjs` hardcodes 12 source paths with no test that they resolve~~ — **fixed 2026-08-04 (R-1)**: `validateConfiguredPaths()` fails loudly pre-comparison; a disk-resolution test guards every configured path | `scripts/check-vocabulary-agreement.mjs`, `.test.ts` | Closed |
| D-3 | APP_ID split-brain: app reads `NEXT_PUBLIC_APP_ID`, functions read `NOTIFICATIONS_APP_ID` | `lib/app-id.ts:1` vs `functions/src/digest.ts:151`, `fanout.ts:126` | High risk, **correctly blocked** (LDG-09) |
| D-4 | 102 ESLint warnings standing (0 errors) | `npx eslint .` | Low — behind a shrink-only ratchet |
| D-5 | ~~Flashcard legacy-doc compat cluster: 6 read-time mechanisms~~ — **narrowed 2026-08-04**: the 4 lesson-level mechanisms (owner/collaborator fallbacks) were removed after an empirical check found 0/9 lessons needed them. The 2 card-level mechanisms remain and are **confirmed still needed**: 192/817 cards (23.5%) missing `alternatives`, 621/817 (76%) on legacy numeric order | LDG-22 | Medium — gated on a cards-only backfill decision |
| D-6 | 2 privacy risks with **no task and no owner**. **NQ-7:** `firestore.rules:187` allows unauthenticated read of any `leaderboard_*` collection — confirmed empirically over REST; display names and scores are world-readable. **NQ-8:** card images in Storage are likewise world-readable | `firestore.rules:187`, `storage.rules` | **Highest unowned risk** |

**TD-3 (the 200-line ceiling) is a deliberate deferral, not an oversight** — the rule is deliberately `warn`, and the refactor program recorded the deferral so its absence would be auditable rather than mistaken for coverage. Do not "discover" it as new debt.

---

## 7. Known risks

1. **NQ-7 / NQ-8** — live PII/asset exposure, no task, no owner, survives the entire program by design. The single most important thing an owner could pick up.
2. **T-118b** — unifying APP_ID *is* a tenant repartition if the two production values differ. Silent failure, non-revertible. Stays blocked until Q-6/Q-1 answer **or** an owner accepts a one-time repartition with a backup taken first.
3. **Nothing is production-verified.** Q-1 (which Firebase project is production) and Q-2 (hosting target) are unanswered. Every "deployable" claim in this repo means *merge-visible*, not *user-visible*.
4. **Bus factor of one** — single author; explicitly recorded as not architecturally resolvable.

---

## 8. Open questions blocking work

14 ledger rows are open. The gates that actually block code: **Q-1** (production project identity — highest leverage), **Q-2** (hosting), **Q-5** + **NQ-1** (notification legacy data / deploy state — these gate the *terminal node* of the critical path), **Q-6** (functions deployed? APP_ID agreement), **Q-10** (admin authority source), **Q-12** (schema intent).

All are **[INTENT]**, **[GCP]/[OPS]**, or **[DATA]** class — none answerable from the repo. Owner for all: **NgnPhamGiaHuy**.

---

## 9. Do-not-repeat rules

See `DO_NOT_REPEAT.md`. The short version: **do not** re-propose barrel adoption, listener centralization, the action-client unification, the notification seam, deleting the `toActionResult` shim, merging the two RBAC engines, promoting `game/` into `shared/`, deleting any fallback, or "finding" the 200-line ceiling as new debt.

---

## 10. Current refactoring priorities

Top three:
1. **R-1** Make the vocabulary checker resilient to file moves (it silently broke CI once already).
2. **R-2** Get NQ-7/NQ-8 owned — a decision, not code.
3. **R-3** Reconcile the stale planning corpus so it stops contradicting the code (this document set is step one).
