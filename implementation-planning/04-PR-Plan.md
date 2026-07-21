# 04 — PR Plan

**Implementation Planning phase.** Every task from the fixed task set — **63 tasks, not the 50 the kernel's heading states** (see `01-Validated-Backlog.md` §5.1) — grouped into pull requests inside its sprint from `03-Sprint-Plan.md`. **93 PRs across 29 sprints.**

Task IDs, sizes, gates and acceptance criteria follow `01-Validated-Backlog.md`, which is authoritative for the elaborated task list. Where the backlog assigns a cross-cutting rider to a specific task (the `ShareModal` split → T-115a; the raw-hex tail → T-110a + T-111a; the `toActionResult` shim → T-106d; the stale lint-config count → T-101c), the PR below that carries it says so.

This is **derived-from-decisions planning**, not backlog validation: `engineering-tasks/` and `requirements-consolidation/` do not exist (deleted before the discovery phase, unrecoverable). Scope descriptions below come from the ADR and corpus text — **no repository rescan was performed**, and no requirement-ID or recommendation-ID is cited because those documents are absent.

---

## 1. How to read this

Each PR carries nine fields:

- **PR ID** — `PR-<sprint>.<n>`, numbered in intended merge order within the sprint.
- **Title** — imperative, the commit-subject the PR should land with.
- **Tasks** — the fixed task IDs it delivers (a task may span several PRs; a PR never spans sprints).
- **Concern** — the *one* thing it changes. If a PR needs two sentences here, it is two PRs.
- **Scope** — areas touched, from the ADR/corpus descriptions.
- **Reviewable** — why one person can hold it in their head in one sitting.
- **Reverts** — how it comes out cleanly if it goes wrong.
- **Tests** — which of the five suites must pass for this PR specifically.
- **After** — the PRs it depends on.

### 1.1 The five test tiers

From the affirmed five-suite topology (ADR-117, S-10/S-11; CI keeps job-for-job parity with the local suites):

| Tier | What it is | What only it proves |
|---|---|---|
| **unit** | node, `*.test.ts` | pure domain logic, schema behavior |
| **browser** | Vitest Browser Mode, `*.browser.test.ts` | keyboard/focus/a11y contracts in a real DOM |
| **emulator** | app emulator + rules, `*.emu.test.ts` | Firestore rules against the real rules engine; real read/write semantics |
| **functions** | functions emulator | Cloud Function behavior, idempotent delivery |
| **E2E** | Playwright against emulator + dedicated server | realtime flows end to end in a real browser |

Tiers listed per PR are the ones whose result is **load-bearing** for that change. The **pre-commit gate — lint + format + full build — runs on every PR without exception** and is not repeated below.

### 1.2 PR sizing guidance

1. **One concern per PR.** The concern is stated in one sentence with no "and". A PR that both moves code and changes what the code does is two PRs.
2. **Split boundary enforcement from behavior.** A lint rule, a barrel, an import-path migration, and a permission-metadata declaration are boundary changes. A different value reaching the user is a behavioral change. They never share a PR — a reviewer checking a rule and a reviewer checking a behavior are reading for different things.
3. **Lint-enabling PRs land after their migration PRs.** Never enable a rule that fails. Every rule flip in this plan (PR-4.1, PR-4.2, PR-5.1, PR-28.1, PR-28.2) sits at least one PR — usually one sprint — behind the migration it enforces.
4. **Target one reviewing sitting.** As a working ceiling: ~400 changed lines of hand-written logic, or a few thousand lines of mechanical rename that a reviewer verifies by pattern rather than by line. Mechanical PRs must be *provably* mechanical: no logic edits smuggled into a rename.
5. **Every PR is independently testable.** If a PR can only be verified once a later PR lands, it is not a PR — it is half of one. The exception is deliberately staged intermediate state (dual-credential auth, dual action clients), which is testable *as an intermediate state* because both paths are live.
6. **Additive first, removal last.** Introduce the new path, migrate consumers, remove the old path — three PRs. The removal PR is the one that reverts under pressure, and it is always small.
7. **Test-only PRs stay test-only.** A PR that adds coverage never changes production code. If writing the test reveals a bug, the fix is a separate PR — otherwise the test cannot be trusted as evidence.

---

## 2. Wave 1 — Platform Foundations

### Sprint 1 — Ledger live, allowlist divergence closed

**PR-1.1 — Add the staged-change ledger** · `T-120a`
- **Concern:** give staged work a written home with required fields (intended end state / current stage / owner / review-by).
- **Scope:** one new ledger document under `docs/`; a pointer from the docs index. No `src/`.
- **Reviewable:** a single new document defining a schema; no code paths.
- **Reverts:** delete the file.
- **Tests:** gate only.
- **After:** —

**PR-1.2 — Backfill ledger rows for all in-flight staged work** · `T-120b`
- **Concern:** record the completion state of every migration and gated disposition already in flight.
- **Scope:** the ledger document only — the notification migration (ADR-108), the per-schema dispositions (ADR-109), the Drawer branch (ADR-110), the analytics disposition (ADR-114), Open hosting (ADR-118), and the five delete-unless-claimed gates (ADR-119); plus Q-1 and Q-2 as rows.
- **Reviewable:** one file, one row per known staged item, each traceable to its ADR.
- **Reverts:** revert the document.
- **Tests:** gate only.
- **After:** PR-1.1

**PR-1.3 — List every on-disk ADR in the docs index** · `T-120c`
- **Concern:** the docs index omits `003-feature-flags`; make the index complete and record the ADR process note.
- **Scope:** the docs index file plus a short process note.
- **Reviewable:** a few lines.
- **Reverts:** revert the file.
- **Tests:** gate only.
- **After:** —

**PR-1.4 — Introduce one public-path allowlist module and route the proxy through it** · `T-118a` (part 1 of 2)
- **Concern:** create the single source for public paths and make the edge proxy consume it — **behavior-neutral**, the proxy's admitted set is unchanged.
- **Scope:** new allowlist module; `proxy.ts` switches from its inline list to the module.
- **Reviewable:** the diff is a list moving into a module; a reviewer diffs the two sets for equality.
- **Reverts:** revert; the inline list returns.
- **Tests:** **unit** — assert the module's exported set is *equal* to the proxy's previous inline set (the behavior-neutrality claim, machine-checked); **E2E** `e2e/auth.spec.ts` (2 tests, exists at `a0bbbc4`) as the unchanged redirect baseline.
- **After:** —

**PR-1.5 — Make AuthGate consume the shared allowlist** · `T-118a` (part 2 of 2)
- **Concern:** close the divergence — this is the **behavioral** half, and the admitted set for signed-out users changes.
- **Scope:** the AuthGate regex inside the composition root; the allowlist module if a derived view is needed.
- **Reviewable:** one consumer switched, with the before/after admitted set stated explicitly in the PR body.
- **Reverts:** revert; AuthGate returns to its narrower regex (the known-current behavior).
- **Tests:** **unit** — assert the canonical public set and that AuthGate's admitted set is derived from it, not restated (the single-source claim); **E2E** `e2e/auth.spec.ts` — "unauthenticated visitor is redirected to `/login`" and "signs in and reaches a protected route", which exercise the exact boundary this PR moves; **browser** for the splash path.
- **Evidence note (Sprint 0, S0-6).** Earlier drafts named an *"E2E public/protected route matrix"* as the gate. **That suite does not exist at `a0bbbc4`** — only `auth.spec.ts` and `realtime.spec.ts` do (3 tests total), and the route matrix is built by **T-107d in Sprint 11**, which is itself downstream of this task. The matrix is **not** pulled forward. The unit tier is the correct one for an allowlist, which is pure data: it proves set equality and single-sourcing directly, where an E2E can only sample routes. `auth.spec.ts` supplies the end-to-end regression proof for the boundary itself. Recorded in `execution-readiness/08-Sprint-0-Completion.md` §3.
- **After:** PR-1.4

### Sprint 2 — Config single-sourced, public APIs published

**PR-2.1 — Derive APP_ID from one shared source in app and functions** · `T-118b` · 🔒 **BLOCKED — DO NOT OPEN**
> Held out of Sprint 2 at Sprint 0 (`07-Go-NoGo-Decision` **C-3**). This PR performs a **non-reverting tenant repartition** if the two production env vars disagree, and the fact that would settle it (Q-6 → Q-1 → hosting) is not obtainable within the plan. The line below — *"the PR body states which env var wins"* — is precisely the decision nobody can currently make. Sprint 2 runs at 5 task-days without it. See `01-Validated-Backlog` §T-118b.
- **Concern:** app and functions can no longer resolve different tenant roots from two env vars.
- **Scope:** the shared derivation module; app consumers; `functions/` consumers and their env wiring.
- **Reviewable:** one derivation, two consumers; the PR body states which env var wins and why.
- **Reverts:** revert both consumers together (they must never be split across revert boundaries).
- **Tests:** unit (derivation); functions (the emulator run proves the functions package resolves the same root).
- **After:** —

**PR-2.2 — Document every referenced env var in `.env.example`** · `T-118c`
- **Concern:** a new environment is stand-up-able without grepping source.
- **Scope:** new `.env.example`; a README pointer.
- **Reviewable:** a flat list checked against the ~30 referenced vars.
- **Reverts:** delete the file.
- **Tests:** gate only.
- **After:** PR-2.1 (so `APP_ID` is documented in its final form)

**PR-2.3 — Publish root barrels for all nine features** · `T-101a`
- **Concern:** each feature declares a public API surface — **additive only**, deep imports still resolve.
- **Scope:** nine `features/*/index.ts`; each a curated export list, not `export *`.
- **Reviewable:** nine small files; the review question per file is "is this the contract?", which is the point.
- **Reverts:** delete the barrels; nothing consumes them yet.
- **Tests:** gate only (build proves the exports resolve).
- **After:** —

**PR-2.4 — Move the log vocabulary into `lib/logging` and consume it from admin** · `T-103a`
- **Concern:** remove the `lib → features` back-edge by relocating the types to the layer that owns the pipeline.
- **Scope:** `lib/logging` (types + the zod `logSourceSchema` merged into one declaration); `features/admin/types`; admin log service, actions and reports components update their import paths.
- **Reviewable:** one relocation plus a mechanical import rename wave; no logic changes.
- **Reverts:** revert; the type-only back-edge returns.
- **Tests:** unit (log normalization, including the unknown-source → `"server"` path).
- **After:** —

### Sprint 3 — Deep imports migrated (WIDE SURFACE)

**PR-3.1 — Route `flashcard/types` imports through the flashcard root barrel** · `T-101b` (1 of 3)
- **Concern:** the largest deep-import cluster (43 sites) moves onto the public API.
- **Scope:** import statements across every consuming feature; the flashcard barrel gains any missing export.
- **Reviewable:** provably mechanical — one import-path pattern, verifiable by grep; any barrel addition is a reviewed public-API decision called out in the PR body.
- **Reverts:** single revert restores the deep paths.
- **Tests:** gate (full build is the real proof); unit as regression.
- **After:** PR-2.3

**PR-3.2 — Route the remaining flashcard deep imports through the barrel** · `T-101b` (2 of 3)
- **Concern:** `games/match/config` (9 sites), `ShareModal` (4), `flashcard/utils/rbac` (4) move onto the public API.
- **Scope:** import statements in the consuming features; barrel additions as needed.
- **Reviewable:** three small named clusters.
- **Reverts:** single revert.
- **Tests:** gate; unit; browser for the `ShareModal` render path.
- **After:** PR-3.1

**PR-3.3 — Route remaining cross-feature and orchestrator imports through root barrels** · `T-101b` (3 of 3)
- **Concern:** everything not covered by the two named clusters, including `app/` orchestrators importing feature roots.
- **Scope:** residual import sites across `app/` and `features/`.
- **Reviewable:** the tail; the PR body carries the grep that returns zero afterwards.
- **Reverts:** single revert.
- **Tests:** gate; E2E smoke across principal routes.
- **After:** PR-3.2

### Sprint 4 — Boundaries enforced, cycle broken

**PR-4.1 — Enable the import-boundary rule as an error** · `T-101c` (+ backlog M-7 rider)
- **Concern:** deep cross-feature imports fail lint at the keyboard, with a message naming the ADR.
- **Scope:** `eslint.config.mjs` only; the exception list contains exactly the sanctioned edges (the composition root, `app/` orchestrators importing feature roots). **Rider:** correct the stale standards count in the same file (the config claims "~46 pre-existing files"; the true count is 44) — a one-line fix in a file this PR already edits.
- **Reviewable:** one config block; the rule either passes on `main` or the PR is not ready.
- **Reverts:** revert the rule; no code depends on it.
- **Tests:** gate (lint is the test).
- **After:** PR-3.3 — **migration first, rule second.**

**PR-4.2 — Forbid `lib → features` in lint, allowlisting the composition root** · `T-103b`
- **Concern:** the one sanctioned upward edge is declared; every other is an error.
- **Scope:** `eslint.config.mjs`.
- **Reviewable:** one rule, one named exception file.
- **Reverts:** revert the rule.
- **Tests:** gate.
- **After:** PR-2.4, PR-4.1

**PR-4.3 — Add the notification action-registry seam** · `T-102a`
- **Concern:** notifications gains a render/act-side inversion point — a kind→handler registry in its public API — **additive**, nothing consumes it yet in this PR.
- **Scope:** `features/notifications` public API and registry; the composition root gains the registration wiring; the no-handler-registered path renders degraded **and reports** (per ADR-116).
- **Reviewable:** one seam with a small surface; the missing-handler failure mode is explicit in the diff.
- **Reverts:** revert; nothing else references it.
- **Tests:** unit (registry resolution, including the missing-handler path).
- **After:** —

**PR-4.4 — Rewire InviteActions onto the seam and drop the back-edge** · `T-102b`
- **Concern:** break the cycle — flashcard registers its invite handlers; notifications imports no feature.
- **Scope:** `features/notifications/components/InviteActions`; flashcard's access actions registered at composition time.
- **Reviewable:** one component switched from a direct import to a seam lookup, plus one registration.
- **Reverts:** revert; the direct import returns (a known-good state).
- **Tests:** E2E (invite accept/decline end to end on the realtime path); unit (registration).
- **After:** PR-4.3

---

## 3. Wave 2 — Safety Net

### Sprint 5 — Cycle rule enforced, pure units tested

**PR-5.1 — Forbid `notifications → features` imports in lint** · `T-102c`
- **Concern:** the cycle cannot re-form.
- **Scope:** `eslint.config.mjs`.
- **Reviewable:** one rule.
- **Reverts:** revert the rule.
- **Tests:** gate.
- **After:** PR-4.4 — **the rule turns on one sprint after the migration it enforces.**

**PR-5.2 — Unit-test the SRS scheduling math** · `T-117a`
- **Concern:** the highest-consequence untested pure logic gets direct tests.
- **Scope:** new unit tests against `domain/srs` / `progress.service`'s scheduling logic. **No production code changes.**
- **Reviewable:** test file(s) only; each case names the scheduling property it pins.
- **Reverts:** delete the tests.
- **Tests:** unit.
- **After:** —

**PR-5.3 — Unit-test the sharing-RBAC `resolveRole` engine** · `T-117b`
- **Concern:** the security-relevant role resolver gets direct tests before Sprint 18 consolidates onto it.
- **Scope:** new unit tests. **Tests encode the engine's `ownerId ?? userId` semantics**, not the divergent `roles[uid]` reading that PR-18.1 corrects — stated in the PR body so a reviewer checks it deliberately.
- **Reviewable:** one pure function, a role matrix of cases.
- **Reverts:** delete the tests.
- **Tests:** unit.
- **After:** —

### Sprint 6 — Flashcard data services covered

**PR-6.1 — Test the diff-based lesson-save batch writer** · `T-117c` (1 of 3)
- **Concern:** pin what a save adds, updates and deletes.
- **Scope:** emulator-tier tests around `lesson-save`; fixtures for realistic before/after deck states.
- **Reviewable:** one writer, a table of diff scenarios.
- **Reverts:** delete the tests.
- **Tests:** emulator.
- **After:** —

**PR-6.2 — Test the card and comment services** · `T-117c` (2 of 3)
- **Concern:** cover the card/comment write and read paths.
- **Scope:** emulator-tier tests; shared fixtures from PR-6.1.
- **Reviewable:** two services, grouped by operation.
- **Reverts:** delete the tests.
- **Tests:** emulator.
- **After:** PR-6.1

**PR-6.3 — Test the shared-deck service paths** · `T-117c` (3 of 3)
- **Concern:** cover `shared.service` read/write behavior — the same file whose `isOwner` PR-18.1 corrects, so the characterization must be explicit about which behavior it is pinning.
- **Scope:** emulator-tier tests; the PR body records that the current `isOwner` divergence is **documented, not endorsed**.
- **Reviewable:** one service, access-shaped cases.
- **Reverts:** delete the tests.
- **Tests:** emulator.
- **After:** PR-6.2

### Sprint 7 — Rules-suite coverage

**PR-7.1 — Add rules tests for lessons, cards and comments** · `T-117d` (1 of 3)
- **Concern:** the deck content collections are proven against the real rules engine.
- **Scope:** rules-suite tests; multi-principal fixtures (owner / collaborator / stranger).
- **Reviewable:** one collection group, allow/deny per principal.
- **Reverts:** delete the tests.
- **Tests:** emulator (rules).
- **After:** —

**PR-7.2 — Add rules tests for `admins` and `system_logs`** · `T-117d` (2 of 3)
- **Concern:** the admin authority and audit collections are proven before Sprints 16 and 21 change them.
- **Scope:** rules-suite tests.
- **Reviewable:** two collections, small rule blocks.
- **Reverts:** delete the tests.
- **Tests:** emulator (rules).
- **After:** PR-7.1

**PR-7.3 — Add rules tests for `sharedProgress` and the collection-group read** · `T-117d` (3 of 3)
- **Concern:** the last uncovered rule blocks, including the collection-group read that Sprint 13 will bound.
- **Scope:** rules-suite tests. The PR body records **NQ-7** (world-readable leaderboard) and **NQ-8** (world-readable card-image Storage) as *asserted-as-current, not ratified* — with matching ledger rows.
- **Reviewable:** two rule blocks plus two explicit open-question notes.
- **Reverts:** delete the tests.
- **Tests:** emulator (rules).
- **After:** PR-7.2

### Sprint 8 — Zero-coverage features get a floor

**PR-8.1 — Add domain unit coverage for `ai` and `command-palette`** · `T-117e` (1 of 3)
- **Concern:** two of the four zero-coverage features gain a domain-logic floor.
- **Scope:** new unit tests only.
- **Reviewable:** small, per-feature.
- **Reverts:** delete the tests.
- **Tests:** unit.
- **After:** —

**PR-8.2 — Add unit coverage for the game session/scoring/tier engine** · `T-117e` (2 of 3)
- **Concern:** the engine shared by both flashcard game modes and kana is covered before Wave 6 moves code around it.
- **Scope:** new unit tests only.
- **Reviewable:** one engine, scoring and tier cases.
- **Reverts:** delete the tests.
- **Tests:** unit.
- **After:** —

**PR-8.3 — Add domain unit coverage for `home`** · `T-117e` (3 of 3)
- **Concern:** the last zero-coverage feature gains a floor.
- **Scope:** new unit tests only; the PR body states what counts as `home`'s domain logic, since the floor is interpretive by design.
- **Reviewable:** small.
- **Reverts:** delete the tests.
- **Tests:** unit.
- **After:** —

### Sprint 9 — Report-then-handle, observability activation

**PR-9.1 — Report before swallowing on SRS and progress writes** · `T-116a` (1 of 3)
- **Concern:** failures of SRS counters and progress writes leave a trace; the fire-and-forget UX contract is unchanged.
- **Scope:** the swallow sites on progress/SRS write paths; the logging pipeline call. Sampling for hot paths is decided here and stated in the PR body.
- **Reviewable:** a handful of catch blocks, one added call each.
- **Reverts:** revert; swallows return.
- **Tests:** unit (report is invoked and the handler still fails open).
- **After:** —

**PR-9.2 — Report before swallowing on Storage cleanup and invite delivery** · `T-116a` (2 of 3)
- **Concern:** orphaned Storage objects and lost invite notifications stop accruing undetectably.
- **Scope:** image-cleanup and invite-emit swallow sites.
- **Reviewable:** two named subsystems.
- **Reverts:** revert.
- **Tests:** unit; emulator where the write path is exercised.
- **After:** PR-9.1

**PR-9.3 — Report before swallowing on the remaining real-state sites** · `T-116a` (3 of 3)
- **Concern:** the tail — login logging and remaining bare catches on state-mutating writes.
- **Scope:** remaining swallow sites; the PR body carries the count going to zero.
- **Reviewable:** the tail, uniform in shape after PR-9.1 set the pattern.
- **Reverts:** revert.
- **Tests:** unit.
- **After:** PR-9.2

**PR-9.4 — Activate Sentry** · `T-116b` `[GATED Q-4]`
- **Concern:** production errors reach a place a human looks.
- **Scope:** Sentry init/config and the `/ingest` proxy path; no product code.
- **Reviewable:** configuration only.
- **Reverts:** revert the config; reporting returns to a no-op.
- **Tests:** gate; E2E smoke that the proxy path does not break routing.
- **After:** PR-9.3. **If Q-4 is unanswered:** this PR is replaced by a ledger-row PR recording the deferral and its reason — which satisfies ADR-116's success criterion.

**PR-9.5 — Activate PostHog** · `T-116c` `[GATED Q-4]`
- **Concern:** the analytics surface is either live at a decided scope or explicitly deferred.
- **Scope:** PostHog init/config; the decided event scope.
- **Reviewable:** configuration only.
- **Reverts:** revert the config.
- **Tests:** gate.
- **After:** PR-9.4. **Same fallback as PR-9.4.**

---

## 4. Wave 3 — Security & Data Layer

### Sprint 10 — httpOnly session credential (dual-credential intermediate state)

**PR-10.1 — Add server-side session-credential minting** · `T-107a` (1 of 3)
- **Concern:** the server can mint an httpOnly session credential from a verified ID token.
- **Scope:** the mint action/endpoint; server auth utilities. Not yet set on sign-in.
- **Reviewable:** one server path, one credential shape.
- **Reverts:** revert; nothing consumes it.
- **Tests:** unit (mint); functions/emulator where verification runs server-side.
- **After:** —

**PR-10.2 — Verify the session credential server-side** · `T-107a` (2 of 3)
- **Concern:** server identity derivation accepts the session credential and **rejects a forged or absent one by verification, not presence** — ADR-107's own success criterion.
- **Scope:** server auth derivation used by server actions.
- **Reviewable:** one verification path with an explicit negative case.
- **Reverts:** revert; derivation returns to the ID-token path.
- **Tests:** unit; emulator; E2E (a request with a forged credential is rejected).
- **After:** PR-10.1 — this PR is PR-10.1's consumer, so **CS-3 (no capability without a consumer) is satisfied within the sprint.**

**PR-10.3 — Set the httpOnly session cookie at sign-in alongside the existing cookie** · `T-107a` (3 of 3)
- **Concern:** the new credential is live in production traffic while the old one still works — the deliberate stable intermediate state.
- **Scope:** the sign-in path; cookie-set logic.
- **Reviewable:** one cookie added; nothing removed.
- **Reverts:** revert; the app returns to single-credential behavior.
- **Tests:** E2E (sign-in, protected route, sign-out); browser.
- **After:** PR-10.2

### Sprint 11 — Raw ID-token cookie removed, auth regression-tested

**PR-11.1 — Move client auth plumbing onto the session credential** · `T-107b`
- **Concern:** no client code reads the session credential from `document.cookie`.
- **Scope:** client auth plumbing, AuthGate, any client cookie reads.
- **Reviewable:** the set of client cookie reads is small and greppable; the PR body carries the grep going to zero.
- **Reverts:** revert; clients read the old cookie again (still being set).
- **Tests:** browser; E2E.
- **After:** PR-10.3

**PR-11.2 — Stop issuing the raw ID-token cookie and align lifetime to the session** · `T-107c`
- **Concern:** the removal — the bearer-token cookie is gone and cookie lifetime tracks a server-verifiable session, ending the "loads-but-fails" state.
- **Scope:** cookie-set/clear paths; `proxy.ts` documentation stating the edge gate is **routing-UX only, by contract**.
- **Reviewable:** a removal plus a documentation line; deliberately small because it is the PR that reverts under pressure.
- **Reverts:** revert; the dual-credential state of Sprint 10 returns as the known-good fallback.
- **Tests:** E2E (full protected/public matrix); browser.
- **After:** PR-11.1, PR-11.3 green.
- **Merge gate:** does not merge until PR-11.3's suite passes.

**PR-11.3 — Add the E2E auth regression suite across protected and public routes** · `T-107d`
- **Concern:** auth behavior across every route class is pinned — this is the acceptance evidence for the whole ADR-107 change, not an afterthought.
- **Scope:** Playwright specs covering signed-in, signed-out, expired-session and forged-credential paths, and the Sprint-1 public allowlist.
- **Reviewable:** specs read as the route matrix.
- **Reverts:** delete the specs.
- **Tests:** E2E.
- **After:** PR-11.1

### Sprint 12 — One user-progress listener

**PR-12.1 — Add the shared user-progress subscription** · `T-113a` (1 of 3)
- **Concern:** one reference-counted listener per user-progress entity exists, following the `NotificationsContext` pattern — **additive**.
- **Scope:** the shared subscription/provider; mounted once in the composition root.
- **Reviewable:** one lifecycle: subscribe on first mount, tear down on last unmount.
- **Reverts:** revert; nothing consumes it.
- **Tests:** unit (reference counting, including the tear-down-on-last-unmount case).
- **After:** —

**PR-12.2 — Move the ten `useUserProgress` consumers onto the shared subscription** · `T-113a` (2 of 3)
- **Concern:** the consumers stop owning listeners and start subscribing.
- **Scope:** the ten mount sites — home, study session, both flashcard games, four kana surfaces, settings, profile.
- **Reviewable:** one uniform edit repeated ten times; deviations are the review focus.
- **Reverts:** revert; consumers own listeners again (the old implementation is still present).
- **Tests:** browser (a mounted screen stays fresh); E2E (study session mid-flow); unit.
- **After:** PR-12.1

**PR-12.3 — Remove the per-mount listener implementation** · `T-113a` (3 of 3)
- **Concern:** the old path is gone, so N mounts provably open one listener.
- **Scope:** the superseded implementation.
- **Reviewable:** a deletion.
- **Reverts:** revert restores the old implementation.
- **Tests:** unit; E2E smoke.
- **After:** PR-12.2

### Sprint 13 — Bounded reads, honest exports

**PR-13.1 — Centralize the remaining per-entity realtime listeners** · `T-113b`
- **Concern:** no entity has per-component `onSnapshot` across multiple consumers.
- **Scope:** the listener sites the audit identifies; the PR body carries the audit table.
- **Reviewable:** the audit is the review artifact; each conversion follows PR-12.1's established pattern.
- **Reverts:** revert per entity.
- **Tests:** unit; browser.
- **After:** PR-12.3

**PR-13.2 — Bound the public-lesson collection-group listener** · `T-114a` (1 of 2)
- **Concern:** the unbounded public-deck stream gains an explicit `limit()`.
- **Scope:** `subscribePublicLessons` and the dashboard grid's "see more" affordance, using the **grow-window resubscribe** mechanism its realtime channel dictates (ADR-112) — not a third mechanism.
- **Reviewable:** one query change plus one paging affordance; the chosen bound and its rationale are in the PR body and the ledger.
- **Reverts:** revert; the unbounded listener returns.
- **Tests:** emulator; browser (grid paging); E2E (dashboard load).
- **After:** —

**PR-13.3 — Bound the remaining unbounded listeners** · `T-114a` (2 of 2)
- **Concern:** every collection/collectionGroup subscription carries an explicit bound.
- **Scope:** the residual listener sites; the PR body carries the grep showing no unbounded subscription remains.
- **Reviewable:** uniform one-line query changes.
- **Reverts:** revert.
- **Tests:** emulator; unit.
- **After:** PR-13.2

**PR-13.4 — Render absent export values as absent** · `T-114c`
- **Concern:** exported rows stop carrying hardcoded zeros indistinguishable from measured zeros.
- **Scope:** export/report row generation.
- **Reviewable:** a small substitution with a stated absent-value convention.
- **Reverts:** revert.
- **Tests:** unit.
- **After:** —

### Sprint 14 — Honest admin dashboards

**PR-14.1 — Render absent admin metrics as absent** · `T-114b`
- **Concern:** no code path substitutes a literal `0` for a missing metric; operators can tell healthy from idle from unmeasured.
- **Scope:** admin stat cards, `SystemHealthCard`, the metric read layer.
- **Reviewable:** one absent-data state applied uniformly across the cards.
- **Reverts:** revert; fabricated zeros return (a known, out-of-policy state — so the revert is a stop-gap, with a ledger row).
- **Tests:** browser (the "no data" state renders and is visually distinct); unit.
- **After:** —

**PR-14.2 — Dispose of the `analytics_daily` / `metadata/counters` read paths** · `T-114d` `[GATED Q-9]`
- **Concern:** those collections get a real writer or their read paths are removed — one or the other, recorded.
- **Scope:** the analytics read services and their consumers; or a defined writer contract.
- **Reviewable:** either branch is small; the branch choice is the review.
- **Reverts:** revert.
- **Tests:** unit; emulator if a writer is defined.
- **After:** PR-14.1. **If Q-9 is unanswered:** replaced by a ledger-row PR recording retention-pending-Q-9 with a review-by date. The fabricated-zero rendering is out of policy regardless and is already fixed by PR-14.1.

---

## 5. Wave 4 — Contracts & Convergence

### Sprint 15 — The unified action client

**PR-15.1 — Add the unified verified-identity action client** · `T-106a` (1 of 2)
- **Concern:** one action client with per-action permission metadata and thin per-surface configuration.
- **Scope:** `lib/safe-action.ts` (or successor); the family-choice criterion written **at the definition site**, replacing the two-families docstring.
- **Reviewable:** one client, one verification path, one metadata grammar — the whole security contract in one file.
- **Reverts:** revert; nothing consumes it.
- **Tests:** unit (verification, metadata enforcement, the negative case where an action lacking metadata cannot be defined).
- **After:** —

**PR-15.2 — Move one admin action onto the unified client** · `T-106a` (2 of 2, pilot slice)
- **Concern:** the client gets its first real consumer, proving the contract end to end and satisfying **CS-3 — no capability without a live consumer.**
- **Scope:** one admin action module and its calling hook.
- **Reviewable:** one action; the diff is the migration template Sprint 16 repeats.
- **Reverts:** revert; the action returns to `adminActionClient` (still live).
- **Tests:** unit; emulator; E2E for that admin flow.
- **After:** PR-15.1

### Sprint 16 — Admin actions migrated (WIDE SURFACE)

**PR-16.1 — Migrate admin read actions onto the unified client** · `T-106b` (1 of 3)
- **Concern:** the lowest-risk action group moves first, validating the template at scale.
- **Scope:** admin read/query actions and their hooks; each action's `.metadata({ permission })` **diffed against its pre-migration declaration** and the diff stated in the PR body.
- **Reviewable:** uniform repetition; the permission diff table is the review artifact.
- **Reverts:** revert the group.
- **Tests:** unit; emulator (rules); E2E for admin read surfaces.
- **After:** PR-15.2

**PR-16.2 — Migrate admin user and content mutations** · `T-106b` (2 of 3)
- **Concern:** the privileged mutation group moves, with permissions re-asserted.
- **Scope:** user/content admin actions and hooks.
- **Reviewable:** the permission diff table again; each row is a security assertion.
- **Reverts:** revert the group.
- **Tests:** unit; emulator (rules, `admins`); E2E for admin mutation flows.
- **After:** PR-16.1

**PR-16.3 — Migrate the remaining admin actions (logs and reports)** · `T-106b` (3 of 3)
- **Concern:** family B is fully migrated.
- **Scope:** log/report actions and hooks.
- **Reviewable:** the tail.
- **Reverts:** revert the group.
- **Tests:** unit; emulator (`system_logs`); E2E.
- **After:** PR-16.2

### Sprint 17 — Second client retired, vocabulary check added

**PR-17.1 — Migrate idToken bind-arg action sites onto the unified client** · `T-106c`
- **Concern:** family C's transport converges; every server action now runs one verification path.
- **Scope:** the `actionClient` call sites and their hooks.
- **Reviewable:** the same template as Sprint 16, smaller.
- **Reverts:** revert; the old client is still present.
- **Tests:** unit; emulator; E2E for the affected user-initiated flows.
- **After:** PR-16.3

**PR-17.2 — Remove the superseded action clients and the `toActionResult` shim** · `T-106d` (+ backlog M-2 rider)
- **Concern:** one exported action client remains; no parallel verification implementation exists.
- **Scope:** deletion of the old clients and their docstrings, plus the `toActionResult` bridge and re-throw shims — which retire here by construction, because PR-17.1 removed their last callers.
- **Reviewable:** a deletion; the PR body carries the grep proving no parallel verification path survives.
- **Reverts:** revert restores the old clients and the shim together (they must not be split across revert boundaries).
- **Tests:** gate; E2E smoke.
- **After:** PR-17.1

**PR-17.3 — Add the cross-artifact vocabulary-agreement check (notification target report-only)** · `T-115b`
- **Concern:** the TS union, the `firestore.rules` list and the writer's accepted kinds are machine-verified to agree — **built once**, serving both ADR-115's automation leg and ADR-108's Sprint-21 requirement.
- **Scope:** a CI check plus its source-of-truth readers; no product code. **The notification target runs report-only** and flips to failing in PR-21.1, because the union it checks is not widened until T-108a — a check that is red by design would be the standards-decay pattern this set exists to prevent (backlog §5.4). Every other target fails from day one.
- **Reviewable:** one check with a deliberate failing fixture demonstrating it fires, plus the report-only flag and its expiry condition stated in the PR body.
- **Reverts:** revert the check.
- **Tests:** gate (the check is the test); unit for the comparison logic.
- **After:** —

### Sprint 18 — One deck-access implementation

**PR-18.1 — Correct the divergent `isOwner` predicate to the engine's semantics** · `T-115a` (1 of 3)
- **Concern:** the **behavioral fix** — an owner whose lesson lacks a `roles` self-entry is no longer denied access. Isolated from the mechanical convergence deliberately.
- **Scope:** `shared.service.ts`'s `isOwner`, moved to `ownerId ?? userId`.
- **Reviewable:** a one-predicate change with a stated before/after truth table.
- **Reverts:** revert restores the divergence (a known live defect — the revert is a stop-gap with a ledger row).
- **Tests:** unit (`resolveRole` suite from PR-5.3); emulator (rules from PR-7.1); E2E for the owner-access path.
- **After:** PR-5.3, PR-7.1

**PR-18.2 — Route the remaining inline deck-access derivations through the engine** · `T-115a` (2 of 3)
- **Concern:** no site re-derives deck access; all call the engine.
- **Scope:** the four remaining inline sites; the PR body carries the grep for `roles?.[uid]` / `allowLinkAccess || isPublic` / ad-hoc owner checks going to zero outside the engine.
- **Reviewable:** four small call-site substitutions, each behavior-identical by construction.
- **Reverts:** revert.
- **Tests:** unit; emulator; browser for affected access UI.
- **After:** PR-18.1

**PR-18.3 — Share one public-access predicate across the client and Admin-SDK paths** · `T-115a` (3 of 3)
- **Concern:** the three-copy public-access predicate becomes one implementation — **two files may remain** (the real client/Admin bundle-isolation constraint), one implementation must.
- **Scope:** the client resolver, the Admin-SDK preview path, and their shared pure predicate; `firestore.rules` verified to agree via PR-17.3's check.
- **Reviewable:** one extracted pure predicate with two thin call sites; the bundle-isolation boundary is stated in the PR body.
- **Reverts:** revert; three copies return.
- **Tests:** unit; emulator (rules); E2E for public-deck access.
- **After:** PR-18.2, PR-17.3

**PR-18.4 — Split `ShareModal.tsx` by responsibility** · CS-2 rider on `T-115a` (backlog M-5)
- **Concern:** the repo's single 400+ non-test file (436 lines) splits along real responsibility seams — the prerequisite for the hard ceiling becoming a lint error in PR-28.2.
- **Scope:** `ShareModal.tsx` split into cohesive units. **This is the task that next touches the file:** one of the five inline deck-access predicates PR-18.2 converges lives in its body, which is why the split lands in Sprint 18 and not in the Sprint 27 restructure.
- **Reviewable:** one file into a few, with the responsibility of each named; **no logic changes** — the predicate work already landed in PR-18.2, so this PR is a pure split and is reviewable as one.
- **Reverts:** revert the split; the predicate convergence is unaffected because it landed separately.
- **Tests:** browser (the share dialog's keyboard and focus behavior); E2E (the share flow); unit.
- **After:** PR-18.2 — **predicate change first, split second**, so a behavioral change and a structural one never share a PR.

### Sprint 19 — Validation at every write boundary (WIDE SURFACE)

**PR-19.1 — Inventory every server write path and its validation state** · `T-109a` (1 of 3)
- **Concern:** produce the audit — which write path validates through which schema, and where the gaps are.
- **Scope:** a ledger/inventory document. No code.
- **Reviewable:** one table; it is the design review for PR-19.2 and PR-19.3.
- **Reverts:** revert the document.
- **Tests:** gate only.
- **After:** —

**PR-19.2 — Validate flashcard write paths at their boundaries** · `T-109a` (2 of 3)
- **Concern:** card and lesson writes validate through a live schema, closing the cloze-token invariant gap.
- **Scope:** flashcard server write paths; the schemas they bind to. Any newly-enforced constraint that could reject previously-accepted input is called out explicitly and, absent Q-12's compatibility answer, ships **warn-then-enforce with a ledger row**.
- **Reviewable:** per write path, one validation call plus one rejection shape.
- **Reverts:** revert; writes return to `validateAtomicCard`-only.
- **Tests:** unit; emulator; browser for the rejection UX.
- **After:** PR-19.1

**PR-19.3 — Validate notification and admin write paths at their boundaries** · `T-109a` (3 of 3)
- **Concern:** the remaining server write paths validate.
- **Scope:** notification and admin write paths.
- **Reviewable:** the tail, uniform after PR-19.2 set the shape.
- **Reverts:** revert.
- **Tests:** unit; emulator; functions where a Cloud Function writes.
- **After:** PR-19.2

### Sprint 20 — Forms standardized, schemas disposed

**PR-20.1 — Standardize multi-field forms on react-hook-form + zodResolver** · `T-109e`
- **Concern:** multi-field forms use one form mechanism, extending the existing beachhead; the controller hook owns the `useForm` instance and passes `register` down (CS-5/CS-13).
- **Scope:** the multi-field forms not yet on rhf; their controller hooks.
- **Reviewable:** per form, a mechanical conversion against a known in-repo template.
- **Reverts:** revert per form.
- **Tests:** browser (form interaction, validation messages, keyboard); unit (schema).
- **After:** —

**PR-20.2 — Dispose of `cardContentSchema`** · `T-109b` `[GATED Q-12]`
- **Concern:** the schema is wired into its write path or deleted with its misleading header.
- **Scope:** the schema and, if enforced, the card write path binding it.
- **Reviewable:** one schema, one branch decision.
- **Reverts:** revert.
- **Tests:** unit; emulator; browser if enforcement changes a rejection path.
- **After:** PR-19.2. **If Q-12 is unanswered:** replaced by a ledger-row PR recording "pending disposition" with owner and review-by — ADR-109 explicitly sanctions this state.

**PR-20.3 — Dispose of `privacyModeSchema`** · `T-109c` `[GATED Q-12]`
- **Concern:** same rule, one schema.
- **Scope:** the schema and its write path if enforced.
- **Reviewable:** small.
- **Reverts:** revert.
- **Tests:** unit; emulator.
- **After:** PR-19.3. **Same fallback as PR-20.2.**

**PR-20.4 — Dispose of `publicRoleSchema`** · `T-109d` `[GATED Q-12]`
- **Concern:** same rule, one schema.
- **Scope:** the schema and its write path if enforced.
- **Reviewable:** small.
- **Reverts:** revert.
- **Tests:** unit; emulator (rules, since public role interacts with the sharing rules).
- **After:** PR-19.3. **Same fallback as PR-20.2.**

---

## 6. Wave 5 — Migration Completion

*Every PR in this wave except PR-21.1 and PR-21.2 is gated. Each states what ships if its question never answers.*

### Sprint 21 — Union widened, ops gates closed

**PR-21.1 — Widen `NotificationType` to the ten stored values** · `T-108a` *(ungated)*
- **Concern:** the persisted-field type stops lying; a non-exhaustive switch over it fails typecheck.
- **Scope:** the union and every consumer forced to handle the new cases (including the `NotificationIcon` widening to `string`, which can now be removed).
- **Reviewable:** one type change; the compiler enumerates the review list.
- **Reverts:** revert; the union narrows and the `string` widening returns.
- **Tests:** unit; gate (typecheck is the primary evidence); PR-17.3's vocabulary check must pass.
- **After:** PR-17.3

**PR-21.2 — Record the notification migration in the ledger with its removal gate** · `T-108e`
- **Concern:** the migration acquires an intended end state, current stage, owner and review-by date.
- **Scope:** the ledger document.
- **Reviewable:** one row.
- **Reverts:** revert the row.
- **Tests:** gate only.
- **After:** PR-21.1

**PR-21.3 — Verify and complete the notification index and rules deployment** · `T-108b` `[GATED NQ-1]`
- **Concern:** the runbook's "NOT yet deployed" status is confirmed or corrected, and the deployment is completed if pending.
- **Scope:** index configuration, `firestore.rules`, and the runbook document brought to current.
- **Reviewable:** configuration plus a corrected runbook; the PR body records what was observed in the console.
- **Reverts:** revert config; note that a *deployed* index is not reverted by a code revert — the PR body must state the deploy-side undo separately.
- **Tests:** emulator (rules); functions.
- **After:** PR-21.2. **If NQ-1 is unanswered:** does not ship; dual machinery is retained per ADR-108's standing default and the ledger row carries the block.

**PR-21.4 — Align the three admin-authority predicates** · `T-115c` `[GATED Q-10]`
- **Concern:** admin authority is derived one way, matching the live provisioning source.
- **Scope:** the three divergent predicates; possibly `firestore.rules`.
- **Reviewable:** three predicates converging on one, with the live source named in the PR body.
- **Reverts:** revert; the divergence returns.
- **Tests:** emulator (rules, `admins` — PR-7.2's suite); unit; E2E for an admin login path.
- **After:** PR-16.3. **If Q-10 is unanswered:** does not ship. ADR-115 converges these *only after* the live source is known — shipping a guess risks locking out the only superadmin.

### Sprint 22 — Production verdicts

**PR-22.1 — Resolve the four `@deprecated` notification fields** · `T-108c` `[GATED Q-5]`
- **Concern:** the legacy fields are retained with a recorded condition, or removed on evidence.
- **Scope:** the notification schema/types and the read paths referencing the deprecated fields.
- **Reviewable:** four fields, one verdict, evidence cited.
- **Reverts:** revert.
- **Tests:** unit; emulator.
- **After:** PR-21.3. **If Q-5 is unanswered:** does not ship; retention is the standing default and the ledger row carries the block.

**PR-22.2 — Resolve the `fanOutNotifications` callable** · `T-119d` `[GATED Q-6]`
- **Concern:** the un-called callable is deleted with its Cloud Tasks contract, or claimed with a named operator invocation.
- **Scope:** `functions/src/fanout.ts`, its export binding, the queue contract. The digest sibling and `deliverNotificationTask` are **preserved** unless the gate shows otherwise.
- **Reviewable:** a deletion with a preservation list stated in the PR body.
- **Reverts:** revert restores the callable in code; a *deployed* function needs a separate deploy-side undo, stated in the PR body.
- **Tests:** functions; gate.
- **After:** —. **If Q-6 is unanswered:** retain with a ledger row. ADR-119's delete default applies only once an out-of-repo operator invocation has been ruled out — deleting on assumption is not the default.

### Sprint 23 — The migration closes

**PR-23.1 — Collapse the dual notification read paths to one** · `T-108d` (1 of 2)
- **Concern:** one read path serves notifications; the compatibility branch is gone.
- **Scope:** the notification read paths and every consumer of the legacy shape.
- **Reviewable:** one read path removed with its consumer trace in the PR body.
- **Reverts:** revert restores the dual read — the reason readers are removed **before** indexes, never the reverse.
- **Tests:** emulator; E2E (the inbox renders history end to end); unit.
- **After:** PR-22.1

**PR-23.2 — Remove the superseded composite indexes** · `T-108d` (2 of 2)
- **Concern:** one index set remains; the two-schema tax ends.
- **Scope:** index configuration; the runbook updated; the ledger row moved to complete.
- **Reviewable:** a configuration deletion plus a ledger close-out.
- **Reverts:** revert the config; the deploy-side index re-creation is stated separately in the PR body.
- **Tests:** emulator; gate.
- **After:** PR-23.1 — **readers first, indexes second, in separate PRs, in that order.**

### Sprint 24 — Dormant vocabulary resolved

**PR-24.1 — Resolve the seven dormant `NotificationKind`s** · `T-119a` `[GATED Q-8]`
- **Concern:** each dormant kind is deleted with its registry entry and collapse/format share, or claimed with a named producing feature.
- **Scope:** the notifications registry, event weights, collapse-key and formatting logic.
- **Reviewable:** seven entries, one verdict each; behavior-neutral by construction (zero producers ever existed, so no stored document carries them).
- **Reverts:** revert.
- **Tests:** unit; emulator.
- **After:** PR-23.2. **If Q-8 is unanswered:** the standing default is **delete**; ship the deletion with the default recorded in the ledger.

**PR-24.2 — Resolve the never-emitted `ActivityAction`s and the `cloud_function` LogSource** · `T-119b` (1 of 2) `[GATED Q-11]`
- **Concern:** the dead logging vocabulary is deleted or claimed.
- **Scope:** the actions enum, the log-source badge branch, and the admin report filters keyed on the removed members. **Preservation requirement:** the normalizer that maps unknown sources to `"server"` must survive, so historical `system_logs` documents carrying pruned values still render.
- **Reviewable:** an enum prune with an explicit preservation note.
- **Reverts:** revert.
- **Tests:** unit (normalizer, including a stray stored value); browser (badge rendering).
- **After:** —. **If Q-11 is unanswered:** default **delete**, recorded.

**PR-24.3 — Make kana-practice logging symmetric with quiz and survival** · `T-119b` (2 of 2) `[GATED Q-11]`
- **Concern:** the proven omission is resolved — practice logs a completion like its siblings, or `KANA_PRACTICE_COMPLETED` goes with the rest and the asymmetry is recorded as intended.
- **Scope:** the kana practice completion path, or the enum member.
- **Reviewable:** one producer added or one member removed; separated from PR-24.2 because this one is a **behavioral** change while PR-24.2 is vocabulary pruning.
- **Reverts:** revert.
- **Tests:** unit; E2E for the practice completion path if a producer is added.
- **After:** PR-24.2

### Sprint 25 — Inert surfaces resolved

**PR-25.1 — Resolve the inert admin surfaces and `canChangeSettings`** · `T-119c` `[GATED Q-13]`
- **Concern:** handler-less Quick Action buttons, the Settings stub and the orphan permission are removed, or claimed with a named backend per surface.
- **Scope:** the Quick Actions card, the `/admin/settings` route and stub, the RBAC matrix and action-metadata enum. **Preservation requirement:** every action that *does* declare a permission resolves exactly as before.
- **Reviewable:** three named surfaces plus one permission; behavior-neutral by construction.
- **Reverts:** revert.
- **Tests:** unit (permission resolution for the 7 remaining live permissions); browser (admin overview layout minus the card); emulator (rules).
- **After:** —. **If Q-13 is unanswered:** default **delete**, recorded.

**PR-25.2 — Resolve the Storybook toolchain and scaffold assets** · `T-119e` `[GATED Q-17]`
- **Concern:** the 8-package toolchain supporting one story is removed, or adoption is claimed.
- **Scope:** devDependencies, npm scripts, `.storybook/`, the lint plugin wiring, the single story, and the unreferenced scaffold SVGs. **Preservation requirements:** the lint config's audio-boundary and `max-lines` rules are untouched; the `Badge` component stays (only its story leaves); the four real test configs are undisturbed by the addon removal.
- **Reviewable:** a dependency and config deletion with an explicit preservation checklist.
- **Reverts:** revert.
- **Tests:** all five suites must pass — this PR's whole risk is disturbing the test toolchain, so the suites are the evidence.
- **After:** —. **If Q-17 is unanswered:** default **delete**; ADR-119 states an undecidable gate resolves to the default.

---

## 7. Wave 6 — Structure & Patterns

### Sprint 26 — Placement parity, pagination codified

**PR-26.1 — Relocate the kana-survival screens to `features/kana/survival/`** · `T-105a`
- **Concern:** feature UI moves feature-side, in parity with the sibling kana modes; the `app → features/game` edges disappear.
- **Scope:** the four survival screens move out of `app/…/survival/_components/`; the survival route page becomes a thin orchestrator; import paths update.
- **Reviewable:** a file move plus import updates; the PR body asserts zero logic changes.
- **Reverts:** revert the move.
- **Tests:** browser; E2E (the survival mode plays end to end).
- **After:** —

**PR-26.2 — Move remaining route-private feature UI feature-side** · `T-105b`
- **Concern:** no `_components/` file under `app/` imports feature hooks, domain or services — the dependency test holds, and the placement rule is written in-repo.
- **Scope:** the notifications page-private list components and placeholders; a rule file stating the placement tiebreaker; the PR body carries the grep going to zero.
- **Reviewable:** a bounded move plus a short written rule.
- **Reverts:** revert the move.
- **Tests:** browser; E2E (notifications inbox).
- **After:** PR-26.1

**PR-26.3 — Codify the two pagination mechanisms and gate against a third** · `T-112a`
- **Concern:** cursor-token pagination for one-shot admin lists and grow-window resubscribe for realtime feeds are recorded as THE two, with a review gate against a third.
- **Scope:** the channel-rationale docstrings at each mechanism's definition; a review-gate note; the PR body carries the grep confirming no offset pagination and no `useInfiniteQuery`.
- **Reviewable:** documentation plus two greps.
- **Reverts:** revert.
- **Tests:** gate only.
- **After:** —

### Sprint 27 — Flashcard sub-modules (WIDEST SURFACE)

**PR-27.1 — Create the flashcard sub-module directories and barrels** · `T-104a` (1 of 3)
- **Concern:** the named sub-modules exist with barrels — **structure only**, no files moved yet.
- **Scope:** new sub-module directories and `index.ts` files for dashboard, detail, games, study/SRS, sharing + comments, import/AI.
- **Reviewable:** empty structure; the review is about the boundary *names*, which is the design decision.
- **Reverts:** delete the directories.
- **Tests:** gate only.
- **After:** —

**PR-27.2 — Dissolve the flat `components/` directory into the sub-modules** · `T-104a` (2 of 3)
- **Concern:** the 27-file grab-bag directory ceases to exist; each file lands in the sub-module it serves.
- **Scope:** file moves plus intra-feature import updates. External consumers are unaffected because Sprint 3 routed them through the root barrel.
- **Reviewable:** a move manifest — one table of from/to — with the assertion that no file content changed except imports.
- **Reverts:** revert the move.
- **Tests:** browser; E2E across flashcard surfaces; unit; emulator (the Sprint-6 service suite).
- **After:** PR-27.1

**PR-27.3 — Curate the flashcard root barrel export list** · `T-104a` (3 of 3)
- **Concern:** the external contract is a reviewed export list, not an `export *` chain over all sub-modules.
- **Scope:** `features/flashcard/index.ts`.
- **Reviewable:** one export list; the review question is "should this be public?" per line.
- **Reverts:** revert.
- **Tests:** gate (build proves every external consumer still resolves).
- **After:** PR-27.2

> **Note on `ShareModal`.** The CS-2 split of `ShareModal.tsx` is **not** in this sprint — it landed in **PR-18.4** under T-115a, the first task to edit the file's body (backlog M-5). This restructure inherits an already-split, already-compliant set of files. The general rule still binds: any file crossing 400 lines during the move is split by responsibility before merge.

### Sprint 28 — Internal boundaries enforced, one dialog pattern

**PR-28.1 — Enforce flashcard internal sub-module boundaries in lint** · `T-104b`
- **Concern:** cross-sub-module imports inside flashcard go through sub-module barrels.
- **Scope:** `eslint.config.mjs`.
- **Reviewable:** one rule block.
- **Reverts:** revert the rule.
- **Tests:** gate.
- **After:** PR-27.3 — **migration first, rule second.** Confirm the CS-7 barrel-reduction scope with the owner before merging (the policy partially reverses a demonstrated team preference).

**PR-28.2 — Make the 400-line file ceiling a lint error** · CS-2 rider on `T-104b`
- **Concern:** the tiered ceiling becomes enforceable — green ≤250, review 251–400, hard error >400 with a test-glob override.
- **Scope:** `eslint.config.mjs`.
- **Reviewable:** one rule change; it passes only because **PR-18.4** already split the single non-test violator.
- **Reverts:** revert the rule.
- **Tests:** gate.
- **After:** **PR-18.4** (the split, nine sprints earlier), PR-28.1 — **never before the split.**

**PR-28.3 — Route both non-conforming backdrops through `DialogChrome`** · `T-110a` (+ CS-14 rider)
- **Concern:** backdrop, close-button a11y and scroll behavior are guaranteed on both sanctioned dialog tiers.
- **Scope:** **two** stragglers converge on the shared constant — `DeckDetailsPanel`'s `bg-[#3c3c3c]/30` and `AdminSidebar`'s `bg-black/40` (backlog M-3: the decision is identical for both, so they are one task). The hardcoded values are replaced by tokens in the same change, since the hex *is* the token value.
- **Reviewable:** two stragglers converging on one constant; the PR body carries the grep showing `DIALOG_BACKDROP_CLASSNAME` is the only backdrop source.
- **Reverts:** revert.
- **Tests:** browser (focus trap, Escape, scroll behavior on both tiers, both panels).
- **After:** —

**PR-28.4 — Resolve `Drawer`** · `T-110b` `[NQ-3 — veto window, not a blocker]`
- **Concern:** `Drawer` gains at least one render site or leaves the barrel and the tree — no zero-consumer exported drawer remains.
- **Scope:** either `Drawer` is deleted from `shared/components/ui` and its barrel, or `DeckDetailsPanel` and `AdminSidebar` adopt it.
- **Reviewable:** either branch is small and self-contained.
- **Reverts:** revert.
- **Tests:** browser (if adopted, both panels' keyboard/focus contracts); gate (if deleted).
- **After:** PR-28.3. **NQ-3 is closed-by-decision toward deletion with an owner-veto note** (backlog §5.3) — so this PR is **Ready on its default and cannot stall**. Silence from the owner expires the window and the deletion ships; a claim that `Drawer` was built *for* these two panels flips it to adoption. Either way the PR merges in this sprint.

### Sprint 29 — One table engine

**PR-29.1 — Move Reports onto the shared table engine's row model** · `T-111a` (1 of 3)
- **Concern:** Reports gets engine-driven columns, sorting, selection and filtering semantics.
- **Scope:** the Reports view; `useDataTable` configuration and column definitions.
- **Reviewable:** one view's data layer converted; the behavior contract diff (what sorting/selection now does) is stated in the PR body.
- **Reverts:** revert; the parallel shell is still present.
- **Tests:** browser (sorting, selection, filtering); unit.
- **After:** —

**PR-29.2 — Restore virtualization as a rendering strategy on the engine** · `T-111a` (2 of 3)
- **Concern:** the log list stays virtualized — as a rendering concern over the engine's row model, not as a parallel shell.
- **Scope:** the Reports render layer; the virtualizer variant matched to the surface, with its choice documented at the point of use (CS-10/PC-4).
- **Reviewable:** one rendering strategy applied to an engine-driven row model.
- **Reverts:** revert to unvirtualized engine rendering (correct but slower) — a safe intermediate.
- **Tests:** browser (scroll behavior on a long log set).
- **After:** PR-29.1
- **Escape hatch:** if a genuine variable-height constraint blocks convergence, **stop and record the NQ-4 owner veto in the ledger** rather than half-converging. A half-converged Reports is the frozen-migration state ADR-120 exists to prevent.

**PR-29.3 — Remove the parallel Reports shell** · `T-111a` (3 of 3, + CS-14 rider)
- **Concern:** no second table implementation exists; the raw-hex occurrences in the touched files convert to tokens in the same change.
- **Scope:** deletion of the parallel shell; token cleanup in the touched components.
- **Reviewable:** a deletion; the PR body carries the grep confirming `useReactTable` / `<table` stays within the engine's files.
- **Reverts:** revert restores the shell.
- **Tests:** browser; gate.
- **After:** PR-29.2

---

## 8. Sequencing: what must be ordered, what can land in any order

### 8.1 Hard chains (each PR requires the previous one on `main`)

| Chain | Sequence | Why the order is load-bearing |
|---|---|---|
| **Boundary enforcement** | PR-2.3 → PR-3.1 → PR-3.2 → PR-3.3 → PR-4.1 → PR-4.2 | Publish the API, migrate consumers, *then* enable the rule. Flipping the rule earlier breaks the pre-commit gate on `main`. |
| **Cycle break** | PR-4.3 → PR-4.4 → PR-5.1 | The seam must exist before the rewire; the rule must follow the rewire. |
| **Auth end-state** | PR-10.1 → PR-10.2 → PR-10.3 → PR-11.1 → PR-11.3 → PR-11.2 | Mint, verify, issue-alongside, migrate clients, prove by E2E, *then* remove the old cookie. PR-11.2 is deliberately last and small. |
| **Listener centralization** | PR-12.1 → PR-12.2 → PR-12.3 → PR-13.1 | Provider, consumers, removal — then generalize to other entities. |
| **Action client** | PR-15.1 → PR-15.2 → PR-16.1 → PR-16.2 → PR-16.3 → PR-17.1 → PR-17.2 | Build, pilot, migrate by risk-ascending group, converge the second family, *then* delete. |
| **Predicate convergence** | PR-5.3 → PR-7.1 → PR-18.1 → PR-18.2 → PR-18.3, and PR-18.2 → PR-18.4 | Test the engine, cover the rules, fix the divergence, converge the rest, share the predicate. PR-18.4 (the `ShareModal` split) follows PR-18.2 so a behavioral change and a structural split never share a PR. |
| **Validation** | PR-19.1 → PR-19.2 → PR-19.3 → PR-20.2/20.3/20.4 | The inventory is the design review; schema dispositions follow the write-path work. |
| **Notification migration** | PR-17.3 → PR-21.1 → PR-21.2 → PR-21.3 → PR-22.1 → PR-23.1 → PR-23.2 | The check precedes the widening (and flips from report-only to failing at PR-21.1); readers are removed before indexes, in separate PRs. |
| **Flashcard restructure** | PR-27.1 → PR-27.2 → PR-27.3 → PR-28.1 → PR-28.2 | Structure, move, curate, *then* two rule flips. PR-28.2 additionally depends on **PR-18.4**, the `ShareModal` split — its only cross-wave dependency. |
| **Reports convergence** | PR-29.1 → PR-29.2 → PR-29.3 | Row model, rendering strategy, then remove the old shell. |
| **Allowlist** | PR-1.4 → PR-1.5 | Neutral consolidation, then the behavioral switch. |

### 8.2 PRs that can land in any order relative to each other

These share no files and no semantic dependency. Within a sprint they may be reordered freely; across sprints they may be pulled forward if capacity allows.

| Group | PRs | Note |
|---|---|---|
| Ledger and docs | PR-1.1, PR-1.3 | PR-1.2 depends only on PR-1.1. |
| Config | PR-2.1 → PR-2.2 (pair), independent of everything else in Sprint 2 | |
| Logging vocabulary | PR-2.4 | Independent of the barrel chain; only PR-4.2 depends on it. |
| Test-only PRs | PR-5.2, PR-5.3, PR-6.1–6.3, PR-7.1–7.3, PR-8.1–8.3 | Nine of these touch no production code. Sequenced in the plan only for reviewer focus; PR-5.3 and PR-7.1 have downstream consumers (PR-18.1), the rest do not. |
| Report-then-handle | PR-9.1, PR-9.2, PR-9.3 | Sequenced for pattern consistency, not dependency; each site set is independent. |
| Honest UI | PR-13.4, PR-14.1 | Independent of the listener and bounding work. |
| Vocabulary check | PR-17.3 | Independent of the action-client chain; PR-21.1 depends on it. |
| Forms | PR-20.1 | Independent of the schema dispositions. |
| Dead-surface dispositions | PR-22.2, PR-24.1, PR-24.2, PR-25.1, PR-25.2 | Five independent gates on five disjoint surfaces; land in whatever order the answers arrive. PR-24.3 depends only on PR-24.2. |
| Placement and pagination | PR-26.1 → PR-26.2 (pair), PR-26.3 | PR-26.3 is documentation and independent. |
| Dialog | PR-28.3, PR-28.4 | Independent of the flashcard chain. |

### 8.3 Cross-sprint merge locks

Three PR groups hold effectively repo-wide locks; **nothing structural should be in flight beside them**, because a concurrent branch will not rebase cleanly:

| Lock | PRs | Surface |
|---|---|---|
| Import statements, repo-wide | PR-3.1 – PR-3.3 | 55+ deep-import sites across every feature |
| Server action plumbing | PR-16.1 – PR-16.3, PR-17.1 | ~30 action modules plus their hooks |
| Flashcard file layout | PR-27.1 – PR-27.3 | 146 files reorganized — the widest in the plan |

Two further groups are wide but tolerable alongside test-only work: PR-9.1 – PR-9.3 (17+ swallow sites) and PR-19.2 – PR-19.3 (server write paths).

### 8.4 Gated PRs and their fallback shipping form

| PR | Gate | Ships anyway as | Ships nothing (genuinely blocked) |
|---|---|---|---|
| PR-9.4, PR-9.5 | Q-4 | ledger row recording the deferral and reason | — |
| PR-14.2 | Q-9 | ledger row: retention pending, with review-by | — |
| PR-20.2, PR-20.3, PR-20.4 | Q-12 | ledger row: pending disposition per schema | — |
| PR-21.4 | Q-10 | — | ✔ shipping a guess risks superadmin lockout |
| PR-21.3 | NQ-1 | — | ✔ dual machinery retained by default |
| PR-22.1 | Q-5 | — | ✔ retention is the default; removal is gated |
| PR-23.1, PR-23.2 | Q-5 + NQ-1 | — | ✔ collapsing unverified would hide pre-migration notifications from users |
| PR-22.2 | Q-6 | delete **only if** an out-of-repo invocation is ruled out; else a retention ledger row | — |
| PR-24.1 | Q-8 | delete (standing default), recorded | — |
| PR-24.2, PR-24.3 | Q-11 | delete (standing default), recorded | — |
| PR-25.1 | Q-13 | delete (standing default), recorded | — |
| PR-25.2 | Q-17 | delete (standing default), recorded | — |
| PR-28.4 | NQ-3 — **veto window, not a gate** | delete on window expiry, or adopt on an owner claim; merges either way | — |

**Five PRs — PR-21.3, PR-21.4, PR-22.1, PR-23.1 and PR-23.2 — have no fallback that permits the work.** They are the plan's only genuinely blockable changes, and every one of them sits in Wave 5 by design. **PR-28.4 is not among them:** NQ-3 is closed-by-decision with an owner-veto window, so it ships on its default if nobody objects (backlog §5.3).

The gate counts reconcile to the backlog: **16 gated tasks** (Q-12 → 3 · Q-5 → 2 · Q-4 → 2 · Q-8, Q-9, Q-10, Q-11, Q-13, Q-6, Q-17, NQ-1, NQ-3 → 1 each) plus **1 Open** (T-118d, not schedulable, no PR), against **46 Ready**.
