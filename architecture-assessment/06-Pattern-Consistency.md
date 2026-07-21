# 06 — Pattern Consistency

Architecture Assessment phase. This document evaluates how consistently each recurring concern is implemented across the codebase, why variants exist (evidence-based, dated from git history), and what the divergence objectively costs. It does **not** recommend which variant should win, propose refactors, or define tasks.

- **Inputs:** `project-discovery/` corpus (primarily `10-Pattern-Catalog.md`), the repository itself (root `/Users/yuh.nguyenpham/GitHub/japanese`, project root `src/`), and git history (138 commits, 2026-04-12 → 2026-07-18). **The repo is the source of truth**; every count below was re-verified by grep/read on 2026-07-19, and discrepancies against the discovery corpus are listed at the end.
- **Convention:** paths are relative to `src/` unless prefixed. Each concern separates **Observation** (read from code/git) from **Interpretation** (labelled). "Intent unknown" is stated where git history does not answer the "why".

## Timeline context (Observation, from git)

The history has two distinct eras, and most divergence sits on the boundary between them:

1. **Initial build era — 2026-04-12 → 2026-04-23** (`ff116ae feat: init project` through `af80991`): the whole product was built in ~11 days with hand-rolled state, manual inputs, bespoke modals, and direct Firestore access.
2. **Modernization program — 2026-07-03 → 2026-07-18**: an explicitly named program (`e13402c chore(deps): add dependencies for the modernization program`, 2026-07-16) executed as epic-tagged commits (E2, E6, E10–E17): design tokens (07-04), cleanup audit PRs 1-10 (07-09), audio rebuild (07-10), notifications platform (07-11), Base UI/sonner primitives + next-safe-action + react-hook-form + table engine + virtualization + fractional-indexing (07-16), SSR/i18n/Drawer/cmdk/flags (07-17), consolidation fixes E15/E17 (07-18).

**Interpretation:** most "two variants for one concern" findings below are the migration frontier of that program — the new mechanism landed on a slice of surfaces in mid-July and the rest of the codebase still carries the April-era mechanism, or (in several cases) the July commit deliberately migrated everything and left a documented, bounded exception.

---

## Scorecard

| ID | Concern | Verdict | # variants | Why (short) | Confidence |
|---|---|---|---|---|---|
| PC-1 | Forms | divergent | 2 | staged migration (react-hook-form landed 07-16 on 2 of many input surfaces) | high |
| PC-2 | Tables | mostly-consistent | 2 | staged migration + documented per-surface opt-outs (engine landed 07-16) | high |
| PC-3 | Dialogs | mostly-consistent | 2 | deliberate two-tier design after 07-16 Base UI migration; 1 stylistic straggler | high |
| PC-4 | Lists / virtualization | mostly-consistent | 2 (+plain `.map()`) | differing constraints, rationale documented in code | high |
| PC-5 | CRUD / write paths | divergent | 3 | differing constraints per domain, split documented in `lib/safe-action.ts` | high |
| PC-6 | API access | consistent | 1 | single surface type (server actions; no route handlers) | high |
| PC-7 | Validation | mostly-consistent | 2 (+placement variance) | staged migration to zod (07-16); pre-existing typed validators retained | high |
| PC-8 | Permissions / RBAC | mostly-consistent | 2 engines | disjoint domains, each declared single-source; naming collision | high |
| PC-9 | Notifications / toasts | consistent | 2 systems, 1 each | two systems serve different purposes; no overlap | high |
| PC-10 | Loading states | mostly-consistent | 6 mechanisms | per-context mechanisms; skeletons have no shared primitive | medium |
| PC-11 | Pagination | mostly-consistent | 2 | differing constraints (one-shot cursor vs realtime window); admin side unified 07-18 | high |
| PC-12 | Filtering / Sorting / Searching | divergent | 6 / 4 / 4 | mixed: some constraint-driven, some age; partially documented | medium |
| PC-13 | Error handling | mostly-consistent | 3 surfacing styles | styles map to context type; conventions applied broadly | medium |
| PC-14 | Caching | mostly-consistent | 3 regimes | division documented as policy in ADR-002 (07-16); module caches ad hoc | high |
| PC-15 | Routing / placement conventions | mostly-consistent | 2 placements | kana-survival outlier survived 3 restructures; intent unknown | high |
| PC-16 | State management | mostly-consistent | 3 mechanisms | observable role split (stores/contexts/local), but the rule is unwritten | medium |
| PC-17 | Theming / design tokens | mostly-consistent | 2 | staged migration (tokens 07-04, cleanup still landing 07-18); 29 files carry raw hex | high |
| PC-18 | i18n | consistent | 1 | single mechanism, one-shot phased adoption 07-17; extraction tail remains | high |

---

## PC-1 — Forms

**Approaches observed** (re-verified)

| Variant | Mechanism | Count | Sites |
|---|---|---|---|
| A | `react-hook-form` + `zodResolver` | **2** `useForm` files | `features/flashcard/hooks/useLessonBuilder.ts`, `features/flashcard/hooks/useShareInvites.ts` (schemas in `shared/schemas/lesson.schema.ts`) |
| B | manual `useState`-controlled inputs | everywhere else with text input | e.g. `features/flashcard/components/CommentInput.tsx`, `app/[locale]/login/page.tsx`, admin filter inputs |
| — | native `<form>` element | **0** occurrences (grep `<form` over `features/`, `app/`, `shared/`) | submission is `Button onClick`/keyboard handlers throughout — a *consistent absence* |

**Consistency verdict:** divergent.

**Why the divergence exists** (Observation from git): `react-hook-form` was wired in on 2026-07-16 (`8fd3f2f feat: schema-driven validation, react-hook-form, next-safe-action`) — that commit introduced `useForm` into `useLessonBuilder.ts` and created `shared/schemas/`; `useShareInvites.ts` was extracted 07-09 (`918b2d5`) and gained `useForm` in the same 07-16 commit. Every Variant-B surface predates or was left untouched by that commit. This is a **staged migration**: the library existed in `package.json` since 2026-04-18 (`36d3931`) but was unused until July. No commit states which remaining surfaces (if any) are intended to migrate — the end-state scope is **intent unknown**.

**Cost of the divergence** (factual): two input-state idioms to learn; validation runs through zod on Variant A but through ad-hoc `maxLength`/manual checks on Variant B, so the same class of input rule lives in two places; error-display and submit-blocking behavior differ per surface.

**Confidence:** high (counts grep-verified; dating from `git log -S useForm`).

---

## PC-2 — Tables

**Approaches observed** (re-verified)

| Variant | Mechanism | Consumers |
|---|---|---|
| A | shared engine `features/admin/hooks/useDataTable.ts` (`@tanstack/react-table`) + chrome family (`AdminTableShell` → `AdminTable` → `DataTableHeader`/`DataTableBody`/`DataTableMobileList`) | Users (`UsersTable.tsx`, full engine: selection/sorting/global filter); Content (`DecksTable.tsx`, engine with `enableFiltering`/`enableSorting` off — filtering deliberately upstream, documented at `useDataTable.ts:24-35`) |
| B | `AdminTableShell` chrome around a **non-table** virtualized list | Reports (`AdminReportsPageContent.tsx` + `LogsVirtualList.tsx`) |

No table code exists outside `features/admin/` (grep `useReactTable`, `<table` — confirmed).

**Consistency verdict:** mostly-consistent.

**Why the divergence exists** (Observation from git): the shared engine is 3 days old — `684482e feat(admin): build shared react-table engine, migrate Users + Content` (2026-07-16). The same day, Reports got a perf pass as a virtualized list instead (`fe7d1b5 perf(admin): virtualize the reports LogsVirtualList`). The Content opt-outs are documented in-code with a stated reason (distinguishing "no items" from "no results"). **Interpretation:** Reports staying outside the row-model engine while sharing the shell reads as a deliberate split (log entries are variable-height, virtualized, non-columnar), but no commit or comment states this explicitly — the *reason* Reports was excluded from the 07-16 migration is **intent unknown**.

**Cost of the divergence** (factual): the Reports surface shares the visual chrome but none of the engine semantics (sorting/selection/filtering), so "how does an admin grid behave" has two answers; contributors must know which shell slots are live per surface.

**Confidence:** high.

---

## PC-3 — Dialogs / modals / drawers

**Approaches observed** (re-verified)

| Variant | Mechanism | Count |
|---|---|---|
| A | shared primitives on Base UI Dialog — `Modal` (2 consumer files), `ConfirmModal` (7 consumer files), `Drawer` (**0** consumers) — all sharing `DialogChrome.tsx` backdrop/close | 9 render files |
| B | direct `Dialog.Root` composition with bespoke popup layout | 4 files: `ShareModal.tsx`, `DeckDetailsPanel.tsx`, `AdminSidebar.tsx` (mobile nav), `CommandPalette.tsx` |

`DeckDetailsPanel.tsx` uses its own backdrop className (`bg-[#3c3c3c]/30`) instead of `DIALOG_BACKDROP_CLASSNAME`. Open/close state is caller-local `useState` everywhere (one centralizing hook: `useDashboardModals.ts`) — consistent.

**Consistency verdict:** mostly-consistent.

**Why the divergence exists** (Observation from git): all overlays converged on one primitive in the 07-16 migration (`240574a refactor(ui): rebuild primitives on Base UI, sonner, react-day-picker`; `5669430 refactor(ui): finish Base UI Dialog migration (Alert, AdminSidebar, DeckDetailsPanel)`). Note the second commit's message *names AdminSidebar and DeckDetailsPanel as completed migrations* — i.e., direct `Dialog.Root` composition **is** the migrated end-state for bespoke layouts, not a leftover. `ShareModal` gained `Dialog.Root` on 07-16 (`8fd3f2f`), and `CommandPalette` was built new on 07-17 (`13d7082`) already composing `Dialog.Root` directly — after the migration was declared finished. `Drawer` was added 07-17 (`fa2b6ab feat(ui): add Drawer built on E6 Dialog primitive, no vaul (E13-T2)`) and has zero render sites — a primitive shipped ahead of any consumer.

**Cost of the divergence** (factual): two composition tiers means the shared chrome (backdrop, close-button a11y, scroll behavior) is only guaranteed on tier A; the `DeckDetailsPanel` backdrop is a live example of tier-B drift from the shared backdrop constant; `Drawer` is dead weight until consumed (bundle-inert but a maintenance surface).

**Confidence:** high.

---

## PC-4 — Lists / virtualization

**Approaches observed** (re-verified)

| Variant | Mechanism | Site |
|---|---|---|
| A | bounded-container `useVirtualizer` (`maxHeight: 600` own scroll div) | `features/admin/components/reports/LogsVirtualList.tsx` |
| B | window-scroll `useWindowVirtualizer` (`scrollMargin` via `useLayoutEffect`) | `app/[locale]/(main)/notifications/_components/NotificationsVirtualList.tsx` |
| — | plain `.map()` for short lists | dashboard deck grid, comment threads, leaderboard, kana chart grid |

Both variants use `@tanstack/react-virtual` with dynamic `measureElement`. The `NotificationsVirtualList` docstring records why each surface uses its variant (bounded dashboard panel vs full-page inbox).

**Consistency verdict:** mostly-consistent.

**Why the divergence exists** (Observation from git): both landed as perf commits on the same day — `fe7d1b5 perf(admin): virtualize the reports LogsVirtualList` and `9527089 perf(notifications): paginate and virtualize the inbox beyond limit(50)` (2026-07-16); the reports component's virtualization lineage goes back to the April admin module (`36d3931`, 04-18). This is **differing constraints, documented in code** — one library, two scroll-container strategies matched to panel vs page.

**Cost of the divergence** (factual): minimal — one extra API to know from the same library; the choice criterion is written down at the point of use.

**Confidence:** high.

---

## PC-5 — CRUD / write paths (three families)

**Approaches observed** (re-verified)

| Family | Mechanism | Domain | Scale |
|---|---|---|---|
| A | client Firestore SDK service modules (`features/<f>/services/*.service.ts`), hooks add auth context | learner-facing (flashcard, game, user, kana, notifications read-state) | e.g. `card.service.ts`, `lesson.service.ts`, diff-based batch save in `lesson-save.ts`; 14 `onSnapshot` call sites across 9 files for reads |
| B | `adminActionClient` server actions (cookie session + per-action `.metadata({permission})`) + React Query mutations | admin | 20 exported actions in `admin.actions.ts` (19 via `adminActionClient`); 6 `useMutation` call sites across 3 hooks with key invalidation |
| C | `actionClient` server actions (Firebase idToken as bind-arg, verified inline) | notifications emission, activity/audit logging, invite decline | 10 `"use server"` modules total across B+C; `lib/safe-action.ts:16-31` documents the two-client split |

Result shape is normalized across B and C by `toActionResult` → `{ok:true,data} | {ok:false,error}` — a cross-family consistency point. Cross-user writes are Cloud-Functions/Admin-SDK only (`functions/src/fanout.ts`, `digest.ts`), mirrored by `firestore.rules`.

**Consistency verdict:** divergent (three families — each internally consistent, and the B/C split is documented).

**Why the divergence exists** (Observation from git): Family A is the April-era foundation (`card.service.ts` 04-13, `f6a4418`). Families B and C both date to the modernization program: `next-safe-action` and `adminActionClient` landed 2026-07-16 (`8fd3f2f`), and the token-bind-arg pipeline came with the server-authoritative notifications platform 2026-07-11 (`ca8a654`). The B-vs-C split is **differing constraints, documented** (`lib/safe-action.ts` doc comment: cookie-session for admin surfaces vs fresh idToken for user-initiated privileged writes). The A-vs-(B/C) split is also constraint-shaped — client SDK writes are rule-guarded own-data writes; server actions exist where the Admin SDK is required — this matches `docs/adr/002-data-layer-pattern.md` and `02-Architecture-Discovery.md` §1, though no single document states the three-family taxonomy in one place.

**Cost of the divergence** (factual): three auth-plumbing idioms (rules-guarded direct write, cookie middleware, token bind-arg) and two mutation idioms (service function vs React Query mutation) must be learned; a new write path requires choosing a family, and the choice criterion is spread across a doc comment, an ADR, and the rules file; the same `{ok,error}` envelope is hand-unwrapped differently per family (hooks re-throw for React Query in B; fire-and-forget swallow in C).

**Confidence:** high.

---

## PC-6 — API access

**Approaches observed** (re-verified)

- **Route handlers:** 0 (`find app -name route.ts` — none). Non-page route files are only `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`.
- **Server surface:** exactly the 10 `"use server"` modules of PC-5 (grep-verified list matches discovery).
- **Client data access:** Firestore SDK via feature services (PC-5A); the only raw `fetch(` sites are `features/kana/components/KanaStrokeAnimation.tsx` (public stroke-SVG assets, wrapped in React Query) and the OG-image font fetch (`opengraph-image.tsx`).
- **Third-party ingestion:** PostHog reverse-proxied first-party via `/ingest` rewrites in `proxy.ts` — one mechanism.
- Action invocation styles (React Query hook / service facade / fire-and-forget with fresh token) exist but map 1:1 onto the PC-5 families rather than varying within a family.

**Consistency verdict:** consistent.

**Why (no divergence to explain):** one access mechanism per class of need, uniformly applied. The absence of REST/route-handler duplicates of any server action was re-verified.

**Cost:** n/a. (Factual note: the single-surface design means the server API is not callable outside Next.js server-action transport — an architectural property, not a consistency defect.)

**Confidence:** high.

---

## PC-7 — Validation

**Approaches observed** (re-verified)

| Variant | Mechanism | Sites |
|---|---|---|
| A | zod v4 schemas at boundaries — forms (`zodResolver`), every server action (`.inputSchema()`/`.bindArgsSchemas()`), log persistence (`.parse`) | `shared/schemas/` (4 schema modules + index), `features/ai/schemas/`, `features/notifications/schema.ts`, `lib/logging/schema.ts` |
| B | hand-written typed validators/sanitizers predating or outside zod | `validateAtomicCard` + `CardValidationError` (violations array), `sanitizeCommentContent` (manual XSS escaping), numeric clamps (`clampLimit`, `clampVolume`) |
| — | rules-side re-validation | `firestore.rules` size limits + immutable-field checks mirror `features/notifications/schema.ts` limits |

Schema **placement** varies: `shared/schemas/*.schema.ts` (named files, tests co-located) vs `features/ai/schemas/` (directory) vs single-file `features/notifications/schema.ts` vs `lib/logging/schema.ts`.

**Consistency verdict:** mostly-consistent.

**Why the divergence exists** (Observation from git): `shared/schemas/` was created wholesale on 2026-07-16 (`8fd3f2f feat: schema-driven validation…`) — zod-at-the-boundary is a program-era convention. `features/notifications/schema.ts` came with the 07-11 notifications platform (`ca8a654`), five days before the shared-schemas convention existed, which accounts for its placement. Variant B validators predate the program (April era) and were retained; whether they are intended to converge on zod is **intent unknown**.

**Cost of the divergence** (factual): the answer to "where does the schema for X live" has four location conventions; comment length (2000) is enforced in three places (zod schema, UI `maxLength`, rules) that must be kept in sync by hand; Variant-B validators produce different error shapes (`CardValidationError` vs zod issues) for consumers to handle.

**Confidence:** high.

---

## PC-8 — Permissions / RBAC (two engines)

**Approaches observed** (re-verified)

| Engine | File | Domain | Shape |
|---|---|---|---|
| Admin RBAC | `features/admin/utils/rbac.ts` | system roles | `ROLE_PERMISSIONS` matrix (2 roles × 8 booleans) + `hasPermission()`; enforced server-side by the `adminActionClient` middleware for every action; client gates via `AdminContext`/`AdminGuard` |
| Deck-sharing RBAC | `features/flashcard/utils/rbac.ts` | per-deck collaboration | `resolveRole` 5-step priority resolution + predicates `canView`/`canComment`/`canEdit` + `sanitizePublicRole`; 9 non-test consumer files |

Both files are declared "single source of truth" for their own domain in their headers; both are mirrored in `firestore.rules` (`isSystemAdmin` vs lesson role checks). The two domains never share a call site.

**Consistency verdict:** mostly-consistent (each engine is internally consistent and uniformly enforced; two engines coexist by domain).

**Why the divergence exists** (Observation from git): both are April-era — flashcard rbac 04-17 (`3ffd37e`), admin rbac 04-18 (`36d3931`) — built one day apart for genuinely different permission models (fixed role→permission matrix vs per-resource role resolution with invites and public links). This is **differing constraints**, not drift: the models are structurally different (boolean matrix vs resolution pipeline).

**Cost of the divergence** (factual): two permission vocabularies to learn; the identical filename `utils/rbac.ts` in two features means imports are distinguishable only by path; `firestore.rules` must mirror two independent models, doubling the rules-drift surface (a mirror change in either engine requires a matching rules edit with no mechanical link).

**Confidence:** high.

---

## PC-9 — Notifications / toasts

**Approaches observed** (re-verified)

| System | Mechanism | Scale |
|---|---|---|
| Transient toasts | single pipeline: `useAlert()` → `AlertProvider` → sonner `toast.custom()` rendering the shared `Alert` chrome; severity-based durations | **30** `showAlert(` call sites across 11 files; no other toast mechanism exists (no raw `toast(` imports outside the provider) |
| Persistent notification center | single platform: typed event registry + deterministic collapse-IDs + `emitNotificationSafeAction` (server-authoritative) + one app-lifetime `onSnapshot` context | `features/notifications/` + `functions/src/` fan-out/digest |

**Consistency verdict:** consistent (two systems for two different product needs; exactly one mechanism within each).

**Why (no divergence to explain):** the toast pipeline dates to 04-15 (`3e4f881 feat: add global AlertProvider…`) and was re-based onto sonner in the 07-16 primitives rebuild (`240574a`) without spawning a second mechanism; the notification center was rebuilt server-authoritative in one commit on 07-11 (`ca8a654`). Git shows replacement, not accretion.

**Cost:** n/a.

**Confidence:** high.

---

## PC-10 — Loading states

**Approaches observed** (re-verified)

| Mechanism | Count / evidence |
|---|---|
| `LoadingSpinner` primitive | 22 consumer files |
| Skeletons (`animate-pulse`) — no shared skeleton primitive; per-surface components | 19 files; named: `ChartSkeleton`, `DashboardLoading`, `NotificationsPlaceholders`, inline in `Leaderboard` |
| `Button loading` prop (pending + click-block) | wherever buttons submit |
| Auth splash (`AuthGate`) | app-wide pre-auth |
| React Query `isLoading`/`isFetching` | admin hooks |
| `useTransition`-derived status enum | `features/ai/hooks/useAIGeneration.ts` |
| Route-level `loading.tsx` | **0** files (uniform absence); `<Suspense>` in exactly 1 file (shared-deck page) |

**Consistency verdict:** mostly-consistent.

**Why the divergence exists** (Observation/Interpretation): the six mechanisms map to different contexts (full-screen wait, content placeholder, in-flight button, auth boot, query state, transition state) — that mapping is orderly. The one true variance is **skeletons**: 19 files hand-roll `animate-pulse` markup with no shared primitive, and git shows them accreting per-surface across both eras rather than being consolidated by any program commit. Intent for skeleton consolidation: **unknown** (no epic touched it). The uniform absence of `loading.tsx`/`Suspense` is consistent with the client-heavy rendering model (16/29 pages `"use client"`).

**Cost of the divergence** (factual): skeleton look-and-feel can drift silently across 19 files (no single source of dimensions/shimmer); a contributor adding a loading state has six patterns to choose among with no written decision rule.

**Confidence:** medium (mechanism inventory verified; "no other loading idioms exist" not exhaustively provable).

---

## PC-11 — Pagination (cursor-token vs grow-window)

**Approaches observed** (re-verified)

| Variant | Mechanism | Consumers |
|---|---|---|
| A | cursor-token bookkeeping — `useCursorPagination.ts` accumulates `pageTokens[pageIndex] → cursor`; server actions return `nextPageToken`; cursor in the React Query key | 2 admin pages (Users, Reports) |
| B | grow-the-window resubscribe — `NotificationsContext` `loadMore()` bumps `pageSize` by 50 and re-subscribes `onSnapshot` with a larger `limit()` | notifications inbox |
| — | offset pagination, `useInfiniteQuery` | **0** hits (uniform absence) |

**Consistency verdict:** mostly-consistent.

**Why the divergence exists** (Observation from git + code): the two variants sit on different data-access families — A on one-shot Admin-SDK fetches, B on a realtime listener — and each documents its constraint at the point of use (`useCursorPagination.ts` docstring: Firestore cursors are sequential; `notification-subscribe.ts` rationale: grow the live window, never a separate page cache). Variant A itself was **just unified**: `d9a8d5d refactor(admin): unify cursor pagination… (E17-T5c)` (2026-07-18) collapsed two previously hand-rolled identical implementations (stated in the hook's own docstring). Variant B's pagination arrived 07-16 (`9527089`). This is **differing constraints, documented**, with intra-variant consolidation already performed.

**Cost of the divergence** (factual): two mental models of "next page" (token map vs bigger window); `hasMore` semantics differ (token presence vs short-page heuristic).

**Confidence:** high.

---

## PC-12 — Filtering / Sorting / Searching

**Approaches observed** (re-verified; catalog counts confirmed by spot-checks of `applyLogFilters`, `useDataTable`, `?tab=` param, `reorder.ts`)

*Filtering — 6 variants:* filter-object + pure function (`applyLogFilters`, shared by server service and client hook); table-engine `getFilteredRowModel` (Users); deliberate upstream filtering outside the engine (Content — documented at `useDataTable.ts:24-29`); URL-driven tab filter (`?tab=`, dashboard); local `useState` tab filter (notifications); date-range component (`AdminDateRangeFilter`).

*Sorting — 4 variants:* table-engine `SortingState`; Firestore `orderBy` (12+ query sites); client comparators (`newestFirst`, `sortByOrder`); user-defined manual ordering via fractional-indexing string keys with legacy numeric read-support (`shared/utils/reorder.ts` header documents the migration and the legacy tail).

*Searching — 4 matching variants:* tanstack global filter; concatenated-haystack substring (logs, incl. `JSON.stringify(metadata)`); upstream array filter (content); `cmdk` fuzzy match (palette). One shared input component (`AdminSearchInput`, 3 consumers). **No debouncing on any search input** (uniform absence — grep confirmed).

**Consistency verdict:** divergent (highest variant count of any concern).

**Why the divergence exists** (Observation/Interpretation): partially constraint-driven — Firestore `orderBy` vs client comparators is inherent to where data is sorted; fractional-indexing replaced numeric ordering on 07-16 (`da0431e`) with the legacy read path documented; the Content upstream-filtering exception is documented with a reason. The remainder (URL-param vs local-state tab filters, three different substring-matching implementations) shows no documented rationale and spans both eras — **intent unknown**; age and per-surface authorship are the observable correlates (dashboard tabs 04-era, notifications tabs rebuilt 07-16, logs filters 04-18).

**Cost of the divergence** (factual): "how do I filter/search this list" has a per-surface answer; matching semantics differ user-visibly (fuzzy vs substring vs field-scoped); tab state survives reload/back on the dashboard but not on notifications; three bespoke matchers are three places to fix the same class of bug.

**Confidence:** medium (variant inventory verified; completeness of the variant list not provable by grep alone).

---

## PC-13 — Error handling

**Approaches observed** (re-verified)

- **Boundaries:** exactly 4 files (`global-error.tsx`, `(main)/error.tsx`, `(immersive)/error.tsx`, `login/error.tsx`), all rendering the one provider-free `ErrorFallback`; all log + `Sentry.captureException`. No class `ErrorBoundary` (0 hits).
- **Three surfacing styles by context:** (1) throw → boundary/React Query (`toActionResult` unwrap then re-throw in admin hooks); (2) error-into-state for subscriptions (`error: string | null`); (3) fire-and-forget swallow for secondary writes (17 `.catch(() => {})` sites — activity logs, image cleanup — with the convention stated in code, e.g. `activity-log.actions.ts` "errors always swallowed").
- **Conventions applied broadly:** `{ok,data}|{ok,error}` envelope at the server boundary; bracketed scope tags on `console.error` (`"[useLessons]"`, `"[flags]"`, …); typed error classes in 3 domains (`AIServiceError`, `CardValidationError`, comment error mapping); fail-open defaults for reads; one backoff-retry site (notifications listener).

**Consistency verdict:** mostly-consistent.

**Why the divergence exists** (Observation from git): the boundary layer arrived late but in one stroke — `adc7f2f fix(kana,admin): … error boundaries` (2026-07-16) plus observability wiring the same day (`0f7e769`). The three surfacing styles are **differing constraints** (render-path vs subscription vs background write), and the swallow convention is documented at its sites. What is *not* documented is a global rule mapping context → style; the mapping is consistent in practice but inferred, not stated (**Interpretation**).

**Cost of the divergence** (factual): 17 intentional swallow sites are indistinguishable, at the call site, from accidental swallows without reading each comment; the typed-error treatment exists in 3 domains but plain `Error`/string messages elsewhere, so catch-side handling is non-uniform.

**Confidence:** medium.

---

## PC-14 — Caching (React Query vs onSnapshot vs module caches)

**Approaches observed** (re-verified)

| Regime | Mechanism | Scale |
|---|---|---|
| React Query | one `QueryClient` (staleTime 30s, focus-refetch off, retry 1); centralized admin key factory | 8 `useQuery` call sites, 6 `useMutation` call sites, 1 `useQueries`, 1 file on the `@tanstack-query-firebase` bridge |
| Live snapshots | `onSnapshot` subscriptions as the "cache" for realtime data | 14 call sites across 9 files |
| Module-level caches | `gemini.service.ts` prompt-keyed `Map`s; `lib/flags.ts` 60s-TTL template cache with stale-serve; audio sequencer/voice maps | 3 subsystems |
| Persisted client state | `zustand/persist` (`app-settings`, `kana-ui-state`) | 2 stores |
| Next.js data cache | `revalidatePath`/`unstable_cache`/`"use cache"` — **0** hits (uniform absence) | — |

**Consistency verdict:** mostly-consistent.

**Why the divergence exists** (Observation from git): the React-Query-vs-onSnapshot division is **written policy**: `docs/adr/002-data-layer-pattern.md` (added 2026-07-16, `3ce6560 feat(flashcard): document data-layer pattern, bridge shared-edit reads`) prescribes realtime = bespoke `onSnapshot` hooks, one-shot = query bridge, composite = plain `useQuery`. The code matches the ADR at every re-verified site. The module-level caches are older/parallel ad-hoc mechanisms (gemini April-era, flags 07-17) not covered by any ADR — their exemption is **intent unknown** (each has an in-file rationale for its own behavior, but no cross-cutting cache policy names them).

**Cost of the divergence** (factual): invalidation semantics differ per regime (query-key invalidation vs listener push vs TTL vs never); the gemini `Map` caches are unbounded for the session; a contributor must consult an ADR plus per-file docs to know where a given piece of data is cached.

**Confidence:** high.

---

## PC-15 — Routing / placement conventions (feature modules vs `app/` `_components`)

**Approaches observed** (re-verified)

- **Dominant convention:** route files are thin orchestrators rendering a feature root; feature UI lives in `features/<f>/…` (stated in `.rules/ai-rules/architecture.rule.md`; observed across 29 pages).
- **`_components` placements in `app/`:** `app/_components/` (provider-free fallbacks — documented reason: must render when providers crash); `(main)/_components/` (`BottomNav` — shell chrome); `(main)/notifications/_components/` (`NotificationsVirtualList`, `NotificationsPlaceholders` — page-private UI for a feature that *has* a `features/notifications/components/` directory); `(immersive)/kana/survival/_components/` (all 4 survival screens).
- **The kana-survival outlier:** `/kana/survival` is one of five kana modes. Its four siblings (hub, chart, learn, practice, quiz) each live in `features/kana/<mode>/components/`; survival's screens (`SurvivalSetupScreen`, `SurvivalQuizScreen`, `SurvivalDropScreen`, `SurvivalGameOverScreen`) and its orchestration live under `app/[locale]/(immersive)/kana/survival/`, while its logic (`useSurvivalGame`, split 07-17) lives in `features/kana/hooks/` — the mode is split across layers in a way no sibling is. The survival `page.tsx` is also one of the few pages that is a real orchestrator (wires dataset, auth, best-scores, router, game hook) rather than a one-line feature-root render.

**Consistency verdict:** mostly-consistent (one strong outlier plus one page-private-components case).

**Why the divergence exists** (Observation from git): survival's placement has survived **three** restructures without moving: (1) 2026-04-17 `3123798` created `features/kana/{hub,chart,learn,practice,quiz}` — survival screens stayed in `app/`; (2) 2026-07-03 `9e1893f refactor(architecture): relocate store, shared game ui, and the game engine into their owning features` — touched the survival page but did not relocate it; (3) 2026-07-09 `918b2d5` split the 378-line survival `page.tsx` into `_components/` **under `app/`**, entrenching the placement; the 07-17 `[locale]` restructure carried it along again. No commit message, comment, or doc states why survival is placed differently — **intent unknown**. The notifications `_components/` placement dates to the 07-16/07-17 virtualization + i18n work and is likewise unexplained.

**Cost of the divergence** (factual): the stated architecture rule ("route files are pure orchestrators; feature UI in features/") has a live counterexample that each restructure has had to handle specially; searching `features/kana/` for survival UI finds only hooks; the two placements answer "where do page-scoped components go" differently for equivalent situations (survival screens vs e.g. quiz screens).

**Confidence:** high (placement and dates verified; absence of stated intent verified by commit-message and comment search).

---

## PC-16 — State management (3 Zustand stores vs 3 contexts vs local state)

**Approaches observed** (re-verified: exactly 3 `from "zustand"` store files; exactly 3 `createContext` sites)

| Mechanism | Instances | Observable role |
|---|---|---|
| Zustand stores | `lib/app-store.ts` (auth + settings, persisted, 37 consumer files); `features/kana/store.ts` (alphabet mode, persisted); `useMatchGameStore` (transient match-grid, not persisted) | cross-cutting client state / persisted preferences / cross-component game grid |
| React contexts | `AdminContext` (role), `NotificationsContext` (single listener + derived state), `AlertContext` (imperative API) | subscription sharing and imperative APIs, each mounted exactly once in `lib/providers.tsx` |
| Local state | `useState`/`useTransition` everywhere else, incl. the dominant "subscribe-in-effect + render-time reset" idiom for realtime hooks | per-surface state |

**Consistency verdict:** mostly-consistent.

**Why the divergence exists** (Observation + Interpretation): the split is old and stable — both persisted stores date to the first day (04-12, `4ac8805`), the match store to 04-15, the contexts to 04-15/04-18. Observable pattern: stores hold *data* shared across unrelated trees; contexts hold *resources* (a listener, an imperative API) that must be mounted/torn down once — and the NotificationsContext docblock states that rationale for itself. **Interpretation:** the mapping is coherent, but no document states it as a rule; the closest written guidance (ADR-002) covers server data only. Why Match mode alone among the games uses a Zustand store while Speed uses a class state machine + hooks and Survival/Quiz use hook-local state is **intent unknown** (each arrived with its own April feature commit: `4f5779d`, etc.).

**Cost of the divergence** (factual): three mechanisms with an unwritten decision rule; game-state idioms differ per game, so game contributors context-switch between store-actions (Match), a transition-guard class (Speed), and hook state (Survival/Quiz) for the same kind of problem.

**Confidence:** medium (inventory verified; role-mapping is interpretation).

---

## PC-17 — Theming / design tokens

**Approaches observed** (re-verified)

| Variant | Mechanism | Scale |
|---|---|---|
| A | semantic tokens — CSS variables in `app/globals.css` (`--color-hiragana: #58cc02`, `--color-katakana: #1cb0f6`, `--color-survival: #ff9600`, …) surfaced as Tailwind classes (`bg-hiragana`, `text-text`, …); token modules `shared/constants/styles.ts`, `shared/utils/colors.ts`, `features/admin/domain/chartTheme.ts` (9 importers), role colors in flashcard rbac; a repo-level `design-system` skill documents the system | dominant |
| B | raw hex — **38** arbitrary-value classNames (`…-[#xxxxxx]`) across **29** files, plus inline hex in SVG/recharts props | e.g. `ChartCell.tsx` `border-[#58cc02]/30` *on the same line as* `bg-hiragana/10` (the hex **is** the hiragana token value, hardcoded); `SurvivalSetupScreen.tsx` `focus:border-[#ff9600]` (= the survival token); `ScreenHeader.tsx` `bg-[#0a0a1a]/90`; `GrowthChart.tsx` imports `CHART_TOOLTIP_STYLE` but inlines `stroke="#58cc02"` rather than using `CHART_PALETTE` |

`chartTheme.ts`'s header documents the one *legitimate* hex carve-out (recharts renders raw SVG attributes that can't resolve Tailwind classes) and records prior drift it fixed (`#ffc800`, `#ff4b4b` — near-token values that were never real tokens).

**Consistency verdict:** mostly-consistent (single token system, actively converging; a quantified raw-hex tail).

**Why the divergence exists** (Observation from git): **staged migration, still in motion.** Tokens were wired into the Tailwind theme on 2026-07-04 (`4992e62`) with a full-codebase compliance sweep the same day (`b9d5dd7`); chart color consolidation came 07-17 (`489312a` de-duplicated color maps); and hex→token replacement was still landing on the final day of history (`0e6340c fix(flashcard): replace hardcoded hex colors with real design tokens`, 07-18). The 29 remaining files are the un-swept tail; several hardcode the exact value of an existing token, which is the signature of pre-token code (April era) rather than deliberate exception.

**Cost of the divergence** (factual): a token value change (e.g. the hiragana green) would not propagate to the 38 hardcoded occurrences; the same visual color is expressed three ways (token class, arbitrary-value hex, SVG-prop hex), which the chartTheme header shows has already produced real drift once (`#ffc800`/`#ff4b4b`).

**Confidence:** high (counts and dates verified).

---

## PC-18 — i18n usage

**Approaches observed** (re-verified)

- One mechanism: next-intl. `useTranslations` in **133** `.tsx` files (+ `.ts` data modules → 151 total); `getTranslations` in 6 server files; messages `en.json`/`ja.json` with **exact key parity — 803/803 keys, 0 missing either direction** (verified programmatically today).
- Navigation: all wrapped symbols (`Link`, `useRouter`, `usePathname`, `redirect`) come from `@/i18n/navigation` (31 files); the 7 files importing raw `next/navigation` import **only unwrapped symbols** (`useSearchParams`, `notFound`) — verified per file. Raw `next/link`: 0.
- Tail: hardcoded-string extraction was still occurring after the migration epic (`6368c36 fix(ui): i18n-extract LoadingSpinner's hardcoded subtitle string`, and `a1368f8` post-epic extraction).

**Consistency verdict:** consistent.

**Why (no competing mechanism):** i18n arrived as **one phased epic on a single day** — `7447e76 feat(i18n): adopt next-intl + [locale] route restructure (E12-T1)` (2026-07-17) followed the same day by extraction phases 2–6d and metadata/toast/data-label passes (nine E12-T2 commits). Because adoption was atomic rather than incremental-over-months, no second i18n idiom ever existed.

**Cost:** n/a for pattern consistency. (Factual caveat: the straggler commit one day after the epic shows extraction *coverage* was not complete at cutoff; whether more hardcoded strings remain is **evidence-insufficient** — key parity proves the catalogs match each other, not that every UI string is cataloged.)

**Confidence:** high for mechanism consistency; low for "all strings extracted".

---

## Where evidence is insufficient (roll-up)

- **End-state scope of staged migrations** (PC-1 forms, PC-7 zod, PC-17 tokens): git shows direction and velocity but no commit declares the intended final coverage.
- **Kana-survival placement** (PC-15) and **notifications page `_components`** placement: no stated intent anywhere in commits, comments, or docs.
- **Reports' exclusion from the table engine** (PC-2): plausible constraint reading, but undocumented.
- **Skeleton non-consolidation** (PC-10), **module-cache exemption from ADR-002** (PC-14), **per-game state idioms** (PC-16), **tab-filter URL-vs-local split** (PC-12): observed, cause not evidenced.
- **i18n extraction completeness** (PC-18): not provable by the checks run here.

## Discrepancies vs the discovery corpus (repo re-verification, 2026-07-19)

1. **`useMutation` count** — `10-Pattern-Catalog.md` §16 states 9 call sites; the repo has **6** (3 in `useUsers.ts`, 2 in `useGlobalContent.ts`, 1 in `useLogs.ts`).
2. **`onSnapshot` spread** — catalog §18.1 says "14 call sites across 10 modules" (its own list names 9); `02-Architecture-Discovery.md` §12.4 says 13 files. Re-verified: **14 call sites across 9 files** (neither `NotificationsContext.tsx` nor `useLessons.ts` calls `onSnapshot` directly — they consume subscribe services).
3. **`useAlert` consumer count** — `02-Architecture-Discovery.md` §8 says 7 files; `07-Provider-Inventory.md` says 11. Re-verified: **11 files / 30 call sites** (07 is correct; 02 is stale/under-counted).
4. **`useTranslations` count** — catalog's 133 matches `.tsx` files only; including `.ts` data modules the figure is 151. Not an error, but the counting basis was implicit.
5. **New quantification beyond discovery** — the raw-hex tail (38 arbitrary-value classNames across 29 files, several duplicating existing token values) and the perfect en/ja key parity (803/803) were not quantified in the discovery corpus.
6. All other spot-checked counts matched discovery exactly: 2 `useForm` files, 0 `<form>`, 7 `<ConfirmModal>` files, 2 `<Modal>` files, 0 `<Drawer>` consumers, 4 direct `Dialog.Root` files, 8 `useQuery` sites, 3 Zustand stores, 3 contexts, 10 `"use server"` modules, 0 route handlers, 0 `loading.tsx`, 1 `<Suspense>` file, 4 error-boundary files, 19 `animate-pulse` files, 22 `LoadingSpinner` consumers, 30 `showAlert` sites.
