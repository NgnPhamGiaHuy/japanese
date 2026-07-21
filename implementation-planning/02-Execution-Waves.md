# 02 — Execution Waves

**Phase 11 — Implementation Planning.** Six waves sequencing the task set derived from the twenty ADRs (`architecture-decision/03-Architecture-Decisions.md`). Wave membership, task sizes, and the sequencing rationale are fixed by the planning kernel; this document elaborates them with ADR evidence and fixes observable entry/exit criteria per wave.

**Honest labeling.** This is **derived-from-decisions planning, not backlog validation**. `engineering-tasks/` and `requirements-consolidation/` do not exist — they were deleted before the discovery phase, never committed, and are unrecoverable. Traceability therefore runs **task → ADR → driving findings → corpus**. No Requirement-ID or Recommendation-ID is cited anywhere in this plan, because the documents that would define them are absent.

**Planning assumptions (fixed).** Team of **1 developer** (corpus R-12 / W-6: 140 commits, single author, bus factor 1). **2-week sprints** (~10 working days). Sizes are T-shirt: **S ≤1d, M 2–4d, L 5–8d**; day arithmetic in this document uses the plan's standard conversion **S=1d, M=3d, L=6.5d**. Parallelization is **marked but never assumed** — every wave is valid and completable at team size 1. The existing pre-commit gate (lint + format + full build) and the five-suite test topology (unit / real-browser / emulator / functions / e2e, S-10) remain in force for every PR. **Every wave ends deployable**: no wave may end with a half-migrated boundary, a partially-converged client, or a broken gate.

**Task count — confirmed errata.** The kernel's header names "50 tasks"; its own enumeration and wave assignment both contain **63 task IDs**. **63 is authoritative** (confirmed against `01-Validated-Backlog.md` §5.1): **62 wave-assigned plus T-118d**, which is `[OPEN Q-2]` and not schedulable. The headline "50" is a transcription error — planning against it would under-count the program by 26%. Nothing here was renumbered, merged, or invented.

**Size distribution (aligned to `01-Validated-Backlog.md` §4.2):** **19 S · 29 M · 14 L · 1 unsized (T-118d) · 0 XL.** The backlog's raw size-band sum is **147–247 developer-days**; this document's point estimate of **197 d** uses the plan's standard S=1 / M=3 / L=6.5 conversion and sits at the midpoint of that band. Where this file and `01-Validated-Backlog.md` state the same fact, the backlog is authoritative.

---

## Wave overview

| Wave | Goal | Tasks | Size total | Gated | Releasable outcome |
|---|---|---:|---:|---:|---|
| **1 — Platform Foundations** | Make boundaries enforceable, configuration single-sourced, and staged work self-recording | 14 | **31.5 d** | 0 | Boundaries lint-enforced at the keyboard; one allowlist, one `APP_ID`, `.env.example`; the flashcard↔notifications cycle broken behind a registry seam; the migrations ledger live with a row per gated disposition |
| **2 — Safety Net** | Put the highest-risk untested logic under test and end silent failure — before anything rewrites those paths | 8 | **34 d** | 2 | SRS math, `resolveRole`, and flashcard data services under direct test; every ruled collection in the rules suite; zero report-less swallows on real-state writes |
| **3 — Security & Data Layer** | httpOnly server-verified session, one listener per entity, and a UI that never asserts data it lacks | 10 | **33 d** | 1 | Session credential is httpOnly and server-verified; 10 progress consumers share one listener; every listener bounded; dashboards render absent data as absent |
| **4 — Contracts & Convergence** | One action client, validated writes, zero inline access predicates | 12 | **44 d** | 4 | One verification path for every server mutation, each declaring its permission; every server write validated at its boundary; deck-access has exactly one implementation |
| **5 — Migration Completion** | Close the notification migration and resolve every dead surface, one way or the other | 10 | **29.5 d** | 8 | `NotificationType` describes the data it stores; every dormant surface removed or ledger-claimed with an owner; kana-practice logging symmetry restored. *(Conditional — see wave 5's gate statement)* |
| **6 — Structure & Patterns** | Bring placement, dialog, table, and pagination patterns to parity in a quiet codebase | 8 | **25 d** | 1 | Kana-survival lives with its siblings; flashcard has enforced internal barrels; one backdrop source; Reports on the shared table engine; two pagination mechanisms codified with a gate against a third |
| | | **62** | **197 d** | **16** | |

**Program arithmetic at team size 1:** 197 d ≈ **20 sprints ≈ 40 weeks**. The dependency-chain floor (the critical path, file 06) is **73 d** — reachable only with added capacity, not at team size 1. T-118d `[OPEN Q-2]` sits in no wave and carries no size; it becomes schedulable only when a hosting decision is *made and recorded* as a new ADR.

**Gate cadence.** Per kernel gate-rule 3, question-answering is scheduled work, not a wish. Every wave containing gated tasks opens with a **question-resolution item** naming the questions it needs. Because the highest-leverage answers ([DATA]/[OPS]/[GCP]) have the longest lead times, **Wave 1 dispatches the questions Waves 2 and 5 will need** — this is the cheapest schedule lever in the plan (file 06, "what shortens the path").

---

## Wave 1 — Platform Foundations

**Goal.** Install the three mechanisms every later wave depends on — a ledger that records staged work, lint-enforced feature boundaries, and single-sourced configuration — while breaking the repo's only feature-level import cycle.

### Why this wave sits here

Three independent lines of ADR evidence put this work first.

**The ledger is the highest-leverage single decision in the set.** ADR-120's problem statement is that *six of the twelve root causes* (RC-2, RC-3, RC-5, RC-6, RC-7, RC-10) reduce to one meta-cause: "a migration or capability was staged with a defined later step, and the repository has no mechanism that records whether the later step happened or is still intended" (cluster C16). The complexity analysis reached the same closing taxonomy independently. ADR-120 is marked **P1 — the highest-leverage single decision**, and its consequence section names this plan's exact situation: the gated dispositions of ADR-108/109/110/114/118/119 "are the ledger's initial entries." Waves 2–6 produce sixteen gated tasks. If the ledger does not exist first, sixteen dispositions get carried as unrecorded assumptions — reproducing precisely the failure this decision set exists to end. That is why **T-120a is step 1 of the critical path**.

**Boundaries must be enforced before anything large moves.** ADR-101 establishes that the layer discipline "held for 138 commits by convention alone (S-1)" but that its enforcement mechanism is single-author discipline (W-6), and that documented-only conventions demonstrably drift in this repo (W-20's unequal allowlists, CX-9's placement drift). The concrete cost is verified: 2 of 9 features expose a root barrel, 43 sites deep-import `@/features/flashcard/types`, and no ESLint rule constrains import direction. ADR-101's own consequence is the sequencing argument — "the next W-1-style cycle cannot form silently — it fails lint at the keyboard." Every subsequent wave adds or moves code; each one that lands *before* the rule is a chance for a new violation to enter unnoticed. Waves 4 and 6 in particular (ADR-104's internal barrels, ADR-105's relocations) are expressed *against* the barrel contract and cannot be specified until it exists.

**The cycle must break before the boundary rule can be honest.** ADR-102 documents the repo's only feature-level value-import cycle: flashcard calls notifications' emit services at 3 sites, and notifications' `InviteActions` imports flashcard's `declineInviteAction` back (W-1). Its rejected alternative 1 states the coupling to ADR-101 exactly: accepting the cycle would make it "a permanent lint exception under ADR-101, undermining the boundary rule from day one." RC-1 adds the compounding argument — each new *actionable* notification kind adds another backward import, "hardening the cycle from one edge into a lattice," and seven inactive kinds are already pre-declared. So the seam (T-102a) must be built while the lattice is still one edge.

**Configuration is here because it is a live defect, not a tidy-up.** T-118a is the only Wave-1 task that fixes currently-wrong behavior rather than structure. ADR-118 verifies the two public-path allowlists are *already unequal* — `proxy.ts` admits `/login`, sitemap/robots, and the OG-image pattern; `lib/providers.tsx`'s AuthGate regex admits only the deck landing page — "while its comment claims it 'mirrors' the proxy list" (W-20(a)). The failure modes are silent in both directions: a public page hidden behind an auth splash, or an auth-splash bypass. NQ-2 is resolved-by-decision toward **defect, not intent**.

### Tasks

| ID | Title | Size | ADR | Gate |
|---|---|:--:|---|---|
| T-120a | Create in-repo migration ledger (format, location, required fields: intended end state / current stage / owner / review-by) | S | ADR-120 | — |
| T-120b | Backfill ledger entries for all in-flight staged work (notification migration, gated dispositions, convergences) | M | ADR-120 | — |
| T-120c | Fix docs/ADR index omission (ADR-003) + record ADR process note | S | ADR-120 | — |
| T-118a | Single module owns the public-path allowlist; proxy + AuthGate both consume it. **Fixes a live divergence defect.** | M | ADR-118 | — |
| T-118b | Single `APP_ID` derivation shared across app and functions packages | M | ADR-118 | — (old-var retirement: see note) |
| T-118c | Add `.env.example` documenting the ~30 referenced env vars | S | ADR-118 | — |
| T-101a | Define + publish root barrels as the public API for all 9 features | M | ADR-101 | — |
| T-101b | Migrate the 43 deep-import sites onto barrel imports | L | ADR-101 | — |
| T-101c | Add ESLint import-boundary rule; set to `error` *(+ UR-4 rider: correct the stale standards-count comment)* | S | ADR-101 | — |
| T-103a | Relocate the admin type consumed by `lib/logging/public.ts`; remove the back-edge | S | ADR-103 | — |
| T-103b | Extend boundary lint to forbid `lib`→`features` (composition root allowlisted) | S | ADR-103 | — |
| T-102a | Introduce notifications' injection/registry seam for cross-feature actions | M | ADR-102 | — |
| T-102b | Rewire `InviteActions` off flashcard access actions onto the seam | M | ADR-102 | — |
| T-102c | Lint rule forbidding notifications→flashcard imports | S | ADR-102 | — |

**Size total: 31.5 d** (7 S, 6 M, 1 L). **Gated: 0.**

> **Cross-cutting rider in this wave (UR-4).** `eslint.config.mjs` carries a stale standards-count comment ("~46 pre-existing files over the limit"; the verified count is 44). Per `01-Validated-Backlog.md` §2.1 M-7 it is folded into **T-101c** — the only Wave-1 task already editing that file. A one-line correction, not a task.

> **T-118b sub-gate note.** The kernel schedules T-118b ungated. `05-Simplification-Strategy.md` MC-4 adds a constraint the kernel does not repeat: "changing the functions package's env contract is a deploy-config change whose production agreement **Q-6** verifies before the old var retires." Reconciliation, consistent with both: the **single derivation lands in Wave 1** (an in-repo change, ungated, verifiable by grep), and **retirement of the superseded env var is a ledger row gated on Q-6** — the same question Wave 5's T-119d needs. Nothing about T-118b's Wave-1 placement changes.

### Releasable outcome

A deployable codebase in which:
- Adding a deep cross-feature import fails `lint` locally with a message naming ADR-101 — the boundary is a contract, not a convention.
- Adding a public route is a one-place change that both the edge proxy and the client AuthGate honor; the SEO-broken / splash-bypass failure pair is closed.
- The app and Cloud Functions cannot split across two tenant roots from a single mis-set env var.
- A new environment can be stood up from `.env.example` rather than by grepping source (this is the concrete mitigation ADR-118 offers against the W-6 bus-factor amplifier).
- `features/notifications` imports no feature; adding an actionable notification kind is one registry entry plus one handler registration.
- Every gated disposition in the ADR set has a ledger row with an owner and a review-by date, so Waves 2–6 inherit tracked state rather than assumptions.

### Entry criteria

- None technical — this is the program's start.
- **Question-resolution item (kernel gate-rule 4):** **Q-1** — *which Firebase project is production, and what is its provisioned state?* Q-1 gates **verification** (not execution) of AD-06, AD-07, AD-08, AD-14, AD-16, and AD-18; it is the single most foundational question in the corpus. It belongs to Wave 1's readiness, not to a later wave.
- **Long-lead dispatch:** open **Q-4** (Wave 2), **Q-5 + NQ-1** (Wave 5), **Q-12** (Wave 4) now. Q-12 is [INTENT] and needs no production access — it is the cheapest answer in the set to obtain and should not wait for Wave 4.

### Exit criteria (observable)

| # | Criterion | Source |
|---|---|---|
| 1 | A grep for cross-feature imports bypassing root barrels returns **zero**; external import sites into `flashcard/types` = **0** (was 43) | ADR-101 SC-2 |
| 2 | All 9 features have root barrels; the lint rule's exception list contains only the enumerated sanctioned edges (composition root, `app/` orchestrators) | ADR-101 SC-3 |
| 3 | Introducing a deep cross-feature import locally fails `lint` with a message naming the ADR | ADR-101 SC-1 |
| 4 | Grep of `features/notifications/` for `@/features/` (other than itself) returns **zero** | ADR-102 SC-1 |
| 5 | Invite accept/decline works end-to-end with flashcard's handler registered through the seam (observable on the existing realtime e2e path) | ADR-102 SC-2 |
| 6 | Grep of `lib/` for `@/features` matches **only** `lib/providers.tsx`; a synthetic `lib → features` import fails lint | ADR-103 SC-1, SC-3 |
| 7 | The log type vocabulary has exactly one declaration site under `lib/logging`; `logSourceSchema` derives from it rather than restating it | ADR-103 SC-2 |
| 8 | One module exports the public-path allowlist; grep shows proxy and AuthGate both import it (no second hand-maintained list) | ADR-118 SC-1 |
| 9 | `APP_ID` has one derivation shared by app and functions (grep: not two independent `?? "kana-nihongo-master"` literals) | ADR-118 SC-2 |
| 10 | `.env.example` exists and lists the ~30 referenced env vars | ADR-118 SC-3 |
| 11 | A migrations ledger exists in-repo; every gated disposition across ADR-108/109/110/114/118/119 has a row with end state, current stage, owner, review-by | ADR-120 SC-1 |
| 12 | The docs ADR index lists every ADR on disk (the missing-003 drift, W-21(d)/TD-13, is fixed) | ADR-120 SC-3 |
| 13 | The hosting decision (Q-2) is recorded as **Open** in the ledger with `SITE_URL`'s localhost fallback flagged as a hazard | ADR-118 SC-3 |

### Gated items

**None.** Wave 1 is fully schedulable today — this is deliberate: the wave that installs the enforcement machinery must not itself be blocked on an external answer.

T-118d `[OPEN Q-2]` is **not in this wave and not in any wave.** ADR-118 is explicit that hosting "cannot be settled from documents" and that inventing a canonical URL "would be a guess embedded in sitemap/robots/OG/share URLs." The honest position is Open, recorded (exit criterion 13). When Q-2 answers, it produces a **new ADR**, and T-118d becomes schedulable then.

### Parallelization note

A second developer can take **the entire configuration and ledger branch** without ever touching the spine:
- **T-118a + T-118b + T-118c** (7 d) — shares no files with the barrel/seam work.
- **T-120b + T-120c** (4 d) — independent once T-120a fixes the ledger format (a half-day handoff).
- **T-103a + T-103b** (2 d) — T-103a is independent; T-103b touches the same ESLint config as T-101c and should land after it to avoid a config conflict.

That is **13 d of the wave's 31.5 d** removable from the critical developer's plate, leaving the T-120a → T-101a → T-101b → T-101c → T-102a → T-102b → T-102c chain (17.5 d) as the wave's serial floor.

---

## Wave 2 — Safety Net

**Goal.** Put the exact logic that Waves 3–5 will rewrite under direct test, and make failures below the four route boundaries visible — before the rewrites begin.

### Why this wave sits here

This is the kernel's **"coverage before convergence"** rule, and it is not a general principle applied loosely — the ADR evidence is unusually specific about *which* code and *why now*.

**ADR-117 names the units that Waves 3–5 rewrite.** Its allocation priority is "SRS math (`progress.service`), the sharing-RBAC resolver (`resolveRole` — pure, security-relevant, 9 consumers, **and the ADR-115 convergence target**), and flashcard data services (the diff-based `lesson-save`, `shared.service`)." Each is a Wave-4 or Wave-5 target. `resolveRole` is called out in ADR-117's own consequence section: it "becomes tested **before** it is consolidated." T-115a — the convergence that touches it — is 2 waves later.

**The cost-of-delay argument is explicit.** TD-2 is the corpus's #2-ranked debt (score 8) with cost-of-delay **High**: the untested mass "is precisely the code the repo's own plans target for restructuring," so refactors "either proceed blind or must pay for characterization tests first." ADR-117's rejected alternative 3 closes the door on doing this later: testing at refactor time happens "at a higher price than testing at write time," and the file-splitting program "cannot proceed safely without a net."

**Report-then-handle belongs with the tests for the same reason.** ADR-116's report-then-handle leg is **Accepted unconditionally** — a pure code decision needing no production access (OP-22, bucket-1). The 17 swallow sites sit on *real state*: SRS counters, Storage cleanup, pending-notification delivery, login logging (R-6). Once Waves 3–5 begin rewriting those exact write paths, a swallowed failure in a rewritten path is indistinguishable from success — P-8 (report before you handle) is the write-side twin of P-9 (honest UI): "an unreported failure becomes a fabricated success." Doing T-116a *after* the auth and action-client migrations would mean migrating blind and instrumenting the result.

**Nothing in this wave depends on an external answer to be useful.** ADR-117 carries no gate; ADR-116's policy leg carries none either. Only the Sentry/PostHog *activation* is gated (Q-4), and it is 2 S-sized tasks.

### Tasks

| ID | Title | Size | ADR | Gate |
|---|---|:--:|---|---|
| T-117a | Unit tests for SRS math (`domain/srs`) | M | ADR-117 | — |
| T-117b | Unit tests for the sharing-RBAC `resolveRole` engine | M | ADR-117 | — |
| T-117c | Tests for flashcard data services | L | ADR-117 | — |
| T-117d | Rules-suite coverage for lessons/cards/comments, `admins`, `system_logs`, `sharedProgress`, collection-group read | L | ADR-117 | — |
| T-117e | Baseline coverage for the four zero-coverage features (`ai`, `game`, `home`, `command-palette`) | L | ADR-117 | — |
| T-116a | Apply report-then-handle to the 17 swallow sites (SRS counters, Storage cleanup, invite delivery first) | L | ADR-116 | — |
| T-116b | Activate Sentry (credentials + project ownership) | S | ADR-116 | **[GATED Q-4]** |
| T-116c | Activate PostHog | S | ADR-116 | **[GATED Q-4]** |

**Size total: 34 d** (2 S, 2 M, 4 L). **Gated: 2.**

### Releasable outcome

- The three highest-consequence untested units in the repo have direct tests, so the Wave-3/4/5 rewrites have a regression net over exactly the code they touch.
- Every collection with a `firestore.rules` block appears in the rules suite — so the rules changes implied by ADR-114 and ADR-115 become verifiable rather than hand-checked.
- Below-boundary failures of real state leave a trace: audit writes, SRS increments, Storage cleanup, and notification delivery no longer "log to the user's own console and vanish" (W-17).
- If Q-4 answered: production errors are observed and the `/ingest` proxy carries real traffic. If not: the report-then-handle policy still lands and reports into the in-repo logging pipeline — the wave is deployable and valuable either way.

### Entry criteria

- **Wave 1 exit criteria 1–4 met.** Tests are written against the post-Wave-1 public API surface. Writing them first would mean rewriting their import blocks after T-101b.
- **T-116a specifically requires Wave 1's ledger (T-120a)** to record which swallow sites are deliberate-suppression-with-report versus fully surfaced.
- **Question-resolution item: Q-4** — *do production Sentry/PostHog credentials exist, who owns the projects, and what analytics scope was intended?* Answering class: [GCP]/[OPS] for credentials and ownership, [INTENT] for scope. Dispatched in Wave 1.

### Exit criteria (observable)

| # | Criterion | Source |
|---|---|---|
| 1 | `resolveRole`, `progress.service` SRS logic, and `lesson-save`'s diff writer each have direct tests (grep: `resolveRole`/`rbac` test references > 0, was 0) | ADR-117 SC-1 |
| 2 | Each of `ai`, `game`, `home`, `command-palette` has at least domain-logic unit coverage | ADR-117 SC-2 |
| 3 | Every collection with a `firestore.rules` block appears in the rules suite — lessons/cards/comments, `admins`, `system_logs`, `sharedProgress`, and the collection-group read all gain tests | ADR-117 SC-3 / OP-24 |
| 4 | The count of report-less swallows on real-state writes is **0** (was 17); `.catch(() => {})` on state-mutating writes is replaced by report-then-handle | ADR-116 SC-1 |
| 5 | At least one non-boundary layer (service / hook / action) reports errors — reporting exists below the four route boundaries, which today are the only reporting surface | ADR-116 SC-2 |
| 6 | Sentry/PostHog activation is **decided and recorded** against Q-4 — either live with confirmed credentials, or explicitly deferred with the reason logged in the ledger | ADR-116 SC-3 |
| 7 | All five test suites remain green in CI; the pre-commit gate is unchanged | kernel assumption |

### Gated items

| Task | Question | Answering-owner class | Fallback if unanswered |
|---|---|---|---|
| **T-116b** Activate Sentry | **Q-4** | [GCP]/[OPS] (credentials, project ownership) + [INTENT] (analytics scope) | **Do not delete the wiring.** ADR-116 rejected alternative 2 explicitly: it is "credential-gated, not dead; removing it presumes the credentials don't exist, which the repo cannot know." Record an explicit *deferred-with-reason* ledger row (which itself satisfies ADR-116 SC-3). Report-then-handle (T-116a) is live regardless and reports into the in-repo pipeline. |
| **T-116c** Activate PostHog | **Q-4** | same | Same. The analytics-scope half of Q-4 is a product decision ADR-116 defers to the owner; the near-empty PostHog surface is "widened or accepted by decision," never guessed. |

**Neither gated task is on the critical path**, and T-116a — the leg that carries the wave's value — is ungated. Q-4 is therefore a *value* risk, not a *schedule* risk.

### Parallelization note

This wave has the **largest clean handoff in the plan**. A second developer takes:
- **T-117d + T-117e** (13 d) — the rules suite and the four zero-coverage features share no files with T-117a/b/c or with T-116a, and nothing downstream depends on them.
- **T-116b + T-116c** (2 d) — S-sized, isolated, executable the moment Q-4 answers.

That removes **15 d of 34** from the critical developer, leaving T-117a → T-117b → T-117c → T-116a (19 d) as the wave's serial spine. This is also the wave most at risk of being cut under schedule pressure at team size 1 (34 d with no user-visible deliverable) — and cutting it invalidates the premise on which Waves 3–5 are sequenced.

---

## Wave 3 — Security & Data Layer

**Goal.** Replace the JS-readable bearer-token cookie with an httpOnly server-verified session, collapse per-mount listeners into per-entity subscriptions, and stop the UI from rendering invented data.

### Why this wave sits here

**User-facing correctness precedes internal contract convergence.** All three ADRs in this wave address top-ranked risks: ADR-107 covers **R-11** (risk rank 3 — non-httpOnly cookie + presence-only gate), ADR-113 covers **R-1** (risk rank 2 — progress fan-out and per-mount listener multiplication, blast radius "every authenticated screen"), and ADR-114 covers **R-2** (risk rank 5 — the unbounded public-lesson `collectionGroup` listener) plus **W-11/TD-8** (fabricated dashboard zeros). Wave 4's convergences are architecture-quality work; these are defects a user or an operator can be harmed by.

**The hard reason this wave precedes Wave 4.** ADR-106's decision is a "**single verified-identity action client** with per-action permission metadata." The identity it verifies is the session credential ADR-107 defines. Building T-106a against today's raw-ID-token transport would mean building it to be rewritten one wave later — and ADR-106's own trade-off warns that the converged client's "thin per-surface configuration must not regrow into two divergent clients." Starting from an unsettled credential is the surest way to regrow them. **T-107a → T-107b → T-106a is the plan's longest strictly-serial hard chain.**

**Why after Wave 2 rather than before.** ADR-107 replaces the client refresh loop with a server-minted session lifecycle (mint, refresh, revoke) — ADR-107's own trade-off calls this "real work replacing a client-only refresh loop." The regression surface is every protected and public route. T-107d (the E2E auth regression pass) is only meaningful against the e2e tier Wave 2 exercises, and T-116a's report-then-handle is what makes a failed session mint visible instead of swallowed.

**Why ADR-113 and ADR-114 ride along.** Both are structurally verified without production access and both are cheap relative to their risk rank. ADR-113 explicitly rejects deferring for measurement: "the structural multiplication is bucket-1 verified (R-1) and the corpus already has the target pattern in-repo" — `NotificationsContext` already mounts one app-lifetime shared listener, so this is applying an existing in-repo pattern, not inventing one. ADR-114's honest-UI leg is unconditional policy (P-9); only the analytics read-path disposition is gated.

### Tasks

| ID | Title | Size | ADR | Gate |
|---|---|:--:|---|---|
| T-107a | Introduce httpOnly session cookie issuance + server verification | L | ADR-107 | — |
| T-107b | Migrate client auth plumbing off the raw ID-token cookie | M | ADR-107 | — |
| T-107c | Align cookie lifetime to session semantics; edge gate becomes routing-only by contract | S | ADR-107 | — |
| T-107d | E2E auth regression pass across protected/public routes | M | ADR-107 | — |
| T-113a | Centralize `useUserProgress` into one shared subscription (currently one listener per mount × 10 consumers) | L | ADR-113 | — |
| T-113b | Audit remaining per-mount listeners; centralize per entity | M | ADR-113 | — |
| T-114a | Add explicit bounds to unbounded listeners (public-lesson collectionGroup first) | M | ADR-114 | — |
| T-114b | Replace fabricated dashboard zeros with absent-data rendering | M | ADR-114 | — |
| T-114c | Replace hardcoded-zero export rows with absent-data semantics | S | ADR-114 | — |
| T-114d | `analytics_daily` + `metadata/counters`: remove read paths or define a writer | M | ADR-114 | **[GATED Q-9]** |

**Size total: 33 d** (2 S, 6 M, 2 L). **Gated: 1.**

### Releasable outcome

- An XSS anywhere in the app no longer yields the session credential via `document.cookie`; the credential stops riding every same-origin request as a bearer token. For an admin's browser this closes the RC-4 amplification path from "every admin action" to "the SDK's in-memory token only."
- The "page loads, all actions fail" state — a 7-day cookie outliving a 1-hour token (W-15) — is gone.
- Mounting the dashboard no longer multiplies progress listeners: 10 `useUserProgress` consumers share one subscription. Firestore connection cost, client memory, and read-quota billing all drop by construction, and reconnect listener storms stop being possible.
- No listener can stream an unbounded corpus into a client — read cost per screen is bounded by construction.
- An operator can distinguish "healthy," "idle," and "unmeasured" on the admin surface built to answer exactly that question. The dashboard stops lying.

### Entry criteria

- **Wave 2 exit criteria 1, 4, 5, 7 met** — the auth and data paths this wave rewrites are covered, and failures during the migration report rather than vanish.
- T-107d requires the e2e tier green from Wave 2.
- **Question-resolution item: Q-9** — *what populates `analytics_daily` / `metadata/counters` in production?* Answering class: [DATA] / [GCP]. Note this is an external answer class scheduled two waves earlier than the kernel's "gated work late" heuristic — deliberate, because the *ungated* legs (T-114a/b/c) carry the wave's value and T-114d is a small M that can slip to Wave 5's gate-resolution block without breaking anything.

### Exit criteria (observable)

| # | Criterion | Source |
|---|---|---|
| 1 | The `auth-token` (or successor) cookie is `HttpOnly` — grep of the cookie-set path shows the flag, and the current non-httpOnly rationale comment is **gone** | ADR-107 SC-1 |
| 2 | A request with a forged or absent credential is rejected **by verification, not merely by presence** | ADR-107 SC-2 |
| 3 | No client code reads the session credential from `document.cookie`; the edge gate's role is documented in-repo as routing-UX only | ADR-107 SC-3 |
| 4 | E2E pass is green across protected and public routes, including the sign-in → refresh → revoke lifecycle | T-107d / kernel |
| 5 | Mounting N components that read one user's progress opens **one** listener, not N — the 10 `useUserProgress` sites share a subscription | ADR-113 SC-1 |
| 6 | Grep shows no per-component `onSnapshot` for the same entity across multiple consumers | ADR-113 SC-2 |
| 7 | Every collection / collectionGroup subscription carries an explicit bound; the public-lesson listener has a `limit()` | ADR-114 SC-1 |
| 8 | Admin metrics render a distinct "no data" state when the source is absent — **no code path substitutes a literal `0` for a missing metric**, in dashboards or in exports | ADR-114 SC-2 |
| 9 | `analytics_daily` / `metadata/counters` either have a defined in-repo writer or their read paths are removed — recorded against Q-9 in the ledger; no read path silently fabricates values | ADR-114 SC-3 |

### Gated items

| Task | Question | Answering-owner class | Fallback if unanswered |
|---|---|---|---|
| **T-114d** analytics read paths: remove or define a writer | **Q-9** | [DATA] / [GCP] | **Do not delete the reads.** ADR-114 rejected alternative 3: an out-of-repo aggregation pipeline may exist, and "deleting the reads could sever a live external contract." The standing default is the *honest-UI* half, which lands unconditionally in T-114b/c — fabricated-zero rendering is out of policy **now**, regardless of Q-9. T-114d stays a ledger row with an owner and a review-by date, and carries forward to Wave 5's gate-resolution block if needed. Exit criterion 8 holds either way; only criterion 9 is deferred. |

### Parallelization note

The wave splits cleanly along ADR lines — no shared files between the auth chain and the data-layer work:
- Dev 2 takes **T-113a + T-113b** (9.5 d), or **T-114a + T-114b + T-114c** (7 d), or both (16.5 d).
- Dev 1 holds **T-107a → T-107b → T-107c → T-107d** (13.5 d), which is irreducibly serial: each step depends technically on the previous.

With one handoff, the wave floors at 16.5 d instead of 33 d — the best parallelization ratio of any wave.

---

## Wave 4 — Contracts & Convergence

**Goal.** Collapse three write-path families to two on one action client, validate every server write at its boundary, and eliminate every inline re-derivation of the deck-access predicate.

### Why this wave sits here

**This is the wave with the widest write-path blast radius, so everything protective precedes it.** ADR-106's trade-off sizes it: converging families B and C "touches ~30 actions' plumbing plus their hooks (the `toActionResult` bridge and re-throw shims)." ADR-109 audits *every* server write path. ADR-115 converges 5 inline predicate sites. That is most of the repo's mutation surface changing in one wave — which is precisely why Wave 2's tests and Wave 3's settled session credential are entry criteria.

**The dependency on Wave 3 is hard, not stylistic.** ADR-106's decision text: families B and C "converge on a **single verified-identity action client** with per-action permission metadata." RC-11 establishes that B and C already "both end at `adminAuth.verifyIdToken` on the same kind of token, differing only in how it travels." Wave 3 changes what travels. Building T-106a first means building the convergence against a transport that Wave 3 replaces.

**T-115a contains the corpus's only discovered live bug, and it needs Wave 2's tests.** OP-5: `shared.service.ts`'s `isOwner` checks `lesson.roles?.[uid] === "owner"` while the canonical engine uses `ownerId ?? userId` — "the closest thing in the corpus to a discovered live bug," with the concrete consequence that "an owner [may be] denied access when their lesson lacks a `roles` self-entry." It is flagged bucket-1 and "urgent to examine regardless." Converging it safely requires `resolveRole` to be under test — which is exactly T-117b, two waves earlier and named in ADR-117 as "the ADR-115 convergence target."

**T-115b is deliberately built once and reused.** The kernel flags it: the automated vocabulary-agreement check (TS union ↔ rules list ↔ writers) is "the same mechanism as T-108's check — build once." ADR-108's success criterion 2 *requires* that check, and ADR-115's decision text confirms the shared mechanism ("the automated vocabulary check is new CI surface, **shared with ADR-108's check**"). Building it here, one wave before Wave 5 needs it, is why the two waves are in this order.

**ADR-109's deferral cost is the sharpest in the set.** TD-5's cost-of-delay is High: "retrofitting the schema later meets non-conforming stored data … **Deferral converts a code fix into a data migration**" — ADR-109 notes this is "the exact trap ADR-108 is stuck in." Every wave this slips, Firestore accumulates more unvalidated non-primary fields.

### Tasks

| ID | Title | Size | ADR | Gate |
|---|---|:--:|---|---|
| T-109a | Audit every server write path; wire zod validation at each boundary | L | ADR-109 | — |
| T-109e | Standardize multi-field forms on react-hook-form + zodResolver | M | ADR-109 | — |
| T-109b | `cardContentSchema`: enforce or delete | M | ADR-109 | **[GATED Q-12]** |
| T-109c | `privacyModeSchema`: enforce or delete | S | ADR-109 | **[GATED Q-12]** |
| T-109d | `publicRoleSchema`: enforce or delete | S | ADR-109 | **[GATED Q-12]** |
| T-115a | Converge the 5 inline deck-access predicates onto the engine, incl. the semantically divergent one *(+ CS-2 rider: the `ShareModal.tsx` split)* | L | ADR-115 | — |
| T-115b | Automate vocabulary-agreement check (TS union ↔ rules list ↔ writers). **Same mechanism as T-108's check — build once.** | M | ADR-115 | — |
| T-115c | Align the 3 divergent admin-authority predicates | M | ADR-115 | **[GATED Q-10]** |
| T-106a | Build the unified verified-identity action client with per-action permission metadata | L | ADR-106 | — |
| T-106b | Migrate `adminActionClient` call sites | L | ADR-106 | — |
| T-106c | Migrate idToken bind-arg `actionClient` call sites | M | ADR-106 | — |
| T-106d | Remove the superseded client(s) | S | ADR-106 | — |

**Size total: 44 d** (3 S, 5 M, 4 L). **Gated: 4.** *(Largest wave in the plan.)*

> **Cross-cutting riders in this wave.**
> - **CS-2 hard-ceiling split — `ShareModal.tsx` (436 lines)** folds into **T-115a**, per `01-Validated-Backlog.md` §2.1 M-5: T-115a is the first task that edits ShareModal's *body* (its inline deck-access predicate, one of the five UR-1 re-derivations). This is the plan's only >400-line non-test file, so **the CS-2 hard-error rule becomes adoptable at the end of Wave 4, not Wave 6.** T-104a and T-110a cross-reference the split rather than repeating it.
> - **T-115b's notification target runs report-only** — see the staging note below.

> **T-115b staging note (resolves the W4→W5 ordering).** T-115b builds the vocabulary-agreement check in Wave 4, but one of its targets is the notification union that **T-108a widens in Wave 5**. Run failing from Wave 4, the check would be red-by-design against a divergence already scheduled to be fixed — which is the standards-decay pattern the whole decision set guards against. **Resolution (per `01-Validated-Backlog.md` §5.4): stage the *target*, not the task.** The mechanism ships in Wave 4 and fails on every already-converged vocabulary; the notification target runs **report-only** until T-108a lands, then flips to failing. **No wave reassignment is needed** — this is recorded in both T-115b's and T-108a's acceptance criteria.

> **Deployability warning.** T-106d must land in the same wave as T-106b and T-106c, and after both. Removing a superseded client while any call site still uses it breaks the build — the kernel's "every wave ends deployable" rule makes this ordering non-negotiable, not merely preferred.

### Releasable outcome

- **One** token-verification implementation and **one** permission-metadata grammar for every server mutation. The security-review surface becomes one client plus the Firestore rules — down from three families with three auth transports and three error shapes.
- Every server action declares `.metadata({ permission })`, extending S-4's compile-time property ("an action *cannot be defined* without declaring its required permission") from admin to all server mutations.
- Every card/lesson write is validated by a live schema or by an explicitly-chosen narrower validator. No path claims a protection it lacks; the "source of truth" headers become true or gone.
- The cloze `___`-token invariant that study mode depends on gains a write-time guard — RC-6's named runtime-bug risk closes.
- Deck-access decisions have one implementation. The `isOwner` behavioral divergence is corrected; a privacy-model change lands in the engine rather than in 5+ hand-synced copies, and the automated check catches any rules/writer disagreement.

### Entry criteria

- **Wave 3 exit criteria 1–4 met** — the session credential is settled; T-106a builds against its final shape.
- **Wave 2 exit criterion 1 met** — `resolveRole` and flashcard data services green before T-115a and T-106b touch them.
- **Question-resolution items: Q-12** (dispatched in Wave 1 — [INTENT], no production access needed) and **Q-10**.
  - **Q-12** — *where were `cardContentSchema` / `privacyModeSchema` / `publicRoleSchema` meant to be enforced?* Author intent. Note ADR-109's framing: unfinished-adoption and overtaken-artifact "imply opposite treatments," which is why the disposition is per-schema and gated rather than guessed.
  - **Q-10** — *how is admin authority provisioned (first superadmin; claims vs `admins/{uid}`)?* [OPS] / [GCP].

### Exit criteria (observable)

| # | Criterion | Source |
|---|---|---|
| 1 | `lib/safe-action.ts` (or successor) exports **one** action client; grep shows no parallel `adminActionClient` / `actionClient` verification implementations | ADR-106 SC-1 |
| 2 | Grep: **zero** server actions without `.metadata({ permission })` (today only family B has this) | ADR-106 SC-2 |
| 3 | The family-choice criterion (a-vs-b: privileged? cross-user?) is written at the client's definition site, replacing the two-families docstring | ADR-106 SC-3 |
| 4 | No route handlers exist — PC-6's zero-route-handler property is preserved as a rule | ADR-106 decision |
| 5 | No exported schema has a "source of truth" header while having zero non-test consumers — each is imported by a write path or removed | ADR-109 SC-1 |
| 6 | A card write violating a non-primary constraint (over-long `meaning`, malformed cloze) is rejected on at least one enforced path, **or** the constraint is explicitly documented as unenforced-by-decision | ADR-109 SC-2 |
| 7 | Multi-field forms use react-hook-form + zodResolver; trivial single-input cases may remain controlled-state | ADR-109 SC-3 |
| 8 | Grep for inline deck-access derivations outside the engine (`roles?.[uid]`, `allowLinkAccess \|\| isPublic`, ad-hoc owner checks) returns **zero** | ADR-115 SC-1 |
| 9 | `isOwner` semantics match the engine's `ownerId ?? userId` **everywhere** — the OP-5 divergence is gone | ADR-115 SC-2 |
| 10 | An automated check fails when a converged vocabulary's union, rules list, and writer disagree; the **notification target is wired in report-only mode** pending T-108a; the two RBAC engines remain separate and separately documented | ADR-115 SC-3 + §5.4 staging |
| 11 | The per-schema disposition (enforce/delete) for the three schemas is recorded against Q-12 in the ledger | ADR-109 SC-3 |
| 12 | **Rider:** `ShareModal.tsx` is split by responsibility below the 400-line hard ceiling, following real seams rather than line count — the CS-2 hard-error rule becomes adoptable | CS-2 / backlog M-5 |

### Gated items

| Task | Question | Answering-owner class | Fallback if unanswered |
|---|---|---|---|
| **T-109b** `cardContentSchema` | **Q-12** | [INTENT] author | **Do not guess either branch.** ADR-109 rejects both "enforce all three blind" (enforcement against non-conforming stored data is a data migration, not a code change) and "delete all three now" (if these are the intended validators, deletion discards the correct target state). Fallback: the schema sits in a documented **pending-disposition** ledger row — a state ADR-109 explicitly sanctions. Exit criterion 5 is still satisfiable in the interim by correcting the misleading header. |
| **T-109c** `privacyModeSchema` | **Q-12** | [INTENT] author | Same. |
| **T-109d** `publicRoleSchema` | **Q-12** | [INTENT] author | Same. |
| **T-115c** align the 3 divergent admin-authority predicates | **Q-10** | [OPS] / [GCP] | **No alignment.** The standing default is that the three divergent predicates **stay as-is**; ADR-115 converges them "only after the live source is known." R-8 (admin bootstrap out-of-band, risk rank 7) remains an open risk with a ledger row, not a silently-carried assumption. Note the deck-sharing leg (T-115a) is **ungated** and carries the wave's ADR-115 value regardless. |

Q-12 is [INTENT] and needs no production access — of all sixteen gates in the plan, it is the cheapest to obtain and should have been dispatched in Wave 1.

### Parallelization note

- Dev 2 takes **T-115a + T-115b** (9.5 d) — predicates and CI checks live in different layers from the action-client transport; no file overlap with T-106a–d.
- Or dev 2 takes **T-109e** (3 d, forms) plus **T-109b/c/d** (5 d) once Q-12 answers — 8 d, fully independent of the T-106 chain.
- Dev 1 holds **T-106a → T-106b → T-106c → T-106d** (19.5 d), of which only T-106b/T-106c can overlap each other (both depend on T-106a, neither on the other) — a third developer could take T-106c while dev 1 runs T-106b.

**T-109a is the one task that should not be parallelized away from the T-106 chain**: it audits the write boundaries that the converged client defines. Running it against two clients means auditing twice.

---

## Wave 5 — Migration Completion

**Goal.** Close the notification migration and give every dormant surface a verdict — deleted, or claimed with an owner and a completion step.

### Why this wave sits here

**Gate-heavy by construction — 8 of 10 tasks gated on 6 distinct questions.** This is the deliberate application of the kernel's "gated work late so answers have time to arrive." By Wave 5, Q-5, NQ-1, Q-6, Q-8, Q-11, Q-13, and Q-17 have had four waves of calendar time (roughly 14 sprints at team size 1) to be answered.

**It carries the corpus's top-ranked debt.** TD-1 (notification migration frozen mid-flight) is **rank 1, score 8**. ADR-108 describes the state precisely: a 4-value TS union while the codebase writes 10 distinct runtime values, so "any exhaustive switch silently mishandles 6 of 10 values," alongside "a full migration's machinery frozen mid-flight: four `@deprecated` fields, dual read paths, dual composite indexes, an unrun-status backfill script, and a runbook heading 'Pending index & rules deploy (**NOT yet deployed**)'." Clusters C1 + C2 are the corpus's largest single validation-blocked mass.

**ADR-119 is gated by the most distinct questions of any decision** (Q-6, Q-8, Q-11, Q-13, Q-17), each independently defaulting to *delete-unless-claimed*. That is exactly the profile that must be scheduled late.

**But the union widening is ungated and lands regardless.** ADR-108 splits cleanly: "the *type-vs-runtime* half is a pure code fact needing no production access (W-7 is bucket 1)" while "the *retirement* half" is gated on Q-5 and NQ-1. T-108a is therefore schedulable now and is on the critical path; T-108b/c/d are not.

**Dependency on Wave 4.** T-115b's automated vocabulary-agreement check is what makes T-108a's widening machine-verified rather than hand-checked — ADR-108's success criterion 2 requires it, and the kernel directs it to be built once, in Wave 4. **Dependency on Wave 1:** T-119b disposes of the `ActivityAction` / `LogSource` vocabulary that T-103a *relocates* to `lib/logging`. Deleting members from a vocabulary mid-relocation is a conflict; relocate first (Wave 1), dispose after (Wave 5).

### Tasks

| ID | Title | Size | ADR | Gate |
|---|---|:--:|---|---|
| T-108a | Widen `NotificationType` union to the 10 values actually written (incl. `digest`) | S | ADR-108 | — **Ready (Q-7 default in force)** |
| T-108e | Ledger entry recording the migration's end state and current stage | S | ADR-108 | — |
| T-108b | Verify/complete the index + rules deployment the runbook flags as "NOT yet deployed" | M | ADR-108 | **[GATED NQ-1]** |
| T-108c | Legacy-data verdict → retain or remove the 4 `@deprecated` fields | M | ADR-108 | **[GATED Q-5]** |
| T-108d | Collapse dual read paths + dual indexes to one | L | ADR-108 | **[GATED Q-5]** |
| T-119a | 7 dormant `NotificationKind`s: delete or complete | M | ADR-119 | **[GATED Q-8]** |
| T-119b | 8 `ActivityAction`s + `cloud_function` `LogSource`, incl. the kana-practice logging gap: delete or complete | M | ADR-119 | **[GATED Q-11]** |
| T-119c | Handler-less admin buttons + Settings stub + orphan `canChangeSettings` | M | ADR-119 | **[GATED Q-13]** |
| T-119d | `fanOutNotifications` callable: delete or wire | M | ADR-119 | **[GATED Q-6]** |
| T-119e | Storybook toolchain + unreferenced scaffold SVGs: delete or adopt | M | ADR-119 | **[GATED Q-17]** |

**Size total: 29.5 d** (2 S, 7 M, 1 L). **Gated: 8.**

> **T-108a is Ready, not unconditionally ungated.** The kernel marks it ungated, which is defensible — **Q-7's standing default *is* "the union widens to the 10 written values,"** so the direction is pre-committed and an answer can only confirm it or trigger a named alternate branch. But Q-7 remains an open [INTENT] question in 07-Open-Questions Group A. Recorded as **Ready (Q-7 default in force)** so no reader concludes the question is closed (`01-Validated-Backlog.md` §5.6).

> **⚠ This wave contains the end of the critical path — and that end is gated.** The fixed spine terminates `… → T-109a → T-108a/d`. **T-108a is Ready and can complete; T-108d is Q-5-gated and cannot.** The critical path therefore **cannot complete on in-repo work alone** — its final step terminates on a live-data answer that no amount of engineering produces. Treat the path as ending at **T-108a (66.5 d)** with T-108d as a gate-bound tail (+6.5 d). This wave's question-resolution item must open **Q-5 early enough that the tail is not the schedule's blocker** — which is why Wave 1 dispatches it. See file 06 §4, risk 1.

### Releasable outcome

**Unconditionally (T-108a, T-108e, and whatever gates cleared):**
- `NotificationType` describes the data the codebase actually stores. Exhaustive handling, preference matrices, and analytics keyed on `type` become correct on live data, and a deliberately non-exhaustive switch fails typecheck instead of silently mishandling 6 of 10 values.
- The migration has an explicit completion condition, current stage, owner, and review-by date — converting RC-3's permanent-transitional state into a tracked, closeable one. ADR-108's own framing: "a concrete removal PR becomes safe the moment Q-5/NQ-1 are answered."

**Conditionally (gates cleared):**
- The capability-ahead-of-consumer stratum stops growing and starts shrinking; readers can trust that a declared vocabulary member has a producer or a claimed gate.
- Admin operators stop seeing three buttons that silently do nothing (TD-7's trust defect).
- Activity analytics stop undercounting kana practice — an undercount TD-6 notes "widens daily."

> **The releasable outcome named in the kernel — "notification migration closed" — is conditional on Q-5 and NQ-1.** If they do not answer, the migration does not close; the dual machinery is *retained* and the ledger row stays open with a new review-by date. That is the correct outcome, not a failure: NS-8 states plainly that **nothing legacy-compatible is stripped before its gate answers**. Saying so is required by the kernel's readiness rules rather than pretending readiness.

### Entry criteria

- **Wave 4 exit criterion 10 met** — the automated vocabulary-agreement check exists (T-115b), so T-108a's widening is machine-verified against the rules list and the writer.
- **Wave 1 exit criteria 7 and 11 met** — the log-type vocabulary has one home (a precondition for T-119b) and the ledger exists (a precondition for T-108e and for every delete-unless-claimed row).
- **Question-resolution item — the largest in the plan.** This wave needs answers to **six** questions:

| Question | Needs | Class | Blocks |
|---|---|---|---|
| **Q-5** | A live Firestore data sample: do legacy-shape docs still exist? Was the backfill run? Are indexes/TTL deployed? | [DATA] + [OPS] | T-108c, T-108d |
| **NQ-1** | Is `docs/testing-notifications.md`'s "NOT yet deployed" status still current? | [OPS] / [GCP] | T-108b |
| **Q-8** | Which of the 7 inactive `NotificationKind`s are still intended to ship? | [INTENT] product owner | T-119a |
| **Q-11** | Are the 8 never-emitted `ActivityAction`s + `cloud_function` `LogSource` planned or dead? | [INTENT] product owner | T-119b |
| **Q-13** | Intended behavior of admin Quick Actions, Settings stub, `canChangeSettings`? | [INTENT] product owner | T-119c |
| **Q-6** | Are the Cloud Functions deployed/operating; do `APP_ID` vars agree in prod? | [GCP] / [OPS] | T-119d *(and T-118b's old-var retirement)* |
| **Q-17** | Is Storybook adoption active; are the scaffold artifacts deliberate? | [INTENT] author | T-119e |

Q-8, Q-11, Q-13, and Q-17 are four questions for **one** product-owner conversation. Booking that single conversation in Wave 1 de-risks 4 of this wave's 8 gates at near-zero cost.

### Exit criteria (observable)

| # | Criterion | Source | Conditional? |
|---|---|---|---|
| 1 | `NotificationType` (or successor) enumerates the **10** stored values; a deliberately non-exhaustive switch over it fails typecheck | ADR-108 SC-1 | No |
| 2 | T-115b's check is **moved from report-only to failing** on the notification target — union, writer, digest value, and `firestore.rules` list now agree, and any future divergence fails CI | ADR-108 SC-2 + §5.4 staging | No |
| 3 | The ledger carries the notification migration with its removal gate (Q-5 / NQ-1), current stage, owner, and review-by date | ADR-108 SC-3 | No |
| 4 | Deprecated fields and dual indexes are removed **within one change** once the gate clears | ADR-108 SC-3 | **Yes — Q-5/NQ-1** |
| 5 | Every dormant surface named in ADR-119 is either removed or has a **claimed gate** recorded in the ledger with an owner and a completion step — **none remains in undocumented limbo** | ADR-119 SC-1 | No *(the ledger row satisfies it either way)* |
| 6 | The kana-practice logging asymmetry is gone: practice either logs a completion like quiz/survival, or `KANA_PRACTICE_COMPLETED` is deleted (grep: the three modes are symmetric) | ADR-119 SC-2 | **Yes — Q-11 direction** |
| 7 | No declared enum member has zero producers without a ledger entry marking it claimed-roadmap; `canChangeSettings` is either required by an action or removed from the matrix | ADR-119 SC-3 | **Yes — Q-13** |

Criterion 5 is the wave's honest floor: **even with every gate unanswered, "none remains in undocumented limbo" is achievable** — because a ledger row *is* the recorded state. That is what makes this wave deployable regardless of answers.

### Gated items

| Task | Question | Answering-owner class | Fallback if unanswered |
|---|---|---|---|
| **T-108b** verify index + rules deploy | **NQ-1** | [OPS] / [GCP] | **Retain** dual indexes/queries/fields. The deliverable degrades from "deploy verified" to "deploy state recorded as unknown, with the runbook note dated" — a stale note that outlived a deploy "would be worse than none" (TD-1f). |
| **T-108c** legacy `@deprecated` fields verdict | **Q-5** | [DATA] + [OPS] | **Retain all four fields.** They "are assumed load-bearing until a data sample proves otherwise." |
| **T-108d** collapse dual read paths + indexes | **Q-5** | [DATA] + [OPS] | **Do not collapse.** ADR-108 rejected alternative 3 is unambiguous: "cleaning up the `read` dual-write without confirming the backfill ran *would silently hide pre-migration notifications from users*." This is the one fallback in the plan that is strictly *do nothing* — and it sits at the tail of the critical path (file 06, schedule risk 1). |
| **T-119a** 7 dormant `NotificationKind`s | **Q-8** | [INTENT] product owner | **Delete** — each unclaimed kind removed with its registry entry, schema, and collapse weight. |
| **T-119b** 8 `ActivityAction`s + `cloud_function` `LogSource` | **Q-11** | [INTENT] product owner | **Delete** unclaimed members. The kana-practice gap is the exception: it is a *proven omission*, not an intent unknown, and is "resolved in the direction its gate answers (log it, or drop the enum)" — **never left asymmetric**. |
| **T-119c** handler-less admin buttons + Settings stub + `canChangeSettings` | **Q-13** | [INTENT] product owner | **Delete** (behavior-neutral). Removal must preserve the admin overview layout minus the card, and the resolution of the `PermissionSet` matrix's 7 remaining live permissions (P-5). |
| **T-119d** `fanOutNotifications` callable | **Q-6** | [GCP] / [OPS] | **Delete** the un-called callable unless an operator invocation is confirmed. Same answer also retires T-118b's superseded `APP_ID` env var. |
| **T-119e** Storybook toolchain + scaffold SVGs | **Q-17** | [INTENT] author | **Delete** the toolchain (8 packages, 1 story) + scaffold SVGs unless active adoption is claimed. |

**All eight fallbacks are pre-committed positions.** Per 07-Open-Questions: "the gate answer can only confirm the default or trigger the named alternate branch." No fallback in this wave requires a judgment call at execution time.

### Parallelization note

The cleanest two-dev split in the plan, because the two ADRs share no files:
- Dev 2 takes **the entire ADR-119 branch** (T-119a–e, 15 d) — five mutually independent gated tasks that can be executed in whatever order their gates answer.
- Dev 1 takes **the ADR-108 branch** (T-108a–e, 14.5 d).

A useful property: because ADR-119's five tasks are independent of each other, they parallelize across *any* number of developers, and each is individually shippable the moment its own question answers. This wave degrades gracefully — it does not require all gates to clear at once.

---

## Wave 6 — Structure & Patterns

**Goal.** Bring placement, dialog, table, and pagination patterns to parity, in a codebase that is finally quiet.

### Why this wave sits here

**These are the widest merge-conflict generators in the set, so they go last.** The kernel's rationale — "placement/pattern moves last because they cause the widest merge conflicts" — is sized by the ADRs:
- **T-105a** relocates four screens (483 lines) plus every import site referencing them, and dissolves the `app → game` dependency edges that "exist *only* because of these files" (W-5).
- **T-104a** dissolves "a flat 27-file `components/` directory mixing sharing, comments, builder, import and practice concerns" inside a feature of 146 files / 16,940 lines — 34% of `src/` and 46% of feature code (W-4).
- **T-111a** rewrites Reports from a bespoke virtualized list into an engine-driven view.

Every one of those touches files that Waves 3, 4, and 5 are actively rewriting (flashcard data services, share/access components, admin actions). Running them concurrently would collide on exactly the hottest files in the repo, at a team size where there is no second pair of eyes to resolve a bad merge.

**They are also the lowest-priority band and the most behavior-neutral.** ADR-104, 105, 110, and 111 are all **P2**; ADR-112 is **P3** — the lowest priority in the entire set. All are governed by P-5 (behavior preservation): ADR-105 calls its move "behavior-neutral but churny." Deferring the lowest-priority, most-conflict-prone, least-behavior-changing work is the correct trade at team size 1.

**One genuine dependency, not just a preference.** ADR-104's internal barrels sit *behind* the curated root barrel T-101a creates, and T-104b extends the very ESLint rule T-101c installs. ADR-104's rejected alternative 2 makes the coupling explicit: "with ADR-101 in force, a single root barrel over a 27-file grab-bag becomes a 100-export non-API." T-104a is the task that prevents T-101a's barrel from degenerating into "everything is public" — the trade-off ADR-101 itself flags.

**Why ADR-112 is last within the last wave.** It records the two sanctioned pagination mechanisms and adds a review gate against a third. It is an S, it changes no behavior, and its value is entirely preventative — the natural closing task.

### Tasks

| ID | Title | Size | ADR | Gate |
|---|---|:--:|---|---|
| T-105a | Relocate kana-survival screens to `features/kana/survival/` | M | ADR-105 | — |
| T-105b | Route-layer audit: remaining `_components` are orchestrator-only | M | ADR-105 | — |
| T-104a | Define flashcard sub-module boundaries + internal barrels | L | ADR-104 | — |
| T-104b | Enforce internal boundaries via lint | S | ADR-104 | — |
| T-110a | Converge the straggler backdrop onto `DialogChrome` | S | ADR-110 | — |
| T-110b | `Drawer`: delete, or adopt with the two bespoke panels converging on it | M | ADR-110 | **[GATED NQ-3]** |
| T-111a | Migrate Reports onto the shared react-table engine | L | ADR-111 | — |
| T-112a | Record both pagination mechanisms as the sanctioned two; add the review gate against a third | S | ADR-112 | — |

**Size total: 25 d** (3 S, 3 M, 2 L). **Gated: 1.**

### Cross-cutting riders (fold in, do not duplicate)

Per the kernel, these are **not separate tasks** — they ride along with whichever task next touches the file:

- **CS-2 tiered file-size ceiling** (green ≤250 / review 251–400 / **hard-error >400**) applies as each file is touched. The single >400-line non-test file is **`ShareModal.tsx` (436)** — already flagged by W-4/CX-2 and, per CS-2, "the deepest/longest function" in the repo. **The split is folded into T-115a in Wave 4** (`01-Validated-Backlog.md` §2.1 M-5): T-115a is the first task to edit ShareModal's body, via its inline deck-access predicate. **T-104a and T-110a cross-reference that split rather than repeating it** — by the time Wave 6 begins, the file is already below the ceiling. CS-2's adoption note explains why this matters: "adopting the 400 hard-error requires splitting exactly one non-test file, `ShareModal.tsx`" — so the hard-error rule becomes adoptable at the end of **Wave 4**, not here.
- **Raw-hex token cleanup** (UR-3: 38 arbitrary-value hex classNames across 29 files, several hardcoding the exact value of an existing token) rides with the dialog and table work — **T-110a** and **T-111a**. The one legitimate carve-out stays: `chartTheme.ts`'s documented recharts exception, since raw SVG attributes cannot resolve Tailwind classes.
- **TD-3 note.** Turning the *200-line* ceiling from warn to error and clearing its 44 files is **not in this plan.** 06-Decision-Matrix §2a flags TD-3 (top-10 debt, rank 5) as having **no dedicated decision** — a "deliberate deferral, not an oversight." It is recorded here so its absence is auditable, not mistaken for coverage.

### Releasable outcome

- `app → game` and the deep `app → kana` edges disappear; feature-scoped search and tooling see all of kana; the survival page becomes a thin orchestrator like its 29 sibling pages (S-2). Future placement questions have a mechanical answer: **does it import feature internals? then it is feature code.**
- Flashcard's internals reorganize freely behind a stable external contract; the hot oversized files become sub-module-local concerns; a future split (if ever justified) becomes a directory move of already-bounded modules rather than surgery.
- Backdrop, focus-trap, Escape, and scroll behavior are guaranteed for every overlay regardless of tier. The shared-UI inventory stops advertising an unused-but-canonical-looking `Drawer`.
- "Admin grid" has **one** behavior contract — sorting, selection, and filtering semantics uniform across Users, Content, and Reports.
- The pagination surface stays at two documented mechanisms, with the absence of offset pagination and `useInfiniteQuery` protected as a checkable property.

### Entry criteria

- **Wave 1 exit criteria 1–3 met** — T-104b extends the ESLint rule T-101c installs; T-104a's internal barrels are defined against T-101a's root-barrel contract.
- **Waves 3–5 complete.** This is a *quiet-codebase* precondition, not a technical one: the auth, write-path, and notification-vocabulary rewrites must be done before the widest-churn relocations begin.
- **Question-resolution item: NQ-3** — *was `Drawer` built for `DeckDetailsPanel`/`AdminSidebar` (adoption pending), or speculatively (removable)?* [INTENT] author. NQ-3 is recorded as **resolved-by-decision** (default = delete) with an owner veto available.

### Exit criteria (observable)

| # | Criterion | Source |
|---|---|---|
| 1 | No `_components/` file under `app/` imports feature hooks / domain / services — the dependency test holds, grep-verifiable | ADR-105 SC-1 |
| 2 | `features/kana/survival/` exists with the four screens; the survival route page is an orchestrator comparable to its siblings | ADR-105 SC-2 |
| 3 | The placement rule is written in-repo and citable in review, closing CX-9's absent-tiebreaker gap | ADR-105 SC-3 |
| 4 | `features/flashcard` consists of named sub-modules each with a barrel; the flat `components/` directory **no longer exists** | ADR-104 SC-1 |
| 5 | Cross-sub-module imports inside flashcard go through sub-module barrels (grep-verifiable) | ADR-104 SC-2 |
| 6 | The flashcard root barrel is a **curated export list**, not an `export *` chain over all sub-modules | ADR-104 SC-3 |
| 7 | Every `Dialog.Root` composition routes backdrop/close through `DialogChrome`; grep shows no overlay uses a hardcoded backdrop className — `DIALOG_BACKDROP_CLASSNAME` is the only backdrop source | ADR-110 SC-1 |
| 8 | `Drawer` has **≥1 render site (adopted) or is removed from the barrel and tree (deleted)** — no zero-consumer exported drawer remains | ADR-110 SC-2 |
| 9 | Reports renders through `useDataTable` (grep: no parallel table/list shell duplicating the engine's role), **or** an owner-recorded constraint documents why not | ADR-111 SC-1 |
| 10 | The table engine has one home; it moves to a shared layer only in the change that introduces a third, non-admin consumer (three-use rule, P-10) | ADR-111 SC-2 |
| 11 | Grep confirms no offset pagination and no `useInfiniteQuery`; each of the two mechanisms carries its channel-rationale docstring at its definition | ADR-112 SC-1, SC-2 |
| 12 | **Rider:** no non-test file exceeds 400 lines (`ShareModal.tsx` split landed in Wave 4 via T-115a); the >400 lint rule is set to `error` | CS-2 |
| 13 | **Rider:** zero arbitrary-value hex classNames outside the documented `chartTheme.ts` carve-out (was 38 across 29 files) | CS-14 / UR-3 |

### Gated items

| Task | Question | Answering-owner class | Fallback if unanswered |
|---|---|---|---|
| **T-110b** `Drawer`: delete or adopt | **NQ-3** — a **veto window, not a blocker** | [INTENT] author | **Delete, on default.** NQ-3 is listed in 07-Open-Questions §0 as **closed — resolved-by-decision** (default = delete) with an owner-veto note; the kernel nonetheless marks T-110b `[GATED]`, making it the lone inconsistency among the five resolved-by-decision questions (`01-Validated-Backlog.md` §5.3). Practically this task is **Ready-on-default and cannot stall**: absent a veto, `Drawer` is deleted and the two bespoke slide-panels stay hand-composed via `DialogChrome`. A veto — `Drawer` was genuinely built *for* `DeckDetailsPanel`/`AdminSidebar` — flips it to adoption, with both panels converging onto it. Either branch satisfies exit criterion 8; ADR-110's rejected alternative 3 rules out deferring indefinitely, because "an unused primitive that looks canonical while the real drawers ignore it actively misleads the next author." |

**Owner-veto watch (not a gate, but plan-relevant).** Two Wave-6 tasks carry a recorded veto note: **T-105a** (NQ-5 — was route-private `_components/` for single-route screens a considered exception?) and **T-111a** (NQ-4 — are Reports' variable-height, non-columnar log entries a deliberate constraint?). Both are resolved-by-decision, so both are schedulable. ADR-111's trade-off names the risk concretely: converging Reports "could hit a genuine constraint mid-implementation — if so, NQ-4's owner veto is the escape hatch, recorded rather than silent." **T-111a is the one task in the plan most likely to be abandoned mid-execution**; its exit criterion 9 is written with that branch built in ("or an owner-recorded constraint documents why not").

### Parallelization note

The wave splits along three non-overlapping file territories:
- Dev 2 takes **T-111a + T-112a** (7.5 d) — admin-only files, zero overlap with kana or flashcard.
- Dev 3 (or dev 2 after the above) takes **T-110a + T-110b** (4 d) — shared UI and two bespoke panels.
- Dev 1 holds **T-105a → T-105b** and **T-104a → T-104b** (13.5 d) — the two relocation chains, which should stay with one person precisely because they are the merge-conflict-prone ones.

With two developers the wave floors at ~13.5 d instead of 25 d.

---

## Cross-wave notes

**Every wave ends deployable.** The rule has three concrete enforcement points in this plan: T-101c cannot land before T-101b (the rule at `error` with 43 violations breaks the pre-commit gate); T-102c cannot land before T-102b (the rule fails while the back-edge exists); and T-106d cannot land before both T-106b and T-106c (removing a client with live call sites breaks the build). These are noted at their waves and again in file 05.

**Where the plan is deliberately silent.** Six areas are left undecided by the ADR set, and this plan does not manufacture tasks for them: runtime magnitudes (NQ-14 — no profiling exists), the 200-line ceiling and its 44 files (TD-3 — deliberately deferred), single-author knowledge concentration (R-12 — mitigated by T-120a/b, T-117*, T-118c, not resolved), privacy-posture product questions (R-3/NQ-7 leaderboard PII, R-18/NQ-8 world-readable card images, W-14/NQ-10 the no-SSR model), hosting (Q-2 → T-118d, not schedulable), and three unrun in-repo audits (NQ-11 transaction invariants, NQ-12 sanitization paths, NQ-13 accessibility). Each is [REPO]-class and could be queued as audit work; none is a decision this plan may make.
