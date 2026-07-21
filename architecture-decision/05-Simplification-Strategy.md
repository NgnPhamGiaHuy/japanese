# 05 — Simplification Strategy

**Phase 6 — Architecture Decision.** This document decides where architecture is **removed**, not added. It is strategy — what goes, why, and under which gate — not planning: no sequencing, no effort estimates, no assignments, no task lists.

- **Binding input:** the decision kernel (esp. AD-19 delete-unless-claimed, AD-10/11/12 pattern convergence, AD-18 config single-sourcing, P-3 delete-before-refactor, P-5 behavior preservation, AD-20 completion-state ledger).
- **Evidence corpus:** `project-discovery/` (esp. 12-Known-Unknowns U-1…U-25, 13-Questions Q-1…Q-17) and `architecture-assessment/` (esp. 09-Improvement-Opportunities OP-1…24, 07-Technical-Debt TD-1…16, 05-Complexity CX-1…12, 12-Questions NQ-1…14, 11-Evidence-Matrix clusters C1…C16). All file:line facts cited below are the corpus's re-verified citations at HEAD `a0bbbc4`; this phase performed no rescan of `src/`.
- **Input-state note:** the phase-prompt's other input directories (`architecture-audit/`, `requirements-consolidation/`) are absent from disk (removed before discovery); the two existing corpora are the only sources.

**Why deletion leads the strategy (P-3).** The complexity analysis's closing taxonomy (CX §closing) found the hardest-to-reason-about stratum is not the biggest files but the *drifted* one: capability-ahead-of-consumer surface (CX-7) and staged work whose completion state was never recorded (C16). Every deletion below shrinks exactly that stratum. Deleting first also keeps every downstream design decision honest: refactors, boundary enforcement, and test allocation are sized against live surface, not against dead vocabulary that only producer-tracing can distinguish from product (CX-7's stated epistemic cost).

**How the gates work (AD-19 + AD-20).** Each gated item defaults to **deletion**. The gate is a named intent/state question (Q-n / NQ-n); a "claimed" answer must name a concrete producer or consumer and an activation intent — a comment saying "flip when the producer lands" (registry.ts:27-30) does not count, because comments don't expire (U-4). Whichever branch fires, the disposition is a staged change and therefore gets an AD-20 ledger entry (intended end state, current stage, owner, review-by date). Under P-5, gated deletions are behavior-preserving *by construction* — the gate certifies the surface has zero producers/consumers — but each item below still names what must be re-verified at removal time, because "zero producers in-repo" is not always "zero effects in production" (e.g. deployed callables, stored log values).

**Scope cross-references.** The three zero-consumer schemas (`cardContentSchema`, `privacyModeSchema`, `publicRoleSchema`) are also enforcement-or-removal conditionals (OP-11, TD-5, gate Q-12), but their disposition is owned by AD-09 (validation at the write boundary) and is decided in the validation strategy, not here — recorded to avoid double ownership. The admin-authority predicate alignment (OP-7, Q-10) is a security-architecture decision, not a simplification, and is likewise out of scope here.

---

## 1. Deletions gated on intent answers

Seven dead surfaces, each with its AD-19 default. Together they are cluster C12 (the dormant-capability stratum) plus the C6 analytics pipeline.

### DEL-1 — Seven dormant `NotificationKind`s

- **What:** `invite_declined`, `deck_updated`, `deck_deleted`, `privacy_changed`, `overtaken`, `leaderboard_top3`, `achievement` — registry-declared with full metadata (priority, category, collapse keys) but `active: false` and producer-less (`features/notifications/domain/registry.ts:66,108,115,129,145,152,160`), plus their weight in `domain/events.ts`, collapse-key and formatting logic.
- **Corpus evidence:** OP-8, W-8(a), TD-6(a), RC-7, CX-7 (documented-staging flavor), U-4, C12.
- **Kernel decision served:** AD-19 (P-3); also narrows the AD-08 vocabulary reconciliation — every kind deleted is one the widened `NotificationType` union never has to carry.
- **Gate & default:** **Q-8**, per kind. Default: delete the kind, its registry entry, and its share of collapse/format logic. A "claimed" answer must name the producing feature (for `overtaken`/`leaderboard_top3` that is `features/game/`, which then must reserve room for competitive producers — OP-8).
- **Removal must preserve (P-5):** behavior of the 9 active kinds and the server emit schema's 7 client-emitted kinds (`features/notifications/schema.ts:74-82`) — the deletion touches only members the schema already refuses; no stored document carries a dormant kind (zero producers ever existed), so no read path changes.

### DEL-2 — Never-emitted logging vocabulary (8 `ActivityAction`s + `"cloud_function"` `LogSource`)

- **What:** `DECK_SHARED`, `DECK_UNSHARED`, `CARD_CREATED`, `CARD_UPDATED`, `CARD_DELETED`, `SHARE_INVITE_SENT`, `SHARE_INVITE_REVOKED`, `KANA_PRACTICE_COMPLETED` (`lib/logging/actions.enum.ts:16-37`) and `LogSource "cloud_function"` (`features/admin/types/log.types.ts:4`) with its `LogSourceBadge` rendering branch — zero producers each; `functions/src/` never writes `system_logs`.
- **Corpus evidence:** OP-9, W-8(b), TD-6(b,c), U-6, U-7, OP-19(c) (the enum's "MUST use these constants" contract is enforced by nothing), C12.
- **Kernel decision served:** AD-19; restores the enum contract's truthfulness so the AD-15/AD-19 vocabulary-agreement automation has an honest target.
- **Gate & default:** **Q-11**, per member. Default: delete the members, the badge branch, and the admin report filters keyed on them. **The kana-practice logging gap resolves in whichever direction Q-11 answers** (AD-19): if `KANA_PRACTICE_COMPLETED` is claimed, the practice mode gains its missing producer (its quiz and survival siblings both log — TD-6); if not, the member goes and the asymmetry is recorded as intended.
- **Removal must preserve (P-5):** rendering of *historical* log documents — stored `system_logs` data may carry values an enum prune would orphan (Q-11's own caveat); the normalizer path (`lib/logging/public.ts:41`) that maps unknown sources to `"server"` is the behavior the deletion must leave intact for any stray stored value.

### DEL-3 — Inert admin surfaces: Quick Actions, Settings stub, `canChangeSettings`

- **What:** three handler-less dashboard buttons ("Global Settings", "Content Audit", "Security Review" — `QuickActionsCard.tsx:21-41`, no `onClick`/`href`/form); the self-described stub `/admin/settings` page (`AdminSettingsPageContent.tsx:13-16`); the orphan permission `canChangeSettings` declared in the RBAC matrix and action-metadata enum but required by no action (`features/admin/utils/rbac.ts:11,23,33`; `admin.service.ts:76`).
- **Corpus evidence:** OP-10, W-10, TD-7, U-8, U-9, C12. U-8's sweep confirms these are the repo's *only* no-behavior controls — the deletion closes the class, not an instance of a spreading pattern.
- **Kernel decision served:** AD-19; also honesty of the security surface — an auditor reading the RBAC matrix currently infers a settings-mutation capability that does not exist (W-10).
- **Gate & default:** **Q-13**, per surface. Default: delete the card, the route + stub, and the permission from matrix and metadata enum. Claimed answers must name the intended backend per surface ("Security Review" corresponds to nothing in the repo — U-8).
- **Removal must preserve (P-5):** the admin overview layout minus the card (`AdminOverviewPage.tsx` mounts it); the shape-compatibility of the `PermissionSet` matrix for its 7 remaining live permissions — every action that *does* declare a permission must resolve exactly as before.

### DEL-4 — `fanOutNotifications` callable (and its Cloud Tasks contract)

- **What:** the admin-only fan-out callable, self-described as "No current product action triggers this yet" (`functions/src/fanout.ts:7-15,128-134`); zero `httpsCallable`/`getFunctions` usage anywhere in the app.
- **Corpus evidence:** OP-14, U-19, CX-7 (the *documented-staging* flavor — provisioned with a stated activation step), C12.
- **Kernel decision served:** AD-19. Note this is the strongest test of AD-19's discipline: the code politely documents its own dormancy, and AD-19 says documented aspiration is still aspiration — the gate, not the comment, decides.
- **Gate & default:** **Q-6**. Default: delete the callable, its export binding (`functions/src/index.ts`), and the Cloud Tasks queue contract. The gate must rule out an out-of-repo operator invocation (OP-14: cannot be excluded from code) and states the deployment facts (queue existence, any invocation history).
- **Removal must preserve (P-5):** the digest sibling and `deliverNotificationTask` if the gate shows they are live (Q-6 covers all three bindings); every single-recipient notification producer in the app, which the callable never served (fanout.ts:7-15: "every notification producer … derives exactly one recipient").

### DEL-5 — Storybook toolchain + scaffold assets

- **What:** 8 Storybook-related devDependencies (7 packages + `eslint-plugin-storybook` in the flat config), 2 npm scripts, the `.storybook/` config — supporting exactly one story (`Badge.stories.tsx`); plus the five unreferenced create-next-app scaffold SVGs in `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).
- **Corpus evidence:** OP-13, TD-12, W-21(b), CX-7 (undocumented-aspiration flavor), U-22, U-23, C12. (Package count per the assessment's correction: 8, not discovery's 7 — 07 §Discrepancies.)
- **Kernel decision served:** AD-19; also W-21's standards-credibility point — a toolchain implying a component-documentation practice that doesn't exist misleads newcomers.
- **Gate & default:** **Q-17** (which itself rates answerability Low — "nobody decided" is a live possibility; under AD-19 an undecidable gate resolves to the default). Default: delete the toolchain, scripts, config, lint-plugin wiring, the single story, and the scaffold SVGs. Adjacent Q-17 scope: the untracked emulator/build artifacts (`firestore-debug.log` ×2, etc. — U-22) are hygiene under the same gate.
- **Removal must preserve (P-5):** the lint config's non-Storybook rules (audio boundaries, `max-lines`) exactly; `Badge` the component (only its story leaves); the `addon-vitest` removal must not disturb the four real test configs.

### DEL-6 — `Drawer` primitive

- **What:** `shared/components/ui/Drawer.tsx` (64 lines), finished, themed, barrel-exported (`ui/index.ts:8`), zero render sites — while the two surfaces that *are* drawers (`DeckDetailsPanel`, `AdminSidebar`) hand-compose Base UI `Dialog` directly.
- **Corpus evidence:** OP-12, TD-11, W-21(c), PC-3, CX-7, NQ-3, C12. P-10's named counter-example: a shared extraction with zero uses, let alone three.
- **Kernel decision served:** AD-10 (which explicitly marks Drawer **delete-unless-claimed**) and AD-19.
- **Gate & default:** **NQ-3** (OP-12 records that no discovery question covers Drawer — the assessment minted this gate). Default: delete the primitive and its barrel export. The claimed branch is adoption *by the two existing bespoke panels* (the only candidate consumers, OP-12) — anything else fails P-10's three-use logic.
- **Removal must preserve (P-5):** the two bespoke slide-panels' current behavior — under AD-10 they are already the sanctioned Tier-2 end state (direct `Dialog.Root` via DialogChrome; PC-3's git evidence: the migration commit *names them as completed*), so deleting Drawer changes no rendered surface. The shared-UI inventory stops misrepresenting the sanctioned way to build a drawer (W-21's "misleading affordance").

### DEL-7 — Never-written analytics read paths + fabricated-zero rendering

- **What:** read paths on `analytics_daily` (`analytics.service.ts:22-29`; `admin.actions.ts:278`) and `metadata/counters` (`user.service.ts:64-65`) — collections no code in app, functions, or scripts writes — plus the fallbacks that fabricate output: `0` for `activeUsersToday`/`totalSessions`/`errorRate` rendered indistinguishably from真 zero, and the export row synthesized with hardcoded zeros (`admin.actions.ts:284-299`).
- **Corpus evidence:** OP-16, W-11, TD-8, RC-5 (timeline: no server compute existed for months after the readers were built — no in-repo producer ever existed), U-12, U-13, C6.
- **Kernel decision served:** AD-14 (bounded queries and honest UI) and AD-19.
- **Gate & default:** **Q-9**. Default: delete the dead reads and their zero-fabricating fallbacks; the dashboard then renders what the live `count()` path actually knows and marks the rest absent. The claimed branch (an out-of-repo pipeline exists) converts the collection schemas into a named external contract that must not change unilaterally (OP-16) — and defines a real writer.
- **Gate-independent part:** the honest-UI rule is **not** gated — AD-14 makes fabricated zeros out of policy on *both* branches (P-9). Even if Q-9 claims the pipeline, absent cache documents must render as absent, not as `0`.
- **Removal must preserve (P-5):** the real-data path: live `count()` aggregations and genuine `analytics_daily` documents (if any exist in production) must render exactly as today; only invented values disappear. Note TD-8's side-fact for downstream design: with no cache writer, the "fallback" aggregation is currently the *only* path, and its cost is a data-layer concern regardless of branch.

---

## 2. Unconditional removals

Corpus-verified as removable now — no intent question gates them; each serves an Accepted kernel decision.

### UR-1 — Inline deck-access predicate re-derivations → the engine

- **What:** the five inline re-derivations of the deck-access decision outside the canonical engine whose own header forbids them ("Never inline role logic" — `features/flashcard/utils/rbac.ts:94-97`): `shared.service.ts:181-188` (hand-rolled gate whose `isOwner` checks `roles?.[uid] === "owner"` — **semantically divergent** from the engine's `ownerId ?? userId`, and the same code path then also calls the real `resolveRole` at :223, so both derivations run today), `ShareModal.tsx:98`, `DetailActionsPanel.tsx:40`, `notification.actions.ts:131`, `shared-preview.service.ts:76`.
- **Corpus evidence:** OP-5 (High confidence, "a pure code-state fact"), W-13, TD-9, C11.
- **Kernel decision served:** AD-15 P1 ("predicates are never inlined"); P-2.
- **Constraint honored:** `shared-preview.service.ts` keeps its documented client/server file separation (bundle isolation, TD-9) — convergence there is at the *predicate definition* level, not a naive cross-bundle import; the rules-file third copy is covered by AD-15's automated-agreement check, not by import.
- **Removal must preserve (P-5):** access outcomes — with one deliberate exception the corpus already adjudicated: the divergent `shared.service.ts` gate can deny an owner whose lesson doc lacks a `roles` self-entry where the engine grants `owner` (OP-5). Converging on the engine *is* the behavior ruling (AD-15 declares the engine canonical); that single delta is the change, and everything else (public gate, invite path, link access) must resolve identically. AD-17's allocation note applies: the sharing-RBAC resolver is a named test-floor priority precisely so this convergence lands against a net.

### UR-2 — The straggler dialog backdrop(s)

- **What:** the bespoke backdrop in `DeckDetailsPanel.tsx:40` (`bg-[#3c3c3c]/30` — a hardcoded near-token) converges on `DIALOG_BACKDROP_CLASSNAME`/DialogChrome; OP-2's evidence also shows `AdminSidebar.tsx:143` on `bg-black/40` rather than the shared constant — both fold into the same convergence. (PC-3 counts one stylistic straggler, OP-2 evidences two non-conforming backdrops; the decision is identical for both.)
- **Corpus evidence:** OP-2, PC-3, W-12 (backdrop drift as the live example of tier-B divergence).
- **Kernel decision served:** AD-10 ("always via DialogChrome — the one straggler backdrop converges"); P-2.
- **Removal must preserve (P-5):** each overlay's dismiss behavior, focus handling, and layout — only the backdrop styling unifies; app-wide backdrop appearance becomes single-sourced so the next `DIALOG_BACKDROP_CLASSNAME` change propagates everywhere.

### UR-3 — The raw-hex tail outside the charts carve-out

- **What:** the 38 arbitrary-value hex classNames across 29 files that bypass the token system (PC-17) — several hardcoding the exact value of an existing token (`border-[#58cc02]/30` beside `bg-hiragana/10` on the same line; `focus:border-[#ff9600]` = the survival token). The one legitimate carve-out stays: `chartTheme.ts`'s documented recharts exception (raw SVG attributes can't resolve Tailwind classes).
- **Corpus evidence:** PC-17 (staged migration still in motion — the tail is the un-swept April-era remainder, not deliberate exception; the chartTheme header records that this exact drift already produced phantom near-tokens `#ffc800`/`#ff4b4b` once).
- **Kernel decision served:** P-2 and AD-20's spirit — this is a staged migration (tokens 07-04 → sweeps through 07-18) whose completion this decision records as the end state.
- **Removal must preserve (P-5):** rendered colors. Where a hex equals an existing token value the substitution is identity; where it does not (e.g. `ScreenHeader.tsx`'s `bg-[#0a0a1a]/90`), the mapping to a real token is an explicit adjudication, not a silent nearest-match — the `#ffc800` history is the cautionary precedent.

### UR-4 — Stale standards-count comment in the lint config

- **What:** `eslint.config.mjs:60-61`'s "~46 pre-existing files over the limit" — verified count at HEAD is 44 (07 §Discrepancies-1). The stale figure goes; the comment tells the truth or tracks nothing.
- **Corpus evidence:** TD-3, W-21(a) (the pattern cost: standards that decay silently train contributors that repo rules are noise).
- **Kernel decision served:** AD-20 (a declared plan — "tighten per file as they're split" — with an unrecorded current stage is precisely the meta-finding; the count is that plan's stage marker) and P-1.
- **Removal must preserve (P-5):** nothing behavioral — the rule itself (warn at 200) and its tightening plan are untouched here; only the false fact is removed.

---

## 3. Merges and convergences

Where two-or-three of a thing become the kernel's sanctioned one (or sanctioned two).

### MC-1 — Three write-path families → two, on one action client

- **What:** the B/C server-action split (cookie-session `adminActionClient` vs idToken bind-arg `actionClient` — `lib/safe-action.ts:14-31`) converges on a single verified-identity action client with per-action permission metadata, thinly configured per surface. Family A (client SDK under rules) **stays** — it underpins the realtime layer (P-11, AD-13) and full convergence is not structurally available (OP-1: "reduction below three is the observable headroom").
- **Corpus evidence:** OP-1, PC-5, CX-3 (the split as fossilized trust-boundary eras; the B/C transport difference "documented without justification"), W-12, RC-11, NQ-9, C10.
- **Kernel decision served:** AD-06 (Accepted, P1; NQ-9 resolved-by-decision at the architecture level — transport verification details validated during design); P-2.
- **What convergence must preserve (P-5):** the location and strength of identity verification per surface (both transports already terminate in `verifyIdToken` on the same kind of token — NQ-9); the `{ok,data}|{ok,error}` envelope consumed by existing hooks; family A's rules coverage untouched. This merge ends RC-11's "re-litigated by every future maintainer" cost: a new write endpoint has one server client and one decision (which permission metadata), not a family taxonomy.

### MC-2 — Reports converges on the shared table engine

- **What:** the Reports surface — currently `AdminTableShell` chrome around a non-table virtualized list (PC-2 variant B) — adopts the shared react-table engine that Users and Content already run on. The engine lifts out of admin scope only when a third, non-admin consumer exists (the three-use rule).
- **Corpus evidence:** PC-2, NQ-4 (Reports' exclusion was "intent unknown"; kernel resolves it by decision), CX-12 (patterns-per-surface diagnosis — admin as the only home of the table pattern).
- **Kernel decision served:** AD-11 (Accepted, P2); P-2; P-10 (the lift rule).
- **What convergence must preserve (P-5):** the virtualization performance property Reports was given deliberately (`fe7d1b5`, variable-height log rows — PC-2's constraint reading) — engine adoption may not regress it; the log-filter semantics (`applyLogFilters` shared by server and client) survive the move. After convergence, "how does an admin grid behave" has one answer.

### MC-3 — Two public-path allowlists → one module

- **What:** the proxy's allowlist (`proxy.ts:9-18`: `/login`, sitemap, robots, OG-image pattern, shared-deck) and AuthGate's narrower regex (`lib/providers.tsx:24`, which *claims* to mirror the proxy and provably does not — W-20a) single-source from one module; each consumer keeps its own duty (edge redirect vs render splash).
- **Corpus evidence:** W-20(a) (the lists are already unequal — both failure modes silent), CX-6 (the hand-mirrored lists as the genuinely accidental part of the auth stack), NQ-2, C14.
- **Kernel decision served:** AD-18 (Accepted, P1; NQ-2 resolved-by-decision: **divergence treated as defect, not intent**); P-1 (a documented-only mirror is exactly what drifts).
- **What the merge must preserve (P-5):** today's *observable* public surface — the reconciliation of the two unequal sets is an explicit adjudication step (which of the proxy-only entries the AuthGate must also honor), not a silent union; no route silently changes between public, splash-gated, and redirected.

### MC-4 — `APP_ID` → one derivation

- **What:** the app (`NEXT_PUBLIC_APP_ID`, `lib/app-id.ts:1`) and the functions package (`NOTIFICATIONS_APP_ID`, `fanout.ts:126`, `digest.ts:151`) stop deriving the same Firestore namespace root from two env vars with two copies of the same default literal.
- **Corpus evidence:** TD-16, W-20(b), CX-11 (the split-brain env var as an "unforced extension" of the layout tax), OP-19(b) (agreement unverifiable and unchecked), U-19, C14.
- **Kernel decision served:** AD-18; P-2. The *layout* itself (`artifacts/{APP_ID}/…`) is explicitly not in scope — see NS-7.
- **What the merge must preserve (P-5):** the deployed namespace — the failure mode being eliminated is a silent tenant split (functions digesting a different root than the app writes, TD-16); changing the functions package's env contract is a deploy-config change whose production agreement Q-6 verifies before the old var retires.

### MC-5 — Notification compatibility machinery: a defined end state, post-gate

- **What:** the dual-schema stratum — four `@deprecated` fields, the `isUnread()` legacy fallback, primary-vs-fallback listener strategy with runtime swap, dual composite indexes (`read+isDeleted` and `status+isDeleted`), and the one-time backfill script — receives the end state CX-1 says it lacks: single read path on the new shape, legacy index dropped, deprecated fields removed, backfill script leaves the repo once its execution is confirmed. The retirement condition is already written in the code itself (`notification.service.ts:59-63`) — this decision adopts it as the recorded end state instead of an expiring comment.
- **Corpus evidence:** OP-15, TD-1 (top-ranked debt), CX-1 ("a migration frozen at its second-to-last step"), RC-3, W-7, C1/C2.
- **Kernel decision served:** AD-08 (Accepted-conditional, P1) and AD-20 — this is the canonical instance of the meta-finding, and its ledger entry is the template for all others.
- **Gate:** **Q-5** (legacy-shaped docs in production? backfill run? indexes/TTL deployed?) and **NQ-1** (is the runbook's "NOT yet deployed" still current? — a stale note that outlived a real deploy would be worse than no note). Until they answer, the machinery is load-bearing and *must not* be stripped — see NS-8.
- **What retirement must preserve (P-5):** rendering of every pre-migration document (unread state, deep links) up to the moment the gate certifies none remain; the widened 10-value type vocabulary (AD-08's authoritative-storage ruling) so no exhaustive switch regresses against live data.

---

## 4. Wrappers and indirection to retire

### WR-1 — Deep barrels beyond feature roots

- **What:** of the 61 `index.ts` barrels (CX-4), the ones whose role is cross-feature pass-through below a feature root retire. Under AD-01 the root barrel is the *only* cross-feature import surface; under AD-04 flashcard's sub-modules keep internal public-API barrels for *internal* discipline. What loses its reason to exist is the middle stratum: sub-directory barrels that today serve deep cross-feature imports (the 43 sites into `flashcard/types`, `games/match/config`, etc. — W-3) — once those imports are lint violations, a barrel with no internal consumers is indirection with no client.
- **Corpus evidence:** CX-4 (barrels defeat dependency tooling and deliver "their cost while only partially delivering their promise"; the convention survived its own June revocation, reason unrecorded — m-1), W-3, C3 ("obscured by CX-4 barrels").
- **Kernel decision served:** AD-01/AD-04 (the barrel policy those decisions jointly define); P-1. Recording the policy also closes intent-gap m-1: the June-removal/July-re-accretion arc finally has a written rule.
- **Retirement must preserve (P-5):** zero runtime behavior (barrels are build-graph only); import ergonomics at the two sanctioned surfaces (feature roots; flashcard sub-module roots). The payoff is the one CX-4 names: dependency edges attribute to real files, so cycle-detection tooling (TD-4) sees the true graph.

### WR-2 — `toActionResult` compatibility shim (coupled to MC-1)

- **What:** the normalization wrapper that exists "so callers written against the pre-migration `ActionResult<T>` contract are unaffected" (`lib/safe-action.ts:52-60`, CX-3's evidence). A compatibility layer for a completed migration is indirection with an expiry date that was never set — AD-06's convergence sets it: when the converged action client lands and no pre-migration caller remains, the shim retires.
- **Corpus evidence:** CX-3, OP-1 (result normalization exists only for families B/C).
- **Kernel decision served:** AD-06; AD-20 (the shim's remaining callers are the ledger's "current stage" field).
- **Retirement must preserve (P-5):** the error-envelope semantics every hook consumes — the shim retires by its consumers migrating, never by cutting them over silently.

### WR-3 — Pass-through files: status closed, policy recorded

- **What:** the corpus names no pass-through/duplicate files still standing — the E17-T10 sweep (`94a9ef4`, HEAD-3) removed the known set, and discovery's unimported-file sweep found no orphaned module (U-25). What this section records is therefore a *policy*, not a worklist: pass-through re-export files below the sanctioned barrel surfaces are a retired genre; new ones are the same lint violation as the deep imports they would serve (AD-01).
- **Corpus evidence:** CX-4 (E17-T10 pruned "duplicate/pass-through files"), U-25.
- **Kernel decision served:** AD-01; P-1.

---

## 5. Configuration to centralize

The C14 cluster (config-sync hazards) in full. Two of its four members are the merges MC-3 and MC-4 above; the remaining two are:

### CF-1 — The env-var surface becomes discoverable: `.env.example`

- **What:** the ~30 referenced `process.env.*` variables (Firebase client ×6, Admin ×3, Sentry ×3, PostHog ×2, AI tuning ×7, app-id, site URL, emulator switches …) get a checked-in `.env.example` documenting name, purpose, and what silently degrades without it — today the required environment is discoverable only by grep, and misconfiguration is silent *by design* (env-gated no-op integrations).
- **Corpus evidence:** TD-13, W-20(c) (a bus-factor-1 amplifier: bootstrap knowledge lives in one person's untracked `.env` — W-6), C14, C9.
- **Kernel decision served:** AD-18 (Accepted, P1); P-4 — "fully configured" finally has a written definition.
- **Must preserve (P-5):** nothing behavioral — this is pure documentation of an existing contract; secrets themselves never enter the repo.

### CF-2 — `SITE_URL` / hosting: documented, not decided

- **What:** the localhost fallback feeding sitemap, robots, `metadataBase`, and user-visible share URLs (`lib/site.ts:1-5` — the repo's only TODO, citing an ADR that doesn't exist) is recorded as the known hazard it is. The hosting decision itself **remains OPEN** per AD-18 — it cannot be made from documents (Q-2); what centralization delivers now is the single derivation point plus its entry in CF-1 so a mis-configured deploy is at least a *documented* failure mode rather than a silent one.
- **Corpus evidence:** TD-14, W-20(d), U-1, C14.
- **Kernel decision served:** AD-18 (hosting explicitly Open); AD-20 (the TODO becomes a ledger entry with an owner and review-by date instead of an orphaned marker).
- **Must preserve (P-5):** the dev-correct localhost fallback until Q-2 answers.

---

## 6. What NOT to simplify

Deletion strategy needs a guard rail as much as a blade. Each item below superficially resembles the divergences converged above; the corpus shows why it is principled, and the kernel affirms it. Collapsing any of these would be over-simplification — trading documented, constraint-shaped structure for uniformity the constraints don't permit.

### NS-1 — The two RBAC engines stay two

Deck-sharing RBAC (`flashcard/utils/rbac.ts`: 5-role resolution pipeline over per-resource roles, invites, public links) and platform-admin RBAC (`admin/utils/rbac.ts`: 2-role × 8-permission boolean matrix) are **two domains, not one pattern duplicated**: they share no roles, no storage, no callers (OP-6 — Low confidence that consolidation headroom even exists; PC-8: "differing constraints, not drift"; CX-12: "principled duplication — merging them would be worse"). AD-15 affirms both. What *does* converge is inside each engine's domain: no inlined predicates (UR-1) and automated vocabulary agreement — never the engines themselves.

### NS-2 — The two pagination mechanisms are THE two

Cursor-token paging (one-shot admin queries — Firestore cursors are sequential, docstring-documented) and grow-window resubscribe (realtime notifications feed — rationale in-code) sit on different data channels, and the corpus explicitly could not establish that one mechanism can serve both (OP-3 — Low; PC-11: "differing constraints, documented", intra-variant consolidation already done in E17-T5c). AD-12 codifies them as the sanctioned pair and forbids a third. The grow-window's O(N·page) re-read cost is a **recorded design decision** trading reads for correctness against a stale-tail-cache bug (07 §Performance; `notification-subscribe.ts:37-44`) — not unmanaged debt to "fix".

### NS-3 — The five-suite test topology is affirmed

The suites (unit, browser-component, emulator-service, Firestore-rules, Playwright e2e) are infrastructure that demonstrably works — the corpus's finding is *inverted allocation* (TD-2, W-16, C8: well-tested leaves, untested core), not excess machinery. AD-17 affirms the topology and directs allocation (SRS math, sharing-RBAC resolver, flashcard data services) — collapsing harnesses would remove exactly the net the deletions and convergences above need.

### NS-4 — The purchased boundaries stay purchased (CX-5)

The motion constraint (`LazyMotion strict` + `m.*`, runtime-throw guardrail) and the audio boundary (`shared/audio` only, ESLint *error* with teaching messages, ADR-001) are the corpus's clearest examples of complexity bought deliberately against a documented prior failure ("two competing singletons, a user setting that only half the app honoured"). They concentrate complexity at a boundary to remove diffuse complexity that already burned the project once. Simplifying them away re-opens the burn. (The lint-vs-runtime enforcement asymmetry between the two is a recorded minor gap — m-7 — not a reason to weaken either.)

### NS-5 — The auth-gating layers (minus the allowlist) do real work

CX-6's verdict on the five-layer stack: given a presence-only edge gate, "most of this redundancy is *necessary*" — each stratum correctly distrusts the one above (stale cookies, deep links, post-load sign-out, which the proxy cannot see). The accidental part is precisely and only the hand-mirrored allowlist, which MC-3 removes. The layers themselves are AD-07's territory (the credential end state), not simplification targets.

### NS-6 — The examined-and-rejected candidates stay rejected

The assessment already ran the over-simplification check on two candidates and declined them (09 §not carried forward): the two virtualized-list variants (same library; each surface's scroll-strategy reason documented at the point of use — PC-4) and the two form-state mechanisms (schema-validated multi-field forms vs trivial single-input state — AD-09 sanctions exactly this split). This document adopts those rejections.

### NS-7 — The `artifacts/{APP_ID}` layout, and the preview-file split

The Firestore layout is the codebase's least reversible decision (CX-11: production data is load-bearing; layouts effectively can't migrate in place) — the path-builder module genre and rules nesting are rational containment of the tax, not removable indirection. Only the env-var split-brain (MC-4) simplifies. Likewise `shared-preview.service.ts`'s separate Admin-SDK file is a documented bundle-isolation decision (TD-9) — its *predicate* converges (UR-1); the file split stays.

### NS-8 — Nothing legacy-compatible is stripped before its gate answers

The notification compatibility machinery (MC-5) is the standing example: until Q-5/NQ-1 answer, dual read paths and deprecated fields are what protect pre-migration users' inboxes (CX-1: "the machinery is exactly what protects old documents from vanishing"). AD-19's default-to-delete applies to surfaces with *zero* producers and consumers — never to compatibility code whose consumer is production data the repo cannot see. The general rule: deletion gates certify deadness; data-state gates certify retirement *readiness*; the two are not interchangeable.

---

## Closing: the ledger obligation

Every item above with a gate — DEL-1…7, MC-5, CF-2 — and every convergence executed in stages — MC-1…4, UR-1, UR-3, WR-1/2 — is a staged change under AD-20 and carries a ledger entry: intended end state, current stage, owner, review-by date, kept in-repo. This is not process for its own sake; it is the direct answer to the corpus's meta-finding (C16, RC cross-cutting, CX §closing): six of twelve root causes reduce to staged work whose later steps had no recorded status. The simplification strategy exists because that recording was absent; it completes only if its own steps do not repeat the pattern.
