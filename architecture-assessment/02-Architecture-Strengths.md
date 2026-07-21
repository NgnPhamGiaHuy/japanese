# 02 — Architecture Strengths

> **Phase — Architecture Assessment (evaluation).** This document evaluates what works well in the codebase. Every finding follows the structure **Observation / Evidence / Interpretation / Confidence**. All load-bearing claims were re-verified directly against the repository at HEAD `a0bbbc4` (branch `main`) on 2026-07-19; discovery-corpus references (`project-discovery/NN §…`) are cited only as secondary sources. Paths are relative to the repo root `/Users/yuh.nguyenpham/GitHub/japanese`; the Next.js project root is `src/`.
>
> Scope: strengths only. No recommendations, implementations, or tasks are proposed here. Weaknesses belong to a separate document.

---

## Summary table

| ID | Dimension | Finding | Confidence |
|----|-----------|---------|------------|
| S-1 | Dependency direction / module boundaries | Strictly unidirectional layer imports, verified by grep; the single upward exception (`lib/providers.tsx`) is a deliberate, documented composition root | High |
| S-2 | Feature organization | Nine feature modules with a consistent internal sub-structure; route files are thin orchestrators | High |
| S-3 | Layer separation | Server code is physically fenced: 10 `server-only` modules + exactly 10 `"use server"` modules; leakage into the client bundle fails the build | High |
| S-4 | API architecture / shared infrastructure | Zero ad-hoc route handlers; the entire server surface funnels through two documented safe-action families with one uniform result shape and zod at every boundary | High |
| S-5 | Security | Authorization is centralized and server-derived: shared token verification, declarative per-action permission metadata, server-side recipient derivation, and a three-layer public-role cap | High |
| S-6 | Firebase architecture (rules) | Firestore rules mirror the app's RBAC, including immutable-field guards and an owner-self-only inbox-create rule with written rationale | High |
| S-7 | Firebase architecture (Admin SDK) | Lazy Proxy singletons keep builds credential-free and route transparently to emulators | High |
| S-8 | Firebase architecture (writes) | Race-prone write paths use real transactions and atomic increments; notification writes are idempotent via deterministic collapse IDs | High |
| S-9 | Cohesion | The notifications feature isolates a pure, fully unit-tested `domain/` core with a policy registry as single source of truth | High |
| S-10 | Testing | A five-suite test architecture (unit / real-browser / emulator / functions / E2E) with each tier proving what only it can prove | High |
| S-11 | Testing (CI) | CI mirrors the local test split job-for-job, with staged fast/slow lanes, concurrency cancellation, and an honestly-annotated non-blocking lint | High |
| S-12 | Error handling | A layered, tiered error policy: provider-free error boundaries, fail-open defaults for secondary paths, typed errors for user-facing failures, backoff for listeners | High |
| S-13 | Configuration management | Env access is centralized in dedicated config modules with inline safe defaults; feature flags are kill-switch-safe with stale-template fallback and an ADR | High |
| S-14 | State management | Clear four-tier state model (Zustand settings / React Query server state / contexts for app-lifetime subscriptions / local state), codified in ADR-002; auth objects are explicitly excluded from persistence | High |
| S-15 | Coupling | The audio subsystem boundary is mechanically enforced by ESLint (ADR-backed), making an entire class of past regressions unrepresentable | High |
| S-16 | Reusability | A headless-primitive shared UI kit with real-browser tests, shared zod schemas with tests, and a fractional-indexing reorder utility shared across features | High |
| S-17 | i18n | Perfect message-key parity (803/803, zero drift in either direction) across en/ja, consumed by 157 files, with locale-aware metadata phrasing | High |
| S-18 | Performance | Deliberate, measured performance engineering: strict LazyMotion code-splitting, list virtualization, pruned self-hosted fonts, streaming SSR on the public page | High |
| S-19 | Accessibility | Headless a11y-focused primitives, broad ARIA usage, and real-browser tests that assert focus trap / Escape / Tab-order contracts | Medium |
| S-20 | Developer experience | Heavyweight pre-commit gate, disciplined conventional commits traceable to epics, ADRs, and unusually high-quality rationale comments | High |
| S-21 | Logging | A verified, schema-validated audit-log pipeline that can never block user flows, plus gated Sentry init and first-party PostHog ingestion | High |
| — | Code ownership | No structural strength identified (single-author repo, no CODEOWNERS); evidence insufficient — see §"Dimensions with no strength claimed" | — |

---

## Findings

### S-1 — Unidirectional layer imports with a single documented composition-root exception

**Dimension:** dependency direction, module boundaries, coupling

**Observation.** The four `src/` layers import in one direction only. Grep over all production `@/`-alias imports confirms: `shared/` imports nothing from `@/features` or `@/lib` (0 hits); `features/` never imports `@/app` (0 hits); `lib/` reaches into `features/` in exactly two files — `src/lib/providers.tsx` (mounting `AdminProvider`, `CommandPaletteLauncher`, `NotificationsProvider`, and the user auth/activity hooks) and `src/lib/logging/public.ts` (a type-only import).

**Evidence.** Re-verified by grep at HEAD: `grep -rn 'from "@/features\|from "@/lib' src/shared/` → 0 production hits; `grep -rn 'from "@/app' src/features/` → 0 hits; `grep -rn 'from "@/features' src/lib/` → only `src/lib/providers.tsx:8-11` and `src/lib/logging/public.ts:1` (type-only). Secondary: `project-discovery/02 §4`, `project-discovery/08`.

**Interpretation.** This is the load-bearing structural property of the codebase, and it holds *without any mechanical enforcement* (there are no ESLint import-boundary rules — `src/eslint.config.mjs` has none). A pure-convention discipline that survives 138 commits of active refactoring is strong evidence of consistent authorship discipline. The one upward reach is not a leak but the classic composition-root pattern: `providers.tsx` is the single place where the app shell is assembled from feature-level providers, which keeps every feature ignorant of the shell while giving the shell one place to know about features. `shared/` being a true leaf layer means any shared component or util can be reused (or extracted) with zero risk of dragging feature or infrastructure code with it.

**Confidence.** High — the claim is a set of exhaustive greps re-run at HEAD, not a sample.

---

### S-2 — Consistent feature-module organization with thin route orchestrators

**Dimension:** feature organization

**Observation.** Nine feature modules (`admin`, `ai`, `command-palette`, `flashcard`, `game`, `home`, `kana`, `notifications`, `user`) each use the same internal vocabulary of subfolders (`components/ hooks/ services/ actions/ domain/ types/ utils/`, plus per-feature extras like `kana`'s mode folders and `notifications`' `context/`). Route files in `src/app/` are deliberately thin: e.g. the kana-learn page is 8 lines and self-describes as a "Pure orchestrator".

**Evidence.** `src/app/[locale]/(main)/kana/learn/page.tsx:1-8` (entire file renders `<KanaLearn />`); directory listings of `src/features/notifications/` (actions, components, context, domain, schema, services, types, `__tests__`) and `src/features/kana/` (actions, chart, components, data, hooks, hub, learn, practice, quiz, store.ts, types), verified at HEAD. Route-group layering: `src/app/[locale]/(main)/layout.tsx`, `(immersive)/layout.tsx`, `(main)/admin/layout.tsx:15-27` (AdminGuard + sidebar wrap). Secondary: `project-discovery/02 §1-2, §5.2`, `project-discovery/03`.

**Interpretation.** Feature-first organization with a predictable per-feature grammar means a reader can navigate any feature after learning one; the route layer adds nothing but wiring, so URL structure and feature code evolve independently. The route groups (`(main)` chrome vs `(immersive)` full-screen vs the admin sub-layout) encode UI-shell decisions exactly once, at the layout level, rather than per-page.

**Confidence.** High — structure verified by directory listing and file reads; the "thin page" pattern spot-checked directly.

---

### S-3 — Physically fenced server/client separation

**Dimension:** layer separation, security

**Observation.** Every module that touches the Admin SDK or other server secrets imports the `server-only` package (10 production files: `lib/firebase-admin.ts`, `lib/safe-action.ts`, `lib/flags.ts`, `lib/logging/server.ts`, all five `features/admin/services/*.service.ts`, `features/flashcard/services/shared-preview.service.ts`), which makes any accidental client-bundle inclusion a build failure. Exactly 10 production modules carry `"use server"`, forming the complete Server Action surface.

**Evidence.** Re-verified at HEAD: `grep -rln 'import "server-only"'` → the 10 files above; `grep -rln '^"use server"'` → 10 files (`features/admin/actions/admin.actions.ts`, `features/{flashcard,kana,notifications}/actions/*.actions.ts`, `features/notifications/actions/notification.actions.ts`, `features/user/services/auth-logging.service.ts`, `lib/logging/{actions,user-actions,activity}.ts`). `src/lib/firebase-admin.ts:1`, `src/lib/safe-action.ts:1`. Secondary: `project-discovery/02 §3.1`.

**Interpretation.** The server/client boundary is the one place where a mistake is a security incident (leaking Admin credentials or privileged code paths into the browser bundle), and it is exactly the boundary this codebase chose to enforce *mechanically* rather than by convention. Ten `"use server"` files for an app of 586 TS/TSX files is a deliberately small, enumerable server surface — the entire privileged API can be audited by reading ten files.

**Confidence.** High — both counts re-verified by exhaustive grep at HEAD.

---

### S-4 — A single, disciplined server-action architecture instead of ad-hoc endpoints

**Dimension:** API architecture, shared infrastructure

**Observation.** The app has zero API route handlers (`find src/app -name route.ts` → nothing; only `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`). All server calls go through two `next-safe-action` client families defined in one place each: `actionClient` (client-supplied ID token as bind arg, per-action zod input schema) and `adminActionClient` (cookie session + declarative per-action permission via typed `.metadata()`). A shared `toActionResult` adapter preserves the repo-wide `{ok:true,data}|{ok:false,error}` contract.

**Evidence.** `src/lib/safe-action.ts:9-31` (documented two-family design and rationale), `:33-45` (`actionClient` + shared `verifyIdToken`), `:52-60` (`toActionResult`); `src/features/admin/services/admin.service.ts:65-85` (`adminActionClient` with zod-typed metadata schema enumerating all 8 permissions and a single middleware calling `assertAdminAction`); `src/features/admin/services/admin.service.ts:51-56` (cookie-session resolution). Absence of route handlers re-verified. Secondary: `project-discovery/02 §11`.

**Interpretation.** Most codebases of this age accumulate a mixture of REST handlers, one-off actions, and hand-rolled auth checks. Here the entire remote surface has one invocation grammar, one error-shape contract, and one token-verification implementation. The `adminActionClient` design is particularly strong: an action *cannot be defined* without declaring its required permission (the metadata schema demands it), which converts "did the author remember the auth check?" from a review question into a compile-time property. The admin actions file itself states no action hand-rolls verification — and the middleware structure makes that claim structural rather than aspirational.

**Confidence.** High — both clients and the absence of route handlers read/verified directly.

---

### S-5 — Server-derived authorization: the client is never trusted with identity, target, or role

**Dimension:** security

**Observation.** Three independent mechanisms remove trust from the client: (1) sender identity always comes from a verified Firebase ID token (`verifyIdToken` centralization); (2) notification recipients are *derived server-side* per event kind — the input schema carries only object identifiers, and `authorizeAndResolve` computes the recipient from the lesson/comment after checking the sender's role; (3) the deck-sharing public-role cap ("editor can never be granted via public link") is enforced at three layers — type level, runtime resolution, and write-time sanitization — and mirrored in Firestore rules.

**Evidence.** `src/features/notifications/actions/notification.actions.ts:9-16` (documented guarantees), `:66-97` (pipeline: bind-arg token → zod input → verify → authorize), `:123-162` (`authorizeAndResolve` per-kind recipient derivation and role gating); `src/features/flashcard/utils/rbac.ts:1-38` (permission-matrix header documenting the three-layer cap), `:97` (`resolveRole`), `:159` (`sanitizePublicRole`); `src/firestore.rules:66-78` (owner/editor-only lesson mutation). `src/lib/logging/user-actions.ts` rejects userId spoofing against the verified token (secondary: `project-discovery/02 §11.1`). E2E auth bypass double-gated on emulator flag + non-production `NODE_ENV` (`src/lib/firebase.ts:41-65`, secondary citation).

**Interpretation.** "Never trust the client" is stated everywhere and implemented rarely; here the *shape of the API* makes the secure path the only path — there is no field in `emitNotificationInputSchema` through which a client could even attempt to target an arbitrary inbox. Defense-in-depth is real, not decorative: the same invariant (public ≤ commenter; cross-user writes are server-only) exists in the type system, in runtime resolution, at write time, and in Firestore rules, so a bug in any single layer does not become a vulnerability.

**Confidence.** High — the full action pipeline and the RBAC module header were read directly; the rules mirror was read directly.

---

### S-6 — Firestore rules that mirror application RBAC, with immutability guards

**Dimension:** Firebase architecture, security

**Observation.** `src/firestore.rules` encodes the same access model as the app code: public/role-based lesson reads, owner-or-editor-only mutation, owner-only delete; comment creation gated to `owner|editor|commenter`; notification creation restricted to the inbox owner (with a comment explaining that cross-user creation is Admin-SDK-only); notification updates constrained by a `notificationImmutableFieldsUnchanged()` helper freezing `senderId`, `type`, `userId`, `createdAt`; no hard delete (soft-delete only); size limits on title/message.

**Evidence.** `src/firestore.rules:16-22` (`isSystemAdmin` matching the app's claims-or-collection fallback), `:50-56` (immutable-field guard), `:66-78` (lesson read/update/delete matrix), `:84-93` (comment role gating), `:106-123` (owner-self-only inbox create with written rationale; owner-only guarded update; no delete rule). A dedicated emulator-backed rules suite exercises this file: `src/firestore-rules.test.ts` (exists at HEAD; run via `npm run test:emu`, `src/package.json` scripts). Secondary: `project-discovery/02 §7`.

**Interpretation.** The rules are not a perfunctory `allow read, write: if auth != null` — they re-derive the product's actual permission matrix, meaning the client-side Firestore-heavy data architecture (S-14) is safe *because* the rules layer is a genuine second implementation of authorization. The immutable-field guard is a sophisticated touch rarely seen: even the inbox owner cannot rewrite a notification's provenance, only its read/soft-delete state. Crucially, the rules are under automated test in CI (S-11), so this second implementation cannot silently rot.

**Confidence.** High — rules file read directly; test suite existence and CI wiring verified.

---

### S-7 — Lazy Proxy Admin-SDK singletons: credential-free builds, transparent emulator routing

**Dimension:** Firebase architecture, shared infrastructure, developer experience

**Observation.** `adminAuth`, `adminDb`, and `adminRemoteConfig` are exported as Proxy objects that instantiate the Admin SDK only on first property access. The initializer branches on `FIRESTORE_EMULATOR_HOST` to support emulator runs with a bare projectId (with a comment explaining the `GCLOUD_PROJECT` audience-match subtlety), and the module documents why lazy init exists (module-scope init used to crash credential-less CI builds).

**Evidence.** `src/lib/firebase-admin.ts:13-27` (rationale doc-comment), `:28-48` (`getAdminApp` with emulator branch), `:60-70` (`lazyProxy` with method binding), `:72-76` (the three lazily-resolved exports). Corroborated by CI: the build job runs with placeholder-only env (`.github/workflows/ci.yml:50-62`).

**Interpretation.** This solves a real, common Next.js + firebase-admin failure mode (build-time credential requirements) with a minimal, well-documented mechanism that preserves the ergonomic value-style API at ~40 call sites — no call site had to change to gain lazy init. The same seam is what makes the emulator-backed test suites (S-10) possible without code changes: production code and tests share one entry point that routes on environment. It is infrastructure that actively enables both CI and testing strategy rather than merely serving requests.

**Confidence.** High — file read in full; CI placeholder-env corroboration read directly.

---

### S-8 — Transactional, idempotent write paths where races actually exist

**Dimension:** Firebase architecture, error handling

**Observation.** Four distinct write paths use `runTransaction`, each with a written justification of the specific race it closes: user progress read-modify-write (`updateUserProgress`, documenting the concurrent addXP/completedLesson lost-update), best-score persistence (`persist-best-score.ts`), server-side login-session dedup (`auth-logging.service.ts`), and the notification collapse write. Daily review counts use Firestore `increment()` rather than read-modify-write. The notification write targets a deterministic hash ID (`collapseId`), making retries idempotent and bursts collapse into one doc while preserving the original `createdAt` inside the transaction.

**Evidence.** `src/features/user/services/user.service.ts:33-62` (transaction + doc-comment naming the exact race), `src/features/game/services/persist-best-score.ts:42`, `src/features/user/services/auth-logging.service.ts:95`, `src/features/notifications/actions/notification.actions.ts:196-252` (transaction: first-write sets `createdAt`; repeat folds actors, bumps `count` per policy); `src/features/flashcard/services/progress.service.ts:288-298` (`increment(1)` with swallow-and-log). Deterministic IDs: `src/features/notifications/domain/id.ts:1-17` (design rationale), cyrb53 hash `:28-40`. Secondary: `project-discovery/02 §9.1`, commit `f03fe8e`.

**Interpretation.** Concurrency correctness here is *selective and reasoned*, which is stronger than blanket transaction use: the code identifies precisely where two unawaited writers can race (study-session completion firing addXP and completedLesson together) and applies the atomic tool fitted to each case — transaction for read-transform-write, `increment` for counters, deterministic IDs + merge for at-least-once delivery. The collapse-ID design turns the hardest distributed-systems property (idempotency under retry) into a pure, unit-testable function shared by client and server.

**Confidence.** High — every cited transaction call and rationale comment read directly at HEAD.

---

### S-9 — A pure, fully unit-tested domain core inside the notifications feature

**Dimension:** cohesion

**Observation.** `src/features/notifications/domain/` contains five pure modules (`build`, `events`, `format`, `id`, `registry`, `utils`) with zero Firebase imports, each paired with a colocated unit test (`build.test.ts`, `format.test.ts`, `id.test.ts`, `registry.test.ts`, `utils.test.ts`, plus `schema.test.ts` and a grouping test). `registry.ts` declares itself the single source of truth mapping each notification kind to its policy (priority, category, active flag, collapse behavior, collapse-key function), and documents that adding a type means adding one entry.

**Evidence.** Directory listing of `src/features/notifications/domain/` at HEAD (5 modules + 5 tests); `src/features/notifications/domain/registry.ts:1-14` (SSoT statement; "Pure (no Firebase)"), `:23-44` (`NotificationPolicy` interface with per-field rationale); `src/features/notifications/domain/id.ts:12-16` ("Pure and isomorphic (browser + node) … unit-testable and usable from both the client facade and the server writer, which must agree on the ID"). Consumed by the server writer at `src/features/notifications/actions/notification.actions.ts:24-26`.

**Interpretation.** This is textbook functional-core/imperative-shell factoring applied where it pays most: the subtle logic (collapse semantics, deterministic IDs, per-kind policy) is pure and exhaustively tested, while the impure shell (Admin SDK transaction) stays thin. The registry converts what is usually scattered per-type conditional logic into a closed table the server writer, preferences UI, and renderer all read — a genuine open-closed design. The isomorphism constraint (client and server must agree on IDs) is solved structurally by sharing the pure module rather than by duplicating logic.

**Confidence.** High — modules and tests listed and headers read directly.

---

### S-10 — A five-suite test architecture where each tier proves what only it can prove

**Dimension:** testing

**Observation.** Tests are split by *what environment can prove the claim*: (1) node-env unit tests (`vitest.config.ts`, 23 files — domain logic, schemas, audio manager/policy/sequencer, game engine); (2) real-browser component tests via Vitest Browser Mode + Playwright provider (`vitest.browser.config.ts`, 14 files — focus, Tab order, Escape, keyboard contracts, with screenshots); (3) Firestore/Auth emulator integration + security-rules tests (`vitest.emu.config.ts`, 6 emu files + `firestore-rules.test.ts`); (4) the Cloud Functions package's own emulator suite (`functions/src/{digest,fanout}.emu.test.ts` against Firestore/Functions/Storage emulators); (5) Playwright E2E journeys (auth redirect/sign-in, realtime notification push without reload) against an emulator + dedicated dev server on port 3100. Each config file documents why it exists and what it deliberately excludes.

**Evidence.** File counts re-verified at HEAD (23 unit / 6 emu / 14 browser / 2 e2e specs + 2 functions emu tests). `src/vitest.browser.config.ts:7-21` ("for behavior jsdom can't reliably prove: focus management, Tab order, and keyboard interaction… Separate from vitest.config.ts (node-env unit tests) and vitest.emu.config.ts… matching this project's existing per-concern config split"); `src/vitest.emu.config.ts:5-15` (scope statement); `src/playwright.config.ts:3-9` ("never against production Firebase or a developer's already-running dev server"), `:33-45` (webServer boots emulator + `next dev --port 3100`); `src/e2e/realtime.spec.ts:15` ("a server-side notification write appears live, with no reload"); `src/functions/package.json` (`test:emu` via `firebase emulators:exec`). Secondary: `project-discovery/00 §`, `docs/testing-notifications.md`.

**Interpretation.** The strength is not test *count* but test *placement*: security rules are tested against the real rules engine, keyboard/focus contracts against a real Chromium DOM, idempotent delivery against a real Firestore emulator, and the realtime pipeline end-to-end through a real browser — none of these claims is faked with mocks that would prove nothing. The four config files each carrying an explanation of their boundary (including gotchas like the `server-only` no-op alias and the `GCLOUD_PROJECT` audience match) means the test architecture is maintainable by someone other than its author. Note: discovery's "four-way split" phrasing undercounts slightly — the separately-packaged functions suite makes it five, and the unit config additionally embeds a Storybook test project.

**Confidence.** High — all four app configs and the functions package read directly; file counts recomputed.

---

### S-11 — CI that mirrors the local test architecture job-for-job

**Dimension:** testing, developer experience

**Observation.** `.github/workflows/ci.yml` runs five jobs mapped 1:1 onto the local suites: `build-lint-test` (fast lane, no JVM), `emulator-rules-tests` (JDK 21 + Firestore/Auth emulator), `functions-tests` (own install/build/lint/emulator-test for the separate package), `e2e-tests` (one Chromium install shared by Vitest Browser Mode and Playwright, with report artifact upload), and a `deploy-functions` job gated to skip cleanly until real credentials are configured. Concurrency groups cancel superseded runs. The one non-blocking step (lint) carries a comment stating exactly why it is non-blocking and instructing when to flip it.

**Evidence.** `.github/workflows/ci.yml:10-12` (concurrency cancellation), `:24` (`build-lint-test`), `:41-48` (lint `continue-on-error: true` with the honest "do not flip this to blocking until the backlog is paid down" comment), `:50-62` (placeholder Firebase env for credential-free builds), `:69` (`emulator-rules-tests`), `:101` (`functions-tests`), `:137-146` (shared-Chromium rationale for the browser job), deploy gate `if: … && vars.FIREBASE_PROJECT_ID != ''` with least-privilege service-account comment.

**Interpretation.** CI parity with local scripts (`npm run test`, `test:emu`, `test:browser`, `test:functions`, `npx playwright test`) means "green locally" and "green in CI" are the same claim — a property many larger teams never achieve. The engineering economics are attended to (fast lane without JVM, cancellation, single browser download), and the workflow is honest about its one weakness (non-blocking lint) instead of hiding it — annotated debt rather than silent debt. The deploy job's clean-skip design keeps the pipeline green without pretending credentials exist.

**Confidence.** High — the workflow file was read in full.

---

### S-12 — Layered, tiered error handling with explicit policies per failure class

**Dimension:** error handling

**Observation.** Errors are handled by class, not uniformly: (1) React error boundaries at every segment plus `global-error.tsx`, all rendering one shared `ErrorFallback` deliberately built with plain `<a>`/`<button>` and prop-passed copy so it works with no providers/router/i18n mounted; (2) fire-and-forget-with-swallow for anything secondary to the user's action (notification emit, activity logs, daily stats, login logging), each with a comment stating the swallow is intentional; (3) fail-open safe defaults for reads that must not block (daily progress zeros; `getFlags` → `DEFAULT_FLAGS`); (4) typed error mapping for user-facing failures (`CommentError` via `mapFirestoreCommentError`); (5) capped exponential backoff (1s→60s) plus a query-shape fallback on the app-lifetime notifications listener; (6) safe-action boundaries convert throws into `serverError` strings so exceptions never cross the RPC boundary raw.

**Evidence.** `src/features/flashcard/services/progress.service.ts:274-277` (fail-open with comment), `:288-298` (swallow with "grading must not be blocked" comment); `src/lib/flags.ts:50-64` (stale-template fallback, "an outage shouldn't flip already-resolved flags back to default"), `:77-88` (never-throws contract documented); `src/features/notifications/actions/notification.actions.ts:99-114` (catch-all boundary), `:170-189` (`notifySystemEvent` "Never throws — system notifications must not break the primary action"); `src/lib/logging/browser.ts:9-21` ("Swallows errors so UI and core flows are never blocked"); `src/lib/safe-action.ts:33-37`. Boundary files and `ErrorFallback` rationale: secondary `project-discovery/02 §8` (verified paths exist at HEAD: `src/app/global-error.tsx`, `src/app/_components/ErrorFallback.tsx`).

**Interpretation.** The codebase distinguishes "must succeed" (grading, primary writes) from "should succeed silently" (telemetry, notifications, stats) and applies opposite policies to each — the mark of an error model that was designed rather than accreted. The provider-free `ErrorFallback` shows unusual care for the worst case: the error screen is engineered to render precisely when the app's own infrastructure is broken. Every swallow site carries its justification inline, so intentional suppression is distinguishable from forgotten `catch {}`.

**Confidence.** High — the service-layer policies were read directly; boundary-file details rest partly on discovery citations spot-verified for existence.

---

### S-13 — Centralized, default-safe configuration

**Dimension:** configuration management

**Observation.** Environment access is funneled through small dedicated modules that pair every variable with an inline safe default: `src/features/ai/config.ts` (models, generation params, deck limits — all `?? fallback` with a `Number.isFinite` guard), `src/lib/app-id.ts` (Firestore namespace), `src/lib/site.ts`, `src/lib/firebase.ts`. Feature flags resolve server-side from Remote Config with a 60s TTL cache, in-app defaults documented as "the kill-switch state", stale-template reuse on outage, and a distinct handled case for "no template published yet". The flag mechanism choice is recorded in an ADR.

**Evidence.** `src/features/ai/config.ts:1-22` (asNumber guard + full defaulted config object); `src/lib/flags.ts:14-23` ("Every flag here MUST be safe when 'off' — this is the kill-switch state"), `:28-32` (TTL rationale), `:50-63` (differentiated not-found vs failure handling, stale-reserve), `:77-88` (never-throws); `docs/adr/003-feature-flags.md` (exists at HEAD). Both wired flags verified end-to-end by discovery (`project-discovery/02 §13.2`) with mount points `src/app/[locale]/layout.tsx` (maintenance) and settings page (locale switch). Full env-var-to-consumer table: `project-discovery/02 §13.1` (spot-verified for `firebase-admin.ts`, `ai/config.ts`).

**Interpretation.** Configuration failure modes are the classic source of "works on my machine" and 3 a.m. outages; here every knob has a defined value when its source is absent, malformed, or unreachable, and the flag system is explicitly designed so its worst case (Remote Config down, nothing cached) is a safe product state. Scoping config reads to dedicated modules (rather than `process.env` scattered through components) keeps the config surface enumerable — discovery could table every variable precisely because of this discipline.

**Confidence.** High — the two central modules read in full; consumer table verified by sampling.

---

### S-14 — A deliberate four-tier state model, codified in an ADR

**Dimension:** state management

**Observation.** State is partitioned by kind: (1) Zustand `useAppStore` for app-wide user/settings state, persisted to localStorage with a `partialize` that explicitly excludes auth objects ("Firebase manages that") and documents additive-key migration-free hydration; (2) one `QueryClient` with tuned defaults (`staleTime: 30s`, no focus refetch, retry 1) for one-shot server state, with admin query keys centralized in a single `queryKeys.ts`; (3) three React contexts for app-lifetime concerns (admin role, the single notifications listener, alerts); (4) bespoke `onSnapshot` hooks for realtime data — a division explicitly codified in `docs/adr/002-data-layer-pattern.md`.

**Evidence.** `src/lib/app-store.ts:56` (persist key), `:57-67` (comment + `partialize` excluding `user`/`isAuthReady`); `src/lib/providers.tsx:53-67` (QueryClient defaults); `src/features/admin/utils/queryKeys.ts:1-17` (hierarchical key factory sharing `USERS_PAGE_SIZE` across "query key, hook, service, and server action"); `docs/adr/002-data-layer-pattern.md` (exists at HEAD). Store inventory (3 Zustand stores, 3 contexts, 13 `onSnapshot` files): secondary `project-discovery/02 §12`.

**Interpretation.** The failure mode this avoids is the common one where server state leaks into client stores and goes stale, or where auth tokens end up in localStorage. Excluding auth from persistence is both a correctness and a security decision, and the inline comment explaining *why new keys need no migration* shows the persistence contract was thought through. Centralized query-key factories eliminate the classic React Query cache-invalidation-mismatch bug — which the git history shows was learned concretely (`af67c5a fix(admin): invalidate dashboard cache with matching query key`) and then structurally prevented.

**Confidence.** High — store, provider, and key-factory files read directly; ADR existence verified.

---

### S-15 — An ESLint-enforced audio boundary that makes a past failure class unrepresentable

**Dimension:** coupling, module boundaries

**Observation.** ESLint bans `Audio`, `AudioContext`, `webkitAudioContext`, `SpeechSynthesisUtterance`, and `window.speechSynthesis` as errors across `features/**`, `app/**`, and `lib/**`, forcing all sound through `@/shared/audio`. The rule's comment names the concrete historical failure it prevents ("two competing singletons, a user setting that only half the app honoured, and failures nothing could observe") and cites ADR-001. The subsystem behind the boundary has its own README documenting a three-rule contract (every request declares its trigger; cues and voice on separate channels; handles never throw/reject), and its core modules (`manager`, `policy`, `sequencer`, `status`, `telemetry`, `voice/googleTranslateTts`) each have colocated unit tests.

**Evidence.** `src/eslint.config.mjs:23-57` (the restriction block with rationale and ADR citation); `src/shared/audio/README.md:1-40` (usage contract and rules); directory listing of `src/shared/audio/` at HEAD (6 test files); `docs/adr/001-audio-architecture.md` (exists).

**Interpretation.** This is the strongest possible form of a module boundary: not documentation, not review convention, but a lint *error* that makes the undesired coupling unwritable — and it was installed in response to a real incident, which the rule text preserves as institutional memory. The boundary encloses a genuinely cohesive subsystem (single policy-enforcement point for the auto-play setting, per the README's rule 1), so the enforcement protects an invariant that actually matters to product behavior and accessibility (independent SFX/voice muting).

**Confidence.** High — rule, README, and test files all read/listed directly at HEAD.

---

### S-16 — Reusable shared primitives that are tested as primitives

**Dimension:** reusability

**Observation.** `src/shared/components/ui/` holds ~25 design-system primitives (Button, Card, Modal, ConfirmModal, Select, DatePicker, Drawer, SettingsMenu, DialogChrome, Input, Textarea, Alert, Badge, EmptyState, StatCard, etc.) exported through a barrel; the interactive ones are built on the headless `@base-ui/react` library and carry their own real-browser tests. Shared zod schemas (`lesson`, `card`, `comment`, `ai-output`) each have unit tests. `src/shared/utils/reorder.ts` provides fractional-indexing ordering shared across features, with a header documenting why it replaced midpoint averaging and how legacy numeric keys are handled. The `game` feature exposes a reusable session/scoring/tier engine (domain functions, `useGameSession`, intro/results screens, stat components) consumed by both `flashcard` game modes and `kana`.

**Evidence.** Directory listing of `src/shared/components/ui/` (with `index.ts` barrel, 7 `*.browser.test.tsx` files); `@base-ui/react` imported by 7 shared primitives (grep at HEAD); schema tests `src/shared/schemas/*.schema.test.ts` (4 files); `src/shared/utils/reorder.ts:1-17` (rationale header) + `reorder.test.ts`; game reuse verified by grep — flashcard imports `@/features/game/{domain,services,components,hooks}` (`comboMultiplier`, `scoreToTier`, `GameResultsScreen`, `useGameSession`, …), and kana→game imports exist (secondary count: `project-discovery/02 §4`).

**Interpretation.** Reusability here is earned, not aspirational: the primitives are consumed across features, sit on a headless library (so behavior/a11y logic is not hand-rolled per component), and — unusually — are tested at the primitive level in a real browser, which means every consumer inherits verified focus/keyboard behavior for free. The reorder utility shows the right instinct of extracting *hard* shared logic (precision-safe ordering) rather than only trivial UI. The game engine functioning as an internal library for two other features is real cross-feature reuse, albeit at the cost of coupling (assessed separately in the weaknesses document).

**Confidence.** High — listings, imports, and test files verified directly.

---

### S-17 — i18n with zero key drift and locale-aware copy design

**Dimension:** i18n (cross-cutting), accessibility

**Observation.** The two message catalogs are in perfect structural parity: 803 flattened keys in `en.json`, 803 in `ja.json`, with **zero** keys present in one and missing in the other (measured at HEAD). 157 production files consume translations via `useTranslations`/`getTranslations`. Metadata strings are localized with per-locale grammatical care (two distinct message variants because "the owner attribution sits at the front of the sentence in Japanese"), and locale routing generates per-locale alternates. Recent commits actively hunt residual hardcoded strings (`6368c36 fix(ui): i18n-extract LoadingSpinner's hardcoded subtitle string`).

**Evidence.** Key parity computed directly at HEAD (flatten-and-diff over `src/messages/en.json` / `src/messages/ja.json`: en-only 0, ja-only 0); consumer count via grep (157 files); `src/app/[locale]/(main)/flashcard/shared/[shareId]/page.tsx:54-63` (variant-based owner attribution with the Japanese word-order comment), `:40-47` (locale alternates); `src/i18n/routing.ts` (as-needed prefixing, secondary `project-discovery/02 §2`); git log at HEAD.

**Interpretation.** Key drift is the canonical way bilingual apps rot (fallback English leaking into the secondary locale); zero drift across 803 keys under active development indicates the catalogs are maintained as a unit. The sentence-structure-aware message design shows the i18n is genuine localization rather than string substitution — significant for an app whose subject matter *is* Japanese. This measurement is new evidence: the discovery corpus recorded the i18n mechanism but never measured parity.

**Confidence.** High — parity is a direct computation, not a sample.

---

### S-18 — Measured, mechanism-backed performance engineering

**Dimension:** performance

**Observation.** Performance work is specific and instrumented rather than folkloric: (1) `LazyMotion` loads motion features via dynamic `import()` so `domMax` code-splits into its own chunk, with `strict` mode throwing if a bare `motion.*` component would reintroduce the unshaken import — and the comment cites a byte-level measurement from a prior commit explaining why the dynamic form is required; (2) long lists (admin logs, notifications) render through `@tanstack/react-virtual`; (3) fonts are self-hosted via `next/font` and were pruned from 6 families to the 3 actually referenced, with the dead ones named; (4) the public shared-deck page streams — the server component starts an un-awaited Admin-SDK preview promise and the client unwraps it with `use()` under `Suspense`, so shell paint is not blocked on Firestore; (5) React Query defaults (`staleTime: 30s`, no focus refetch) prevent request storms; (6) card reordering writes fractional-index keys instead of renumbering entire lists.

**Evidence.** `src/lib/providers.tsx:69-81` (code-split rationale citing the E11-T1 measurement; `strict` guardrail); virtualization consumers `src/features/admin/components/reports/LogsVirtualList.tsx`, `src/app/[locale]/(main)/notifications/_components/NotificationsVirtualList.tsx` (both with browser tests); `src/lib/fonts.ts:1-13` (pruning rationale naming dropped families); `src/app/[locale]/(main)/flashcard/shared/[shareId]/page.tsx:87-98` (un-awaited promise + Suspense) and `SharedLessonPageClient.tsx:34,59` (`use(previewPromise)`); `src/lib/providers.tsx:53-67`; `src/shared/utils/reorder.ts:1-17`.

**Interpretation.** Each optimization targets a real cost class (bundle bytes, DOM node count, font transfer, TTFB on the only SEO-relevant page, network chatter, write amplification), and two of them are *guarded against regression* (LazyMotion `strict` throws; browser tests pin the virtual lists). The reference to a measured byte-identical comparison in the code comment is the tell that this is evidence-driven performance work, not cargo-culting. No systematic performance budget or monitoring exists in-repo, which caps this finding at the mechanism level.

**Confidence.** High for the mechanisms cited (all read directly); no claim is made about measured runtime outcomes, which the repo alone cannot evidence.

---

### S-19 — Accessibility treated as a testable contract

**Dimension:** accessibility

**Observation.** Interactive primitives are built on the headless, accessibility-focused `@base-ui/react` (Modal, Select, DatePicker, SettingsMenu, ConfirmModal, Drawer, DialogChrome); ARIA attributes appear in 48 component files (50× `aria-label`, plus `aria-modal`, `aria-sort`, `aria-checked`, `aria-invalid`, `aria-pressed`, `aria-live`, `aria-describedby`, etc.); the browser test suite explicitly asserts the keyboard/focus contract — focus moves into dialogs on open, Escape closes, Tab is trapped ("Outside button (must never receive focus)"); Storybook is configured with `@storybook/addon-a11y`; and the audio architecture separates SFX and voice channels with an explicit screen-reader-user rationale.

**Evidence.** Grep at HEAD: 48 files with `aria-*`, distribution as above; `src/shared/components/ui/Modal.browser.test.tsx:8-9` ("this is exactly the a11y contract (focus management, Tab trap, Escape) that jsdom can't reliably prove"), `:32,43,55-71` (the three contract tests); base-ui imports in 7 shared primitives + 3 feature components; `.storybook/main.ts:17` (`@storybook/addon-a11y`); `src/shared/audio/README.md` rule 2 ("Screen-reader users routinely want exactly that combination").

**Interpretation.** Delegating focus/ARIA mechanics to a headless library and then *testing the resulting contract in a real browser* is the strongest a11y posture available short of audits: the app neither hand-rolls dialog semantics (the usual source of broken modals) nor merely trusts the library. The rationale in the audio README shows a11y thinking beyond the visual layer. The evidence stops short of full coverage claims: there is no automated axe/WCAG scan wired into CI, no visible focus-order testing outside the primitives, and only 1 story file exists for the a11y addon to scan — so breadth across whole pages is unproven.

**Confidence.** Medium — the primitive-level evidence is direct and strong, but page-level/systemic coverage cannot be verified from the repo.

---

### S-20 — Developer experience: heavy gates, traceable history, reasoned code

**Dimension:** developer experience

**Observation.** (1) The husky pre-commit hook runs `lint-staged` (eslint --fix + prettier on staged files), a full-tree prettier pass, and a complete production build before any commit lands. (2) The last 138 commits follow conventional-commit format with scopes and epic/task IDs (`E17-T10`, `E15-T5`, …), and subjects that state the *reason* ("close a lost-update race", "read timer elapsed before stopping it"). (3) Three ADRs record architecture decisions and are cross-referenced *from code* (the ESLint rule cites ADR-001; `flags.ts` cites ADR-003). (4) Nearly every non-trivial module opens with a rationale doc-comment explaining why it exists and what failure it prevents (safe-action, firebase-admin, flags, id.ts, registry.ts, all four test configs, the CI workflow, proxy.ts). (5) Emulator workflows are one-command (`npm run test:emu`, `emulators:start:all`), and Playwright pins its own port/emulator so it "can never activate outside an actual Playwright run".

**Evidence.** `src/.husky/pre-commit` (all three stages with comments); `git log --oneline` at HEAD (25 most recent commits verified conventional + epic-tagged); `docs/adr/00{1,2,3}-*.md`; code→ADR cross-references at `src/eslint.config.mjs:27` and `src/lib/flags.ts:4-5`; `src/package.json` scripts; `src/playwright.config.ts:3-9`.

**Interpretation.** The distinguishing DX property here is that *context survives*: decisions live in ADRs, incidents live in lint-rule comments, migration rationale lives in module headers, and history is greppable by epic. A newcomer (or an AI agent) can reconstruct why almost any structure exists without archaeology — which is rare at any codebase size. The pre-commit full-build gate is unusually strict (and self-aware about its cost: "This can be slow. Remove if it hampers your workflow"), trading commit latency for a never-broken main, consistent with the repo's small-team reality.

**Confidence.** High — hook, log, ADRs, and cross-references all verified directly.

---

### S-21 — A non-blocking, spoof-resistant audit-log pipeline plus gated observability

**Dimension:** logging

**Observation.** Client-originated audit logs flow through one facade (`enqueueClientLog`) that is void-async and swallows all errors ("UI and core flows are never blocked"), into token-verified Server Actions; the user-log action explicitly rejects userId spoofing against the verified token; log inputs are zod-validated server-side (`systemLogInputSchema`); shared scaffolding (`lib/logging/activity.ts`) backs the per-feature activity-log actions so five features share one write path. Sentry initializes only in production with a DSN present (client and server separately gated); PostHog ingests through a first-party `/ingest` reverse proxy in `proxy.ts` and is likewise prod-gated. Firestore rules deny all client writes to `system_logs` and allow reads only to system admins.

**Evidence.** `src/lib/logging/browser.ts:9-21` (facade contract); `src/lib/logging/user-actions.ts` (spoof rejection; secondary `project-discovery/02 §11.1`, emu-tested via `user-actions.emu.test.ts` at HEAD); `src/lib/logging/server.ts` (`systemLogInputSchema`, secondary `project-discovery/02 §10`); consolidation commit `bbd1534 refactor(logging): consolidate activity-log write path`; Sentry gates `src/instrumentation.ts`/`instrumentation-client.ts` (secondary, paths verified at HEAD); PostHog proxy `src/proxy.ts:20-21,50-55`; `src/firestore.rules:199-202` (secondary `project-discovery/02 §7.1`).

**Interpretation.** The logging design gets the two hard trade-offs right: telemetry can never degrade the product (structural fire-and-forget at the single entry point, not per-call-site discipline), and the audit trail is trustworthy because identity is taken from the verified token rather than the payload — a property covered by an emulator test. Gating Sentry/PostHog on production + configuration keeps development noise-free and makes the "code-complete, activation needs credentials" state explicit rather than half-initialized.

**Confidence.** High for the client pipeline and gating (read directly); Medium for line-precise details of `server.ts`/`user-actions.ts` internals (existence and test coverage verified; full files not re-read).

---

## Dimensions with no strength claimed

- **Code ownership.** The repo is effectively single-author (git: 131 + 7 commits under two spellings of the same name), and there is no `CODEOWNERS` file, review process artifact, or ownership map. The observable *consistency* of conventions is plausibly a byproduct of single authorship rather than an ownership structure, so no strength is claimed. Evidence is insufficient to assess how the architecture would hold up under multi-contributor ownership — the absence of mechanical import-boundary enforcement (noted in S-1) is the relevant risk, and it belongs to the weaknesses document.

## Where evidence is otherwise insufficient

- **Runtime performance outcomes** (S-18): the repo evidences mechanisms and one cited byte-level measurement, but no bundle budgets, Lighthouse/Core-Web-Vitals data, or perf monitoring exist in-repo; no claim is made about actual field performance.
- **Page-level accessibility** (S-19): primitive-level contracts are proven; whole-page keyboard flows, contrast, and screen-reader journeys are not evidenced (no axe/WCAG automation in CI; a single `.stories.tsx` file limits the a11y addon's reach).
- **Operational behavior of deployed Functions** (touching S-10): `fanOutNotifications`/`deliverNotificationTask` are emulator-tested but stated by their own header to have no in-app producer; whether they are exercised operationally is unobservable from the repo (matches `project-discovery/12` U-entries).
- **Test depth vs. breadth**: suite *placement* is evaluated (S-10); no coverage metrics exist in-repo, so nothing is claimed about percentage coverage.

## Discrepancies found vs. the discovery corpus

Re-verification found the discovery corpus accurate on every load-bearing claim checked (layer-import greps, the 10+10 server-file counts, both safe-action families, the lazy Proxy, the collapse transaction, the ESLint audio rule, flag fallbacks, store partialize, rules guards, test-config split). Three refinements, none contradictory:

1. **"Four-way test split" undercounts.** Counting the separately-packaged `src/functions/` emulator suite and the Storybook test project embedded in `src/vitest.config.ts`, the real structure is five suites (unit+storybook / browser / app-emulator / functions-emulator / E2E). Discovery's framing was per-config-file and internally consistent, but the assessment uses the fuller count (S-10).
2. **Ambiguous path in discovery 02 §8.** "daily-stat increments (`progress.service.ts:288-298`)" resolves to `src/features/flashcard/services/progress.service.ts` (verified — `incrementDailyReviewCount` at lines 288-298); the file lives in the flashcard feature, not the user feature its surrounding prose might suggest.
3. **New measurement, not in discovery:** i18n key parity (803/803, zero drift both directions) was computed fresh for S-17; discovery documented the i18n mechanism but never measured catalog parity.
