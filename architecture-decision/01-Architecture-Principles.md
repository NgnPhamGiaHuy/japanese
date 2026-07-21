# 01 — Architecture Principles

**Phase — Architecture Decision (Phase 2).** Twelve principles that bind every future implementation decision in this repository. Each principle is derived from the assessment corpus (`project-discovery/` + `architecture-assessment/`, compiled against HEAD `a0bbbc4`, 2026-07-19) and is cited back to the findings that motivate it. The principles elaborate the decision kernel (AD-01 … AD-20); they do not introduce new decisions.

- **How to read each entry:** **Principle** (name + statement) → **Why it exists** (corpus findings, by ID and file) → **What it rules out** (real, observed instances from the corpus that the principle would have prevented) → **Decisions it grounds** (AD-x) → **Tension notes** (where principles trade off, with explicit precedence).
- **Citation convention:** `assessment/03 W-20` = finding W-20 in `architecture-assessment/03-Architecture-Weaknesses.md`; `discovery §NN` = `project-discovery/` file NN. Quoted lines are quoted from the corpus, which re-verified them against the repository.
- **Status of principles vs. gates:** principles are unconditional. Where a principle's *application to a specific artifact* waits on a validation gate (Q-n from `project-discovery/13`, NQ-n from `assessment/12`), that is noted — the gate conditions the artifact's disposition, never the principle.
- **Input-state note:** only `project-discovery/` and `architecture-assessment/` exist as inputs; the `architecture-audit/` and `requirements-consolidation/` directories referenced by earlier phase plans are absent from disk (removed before discovery). Recorded here as an input-state fact.

---

## Overview

| ID | Principle | One-line statement | Core motivating findings | Grounds |
|----|-----------|--------------------|--------------------------|---------|
| P-1 | Boundaries are enforced, not documented | A boundary exists only when a machine checks it | assessment/02 S-1, S-15 · /03 W-3, W-20, W-21 · /05 CX-4, CX-9 | AD-01, AD-02, AD-03, AD-05, AD-15, AD-18 |
| P-2 | One pattern per problem, not per surface | Each recurring problem has one sanctioned pattern; a second requires a recorded constraint | assessment/05 CX-12 · /06 PC-1, PC-5, PC-10, PC-12 · /03 W-12 | AD-06, AD-09, AD-10, AD-11, AD-12, AD-15 |
| P-3 | Delete before refactor | Dead surface is removed (behind its named gate) before refactoring invests around it | assessment/05 CX-7 · /03 W-8, W-9, W-10, W-21 · /07 TD-11, TD-12 | AD-19, AD-08, AD-10, AD-14 |
| P-4 | Record completion state | No staged change lands without an in-repo record of end state, stage, and completion condition | assessment/04 cross-cutting (RC-2/3/5/6/7/10) · /05 closing note · /11 C16 | AD-20, AD-08, AD-19, AD-16 |
| P-5 | Behavior preservation; incremental migration; small PRs | Architectural change is a sequence of small behavior-preserving steps; rewrites are not a mechanism | assessment/06 timeline + PC-3, PC-11, PC-18 · /05 CX-1, CX-3 | AD-04, AD-06, AD-07, AD-08, AD-13 |
| P-6 | Server derives identity | Identity, target, and role come from a verified credential server-side; client-supplied identity is never trusted | assessment/02 S-4, S-5, S-21 · /03 W-15 · /04 RC-4 | AD-06, AD-07, AD-02 |
| P-7 | Validate at the boundary | Every write path validates through its declared schema; unenforced schemas are wired in or deleted | assessment/03 W-9 · /04 RC-6 · /06 PC-1, PC-7 | AD-09, AD-06, AD-14 |
| P-8 | Report before you handle | No failure of real state is silent: report through the pipeline, then apply the handling policy | assessment/03 W-17 · /08 R-6 · /09 OP-21, OP-22 · /11 C13 | AD-16, AD-14, AD-17 |
| P-9 | Honest UI | Absent data renders as absent; the UI never fabricates a value to fill a gap | assessment/03 W-10, W-11 · /04 RC-5 · /07 TD-7, TD-8 | AD-14, AD-19, AD-16 |
| P-10 | Three-use rule for shared extraction | Generalize into a shared home only at the third real consumer; until then, code stays in its owning scope | assessment/05 CX-7 · /06 PC-2, PC-3 · /07 TD-11, TD-12 · /02 S-16 | AD-11, AD-10, AD-19 |
| P-11 | Realtime by default, cache by exception, per ADR-002 | The written data-layer policy governs; additions land inside it, and listeners centralize per entity | assessment/02 S-14 · /06 PC-14, PC-16 · /08 R-1 | AD-13, AD-12, AD-14 |
| P-12 | Business logic lives in features; routes orchestrate | The route layer holds only orchestrators; anything importing feature hooks/domain is feature code | assessment/02 S-2 · /03 W-5 · /04 RC-8 · /05 CX-9 · /06 PC-15 | AD-05, AD-04, AD-01 |

A short precedence summary for the recurring tensions follows the twelve entries.

---

## P-1 — Boundaries are enforced, not documented

**Principle.** An architectural boundary exists only when a machine checks it — a lint rule, a build failure, a runtime guard, or an automated agreement test. A boundary that lives only in a comment, a README, or a convention is a wish, and the corpus shows wishes drift.

**Why it exists.** The corpus proves both halves of this principle with unusual clarity:

- *Unenforced boundaries drift — even under a single disciplined author.* The load-bearing layer discipline "holds *without any mechanical enforcement* (there are no ESLint import-boundary rules)" (assessment/02 S-1) — a strength explicitly fragile against the bus-factor-one reality (assessment/03 W-6). Feature boundaries are weaker still: "Feature 'boundaries' are directory names, not contracts. Any file in any feature is reachable from anywhere" (assessment/03 W-3 — 2 of 9 features have root barrels; 43 sites import `@/features/flashcard/types` directly). The sharpest exhibit is W-20(a): `lib/providers.tsx:24` carries the comment "Mirrors proxy.ts's public-path allowlist" — and the two allowlists are *provably unequal at HEAD* (the proxy admits `/login`, `/sitemap.xml`, `/robots.txt`, and the OG-image pattern; the AuthGate regex admits only the shared-deck page; re-verified in assessment/11 adjudication 14). A documented mirror silently became a documented lie. The same shape recurs in W-21: "standards exist as intent, not enforcement, so they decay silently" — the 200-line ceiling with 44 standing violations, the stale docs index. And CX-4: the barrel convention "deliver[s] their cost while only partially delivering their promise" precisely because nothing prevents deep imports around it.
- *Enforced boundaries hold — the repo's own evidence.* The audio boundary is an ESLint **error** with a teaching message citing ADR-001, and it "makes the undesired coupling unwritable … installed in response to a real incident" (assessment/02 S-15, /05 CX-5). The `server-only` fence makes credential leakage a build failure (S-3). These boundaries did not drift in 138 commits. The enforcement toolkit demonstrably exists in-house; it has simply not been applied to the boundaries that failed.

**What it rules out (observed instances).**

- The `flashcard ↔ notifications` cycle forming unimpeded — "nothing structural stops the next convenience import from creating cycle C" (assessment/03 W-3; the cycle itself is W-1/RC-1).
- The `lib/logging → features/admin` back-edge landing silently as a type-only import and standing through every consolidation pass (assessment/04 RC-12).
- The hand-mirrored allowlist pair diverging with both failure modes quiet (assessment/03 W-20(a): "a future public route added to one but not the other produces either a splash-hidden 'public' page … or an auth splash bypass").
- Placement rules that "can only be learned by enumerating exceptions" (assessment/05 CX-9): each contributor infers the convention from disagreeing examples.
- Vocabulary agreement (TS unions ↔ rules lists ↔ writers) enforced by prose comments — already drifted three ways for the admin-authority predicate (assessment/09 OP-7, OP-19, OP-20).

**Decisions it grounds.** AD-01 (feature public APIs become lint-enforced), AD-02 (dependency direction enforced), AD-03 (`lib` never imports `features`), AD-05 (the placement rule becomes checkable), AD-15 (vocabulary agreement becomes an automated check instead of comments), AD-18 (one module owns the allowlist so there is nothing left to mirror by hand).

**Tension notes.** *P-1 vs P-5 (small, behavior-preserving steps):* switching on import-boundary enforcement instantly criminalizes the 43 existing deep-import sites. Precedence: **the enforcement mechanism lands first and immediately; existing violations are grandfathered at warn level and ratcheted down incrementally; new violations error from day one.** This is the repo's own proven pattern — the `max-lines` rule was "introduced as a WARNING first … tighten to 'error' per file as they're split" (assessment/05 CX-8), and CI's non-blocking lint carries an honest flip condition (assessment/02 S-11). The grandfather list is itself a P-4 artifact: it records the migration's end state (zero) and current stage.

---

## P-2 — One pattern per problem, not per surface

**Principle.** Each recurring problem — forms, tables, dialogs, pagination, search, loading, write paths — has exactly one sanctioned pattern, or an explicitly enumerated set where a real constraint forces more than one. A second pattern is legitimate only when it names, in code, the constraint that forecloses the first. Surfaces never mint their own.

**Why it exists.** The corpus's diagnosis is verbatim: admin "became the only place several general-purpose patterns live … so the app has patterns-per-surface rather than patterns-per-problem. When a learner-surface feature eventually needs a table or cached one-shot reads, the precedent is admin-shaped and admin-located, forcing either an awkward import across the admin boundary or a third implementation" (assessment/05 CX-12). The pattern-consistency scorecard (assessment/06) quantifies the cost: 3 of 18 concerns fully divergent — forms (PC-1: 2 `useForm` files vs manual state everywhere else), CRUD write paths (PC-5: three families), and filter/sort/search (PC-12: 6/4/4 variants, "three bespoke matchers are three places to fix the same class of bug", no debounce anywhere). Loading has six mechanisms "with no written decision rule" (PC-10). W-12 names the aggregate cost: per-task decision overhead and drift-by-default.

The corpus equally documents when two patterns are *principled*: both pagination mechanisms are "constraint-documented at the point of use" (PC-11); the two virtualization strategies likewise (PC-4); the two RBAC engines serve "genuinely different permission models … differing constraints, not drift" (PC-8). The principle therefore has a test, not a slogan: **a second pattern must carry a recorded constraint justification (per P-4); absent one, converge.**

**What it rules out (observed instances).**

- `DeckDetailsPanel` shipping its own backdrop (`bg-[#3c3c3c]/30`) instead of `DIALOG_BACKDROP_CLASSNAME` — the one dialog straggler the corpus caught mid-drift (assessment/06 PC-3).
- A fourth substring-matching implementation joining the three that already answer "how do I search this list" differently per surface (assessment/06 PC-12).
- Reports growing a second "admin grid" behavior contract with the exclusion reason recorded nowhere (assessment/06 PC-2; NQ-4).
- Per-game state idioms — store vs class machine vs hook state "for the same kind of problem" (assessment/06 PC-16).
- A third pagination mechanism, a second toast pipeline, a second i18n idiom — the concerns the corpus rates *consistent* (PC-6, PC-9, PC-18) stay that way only if pattern-minting is blocked.

**Decisions it grounds.** AD-06 (one action-client architecture across the B/C transports), AD-09 (one form pattern), AD-10 (one dialog pattern with two *sanctioned* tiers), AD-11 (one table engine), AD-12 (exactly two pagination mechanisms, closed set), AD-15 (predicates never inlined — five re-derivations of one predicate is five patterns for one problem, assessment/09 OP-5).

**Tension notes.** *P-2 vs AD-15's two RBAC engines / AD-12's two pagination mechanisms:* no conflict — these are one-pattern-per-*problem* where the problems genuinely differ (deck collaboration vs platform administration; jumpable one-shot lists vs realtime windows), and each difference is constraint-documented. P-2 forbids undocumented second patterns, not principled plurality. *P-2 vs P-10:* P-2 pressures toward early unification; P-10 forbids premature lifting into `shared/`. Precedence: **P-2 governs how many patterns exist; P-10 governs where the implementation lives.** See P-10's worked Drawer example.

---

## P-3 — Delete before refactor

**Principle.** Dead and dormant surface — zero-producer vocabulary members, zero-consumer schemas and primitives, handler-less UI, un-called capabilities — is removed (each behind its named gate, per AD-19) *before* any refactor invests in the code around it. Refactoring dead code is negative work: it polishes misinformation.

**Why it exists.** The corpus identifies a whole stratum of "capability-first infrastructure with zero (or one) consumers" (assessment/05 CX-7): the `Drawer` primitive (0 render sites), the `fanOutNotifications` callable no code calls, Storybook (8 packages, 1 story), 7 inactive notification kinds, 8 unemitted activity actions, `canChangeSettings` required by no action. The cost is epistemic and compounding: "every audit (including this one) must producer-trace to learn what the system actually does … unconsumed capability is where drift accumulates unnoticed (nothing exercises it)", and there is "no marker distinguishing 'next sprint' from 'abandoned'" (CX-7). The most dangerous instance is the dead schema: "a maintainer who reads 'single validation source of truth' and strengthens the schema will believe they tightened the system when they changed dead code. Tests exist for all three schemas, deepening the illusion of enforcement" (assessment/03 W-9). Dormant vocabulary makes "absence-of-log indistinguishable from absence-of-activity" on the audit surface (W-8), and one full cleanup program (E17-T4) already "passed over" the dormant members without pruning or wiring them (assessment/04 RC-7) — proof that refactor-first ordering preserves dead weight indefinitely.

**What it rules out (observed instances).**

- Investing another consolidation pass in the notification registry while 7 `active: false` kinds sit unresolved (assessment/04 RC-7 — E17-T4 did exactly this).
- Extending or "strengthening" `cardContentSchema` while zero write paths consume it (assessment/03 W-9; the disposition is enforce-or-delete under AD-09/Q-12, not polish).
- Porting the unused `Drawer` primitive through a design-token sweep while both real drawers remain hand-rolled (assessment/07 TD-11, /06 PC-3).
- Carrying the Storybook toolchain (8 packages, 2 scripts, 3 addons) through dependency upgrades for one story (assessment/07 TD-12).
- Redesigning the admin dashboard around three Quick Action buttons that have no handlers (assessment/03 W-10).

**Decisions it grounds.** AD-19 (the delete-unless-claimed family, each item gated: Q-6, Q-8, Q-11, Q-13, Q-17, NQ-3), AD-08 (the legacy notification machinery gets a removal gate, not another refactor), AD-10 (Drawer disposition), AD-14 (never-written analytics collections: read paths removed or a real writer defined, Q-9).

**Tension notes.** *P-3 vs P-5 (behavior preservation):* deleting surface that live production data may still depend on is a behavior change — the corpus's own warning: "someone 'cleaning up' the seemingly redundant `read` dual-write without confirming the backfill ran would silently hide pre-migration notifications from users" (assessment/04 RC-3). Precedence, resolved explicitly: **before an item's named gate answers, P-5 wins — no deletion; after the gate confirms the surface dead, deletion *is* behavior-preserving by definition and P-3 wins over any refactor-first instinct.** In the interim, ungated dormant code is frozen (no investment), and the gate itself is recorded per P-4. There are no ungated deletions and no ungated refactors of dormant surface.

---

## P-4 — Record completion state

**Principle.** Every staged change — migration, deprecation, capability landed ahead of its consumer, enforcement ratchet — carries an in-repo record of its intended end state, current stage, owner, and completion condition (AD-20's ledger). Nothing lands as "step one of N" without a home for steps two through N.

**Why it exists.** This is the corpus's single strongest explanatory finding, stated independently by two files. The root-cause analysis (assessment/04, cross-cutting observation): "Six of the twelve root causes (RC-2, RC-3, RC-5, RC-6, RC-7, RC-10) reduce to the same meta-cause: **a migration or capability was staged with a defined later step, and the repository has no mechanism that records whether the later step happened or is still intended**." The complexity analysis reaches the same shape independently (assessment/05, closing note): complexity divides into deliberate-and-documented, historical-strata, and drift — "and it is the third group, not the largest files or the biggest feature, where this analysis found the codebase hardest to reason about." The evidence matrix rolls 20+ findings into cluster C16 and observes "the entire Q/NQ catalogue is, in effect, this cluster's resolution" (assessment/11 §2).

The mechanism of failure is precise: the notifications migration "was executed with textbook staging … What converts a temporary cost into a permanent one is that the final step's precondition lives outside the repo" (CX-1); "the root cause is not the migration design (which is sound) but the absence of any in-repo mechanism for recording that a data migration completed" (RC-3). RC-6 names the documentation failure mode: "documentation asserting the intended end state as if it were the current state." Even reversals go unrecorded — the barrel convention "survived its own removal commit" with the June reversal's reasoning missing (CX-4, gap m-1).

**What it rules out (observed instances).**

- Another `ca8a654`-style platform landing with "the two are reconciled as producers migrate" and no recorded reconciliation target — the 4-vs-10 type drift that became the corpus's #1 debt (assessment/04 RC-2, /07 TD-1).
- A backfill script whose production execution status is unrecordable anywhere, freezing the dual machinery permanently (RC-3; the runbook's "NOT yet deployed" heading of unknown currency, NQ-1).
- A schema header claiming "single validation source of truth" while adoption stopped at a compatibility line the header never mentions (RC-6).
- Vocabulary members with no liveness marker, forcing per-member producer greps on every future audit (RC-7).
- The docs index omitting ADR-003 — even the decision log drifting from the decisions (assessment/03 W-21(d), /07 TD-13).

**Decisions it grounds.** AD-20 (primary — the kernel names it "the highest-leverage single decision"), AD-08 (the migration gets "a defined end state and removal gate"), AD-19 (each deletion candidate's gate is a recorded completion condition), AD-16 (activation state of gated observability is recorded, not implied by credentials).

**Tension notes.** P-4 is less in tension with the other principles than it is their **arbitration mechanism**: it converts P-3-vs-P-5 conflicts into recorded gates, and P-1's ratchets into tracked burn-downs. The only friction is with P-5's small-PR ethos — a ledger could become ceremony. Resolution: the ledger entry ships *in the same PR* as the staged change and is proportionate (a few lines: end state, stage, owner, review-by date). The corpus shows the team already writes excellent in-code rationale (assessment/02 S-20); P-4 asks only that staged work's *status* get the same treatment its *reasoning* already gets.

---

## P-5 — Behavior preservation; incremental migration; small PRs

**Principle.** Architectural change lands as a sequence of small, behavior-preserving, individually shippable steps — compatibility adapters where contracts move, dual-writes where data moves, ratchets where enforcement lands. Big-bang rewrites are not a sanctioned mechanism.

**Why it exists.** The corpus contains a controlled experiment. The July modernization program (2026-07-03 → 07-18, epic-tagged E1–E17; timeline in assessment/06) modernized primitives, validation, tables, i18n, and the data layer incrementally over a 15-day window with zero recorded regressions in the git narrative — "the benefit was zero rewrite risk during modernization" (assessment/05 CX-3). Its signature moves are all behavior-preserving: `toActionResult` exists "so callers written against the pre-migration `ActionResult<T>` contract are unaffected" (CX-3); the dialog migration was completed and *declared* complete in a commit message (PC-3: `5669430` "names AdminSidebar and DeckDetailsPanel as completed migrations"); cursor pagination was consolidated within its family (PC-11: `d9a8d5d`); i18n adopted atomically so "no second i18n idiom ever existed" (PC-18). The notifications data migration itself was "executed with textbook staging (dual-write → backfill → retire)" (CX-1).

The same corpus shows the failure mode: incremental migration without P-4 produces frozen frontiers — forms stalled at 2 sites (PC-1), the hex tail at 38 occurrences (PC-17), the notification retire-step frozen at second-to-last (CX-1). **P-5 works; it works completely only when paired with P-4.** That pairing is the kernel's explicit reading (P-5: staged change works "when its end state is recorded").

**What it rules out (observed instances / near-misses).**

- A top-level flashcard split — the corpus found the mega-feature's harm "only at the seams, not in the bulk" (assessment/05 CX-2), and AD-04 accordingly chooses internal sub-module discipline over a split rewrite.
- Flattening the three write families in one stroke — AD-06 converges B/C on a single verified-identity client *configured thinly per surface*, preserving every call-site contract, rather than rewriting family A (reaffirmed permanent by ADR-002).
- Retiring dual-read notification machinery before its gate answers (assessment/04 RC-3's silent-data-loss scenario — see P-3 precedence).
- Replacing the edge gate wholesale mid-auth-migration: AD-07 keeps the edge as routing-UX (its current, verified role per assessment/02 S-5, /03 W-15) while the credential hardens underneath.

**Decisions it grounds.** AD-04 (no split; internal boundaries), AD-06 (convergence, not rewrite), AD-07 (auth end-state reached incrementally), AD-08 (the migration *completes* — the staged plan's last step executes rather than restarting), AD-13 (ADR-002 affirmed, not replaced).

**Tension notes.** With P-3 and P-1 — both resolved above (gate-then-delete; ratchet). With P-4 — precedence: **no incremental sequence starts without its end state recorded**; P-4 is the precondition that keeps P-5 from manufacturing the corpus's frozen frontiers. P-5 is also why every "conditional" AD stays conditional: preserving behavior across unknown production state (Q-5, Q-9, Q-12) is exactly what the gates protect.

---

## P-6 — Server derives identity

**Principle.** Identity, target, and role are always derived server-side from a verified credential (verified ID token, verified session, or Firestore rules over `request.auth`). No client-supplied identity field is trusted, and no unverified signal (cookie presence) is ever promoted into an authorization input.

**Why it exists.** This preserves the corpus's strongest security finding. Assessment/02 S-5: "the *shape of the API* makes the secure path the only path — there is no field in `emitNotificationInputSchema` through which a client could even attempt to target an arbitrary inbox"; recipients are derived server-side per event kind; the public-role cap is enforced at type, runtime, write-time, and rules layers. S-4: an admin action "*cannot be defined* without declaring its required permission (the metadata schema demands it)". S-21: the user-log action "explicitly rejects userId spoofing against the verified token", under an emulator test. The corpus verified that "no server code trusts the cookie without `verifyIdToken`" (assessment/04 RC-4).

The negative motivation is equally concrete: the one non-verifying layer (the presence-only edge gate) is exactly where the corpus locates future risk — "any future developer who adds server-side data fetching to a 'protected' page, trusting the proxy gate, creates a leak; the system trains that misplaced trust" (assessment/03 W-15), and "a privileged mutation added to family A because it was convenient, guarded only by rules that can't express it — is a security bug, not a style issue" (assessment/04 RC-11).

**What it rules out (observed hazards).**

- Server-side data fetching gated on cookie *presence* (W-15's named future-leak scenario; RC-4: "the pattern `assertAdminAction` makes easy to get right but nothing makes hard to get wrong").
- A privileged cross-user write landing in the client-SDK family because rules can't express its check (RC-11's risk-if-unchanged).
- Any payload-carried `userId`/recipient/role reaching a write path — the corpus's positive counter-model (S-5, S-21) becomes the mandatory shape.
- Divergent authority predicates deciding admin-ness differently per artifact (assessment/09 OP-7: rules, functions, and app "are not even identical in what they accept") — under P-6 + P-1, the predicate is single-sourced and agreement is checked.

**Decisions it grounds.** AD-06 (the single verified-identity action client with per-action permission metadata), AD-07 (the credential itself becomes httpOnly and server-verified; the edge gate stays routing-UX only), AD-02 (notifications' privileged writes remain behind server-derived recipients).

**Tension notes.** With P-5 during the auth migration: no intermediate step may *increase* trust in the presence gate (e.g., adding server rendering behind it before the credential is verifiable). The migration ordering is therefore: credential hardens first (AD-07), rendering assumptions may follow — recorded per P-4.

---

## P-7 — Validate at the boundary

**Principle.** Every server write path validates its input at the boundary through its declared schema. A schema that no write path enforces is either wired in or deleted (per-schema gate) — never left as decoration. Multi-field forms use the sanctioned form pattern with the same schema.

**Why it exists.** The corpus found validation's declared architecture and its real architecture disagreeing: three exported schemas whose headers claim authority — `cardContentSchema` "the single validation source of truth" — with **zero non-test consumers**, while every real write path routes through the narrower legacy `validateAtomicCard` (assessment/03 W-9). The consequence is live: "Cards violating every non-primary rule — empty meanings, 10,000-character examples, malformed cloze templates — save successfully today, from manual entry, CSV import, and AI output alike. Cloze study mode's correctness depends on a `___` token invariant that nothing checks at write time" (assessment/04 RC-6). Rules cannot compensate on the client-SDK path (RC-6: card writes are client-SDK writes whose rules don't re-implement content constraints). Meanwhile the enforcement machinery exists and works where adopted: zod on every server action input (assessment/02 S-4), the react-hook-form + zodResolver beachhead (assessment/06 PC-1), rules-side mirrors of the notification limits (PC-7). The gap is adoption, not tooling — the July epic "stopped at a deliberately drawn compatibility line" and never revised the headers (RC-6).

**What it rules out (observed instances).**

- The decorative-schema state itself: schemas with tests but no consumers, "deepening the illusion of enforcement" (W-9). Under P-7 + P-3 the only stable states are *enforced* or *deleted*.
- Input rules living only in UI (`maxLength` on the textarea) while the client-SDK write path accepts anything (W-9's privacy-mode example; PC-7's three hand-synced copies of the 2000-char comment limit).
- A new schema module landing without its consumer wired in the same change — the exact shape RC-6 documents as the epic's unfinished edge.
- Forms continuing to fork between `useForm`+zod and manual `useState` validation with "the same class of input rule liv[ing] in two places" (PC-1).

**Decisions it grounds.** AD-09 (primary: enforce-or-delete per schema, react-hook-form + zodResolver as the standard, trivial single-input exceptions allowed), AD-06 (schemas are the action client's input contract), AD-14 (validated writes are the write-side half of honest data).

**Tension notes.** With P-3: enforce-or-delete *is* the joint resolution — P-7 supplies the "enforce" branch, P-3 the "delete" branch, and the per-schema gate (Q-12: does production data already violate the schema?) picks per artifact. With P-5: flipping enforcement on can reject writes that previously succeeded — a behavior change. Precedence: **Q-12's compatibility check comes first; where live data violates a constraint, the constraint is either loosened to reality or the data migrated (recorded per P-4) before enforcement flips.**

---

## P-8 — Report before you handle

**Principle.** No failure of real state is silenced. Every catch site either surfaces the error to the user or reports it through the logging/telemetry pipeline *before* applying its handling policy (swallow, fallback, retry). Swallowing remains a legitimate UX policy; it is never an observability policy.

**Why it exists.** The corpus reads the same 17 swallow-sites twice, deliberately (assessment/11 C13's "dual reading"): as designed error policy — "every swallow site carries its justification inline" (assessment/02 S-12) — and as a production blindness: "a Firestore write that fails inside a service `catch` … logs to the user's own console and vanishes — production failure modes below the crash threshold are invisible" (assessment/03 W-17). The decisive fact is *what* the swallows sit on: "real state — SRS counters, Storage cleanup, invite delivery" (assessment/08 R-6, /01 exec summary), including the audit-trail writes themselves, making the admin Reports surface "best-effort by construction — gaps in it are undetectable and unalarmable" (W-17). The reporting infrastructure exists but is dark: 59 `console.error` sites "which reach no one", exactly 2 product callers of `enqueueClientLog`, Sentry behind four boundaries and a credential of unknowable presence, PostHog capturing one event type while its init comment "promises 'product events' that don't exist" (W-17, assessment/05 CX-7, /09 OP-21, OP-22). OP-22 notes precisely one counter-example in the repo (`AudioProvider.tsx:116` reports before handling) — the pattern this principle generalizes.

**What it rules out (observed instances).**

- `.catch(() => {})` on activity/audit-log writes — the audit surface losing entries invisibly (W-17).
- `console.error` as the production error channel (59 sites reaching no one).
- Handling that erases the failure *class*: the SRS counter increment, the Storage cleanup, and the invite delivery failing forever without anyone able to know (R-6).
- Shipping new fire-and-forget writes without a report line — the current default that made 17 sites accumulate.

**Decisions it grounds.** AD-16 (primary: report-then-handle via the existing pipeline is Accepted unconditionally; activation of Sentry/PostHog is gated on Q-4), AD-14 (P-8 is the write-side twin of honest UI — an unreported failure becomes a fabricated success), AD-17 (unreported failure classes can't inform coverage allocation).

**Tension notes.** With S-12's never-block contract (an instance of P-5 behavior preservation): reporting must not change control flow or add user-visible latency. Precedence: **the never-block contract wins on the user path; what P-8 eliminates is silence, not the swallow.** The mechanism already exists in the correct shape — `enqueueClientLog` is void-async and swallows *its own* failures (assessment/02 S-21) — so report-then-handle is an additive line at each catch site, not a policy reversal. Behavior preserved; observability gained.

---

## P-9 — Honest UI

**Principle.** Absent data renders as absent. A dashboard, metric, export, or control never fabricates a value — a zero standing in for "never measured", a live-looking button with no handler — because a reader cannot distinguish fabrication from fact.

**Why it exists.** The corpus's most operationally dangerous finding: admin metrics read two collections nothing writes and substitute fabricated data, so "'Error rate: 0' and 'Active users today: 0' render identically whether the system is healthy, idle, or the cache has simply never been populated — an operator cannot distinguish truth from unpopulated fallback, on exactly the surface built to answer that question" (assessment/03 W-11). The code even contains the comment "never fabricate activity metrics" — "which the zeros then feed to `SystemHealthCard` and stat cards anyway" (W-11). The export "hardcodes `newUsers: 0` and zeroed `featureUsage`, so exported 'analytics' can be structurally fabricated" (W-11); "Any operational decision made from this surface is made from fiction" (assessment/04 RC-5). The same dishonesty appears in control form: three Quick Action buttons "with no `onClick`, `href`, or form context … with no disabled state or 'coming soon' affordance to distinguish broken from unbuilt" (assessment/03 W-10), and in vocabulary form: "absence-of-log indistinguishable from absence-of-activity" (W-8). Fabrication also silently removed the forcing function: "the dashboard renders plausibly with or without [the producer], so nothing ever forced the producer to exist" (RC-5) — dishonest UI *causes* phantom pipelines, not just hides them.

**What it rules out (observed instances).**

- The zeroed analytics base row (`analytics.service.ts:37-49`) and the `metadata/counters` zeros feeding stat cards (W-11).
- The hardcoded-zero CSV export presenting synthesized rows as data (W-11).
- Handler-less buttons and stub pages presenting as live controls on the highest-privilege surface (W-10, TD-7).
- Any new dashboard tile whose empty state is a plausible number instead of an explicit "no data" rendering.

**Decisions it grounds.** AD-14 (primary: "dashboards must render absent data as absent — fabricated zeros are out of policy"; the never-written collections resolve via Q-9), AD-19 (inert admin surfaces are delete-unless-claimed), AD-16 (an honest error rate requires P-8's reporting to exist at all).

**Tension notes.** With S-12's fail-open defaults (assessment/02: "fail-open safe defaults for reads that must not block — daily progress zeros; `getFlags` → `DEFAULT_FLAGS`"): the corpus praises fail-open *control flow* and condemns fabricated *presentation* — these are compatible once separated. Precedence, resolved explicitly: **a fallback value may keep a flow alive (P-5/S-12), but wherever a fallback reaches a display or export surface, the surface must render it distinguishably from measured data.** A flag defaulting to its kill-switch state is honest (the default *is* the intended off-state, ADR-003); a metric defaulting to `0` is fabrication.

---

## P-10 — Three-use rule for shared extraction

**Principle.** Code is generalized into a shared home (`shared/`, a lifted engine, a cross-feature primitive) only when a third real consumer exists. Until then it lives in the scope that owns it, and capability is not built ahead of its first consumer without a recorded activation plan (P-4).

**Why it exists.** The corpus's counter-example is exact: `Drawer` was built *shared-first* (07-17, E13-T2), barrel-exported, and has **zero render sites** — while two real drawers (`DeckDetailsPanel`, `AdminSidebar`) remain hand-composed on the same Base-UI primitive (assessment/06 PC-3, /07 TD-11). The cost is worse than dead code: "a *misleading affordance*, since the next developer needing a drawer must discover that the shared one has zero precedent while the real pattern lives hand-rolled inside admin" (assessment/03 W-21(c)). The same capability-ahead-of-consumer shape recurs across CX-7's inventory (Storybook 8-packages-1-story; the fan-out callable with zero callers; PostHog's promised-but-absent product events) — "epics that *land infrastructure* complete visibly while the consumer half has no forcing function" (assessment/05 CX-7). The positive model is equally clear: "reusability here is earned, not aspirational" (assessment/02 S-16) — the shared primitives, schemas, `reorder.ts`, and the game engine all extracted *after* real multi-consumer demand (flashcard + kana both consume `features/game`).

**What it rules out (observed instances).**

- Building the shared primitive before its first consumer (`Drawer`, `fa2b6ab`) — the disposition is now delete-unless-claimed (AD-10, NQ-3).
- Lifting the admin table engine into `shared/` today, with only admin consumers — AD-11's explicit lift rule: "only when a third, non-admin consumer exists".
- Deployable capability with no caller and only an in-code aspiration note (`fanOutNotifications`, assessment/09 OP-14) — under P-10 + P-4 such provisioning needs a recorded activation step or it is not built.
- A full toolchain adopted for a hypothetical practice (Storybook, TD-12).

**Decisions it grounds.** AD-11 (primary — the three-use lift rule verbatim), AD-10 (Drawer branch), AD-19 (deleting what this rule would never have created).

**Tension notes.** *P-10 vs P-2, worked example:* two hand-rolled drawers are two patterns for one problem (P-2 violation), yet the three-use rule says two consumers do not justify a shared `Drawer`. Resolution — exactly AD-10's: **both drawers converge on the one sanctioned Tier-2 pattern (direct `Dialog.Root` composition via `DialogChrome`) — P-2 satisfied by pattern convergence without shared-component extraction; the shared component waits for a third consumer per P-10.** P-2 counts patterns; P-10 places implementations. *P-10 vs AD-13's listener centralization:* no conflict — `useUserProgress` has 10 mounting consumers (assessment/08 R-1); the three-use threshold is exceeded tenfold, so centralization is exactly what P-10 prescribes.

---

## P-11 — Realtime by default, cache by exception, per ADR-002

**Principle.** The data layer follows ADR-002's written policy: realtime learner data rides bespoke `onSnapshot` subscriptions; one-shot server state rides React Query; local and store state per the four-tier model. Additions land *inside* the policy (or amend it, recorded per P-4) — and within the realtime tier, per-entity subscriptions centralize into single shared listeners.

**Why it exists.** This affirms a strength the corpus verified end-to-end: the four-tier state model "codified in `docs/adr/002-data-layer-pattern.md`" with auth explicitly excluded from persistence (assessment/02 S-14), and "the code matches the ADR at every re-verified site" (assessment/06 PC-14). The policy's own words are unambiguous: "Realtime data stays on bespoke `onSnapshot` hooks — unconditionally" (ADR-002, quoted in assessment/05 CX-3). Two deviations motivate the principle's two clauses. First, module-level caches (gemini `Map`s, flags TTL) sit *outside* the ADR with "no cross-cutting cache policy nam[ing] them" (PC-14, gap m-4) — the exception tail that grows unless additions must land inside the policy. Second, listener topology: `useUserProgress` opens a listener *per mount* across 10 consumer sites, while `NotificationsContext` demonstrates the correct centralized shape — "a single listener + derived state, mounted exactly once" (assessment/08 R-1, /06 PC-16). Same policy, two topologies; the corpus shows which one scales.

**What it rules out (observed instances).**

- A new ad-hoc module cache joining the gemini/flags precedent without amending ADR-002 (PC-14's "intent unknown" exemptions stop accreting).
- Replacing a realtime surface with polling or cached one-shot reads for convenience — contra the ADR's "unconditionally".
- New per-entity, per-mount listener multiplication (R-1's structure) instead of the notifications-style single shared subscription (AD-13's convergence target).
- Unbounded listeners riding the "realtime by default" license — the public-lesson `collectionGroup` listener with no `limit()` (assessment/08 R-2) shows the default does not excuse the bound (see tension note).

**Decisions it grounds.** AD-13 (primary: ADR-002 affirmed; listeners centralize per entity), AD-12 (grow-window resubscribe is the realtime tier's sanctioned pagination), AD-14 (every listener carries an explicit bound).

**Tension notes.** *P-11 vs AD-14 (bounded queries):* none in substance — "realtime by default" governs the *mechanism*, AD-14 governs its *envelope*. Precedence stated anyway: a realtime subscription that cannot state its bound is out of policy regardless of tier (R-2 is the standing example; its acceptable scale is NQ-6). *P-11 vs P-2:* P-11 *is* P-2 applied to data access — one pattern per data-shape, already written down; the principle exists separately because ADR-002 is the repo's one proven case of a written, followed policy (the model for what P-4 wants everywhere).

---

## P-12 — Business logic lives in features; routes orchestrate

**Principle.** The route layer (`app/`) contains only orchestrators: thin files that wire a URL to a feature root, plus genuinely route-bound chrome (layout shells, provider-free error fallbacks). Anything that imports feature hooks, services, or domain logic is feature UI and lives in `features/<name>` — regardless of how many routes render it.

**Why it exists.** The dominant convention is a verified strength: "the kana-learn page is 8 lines and self-describes as a 'Pure orchestrator'" — routes add "nothing but wiring, so URL structure and feature code evolve independently" (assessment/02 S-2). The standing violation shows what erosion costs: kana-survival's four screens (483 lines) live under `app/[locale]/(immersive)/kana/survival/_components/` while its hooks live in `features/kana/` — "it is feature UI hosted in the route layer" (`SurvivalQuizScreen` imports internals from three features; assessment/04 RC-8). Consequences the corpus verified: the screens are invisible to every `features/kana`-scoped search and tool; the `app → game` dependency edges exist *only* because of these files (RC-8); the placement "survived at least four deliberate passes" and three restructures (assessment/06 PC-15); and "anyone placing new screens route-side can point at survival" (RC-8) — the exception is precedent. The same erosion appears a second time in the notifications list (assessment/03 W-5), confirming CX-9's diagnosis: two individually-coherent conventions with "no recorded rule … the aggregate is a rule that can only be learned by enumerating exceptions."

**What it rules out (observed instances).**

- The survival placement itself — resolved by AD-05 (screens relocate to `features/kana/survival/`, parity with all four sibling modes; NQ-5 recorded as resolved-by-decision with owner veto).
- `NotificationsVirtualList` living route-side while `features/notifications/components/` exists (W-5, PC-15).
- The next mode's screens being born under `_components/` because a precedent existed.
- Fat route files re-accumulating orchestration logic (survival's `page.tsx` is already "one of the few pages that is a real orchestrator" rather than a one-line render, PC-15).

What it deliberately does **not** rule out: genuinely route-bound chrome — `app/_components/` error fallbacks ("must render when providers crash", PC-15), `BottomNav` as route-group shell — which CX-9 concedes is "arguably the better home". The boundary test is the dependency test above (imports feature hooks/domain ⇒ feature UI), articulated once here and in AD-05, then enforced per P-1 rather than re-litigated per file.

**Decisions it grounds.** AD-05 (primary: the one placement rule + survival relocation), AD-04 (features as the unit of cohesion the rule protects), AD-01 (feature public APIs presuppose feature code living in features).

**Tension notes.** *P-12 vs the Next.js `_components` idiom:* resolved by the dependency test — the idiom survives for chrome, dies for feature UI. *P-12 vs P-5:* relocation is a behavior-preserving move (file moves + import updates), sized naturally as one small PR per surface; the corpus's relocation epics (`9e1893f`, `348c484`) are the working precedent.

---

## Precedence summary

The recurring trade-offs, resolved once:

1. **P-4 precedes all staged work.** No migration, ratchet, or capability lands without its end state recorded. P-4 is what keeps P-5's incrementalism from freezing (the corpus's frozen frontiers) and what turns P-3's deletions into auditable gates.
2. **Gate, then delete (P-5 → P-3).** Before an item's named gate answers: behavior preservation wins, no deletion, and no refactor investment in the dormant surface either (freeze). After the gate confirms dead: deletion is behavior-preserving by definition and precedes refactoring.
3. **Ratchet enforcement (P-1 with P-5).** Enforcement mechanisms land immediately; pre-existing violations are grandfathered at warn and burned down incrementally (recorded per P-4); new violations error from day one. In-repo precedent: the `max-lines` warn-then-tighten plan (CX-8), CI's annotated non-blocking lint (S-11).
4. **Never block, never silence (P-8 with S-12/P-5).** The never-block contract wins on the user path; reporting is added inside the existing non-blocking pipeline. Swallowing stays a UX policy and stops being an observability policy.
5. **P-2 counts patterns; P-10 places them.** Convergence onto one sanctioned pattern does not require (and must not trigger) shared extraction before the third consumer. Worked example: the two bespoke drawers converge on Tier-2 `Dialog.Root` + `DialogChrome` (AD-10) while `Drawer` awaits its NQ-3 gate.
6. **Fallback values flow; fabricated values don't render (P-9 with S-12).** Fail-open defaults may keep control flow alive; any fallback reaching a display or export surface must be distinguishable from measured data.
7. **A second pattern needs a recorded constraint (P-2 with AD-12/AD-15).** Principled plurality (two pagination mechanisms, two RBAC domains) is sanctioned exactly when the constraint difference is real and written down (P-4); undocumented plurality converges.
