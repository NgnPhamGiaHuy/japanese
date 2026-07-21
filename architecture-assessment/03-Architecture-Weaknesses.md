# 03 — Architecture Weaknesses

**Architecture Assessment phase.** This document evaluates what creates complexity, debt, or risk in the codebase. It describes weaknesses and their consequences only — it proposes no remedies, libraries, refactors, or tasks.

- **Repo root:** `/Users/yuh.nguyenpham/GitHub/japanese`; Next.js project root is `src/`. Paths below are relative to `src/` unless prefixed with `/` or `docs/`.
- **Method:** every load-bearing claim was re-verified directly in the repository at assessment time (2026-07-19, branch `main`); the discovery corpus (`/project-discovery/00–14`) is cited as secondary evidence (`discovery §`). Where discovery and repo disagreed, the repo wins and the disagreement is noted (see *Discovery-vs-repo discrepancies* at the end).
- **Scope rule:** weaknesses of the code are findings; unknowns about production state are **not** findings — they are cross-referenced in the final section.

---

## Summary table

| ID | Dimension | Finding | Confidence |
|---|---|---|---|
| W-1 | Module boundaries / coupling | `flashcard` ↔ `notifications` directory-level import cycle, both directions value imports | High |
| W-2 | Dependency direction / layer separation | `lib/logging` (shared layer) imports types from `features/admin` — the lib layer depends on a feature | High |
| W-3 | Module boundaries | No enforced per-feature public API: 2 of 9 features have root barrels; cross-feature imports reach deep internal paths; no boundary lint rule | High |
| W-4 | Cohesion / coupling | `flashcard` is a 16,940-line mega-feature (34% of all feature code) mixing six sub-domains; most cross-feature traffic and the only feature cycle terminate in it | High |
| W-5 | Feature organization | Feature UI split across layers: kana-survival's four screens live under `app/`, its logic under `features/kana`; sibling modes live wholly in `features/` | High |
| W-6 | Code ownership | Bus factor of one: all 138 commits are a single author | High |
| W-7 | Firebase architecture / type integrity | `AppNotification.type` is a 4-value TS union while the same codebase writes 10 distinct runtime values into that field | High |
| W-8 | Cohesion / dead vocabulary | Large dormant vocabularies: 7/16 `NotificationKind`s, 8/32 `ActivityAction`s, and `LogSource "cloud_function"` have zero producers | High |
| W-9 | Layer separation / validation | Three exported schemas are enforced on no write path, while their own headers claim they are the validation source of truth | High |
| W-10 | Feature organization | Admin surface ships non-functional UI: three handler-less Quick Action buttons, a stub Settings page, and a permission (`canChangeSettings`) no action ever requires | High |
| W-11 | Firebase architecture / error handling | Admin analytics/stats read collections (`analytics_daily`, `metadata/counters`) that no repo code writes, silently substituting fabricated zeros | High |
| W-12 | API architecture | Three coexisting server-write families plus duplicated mechanisms for pagination, forms, and dialogs — per-task decision overhead and drift surface | High (existence) / Med (cost) |
| W-13 | Reusability / Firebase architecture | Shared-deck access policy is encoded three times (client RBAC resolver, Admin-SDK preview service, Firestore rules) that must agree by hand | Med |
| W-14 | API architecture / performance | Server rendering is largely defeated: a client-side auth splash gates almost every route; 244 `"use client"` files, no `loading.tsx`, one `Suspense` | Med |
| W-15 | Security | Edge auth gate checks only cookie *presence*; the cookie is the raw Firebase ID token, deliberately non-httpOnly, JS-readable | High (facts) / Med (impact) |
| W-16 | Testing | Test coverage is inverted relative to risk: pure leaf domains are well tested; core mutation services, game-session hooks, and the sharing-RBAC resolver have zero tests | High |
| W-17 | Logging / error handling | Production visibility gap on the client: 59 `console.error` sites vs 3 files shipping client logs; 17 swallow-all catches include the audit-trail writes | High |
| W-18 | Performance | Admin log search fires a server action + Firestore query per keystroke; notifications "load more" re-reads the entire window; memoization is nearly absent | Med |
| W-19 | Shared infrastructure | Runtime dependence on uncontracted external endpoints: undocumented Google Translate TTS, KanjiVG `master` branch raw fetch, Google Fonts CSS at OG-render time | High |
| W-20 | Configuration management | Config that must be kept in sync by hand: duplicated public-route allowlists, two different env vars for the same `APP_ID`, no `.env.example`, localhost `SITE_URL` fallback | High |
| W-21 | Developer experience / reusability | Declared standards diverge from reality: 200-line lint ceiling as warning with 44 files over it; full Storybook toolchain with one story; dead `Drawer` primitive while a feature hand-rolls the same drawer; docs index missing ADR-003 | High |
| W-22 | Accessibility | Sampled a11y posture is largely sound; residual gap: one bespoke popover menu without menu semantics or keyboard dismissal; no full audit performed | Low–Med |

**Dimensions with no standalone finding:** *state management* — the three Zustand stores, three contexts, and single QueryClient each have a clear owner and documented rationale (discovery §08 §6, §10 §18.7); no material weakness was found beyond aspects folded into W-14/W-18. *Dependency direction among features* (beyond W-1/W-2) is otherwise clean: `game` and `ai` import no other feature, and `shared/` imports neither `lib/` nor `features/` (verified: zero grep hits; discovery §08 §1.3).

---

## Structure and boundaries

### W-1 — Feature-level import cycle: `flashcard` ↔ `notifications`

**Observation.** The two features import each other with value (not type-only) imports: flashcard calls notifications' emit services in three files, and notifications' `InviteActions` calls back into flashcard's server action.

**Evidence.** Re-verified by grep:
- `features/flashcard/components/ShareModal.tsx:12`, `features/flashcard/services/comment.service.ts:29`, `features/flashcard/services/access.service.ts:11` → `@/features/notifications/services`
- `features/notifications/components/InviteActions.tsx:8` → `declineInviteAction` from `@/features/flashcard/actions/access.actions`
Discovery §08 §1.4 (Cycle A). No module-level cycle exists among the four files themselves.

**Interpretation.** Neither feature can be built, tested, extracted, or reasoned about without the other. The cycle is asymmetric in nature — flashcard treats notifications as an outbound service, while notifications' UI reaches back into flashcard's write path — which means the "notifications" feature is not actually a leaf messaging capability but is entangled with deck-access domain logic. Any future module-boundary enforcement (lint rule, package split, ownership split) hits this cycle first, and changes to invite semantics ripple in both directions.

**Confidence.** High — both legs are direct import statements verified in the repo.

### W-2 — Shared `lib/` layer depends on a feature: `lib/logging` → `features/admin`

**Observation.** `lib/logging/public.ts` imports its core log types (`AdminLog`, `LogLevel`, `LogSource`, `LogType`) from `features/admin/types`, while `features/admin` imports `lib/logging` back in two files — a directory-level cycle whose lib→feature leg is type-only.

**Evidence.** Re-verified: `lib/logging/public.ts:1` (`import type { AdminLog, LogLevel, LogSource, LogType } from "@/features/admin/types"`); reverse edges `features/admin/services/log.service.ts:8-9` and `features/admin/actions/admin.actions.ts:8`. Discovery §08 §1.4 (Cycle B).

**Interpretation.** The canonical vocabulary of the app-wide logging pipeline is *owned by the admin feature that consumes the logs*, inverting the expected direction (shared infrastructure defines, features consume). Every feature that logs (`flashcard`, `kana`, `notifications`, `user` all import `lib/logging`) transitively depends on admin's type definitions. Renaming or reorganizing admin types can break the logging layer; extracting logging into a package is impossible without dragging admin types along. Being type-only, it is erased at runtime — the cost is structural and tooling-facing (build graph, refactor blast radius), not behavioral.

**Confidence.** High — direct import statements; type-only nature confirmed.

### W-3 — No enforced feature public API; deep cross-feature imports

**Observation.** Only 2 of 9 features (`home`, `command-palette`) expose a root `index.ts`. Cross-feature imports routinely target internal paths — subdirectory barrels at best, single files at worst — and no ESLint rule constrains import direction or depth (the only `no-restricted-*` rules govern audio APIs).

**Evidence.** `ls features/*/index.ts` → `command-palette`, `home` only. Deep-import frequency (grep over `features/` + `app/`, tests excluded): 43 sites import `@/features/flashcard/types`, 9 import `@/features/flashcard/games/match/config`, 4 import the single file `@/features/flashcard/components/ShareModal`, 4 import `@/features/flashcard/utils/rbac`, 4 import `@/features/flashcard/services/shared-preview.service`. `eslint.config.mjs:23-58` contains only audio-API restrictions and the `max-lines` warning — no `import/no-restricted-paths`, no boundaries plugin. Discovery §08 §1.1 (secondary).

**Interpretation.** Feature "boundaries" are directory names, not contracts. Any file in any feature is reachable from anywhere, so internal reorganizations of a feature (renaming `games/match/config`, moving `ShareModal`) are repo-wide breaking changes rather than private refactors. This is also the mechanism by which W-1 arose and can recur: nothing structural stops the next convenience import from creating cycle C. The cost compounds with W-4 — the deepest and most-imported internals belong to the largest feature.

**Confidence.** High — counts reproduced by grep at assessment time.

### W-4 — `flashcard` is a mega-feature and the codebase's gravitational center

**Observation.** `features/flashcard` is 146 files / 16,940 lines — 34% of all feature code, ~1.9× the next feature (admin, 8,781) — and internally spans six loosely related sub-domains: deck dashboard, deck detail/editing, sharing/access/comments, import + AI panels, per-card progress/SRS, and three full game modes including a state-machine game engine (`games/speed/engine/`).

**Evidence.** Line counts re-verified against discovery §11 §1.3 (spot-checked: `find features/flashcard -name '*.ts*' | wc -l` matches). Sub-domain directories: `ls features/flashcard/` → `actions components dashboard detail domain games hooks loaders services types utils`. Inbound coupling: app→flashcard is the largest route edge (33 sites), `home` imports 7 flashcard internals, `admin` 6, `notifications` 1 (the W-1 cycle) — discovery §08 §1.1–1.2, spot-verified. Of the 25 largest files in the repo, 14 are flashcard files (discovery §11 §2).

**Interpretation.** Cohesion inside the feature is low: sharing/comments (a collaboration domain), SRS progress (a learning-science domain), and arcade game engines (a game domain) share one namespace, one `types` barrel (43 external import sites), and one services directory. The practical costs: (a) the feature cannot be owned, reviewed, or tested as a unit; (b) unrelated concerns churn together — a game tweak and an access-control fix touch the same import graph; (c) every other feature's compile-time fate is tied to flashcard internals via W-3's deep imports. The existence of a separate `game` feature (generic session/leaderboard/tier logic) while three concrete games live *inside* flashcard and two more kana games live elsewhere shows the game domain has no single home.

**Confidence.** High for the measurements; Medium for the severity interpretation (the sub-domains are at least directory-separated internally, which mitigates day-to-day navigation cost).

### W-5 — Feature UI split between `app/` and `features/`: kana survival (and notifications)

**Observation.** The kana survival game's four screen components (483 lines) live under the route tree (`app/[locale]/(immersive)/kana/survival/_components/`), while its state hooks (`useSurvivalGame`, `useDropMode` — 666 lines combined) live in `features/kana/hooks/`. Sibling modes practice and quiz are wholly inside `features/kana/` and their routes are one-line orchestrators. The notifications inbox list is similarly split (`app/[locale]/(main)/notifications/_components/NotificationsVirtualList.tsx` vs `features/notifications/`).

**Evidence.** Re-verified: `find "app/[locale]/(immersive)/kana/survival" -type f` → `page.tsx` + 4 `_components/*.tsx` (483 lines total); `app/[locale]/(immersive)/kana/practice/page.tsx` is a pure orchestrator importing `@/features/kana/practice`; `features/kana/` contains `practice/`, `quiz/`, but no `survival/`. Discovery §08 §1.2, §11 §1.3 (secondary).

**Interpretation.** One game mode's implementation is bisected across the two architectural layers the repo otherwise keeps distinct ("routes orchestrate, features implement"). Consequences: survival screens can't be found where every sibling lives; the feature's dependency graph is misleading (app→game and app→kana edges exist *only* because of survival's displaced screens — discovery §08 §1.2 attributes `app → game` 4 sites to survival `_components`); and any convention-based tooling or ownership rule keyed on `features/` silently excludes this code. The same erosion pattern appearing twice (survival, notifications list) suggests placement is decided ad hoc per surface.

**Confidence.** High — file placement verified directly.

### W-6 — Single-author knowledge concentration

**Observation.** Every commit in the repository is by one person: 133 commits as `NgnPhamGiaHuy` plus 7 as `Nguyễn Phạm Gia Huy`, both `yuh.nguyenpham@gmail.com` — 138 total, no second contributor.

**Evidence.** `git shortlog -sne --all`; `git rev-list --count main` → 138.

**Interpretation.** Bus factor of 1. All tacit knowledge — why the two RBAC systems differ, the notification vocabulary migration end-state (W-7/W-8), the intended enforcement points of the orphaned schemas (W-9), the admin bootstrap procedure (out of repo entirely, discovery §12 U-14) — resides with a single person. The unusually heavy in-code rationale comments partially mitigate this, but several intent questions are explicitly unanswerable from the repo (discovery §12 documents fifteen of them), meaning departure of the one author converts every "unknown" in that document into a permanent unknown.

**Confidence.** High — git history is exhaustive evidence for authorship; interpretation of mitigation is Medium.

---

## Contracts, vocabularies, and dead surface

### W-7 — `AppNotification.type` is typed as 4 values; the codebase writes 10

**Observation.** `NotificationType = "invite" | "comment" | "reply" | "role_change"` types the stored `type` field, but the server writer persists `type: input.kind` for any of the 9 active `NotificationKind`s, and the digest Cloud Function writes a 10th value, `"digest"`.

**Evidence.** Re-verified: `features/notifications/types/index.ts:5` (union), `:47` region (`type: NotificationType` on `AppNotification`); `features/notifications/actions/notification.actions.ts:209` (`type: input.kind`); `functions/src/digest.ts:82` (`type: "digest"`). Firestore rules validate the 4-value list only on the client-written `pendingNotifications` path; server writes bypass rules. Discovery §12 U-5 (secondary).

**Interpretation.** The compile-time contract for a persisted field is a lie the codebase itself tells: any consumer that exhaustively switches on `NotificationType`, narrows with it, or trusts it for parsing will silently mishandle 6 of the 10 real values. The renderer survives only because `NotificationIcon` deliberately widens to `string` with a default branch — i.e., correctness currently depends on *not* trusting the type. This also poisons future work: a migration, a preference matrix, or an analytics breakdown keyed on the union will be wrong on live data, and TypeScript will confirm it as correct. The in-code comment ("reconciled as producers migrate", `domain/events.ts:11-15`) shows the divergence is known but leaves the end-state unrecorded.

**Confidence.** High — writer and union verified in-repo; the mismatch is a code fact independent of production data state.

### W-8 — Dormant declared vocabularies across three enum families

**Observation.** Substantial fractions of the app's declared event vocabularies have no producer anywhere: 7 of 16 `NotificationKind`s are registered `active: false` with zero emitters; 8 of 32 `ActivityAction` members (incl. `DECK_SHARED`, `CARD_CREATED/UPDATED/DELETED`, `KANA_PRACTICE_COMPLETED`) are never emitted; `LogSource` member `"cloud_function"` has no writer (the functions package never touches `system_logs`).

**Evidence.** Spot-re-verified by grep: zero producers for `kind: "achievement"`, `"overtaken"`, `"deck_deleted"`; zero hits for `DECK_SHARED`/`deck.shared` and `KANA_PRACTICE_COMPLETED`/`kana.practice` outside `lib/logging/actions.enum.ts`. Full member-by-member audit: discovery §12 U-4, U-6, U-7 (secondary; per-member producer table). Notably `app/[locale]/(immersive)/kana/practice/page.tsx` exists as a live route yet logs nothing, while its quiz and survival siblings log completions.

**Interpretation.** Dead vocabulary is not free: every reader of these enums (registry UI, log filters, the admin `LogSourceBadge`, exhaustiveness checks) carries branches that can never fire, and every new contributor must determine per-member whether "no producer" means *pending* or *abandoned* — a question the code cannot answer (the enum's own header says all logging "MUST use these constants", implying completeness it doesn't have). The kana-practice asymmetry is a concrete correctness consequence: activity analytics undercount one of three kana modes, invisibly. Where the audit trail is the product surface (admin Reports), declared-but-silent actions make absence-of-log indistinguishable from absence-of-activity.

**Confidence.** High for zero-producer status (grep-verified sample + discovery per-member audit); intent behind each member is unknowable (that part is documented, not asserted).

### W-9 — Schemas exported as "source of truth" but enforced nowhere

**Observation.** Three Zod schemas have zero non-test consumers: `cardContentSchema` (whose file header calls it "the single validation source of truth shared by client forms … server actions, and runtime parsing of AI/import output") and `privacyModeSchema` / `publicRoleSchema` (whose file comment says the public-role cap is "enforced by the enum itself"). Actual write paths use a narrower legacy validator (`validateAtomicCard` → primary-field checks only).

**Evidence.** Re-verified by grep: `cardContentSchema` appears only in `shared/schemas/card.schema.ts:63,82` (+ its test); `privacyModeSchema`/`publicRoleSchema` only in `shared/schemas/lesson.schema.ts:33,35` (+ tests). Sibling schemas in the same files *are* consumed (`lessonMetadataSchema`, `shareInviteSchema`), so the imports are absent, not hidden behind barrels. Enforcement that does exist: `features/flashcard/services/lesson-save.ts:61`, `features/flashcard/utils/parser.ts:147`, `features/ai/services/gemini.service.ts:39` all route through `validateAtomicCard`. Discovery §12 U-10, U-11 (secondary).

**Interpretation.** The constraints these schemas encode — `meaning`/`example`/`hint` length caps, the cloze `___` token rule, difficulty literals, the privacy-mode and public-role enums — are enforced *nowhere* on any write path. Two costs: (a) data can be persisted that violates the documented contract (e.g., nothing outside the ShareModal UI prevents an out-of-range privacy value on the client-SDK write path; Firestore rules were not verified to cover these specific fields); (b) the headers actively mislead — a maintainer who reads "single validation source of truth" and strengthens the schema will believe they tightened the system when they changed dead code. Tests exist for all three schemas, deepening the illusion of enforcement.

**Confidence.** High — the import graph is unambiguous; whether the schemas are unfinished adoption or overtaken artifacts is unknowable and stated as such.

### W-10 — Admin surface ships non-functional UI and an unenforceable permission

**Observation.** The live admin dashboard renders three Quick Action buttons ("Global Settings", "Content Audit", "Security Review") with no `onClick`, `href`, or form context; the admin Settings route is an explicit stub ("not yet wired to a backend"); and the RBAC permission `canChangeSettings` is declared in the matrix and the action-metadata enum but required by no server action.

**Evidence.** Re-verified: `features/admin/components/dashboard/QuickActionsCard.tsx:21-41` (three handler-less `<Button variant="ghost">`; JSDoc at lines 13-14 claims it "Provides immediate access to frequent administrative tasks"); `features/admin/components/settings/AdminSettingsPageContent.tsx:13-16` (self-described stub); `canChangeSettings` appears only at `features/admin/utils/rbac.ts:11,23,33` and `features/admin/services/admin.service.ts:76` — no `.metadata({ permission: "canChangeSettings" })` anywhere in `features/`. Discovery §12 U-8, U-9 (secondary; U-8's sweep found this to be the *only* no-behavior control in the repo).

**Interpretation.** For an operator, dead buttons on a dashboard are a trust defect: clicking produces nothing, with no disabled state or "coming soon" affordance to distinguish broken from unbuilt. For maintainers, the JSDoc misdescribes the component's behavior, and the orphan permission means the superadmin/admin capability matrix overstates what the system can actually gate — an auditor reading `rbac.ts` would infer a settings-mutation surface that does not exist. Small in size, but it sits on the highest-privilege surface of the app.

**Confidence.** High — all three facts verified directly.

---

## Data and API architecture

### W-11 — Admin metrics read collections nothing writes, and fabricate zeros when empty

**Observation.** `analytics_daily` is read by the admin analytics page and export action but written by no code in the repo (app, functions, or scripts); `metadata/counters` is read once as a stats cache and written by nothing. Both readers substitute synthetic data when the collections are empty: a single zeroed analytics row, and literal `0` for `activeUsersToday`, `totalSessions`, and `errorRate`.

**Evidence.** Re-verified: grep for `analytics_daily` hits only `features/admin/services/analytics.service.ts:29` and `features/admin/actions/admin.actions.ts:278` (both reads); grep for `"metadata"` collection hits only `features/admin/services/user.service.ts:65`. Fallbacks read in full: `analytics.service.ts:37-49` (fabricated base row), `user.service.ts:96-104` (zeros, with the comment "never fabricate activity metrics" — which the zeros then feed to `SystemHealthCard` and stat cards anyway). Discovery §12 U-12, U-13 (secondary).

**Interpretation.** As *code*, this is a half-built aggregation pipeline: the read side and its UI exist; the write side (scheduled job, counter increments) does not exist in this repo. The dashboard consequence is worse than missing data: "Error rate: 0" and "Active users today: 0" render identically whether the system is healthy, idle, or the cache has simply never been populated — an operator cannot distinguish truth from unpopulated fallback, on exactly the surface built to answer that question. The export action additionally hardcodes `newUsers: 0` and zeroed `featureUsage`, so exported "analytics" can be structurally fabricated. Whether an out-of-repo pipeline populates these collections in production is a separate unknown (cross-referenced below); the in-repo weakness — a read path with no write path and indistinguishable fallbacks — holds regardless.

**Confidence.** High — reader/writer inventory reproduced by grep.

### W-12 — Three server-write families and duplicated mechanism choices

**Observation.** Three write-path families coexist: (A) client Firestore SDK service modules for learner features, (B) `adminActionClient` server actions with cookie-session auth + React Query mutations for admin, (C) `actionClient` server actions taking a Firebase ID token as a bind argument for notifications/logging. Parallel duplications: two pagination mechanisms (cursor-token map vs grow-the-window resubscribe), two form mechanisms (react-hook-form+zod at 2 sites vs manual `useState` everywhere else), and two dialog mechanisms (shared `Modal`/`ConfirmModal`/`Drawer` primitives vs direct Base-UI `Dialog.Root` composition in 4 components).

**Evidence.** Families A–C: `lib/safe-action.ts:16-31` documents the two action-client split itself; `features/admin/services/admin.service.ts:65-85` (`adminActionClient`, verified in full); client-SDK services e.g. `features/flashcard/services/card.service.ts`. Pagination: `features/admin/hooks/useCursorPagination.ts` vs `features/notifications/context/NotificationsContext.tsx:42,96-100` (verified: `loadMore` grows `pageSize`, re-subscribing with a larger `limit()`). Forms and dialogs: discovery §10 §1, §2, §5, §9 (secondary; dialog counts spot-verified — see W-21 for `Drawer`).

**Interpretation.** Each variant has an articulated, in-code rationale (this is the mitigating fact), but the aggregate cost is real: a contributor adding one write endpoint must first classify it among three auth/transport models with different security properties (rules-enforced client writes vs cookie-verified vs token-bind-arg-verified), different error shapes until `toActionResult` normalizes, and different testing strategies (emulator vs unit vs browser). Cross-cutting changes — say, a new auth claim or a request-ID convention — must be implemented three times. The duplicated UI mechanisms mean conventions drift by default (already visible: `DeckDetailsPanel`'s backdrop diverges from the shared backdrop constant, discovery §10 §2).

**Confidence.** High that the variants exist (verified); Medium on the cost interpretation, since the splits are documented and partly forced by Firebase's client/Admin SDK divide.

### W-13 — Shared-deck access policy encoded three times

**Observation.** The decision "who may see this shared deck, and as what role" is implemented independently in three places: the client-side resolver (`features/flashcard/utils/rbac.ts` `resolveRole`, 5-step priority chain), the server-side anonymous preview (`features/flashcard/services/shared-preview.service.ts`, Admin SDK, its own public/link-access check), and `firestore.rules` (the enforcement of record).

**Evidence.** `shared-preview.service.ts:1-16` header read in full — it is *deliberately* separate from `shared.service.ts` for client/server bundle-hygiene reasons and re-states the policy ("Only ever returns data for decks that are genuinely public/link-accessible … private or invite-only shares resolve to null"). `utils/rbac.ts` resolver and its 9 consumers: discovery §10 §6 (secondary). Rules mirror: `firestore.rules` helper functions (discovery §10 §6; rules body only partially audited — evidence insufficient for a line-level three-way diff).

**Interpretation.** Three hand-synchronized encodings of one security policy is a classic drift surface: a change to what "link access" means (e.g., adding an "unlisted" mode) must land in client resolver, server preview, and rules simultaneously; missing one produces either information leakage (preview renders what rules would deny — the preview runs on the Admin SDK, which *bypasses rules entirely*) or phantom denials. The bundle-hygiene rationale for the split is legitimate, which is why this is drift *risk* rather than defect: no divergence was found, but nothing structural (shared predicate module, contract test) prevents one. Note also W-16: the client resolver, the one encoding that is pure and trivially testable, has no tests.

**Confidence.** Medium — duplication and the rules-bypass property are verified; absence of current divergence was not exhaustively proven (rules body not fully audited).

### W-14 — Server rendering largely defeated by the client auth gate

**Observation.** Every route except the shared-deck landing page renders behind `AuthGate`, a client component that replaces all content with a splash until Firebase auth resolves in the browser; 244 of 551 non-test files are `"use client"`; there are zero `route.ts` API routes, zero `loading.tsx` files, one `<Suspense>`, and no Next.js data-cache usage.

**Evidence.** `lib/providers.tsx:19-47` read in full (`PUBLIC_ROUTE_PATTERNS = [/^\/flashcard\/shared\/[^/]+$/]`; the comment concedes the general problem: server-rendered content "never reaches a non-JS crawler, since isAuthReady can never be true during SSR" — solved only for that one route). Counts: discovery §11 §4 (`"use client"` 244; `route.ts` 0), §10 §8 (`loading.tsx` none, one Suspense), §10 §16 (`revalidatePath`/`unstable_cache`/`"use cache"` 0 hits) — spot-consistent with repo greps performed here.

**Interpretation.** The app pays Next.js App Router's complexity (server/client component discipline, server actions, proxy middleware, per-route metadata) while forfeiting its principal rendering benefit on nearly every route: first paint for any signed-in user is splash → hydrate → auth resolve → client fetch, i.e., an SPA waterfall. For a learner-facing app this is a real TTI cost on every cold load, and it makes the framework's streaming/suspense machinery (`loading.tsx`, RSC data fetching) dead weight. It is a coherent *choice* for a realtime-Firestore app — but it is nowhere recorded as one (no ADR covers rendering strategy; `docs/adr/` has audio, data-layer, flags only), so future work may assume SSR semantics that don't actually hold.

**Confidence.** Medium — the facts are High-confidence; the cost magnitude is unmeasured (no production metrics available, and no Lighthouse run was performed here).

---

## Security

### W-15 — Presence-only edge auth over a JS-readable ID-token cookie

**Observation.** The route-protection layer (`proxy.ts`) checks only that the `auth-token` cookie *exists* — any non-empty value passes (`const token = request.cookies.get(COOKIE_NAME)?.value; if (!token && !isPublic) redirect`). The cookie's value is the raw Firebase ID token, set client-side, deliberately **not** httpOnly (so the client SDK can refresh it), `SameSite=Lax`, `max-age` 7 days — while the token inside expires hourly.

**Evidence.** `proxy.ts:81-97` and the comment at `:44-48` read in full; `shared/utils/cookie.ts:1-25` read in full (non-httpOnly rationale at lines 5-6; 7-day `MAX_AGE` at line 2). Downstream verification does exist and was verified: `features/admin/services/admin.service.ts:51-56` (`assertAdminAction` reads the same cookie but runs `adminAuth.verifyIdToken`) and every other action family verifies tokens (`lib/safe-action.ts`). Discovery §10 §7 (secondary).

**Interpretation.** Three distinct consequences. (1) The middleware provides *routing UX, not security*: `document.cookie = "auth-token=x"` renders every protected page shell. Actual data is safe — Firestore rules and server actions verify real tokens — but any future developer who adds server-side data fetching to a "protected" page, trusting the proxy gate, creates a leak; the system trains that misplaced trust. (2) A JS-readable cookie means any XSS yields the bearer ID token. This is only marginally worse than baseline (the Firebase client SDK already exposes tokens to page JS), but the cookie widens where the token travels: it rides *every* same-origin request. (3) The 7-day cookie outlives the 1-hour token by design; a stale-token cookie passes the presence gate and then fails server verification — a confusing intermediate state (page loads, all actions fail) rather than a redirect. One quoted load-bearing fact: `proxy.ts:48` — "The cookie is NOT httpOnly so Firebase client SDK can refresh it seamlessly."

**Confidence.** High on all facts (files read in full); Medium on exploit impact, because the compensating server-side verification is real and was verified — the weakness is the fragile trust structure, not a live bypass of data access.

---

## Quality infrastructure

### W-16 — Test coverage is inverted relative to risk

**Observation.** The 41 test files concentrate on pure leaf domains — notifications domain/schema (9 files), shared audio (6), shared schemas (4), UI primitives (6 browser tests), speed-game engine (2), rules (1), plus a handful of emulator and browser tests. Zero tests exist for: all flashcard data services (`lesson.service`, `lesson-save`'s diff-based batch writer, `card.service`, `progress.service` [335 lines of SRS logic], `comment.service`, `access.service`, `shared.service`), the sharing-RBAC resolver (`features/flashcard/utils/rbac.ts` — security-relevant, pure, 9 consumers), all game-session hooks (`useDropMode` 367 ln, `useMatchModeSession` 325 ln, `useKanaQuizSession` 319 ln, `useSurvivalGame` 299 ln), all admin services/actions except one emulator test (`content.service.emu.test.ts`), and `admin.actions.ts` (380 lines, 20 actions, the RBAC enforcement seam).

**Evidence.** Full test-file inventory produced by `find` (node_modules excluded) and diffed by eye against the service/hook inventories; largest-file and hook-size figures from discovery §11 §2–3 (spot-verified). Test-config split: discovery §11 §5.

**Interpretation.** The tests guard the code least likely to break users (pure formatters, schema shapes — including, per W-9, schemas nothing enforces) while the highest-consequence logic is unguarded: the diff-based save that computes create/update/delete sets against live decks, the SRS progress math, the access-role resolver that decides who can edit whose deck, and the permission-gated admin mutations (user deletion, role promotion). Refactors in exactly the places most likely to need them (W-4's oversized files) carry unbounded regression risk; the emulator/browser harnesses that could cover them demonstrably exist (they're used elsewhere), so the gap is allocation, not tooling.

**Confidence.** High — inventory is exhaustive; "zero tests" claims were checked per-module against the file list.

### W-17 — Client-side error and audit visibility is thin

**Observation.** Client errors are visible in production only if they crash one of four route-level error boundaries (which call `Sentry.captureException`); the other error path is 59 `console.error` sites, which reach no one. The client→server log pipeline (`enqueueClientLog`) exists but has exactly 2 product callers (ShareModal, AudioProvider). Meanwhile 17 catch sites swallow errors entirely (`.catch(() => {})` and empty `catch {}`), and these include the activity/audit-log writes themselves.

**Evidence.** Counts reproduced by grep at assessment time: 59 `console.error` (non-test, `features/app/lib/shared`), 17 swallow-catches, `enqueueClientLog` callers = `ShareModal.tsx`, `lib/AudioProvider.tsx` (+ its own definition). Fire-and-forget audit writes: `features/flashcard/hooks/useLessons.ts:109-114` and analogous sites (discovery §10 §17, §18.4, secondary). Boundaries: `app/global-error.tsx`, `app/[locale]/(main)/error.tsx`, `(immersive)/error.tsx`, `login/error.tsx` (discovery §10 §17).

**Interpretation.** Two distinct costs. *Operationally*: a Firestore write that fails inside a service `catch` (permission change, quota, offline) logs to the user's own console and vanishes — production failure modes below the crash threshold are invisible, and even the crash threshold depends on a Sentry DSN whose existence is unknowable from the repo (cross-referenced below). *For the audit trail specifically*: every activity-log call is fire-and-forget with a swallowing catch, so the `system_logs`/activity record the admin Reports page presents as an audit surface is best-effort by construction — gaps in it are undetectable and unalarmable. That is a coherent choice for engagement telemetry, but the same pipeline carries security-adjacent events (login logging, role changes via `notifySystemEvent`), where silent loss has different stakes.

**Confidence.** High — counts and call sites verified; the Sentry-DSN caveat is flagged as a production unknown, not asserted either way.

### W-18 — Per-keystroke server queries and other avoidable hot paths

**Observation.** (a) The admin Reports free-text search feeds each keystroke into the filter object, which is part of the React Query key, so every keystroke fires `fetchLogsAction` — a server action performing a Firestore query — with no debounce anywhere in the repo. (b) Notifications "load more" grows the realtime window by re-subscribing with a larger `limit()`, re-reading all previously loaded documents each time (50, then 100, then 150 …). (c) Memoization is nearly absent where lists re-render: exactly 1 `React.memo` component repo-wide.

**Evidence.** (a) `features/admin/components/reports/LogsFilters.tsx:90-94` (`onChange({ ...filters, search: v || undefined })` directly from the input) → `features/admin/hooks/useLogs.ts:27-33` (`queryKey: adminQueryKeys.logs(filters, cursorId)`, `queryFn` → `fetchLogsAction`); grep `debounce` → only game score persistence + an audio comment (discovery §10 §12, re-verified). (b) `features/notifications/context/NotificationsContext.tsx:42,96-100` read directly; the growth mechanism is documented in-code. (c) discovery §10 §16 (1 `React.memo`, 65 `useMemo`), spot-consistent.

**Interpretation.** (a) is a cost *and* UX defect on an admin surface: typing "permission" issues ~10 sequential Firestore-backed server round-trips, each cached under a distinct key (so the cache fills with dead entries), with results racing the keystrokes. (b) makes reading page N cost O(N·page) cumulative document reads — self-limiting at inbox scale but a Firestore billing/latency shape worth naming since the code chose it deliberately (the rationale comment trades this for realtime consistency). (c) matters mainly where drag-and-drop re-renders card grids. None of these is architectural rot; they are concrete, bounded hot spots.

**Confidence.** Medium-High for (a) (mechanism fully traced in code; actual Firestore read counts per keystroke depend on `fetchLogsAction`'s server-side filter behavior, which was not traced to the query level here); High for (b); Medium for (c) (no profiling performed).

### W-19 — Runtime dependence on uncontracted external endpoints

**Observation.** Three user-facing capabilities depend at runtime on endpoints with no contract: TTS audio fetches `https://translate.google.com/translate_tts` (an undocumented, rate-limited Google endpoint — the file's own header calls it "the known-fragile one"); kana stroke animations fetch SVGs from `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/...` — pinned to the *moving* `master` branch; the shared-deck OG image fetches Google Fonts CSS server-side at render time.

**Evidence.** Re-verified: `shared/audio/voice/googleTranslateTts.ts:31` (endpoint const; header lines 4-13 document the fragility and a `speechSynthesis` fallback); `features/kana/components/KanaStrokeAnimation.tsx:14` (raw.githubusercontent URL with `master` in the path); `app/[locale]/(main)/flashcard/shared/[shareId]/opengraph-image.tsx:30` (`fonts.googleapis.com/css2` fetch). Discovery §12 §10 (secondary).

**Interpretation.** Each is a third party that owes this app nothing: Google can (and historically does) throttle or break `translate_tts` without notice — voice quality then silently degrades to `speechSynthesis`, an intentional but unobservable downgrade (per W-17, the failure counters have no production consumer); the KanjiVG `master` pin means an upstream re-layout breaks every stroke animation in production with no code change on this side, and no immutable ref (tag/commit) protects against it; the OG image inherits Google Fonts availability into its render path. The pattern weakness is uniform: no vendoring, pinning, or caching layer stands between product features and endpoints outside anyone's control.

**Confidence.** High — all three call sites verified; fallback behavior for TTS verified via header, for the others not exhaustively traced.

### W-20 — Hand-synchronized and undiscoverable configuration

**Observation.** Four configuration facts must be kept consistent by human discipline alone: (a) the public-route allowlist exists twice — `proxy.ts:9-18` (paths + patterns, incl. the opengraph-image variant) and `lib/providers.tsx:24` (a *different, narrower* regex, comment: "Mirrors proxy.ts's public-path allowlist"); (b) the tenant id `APP_ID` defaults to the same string from two different env vars in two packages (`NEXT_PUBLIC_APP_ID` in `lib/app-id.ts:1` vs `NOTIFICATIONS_APP_ID` in `functions/src/fanout.ts:126` and `digest.ts:151`); (c) there is no `.env.example` — the ~15-variable env surface (9 keys present in the untracked `.env`, plus Sentry/PostHog/site-URL/emulator/app-id vars referenced in code) is discoverable only by reading source; (d) `SITE_URL` falls back to `http://localhost:3000` behind a TODO recording that no hosting decision exists (`lib/site.ts:1-5`).

**Evidence.** All four re-verified directly (files read; `.env` confirmed git-ignored via `git check-ignore`; no `example|sample|template` env file exists). Discovery §12 U-1, U-19 (secondary).

**Interpretation.** (a) is the sharpest: the two allowlists are *already* unequal (the proxy admits `/login`, sitemap/robots, and the OG-image pattern; the AuthGate regex admits only the deck landing page), and a future public route added to one but not the other produces either a splash-hidden "public" page (SEO silently broken) or an auth splash bypass — both failure modes are quiet. (b) means one mis-set env var in either deploy target silently splits the app and its notification functions across two tenant roots (`artifacts/{appId}/…`) — notifications would simply stop arriving, with matching defaults masking the hazard until an env override diverges. (c) is a bus-factor-1 amplifier (W-6): environment bootstrap knowledge lives in one person's `.env`. (d) means metadata, sitemap, and OG URLs are wrong-by-default anywhere the env var is forgotten.

**Confidence.** High — every claim verified in-repo this session.

### W-21 — Declared standards diverge from enforced reality

**Observation.** Multiple self-imposed standards exist in degraded, non-enforced form: (a) the 200-line file ceiling is a lint *warning* with 44 non-test source files currently over it (largest: `ShareModal.tsx`, 436 lines — 2.2× the ceiling); (b) a complete Storybook toolchain (7 devDependencies, 2 npm scripts, a11y/vitest/mcp addons) supports exactly one story (`Badge.stories.tsx`); (c) the shared `Drawer` primitive has zero render sites, while `AdminSidebar` hand-builds an equivalent drawer on the same Base-UI Dialog primitive; (d) the docs index (`docs/README.md`) omits ADR-003 (feature flags) although the file exists.

**Evidence.** (a) `eslint.config.mjs:59-65` read (rule + its own comment: warning-first, "~46 pre-existing files over the limit"); recount at assessment time → 44 files > 200 lines in `features/app/shared/lib`. (b) discovery §12 U-23, re-verified (one `*.stories.*` file repo-wide). (c) grep `<Drawer` → only `shared/components/ui/Drawer.tsx` itself; `features/admin/components/shared/AdminSidebar.tsx:140-170` read (bespoke `Dialog.Root` drawer). (d) `ls docs/adr/` → three ADRs; `grep -c "003" docs/README.md` → 0.

**Interpretation.** Each item is small; the pattern is the weakness: standards exist as intent, not enforcement, so they decay silently. A permanent 44-violation warning trains contributors that lint output is noise (and buries any *new* warning in it); the one-story Storybook is pure carry cost (dependency updates, config surface) purchasing nothing; the unused `Drawer` is worse than dead code — it is a *misleading affordance*, since the next developer needing a drawer must discover that the shared one has zero precedent while the real pattern lives hand-rolled inside admin; the stale docs index quietly defeats the "read the ADR before touching the area" instruction it opens with. None of this blocks work today; all of it erodes the credibility of the repo's own rules, which for a bus-factor-1 codebase (W-6) are the main substitute for review.

**Confidence.** High — all four verified this session.

### W-22 — Accessibility: broadly sound sample with one bespoke gap

**Observation.** A structured sample found a stronger-than-typical baseline: 40 of 224 component files use `aria-*` (89 attributes), exactly one clickable non-interactive element repo-wide, `tabIndex`/focus management present in game cards, sortable items, and log rows, `prefers-reduced-motion` honored globally (CSS) and via a shared hook, and all standard overlays delegate focus/escape/labeling to Base-UI Dialog/Menu primitives. The one gap found: `SharePrivacyPicker`'s privacy dropdown is a hand-rolled popover — a full-screen click-away `<div onClick>` (`SharePrivacyPicker.tsx:105`) plus an absolutely-positioned option list — with no `role="menu"`/`listbox` semantics, no Escape-key handling, and no focus containment, in the same codebase whose `SettingsMenu` uses the real Base-UI `Menu` for the identical interaction.

**Evidence.** Greps and file reads performed this session (counts above); `features/flashcard/components/SharePrivacyPicker.tsx:90-131` read; `shared/components/ui/SettingsMenu.tsx` (Base-UI Menu) per discovery §10 §2. **Evidence insufficiency:** this is a sample, not an audit — no screen-reader pass, no keyboard walkthrough of full flows, no contrast measurement, and heading structure was not assessed. Findings here are directional.

**Interpretation.** The cost of the one verified gap is concrete: keyboard and assistive-tech users can reach the privacy options (they are `Button`s) but get no menu semantics, cannot dismiss with Escape, and the click-away layer is invisible to them — on the *sharing/privacy* control, a consequential setting to operate blind. The deeper point is the pattern from W-12/W-21 recurring in a11y form: where the shared primitive is used, accessibility comes for free; where a surface hand-rolls, it silently loses those guarantees.

**Confidence.** Low-Medium overall (sampling only); High for the specific `SharePrivacyPicker` mechanics (file read directly).

---

## Cross-reference: production unknowns (not weaknesses of the code)

These materially affect risk assessment but are facts about deployment/data state that the repository cannot answer. They are catalogued in discovery `12-Known-Unknowns.md`; listed here only where they interact with findings above:

- **Hosting/domain undecided** (U-1; `lib/site.ts` TODO) — interacts with W-20(d).
- **Whether `analytics_daily` / `metadata/counters` are populated out-of-band** (U-12, U-13) — determines whether W-11's fallbacks run constantly in production.
- **Sentry DSN / PostHog key presence** (U-15, U-16) — determines whether W-17's four boundaries report anywhere at all.
- **Deployed state of Firestore rules, indexes, TTL policy, and the three Cloud Functions** (U-19, U-20) — determines whether digest notifications and legacy-doc fallback paths (`isUnread`, dual indexes) are live load-bearing code.
- **Admin bootstrap: no repo code calls `setCustomUserClaims`; first superadmin is provisioned out-of-band** (U-14) — interacts with W-6 (the procedure exists only in the sole author's head or console history).
- **Legacy notification document shapes / backfill execution** (U-2) — determines how long the `@deprecated` fields and dual query paths (W-7's neighborhood) must survive.

---

## Discovery-vs-repo discrepancies

Re-verification found the discovery corpus accurate on every load-bearing claim checked. Minor deltas, repo authoritative:

1. **Over-limit file count:** `eslint.config.mjs`'s own comment says "~46 pre-existing files over the limit"; discovery repeats it. Recount at assessment time: **44** non-test, non-story source files > 200 lines under `features/app/shared/lib` (scope differences in what's counted plausibly explain the gap; the comment's figure is stale either way).
2. **AuthGate allowlist:** discovery §10 §7 describes providers' `PUBLIC_ROUTE_PATTERNS` as "mirroring the proxy allowlist". In the repo the two lists are **not** equivalent (proxy additionally admits `/login`, `/sitemap.xml`, `/robots.txt`, and the opengraph-image pattern) — this inequality is itself part of finding W-20(a).
3. **Author identity:** git history (not covered by discovery) shows two author-name spellings resolving to one email — a single contributor, per W-6.
