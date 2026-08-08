# 06 — Implementation Contract

**Execution-Readiness, Phase 7.** The mandatory rules any implementer — human or AI agent — must follow while executing this program.

## How this document was built, and what that means for you

**Every rule below is derived from an existing artifact. Nothing here is invented.** Each rule carries the citation that establishes it. Where a rule is a *derivation* from two or more artifact statements rather than a restatement of one, it is marked **[derived]** and the reasoning is given. Where an artifact imposes an obligation that **no rule can enforce**, that is recorded in §11 as a gap rather than papered over with an invented rule.

**Precedence when two rules collide.** `architecture-decision/01-Architecture-Principles.md` §"Precedence summary" resolves the recurring trade-offs once, and it governs. Its seven resolutions are carried into §3 (AC-8, AC-14), §4 (VE-9, VE-10) and §6 (GD-5). Where a coding standard and an ADR appear to conflict, `architecture-decision/04-Coding-Standards.md` §"Conflicts and missing information" already adjudicates four such cases; those adjudications are carried into AC-13 and PROH-18.

**Rule count:** 126 numbered rules across ten sections, plus the 19-point Definition of Done.

---

## 1. Scope discipline — 12 rules

*Never refactor unrelated code · one concern per PR · no new features.*

| # | Rule | Source | Reviewer verifies by |
|---|---|---|---|
| **SD-1** | **State the PR's concern in one sentence with no "and."** If the concern needs two sentences, it is two PRs. | `04-PR-Plan.md` §1.2(1) | Reading the PR's Concern line. A conjunction is a rejection. |
| **SD-2** | **Never mix boundary enforcement with behavior change in one PR.** A lint rule, a barrel, an import-path migration and a permission-metadata declaration are boundary changes; a different value reaching the user is behavioral. | `04` §1.2(2) | Classifying the diff. "A reviewer checking a rule and a reviewer checking a behavior are reading for different things." |
| **SD-3** | **Land additive first, removal last** — introduce the new path, migrate consumers, remove the old path, as three PRs. Keep the removal PR small. | `04` §1.2(6) | Counting PRs in the chain; the removal diff should be near-trivial. |
| **SD-4** | **Keep test-only PRs test-only.** If writing a test reveals a bug, fix it in a separate PR. | `04` §1.2(7) | `git diff --stat` touches no production file. "Otherwise the test cannot be trusted as evidence." |
| **SD-5** | **Make every PR independently testable.** If it can only be verified once a later PR lands, it is half a PR. | `04` §1.2(5) | Ask: can this be verified on `main` today? Sole exception: a deliberately staged intermediate state where both paths are live (see BP-8). |
| **SD-6** | **Target one reviewing sitting** — a working ceiling of ~400 changed lines of hand-written logic, or a few thousand lines of *provably* mechanical rename. | `04` §1.2(4) | Line count; for renames, confirm the transformation is uniform. |
| **SD-7** | **Build no capability without a live consumer.** Deliberate forward-provisioning is allowed **only** with a ledger entry naming its intended consumer, activation step and review-by date. | `04-Coding-Standards.md` CS-3; `08-Implementation-Readiness.md` §7(11) | Name the consumer in the PR, or point at the ledger row. |
| **SD-8** | **Extract into `shared/` only at the third consumer.** Two consumers do not justify a shared primitive. | CS-1; `01-Architecture-Principles.md` P-10 | Count call sites. `Drawer` (zero consumers, canonical-looking) is the cautionary case. |
| **SD-9** | **Do not refactor a dormant surface that is awaiting a gate.** Before the gate answers: behavior preservation wins — no deletion, and no refactor investment either (freeze). | `01-Architecture-Principles.md` §Precedence(2) | Cross-check the diff against the gated dispositions in `09-Progress-Tracking.md` §2.3 (LDG-01…LDG-15). |
| **SD-10** | **Put nothing structural in flight beside a repo-wide merge lock.** The three locks are the import migration (PR-3.1–3.3, 55+ sites), server-action plumbing (PR-16.1–17.1, ~30 modules), and the flashcard layout move (PR-27.1–27.3, 146 files). | `04` §8.3 | Check open branches during a lock window. "A concurrent branch will not rebase cleanly." |
| **SD-11** | **Split files by responsibility, never to hit a number.** Taxonomy-only splits are the named failure mode. | CS-2; `08` §7(7) | Ask of each new file: is this one cohesive responsibility? |
| **SD-12** | **Introduce no new feature and no new architecture.** Every change traces to an existing ADR. | `implementation-planning/00-INDEX.md` §Phase-7 quality review ("Derivation deliberately created no new features and no new architecture"); `08` §7(17) | The PR names the ADR it implements. No ADR, no merge. |

---

## 2. API & behavior preservation — 9 rules

| # | Rule | Source | Reviewer verifies by |
|---|---|---|---|
| **BP-1** | **Preserve behavior at every step.** Migration is incremental and each step is behavior-preserving; a step that changes behavior says so and is reviewed as a behavior change. | P-5 | The PR declares itself neutral or behavioral. Both are fine; silence is not. |
| **BP-2** | **A behavior-neutral PR must be *provably* neutral.** | `04` §2 PR-1.4 ("a reviewer diffs the two sets for equality") | Reviewer reproduces the equality check, not the author's assertion. |
| **BP-3** | **Publish a public API additively first** — deep imports keep resolving until the migration completes. That is a **stable intermediate state**, and it is the sanctioned way to cross a sprint boundary. | `04` §2 PR-2.3; `03-Sprint-Plan.md` §3 Sprint 2; `08` §4 S2 | Build passes with old import paths still present. |
| **BP-4** | **When two implementations of one thing differ, record the adjudication before unifying them.** Name which entries the surviving implementation must now honor. | `01-Validated-Backlog.md` §T-118a ("**no route silently changes** … without that decision being written down") | The PR body carries the before/after admitted set explicitly. |
| **BP-5** | **Never break a public API in the same PR that migrates its consumers.** Removal is its own PR and it is last. | `04` §1.2(6) | See SD-3. The removal PR "is the one that reverts under pressure." |
| **BP-6** | **Treat a new seam as new public surface and design it as one.** A registry or injection seam joins the owning feature's barrel contract. | `08` §4 S4 ("the notifications seam is **new public surface** on notifications' barrel and must be designed as one") | Review the seam's exported shape as a contract, not as plumbing. |
| **BP-7** | **A root barrel is a curated export list, reviewed as a contract — never `export *`.** | ADR-101's named trade-off via `08` §4 S2; CS-7 | Read each export and ask "is this the contract?" An over-broad barrel "degenerates into *everything is public*." |
| **BP-8** | **Use a staged dual-path intermediate state only where both paths are live and each is independently testable** (dual-credential auth, dual action clients). | `04` §1.2(5) exception | Both paths have passing tests *as an intermediate state*. |
| **BP-9** | **Revert the unit, not the commit.** Where a set of tasks is atomic, a partial revert is worse than no revert. | `10-Release-Plan.md` §3.4, §2.2(6) | The rollback note names the unit. R4.2 (T-106a/b/c/d) is the worked case: "Reverting T-106b while keeping T-106d leaves migrated call sites with no client at all." |

---

## 3. Architecture compliance — 16 rules

*Boundary and import rules · placement rules · the two-tier dialog rule · the pattern-plurality rule.*

| # | Rule | Source | Reviewer verifies by |
|---|---|---|---|
| **AC-1** | **Keep layer direction one-way: `app → features → shared`, with `lib` as infrastructure.** Banned edges: `shared → features`, `shared → lib`, `features → app`, `lib → features`. | CS-9 (AD-01/02/03 operationalized) | ESLint boundary rules; grep for the banned edges. |
| **AC-2** | **`lib` never imports `features`** — the sole sanctioned upward edge is the composition root `lib/providers.tsx`. | CS-9; ADR-103 | `02-Execution-Waves.md` §Wave 1 exit 6: "Grep of `lib/` for `@/features` matches **only** `lib/providers.tsx`; a synthetic `lib → features` import fails lint." |
| **AC-3** | **Cross-feature imports target a feature's root barrel only.** No deep imports into another feature's internals. | CS-9; ADR-101 | `02` §Wave 1 exit 1: grep for cross-feature imports bypassing root barrels returns **zero**; external import sites into `flashcard/types` = 0 (was 43). |
| **AC-4** | **Feature dependency runs `flashcard → notifications`, never back.** Cross-feature actions reach notifications' UI through a registry/injection seam owned by notifications' public API. | CS-9; ADR-102 | `02` §Wave 1 exit 4: grep of `features/notifications/` for `@/features/` (other than itself) returns **zero**. |
| **AC-5** | **A barrel is a public-API surface — feature root, enforced sub-modules, and `shared` — not one per directory.** Do not regrow toward the 61-barrel state. | CS-7; `08` §4 S2 | Count barrels; each new one must name the API surface it publishes. |
| **AC-6** | **Follow the two-tier dialog rule.** Tier 1: shared primitives (`Modal`/`ConfirmModal` on Base UI Dialog + `DialogChrome`) for standard dialogs. Tier 2: direct `Dialog.Root` composition for bespoke overlays — **always via `DialogChrome`**, so backdrop, close-button a11y and scroll behavior are guaranteed on both tiers. | ADR-110 §Decision, §Consequences | ADR-110's own success criterion: grep — **no overlay uses a hardcoded backdrop className; `DIALOG_BACKDROP_CLASSNAME` is the only backdrop source.** The `DeckDetailsPanel` `bg-[#3c3c3c]/30` straggler is the named instance. |
| **AC-7** | **Follow the pattern-plurality rule: one pattern per problem, not per surface.** A second pattern is legitimate **only when it names, in code, the constraint that forecloses the first**, recorded per P-4. Absent a recorded constraint, converge. | P-2; `01-Architecture-Principles.md` §Precedence(7) | Locate the in-code constraint note at the point of use. "Principled plurality … is sanctioned exactly when the constraint difference is real and written down; undocumented plurality converges." |
| **AC-8** | **P-2 counts patterns; P-10 places them.** Converging onto one sanctioned pattern must **not** trigger shared extraction before the third consumer. | `01-Architecture-Principles.md` §Precedence(5) | The worked case: the two bespoke drawers converge on Tier-2 `Dialog.Root` + `DialogChrome` *without* adopting a shared `Drawer` component. |
| **AC-9** | **Services mark their execution context, own their path literals in `*-paths.ts`, and never reach around another service.** | CS-6 | Grep for path literals outside `*-paths.ts`; check for cross-service internal access. |
| **AC-10** | **Keep the three-tier component grammar** — thin route orchestrator / feature root / presentational leaf, no blending. **Business logic lives in features; routes orchestrate.** | CS-4; P-12 | Read the component's tier against its location and its imports. |
| **AC-11** | **Respect the four-tier state model: stores hold data, contexts hold resources.** Realtime stays on bespoke `onSnapshot` hooks unconditionally; server state never leaks into a client store; **auth is never persisted.** | CS-11; `08` §7(12); P-11 | Check the `partialize` exclusion for auth; check that a new context owns a resource (a listener or an imperative API), not data. |
| **AC-12** | **Meet the performance rules:** every `collection`/`collectionGroup` query carries an explicit `limit()`; one centralized realtime listener per entity; server-backed inputs debounce; virtualize by trigger not by default; animation uses `m.*` under `LazyMotion strict` only. | CS-10 | Grep for unbounded listeners; a bare `motion.*` render "is a defect (throws)." |
| **AC-13** | **Follow the suffix taxonomy, and domain-qualify or barrel-only-import colliding generic names.** The two `rbac.ts` are the live collision. | CS-8; `08` §4 S3 | Check for a name collision resolvable only by path. |
| **AC-14** | **Land the enforcement mechanism immediately; grandfather existing violations at `warn` and burn them down; error on new violations from day one.** | P-1 §Tension notes; `01-Architecture-Principles.md` §Precedence(3) | The grandfather list is itself a P-4 artifact — it must record the migration's end state (zero) and current stage. |
| **AC-15** | **Do not simplify what the NS-guards protect.** The "what NOT to simplify" set NS-1…NS-8 is binding. | `05-Simplification-Strategy.md` NS-1…NS-8, invoked by `08` §preamble and §4 | Named instances in use here: **NS-3** (five-suite topology affirmed, not extended), **NS-5** (the auth-gating layer stack — each stratum correctly distrusts the one above), **NS-7** (the `artifacts/{APP_ID}` layout is out of scope). |
| **AC-16** | **Put orchestration in a controller hook**; the stable-callback-ref and render-time-reset idioms are the standard, not an author's preference. | CS-5 | Check that a session/controller hook owns orchestration rather than a component. |

---

## 4. Validation & error handling — 10 rules

*Validate at the boundary · report-then-handle · no silent failure of real state.*

| # | Rule | Source | Reviewer verifies by |
|---|---|---|---|
| **VE-1** | **Validate every server write path through its zod schema before persisting.** | CS-13(1); P-7; `08` §7(10) | Trace the write path from entry to `set`/`update`; the schema call must precede persistence. |
| **VE-2** | **A declared schema is either enforced on its write path or deleted.** No schema may claim "source of truth" while consumed by nothing. | CS-13(1); ADR-109 | Grep for consumers of each exported schema. Zero consumers = enforce or delete, never leave. |
| **VE-3** | **Use `react-hook-form` + `zodResolver` for multi-field forms.** Trivial single-input cases may stay controlled-state. | CS-13(2) | Count fields; check the resolver. |
| **VE-4** | **Give every limit exactly one authoritative source** — not three hand-synced copies. | CS-13(3) | Grep the constant (e.g. comment length 2000). |
| **VE-5** | **Report before you handle. No silent failure of real state.** A swallow site (`.catch(() => {})`, bare `catch {}`) must route the error through the logging pipeline *before* swallowing — the swallow controls user experience, not observability. | CS-12(1); P-8; ADR-116 | Every new `catch` has a reporting call above the swallow. |
| **VE-6** | **Surface by context, using the three sanctioned styles:** render-path failures **throw** to the nearest error boundary · subscription failures go **into state** (`error: string \| null`) · secondary/background writes are **fire-and-forget — but report first**. | CS-12(2); `08` §7(9) | Match the surfacing style to the call site's context. |
| **VE-7** | **Boundaries surface; services report.** Error boundaries render the provider-free `ErrorFallback`; services report through the logging pipeline and do not render. | CS-12(3) | A service that renders, or a boundary that logs instead of surfacing, is a violation. |
| **VE-8** | **Keep the bracketed scope-tag convention** on `console.error` and logs (`"[useLessons]"`, `"[flags]"`). | CS-12(4); `08` §7(9) | Grep the new log lines for the tag. |
| **VE-9** | **Fallback values may flow; fabricated values must not render.** Any fallback reaching a display or export surface must be distinguishable from measured data. | P-9; `01-Architecture-Principles.md` §Precedence(6) | Check dashboards and exports: a zero must be a measured zero or visibly absent, never a fabricated one. |
| **VE-10** | **Never block the user path in order to add reporting.** Reporting is added *inside* the existing non-blocking pipeline; swallowing stays a UX policy and stops being an observability policy. | `01-Architecture-Principles.md` §Precedence(4) | The added report must not introduce an `await` on the user path. |

---

## 5. Testing obligations — 10 rules

*Which suite tiers gate what · run regression after every completed task.*

**The five tiers** (`04` §1.1; ADR-117; S-10/S-11): **unit** (node, `*.test.ts`) proves pure domain logic and schema behavior · **browser** (Vitest Browser Mode, `*.browser.test.ts`) proves keyboard/focus/a11y contracts in a real DOM · **emulator** (app + rules, `*.emu.test.ts`) proves Firestore rules against the real rules engine · **functions** (functions emulator) proves Cloud Function behavior and idempotent delivery · **E2E** (Playwright against emulator + dedicated server) proves realtime flows end to end.

| # | Rule | Source | Reviewer verifies by |
|---|---|---|---|
| **TO-1** | **Prove every change with at least one of the five tiers, and name which in the PR body.** | `08` §7(4); `04` §1.1 | The PR names a tier and links the run. |
| **TO-2** | **Name the tier whose result is *load-bearing* for that change**, not the cheapest tier that happens to pass. | `04` §1.1 ("Tiers listed per PR are the ones whose result is **load-bearing** for that change") | Ask: if this tier were green and the change were wrong, would the tier have caught it? |
| **TO-3** | **A change with no applicable tier is a readiness failure, not a task.** Do not invent a tier and do not proceed without one. | `08` §7(4); `08` §1 rule 6 | `09-Progress-Tracking.md` §6.3 rates "PR with no named applicable test tier" **red on any occurrence**. |
| **TO-4** | **Do not merge a PR whose named evidence does not exist.** If the test that would prove the change has not been written, either write it in this PR or record explicitly what is gating the merge instead. **[derived]** — from `08` §1 rule 6 (a change with no applicable tier is not READY) plus `09` §6.3 (a PR with no named tier is red). Neither artifact covers the case of a PR that *names* a tier whose test has not been authored; this rule closes that hole. | **[derived]** from `08` §1 rule 6 + `09` §6.3. Live instance: `04-Sprint-1-Approval.md` F-2 | Open the named spec file. If it does not contain the named case, the evidence does not exist. |
| **TO-5** | **Ship every rules change with a rules-suite test** (available from S7 onward). No rules change ships on emulator-free reasoning. | `08` §7(6) | The diff to `firestore.rules` has a matching `*.emu.test.ts` case. |
| **TO-6** | **Keep existing suites green, and run the emulator tiers at every sprint boundary even when untouched.** They are the tiers most likely to rot unnoticed at team size 1. | `08` §7(5); `07-Risk-and-Mitigation.md` §X-11 contingency 2 | Sprint-boundary run recorded. R-15: "emulator-tier tests are the ones most likely to be skipped locally and thus rot." |
| **TO-7** | **Run the regression after every completed task, and require all five suites green at a wave boundary.** **[derived]** — the artifacts state a per-PR tier obligation (`08` §7(4)), a per-sprint-boundary emulator obligation (`08` §7(5)) and a per-wave-boundary all-green obligation (`09` §6.3); no artifact states a per-task full-regression obligation. This rule is the tightest reading consistent with all three. | **[derived]** from `08` §7(4)(5) + `09` §6.3 ("Test suites not all green at a wave boundary — red, any occurrence") | Task is not Done until the suites it can affect are green; wave gate requires all five. |
| **TO-8** | **Do not extend the test topology.** Five suites — no sixth tier, and no global coverage-percentage mandate. ADR-117 rejected both explicitly. | NS-3 / ADR-117, via `08` §4 S5 | A PR adding a config file for a sixth tier is a violation. |
| **TO-9** | **A check shipped report-only is not a passing check until it flips.** Do not count it as evidence in the interim. | `10` §2.2(12); `10` §4.1 R4.1 note; `01-Validated-Backlog.md` §5.4 | T-115b is the live case: report-only in R4.1, flips to failing in R5.1. |
| **TO-10** | **Never report emulator-green as production-verified.** Until Q-1 answers, record explicitly where verification was emulator-only. | `08` §7(15); `07-Risk` §X-8 | The ledger row or PR carries the emulator-only note. `10` §4.4: the emulator answers "is the code right?", not "is it safe to remove the other half?" |

---

## 6. Gate discipline — 10 rules

*Never proceed past an unanswered gate without recording the default and a ledger row · never silently default.*

| # | Rule | Source | Reviewer verifies by |
|---|---|---|---|
| **GD-1** | **Open every wave containing gated tasks with a question-resolution item naming its questions — before any task in that wave is picked up.** Question-answering is scheduled work, not a wish. | `09` §5, §5.4; `03` §9 | The wave's opening entry lists the questions, who is being asked, through what channel, by when. |
| **GD-2** | **Run the five-step wave-opening ritual in full:** (1) list the wave's needed questions · (2) for each, answered? if not, who/channel/by-when · (3) for each executable-fallback task, confirm the review-by date and that executing the default at expiry is still acceptable · (4) for each inaction-fallback task, confirm it is **not** in the sprint · (5) record the outcome. | `09` §5.4 | "A wave that opens without this step has skipped kernel rule 3." |
| **GD-3** | **Never proceed past an unanswered gate without recording: which question, which default, which alternate branch the answer would trigger, and the review-by date.** | `08` §7(14) | The ledger row contains all four. Missing any one = the default was taken silently. |
| **GD-4** | **An undecided state is a task failure, not a deferral.** Deferring is permitted; leaving it undecided and unrecorded is not. | `09` §5.1 (Q-4 row: "Undecided is a task failure, not a deferral") | Look for a recorded decision-to-defer with a reason. Silence fails. |
| **GD-5** | **Never work a task whose fallback is *inaction*.** It cannot occupy capacity. The four are T-115c, T-108b, T-108c, T-108d. | `09` §1.2, §5.4(4); `01-Architecture-Principles.md` §Precedence(2) | The task is absent from the sprint. ADR-108 states the harm exactly: collapsing the dual read path unconfirmed "would silently hide pre-migration notifications from users." |
| **GD-6** | **An executable-fallback task moves off Gated in exactly two ways:** the question answers, **or** the ledger row's review-by date passes and the pre-committed default executes. Nothing else. | `09` §1.3 | Check which of the two occurred. "Without an expiry that actually fires, *delete-unless-claimed* degrades into *delete-never*." |
| **GD-7** | **Never let a review-by date pass unactioned.** | `09` §6.1 (**red on any occurrence**); ADR-120's own trade-off ("an unmaintained ledger is as misleading as a stale comment") | Scan the ledger for past-due rows at every sprint boundary. |
| **GD-8** | **Re-confirm an `[INTENT]` gate immediately before executing an irreversible act on its default.** A five-minute re-ask before a deletion. | `07-Risk` §X-9 contingency 2 | The PR that deletes carries a dated re-confirmation. |
| **GD-9** | **Ask earlier than you need.** Q-5 and NQ-1 are needed in Wave 5 and must be asked **by Wave 3** — a `[DATA]` sample and an `[OPS]` deploy check both have latency a wave boundary does not absorb. | `09` §5.4; `09` §6.1 ("Q-5 not asked by end of Wave 3 — red") | Check the asked-on date against the wave number. |
| **GD-10** | **A gated task is NOT READY until its question answers, regardless of fallback.** The fallback governs what ships anyway; **it does not confer readiness.** | `08` §1 rule 2 | Do not relabel a gated task READY because its default is executable. Report both facts separately. |

---

## 7. Ledger & tracking obligations — 11 rules

*ADR-120: record intended end state / stage / owner / review-by · mark backlog progress after merge.*

| # | Rule | Source | Reviewer verifies by |
|---|---|---|---|
| **LT-1** | **Every ledger row carries all four fields — intended end state · current stage · owner · review-by date. A row missing any of the four is invalid by the format's own statement.** | `01-Validated-Backlog.md` §T-120a; ADR-120 | Read the row. `09` §6.1 rates a row missing owner or review-by **red on any occurrence**; `09` §2.4 calls it "a defect on creation." |
| **LT-2** | **The owner is a person, not a class.** "[INTENT]" is not an owner. | `09` §5.3 ("**owner named** — a person, not a class") | A name, not a bracket tag. |
| **LT-3** | **Landing a staged change adds its ledger row in the same change** — not afterwards. | `08` §7(13); `01` §T-120a; `09` §2.4 | The PR that lands the staged change contains the row. |
| **LT-4** | **If a task advances a staged change, move that row's `current stage` in the same PR.** A staged change that lands without its row moving is a **review-time defect**. | `09` §1.4 | Diff the ledger alongside the code. |
| **LT-5** | **No `@deprecated` marker and no "reconcile later" comment may exist without a corresponding ledger row naming its removal condition.** | `08` §7(13); `01` §T-120b acceptance criteria | Grep for `@deprecated` and "reconcile later"; each hit maps to a row. |
| **LT-6** | **Deliberate forward-provisioning requires a ledger entry naming its intended consumer, activation step and review-by date.** | CS-3; `08` §7(11) | See SD-7 — this is its recording half. |
| **LT-7** | **Keep the ledger and the progress table separate.** The ledger never lists task IDs, sprints, PRs or statuses — it is not a backlog. The progress table never restates an intended end state, owner or review-by — it is not a ledger. **They touch in exactly one column:** the progress table's `Ledger` column names the row a task advances, or `—`. | `09` §2.2 | Scan each artifact for the other's fields. |
| **LT-8** | **Where the ledger and the progress table disagree, the ledger wins.** It is the in-repo record a future maintainer reads; the progress table is scaffolding for one execution run. | `09` §2.2 | On conflict, correct the table. |
| **LT-9** | **Mark backlog progress after merge:** the task's progress row carries a **PR link** and a **done-date**. | `09` §1.4 | Both present before the task is called Done. |
| **LT-10** | **Record verification provenance:** which tier verified the change, and — until Q-1 answers — an explicit note where verification was emulator-only. | `08` §7(15) | See TO-10. That note "is what makes X-8 auditable" (`07-Risk` §X-6 contingency 4). |
| **LT-11** | **Keep completion state in-repo.** No external tool becomes a second home for it; nothing outside the repo is knowable to the code or to a future maintainer. | `09` §2.1 (ADR-120's rejected alternatives) | The ledger file is in the repository and discoverable from the docs index. |

---

## 8. Documentation obligations — 9 rules

| # | Rule | Source | Reviewer verifies by |
|---|---|---|---|
| **DO-1** | **Maintain traceability: task → ADR → driving findings → corpus file.** | `08` §7(17) | Every task states its chain. |
| **DO-2** | **Never cite a requirement-ID or a recommendation-ID.** `requirements-consolidation/` and `engineering-tasks/` do not exist; inventing an ID to fill a column fakes the audit trail. | `08` §7(17); `00-INDEX.md` §Provenance and honest labelling | Any `REQ-`/`REC-`-shaped citation is a violation. |
| **DO-3** | **Keep the docs ADR index listing every ADR on disk.** A file-count comparison of index entries against `docs/adr/*.md` must match exactly. | `01` §T-120c; `02` §Wave 1 exit 12 | Run the comparison. |
| **DO-4** | **Keep the ADR/ledger division: ADRs record decisions at a point in time (immutable); the ledger tracks mutable current stage.** Do not amend an ADR to record progress. | `01` §T-120c acceptance criteria; `09` §2.1 | An ADR edit that changes a stage is a violation — it belongs in the ledger. |
| **DO-5** | **Record a hosting/deployment decision as a *new ADR* before any implementing work is planned.** | `01` §T-118d acceptance criteria | The new ADR exists first; T-118d becomes schedulable only then. |
| **DO-6** | **Give each PR its nine fields:** ID, title, tasks, concern, scope, why it is one sitting, how it reverts, which tiers must pass, and what it comes after. For a behavioral change, state the before/after explicitly. | `04` §1 (the nine fields); `04` §2 PR-1.5; PR-2.1 | Missing "Reverts" or "Tests" is a rejection. |
| **DO-7** | **Document every referenced env var with its purpose *and* the observable degradation when unset.** That is what makes silent env-gating auditable. No secret values — names, purposes and placeholder shapes only. | `01` §T-118c | Read `.env.example`: each entry has both halves and no value. |
| **DO-8** | **Document a second sanctioned pattern's constraint at the point of use**, in code. | P-2; CS-10(4) ("the choice documented at the point of use") | Find the note beside the second implementation, not in a wiki. |
| **DO-9** | **Record incoherences rather than silently resolving them. Never pick a number to make counts close.** | `08` §6 preamble; `08` §6(4) ("The count discrepancy is flagged for a corrective pass, **not silently resolved by picking a number**") | An incoherence log entry exists naming both figures and which is authoritative. |

---

## 9. Definition of Done — 19 rules

The standing checklist. It applies to **every task in every sprint, gated or not**, and it is the floor beneath each task's own acceptance criteria in `01-Validated-Backlog.md` — not a substitute for them. DD-1…DD-17 mirror `08` §7 exactly; DD-18 and DD-19 add the two obligations `09` §1.4 carries that `08` §7 does not.

**Gate — mechanical, enforced by the existing pre-commit hook, not negotiable per task** (`08` §7):

- **DD-1** Lint passes, **including every boundary rule active at the time** (CS-9: one-way layers · `lib` never imports `features` except `lib/providers.tsx` · cross-feature imports target root barrels only · `flashcard → notifications`, never back). — *`08` §7(1)*
- **DD-2** Format passes. — *`08` §7(2)*
- **DD-3** Full build passes, TypeScript included. **A task that leaves the build red has not landed.** — *`08` §7(3)*

**Tests — five-suite topology, affirmed not extended** (`08` §7; NS-3):

- **DD-4** The change is proved by at least one of the five tiers, and the task states which. **A change with no applicable tier is a readiness failure, not a task.** — *`08` §7(4)*
- **DD-5** Existing suites stay green. **Emulator tiers run at every sprint boundary even when untouched** — they are the tiers most likely to rot unnoticed at team size 1. — *`08` §7(5)*
- **DD-6** Rules changes carry a rules-suite test (available from S7 onward). **No rules change ships on emulator-free reasoning.** — *`08` §7(6)*

**Standards — checked at review, several also lint-enforced** (`08` §7):

- **DD-7** CS-2 file ceiling applies to **every file the task touches**: ≤ 250 green · 251–400 allowed with a "is this one cohesive responsibility?" checkpoint · **> 400 blocking**. Split by responsibility, never to hit a number. — *`08` §7(7)*
- **DD-8** CS-14 tokens and i18n: no raw hex outside the recharts carve-out (use `chartTheme.ts`, not inline literals) · no hardcoded user-facing strings — all copy through `next-intl`, navigation through the `@/i18n/navigation` wrappers · **en/ja message-key parity is exact** · reuse a `shared/components/ui` primitive before hand-styling; no arbitrary bracket values. — *`08` §7(8)*
- **DD-9** CS-12 report-then-handle: no new swallow site discards an error without reporting first; surfacing style matches context; the bracketed scope-tag convention is kept. — *`08` §7(9)*
- **DD-10** CS-13 validation at the boundary: any new server write path validates through a zod schema; no schema claims "source of truth" while consumed by nothing; multi-field forms use RHF + zodResolver. — *`08` §7(10)*
- **DD-11** CS-3 no capability without a consumer: nothing is built ahead of demand. Forward-provisioning **only** with a ledger entry naming its intended consumer, activation step and review-by date. CS-1's three-use rule governs extraction. — *`08` §7(11)*
- **DD-12** CS-11 state ownership: stores hold data, contexts hold resources, realtime stays on `onSnapshot` hooks, auth is never persisted. — *`08` §7(12)*

**Recording — ADR-120** (`08` §7):

- **DD-13** Any staged change adds or updates its ledger row — intended end state, current stage, owner, review-by — **in the same change that lands it.** No `@deprecated` marker and no "reconcile later" comment may exist without a corresponding row. — *`08` §7(13)*
- **DD-14** Any gated task executed on its default **records that fact**: which question, which default, which alternate branch the answer would trigger, and the review-by date. — *`08` §7(14)*
- **DD-15** Verification provenance is recorded: which tier verified the change, and — until Q-1 answers — an explicit note where verification was **emulator-only**. **Emulator-green is never reported as production-verified.** — *`08` §7(15)*

**Sprint-level — the constraint every task inherits** (`08` §7):

- **DD-16** **The sprint ends deployable.** No half-migrated boundary, no partially-converged client, no broken gate. If the work cannot reach that state, it **reverts to the previous sprint's tagged commit rather than extending.** — *`08` §7(16)*
- **DD-17** Traceability holds: task → ADR → driving findings → corpus file. **No requirement-ID or recommendation-ID is ever cited.** — *`08` §7(17)*

**Added by `09` §1.4:**

- **DD-18** **Acceptance criteria are demonstrated, not asserted** — the evidence is in the PR: test output, lint failure-then-pass, a search result returning the stated count. — *`09` §1.4*
- **DD-19** The task's progress row carries a **PR link** and a **done-date**. — *`09` §1.4*

---

## 10. Prohibitions — 20 rules

*The explicit "never do this" list. Each is a violation on sight.*

| # | Never | Source | Why |
|---|---|---|---|
| **PROH-1** | **Never enable a lint rule before its migration lands.** Every rule flip sits at least one PR — usually one sprint — behind the migration it enforces. | `04` §1.2(3); `08` §4 X-10 note | "Never enable a rule that fails." An incomplete cleanup must delay the next sprint's flip, not block the current sprint's pre-commit gate. |
| **PROH-2** | **Never partially revert a convergence.** Revert the whole unit. | `10` §3.4; §2.2(6) | "Reverting T-106d after T-106b/c have migrated their call sites leaves call sites pointing at a client that no longer exists in the shape they expect." |
| **PROH-3** | **Never let a check go red-by-design without a recorded reason.** Ship it report-only instead, and record when it flips. | `10` §2.2(12) | "Shipping the check failing-by-design would be **the standards-decay pattern the whole decision set guards against**." |
| **PROH-4** | **Never end a sprint with a half-migrated boundary, a partially-converged client, a broken gate, or a rule left at `warn` that was scheduled to flip.** | `08` §7(16); `09` §6.2 (**red on any occurrence**) | Revert to the previous tagged commit rather than extend. |
| **PROH-5** | **Never invent a canonical URL or a hosting value.** | `01` §T-118d; `03` §3 S1 ("Do not invent a URL") | A guess would be embedded in sitemap, robots, OG images and user-visible share URLs. |
| **PROH-6** | **Never commit a real secret** — `.env.example` carries names, purposes and placeholder shapes only. | `01` §T-118c | "The one real risk is committing a real secret." |
| **PROH-7** | **Never report emulator-green as production-verified.** | `08` §7(15); `07-Risk` §X-8 | A green suite is "necessary and nowhere near sufficient" (`10` §4.4). |
| **PROH-8** | **Never carry two L tasks in one sprint.** | `03` §1.1 (stated as an invariant enforced throughout) | An L is 5–8 d but planned at 6 d; one L already consumes the reserve. |
| **PROH-9** | **Never mix a wide-surface refactor with unrelated risky work.** The wide-surface sprints carry one workstream and nothing else. | `03` §1.1 | Sprints below 8 days of load there are deliberate isolation slack, not under-planning. |
| **PROH-10** | **Never smuggle a logic edit into a mechanical rename.** Mechanical PRs must be *provably* mechanical. | `04` §1.2(4) | A reviewer verifies a rename by pattern, not by line — that only works if it is uniform. |
| **PROH-11** | **Never write `export *` in a root barrel.** | ADR-101's named trade-off via `08` §4 S2; CS-7 | It "degenerates into *everything is public*," which defeats the ADR. |
| **PROH-12** | **Never add a swallow site that discards an error without reporting first.** | CS-12(1); `08` §7(9) | The swallow controls user experience, not observability. |
| **PROH-13** | **Never render a fabricated value as measured data.** Fabricated-zero rendering is out of policy **now**, on both branches of Q-9. | P-9; `01-Architecture-Principles.md` §Precedence(6); `07-Open-Questions.md` §Q-9 | Honest UI is not gated — it is policy regardless of the answer. |
| **PROH-14** | **Never use raw hex outside the recharts carve-out, and never hardcode a user-facing string.** | CS-14; `08` §7(8) | en/ja message-key parity is exact; the tail must not regrow. |
| **PROH-15** | **Never merge a rules change on emulator-free reasoning.** | `08` §7(6) | Rules are the security-critical code with no other coverage. |
| **PROH-16** | **Never delete or collapse a surface whose gate default is *retain*.** | `09` §1.2 (inaction row); ADR-108 | ADR-108 names the outcome: it "would silently hide pre-migration notifications from users." |
| **PROH-17** | **Never merge a file over 400 lines.** | CS-2; `08` §7(7) | The tier is hard-blocking, not advisory. |
| **PROH-18** | **Never merge the two RBAC engines.** CS-8's rename is optional cosmetic; the load-bearing rule is AD-01 (no deep cross-feature import). | `04-Coding-Standards.md` §Conflicts ("Do not merge the engines (AD-15 keeps them separate)") | They serve genuinely different permission models — "differing constraints, not drift." |
| **PROH-19** | **Never build a capability ahead of its consumer without a ledger row.** | CS-3; `08` §7(11) | `Drawer` — zero render sites, canonical-looking — is the in-repo cautionary case. |
| **PROH-20** | **Never bypass the pre-commit gate** (`--no-verify`, or committing from a clone without hooks installed). | `08` §7 gate preamble ("the existing pre-commit hook enforces these; **not negotiable per-task**"); `04` §1.1 | See gap G-1: **CI does not enforce lint**, so this hook is the only lint enforcement that exists. Bypassing it is unrecoverable at review time. |

---

## 11. Coverage check — artifact obligations with no enforceable rule

Recorded rather than filled. Per the phase mandate, a missing rule is reported as a gap, not invented.

| # | Obligation the artifacts impose | Why no rule can enforce it | Best available substitute |
|---|---|---|---|
| **G-1** ✅ **CLOSED 2026-08-04** | **DD-1 "Lint passes."** | ~~CI's lint step runs with `continue-on-error: true`… The obligation therefore has no *mechanical* enforcement outside the local husky hook.~~ **No longer true.** Sprint 0 removed `continue-on-error` (`4fd206c`) under Go/No-Go **C-5**; `.github/workflows/ci.yml:41-53` runs lint as a blocking step, backed by a ratchet baseline (`LDG-16`). DD-1 now has real mechanical enforcement. | Superseded — CI enforces it. **PROH-20 still applies** (don't bypass the pre-commit hook), but its stated rationale ("the only lint enforcement that exists") is obsolete: CI is now the backstop. |
| **G-2** | **"Run regression after every completed task."** | No artifact states a per-**task** full-regression obligation. The artifacts state a per-PR named-tier rule (`08` §7(4)), a per-**sprint-boundary** emulator rule (`08` §7(5)), and a per-**wave-boundary** all-green rule (`09` §6.3). | **TO-7 [derived]**, written as the tightest reading consistent with all three. Labelled derived so no reader mistakes it for a quoted obligation. |
| **G-3** | **A PR must not merge against evidence that does not exist.** | `08` §1 rule 6 tests readiness at *sprint* granularity; `09` §6.3 detects a PR with **no named** tier. Neither catches a PR that **names a tier whose test has not been authored** — which is exactly the Sprint 1 defect recorded in `04-Sprint-1-Approval.md` F-2 (three documents name an E2E public/protected route pass that does not exist at HEAD and is created by T-107d in Sprint 11). | **TO-4 [derived]**. This is the one place where the contract adds a check the artifacts do not contain, because an artifact-level defect proves the hole is real. |
| **G-4** | **LT-2 "the owner is a person."** | `09` §5.3 requires a named person, and `01` §T-120a makes an owner-less row invalid — but **no artifact establishes who is assignable.** The plan's position appears once, hedged, inside a risk-likelihood paragraph: "the sole developer is *plausibly* also the product owner" (`07-Risk` §X-3). It is carried into no pre-flight item and no sprint item. If no person is assignable, T-120b cannot satisfy its acceptance criteria and LT-1 is unsatisfiable by construction. | None. Escalated as condition **C-3** in `04-Sprint-1-Approval.md`. This is a gap in the artifacts, not in the contract. |
| **G-5** | **Q-4's default and review-by.** | Every other gate inherits an owner-class, a default and a review-by from `architecture-decision/07-Open-Questions.md`. **Q-4 has no row there at all** — verified independently: Group A holds 12 rows, Group B holds 6 (Q-1, Q-6, Q-10, Q-9, NQ-1, Q-2), and Q-4 is in neither, nor in C/D/E, nor in the roll-up. So GD-3 and GD-6 have nothing to point at for Q-4. | **GD-4** plus `09` §5.2's compensating treatment (tracked as `Unassigned`, not `Not asked`). The register needs the corrective pass PF-3 describes; the contract cannot substitute for it. |
| **G-6** | **Two privacy risks and one top-10 debt carry no task.** | `00-INDEX.md` §Phase-7 review discloses this ("two top-corpus items intentionally carry no task"), and `07-Open-Questions.md` §Group A records NQ-7 (anonymous leaderboard readability, uid + displayName) and NQ-8 (world-readable card-image Storage) as "**No decision** … remains an open risk, not decided." A contract rule cannot enforce work that no task creates. | Recording only. Confirmed **recorded, not silently dropped** — which was the thing to verify. The enforceable residue is DO-9 (log the incoherence) and LT-1 (if a row is created, it must be complete). |
| **G-7** | **`10` §5.1: nothing can be deployed anywhere until hosting is decided.** | No implementer rule can discharge this; it is a decision outside the plan (T-118d is `[OPEN]` and explicitly not schedulable). Every "deployable" claim in the contract therefore means *merge-ready*, not *deployed*. | **PROH-5** (do not invent a URL) plus **DO-5** (record the decision as a new ADR when it comes). Flagged so DD-16's "the sprint ends deployable" is not misread as "the sprint ships to users." |

---

## Rule count by section

| Section | Rules |
|---|---:|
| 1. Scope discipline (SD) | 12 |
| 2. API & behavior preservation (BP) | 9 |
| 3. Architecture compliance (AC) | 16 |
| 4. Validation & error handling (VE) | 10 |
| 5. Testing obligations (TO) | 10 |
| 6. Gate discipline (GD) | 10 |
| 7. Ledger & tracking obligations (LT) | 11 |
| 8. Documentation obligations (DO) | 9 |
| 9. Definition of Done (DD) | 19 |
| 10. Prohibitions (PROH) | 20 |
| **Total** | **126** |

**Derived rules (2):** **TO-4** (no merge against non-existent evidence) and **TO-7** (regression cadence). Both are labelled `[derived]` at point of use, and their derivations are shown in §11 (G-2, G-3). **Every other one of the 126 rules restates an artifact obligation and cites the artifact that establishes it.** No rule in this contract is invented.
