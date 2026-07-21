# 09 — Improvement Opportunities

**Architecture Assessment.** This document describes opportunities; it does not design solutions. Each entry states what could be different, the verified evidence that makes the opportunity available, and what its realization would affect — and stops there. No implementation approach, library, sequencing, or task list is proposed anywhere in this file.

- **Repo root:** `/Users/yuh.nguyenpham/GitHub/japanese`; Next.js project root `src/`. Paths below are relative to `src/` unless prefixed with `/`.
- **Evidence basis:** every file:line citation below was re-verified directly against the working tree at HEAD `a0bbbc4` during this assessment (the discovery corpus in `/project-discovery/` was used for orientation only; the repo is source of truth).
- **Conditional opportunities:** where an opportunity depends on an unanswered intent or production-state question, it is framed as a two-branch conditional (deletion-or-completion, enforcement-or-removal, activation-or-removal) whose branch is chosen by the answer to the cross-referenced question in `project-discovery/13-Questions-Before-Refactoring.md` (Q-1 … Q-17).

---

## Summary table

| ID | Category | Opportunity (short) | Prerequisite unknowns | Confidence |
|---|---|---|---|---|
| OP-1 | Standardization | Three coexisting write-path families | None blocking (Q-1 for production verification) | Medium |
| OP-2 | Standardization | Two dialog-composition mechanisms; bespoke backdrops | None | High |
| OP-3 | Standardization | Two pagination mechanisms | None | Low |
| OP-4 | Standardization | `NotificationType` union vs values actually written | Q-7, Q-5 | High (divergence) / conditional (direction) |
| OP-5 | Consolidation | Deck-access predicates re-derived outside the declared canonical engine | None | High |
| OP-6 | Consolidation | Two RBAC engines with overlapping concepts | None catalogued | Low |
| OP-7 | Consolidation | Three divergent admin-authority predicates across layers | Q-10 | High (divergence) / conditional (safe direction) |
| OP-8 | Deletion | 7 inactive `NotificationKind`s — deletion-or-completion | Q-8 | High (dormancy) / conditional (branch) |
| OP-9 | Deletion | 8 never-emitted `ActivityAction`s + `"cloud_function"` `LogSource` — deletion-or-completion | Q-11 | High (dormancy) / conditional (branch) |
| OP-10 | Deletion | Handler-less admin Quick Actions, stub Settings page, unused `canChangeSettings` — deletion-or-completion | Q-13 | High (inertness) / conditional (branch) |
| OP-11 | Deletion | Three unenforced schemas — enforcement-or-removal | Q-12 | High (non-enforcement) / conditional (branch) |
| OP-12 | Deletion | `Drawer` primitive with zero render sites — deletion-or-adoption | None catalogued (intent gap) | High (dormancy) |
| OP-13 | Deletion | Storybook toolchain vs one story; scaffold SVGs — deletion-or-adoption | Q-17 | High (state) / conditional (branch) |
| OP-14 | Deletion | `fanOutNotifications` callable with zero in-repo callers — deletion-or-completion | Q-6 | High (no callers) / conditional (branch) |
| OP-15 | Simplification | Legacy notification compatibility machinery | Q-5 | Conditional (Medium) |
| OP-16 | Deletion | Read paths on never-written collections (`analytics_daily`, `metadata/counters`) — deletion-or-completion | Q-9 | High (asymmetry) / conditional (branch) |
| OP-17 | Modularization | Kana survival screens placed outside the kana feature module | None | High |
| OP-18 | Modularization | Flashcard module's internal size skew | None | Medium |
| OP-19 | Automation | Cross-artifact vocabulary agreements are human-enforced (one has already drifted) | Q-7 (for the notification-type target) | High |
| OP-20 | Automation | Rules-coverage ↔ written-collection agreement is human-enforced | None blocking (Q-1 contextual) | Medium |
| OP-21 | Observability | Credential-gated Sentry/PostHog wiring is dormant-by-default — activation-or-removal | Q-4, Q-2, Q-1 | Conditional (High that state is unknowable in-repo) |
| OP-22 | Observability | 17 silent promise-swallow sites (+ ~20 bare `catch {}`) with no telemetry path | Q-4 | High |
| OP-23 | Testing | Four feature modules with zero coverage in any suite; largest untested surfaces | None blocking (Q-14 contextual for AI) | High |
| OP-24 | Testing | Rules test exercises a minority of the rules surface | None blocking (Q-1 contextual) | High |

---

## Standardization

### OP-1 — Three coexisting write-path families

- **Opportunity:** Standardization opportunity: the codebase performs Firestore mutations through three distinct families — client-SDK service functions, cookie-session admin server actions, and idToken-bind-arg server actions — and the number of coexisting families could be smaller than three.
- **Category:** Standardization
- **Evidence (verified):**
  - The two server-action families and the reason for their split are documented in `lib/safe-action.ts:14-31` (`actionClient` + idToken bind-arg vs `adminActionClient` + cookie session).
  - Family A (client SDK): e.g. `features/flashcard/services/card.service.ts:107-148` (`createCard`/`updateCard`/`deleteCard`/`reorderCards`), plus the other learner-facing `*.service.ts` modules.
  - Family B (admin): `features/admin/actions/admin.actions.ts:59-353` — 20 exported actions, run through `adminActionClient` (`features/admin/services/admin.service.ts:65-85`).
  - Family C (idToken bind-arg): `features/notifications/actions/notification.actions.ts:66`; `features/notifications/actions/activity-log.actions.ts:48-142` (5 chains); `lib/logging/user-actions.ts`.
  - Result normalization back to a single `{ok,data}|{ok,error}` shape exists only for B and C (`lib/safe-action.ts:52-60`).
- **What realization would affect:** every mutation in the app; the location of identity verification (Firestore rules for A, cookie session for B, inline `verifyIdToken` for C); error-shape conventions consumed by hooks; the Firestore rules surface (family A is the only one rules actually constrain — Admin SDK writes in B/C bypass rules).
- **Prerequisite unknowns:** none blocking on intent; Q-1 (production Firebase project/credentials) governs whether any change to server-action families can be verified against production behavior.
- **Confidence that the opportunity is real:** Medium. The three families verifiably coexist, but part of the split is documented as deliberate (`lib/safe-action.ts:14-31` explains why two server clients exist), and family A's client-SDK writes underpin realtime listeners — full convergence may not be structurally available; reduction below three is the observable headroom.

### OP-2 — Two dialog-composition mechanisms

- **Opportunity:** Standardization opportunity: overlay UI is built two ways — through the shared primitives (`Modal`/`ConfirmModal`/`Drawer` on shared chrome) and through direct Base UI `Dialog.Root` composition in four feature components, two of which hand-build slide-panels of the exact shape the unused shared `Drawer` provides.
- **Category:** Standardization
- **Evidence (verified):**
  - Shared primitives and chrome: `shared/components/ui/Modal.tsx`, `ConfirmModal.tsx`, `Drawer.tsx` (docstring: "a positioned Dialog"), `DialogChrome.tsx:9-10` (`DIALOG_BACKDROP_CLASSNAME`).
  - Direct `Dialog.Root` composition in feature code: `features/flashcard/components/ShareModal.tsx`, `features/admin/components/content/DeckDetailsPanel.tsx:37-46` (right-edge slide panel), `features/admin/components/shared/AdminSidebar.tsx:140-168` (left mobile drawer), `features/command-palette/components/CommandPalette.tsx` (grep for `Dialog.Root` across `features/`, non-test — exactly these four).
  - Backdrop divergence: `DeckDetailsPanel.tsx:40` uses a bespoke hardcoded backdrop (`bg-[#3c3c3c]/30`), `AdminSidebar.tsx:143` uses `bg-black/40` — neither uses `DIALOG_BACKDROP_CLASSNAME`.
  - `<Drawer` has zero render sites anywhere (see OP-12).
- **What realization would affect:** the four directly-composed overlays' markup, backdrop styling and dismiss behavior; visual consistency of backdrops app-wide; the fate of the `Drawer` primitive (coupled to OP-12).
- **Prerequisite unknowns:** none.
- **Confidence that the opportunity is real:** High. The overlap is concrete: two hand-composed slide panels coexist with an unused slide-panel primitive, and backdrop styling has already diverged from the shared constant.

### OP-3 — Two pagination mechanisms

- **Opportunity:** Standardization opportunity: paging exists in two mechanisms — cursor-token bookkeeping over one-shot admin queries, and a grow-the-window resubscribe over the realtime notifications listener.
- **Category:** Standardization
- **Evidence (verified):** `features/admin/hooks/useCursorPagination.ts:18-52` (docstring records the sequential-cursor rationale; consumers verified: `features/admin/components/users/AdminUsersPageContent.tsx`, `features/admin/components/reports/AdminReportsPageContent.tsx`); `features/notifications/context/NotificationsContext.tsx:39-104` (`PAGE_SIZE = 50`; `loadMore()` grows the live window and re-subscribes, rationale in comments at lines 39-58, 93-95).
- **What realization would affect:** admin users/reports paging UI and query keys; the notifications live window and its `hasMore` semantics.
- **Prerequisite unknowns:** none.
- **Confidence that the opportunity is real:** Low. Both variants exist, but they sit on different data channels (one-shot server actions vs an `onSnapshot` stream) and each documents its channel-specific rationale in-code; it is not established that a single mechanism could serve both channels.

### OP-4 — `NotificationType` union vs stored values (conditional)

- **Opportunity:** Standardization opportunity, contingent on the answer to Q-7: the static `NotificationType` union (4 values) and the values the same codebase actually writes into `type` (at least 10) could agree — either branch (retire, widen, or formalize the legacy union) is chosen by the recorded reconciliation target, which the repo does not contain.
- **Category:** Standardization
- **Evidence (verified):**
  - `features/notifications/types/index.ts:5` — `NotificationType = "invite" | "comment" | "reply" | "role_change"`.
  - The server writer stores `type: input.kind` for any active kind: `features/notifications/actions/notification.actions.ts:209`.
  - The digest function writes an 11th value: `functions/src/digest.ts:82` (`type: "digest"`; line 138 filters on it).
  - Firestore rules validate the 4 legacy values only on the client-written pending path: `firestore.rules:39-41,187`.
  - A consumer still branches on the legacy value: `features/notifications/components/NotificationRow.tsx:178` (`type === "invite"`).
- **What realization would affect:** every consumer of `AppNotification.type` (rendering, icon selection, filtering); the rules-side value list; the classification of digest documents; the trustworthiness of exhaustive switches over the union.
- **Prerequisite unknowns:** Q-7 (intended end state of the reconciliation); Q-5 (whether legacy-shaped documents still exist in production data).
- **Confidence that the opportunity is real:** High that the type/runtime divergence exists (directly observed at the cited lines); the direction of realization is conditional on Q-7.

---

## Consolidation

### OP-5 — Deck-access predicates re-derived outside the canonical engine

- **Opportunity:** Consolidation opportunity: the deck-sharing access decision, whose canonical engine states "Never inline role logic in components or pages," is nonetheless re-derived inline at several sites — at least one of which computes ownership differently from the engine.
- **Category:** Consolidation
- **Evidence (verified):**
  - Canonical engine and its own contract: `features/flashcard/utils/rbac.ts:94-97` ("This is the canonical entry point … Never inline role logic"), `resolveRole` at 97-134 (owner determined from `lesson.ownerId ?? lesson.userId`, lines 101-104; public gate at 123).
  - Inline re-derivations:
    - `features/flashcard/services/shared.service.ts:181-188` — hand-rolled `isOwner`/`hasExplicitRole`/`hasPendingInvite`/`linkAccess` gate; its `isOwner` (line 181) checks `lesson.roles?.[uid] === "owner"`, not the engine's `ownerId ?? userId` — a semantic divergence from `rbac.ts:101-104`. The same function then calls the real `resolveRole` at line 223, so both derivations run in one code path.
    - `features/flashcard/components/ShareModal.tsx:98` — inline `lesson.allowLinkAccess || lesson.isPublic` fallback.
    - `features/flashcard/detail/components/DetailActionsPanel.tsx:40` — inline shared-ness derivation.
    - `features/notifications/actions/notification.actions.ts:131` — server-side re-derivation of `lessonIsPublic`.
    - `features/flashcard/services/shared-preview.service.ts:76` — Admin-SDK re-implementation of the public gate (this one carries a documented bundle-isolation reason, lines 1-16).
- **What realization would affect:** access outcomes on shared decks (the `shared.service.ts` gate can deny an owner whose lesson document lacks a `roles` self-entry while the engine would grant `owner`); the notification emission guard; the server preview's public gate; the truthfulness of the engine's "single source of truth" contract.
- **Prerequisite unknowns:** none — this is a pure code-state fact.
- **Confidence that the opportunity is real:** High. The engine's own header forbids exactly what the cited sites do, and one divergent duplicate is an observed behavioral difference, not a style preference.

### OP-6 — Two RBAC engines with overlapping concepts

- **Opportunity:** Consolidation opportunity: two independent modules named `rbac.ts` each implement the same conceptual kit — a role union, a role normalizer/sanitizer, and boolean permission predicates — once for admin authority and once for deck sharing.
- **Category:** Consolidation
- **Evidence (verified):** `features/admin/utils/rbac.ts:3-47` (`PermissionSet` matrix over 2 roles, `hasPermission`, `normalizeAdminRole`) and `features/flashcard/utils/rbac.ts` (5-role resolution at 97-134, predicates `canView`/`canComment`/`canEdit` at 138-150, `sanitizePublicRole` at 159-162). Each is the declared source of truth for its own domain (flashcard header lines 1-7; admin's matrix is the sole input to `assertPermissionFromToken`, `features/admin/services/admin.service.ts:40-49`).
- **What realization would affect:** both permission surfaces and every caller of their predicates; the two modules' independent role vocabularies (`AdminRole` vs `DeckAccessRole`).
- **Prerequisite unknowns:** none catalogued.
- **Confidence that the opportunity is real:** Low. The overlap is in pattern and vocabulary shape, not in data or rules: the two domains share no roles, no storage, and no callers, so what is genuinely consolidatable may be small. Listed because both files independently claim single-source-of-truth status for permission decisions and future readers must learn two systems.

### OP-7 — Three divergent admin-authority predicates (conditional)

- **Opportunity:** Consolidation opportunity, contingent on the answer to Q-10: "is this caller an admin" is answered by three different predicates in three layers, with materially different semantics, and they could agree.
- **Category:** Consolidation
- **Evidence (verified):**
  - App server: `features/admin/services/admin.service.ts:30-38` — custom claims (`superadmin`/`admin`) OR `admins/{uid}` doc, with the doc's `role` field normalized (`normalizeAdminRole`).
  - Firestore rules: `firestore.rules:16-22` (`isSystemAdmin`) — claims OR **mere existence** of `admins/{uid}`, with no role-value check; this predicate alone guards `system_logs` reads (`firestore.rules:199-201`).
  - Cloud Functions: `functions/src/fanout.ts:120-124` — `admins/{uid}` doc with role check only; custom claims are ignored.
- **What realization would affect:** which principals can read `system_logs` from a client (an `admins/{uid}` doc with any role value, even invalid, currently passes the rules check but fails the app-server check); which principals can invoke the fan-out callable; the meaning of an `admins` document vs a claim across all three layers.
- **Prerequisite unknowns:** Q-10 — which source (claims vs docs) production admin authority actually relies on must be known before any predicate can be aligned without locking out (or failing to lock out) real admins.
- **Confidence that the opportunity is real:** High that the three predicates diverge (directly observed); which alignment is safe is conditional on Q-10.

---

## Deletion-or-completion conditionals

### OP-8 — Seven inactive `NotificationKind`s

- **Opportunity:** Deletion-or-completion opportunity, contingent on the answer to Q-8: seven declared notification kinds have no producer anywhere in the repo — each is either roadmap (completion: a producer lands and `active` flips) or abandoned (deletion: the kind and its registry/collapse/rendering weight leave).
- **Category:** Deletion
- **Evidence (verified):** `features/notifications/domain/registry.ts` — `active: false` at lines 66 (`invite_declined`), 108 (`deck_updated`), 115 (`deck_deleted`), 129 (`privacy_changed`), 145 (`overtaken`), 152 (`leaderboard_top3`), 160 (`achievement`); registry contract comment at 27-30 ("flip to true when the producer lands"). The server emit schema accepts only the 7 client-emitted active kinds (`features/notifications/schema.ts:74-82`, discriminated union).
- **What realization would affect:** the registry, `domain/events.ts` kind union, collapse-key and formatting logic keyed by kind, and — for `overtaken`/`leaderboard_top3` — whether `features/game/` must leave room for competitive notification producers.
- **Prerequisite unknowns:** Q-8.
- **Confidence that the opportunity is real:** High that the seven kinds are producer-less (verified per kind); the branch is conditional.

### OP-9 — Never-emitted logging vocabulary

- **Opportunity:** Deletion-or-completion opportunity, contingent on the answer to Q-11: eight `ActivityAction` members and the `"cloud_function"` `LogSource` member have zero producers — each is either pending wiring (completion) or dead vocabulary (deletion).
- **Category:** Deletion
- **Evidence (verified):** `lib/logging/actions.enum.ts:16-37` — `DECK_SHARED`, `DECK_UNSHARED`, `CARD_CREATED`, `CARD_UPDATED`, `CARD_DELETED`, `SHARE_INVITE_SENT`, `SHARE_INVITE_REVOKED`, `KANA_PRACTICE_COMPLETED`; per-member grep over all non-test source finds no producer for any of the eight. `features/admin/types/log.types.ts:4` declares `"cloud_function"`; `lib/logging/public.ts:41` normalizes it; `functions/src/` contains no `system_logs` writer. The asymmetry is live UI-visible: kana practice exists as a route yet never logs, while quiz and survival siblings do.
- **What realization would affect:** the enum contract ("All logging calls across the system MUST use these constants"), admin report filters and badges (`features/admin/components/reports/`), analytics pools keyed off logged actions, and — on the completion branch — the kana practice flow and the functions package.
- **Prerequisite unknowns:** Q-11.
- **Confidence that the opportunity is real:** High that the members are producer-less; the branch is conditional.

### OP-10 — Inert admin surfaces: Quick Actions, Settings stub, `canChangeSettings`

- **Opportunity:** Deletion-or-completion opportunity, contingent on the answer to Q-13: three visible admin buttons do nothing when clicked, the admin Settings page is a self-described stub, and the `canChangeSettings` permission is declared but demanded by no action — each surface is either pending wiring or removable without behavior change.
- **Category:** Deletion
- **Evidence (verified):** `features/admin/components/dashboard/QuickActionsCard.tsx:21,28,35` — three `<Button variant="ghost">` elements with no `onClick`, no `href`, no form context (JSDoc at 11-15 claims they "provide immediate access" to tasks). `features/admin/components/settings/AdminSettingsPageContent.tsx:13-16` — "not yet wired to a backend … explicit 'not available' state". `canChangeSettings`: declared at `features/admin/utils/rbac.ts:11,23,33` and in the metadata enum at `features/admin/services/admin.service.ts:76`; repo-wide grep confirms no action anywhere declares it as its required permission.
- **What realization would affect:** the admin overview layout (`AdminOverviewPage.tsx` mounts the card), the `/admin/settings` route, the RBAC matrix's shape, and what admins currently experience clicking three no-op buttons.
- **Prerequisite unknowns:** Q-13.
- **Confidence that the opportunity is real:** High that the surfaces are inert (directly observed); the branch is conditional.

### OP-11 — Unenforced schemas

- **Opportunity:** Enforcement-or-removal opportunity, contingent on the answer to Q-12: `cardContentSchema`, `privacyModeSchema`, and `publicRoleSchema` are consumed by no non-test code, while the file headers claim validation roles the import graph contradicts — each schema is either the intended future validator (enforcement lands where intended) or an overtaken artifact (removal).
- **Category:** Deletion
- **Evidence (verified):** grep over all non-test source: `cardContentSchema` is referenced only in `shared/schemas/card.schema.ts:63-82` and its test; `privacyModeSchema`/`publicRoleSchema` only in `shared/schemas/lesson.schema.ts:33,35` and tests. The header of `card.schema.ts:1-5` claims it is the "single validation source of truth". Actual write-path validation is primary-field-only: `validateAtomicCard` at `features/flashcard/services/lesson-save.ts:61`, `features/flashcard/utils/parser.ts:147`, `features/ai/services/gemini.service.ts:39,86,132` (implementation `shared/utils/atomicCard.ts:42`). Consequence: the `meaning`/`example`/`hint`/`clozeTemplate` constraints and the schema-level "never editor via public link" cap are enforced nowhere.
- **What realization would affect:** card/lesson write paths (enforcement branch changes what data is accepted, including AI/import output); or the schema files and their header claims (removal branch); the `sanitizePublicRole` runtime cap remains the only public-role guard either way (`features/flashcard/utils/rbac.ts:159-162`).
- **Prerequisite unknowns:** Q-12.
- **Confidence that the opportunity is real:** High — the zero-consumer state and the contradicted header claim are both verified.

### OP-12 — `Drawer` primitive with zero render sites

- **Opportunity:** Deletion-or-adoption opportunity: the shared `Drawer` primitive is exported but rendered nowhere, while two feature components hand-compose slide-panels of the shape it provides — it is either adoptable by those consumers or removable.
- **Category:** Deletion
- **Evidence (verified):** grep `<Drawer` across all non-test source matches only its own definition (`shared/components/ui/Drawer.tsx`); it is exported at `shared/components/ui/index.ts:8`. The two drawer-shaped bespoke compositions: `features/admin/components/content/DeckDetailsPanel.tsx:37-46` (right slide panel) and `features/admin/components/shared/AdminSidebar.tsx:140-168` (left mobile drawer).
- **What realization would affect:** the shared UI surface's inventory; on the adoption branch, the two bespoke panels' markup and backdrop behavior (overlaps OP-2).
- **Prerequisite unknowns:** none catalogued — `project-discovery/13` has no question covering `Drawer` intent (a gap; the nearest analogue is Q-17's adoption-status framing).
- **Confidence that the opportunity is real:** High — dormancy is verified, and both candidate consumers verifiably exist.

### OP-13 — Storybook toolchain vs one story; scaffold assets

- **Opportunity:** Deletion-or-adoption opportunity, contingent on the answer to Q-17: eight Storybook-related devDependencies and two npm scripts support exactly one story, and five unreferenced create-next-app scaffold SVGs remain tracked — each is either the start of adoption or removable tooling/assets.
- **Category:** Deletion
- **Evidence (verified):** `src/package.json` devDependencies: `@chromatic-com/storybook`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-mcp`, `@storybook/addon-vitest`, `@storybook/nextjs-vite`, `eslint-plugin-storybook`, `storybook` (8 packages; discovery counted 7), plus `storybook`/`build-storybook` scripts. Story census: exactly one file, `shared/components/ui/Badge.stories.tsx`. `public/` contains `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` with zero source references (grep verified).
- **What realization would affect:** devDependency and script surface, the `.storybook/` config directory, lint config (`eslint-plugin-storybook`), and `public/` contents; on the adoption branch, the component-development workflow assumptions (`addon-vitest`).
- **Prerequisite unknowns:** Q-17.
- **Confidence that the opportunity is real:** High that the state (8 packages : 1 story; 5 unreferenced assets) is as described; the branch is conditional and Q-17 itself rates the answerability Low.

### OP-14 — `fanOutNotifications` callable with zero in-repo callers

- **Opportunity:** Deletion-or-completion opportunity, contingent on the answer to Q-6: the admin-only fan-out callable is self-described as deployed-but-untriggered, and no app code can invoke it — it is either awaiting its first product trigger or removable along with its Cloud Tasks consumer.
- **Category:** Deletion
- **Evidence (verified):** `functions/src/fanout.ts:7-15` ("No current product action triggers this yet … every notification producer in the app today … derives exactly one recipient") and 128-134 ("Not called from any existing app code path today"); grep confirms zero `httpsCallable`/`getFunctions` usage anywhere in `app/`, `features/`, `lib/`, `shared/`.
- **What realization would affect:** the functions package's exported bindings (`functions/src/index.ts`), the Cloud Tasks queue contract, and — on the completion branch — whichever product event first needs multi-recipient delivery.
- **Prerequisite unknowns:** Q-6 (deployment/operator-invocation state; also whether the digest sibling is live).
- **Confidence that the opportunity is real:** High that no in-repo caller exists; the branch is conditional because an out-of-repo operator invocation cannot be ruled out from code.

---

## Simplification

### OP-15 — Legacy notification compatibility machinery (conditional)

- **Opportunity:** Simplification opportunity, contingent on the answer to Q-5: the notifications feature carries dual-schema machinery — deprecated fields, a legacy unread fallback, a dual query strategy, dual composite indexes, and a one-time backfill script — whose load-bearing status depends entirely on whether legacy-shaped documents still exist in production.
- **Category:** Simplification
- **Evidence (verified):** four `@deprecated` fields kept "for existing Firestore docs" (`features/notifications/types/index.ts:71-81`); legacy fallback in `isUnread()` (`types/index.ts:104-109`); primary-vs-fallback listener strategy with runtime swap (`features/notifications/services/notification-subscribe.ts:24-33`, `openFallback` at 73-88, swap-on-error at ~105-115); both `read+isDeleted` and `status+isDeleted` composite indexes in `firestore.indexes.json`; one-time backfill at `scripts/backfill-notifications.mjs`.
- **What realization would affect:** what pre-migration documents render as (unread state, deep links), which listener path runs, the index set, and whether the backfill script remains in the repo.
- **Prerequisite unknowns:** Q-5 — production data state (backfill executed? legacy docs remaining? indexes deployed? TTL configured?) decides whether any of this machinery can change without altering what real users see.
- **Confidence that the opportunity is real:** Medium — the machinery is verified and self-describes as transitional, but its removability is entirely a data-state question the repo cannot answer.

---

## Deletion-or-completion (data pipeline)

### OP-16 — Read paths on collections nothing writes

- **Opportunity:** Deletion-or-completion opportunity, contingent on the answer to Q-9: the admin dashboard and analytics read `analytics_daily` and `metadata/counters`, which no code in the repo writes — the read paths and their zero-value fallbacks either serve an out-of-repo pipeline's contract (completion/preservation) or permanently render fallback data (deletion of the dead reads).
- **Category:** Deletion
- **Evidence (verified):** reads at `features/admin/services/analytics.service.ts:22-29` and `features/admin/actions/admin.actions.ts:278` (`analytics_daily`), and `features/admin/services/user.service.ts:64-65` (`metadata/counters` — the repo's only `metadata` reference); repo-wide grep (including `functions/src/` and `scripts/`) finds zero writers for either. Fallbacks: `user.service.ts:96-105` substitutes `0` for `activeUsersToday`/`totalSessions`/`errorRate` ("never fabricate activity metrics"); `admin.actions.ts:284-299` synthesizes an export row with hardcoded zeros.
- **What realization would affect:** the truthfulness of admin stat cards and `SystemHealthCard`, the analytics export shape, and — if an external pipeline exists — an unowned schema contract that must not change unilaterally.
- **Prerequisite unknowns:** Q-9.
- **Confidence that the opportunity is real:** High that the read-without-write asymmetry exists (verified repo-wide); the branch is conditional.

---

## Modularization

### OP-17 — Kana survival placement parity

- **Opportunity:** Modularization opportunity: the survival mode's four screen components live under the route tree (`app/…/survival/_components/`) while every sibling kana mode keeps its components inside the feature module, and the survival screens' own hooks live back in `features/kana/hooks/` — the mode's code could reside on one side of the app/feature boundary like its siblings do.
- **Category:** Modularization
- **Evidence (verified):** `app/[locale]/(immersive)/kana/survival/_components/` contains `SurvivalSetupScreen.tsx`, `SurvivalDropScreen.tsx`, `SurvivalQuizScreen.tsx`, `SurvivalGameOverScreen.tsx`; by contrast `features/kana/` has per-mode component directories `quiz/components`, `practice/components`, `chart/components`, `learn/components`, `hub/components`. The survival screens consume `features/kana/hooks/useSurvivalGame.ts` (299 lines) and `useDropMode.ts` (367 lines) — the split places one mode's UI and state on opposite sides of the boundary.
- **What realization would affect:** file placement and import paths for one mode; the consistency of the feature-module convention that the other eight feature areas follow; no runtime behavior.
- **Prerequisite unknowns:** none.
- **Confidence that the opportunity is real:** High — the parity break is directly observable and unambiguous.

### OP-18 — Flashcard module's internal size skew

- **Opportunity:** Modularization opportunity: the flashcard module is 46% of all feature-module code (146 files, 16,940 of 36,842 lines) and already contains partially-bounded internal areas (`dashboard/`, `detail/`, `games/` with 45 files, `loaders/`) alongside a 27-file flat `components/` directory — its internal boundaries could be as explicit as its external one.
- **Category:** Modularization
- **Evidence (verified):** recounted at HEAD: `features/flashcard` = 146 files / 16,940 lines vs next-largest `admin` at 109 / 8,781; subdirectory census: `games/` 45, `components/` 27, `hooks/` 16, `services/` 16, `dashboard/` 13, `detail/` 10. 13 of the repo's 25 largest files are in this module (`project-discovery/11-Code-Metrics.md` §2, spot-checked: `ShareModal.tsx` 436 lines, `FlashcardPractice.tsx` 396).
- **What realization would affect:** internal structure and import paths of the largest feature; the flat `components/` directory whose files span sharing, comments, builder, import/AI-panel, and practice concerns; no external contract.
- **Prerequisite unknowns:** none.
- **Confidence that the opportunity is real:** Medium — the skew is a verified fact, but size alone does not prove that further internal boundaries are cleanly available; the existing subdirectories are evidence that some seams already exist.

---

## Automation

### OP-19 — Human-enforced cross-artifact vocabulary agreements

- **Opportunity:** Automation opportunity: several agreements between parallel declarations of the same vocabulary are maintained only by human discipline, and at least one has already drifted — these agreements could be machine-checked instead of remembered.
- **Category:** Automation
- **Evidence (verified):**
  - `NotificationType` union (`features/notifications/types/index.ts:5`) vs writer values (`notification.actions.ts:209`; `functions/src/digest.ts:82`) vs the rules-side list (`firestore.rules:39-41`): three declarations of "valid notification type", currently in disagreement (see OP-4) — demonstrating no mechanical check exists.
  - `APP_ID` defaulted identically in two packages from two different env vars: `lib/app-id.ts:1` (`NEXT_PUBLIC_APP_ID`) vs `functions/src/digest.ts:151` and `functions/src/fanout.ts:126` (`NOTIFICATIONS_APP_ID`) — agreement of the deployed values is unverifiable and unchecked.
  - `lib/logging/actions.enum.ts` declares "All logging calls across the system MUST use these constants" while 8 of 32 members have no producer (OP-9) — the MUST is enforced by nothing.
- **What realization would affect:** the failure mode of future drift (currently: silent divergence discovered by audit; after realization: a visible failure at the moment of divergence); the three vocabulary sites and both packages' env contracts.
- **Prerequisite unknowns:** Q-7 for the notification-type case — an agreement check needs the agreed target first.
- **Confidence that the opportunity is real:** High — the invariants verifiably exist, are verifiably manual, and one has verifiably drifted.

### OP-20 — Human-enforced rules-coverage agreement

- **Opportunity:** Automation opportunity: the correspondence between the Firestore paths client code writes and the match blocks `firestore.rules` guards is maintained by hand-written cross-reference comments inside the rules file, and could be machine-checked.
- **Category:** Automation
- **Evidence (verified):** the rules file tracks the service layer by prose comment — `firestore.rules:80` ("Path from comment.service.ts"), 131-133 ("stats.service.ts's subscribePersonalBests/…"), 141-142 ("progress.service.ts's userProgressCardDoc()/dailyStatsDoc()"), 159-160 ("session.service.ts's sessionsCol() and leaderboard.service.ts's…"). Path construction on the code side is spread across per-entity builder modules (`features/flashcard/services/lesson-paths.ts`, `comment-paths.ts`, `features/notifications/services/notification-paths.ts`) and inline `collection()` calls; nothing ties the two surfaces together mechanically.
- **What realization would affect:** the failure mode when a new client-written collection lands without a rules block (currently: default-deny discovered at runtime, or an over-broad rule discovered never) and when rules comments go stale; the rules file's comment conventions.
- **Prerequisite unknowns:** none blocking; Q-1 (whether the in-repo rules are what production enforces) frames how much the in-repo agreement is worth.
- **Confidence that the opportunity is real:** Medium — the manual correspondence is verified; how completely the agreement can be expressed as a checkable invariant is not established from the repo alone.

---

## Observability

### OP-21 — Dormant credential-gated telemetry (conditional)

- **Opportunity:** Observability opportunity, contingent on the answers to Q-4/Q-2/Q-1: the Sentry and PostHog integrations are wired but double-gated on production credentials the repo cannot see, so the app's real error-monitoring and analytics state is unknowable in-repo — the wiring is either activated (credentials confirmed, and the near-empty event surface widened or accepted) or acknowledged as dormant (and its weight reconsidered).
- **Category:** Observability
- **Evidence (verified):** `instrumentation.ts:9-10` (`NODE_ENV === "production" && SENTRY_DSN`, else no-op); `instrumentation-client.ts:8-12` (same pattern on `NEXT_PUBLIC_SENTRY_DSN`); `lib/posthog.ts:13-19` (prod + `NEXT_PUBLIC_POSTHOG_KEY` gate); the sole captured product event is one manual `$pageview` (`lib/PostHogProvider.tsx:18`); `Sentry.captureException` exists at exactly four sites, all route error boundaries (`app/global-error.tsx:27`, `app/[locale]/(main)/error.tsx:21`, `app/[locale]/(immersive)/error.tsx:21`, `app/[locale]/login/error.tsx:21`); the `/ingest` reverse-proxy rewrite sits in `proxy.ts`.
- **What realization would affect:** whether production errors are observed at all; whether the `/ingest` path carries traffic; the four error boundaries; the init/proxy wiring that currently ships to every environment as a no-op.
- **Prerequisite unknowns:** Q-4 (credentials and intended analytics scope), Q-2 (deployment platform), Q-1 (production environment identity).
- **Confidence that the opportunity is real:** High that the dormant-by-default gating is exactly as described; both realization branches are conditional on out-of-repo facts.

### OP-22 — Silent failure sites with no telemetry path

- **Opportunity:** Observability opportunity: seventeen fire-and-forget promise chains discard their errors entirely, and roughly twenty bare `catch` blocks swallow exceptions locally, while no error-reporting call exists anywhere below the four route boundaries — these failure classes are invisible even in an environment where telemetry credentials exist.
- **Category:** Observability
- **Evidence (verified):** 14 `.catch(() => {})` sites plus 3 `.catch(() => undefined)` sites (17 total; grep at HEAD), including image cleanup (`features/flashcard/services/lesson.service.ts:133`, `lesson-save.ts:115,125`), invite-accept notification emission (`features/flashcard/services/access.service.ts:135`), pending-notification delivery and login logging (`features/user/hooks/useFirebaseAuth.ts:65,70`), daily review counting (`features/flashcard/services/progress.service.ts:157`), and card-data cleanup (`features/flashcard/services/card.service.ts:88`); ~20 additional bare `catch {` blocks (e.g. `features/flashcard/hooks/useLessons.ts:112,158`, `lib/flags.ts:85`). `Sentry.captureException` appears only in the four boundary files (OP-21) — no service, hook, or action reports errors. One counter-example exists and shows the shape of the gap: audio playback failures are sampled into the activity log (`lib/AudioProvider.tsx:116`, `AUDIO_PLAYBACK_FAILED`), making audio the only subsystem whose silent failures leave a trace.
- **What realization would affect:** visibility of orphaned Storage images, undelivered invite notifications, lost activity/audit logs, and failed progress increments; the deliberate fire-and-forget UX contract at those sites (realization changes what is observed, not what the user experiences).
- **Prerequisite unknowns:** Q-4 — whether a telemetry backend exists for anything to report into.
- **Confidence that the opportunity is real:** High — the sites and the absence of any reporting path below the boundaries are both verified.

---

## Testing

### OP-23 — Zero-coverage feature modules and largest untested surfaces

- **Opportunity:** Testing opportunity: four of the nine feature modules — `ai`, `game`, `home`, `command-palette` — have zero test files in any of the four vitest suites and no e2e coverage, and within partially-covered modules the largest and most safety-critical surfaces (the deck-sharing RBAC engine, the flashcard service layer, the three biggest kana hooks) are untested.
- **Category:** Testing
- **Evidence (verified):** full test census at HEAD (41 `*.test.*` files): none under `features/ai/` (1,022 lines), `features/game/` (1,453), `features/home/` (343), or `features/command-palette/` (216); Playwright e2e is two specs only (`e2e/auth.spec.ts`, `e2e/realtime.spec.ts`). Partial modules: `features/flashcard`'s four test files cover two browser components and the speed engine, leaving `utils/rbac.ts` (the access engine of OP-5), `services/` (16 files incl. `lesson-save.ts`, `shared.service.ts`, `progress.service.ts`, `comment.service.ts`), and all 16 `hooks/` files untested; `features/kana`'s two test files cover `ChartCell` and `KanaStrokeAnimation`, leaving `useDropMode.ts` (367 lines), `useKanaQuizSession.ts` (319), `useSurvivalGame.ts` (299) untested; `features/admin`'s coverage is one emulator service test plus three browser component tests against 109 files.
- **What realization would affect:** refactor safety for every opportunity above that touches these areas (OP-5, OP-11, OP-17, OP-18 all sit largely in untested code); the four vitest configs' include surfaces.
- **Prerequisite unknowns:** none blocking; Q-14 (AI Logic's actual production failure modes) informs what AI-layer tests should assert.
- **Confidence that the opportunity is real:** High — the census is exhaustive and re-verified.

### OP-24 — Rules-test coverage vs total rules surface

- **Opportunity:** Testing opportunity: the single Firestore-rules test file exercises the notification, pending-invite, progress, session, leaderboard, and best-score blocks, but none of the lessons/cards/comments sharing model, the `admins` and `system_logs` blocks, `sharedProgress`, the user-profile block, or the collection-group lessons read — the enforced side of the app's most complex access model is untested.
- **Category:** Testing
- **Evidence (verified):** `src/firestore-rules.test.ts` (415 lines) — its test cases (lines 73-392) cover own-inbox writes/immutability/soft-delete, pending invites, `userProgress` (+`studyStats`), `game_sessions`, `leaderboard_*`, and `stats`; the only occurrence of "lessons" in the file is a path segment inside the `userProgress` path builder (line 189). Untested rule blocks in `firestore.rules`: lessons read/create/update/delete incl. public read and editor-role update (lines 65-95), cards (97-107), comments (80-94), notifications aside — `admins` (194-197), `system_logs` (199-202, guarded by the divergent predicate of OP-7), `sharedProgress` (124-127), user profile (62-63), and the collection-group lessons rule (208-215).
- **What realization would affect:** confidence in the rules mirror of the OP-5 access engine (the two are maintained in parallel by hand — see OP-20); the safety of any rules change accompanying OP-4/OP-7/OP-11; the emulator vitest config's scope.
- **Prerequisite unknowns:** none blocking; Q-1 (whether in-repo rules are the deployed rules) frames what a passing rules suite proves about production.
- **Confidence that the opportunity is real:** High — the covered/uncovered split is read directly from the test file against the full rules file.

---

## Candidate areas examined and not carried forward

- **Two virtualized-list variants** (`features/admin/components/reports/LogsVirtualList.tsx` vs `app/[locale]/(main)/notifications/_components/NotificationsVirtualList.tsx`): both sit on the same library, and the window-scroll variant's docstring records the surface-specific reason for each choice; no standardization headroom was established beyond what the in-code rationale already accounts for.
- **Form-state variants** (2 `useForm` sites vs manual state): the two mechanisms map to genuinely different input complexity (schema-validated builder/invite forms vs single-field inputs); no verified evidence that convergence is available without loss.
