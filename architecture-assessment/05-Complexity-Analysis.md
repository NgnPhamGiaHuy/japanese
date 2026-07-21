# 05 — Complexity Analysis

**Architecture Assessment phase.** This document explains **why** the codebase's complexity exists where it does — causes, not just effects. It evaluates and explains only; no fixes or proposals.

- **Repo root:** `/Users/yuh.nguyenpham/GitHub/japanese`; Next.js project root `src/`. Paths relative to `src/` unless prefixed with `/`.
- **Method:** each entry names the complexity as experienced (**Effect**), assigns the **Cause category** the evidence supports (historical evolution · premature abstraction · feature growth · lack of standards · multiple implementation patterns · legacy compatibility · framework limitation · team convention), cites **Evidence** (file:line and git history — commit messages are treated as observable facts about what changed), gives an **Interpretation** (clearly separated from observation), and states **Confidence**. Where intent cannot be recovered from code or history, that insufficiency is stated.
- Verified at commit `a0bbbc4` (2026-07-19). Companion document: `04-Root-Cause-Analysis.md` (RC-x references below).

## Summary table

| ID | Source of complexity | Cause category | Confidence |
|---|---|---|---|
| CX-1 | Notifications carries a full set of migration-era compatibility machinery | Legacy compatibility (+ historical evolution) | High |
| CX-2 | `flashcard` is 2× the size of the next-largest feature and hosts half the app's concerns | Feature growth | High |
| CX-3 | Three write-path families with three auth transports | Historical evolution (+ legacy compatibility) | High |
| CX-4 | 61 barrel `index.ts` files mediating nearly every import | Team convention | High |
| CX-5 | Motion (`LazyMotion strict`/`m.*`) and audio (`shared/audio`-only) usage constraints | Team convention (deliberate boundary) | High |
| CX-6 | Five stacked auth-gating layers with a hand-mirrored public-path allowlist | Historical evolution | High |
| CX-7 | Capability-first infrastructure with zero or one consumer (Drawer, fan-out callable, Storybook, PostHog, dormant vocabularies) | Premature abstraction | Medium-High |
| CX-8 | File-splitting program (200-line warn ceiling, "below 400 lines" epics) producing many small modules + suffix taxonomies | Team convention | High |
| CX-9 | Two component-placement conventions (`features/*` vs route `_components/`) with no recorded rule | Lack of standards | High |
| CX-10 | Locale-prefixed routing forcing locale-awareness into middleware, navigation, and tests | Framework limitation | Medium-High |
| CX-11 | `artifacts/{APP_ID}/users/{uid}/…` Firestore nesting + path-builder modules + dual `APP_ID` env vars | Legacy compatibility (origin unrecoverable) | Medium |
| CX-12 | `admin` is a parallel sub-application with its own RBAC, table engine, cache, and action client | Feature growth + multiple implementation patterns | High |

---

## CX-1 — Notifications: migration-era compatibility machinery

**Effect**
Working in `features/notifications` means holding two schemas at once. Every reader handles `status` *and* legacy `read`; every writer emits both plus both `data.shareLink` and legacy `link`; two type vocabularies coexist (`NotificationType` 4 values vs `NotificationKind` 16, with 10 values actually stored — RC-2); `markAllAsRead` runs two queries against two composite indexes; four `@deprecated` fields sit in the core interface; and a one-time backfill script lives in `scripts/`. A 2,248-line feature (non-test) spends a large fraction of its surface on being two systems at once.

**Cause category**
**Legacy compatibility**, produced by **historical evolution**: an April-era notification system was replaced by a July platform mid-flight, with the compatibility layer deliberately kept until a backfill completes — and completion is unrecorded (RC-3).

**Evidence**
- Timeline: `725633b` (2026-04-14) "add notifications and email invite flow" → `ca8a654` (2026-07-11) "server-authoritative notification platform" (49 files, +2,844/−337 — a rebuild, not a patch) → five subsequent refactor commits that reshape but never retire the dual machinery (`9527089`, `c067b60`, `489312a`, `b4204dd`, `348c484`).
- Dual machinery in code: `types/index.ts:71-81,104-109`; `notification.actions.ts:219,223-224`; `notification.service.ts:51-52,59-63,68,75,99-101`; `firestore.indexes.json:39,47,55`; `scripts/backfill-notifications.mjs`.
- The staged plan is written down in the code itself: `notification.service.ts:59-63` names the exact retirement condition ("Once scripts/backfill-notifications.mjs has run in prod… drop the `read` query + its index and the dual-write").

**Interpretation**
This complexity is *earned*, not accidental — the migration was executed with textbook staging (dual-write → backfill → retire), and the machinery is exactly what protects old documents from vanishing. What converts a temporary cost into a permanent one is that the final step's precondition lives outside the repo (production data state), so the machinery has no expiry. The feature's complexity is therefore best read as "a migration frozen at its second-to-last step," and every future contributor pays the two-schema tax without being able to tell whether they still need to.

**Confidence:** High (the causal chain is documented in the code and dated by commits; only the *current necessity* of the machinery is unknowable, and that unknowability is itself the point).

---

## CX-2 — `flashcard`: accreted feature growth to 2× any other feature

**Effect**
`features/flashcard` is 142 non-test files / ~16.6k lines — larger than `admin` (105/8.4k) and `kana` (53/4.1k) combined-ish, and ~45% of all feature code. It contains deck CRUD, SRS/progress, three game modes (study/match/speed) each with intro/playing/results screens and session hooks, sharing/RBAC, comments, AI panels, import/export, dashboard, detail views, and loaders. It also owns the single largest cross-feature edge (29 import sites into `features/game`) and participates in the repo's only feature cycle (RC-1). Six of the top-10 largest components and 5 of the top-10 hooks are flashcard files.

**Cause category**
**Feature growth** — accretion around the product's center of gravity, at sprint speed.

**Evidence**
- Git dates the accretion precisely: `f6a4418` (2026-04-13) "card hooks, SRS, sharing & study modes"; `ef3035d` (04-13) import + theming; `5975909` (04-13) AI generation; `3413d46`/`bed4125` (04-14) shared lessons + immersive pages; `4f5779d` (04-15) Match revamp; `028aaaf` (04-15) primary/alternatives migration; `b37e17b` (04-16) SM-2 + mnemonics; `68acb0f` (04-16) drag-reorder; `70a7b62` (04-17) unified GameEngine — i.e. roughly one subsystem *per day* landed in this one feature during the April sprint.
- The July program split files but not scope: `ab00b12`/`c067b60` (E11-T3/T4) "split God services below 400 lines", `f3a8473` (E17-T1) session-state extraction — all intra-feature reshuffles; `9e1893f` (2026-07-03) moved the *generic* game engine out to `features/game`, which is why flashcard now imports game 29 times instead of containing it.
- Size figures: `wc -l` per feature (2026-07-19); largest-file tables in `/project-discovery/11-Code-Metrics.md` §2-3 (spot-verified).

**Interpretation**
Flashcard is big because the product is flashcards — this is concentration matching domain weight, not pathology per se. The complexity *cost* shows up at the seams the growth created: game modes that half-live here and half in `features/game` (29 edges), sharing logic that spills into notifications (RC-1) and admin (deck moderation), and a directory whose internal taxonomy (`components/ dashboard/ detail/ games/{match,speed,study}/ hooks/ loaders/ services/ types/ utils/ domain/`) is itself a small architecture. The July splits show the team managing file-level size while accepting feature-level size; whether flashcard *should* be one feature is a design question no ADR addresses.

**Confidence:** High for the accretion narrative (fully dated); Medium on any claim about whether the concentration is harmful — the evidence shows cost only at the seams, not in the bulk.

---

## CX-3 — Three write-path families as staged evolution

**Effect**
A contributor must learn three mutation architectures — client-SDK-under-rules, cookie-session admin actions + React Query, and token-bind-arg safe actions — and know which one a given change belongs to; auth reasoning, error conventions, and test harnesses differ per family (full analysis in RC-11).

**Cause category**
**Historical evolution**, preserved by **legacy compatibility** at the final consolidation step.

**Evidence**
- Era 1 (client-SDK): the entire April sprint writes Firestore directly (`befcd83` 04-12 "lesson CRUD" onward); rules are the only server-side authority.
- Era 2 (admin actions): `36d3931` (04-18) adds the admin module; `fa99063` (04-19) "use cookie-based auth" gives those actions their transport.
- Era 3 (safe-action formalization): `8fd3f2f` (2026-07-16) "schema-driven validation, react-hook-form, next-safe-action" wraps *both* server families in typed clients — and the code says why they stayed two: `lib/safe-action.ts:14-31` ("Two families of actions exist in this repo, with different auth entry points, so there are two clients"), with `toActionResult` (`:47-60`) existing "so callers written against the pre-migration `ActionResult<T>` contract are unaffected".
- Era 1 reaffirmed as permanent, not residual: `/docs/adr/002-data-layer-pattern.md` (2026-07-16) — "Realtime data stays on bespoke `onSnapshot` hooks — unconditionally."
- Consolidations happened *within* families only: `bbd1534` (E17-T4) unified the activity-log write path inside family C; `d9a8d5d` (E17-T5c) unified pagination inside family B.

**Interpretation**
Each family is a fossil of the trust boundary the app had when that family was born: no server (A), a cookie-session admin surface (B), token-carrying client services (C). The July program chose to *formalize the strata* rather than flatten them — a defensible low-risk choice, explicitly compatibility-motivated — which means the complexity is now load-bearing convention rather than transitional mess. The cost is permanent tri-modal reasoning; the benefit was zero rewrite risk during modernization. Whether B and C's transports should converge is the one question the evolution left open (and `safe-action.ts`'s docstring documents the difference without justifying it).

**Confidence:** High — the era boundaries, the preservation motive, and the within-family-only consolidation pattern are all directly evidenced.

---

## CX-4 — The barrel-file convention (61 `index.ts` files)

**Effect**
Nearly every directory exports through an `index.ts` barrel (61 in the Next.js app; 62 counting `functions/src/index.ts`, which is an entry point, not a barrel). Imports read cleanly (`from "@/features/kana/hooks"`), but: the true dependency graph hides behind re-exports (the discovery dependency analysis had to caveat exactly this — edges "are attributed to the barrel, not the underlying file"); jump-to-definition takes two hops; and barrels create wide re-export surfaces where a single deep import would do.

**Cause category**
**Team convention** — deliberately adopted, once deliberately *reversed*, then re-established.

**Evidence**
- Count: `find`-verified 2026-07-19 (61 excluding `functions/`). Spread across every feature and shared layer (list in working notes; e.g. `features/flashcard` alone has 12).
- The convention's history is unusually visible in git: `6c1ae07` (2026-04-14) "chore: refactor feature barrels…" (adoption); **`c474f64` (2026-06-03) "refactor(architecture): remove barrel exports and standardize import paths"** (explicit reversal); yet the July program re-grew them to 61 and pruned only "duplicate/pass-through files" (`94a9ef4`, E17-T10) — the *pattern* survived its own removal commit.
- Cost acknowledged in-repo: `/project-discovery/08-Dependency-Graph.md` "Method limits" — barrels defeat static edge attribution; the same limit applies to any future tooling.

**Interpretation**
The June removal followed by July re-accretion is the strongest available evidence that barrels here are a genuine team preference, not inertia — the codebase reverted to them under active stewardship. The convention trades analyzability (dependency tooling, tree-shake clarity) for import ergonomics and a nominal "public API" per module. Notably, the public-API benefit is unenforced: nothing (lint rule, tsconfig paths discipline) prevents deep imports, and deep imports exist (e.g. `@/features/flashcard/components/ShareModal` from `home`), so the barrels deliver their cost while only partially delivering their promise. Why the June removal was abandoned is not recorded; that intent gap is stated as unknowable.

**Confidence:** High on cause (convention, with the removal/re-adoption arc as evidence); the "partially delivered promise" point is interpretation from observed deep imports.

---

## CX-5 — Motion and audio constraints as deliberate, enforced boundaries

**Effect**
Two subsystems impose non-obvious usage rules that every contributor must learn: animation must use `m.*` components inside a `LazyMotion strict` provider (a bare `motion.*` render *throws at runtime*), with features loaded via a code-split dynamic import; and all sound must route through `shared/audio` — constructing `Audio`, `AudioContext`, or touching `speechSynthesis` anywhere in `features/ app/ lib/` is an ESLint **error**.

**Cause category**
**Team convention** — deliberate boundaries, each formalizing a lesson from a documented prior failure. This is complexity *purchased on purpose*.

**Evidence**
- Audio: `eslint.config.mjs:23-57` (`no-restricted-globals`/`-properties` with per-API messages), whose comment states the failure being prevented: "the previous system ended up with two competing singletons, a user setting that only half the app honoured, and failures nothing could observe. See docs/adr/001-audio-architecture.md." The ADR exists; the rebuild is dated (`db4e9a7`, 2026-07-10, "rebuild sound system around a single AudioManager"; earlier pipeline work `d9afd3a` 07-03).
- Motion: `lib/providers.tsx:70-81` — `LazyMotion … strict` with a comment explaining both the code-split rationale (measured "byte-identical" outcome of the naive alternative, citing E11-T1's commit message) and strict-mode's purpose: "a guardrail against reintroducing that unshaken import." Dated: `1ef527c` (2026-07-17, "rename framer-motion→motion + LazyMotion/m tree-shaking (E2-T6 gap-fill, E11-T1)"). Note the motion guardrail is *runtime* (strict throw), not lint — there is no ESLint rule for `motion.*`; enforcement asymmetry between the two boundaries is observable fact.
- Adoption breadth: `m.*` in 16 files; `playSfx`/`playVoice` in 11 files (grep counts, discovery-corroborated).

**Interpretation**
Both constraints concentrate complexity at the boundary (one provider, one module family, lint/runtime guards) to remove a *diffuse* complexity that had already burned the project once (audio) or measurably bloated the bundle (motion). They are the clearest examples in this codebase of complexity with a stated, verifiable payoff — and they demonstrate the team's enforcement toolkit (lint rules with teaching messages, runtime strict modes, ADRs). The asymmetry — audio gets lint, motion gets runtime-only — means a `motion.*` regression is caught later (first render) than an `Audio` regression (editor), an inconsistency with no recorded reason.

**Confidence:** High — intent, mechanism, and dates are all first-party documented.

---

## CX-6 — Five stacked auth-gating layers

**Effect**
"Is this user allowed to see this?" is answered five times per page view, by five mechanisms in four layers: (1) Edge redirect on cookie presence (`proxy.ts:60-99`); (2) app-wide `AuthGate` boot splash blocking render until auth resolves (`lib/providers.tsx:26-47`); (3) per-page `router.replace("/login")` effects (settings, profile, login-inverse); (4) hook-level `if (!user) return` early-outs in data hooks; (5) real verification server-side (rules for client SDK, `verifyIdToken`/`assertAdminAction` for actions). The proxy and `AuthGate` each maintain their own copy of the public-path allowlist, mirrored by hand.

**Cause category**
**Historical evolution** — defense accumulation, each layer added against a specific failure mode of the layer before it, none removed.

**Evidence**
- Layer dates: middleware gate `befcd83`/`0ddb6b6` (2026-04-12/13); cookie transport `fa99063` (04-19); `AuthGate` splash + allowlist mirroring comment in `lib/providers.tsx:19-24` ("mirrors the proxy allowlist"); per-page redirects at `SettingsPageClient.tsx:44`, `profile/page.tsx:40`, `login/page.tsx:26`; hook guards e.g. `useLessons.ts:57,93`; server verification RC-4/RC-11 citations.
- Why the client layers can't trust the Edge layer: the proxy checks presence only (RC-4) and the cookie can outlive token validity — so pages *must* re-check; the hooks can't trust pages (deep links, race on auth resolution) — the layering is each stratum distrusting the one above, correctly.
- A sixth-layer fossil is visible in the code: `useFirebaseAuth`'s header narrates four "Previous failed approaches" (module vars, sessionStorage, `onAuthStateChanged`, client-side guards) — direct evidence the gating stack was reached by iteration, not design.

**Interpretation**
Given the presence-only Edge gate (a structural consequence of client-SDK auth, RC-4), most of this redundancy is *necessary* — the client layers do real work the Edge can't. The genuinely accidental complexity is narrower: the hand-mirrored allowlists (two copies that must move together, acknowledged only in a comment) and the per-page redirect effects that partially duplicate what `AuthGate` + proxy already provide. The stack is a coherent response to a weak foundation rather than incoherent paranoia; its cost is that changing "what is public" touches at minimum two files and up to four layers.

**Confidence:** High for the accumulation narrative and the necessity argument; the classification of per-page redirects as redundant is interpretation (they also handle post-load sign-*out*, which the proxy can't).

---

## CX-7 — Capability-first infrastructure with zero (or one) consumers

**Effect**
The repo contains a stratum of built-but-unconsumed capability that a reader cannot distinguish from live product without producer-tracing: a `Drawer` primitive with **0** render sites; a deployable `fanOutNotifications` callable **no code calls**; a full Storybook toolchain (7 devDependencies, scripts, a11y/vitest/mcp addons) with exactly **1** story; PostHog wired through a first-party reverse proxy capturing exactly **1** event type (`$pageview` — the init comment promises "product events" that don't exist); 7 pre-declared inactive notification kinds and 8 unemitted activity actions (RC-7); a `canChangeSettings` permission no action declares; audio telemetry counters with no production reader.

**Cause category**
**Premature abstraction** — more precisely, *capability-ahead-of-consumer* construction, in two distinct flavors (see Interpretation).

**Evidence**
- Drawer: `shared/components/ui/Drawer.tsx` built `fa2b6ab` (2026-07-17, E13-T2); grep `<Drawer` → definition only (re-verified).
- Fan-out: `functions/src/fanout.ts:7-15,128-134` — self-documenting: "No current product action triggers this yet… exists so the durable fan-out capability is actually reachable and deployable rather than dead code"; no `httpsCallable` usage anywhere in the app.
- Storybook: 7 devDeps + scripts in `package.json` (`def2384`, 2026-07-16); single story `shared/components/ui/Badge.stories.tsx`.
- PostHog: `lib/PostHogProvider.tsx:18` (sole capture); proxy rewrites `proxy.ts:20-21,63-72`; init comment promising product events (`lib/posthog.ts`).
- Vocabularies/permission: RC-7 evidence; `canChangeSettings` grep → declared in rbac + metadata enum, used by zero actions; explicit stub page `AdminSettingsPageContent.tsx:13-16`.
- Telemetry: `shared/audio/telemetry.ts:111-117`; `getAudioCounters` referenced in production code only inside a comment (`lib/AudioProvider.tsx:38`).

**Interpretation**
Two flavors deserve separation. **(a) Documented capability staging** — the fan-out callable and the inactive registry kinds *say in code* that they are forward provisioning with a defined activation step; this is disciplined, if optimistic. **(b) Undocumented aspiration** — Drawer, Storybook, PostHog's promised product events, `canChangeSettings`: built, wired, then simply not adopted, with no marker distinguishing "next sprint" from "abandoned." Both flavors likely share a generator: the July modernization ran as a rapid epic program (E1–E17 in ~15 days by commit dates), and epics that *land infrastructure* complete visibly while the consumer half has no forcing function. The complexity cost is epistemic — every audit (including this one) must producer-trace to learn what the system actually does — and it compounds: unconsumed capability is where drift accumulates unnoticed (nothing exercises it). Whether any given item is roadmap or residue is unknowable from the repo; that unknowability is the cost.

**Confidence:** Medium-High — the inventory is fully verified (High); attributing it to the epic program's structure is plausible-but-inferential (Medium).

---

## CX-8 — The file-splitting program: size ceilings as team law

**Effect**
The codebase is shaped by explicit size limits: an ESLint `max-lines` warning at 200 (`eslint.config.mjs:59-67`, noting "~46 pre-existing files over the limit"), and a refactor program that repeatedly "split X below 400 lines" (E11-T3/T4). The result is many small modules with suffix taxonomies — `lesson.service` / `lesson-save` / `lesson-paths` / `lesson-normalize` / `lesson-subscriptions`; `notification.service` / `-subscribe` / `-pending` / `-paths`; `analytics.service` + five `analytics-*` builders — plus the barrels (CX-4) needed to stitch them back together. Understanding "the lesson service" now means reading five files; but no file is a monster.

**Cause category**
**Team convention** — an explicit, tooling-enforced norm (referenced in-code to an out-of-repo `architecture.rule.md`).

**Evidence**
- `eslint.config.mjs:60-66` — "Self-imposed 200-line ceiling (architecture.rule.md). Introduced as a WARNING first… tighten to 'error' per file as they're split (see R31/E11)."
- Split commits: `ab00b12` (E11-T3, "split 4 God services below 400 lines"), `c067b60` (E11-T4, same for 3 hooks/services), `1664956` (E17-T6, "split game.service"), `f3a8473` (E17-T1, session-state extraction).
- Resulting taxonomy: `features/flashcard/services/` has 16 files where the April era had a handful (`git log --follow` on `lesson.service.ts` shows the split lineage); path-builder modules exist *as a genre* (`lesson-paths`, `comment-paths`, `notification-paths`).
- Residual pressure: 25 files still exceed 250 lines (`11-Code-Metrics.md` §2, spot-verified) — the ceiling is aspirational at warn level.

**Interpretation**
The convention trades depth-of-file for breadth-of-directory. It demonstrably fixed the "God service" problem (the largest service fell from 400+ to 379 max, most far below), and the split seams mostly follow real responsibilities (paths vs save vs subscribe), so cohesion survived. The costs are the co-read burden (one concept, five files), the barrel dependency (CX-4 is partly *caused* by CX-8 — splitting creates the re-export need), and a subtle one: line-count ceilings reward extracting *anything*, and some extractions are taxonomy-driven rather than concept-driven (e.g. `analytics-constants.ts`). The warn-not-error stance with a stated tightening plan is evidence of deliberate, managed adoption rather than cargo cult.

**Confidence:** High — the convention, its enforcement, its motive, and its structural consequences are all directly evidenced.

---

## CX-9 — Two component-placement conventions, no recorded rule

**Effect**
A component's home is not predictable from its role. Feature UI mostly lives in `features/<f>/…/components/`, but four `_components/` directories under `app/` hold route-private UI — including an entire game mode's screens (kana survival, RC-8) and half of the notifications UI (`NotificationsVirtualList` route-side; `NotificationRow`/`InviteActions` feature-side). Contributors must check two trees, and feature-scoped tooling/searches silently miss route-side members.

**Cause category**
**Lack of standards** — two individually-coherent conventions coexisting with no written tiebreaker.

**Evidence**
- The four `_components/` dirs: `app/_components` (error/maintenance chrome — clearly correct there), `(main)/_components` (BottomNav), `(main)/notifications/_components`, `(immersive)/kana/survival/_components`.
- The split is *actively maintained*, not just residue: E17-T8 (`348c484`, 2026-07-18, "relocate notifications") moved notification files while leaving the split in place; the survival screens were edited by four epics in place (RC-8 evidence).
- Counter-convention: every other kana mode and every flashcard game keeps screens feature-side (`features/kana/quiz/components/`, `features/flashcard/games/speed/components/`).
- No ADR or rule file in-repo addresses placement (`docs/adr/` covers audio, data layer, flags only).

**Interpretation**
Route-private `_components/` is a legitimate Next.js idiom, and for genuinely route-bound chrome (BottomNav, error fallbacks) it is arguably the better home. The complexity arises because the *boundary* between "route-private" and "feature UI that happens to have one route" was never articulated — survival screens and the notifications list are feature UI by any dependency test (they import feature hooks/domain), yet live route-side. Each individual placement decision was probably locally reasonable; the aggregate is a rule that can only be learned by enumerating exceptions. This is the textbook shape of missing-standard complexity: no single wrong decision, no consistent right one.

**Confidence:** High on the observation and category; intent per-file is unrecoverable (stated in RC-8).

---

## CX-10 — Locale-prefixed routing: framework-imposed pervasiveness

**Effect**
The E12 i18n adoption moved the entire route tree under `app/[locale]/`, and locale-awareness now leaks into every layer that touches a URL: the middleware must strip locale prefixes before auth matching (`splitLocale`, `proxy.ts:32-41`) and compute canonical prefixes for redirects; all navigation must go through `@/i18n/navigation` wrappers instead of `next/navigation`; tests need a navigation shim (`i18n/navigation.testshim.ts` aliased in `vitest.browser.config.ts`); crawler files (`sitemap.xml`, `robots.txt`) need explicit bypass carve-outs (`proxy.ts:74-76`); and the "as-needed" prefix mode means every URL has two valid spellings for the default locale (`/kana` and `/en/kana`), which `splitLocale` must reconcile.

**Cause category**
**Framework limitation** — the App Router has no first-class i18n routing, so next-intl's dynamic-segment pattern is the standard workaround, and its costs are structural to that pattern, not to this team's use of it.

**Evidence**
- Adoption in one commit: `7447e76` (2026-07-17, E12-T1, "adopt next-intl + [locale] route restructure") — `git log --follow proxy.ts` shows the middleware gained its locale logic here.
- The leakage sites: `proxy.ts:25-41,55-58,74-76`; `i18n/routing.ts` (`"as-needed"`, en/ja); navigation wrappers used repo-wide (133 files use `useTranslations`; navigation imports go through `@/i18n/navigation` — grep-verified pattern); test shim wiring.
- The dual-spelling subtlety is handled explicitly and correctly (`splitLocale` docstring: visiting `/en/kana` explicitly "is still recognized… but its canonical prefix is ''") — i.e., the team paid the full cost consciously.

**Interpretation**
This complexity was bought in a single day for a real capability (full ja parity — 803 keys — exists) and is mostly irreducible given the framework: any App Router i18n has this shape. The observable irony is that the capability is dark by default: the locale switch ships behind `locale_switch_enabled`, in-repo default `false` (`lib/flags.ts:22`), so the codebase carries the full pervasive cost while the user-visible benefit depends on a Remote Config value the repo cannot see (Known-Unknowns U-3). Whether the switch was ever enabled in production is unknowable here.

**Confidence:** Medium-High — the framework-limitation attribution is standard and evidenced; "cost paid, benefit gated" is observation; anything about production flag state is explicitly unknowable.

---

## CX-11 — The `artifacts/{APP_ID}/users/{uid}/…` Firestore layout

**Effect**
Every data access — client services, admin services, server actions, Cloud Functions, security rules, indexes — must navigate a four-level prefix before reaching domain data (`artifacts/{APP_ID}/users/{uid}/lessons/...`). This spawned a genre of path-builder modules (`lesson-paths.ts`, `comment-paths.ts`, `notification-paths.ts`), hand-built path template functions server-side (`notification.actions.ts:39-49`), deep `match` nesting in `firestore.rules` (`match /artifacts/{appId}`), collection-group workarounds for cross-user queries (`collectionGroup("lessons")`), and a duplicated tenant knob: the app reads `NEXT_PUBLIC_APP_ID`, the functions package reads `NOTIFICATIONS_APP_ID`, both defaulting to `"kana-nihongo-master"` from different files (`lib/app-id.ts:1` vs `functions/src/fanout.ts:126`, `digest.ts:151`) — agreement is by convention only.

**Cause category**
**Legacy compatibility** — the layout is load-bearing in production data and cannot be revisited cheaply; its *origin* is unrecoverable from the repo (no ADR, no commit message explains `artifacts/`; the structure is present from the earliest data-touching commits). The `artifacts/{appId}` shape is characteristic of multi-tenant scaffold templates, but that reading is conjecture; the evidence gap is stated.

**Evidence**
- Path builders and consumers cited above; `firestore.rules` nesting; `E16-T3` (`b4204dd`, 2026-07-18) extracting `APP_ID` into a shared constant — the July program *centralized the symbol* but (correctly) could not change the layout.
- Single-tenant reality: nothing anywhere iterates or switches `APP_ID`; it is a constant prefix on every path in a one-app system.
- Dual env vars: verified in the two packages; `12-Known-Unknowns.md` U-19 notes the production-sync question is unknowable.

**Interpretation**
The layout functions as a tenancy abstraction serving exactly one tenant — pure prefix tax. Because Firestore data layouts effectively can't be migrated in place, this is the codebase's least reversible decision, made (on the evidence) earliest and with the least recorded deliberation. The path-builder module genre and the rules nesting are rational *responses* — they contain the tax — but the split-brain env var between packages is an unforced extension of it: two services that must agree on a data root have no shared source for it.

**Confidence:** Medium — the effect and irreversibility are High-confidence; the origin story is explicitly unrecoverable, and the "scaffold template" reading is labeled conjecture.

---

## CX-12 — `admin` as a parallel sub-application

**Effect**
`features/admin` (105 files) duplicates, in admin-flavored form, most architectural roles the main app already has: its own RBAC matrix and role resolution (`utils/rbac.ts` — separate from flashcard's deck-sharing RBAC), its own safe-action client (`adminActionClient` vs `actionClient`), its own data-fetching regime (React Query with a key factory — essentially unused elsewhere: 7 of 8 `useQuery` files are admin), its own table engine (`useDataTable` + 6 chrome components), pagination (`useCursorPagination`), chart theme, skeletons, and error states. A developer crossing from learner-surface to admin-surface changes almost every idiom at once.

**Cause category**
**Feature growth** compounded by **multiple implementation patterns** — the admin surface grew its own stack because its constraints genuinely differ, and the patterns never back-propagated.

**Evidence**
- Born as a wave: `3ffd37e`/`36d3931`/`04b5e06`/`fd614b5`/`af80991` (2026-04-17→23) — dashboard, guard, services, drilldowns, exports in six days.
- Genuinely different constraints, in code: privileged reads need the Admin SDK (`server-only` services); cursor pagination exists because "Firestore cursors can't jump ahead" (`useCursorPagination.ts` docstring); tables/filtering/CSV export have no learner-side equivalent.
- Pattern isolation, measured: React Query hooks — 6 admin files + 1 flashcard loader (`08-Dependency-Graph.md` §6.3, re-verified); `@tanstack/react-table` appears only under `features/admin` (`10-Pattern-Catalog.md` §3, grep-verified); two RBAC modules each declaring itself source-of-truth for its domain.
- July investment continued the separateness: E17-T5a/b/c (`1cce6e8`, `47730b1`, `d9a8d5d`) rebuilt admin hooks/tables *within* the admin stack.

**Interpretation**
Two RBACs and two action clients are *principled* duplication — deck-sharing roles and platform-admin roles are different domains, and merging them would be worse. The accidental part is subtler: admin became the only place several general-purpose patterns live (server-state caching, table engines, cursor pagination), so the app has patterns-per-surface rather than patterns-per-problem. When a learner-surface feature eventually needs a table or cached one-shot reads, the precedent is admin-shaped and admin-located, forcing either an awkward import across the admin boundary or a third implementation. The admin surface also carries the phantom-pipeline problem (RC-5) — its most data-hungry screens are the ones with no data source — which suggests the sub-application's *breadth* outran the platform beneath it.

**Confidence:** High for the observations and the growth narrative; the "patterns should be per-problem" framing is interpretation.

---

## Closing note: where the complexity is deliberate vs. drifted

Reading CX-1…CX-12 together, this codebase's complexity divides cleanly:

- **Deliberate and documented** (in-code rationale, ADRs, enforcing tooling): CX-5 (motion/audio boundaries), CX-8 (size ceilings), CX-3's final formalization step, the dual-file split in RC-9, ADR-002's data-layer rules. The team demonstrably knows how to buy complexity on purpose and write down why.
- **Historical strata never flattened**: CX-1, CX-3, CX-6, CX-11 — each a coherent response to its moment, preserved by compatibility pressure or irreversibility.
- **Drift from absent rules or absent completion tracking**: CX-2's seams, CX-4 (a convention that survived its own revocation, unrecorded why), CX-7, CX-9 — the same meta-cause identified in `04-Root-Cause-Analysis.md`: staged work whose later steps have no recorded status.

The distinction matters for any future decision-making: the first group's complexity has a written contract; the second's has a reason but no contract; the third's has neither — and it is the third group, not the largest files or the biggest feature, where this analysis found the codebase hardest to reason about.
