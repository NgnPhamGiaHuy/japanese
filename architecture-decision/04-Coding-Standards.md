# 04 — Coding Standards

**Architecture Decision phase, Phase 5.** These standards operationalize the decision kernel (AD-01…20, P-1…12) into rules a contributor can follow and a reviewer can enforce. Every standard is grounded in observed corpus reality: where the codebase already does the right thing, the rule **codifies** it; where a standard drifted or was declared-but-not-enforced (W-21 standards-decay), the rule **corrects** it. Each entry gives a **Rule**, a **Why** (with finding IDs from `project-discovery/` and `architecture-assessment/`), and a **corpus example** (good and/or bad instances the corpus already names — no invented code).

- **Binding inputs:** `scratchpad/decision-kernel.md` (fixed), `project-discovery/` and `architecture-assessment/` (evidence). Paths are relative to the Next.js root `src/` unless prefixed.
- **Enforcement stance (P-1):** a standard is only as real as its enforcement. Each rule states its enforcement mechanism — ESLint rule, review checklist, or naming convention — because the corpus's own history (CX-4 barrels survived their own removal; TD-3 200-line ceiling ignored by 44 files; W-20 hand-mirrored allowlists) shows documented-only conventions decay.
- **IDs:** standards are numbered CS-1…CS-14 for cross-reference from the ADRs and the migrations ledger (AD-20).

---

## CS-1 — When to create a shared utility (three-use rule)

**Rule.** Do not extract code into a shared location (`shared/`, a feature-root barrel, or a cross-feature module) until it has **three** genuine consumers. Two call sites stay duplicated or co-located; the third is the trigger to lift. Corollary: never build a shared primitive **ahead** of any consumer — a primitive with zero render sites is not "reusable infrastructure," it is dead weight (P-3, P-10).

**Why.** P-10 (three-use rule) and AD-11 (the table engine "lifts out of admin scope only when a third, non-admin consumer exists"). The codebase already proves both directions:
- **Correct extraction (do this):** `shared/utils/reorder.ts` fractional-indexing was lifted because it is genuinely shared across flashcard lessons, cards, and detail reordering (S-16); the `game` session/scoring/tier engine is consumed by both flashcard game modes *and* kana (S-16). These earned their shared status by multiplicity.
- **Cautionary case (do not do this):** the `Drawer` primitive (`shared/components/ui/Drawer.tsx`) was built ahead of demand and has **zero render sites**, while two features hand-roll the same slide-panel on `Dialog.Root` (`DeckDetailsPanel.tsx`, `AdminSidebar.tsx`) — W-21, TD-11, CX-7, OP-12. It delivers the maintenance cost of a shared component while delivering none of the reuse. Per AD-10 it is **delete-unless-claimed**.

**Example.** Good: `reorder.ts` (three consumers, extracted). Bad: `Drawer` (zero consumers, extracted anyway) — the exact anti-pattern this rule prevents.

---

## CS-2 — When to split a file (tiered ceiling, derived from the corpus size distribution)

**Rule.** Replace the dead 200-line warn-only ceiling (TD-3: warning on every lint run, ignored by 44 files) with a **three-tier** rule keyed to what the codebase's actual distribution and its own refactor program demonstrate:

| Tier | Range | Action | Enforcement |
|---|---|---|---|
| **Green** | ≤ 250 lines | No action. | none |
| **Review** | 251–400 lines | Allowed, but a PR-review checkpoint: the file must be **one cohesive responsibility**. If it is two, split by responsibility, not to hit a number. | `max-lines: ["warn", 400]` + review checklist |
| **Hard** | > 400 lines | Blocking. Must be split before merge (test files exempt). | `max-lines: ["error", 400]`, test-glob override |

**Why the numbers come from the corpus, not from taste.** `project-discovery/11` §1–3 gives the real distribution: 586 files, 49,883 lines → **~85 lines/file average**; the overwhelming mass is small. The tail is what matters: **44** files exceed 200 (TD-3), **25** exceed ~250 (§2, next-after-cut is `Button.tsx` at 256), and only a handful exceed 400 — top non-test files are `ShareModal.tsx` (436), `FlashcardPractice.tsx` (396), `admin.actions.ts` (380), `analytics-drilldowns.ts` (379), `useDropMode.ts` (367). Two facts fix the thresholds:
1. **250, not 200, is the honest "green" line.** A ceiling 44 files violate is noise that trains contributors to ignore lint (W-21, TD-3). ~25 files sit above 250; setting green at 250 makes the *review* band small and meaningful instead of a permanent 44-warning backlog.
2. **400 is the team's own demonstrated hard line.** The July program's split epics were literally named "split God services **below 400 lines**" (E11-T3/T4, CX-8). The team already enforced 400 by hand; making it a lint *error* codifies proven behavior. At 400-error, the only current non-test violator is `ShareModal.tsx` (436) — a near-empty backlog, which is what makes the rule adoptable (contrast the 44-file backlog that made 200 unenforceable).

Line count is a *smell trigger*, not the goal (CX-8: "line-count ceilings reward extracting *anything*"). The review-tier checkpoint asks "is this one responsibility?" — the split seams that worked (`lesson.service` → `lesson-paths`/`-save`/`-subscriptions`/`-normalize`) followed real responsibilities; taxonomy-only splits (`analytics-constants.ts`) are the failure mode to avoid.

**Example.** Good: the `lesson.service` family split by responsibility. Bad-to-fix: `ShareModal.tsx` (436, the single 400+ non-test file; also the deepest/longest function per §8) is the one file the hard ceiling forces to split — consistent with W-4/CX-2 flagging it already.

---

## CS-3 — Maximum abstraction level (no capability without a consumer)

**Rule.** An abstraction may not exist without a live consumer. No "capability-first" infrastructure — no generic base class, provider, registry entry, permission, or callable built for a future that has not arrived. If a forward-provisioned capability is deliberate, it **must** carry an AD-20 ledger entry (intended consumer, activation step, review-by date); undocumented aspiration is deleted (P-3, AD-19).

**Why.** CX-7 catalogs an entire stratum of built-but-unconsumed capability that no reader can distinguish from live product without producer-tracing: `Drawer` (0 sites), `fanOutNotifications` callable (no in-app caller), Storybook toolchain (1 story), PostHog (1 event type despite promised "product events"), 7 inactive `NotificationKind`s, 8 unemitted `ActivityAction`s, `canChangeSettings` (a permission no action requires). AD-19 makes each **delete-unless-claimed**; CX-7 distinguishes *documented staging* (fan-out callable says in-code why it exists and how it activates — acceptable) from *undocumented aspiration* (Drawer, `canChangeSettings` — deleted). The epistemic cost is that unconsumed capability is exactly where drift accumulates unnoticed, because nothing exercises it.

**Example.** Acceptable forward-provisioning: `functions/src/fanout.ts` self-documents "No current product action triggers this yet… exists so the durable fan-out capability is reachable and deployable" — it declares its own staged status (would satisfy AD-20). Unacceptable: `canChangeSettings` (W-10) — declared in the RBAC matrix and action-metadata enum, demanded by zero actions, with no marker saying "next sprint" vs "abandoned."

---

## CS-4 — Component responsibilities (the observed grammar, codified)

**Rule.** Every component occupies exactly one of three tiers; do not blend them:
1. **Route orchestrator** (`app/**/page.tsx`) — thin wiring only. Ideally a one-line render of a feature root; at most it wires data sources, auth, and router for an immersive screen. No business logic, no domain state (P-12, AD-05).
2. **Feature root** (`features/<f>/…/<Feature>.tsx` or `<Game>.tsx`) — composes the feature's screens/panels and owns orchestration via a controller hook (CS-5). This is where a feature's UI assembles.
3. **Presentational leaf** — receives data/handlers via props, renders, raises events. No direct service calls, no `onSnapshot`, no cross-feature imports.

**Why.** S-2 documents this grammar as an existing strength: nine features share one internal vocabulary and "route files are deliberately thin" (the kana-learn page is 8 lines, self-labeled "Pure orchestrator"). P-12 codifies "business logic lives in features; routes orchestrate." The one sanctioned exception is a genuinely orchestrating immersive page (kana survival's `page.tsx` wires dataset/auth/best-scores/router/game hook) — but AD-05 requires its *screens* to live in the feature (`features/kana/survival/`), not under `app/` (W-5, PC-15, CX-9, OP-17).

**Example.** Good: `StudySession.tsx` — "Pure phase-router — delegates all session state, grading, and completion logging to `useStudySession`" (a feature root delegating to its controller). `MatchGame.tsx` / `SpeedGame.tsx` self-label "Feature Root Component." Bad: kana survival's four `Survival*Screen.tsx` living under `app/[locale]/(immersive)/kana/survival/_components/` instead of `features/kana/survival/` — the placement W-5/AD-05 corrects.

---

## CS-5 — Hook responsibilities (session-controller + stable-callback-ref idiom)

**Rule.** A feature root's orchestration lives in a **controller hook**, not in the component. Two documented idioms are the standard:
- **Session-controller pattern:** one hook owns a surface's phase machine, state, and side-effect wiring, returning a flat interface the presentational tree renders. Presentational children receive derived values and handlers as props — they never call `useForm`/services themselves.
- **Stable-callback-ref idiom:** long-lived engines/sessions must not rebuild when a callback identity changes; mirror callbacks/values into refs inside `useLayoutEffect` (the corpus documents this at every engine hook). Same for the **render-time state reset** idiom: reset derived state during render on an identity-key change, not in an effect.

**Why.** The Hook Inventory (`project-discovery/05`) records both as cross-cutting observed patterns: the stable-callback-ref pattern appears in `useMatchModeSession`, `useGameEngine`, `useSurvivalGame`, `useKanaQuizSession`, `useDropMode`, `useMatchScoring` (each documents it in-file); the render-time-reset pattern in `useCards`, `useCardsWithProgress`, `useLessons`, `useCommentPanel`, `NotificationsContext`, etc. Codifying them prevents contributors from reintroducing the engine-rebuild and stale-state bugs these idioms were adopted to fix. The forms rule (CS-13) depends on this: PC-1 shows `useLessonBuilder`/`useShareInvites` own the `useForm` instance and pass `register` down — presentational components (`LessonBuilderMeta`, `ShareCollaboratorsPanel`) receive it as a prop.

**Example.** Good: `useStudySession` (owns mode/queue/grading/logging; `StudySession.tsx` just routes phases); `useMatchModeSession` (session controller with ref-stabilized callbacks). The controller-hook-owns-the-form rule is the existing PC-1A beachhead.

---

## CS-6 — Service responsibilities (context marking, path ownership, no reach-around)

**Rule.**
1. **Mark execution context.** Every service/action module declares and honors its context: client SDK (`@/lib/firebase`), `"use server"` action, `import "server-only"` (Admin SDK), or Cloud Function. A client service never imports Admin-SDK code and vice versa.
2. **Path-literal ownership.** Firestore/Storage path strings live only in the entity's dedicated path-builder module (`*-paths.ts`); no other module hand-builds a path literal. Consumers import `lessonsCol`/`notificationsCol`/etc.
3. **No cross-service reach-around.** A feature's hooks call that feature's services; cross-feature writes go through the other feature's **public API / action seam**, never by importing its internal service directly. Service-to-service imports stay within a feature (or through the sanctioned notifications action seam, AD-02).

**Why.** S-3 (physically fenced server/client separation: 10 `server-only` + 10 `"use server"` modules, leakage fails the build) is a codified strength — rule 1 preserves it. Rule 2 corrects the CX-11 tax: path builders already exist "as a genre" (`lesson-paths`, `comment-paths`, `notification-paths`) but server code still hand-builds path templates (`notification.actions.ts:39-49`) and the dual `APP_ID` source (`NEXT_PUBLIC_APP_ID` vs `NOTIFICATIONS_APP_ID`) means two packages agree "by convention only" (CX-11, TD-16, W-20, AD-18). Rule 3 is the mechanism of the W-1 cycle: `notifications/InviteActions` reaches back into `flashcard/actions` and flashcard services import notifications services — AD-02 converts that back-edge into a registry/injection seam owned by notifications' public API.

**Example.** Good: the `*-paths.ts` module genre; `shared.service.ts` (client SDK) and `shared-preview.service.ts` (Admin SDK) intentionally split by runtime with the split documented in-file (S-3, PC-6). Bad: the flashcard↔notifications value-import cycle (W-1, C3 cluster, TD-4) — the reach-around AD-02 bans.

---

## CS-7 — Folder conventions and barrel policy

**Rule.**
- **Feature grammar.** Each feature is `features/<name>/` with the observed internal vocabulary: `components/ hooks/ services/ actions/ domain/ types/ utils/ context/` plus per-feature areas (kana's mode folders, flashcard's `dashboard/ detail/ games/ loaders/`). All feature UI lives here — nothing route-private under `app/**/_components/` except genuine route chrome (error/maintenance fallbacks, BottomNav). (S-2, AD-05, CX-9.)
- **Barrel policy.** A barrel (`index.ts`) marks a **public-API surface**, not a per-directory default. Barrels are sanctioned at exactly: (a) each **feature root** — the single enforced cross-feature import surface (AD-01); (b) each **enforced internal sub-module** of flashcard (dashboard/detail/games/study/sharing/comments — AD-04); (c) `shared/components/ui`, `shared/components/layout`, `shared/schemas`, `shared/utils`. Do **not** add a barrel to a directory merely because it holds split files — re-stitch those through a named orchestrator module (the `lesson.service.ts` re-export pattern) or import them directly within the feature.

**Why.** CX-4 measures **61** barrels mediating nearly every import — a count that "hides the true dependency graph behind re-exports" and whose public-API promise is *unenforced* (deep imports exist anyway). W-3: only 2 of 9 features expose a root barrel, yet cross-feature code deep-imports internals (43 sites into `flashcard/types`). AD-01 fixes both ends: every feature exposes exactly one root barrel and deep imports become lint violations. Tying "barrel = public API" (not "barrel = every folder") is what lets the 61 count fall toward roughly one-per-feature-plus-shared without losing the import ergonomics the team demonstrably wants (CX-4 notes barrels survived their own June-2026 removal — a real preference).

**Example.** Good target: `home` and `command-palette` already expose a clean root barrel (W-3). Bad: the 61-barrel proliferation where sub-directory barrels exist only to re-export CX-8's split files — the co-read/analyzability cost CX-4 names.

---

## CS-8 — Naming conventions (suffix taxonomy + collision disambiguation)

**Rule.** Codify the observed suffix taxonomy; do not invent new suffixes:

| Suffix / prefix | Meaning |
|---|---|
| `*.service.ts` | client-SDK data module |
| `*.actions.ts` + `"use server"` | server action module |
| `use*.ts` / `use*.tsx` | React hook |
| `*-paths.ts` `*-save.ts` `*-subscriptions.ts` `*-normalize.ts` | split sub-modules of a service, named by responsibility |
| `*.types.ts` | type module · `*.schema.ts` — zod schema · `*.enum.ts` — enum |
| `*.test.ts` / `*.emu.test.ts` / `*.browser.test.ts` | unit / emulator / real-browser suite (S-10) |

**Collision rule:** when a generic filename (`rbac.ts`, `utils.ts`, `types.ts`) would name the single-source-of-truth engine for a **domain**, and could be reached by a cross-module import, give it a domain-qualified name or ensure it is only ever imported through its feature-root barrel — never by bare filename across features.

**Why.** PC-8/CX-12 name the counter-example: two identically-named `features/admin/utils/rbac.ts` and `features/flashcard/utils/rbac.ts` — "imports are distinguishable only by path," and `firestore.rules` must mirror both. The duplication itself is *principled* (AD-15: two RBAC domains stay separate), so the fix is not a merge — it is disambiguation plus boundary enforcement: `flashcard/utils/rbac` is currently **deep-imported at 4 external sites** (W-3), exactly the AD-01 violation the collision makes dangerous. Under AD-01 both engines are reached only through their feature-root barrel, so the path collision stops mattering.

**Example.** The two `rbac.ts` files (PC-8) are the canonical disambiguation counter-example. The suffix taxonomy is drawn verbatim from `project-discovery/06` (execution-context legend) and `11` §5 (test-config globs).

---

## CS-9 — Dependency and import rules (AD-01/02/03 operationalized)

**Rule — allowed edges only, lint-enforced:**
- Layer direction is one-way: `app → features → shared`, and `lib` is infrastructure. **Banned:** `shared → features`/`lib`, `features → app`, `lib → features` (S-1).
- **`lib` never imports `features`** except the composition root `lib/providers.tsx` (the one sanctioned upward edge). The type-only `lib/logging/public.ts → features/admin` back-edge is eliminated by relocating the log types to the layer that owns them (AD-03, W-2).
- **Cross-feature imports target a feature's root barrel only** (AD-01). Deep imports (e.g. the 43 sites into `flashcard/types`, the 4 into `flashcard/utils/rbac`, the 4 into `ShareModal`) become lint errors (W-3).
- **Dependency direction between features is one-way: `flashcard → notifications`, never back.** notifications is feature-agnostic; its UI must not import flashcard actions. Cross-feature actions reach notifications UI via a registry/injection seam owned by notifications' public API (AD-02, W-1).

**Enforcement (P-1):** ESLint import-boundary rules (`import/no-restricted-paths` or the boundaries plugin) — ESLint is already in-repo and already enforces the audio boundary (S-15, CX-5), so the mechanism is proven. This is the highest-leverage set of rules: it is the *structural* prevention of the W-1 cycle and W-3 deep-import decay recurring.

**Why.** S-1 (unidirectional imports hold today, but *without* mechanical enforcement — pure convention across 138 commits). P-1: convention decays; the audio boundary is the model of enforcement done right (a lint *error* with a teaching message, S-15). W-1/W-2/W-3, C3/C7 clusters, TD-4.

**Example.** Good enforcement precedent: the ESLint `no-restricted-globals`/`-properties` audio rules with rationale messages (S-15, `eslint.config.mjs:23-57`). Bad (to be lint-caught): `notifications/components/InviteActions.tsx` → `@/features/flashcard/actions/access.actions` (the W-1 back-edge); `home` deep-importing `@/features/flashcard/components/ShareModal` (W-3).

---

## CS-10 — Performance guidelines

**Rule.**
1. **Bounded queries.** Every `collection`/`collectionGroup` `onSnapshot` or query carries an explicit `limit()`. The unbounded public-lesson listener is out of policy (AD-14).
2. **Centralize realtime listeners per entity.** One shared listener per entity, mounted once (context/provider), not one-per-consuming-component. The `useUserProgress` pattern (one listener × 10 mount sites) converges on the notifications-style single centralized subscription (AD-13, R-1).
3. **Debounce server-backed inputs.** Any input that feeds a server action / Firestore query (admin log search) must debounce; no per-keystroke round-trips (W-18).
4. **Virtualize by trigger, not by default.** Use `@tanstack/react-virtual` when a list is unbounded or routinely long (admin logs, notifications inbox); short/bounded lists stay `.map()`. Match the scroll container to the surface: bounded-container `useVirtualizer` for panels, `useWindowVirtualizer` for full-page — the choice documented at the point of use (PC-4, AD-12).
5. **Motion budget.** Animation uses `m.*` under `LazyMotion strict` only; a bare `motion.*` render is a defect (throws). Motion features load via the code-split dynamic import (CX-5, S-18).

**Why.** R-1 (per-mount listener multiplication: `useUserProgress` opens one listener per component across 10 mount sites, vs the single centralized notifications listener — the model to copy), R-2 (unbounded `subscribePublicLessons` streams the entire public corpus, live, to every dashboard visitor; no `limit()`, no virtualization), W-18 (per-keystroke `fetchLogsAction`; grow-window resubscribe re-reads the whole window), AD-13/AD-14. S-18 documents the LazyMotion/virtualization mechanisms as strengths to preserve; PC-4 documents the two virtualizer variants and their in-code rationale.

**Example.** Good: `NotificationsContext` single app-lifetime listener; the two virtualized lists with in-code rationale (S-18, PC-4). Bad: `subscribePublicLessons` (R-2, no `limit()`); admin log search firing a query per keystroke (W-18).

---

## CS-11 — State ownership rules (four-tier model, ADR-002)

**Rule.** State lives in exactly one tier; pick by *kind of state*, not convenience:

| Tier | Owns | Use when |
|---|---|---|
| **Local** (`useState`/`useTransition`) | per-surface UI state | state belongs to one component subtree |
| **Zustand store** | cross-tree client data + persisted preferences (auth objects excluded from persistence) | data is shared across unrelated trees or must persist to localStorage |
| **React context** | an app-lifetime *resource* — a single shared listener or an imperative API — mounted once in `lib/providers.tsx` | a resource must be created/torn down exactly once and shared |
| **React Query** | one-shot server state (admin reads) | non-realtime server data with cache/invalidation needs |

Realtime data stays on bespoke `onSnapshot` hooks — unconditionally (P-11, ADR-002). Server state never leaks into a client store; auth is never persisted.

**Why.** S-14/AD-13 affirm the four-tier model as codified in ADR-002. PC-16 observes the role split is coherent but *unwritten* — this standard writes it. The distinction that resolves ambiguity: **stores hold data, contexts hold resources** (a listener or imperative API) — PC-16's exact observation, stated by the NotificationsContext docblock for itself. The counter-question PC-16 leaves open (why Match mode uses a Zustand store while Speed uses a class state machine and Survival/Quiz use hook-local state) is answered by the table: `useMatchGameStore` holds cross-component grid *data* → store is correct; a phase machine is per-surface *resource/logic* → local/controller is correct.

**Example.** Good: `useAppStore` (`partialize` excludes auth — "Firebase manages that", S-14); `NotificationsContext` (single listener resource, mounted once); `useMatchGameStore` (shared grid data). The three-store/three-context inventory is stable and correct (PC-16, W "no standalone finding" for state management).

---

## CS-12 — Error and logging standards (report-then-handle)

**Rule.**
1. **Report before you handle.** No silent failure of real state. A swallow site (`.catch(() => {})`, bare `catch {}`) must route the error through the logging pipeline *before* swallowing — the swallow controls user experience, not observability (P-8, AD-16).
2. **Surface by context (the three sanctioned styles):** render-path failures **throw** to the nearest error boundary; subscription failures go **into state** (`error: string | null`); secondary/background writes **fire-and-forget** — but per rule 1, they report first.
3. **Boundaries surface, services report.** Error boundaries render the provider-free `ErrorFallback`; services report through the logging/observability pipeline, they do not render.
4. **Scope-tag convention:** `console.error` and logs carry a bracketed scope tag (`"[useLessons]"`, `"[flags]"`) — keep it.

**Why.** AD-16 (report-then-handle; boundaries surface, services report), PC-13 (three surfacing styles map to context — render/subscription/background — but no rule maps them; this writes the map), W-17 (59 `console.error` sites reach no one; the client→server log pipeline has 2 callers; 17 swallow sites include audit-trail writes), OP-22 (17 fire-and-forget chains + ~20 bare catches with no reporting path below the four boundaries). The corpus already shows the *shape* of compliance: audio playback failures are sampled into the activity log (`AUDIO_PLAYBACK_FAILED`), making audio "the only subsystem whose silent failures leave a trace" (OP-22) — that is the model every swallow site should follow.

**Example.** Good: the audio-telemetry counter-example (`AUDIO_PLAYBACK_FAILED`, OP-22) and the tiered error policy (provider-free `ErrorFallback`, typed errors, backoff — S-12). Bad: the 17 swallow sites (image cleanup, invite-notification emit, login logging, daily-review increment) that discard errors with no report (W-17, OP-22).

---

## CS-13 — Validation standards (schema at the boundary)

**Rule.**
1. **Validate at the write boundary.** Every server write path validates through its zod schema before persisting. A declared schema is either **enforced on its write path or deleted** — no schema may claim "source of truth" while consumed by nothing (P-7, AD-09).
2. **Forms:** multi-field forms use `react-hook-form` + `zodResolver` (the existing beachhead); trivial single-input cases may stay controlled-state.
3. No unvalidated field crosses a trust boundary; the same limit (e.g. comment length 2000) has one authoritative source, not three hand-synced copies.

**Why.** AD-09/W-9/TD-5: three exported schemas (`cardContentSchema`, `privacyModeSchema`, `publicRoleSchema`) are enforced on **no** write path while their headers claim to be the validation source of truth — actual writes use the narrower `validateAtomicCard`. PC-7: zod-at-the-boundary is the program-era convention (`shared/schemas/` landed 2026-07-16); PC-1: `useLessonBuilder`/`useShareInvites` are the rhf+zodResolver beachhead. Per-schema disposition (enforce vs delete) is **conditional on Q-12** (production data compatibility) — see CS-conflicts.

**Example.** Good: `lessonMetadataSchema`/`shareInviteSchema` consumed via `zodResolver` (PC-1A, PC-7). Bad: the three zero-consumer schemas whose headers mislead a maintainer into thinking they tightened the system (W-9).

---

## CS-14 — i18n and theming standards

**Rule.**
1. **No raw hex outside the charts carve-out.** Colors use semantic tokens (`bg-hiragana`, `text-text`, CSS variables). The single legitimate exception is recharts SVG props, which cannot resolve Tailwind classes — and those use the `chartTheme.ts` palette, not inline literals. The 38 arbitrary-value hex classNames across 29 files are out of policy (PC-17).
2. **No hardcoded UI strings.** All user-facing copy goes through `next-intl` (`useTranslations`/`getTranslations`); navigation through the `@/i18n/navigation` wrappers (never raw `next/link`/`next/navigation` for wrapped symbols). Message keys stay at **exact en/ja parity** (PC-18, S-17).
3. Reuse a `shared/components/ui` primitive before hand-styling; a new hand-rolled card/button/input/modal or an arbitrary bracket value (`text-[13px]`) is caught in review.

**Why.** PC-17 (single token system actively converging; a quantified raw-hex tail where several files hardcode the *exact value of an existing token* — the signature of pre-token code, and a token change would not propagate to them), PC-18/S-17 (one i18n mechanism, perfect 803/803 key parity, extraction tail still landing). The repo already ships a `design-system` skill as the token authority (PC-17). Enforcement: the recent commit stream (`0e6340c` hex→token, `6368c36` i18n-extract) shows this is actively swept — the standard formalizes the sweep so the tail does not regrow.

**Example.** Good: `chartTheme.ts` documenting its legitimate hex carve-out (PC-17); the 803/803 parity and locale-aware owner-attribution copy (S-17). Bad: `ChartCell.tsx` `border-[#58cc02]/30` on the same line as `bg-hiragana/10` (the hex *is* the token value, hardcoded); `GrowthChart.tsx` inlining `stroke="#58cc02"` instead of the palette (PC-17).

---

## Standards summary (one line each)

- **CS-1 Shared utilities:** extract only at the third consumer; never build a primitive ahead of any consumer (P-10; Drawer = cautionary case).
- **CS-2 File splitting:** tiered ceiling green ≤250 / review 251–400 / hard-error >400, derived from the corpus's ~85-avg distribution and the team's own "below 400" program (TD-3, CX-8).
- **CS-3 Max abstraction:** no capability without a live consumer; deliberate forward-provisioning needs an AD-20 ledger entry (CX-7).
- **CS-4 Components:** three tiers — thin route orchestrator, feature root, presentational leaf; no blending (S-2, P-12).
- **CS-5 Hooks:** orchestration in a controller hook; stable-callback-ref and render-time-reset idioms are standard (`project-discovery/05`).
- **CS-6 Services:** mark execution context, own path literals in `*-paths.ts`, no cross-service reach-around (S-3, CX-11, AD-02).
- **CS-7 Folders/barrels:** `features/<name>` grammar; barrel = public-API surface only (feature root + enforced sub-modules + shared), not per-directory (CX-4, AD-01/04).
- **CS-8 Naming:** codified suffix taxonomy; domain-qualify or barrel-only-import colliding generic names (the two `rbac.ts`, PC-8).
- **CS-9 Imports:** one-way layers, `lib` never imports `features` (except composition root), cross-feature via root barrel only, `flashcard→notifications` never back — ESLint-enforced (AD-01/02/03, S-1, W-1/2/3).
- **CS-10 Performance:** bounded queries, centralized per-entity listeners, debounced server inputs, virtualize-by-trigger, LazyMotion `m.*` only (R-1, R-2, W-18, AD-13/14).
- **CS-11 State ownership:** local / Zustand (data) / context (resource) / React Query (one-shot); realtime on `onSnapshot`; auth never persisted (S-14, PC-16, ADR-002).
- **CS-12 Error/logging:** report-then-handle; throw/into-state/fire-and-forget by context; boundaries surface, services report (AD-16, PC-13, W-17, OP-22).
- **CS-13 Validation:** zod at the write boundary; enforce-or-delete declared schemas; rhf+zodResolver for multi-field forms (AD-09, W-9, PC-1/7).
- **CS-14 i18n/theming:** tokens not raw hex (charts carve-out excepted), all strings via next-intl at en/ja parity, reuse UI primitives (PC-17/18, S-17).

## Conflicts and missing information

- **CS-2 threshold vs kernel:** the kernel does not fix a line number; the 250/400 tiers are **derived from corpus evidence** (`project-discovery/11` distribution + the E11 "below 400" program) as the task directed. Adopting the 400 hard-error requires splitting exactly one non-test file, `ShareModal.tsx` (436) — already flagged by W-4/CX-2 — so the backlog is near-empty by design, but this one split is a prerequisite to turning the rule to `error`.
- **CS-7 barrel reduction vs team preference (CX-4):** the "barrel = public API, not per-folder" policy reduces the count from 61 toward ~one-per-feature-plus-shared. CX-4 records that the team *reverted* a June-2026 barrel removal (a demonstrated preference for barrel ergonomics). The policy keeps the ergonomic root barrels while removing mechanical re-stitch barrels — but because it partially reverses a demonstrated preference, the owner should confirm the reduction scope before lint-enforcing it.
- **CS-8 rename vs AD-15 principled duplication:** renaming the two `rbac.ts` to domain-qualified names is *optional cosmetic*; the load-bearing rule is AD-01 (no deep cross-feature import). Do not merge the engines (AD-15 keeps them separate). Flagging so a reviewer does not read CS-8 as a mandate to consolidate.
- **CS-13 per-schema disposition is Q-12-gated:** whether each of `cardContentSchema`/`privacyModeSchema`/`publicRoleSchema` is *enforced* or *deleted* depends on production-data compatibility (Q-12, AD-09). This standard fixes the *rule* (enforce-or-delete) but the per-schema branch cannot be decided from the corpus — defer to `07-Open-Questions` per the kernel's inputs note.
- **CS-10/CS-12 confidence caveats (not conflicts):** R-1's listener-multiplication cost is High-confidence on *structure* but Low on runtime magnitude (never profiled); OP-22's report-then-handle rule is verified at the code level. Both rules stand on structure regardless of unmeasured runtime magnitude — recorded so the ADR does not overstate measured impact.
- **No kernel contradictions found.** Every standard elaborates a fixed decision (AD-01…20) or a principle (P-1…12); none required deviating from a kernel position.
