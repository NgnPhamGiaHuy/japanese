# Refactoring Readiness Report

**Audit date:** 2026-08-04 · **Commit:** `f4dd766` · **Method:** code-first. Every `DONE` carries file-path or commit evidence; nothing is marked done on a document's say-so.

**Confidence:** `[HIGH]` verified in code this session · `[MED]` documents + partial code · `[LOW]` inferred.

---

## 1. Where are we now?

A **mature, structurally sound** Next.js 16 / React 19 / Firebase application that has completed a 63-task modernization program **and** a follow-on structural cleanup program. `[HIGH]`

The architecture is not aspirational — it is **lint-enforced**:

- 9 features, each with a curated root barrel; cross-feature deep imports are an ESLint **error**
- **Zero** external deep-imports into `features/flashcard/types` (was 43)
- `lib/` → `features/` from exactly one sanctioned file (`lib/providers.tsx`)
- `features/notifications/` imports **zero** other features — the dependency cycle is broken and lint-guarded
- **All 12** Firestore `onSnapshot(` call sites live in `services/`. No listener in any hook or component
- Auth is an httpOnly, server-verified session cookie; the edge gate is routing-UX only
- Five test suites + a vocabulary-agreement check, all blocking in CI

Current verified state (2026-08-04): **build clean · 375 unit · 84 browser · 133 emu (3 skipped) · lint 101 warnings / 0 errors · vocab check passing.**

The honest caveat, and it is significant: **nothing has been verified against production.** Q-1 (which Firebase project is production) and Q-2 (hosting target) are unanswered, so every "done" in this repo means *merge-visible*, not *user-visible*.

## 2. What has been completed?

**All 63 backlog tasks reached a terminal state except two, both deliberately.** `[HIGH]` 61 of 63 IDs appear in commit messages.

| Area | Delivered | Evidence |
|---|---|---|
| Boundaries | Barrels for all 9 features; 3 lint rules at `error`; cycle broken; log types relocated | `cbf210a` `91d1150` `7e16edc` `f46aebc` `aa53482` `e2492ae` |
| Testing | 5 suites from a near-zero base; SRS math, RBAC, data services, rules coverage | `51633d8` `4fd14cb` `fe05455` `895a00f` `a5ee2e4` |
| Security | httpOnly session, server verification, revoke; report-then-handle at 17 swallow sites | `48cf8cb` `91ffcd8` `924aa74` `43e94ae` |
| Data layer | Listener centralization; explicit query bounds; honest absent-data UI | `2a76799` `a177192` `7cf2468` `d74ebfa` `934d711` |
| Contracts | zod at write boundaries; RHF+zodResolver; one action client; predicate convergence | `e235d32` `086b83f` `93e0bf6`…`ed117f6` `185dc15` |
| Dead surfaces | 7 NotificationKinds, 8 ActivityActions, admin stubs, Storybook toolchain deleted | `01db60e` `52d2064` `772a7e1` `fdbe6db` |
| Structure | kana-survival relocated; flashcard sub-modules; one dialog pattern; one table engine | `49682b7` `a928ff1` `5a27845` `acb6549` |
| Ledger | Created, backfilled, maintained — 22 rows, 8 closed, 14 open, all four fields each | `f3951e8` `80aac83` `f7c6bfa` |
| Cleanup program | Dead code, 14 shared→feature moves, 3 route extractions, barrel trims, 2 a11y migrations | `c982a64`…`f4dd766` |

## 3. What is partially completed?

| Item | State | Why |
|---|---|---|
| **Notification migration (LDG-01)** | Dual read paths, dual indexes, 4 `@deprecated` fields, backfill script — **all still live** | Correctly gated on Q-5 + NQ-1. Narrowed 2026-08-04 (R-5): `deckId`/`deckTitle` had zero readers and are **no longer written** either — `notifyInvite` now writes only `link`. Legacy corpus frozen at its 2026-07-22 size |
| **Flashcard legacy compat (LDG-22)** | **Narrowed 2026-08-04**: lesson-level half (4 mechanisms) removed after empirical verification (0/9 lessons needed it); card-level half (2 mechanisms) confirmed still load-bearing — 192/817 cards missing `alternatives`, 621/817 on legacy numeric order | Needs a **cards-only** backfill decision now — the lesson half is resolved |
| **Observability (LDG-13)** | Wiring present and credential-gated; not activated | T-116b/c **passed** by recording the deferral — this is complete-as-deferred, not unfinished |
| **Admin predicates (LDG-14)** | 3 divergent predicates documented, untouched | Inaction fallback, gated Q-10 |
| **200-line ceiling** | `warn`, 52 violators | **Deliberate deferral** (TD-3), not an oversight |

## 4. What is still pending?

**Nothing in the original 63-task plan is pending-and-startable.** What remains is: 2 blocked tasks, 4 inaction-gated tasks, 5 owner decisions, and the new findings below (§9).

## 5. What plans are obsolete?

| Document | Verdict | Action |
|---|---|---|
| `implementation-planning/09-Progress-Tracking.md` | **Obsolete** — roll-up reads `Done: 0` for 63 complete tasks | Banner as superseded; point at the ledger |
| `implementation-planning/03-Sprint-Plan.md`, `06-Critical-Path.md`, `10-Release-Plan.md` | **Obsolete as schedules** (29-sprint plan, executed differently) | Mark historical |
| `execution-readiness/04-Sprint-1-Approval.md`, `07-Go-NoGo-Decision.md` | **Historical** — their gate has passed | Mark historical; **C-4 closed 2026-08-04 (R-9); C-7 remains genuinely open** and should be lifted out before archiving |
| `.rules/.cursor/web-app-optimization-*` (SvelteKit, 14 files) | **Obsolete** — wrong framework | Delete or quarantine |
| `.rules/.cursor/react-styled-components-*` (10 files) | **Obsolete** — repo is Tailwind | Delete or quarantine |
| `.rules/skills/claude.ai/vercel-deploy-claimable/` | **Misfiled** — a deploy tool in a rules directory; its script uploads a project tarball to a third party | Move out of `.rules/` |

## 6. What plans are stale?

| Document | Problem | Evidence | Action |
|---|---|---|---|
| All 4 planning directories | **File paths stale** after the cleanup program | One stale path broke CI (`check:vocab`) | Treat paths as historical; don't navigate by them |
| `architecture-decision/03-*.md` master table | ~~ADR-101 row omits **Amendment 1**~~ | `:16` vs `:63-86` | **Done 2026-08-04 (R-6)** |
| `execution-readiness/*` | Written against a **555-line** ADR file; it is now **579** | Cited line `:451` now at `:475` | Note the offset |
| `07-Risk-and-Mitigation.md`, `08-Implementation-Readiness.md` | Claim **"no CI/CD pipeline"** | 5 jobs run on every PR; lint blocking | Correct — factually wrong |
| `07-Open-Questions.md` | Q-4 has **no row**; counts stated as 26/25/32/18 | Adjudicated at 33 | Add Q-4's row (PF-3) |
| `eslint.config.mjs:58-60` | Says **47** files over 200 lines; now **53** | Measured this session | Re-measure at `4fd206c`, update comment |
| `.claude/skills/design-system/references/tokens.md:105` | Says "Framer Motion" | Package is `motion` v12 | Rename |

## 7. What decisions are still valid?

**All 20 ADRs (101–120) remain Accepted; none is superseded.** `[HIGH]` The three `docs/adr/00X` records also remain in force. Still-binding decisions most likely to be accidentally violated:

- Barrels are the public API — **and a vendored rule in `.rules/` says the opposite**
- Listeners live in services, always
- The two RBAC engines stay two
- `game/` stays a feature, not `shared/`
- Two pagination mechanisms; a third needs a review gate
- Every staged change gets a ledger row **in the same commit**

## 8. What technical debt remains?

Ranked by risk × ownability:

1. **NQ-7 / NQ-8** — world-readable leaderboard PII and card-image Storage. No task, no owner, survives the program by design. **Highest unowned risk.**
2. **Vocabulary-checker fragility** — 12 hardcoded paths, no test that they resolve, blocking in CI. Broke once already.
3. **APP_ID split-brain (D-3)** — correctly blocked, but the hazard is live until Q-6 answers.
4. **Flashcard compat cluster (LDG-22)** — 6 mechanisms awaiting a backfill decision.
5. **52 files over 200 lines** — deliberate deferral; revisit only as a decision.
6. **102 lint warnings** — behind a shrink-only ratchet; low risk.
7. **Doc/code drift** — this document set is the first repair.

## 9. What should we refactor next?

**Prioritized backlog — only work that is still relevant.** Every row traces to a verified code problem, not to a plan's age.

| P | ID | Task | Problem | Location | Goal | Deps | Risk | Cx | Status |
|---|---|---|---|---|---|---|---|---|---|
| **1** | R-1 | Make the vocabulary checker move-proof | 12 hardcoded paths, no resolution test; **broke blocking CI** when PR7 moved one file | `src/scripts/check-vocabulary-agreement.mjs` | Fail loudly at config-parse time with a clear message; add a test asserting every configured path exists | none | Low | **S** | **Done 2026-08-04** — `validateConfiguredPaths()` fails loudly pre-comparison; `collectConfiguredPaths()` + a disk-resolution test added (376 unit tests now); verified by injecting a broken path and confirming both the script and the test catch it with a named-file message, then reverting. Build/lint/typecheck/vocab/unit all green; uncommitted |
| **1** | R-2 | Get NQ-7 / NQ-8 owned | Live PII/asset exposure; no task, no owner, no forcing function | `firestore.rules`, Storage rules | An owner decision + a ledger row either way | owner | — | **S** (decision) | Ready |
| **2** | R-3 | Reconcile the planning corpus | `09-Progress-Tracking` says `Done: 0` for 63 done tasks; paths stale everywhere | `implementation-planning/`, `execution-readiness/` | Banner superseded docs; lift C-4/C-7 out before archiving | this audit | Low | **M** | Ready |
| **2** | R-4 | Quarantine inapplicable rules | ~24 of ~95 rule files target SvelteKit/styled-components; one bans the barrels this repo enforces | `.rules/` | Delete or move to `.rules/_vendored-inactive/`; add a `CLAUDE.md` stating authority order | none | Low | **S** | Ready |
| **3** | R-5 | Stop writing dead legacy fields | `notification-pending.ts:118-119` still writes `deckId`/`deckTitle`, which now have **zero readers** | `features/notifications/services/notification-pending.ts` | Stop the writes; freezes the legacy corpus while Q-5 stays open | none — **safe independently of the gate** | Low | **S** | **Done 2026-08-04** — 2 fields removed from the write payload; build/lint/unit(374)/emu(133) all green; uncommitted |
| **3** | R-6 | Fix the ADR-101 Amendment 1 record | Master table omits it; all execution-readiness reviews predate it | `architecture-decision/03-*.md:16` | Mark the row; note the T-102→T-101b constraint | none | None | **S** | **Done 2026-08-04** — master table row now reads "(+ Amendment 1)" |
| **4** | R-7 | Re-measure the 200-line baseline | Config says 47; actual is 53; I could not measure the historical value reliably | `src/eslint.config.mjs:58-60` | Correct the comment, or split the 6 newest violators | none | Low | **S** | Needs validation |
| **4** | R-8 | Adjudicate C-7 (ADR-106/115 vocabulary) | Neither ADR names the other; `permission` labels are ad-hoc and "not consumed for authorization" | `lib/safe-action.ts`, all `actions/` | Decide: enforce the vocabulary, or document the label as descriptive-only | owner | Med | **M** | Blocked on decision |
| **5** | R-9 | Correct C-4 (T-117d dependency record) | Two docs call it droppable float; 7 tasks name it a prerequisite | `05-Dependency-Map.md` | Correct the record | none | None | **S** | **Done 2026-08-04** — 5 sites corrected across `05-Dependency-Map.md` + `06-Critical-Path.md`; `08-Sprint-0-Completion.md`'s C-4 tracking row closed |

### Surfaced by the 2026-08-04 documentation audit — previously tracked nowhere

| P | ID | Task | Problem | Location | Deps | Risk | Cx | Status |
|---|---|---|---|---|---|---|---|---|
| **3** | R-10 | Decide the `max-lines: 400` hard-error flip | Three documents (`02-Execution-Waves.md` exit criterion 12, `08-Implementation-Readiness.md:188`, `03-Sprint-Plan.md:730`) require flipping `max-lines` to `error` at 400 once `ShareModal.tsx` fell under it. **`ShareModal.tsx` is now 239 lines — the precondition is met — but the rule was never flipped.** Still `["warn", { max: 200 }]` | `src/eslint.config.mjs:64` | none | Low | **S** | Open — distinct from TD-3's deliberate 200-line deferral |
| **3** | R-11 | Build the public/protected route matrix E2E, or retire the claim | `04-PR-Plan.md:93` and `08-Implementation-Readiness.md:156` name a route-matrix E2E pass as T-107d's deliverable and as Sprint 1's acceptance evidence. T-107d shipped (`957113c`) but **fixed the sign-in helper instead** — the matrix was never built. `src/e2e/` holds 3 tests total (`auth.spec.ts` ×2, `realtime.spec.ts` ×1) | `src/e2e/` | none | Low | **M** | Open — a real coverage gap, not a doc error |
| **4** | R-12 | Run the three in-repo-answerable audits | NQ-11 (which multi-doc writes carry read-modify-write invariants), NQ-12 (does every path reach the two `dangerouslySetInnerHTML` sinks pre-sanitized — **a security question**), NQ-13 (page-level a11y). The corpus itself marks all three as needing **no production access**; none was ever executed | repo-wide | none | Med (NQ-12) | **M** | Open — cheapest unclaimed risk reduction in the corpus |

**Explicitly NOT in this backlog:** anything in `DO_NOT_REPEAT.md`; the 4 inaction-gated tasks; T-118b; T-118d.

**Closed by this audit:** **OP-5** — the `isOwner` semantic divergence that `architecture-assessment/10-Decision-Readiness.md` called "the closest thing in the corpus to a discovered live bug" is **fixed**. `shared.service.ts:14,181` now imports and calls `resolveRole()`; its own comment at `:174-175` records the removal of the hand-rolled `roles[uid] === "owner"` duplicate.

## 10. What should we NOT touch yet?

| Area | Why |
|---|---|
| **APP_ID unification** (T-118b) | Is a tenant repartition if production values differ. Silent, non-revertible |
| **Notification dual read path** (T-108d) | Collapsing it would silently hide pre-migration notifications from real users |
| **The 4 `@deprecated` notification fields** (T-108c) | Legacy data presence unknown (Q-5) |
| **Admin authority predicates** (T-115c) | Aligning to the wrong source locks out or over-grants admins |
| **Any fallback** | 28 audited, **zero** obsolete |
| **`toActionResult`** | Load-bearing for 19 admin actions (LDG-21) |
| **Firestore listeners outside services** | Would break the codebase's strongest invariant |

## 11. Recommended execution order

**Wave 0 — Memory alignment (now).** *Goal:* stop the docs contradicting the code.
Tasks: R-3, R-4, R-6, R-9 + this document set. *Entry:* none. *Exit:* no document claims 63 tasks are undone; `.rules/` has a stated authority order. *Risk:* none — documentation only.

**Wave 1 — Close the self-inflicted gaps.** *Goal:* the tooling that guards the codebase can't silently break.
Tasks: R-1, R-5. *Entry:* Wave 0. *Exit:* `check:vocab` fails loudly on a bad path and has a test; no new legacy-field writes. *Validation:* all six gates. *Risk:* low.

**Wave 2 — Owner decisions (parallel, no code).** *Goal:* unblock what only a human can unblock.
Tasks: R-2 (NQ-7/NQ-8), R-8 (C-7), and the standing gates **Q-1 → Q-6 → Q-2**. *Entry:* none — start immediately, these have the longest latency. *Exit:* each has a decision and a ledger row.

**Wave 3 — Gate-released work (only if Wave 2 answers).** *Goal:* close the migrations.
Tasks: T-118b (only with Q-6 + a backup), T-108b/c/d (only with Q-5/NQ-1), T-115c (only with Q-10). *Entry:* the specific gate answered **and** a Firestore export taken. *Risk:* **highest in the program** — irreversible data operations.

**Wave 4 — Optional cleanup.** R-7, plus the 5 remaining product decisions (coverage devDep, action-registry quartet, `UserAvatar` location, route-registry, `makeCard`). *Risk:* none-to-low.

> **Q-1 is the highest-leverage single answer in the entire corpus.** It gates production verification of six ADRs and safe execution of T-118b. Ask it first.

## 12. What must future AI agents know?

1. **Start at `project-memory/CURRENT_PROJECT_MEMORY.md`, then `DO_NOT_REPEAT.md`.** Not the planning corpus.
2. **`docs/migrations-ledger.md` is the live state of record.** The planning documents froze before execution finished; the ledger did not.
3. **`09-Progress-Tracking.md` says `Done: 0`. It is wrong — ~61 of 63 tasks are complete.**
4. **Most obvious improvements are done, and some were done then deliberately reverted** (barrels, twice). Check before proposing.
5. **Run `npm run check:vocab`** — it is CI-blocking and easy to forget. **If you move a file, check its 12 hardcoded paths.**
6. **Never open a Firestore listener outside `services/`.**
7. **If you land staged work, add or move its ledger row in the same commit.**
8. **Don't trust `.rules/` wholesale** — no authority order, no `CLAUDE.md`, ~a quarter targets other frameworks, and one vendored rule contradicts the repo's enforced barrel policy.
9. **"Done" here means merge-visible, not user-visible.** Nothing is production-verified.
10. **The critical path terminates in a gated task (T-108d/Q-5).** The program cannot complete on in-repo work alone — by design, not by failure.
