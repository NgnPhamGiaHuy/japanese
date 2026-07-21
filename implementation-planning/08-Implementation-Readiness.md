# 08 — Implementation Readiness

**Phase 11 — Implementation Planning.** This document answers one question per sprint: **can the team start this, today, without discovering a blocker halfway through?** It is a verdict document, not a plan document.

- **Binding input:** the planning kernel. **Errata applied:** the kernel's heading says "50 tasks"; it enumerates **63** — 62 wave-assigned + T-118d unscheduled. **16 gated · 46 ready · 1 open.** Per-wave gated counts: W2 2 · W3 1 · W4 4 · W5 8 · W6 1.
- **Sprint boundaries:** `03-Sprint-Plan.md` — **29 sprints**, authoritative. This file assesses those sprints, not a derived decomposition.
- **Task detail:** `01-Validated-Backlog.md` is authoritative for acceptance criteria, standards, regression scope and rollback **per task**. This document does not restate them; it verifies they exist and are sufficient, and issues the sprint verdict. Wave-level entry/exit criteria are `02-Execution-Waves.md`'s.
- **Source of truth:** `architecture-decision/` — ADR-101 … ADR-120 (`03`), gates and answering-owner classes (`07-Open-Questions.md`), coverage caveats (`06-Decision-Matrix.md`), CS-1 … CS-14 (`04`), and the "what NOT to simplify" guards NS-1 … NS-8 (`05`).
- **Execution risks** are `07-Risk-and-Mitigation.md`'s X-1 … X-14, referenced by ID.
- **Honest labeling.** This is derived-from-decisions planning, not backlog validation. `engineering-tasks/` and `requirements-consolidation/` do not exist, so no requirement-ID or recommendation-ID is cited; traceability runs task → ADR → driving findings → corpus.

---

## 1. Readiness rules applied

A sprint is **NOT READY** if **any** of the kernel's six conditions holds:

| # | Condition | How it is tested here |
|---|---|---|
| 1 | Unsatisfied dependency | Every input is either already in the repo, or produced by a **preceding sprint in this plan**, or a pre-flight item (§5) |
| 2 | An unanswered gate with no defined fallback | Per kernel gate-rule 1, a `[GATED]` task is NOT READY until its question answers — **regardless of fallback**. The fallback governs what ships anyway; it does not confer readiness |
| 3 | Missing acceptance criteria | Verified against `01-Validated-Backlog.md`: every task must carry observable, testable criteria |
| 4 | Undefined regression scope | Verified against `01-Validated-Backlog.md`'s per-task **Regression scope** field |
| 5 | No rollback path | Verified against `01-Validated-Backlog.md`'s per-task **Rollback** field, plus the sprint's deployable-end guarantee |
| 6 | No applicable test tier | At least one of the five affirmed suites proves the change |

**Two clarifications that determine how the verdicts read:**

- **Condition 1 is assessed as "in-plan," not "already done."** Otherwise only Sprint 1 could ever be READY and the document would be useless. **READY** means: *nothing outside this plan blocks it.* Sprint N's dependency on Sprint N−1 is satisfied by the plan; a dependency on an unanswered external question is not.
- **Wave 5's gated sprints are expected to be NOT READY.** The kernel says so plainly and this document says so plainly — **all five of Sprints 21–25 are NOT READY**, carrying eight of the sixteen gated tasks. Marking them READY would be a false signal. Every NOT READY verdict below names a **partial-start scope** where one exists, so a NOT READY verdict never silently means "do nothing."

**Verification note.** Conditions 3, 4 and 5 were checked against `01-Validated-Backlog.md` and hold for all 62 wave-assigned tasks: each carries acceptance criteria, a Regression scope line, and a Rollback line. **No sprint in this plan is NOT READY for reasons 3, 4 or 5.** Every NOT READY verdict below is condition 2 — an unanswered gate — which is the honest shape of this program's risk.

---

## 2. Readiness summary

| Sprint | Wave | Goal | Verdict | Blocker(s) |
|---:|:--:|---|:--:|---|
| **1** | 1 | Staged work becomes recordable; the live public-route divergence closes | ✅ **READY** | — (pre-flight applies) |
| **2** | 1 | Config single-sourced; every feature publishes a public API | ✅ **READY** | — (needs PF-8) |
| **3** | 1 | Every cross-feature import goes through a root barrel | ✅ **READY** | — |
| **4** | 1 | Boundaries become lint-enforced; the flashcard↔notifications cycle breaks | ✅ **READY** | — |
| **5** | 2 | The cycle rule is enforced; the two highest-risk pure units get tests | ✅ **READY** | — |
| **6** | 2 | Flashcard data services gain a regression net | ✅ **READY** | — (needs PF-3) |
| **7** | 2 | Every ruled collection appears in the rules suite | ✅ **READY** | — (needs PF-3) |
| **8** | 2 | The four zero-coverage features stop being a category | ✅ **READY** | — |
| **9** | 2 | Failures of real state stop vanishing; observability activates | ⛔ **NOT READY** | **Q-4** blocks T-116b, T-116c. ⚠ **Q-4 has no owner row in the source register — X-13.** Partial start: **T-116a** (6 of 8 d) |
| **10** | 3 | The app can mint and server-verify an httpOnly session credential | ✅ **READY** | — (emulator-only verification until Q-1; X-8) |
| **11** | 3 | The raw ID-token cookie is gone; auth is regression-tested end to end | ✅ **READY** | — (do not start without full capacity; X-1/X-6) |
| **12** | 3 | One user-progress listener serves all consumers | ✅ **READY** | — |
| **13** | 3 | Realtime reads are bounded; exports stop inventing zeros | ✅ **READY** | — |
| **14** | 3 | Admin dashboards render absent data as absent | ⛔ **NOT READY** | **Q-9** blocks T-114d. Partial start: **T-114b** (3 of 6 d) |
| **15** | 4 | One verified-identity action client exists with a live consumer | ✅ **READY** | — |
| **16** | 4 | Every admin server action runs on the unified client | ✅ **READY** | — |
| **17** | 4 | The second action client is gone; vocabulary agreement is machine-checked | ✅ **READY** | — (closes the X-2 dual-state window) |
| **18** | 4 | Deck-access has exactly one implementation; the divergent one is corrected | ✅ **READY** | — |
| **19** | 4 | Every server write path validates at its boundary | ✅ **READY** | — |
| **20** | 4 | Forms standardize; no schema claims a protection it lacks | ⛔ **NOT READY** | **Q-12** blocks T-109b, T-109c, T-109d. Partial start: **T-109e** (3 of 8 d) |
| **21** | 5 | The notification type stops lying; the two ops-answerable gates close | ⛔ **NOT READY** | **NQ-1** blocks T-108b · **Q-10** blocks T-115c. Partial start: **T-108a, T-108e** (2 of 8 d) |
| **22** | 5 | Production verdicts land for legacy notification data and the fan-out callable | ⛔ **NOT READY** | **Q-5** blocks T-108c · **Q-6** blocks T-119d. **No partial start** |
| **23** | 5 | The notification migration closes: one read path, one index set | ⛔ **NOT READY** | **Q-5** blocks T-108d. **No partial start.** ⚠ **Terminal node of the critical path — X-14** |
| **24** | 5 | Dormant notification and logging vocabulary is resolved | ⛔ **NOT READY** | **Q-8** blocks T-119a · **Q-11** blocks T-119b. **No partial start** |
| **25** | 5 | Inert admin surfaces and the one-story toolchain are resolved | ⛔ **NOT READY** | **Q-13** blocks T-119c · **Q-17** blocks T-119e. **No partial start** |
| **26** | 6 | Feature UI lives feature-side; pagination is capped at its two mechanisms | ✅ **READY** | — |
| **27** | 6 | Flashcard has named sub-modules behind a curated public API | ✅ **READY** | — (needs PF-8) |
| **28** | 6 | Internal boundaries and the file-size ceiling become enforceable | ⛔ **NOT READY** | **NQ-3** blocks T-110b **per the kernel** — but see §6 incoherence 3: the source records NQ-3 as *closed by decision*. Partial start: **T-104b, T-110a** (2 of 5 d) |
| **29** | 6 | "Admin grid" has one behavior contract | ✅ **READY** | — |

### Counts

| | Sprints | Tasks |
|---|---:|---:|
| **READY** | **20** | 46 |
| **NOT READY** | **9** | 16 gated |
| **Not schedulable** | — | 1 (T-118d `[OPEN Q-2]`) |
| **Total** | **29** | **63** |

**Every NOT READY verdict is an unanswered gate — none is a planning defect.** Of the 9 gated sprints, **5 carry a partial-start scope** totalling 16 days of executable work; **4 (S22–S25) are wholly gated** and cannot start at all. All four wholly-gated sprints are in Wave 5, exactly as the kernel predicted.

**Gated sprints by wave:** W2 → S9 · W3 → S14 · W4 → S20 · W5 → S21, S22, S23, S24, S25 · W6 → S28.

---

## 3. Ready to start immediately

**This is what the team acts on.**

### The runway: Sprints 1–8, unbroken, ~16 weeks

**Eight consecutive READY sprints with zero external dependencies.** Nothing in S1–S8 waits on a production project, a product-owner decision, or a deployment record. This runway delivers, in order:

1. **S1** — the migration ledger exists and is backfilled; the docs ADR index is complete; **and a live user-visible defect closes** (the proxy and `AuthGate` stop disagreeing about which routes are public).
2. **S2** — one `APP_ID` derivation across both deploy units; `.env.example` for the ~30 env vars; all 9 features publish a root barrel; `lib/logging` owns its own vocabulary.
3. **S3** — every cross-feature import goes through a barrel (isolation sprint).
4. **S4** — boundaries lint-enforced at `error`; the flashcard↔notifications cycle broken behind a registry seam.
5. **S5** — the cycle rule enforced; SRS math and `resolveRole` under test.
6. **S6** — flashcard data services under test (isolation sprint).
7. **S7** — every ruled collection in the rules suite (isolation sprint).
8. **S8** — the four zero-coverage features gain domain-logic coverage (isolation sprint).

At the end of S8 the codebase has enforced boundaries, single-sourced config, a live ledger, a broken cycle, and a regression net over exactly the code Waves 3–4 rewrite. **That is a coherent, shippable outcome on its own** — and it is reachable without answering a single open question.

### The rest of the READY set

| Block | Sprints | Blocked only by | Delivers |
|---|---|---|---|
| **Security & data layer** | **S10–S13** | in-plan predecessors | httpOnly server-verified session · raw ID-token cookie gone · one progress listener · bounded reads |
| **Contracts & convergence** | **S15–S19** | in-plan predecessors | one action client with per-action permission metadata · the second client removed · one deck-access implementation · every server write validated at its boundary |
| **Structure & patterns** | **S26, S27, S29** | in-plan predecessors | feature UI lives feature-side · flashcard sub-modules behind a curated API · one admin-grid behavior contract |

**Total immediately actionable: 20 of 29 sprints (~69%), 46 of 62 wave-assigned tasks.** The program is not gate-blocked; it is gate-blocked *at its edges*.

### What unblocks the rest

| Act | Cost | Converts to READY |
|---|---|---|
| One product-owner sitting on the `[INTENT]` cluster (Q-12, Q-8, Q-11, Q-13, Q-17) | hours | **S20, S24, S25** (3 sprints) |
| One owner confirmation of the already-recorded NQ-3 decision | minutes | **S28** (1 sprint) |
| Provision a real (non-demo) Firebase project → answers Q-1, and makes Q-4, Q-5, Q-6, Q-9, Q-10, NQ-1 answerable | a hosting decision + setup | **S9, S14, S21, S22, S23** (5 sprints) — and closes X-8 and X-14 |

**All nine NOT READY sprints are unblocked by three acts, none of which is engineering work.**

---

## 4. Per-sprint checklist verdicts

Checks 3–5 (acceptance criteria · regression scope · rollback) are satisfied for every task via `01-Validated-Backlog.md` and are not repeated per sprint. What follows adds what neither `01` nor `03` carries systematically: **the ADRs and NS-guards each sprint must not violate**, the public-API impact, the test tier, and the verdict.

### Wave 1 — Platform Foundations (S1–S4)

| Sprint | Must not violate | Public APIs | Test tier | Verdict |
|---|---|---|---|---|
| **S1** T-120a/b/c, T-118a | **ADR-120** (all four ledger fields mandatory — a ledger without them is not this ADR) · **ADR-118 hosting stays Open** — T-118a must not smuggle in a hosting decision; that is T-118d's job and it is `[OPEN]` | ⚠ **Behavioral.** The two allowlists are currently *unequal*, so unifying them necessarily changes which routes render for signed-out users. Misjudging the canonical set exposes a private route or breaks SEO/OG rendering | Unit (allowlist module) + **E2E public/protected route pass** — the sprint plan names this as the acceptance evidence | ✅ **READY** |
| **S2** T-118b/c, T-101a, T-103a | **ADR-101** (root barrel = public API) · **ADR-104** (flashcard stays ONE feature) · **CS-7** (barrel = public-API surface, not per-directory — do not regrow the 61-barrel state) | ✅ Additive — deep imports still resolve, a **stable intermediate state**. ⚠ ADR-101's named trade-off: an over-broad `export *` root barrel degenerates into "everything is public." The barrel is a *curated export list*, reviewed as a contract | Compiler + pre-commit gate | ✅ **READY** (needs PF-8) |
| **S3** T-101b | **ADR-101** · **CS-9** (cross-feature imports target root barrels only) | ✅ Compile-checked. Residual: a barrel re-exporting the wrong symbol under a colliding generic name — CS-8 names the two `rbac.ts` as the live collision | Compiler + full build; existing suites as the behavioral net | ✅ **READY** |
| **S4** T-101c, T-103b, T-102a/b | **ADR-102** (one-way flashcard → notifications, **never back**) · **ADR-103** (`lib` never imports `features`; `lib/providers.tsx` is the sole sanctioned upward edge) · **CS-9** | ⚠ The notifications seam is **new public surface** on notifications' barrel and must be designed as one. `InviteActions` keeps its rendered behavior; only its dependency source changes | Unit (seam resolution) + real-browser tier for `InviteActions` — a registry miss renders a dead button, which is silent, so a rendered test belongs here | ✅ **READY** |

> **X-10 note.** Every lint flip lands in the sprint *after* its cleanup completes — T-101b (S3) → T-101c (S4); T-103a (S2) → T-103b (S4); T-102a/b (S4) → T-102c (S5). This is stronger than co-locating flip and cleanup: an incomplete cleanup delays the next sprint's flip rather than blocking the current sprint's pre-commit gate.

### Wave 2 — Safety Net (S5–S9)

| Sprint | Must not violate | Public APIs | Test tier | Verdict |
|---|---|---|---|---|
| **S5** T-102c, T-117a/b | **ADR-117 / NS-3** — five-suite topology affirmed; do **not** add a sixth tier or a global coverage-percentage mandate (ADR-117 rejected that explicitly) | ✅ Tests are additive; T-102c is a lint flip | Unit. `resolveRole` is pure with 9 consumers — the ideal unit target | ✅ **READY** |
| **S6** T-117c | ADR-117, NS-3. Characterization tests must capture **current** behavior, including behavior later convergences will change — that is their purpose | ✅ Additive | Unit + app-emulator. ⚠ First sprint where X-11 (JDK/emulator) bites | ✅ **READY** — highest-value sprint in Wave 2: it covers exactly what S16 and S19 rewrite |
| **S7** T-117d | ADR-117, NS-3. ⚠ **Do not change `firestore.rules` here** — this sprint tests the rules as they are. Rules *changes* are S13/S14 and S18, and they depend on this coverage existing | ✅ Additive | Rules tier against the real rules engine — the only tier that can prove this (S-10) | ✅ **READY** — prerequisite that makes S13/S14 and S18 verifiable at all |
| **S8** T-117e | ADR-117, NS-3. Q-14 is *contextual* for AI test scope, **not a gate** — `06-Decision-Matrix.md` records AD-17 as gate-free | ✅ Additive | Unit; game-session hooks may need the real-browser tier | ✅ **READY** — the only Wave 2 sprint off the convergence path, so the correct first deferral if Wave 2 must compress (X-4) |
| **S9** T-116a, T-116b ⛔, T-116c ⛔ | **ADR-116** · **CS-12** (report **before** you handle; the swallow controls user experience, not observability; three surfacing styles stay mapped to context). ⚠ The logging pipeline must not become a new failure amplifier — ADR-116's named trade-off | ✅ No signature changes; swallow sites keep their fail-open behavior. Risk is inverted: the change makes previously-silent failures *visible*, which may surface pre-existing defects — the intended outcome | Unit (the reporting call happens on the failure path). ⚠ With Q-4 open the reports may terminate in a pipeline nobody reads (D-1) — the *code* is verifiable, the *observability* is not | ⛔ **NOT READY** (Q-4) · **Partial: T-116a, 6 of 8 d.** T-116a is on the critical path and is **explicitly not gated** — ADR-116's policy leg is Accepted unconditionally |

### Wave 3 — Security & Data Layer (S10–S14)

| Sprint | Must not violate | Public APIs | Test tier | Verdict |
|---|---|---|---|---|
| **S10** T-107a | **ADR-107** — the edge gate stays a **routing-UX check only**; this sprint must not turn the proxy into an authorization point (ADR-107 rejected edge verification explicitly) · **NS-5** (the auth-gating layers minus the allowlist do real work) · P-6 | ✅ **By construction nothing user-visible changes.** The new httpOnly credential is issued and server-verifiable; the old one is still accepted. That dual-accept property *is* the sprint's design | Unit (verification) + E2E (sign-in → refresh). ⚠ **Emulator-only** — `Secure` behavior over real HTTPS, cookie-domain scoping and refresh against Google's live key rotation are unexercised (X-8, R-9). Record as a ledger row, not a passed check | ✅ **READY** |
| **S11** T-107b, T-107c, T-107d | **ADR-107** (edge gate documented as routing-UX only, **by contract** — T-107c's deliverable) · NS-5 | ⚠ **No — and that is the point.** The credential's shape and lifetime change. The compatibility mechanism is S10's dual-accept window, closed only *after* T-107d's E2E pass is green | E2E (Playwright) is the required tier and T-107d is the sized task for it. ⚠ E2E signs in via `window.__e2eSignIn`, a bridge that does not exist in production (R-9) — the tier proves the *flow*, not the *production credential mechanics* | ✅ **READY** — widest regression scope in the program; do not start without full capacity (X-1, X-6) |
| **S12** T-113a | **ADR-113 / ADR-002 affirmed, not revised** · **CS-11** — *stores hold data, contexts hold resources*; a shared listener is a **resource** → React context mounted once in `lib/providers.tsx`, **not** a Zustand store · CS-10 rule 2 · P-11 (realtime stays on `onSnapshot`) | ✅ `useUserProgress`'s signature must not change — all 10 consumers keep calling it identically; only the subscription behind it is shared | Real-browser tier (mount/unmount lifecycle, listener count) + app-emulator. ⚠ **NQ-14: no profiling exists** — the improvement is structural and cannot be *measured*; do not claim a measured win | ✅ **READY** |
| **S13** T-113b, T-114a, T-114c | ADR-113, **ADR-114**, **CS-10 rule 1** (every `collection`/`collectionGroup` subscription carries an explicit bound). Bounds must not un-centralize what S12 just centralized | ⚠ Adding `limit()` to the public-lesson listener is a **user-visible behavior change** — the dashboard stops showing the entire public corpus. NQ-6 sizes the urgency; the bound is required regardless, but its *value* is a product choice to record, not default silently | Rules/emulator tier for query bounds (available because S7 ran) | ✅ **READY** |
| **S14** T-114b, T-114d ⛔ | ADR-114. ⚠ **NS-8 applies to T-114d**: ADR-114's rejected alternative warns an out-of-repo aggregation pipeline may exist and deleting the reads "could sever a live external contract" | ⚠ User-visible by design: metrics that showed `0` now show "no data" | Real-browser tier for absent-data rendering | ⛔ **NOT READY** (Q-9) · **Partial: T-114b, 3 of 6 d.** The honest-UI default is in force *now* regardless of Q-9 — fabricated zeros are already out of policy |

### Wave 4 — Contracts & Convergence (S15–S20)

| Sprint | Must not violate | Public APIs | Test tier | Verdict |
|---|---|---|---|---|
| **S15** T-106a | **ADR-106** — exactly **two** write-path families. **Family A is not residue**: ADR-002/P-11 reaffirm client-SDK realtime as permanent policy; do not migrate learner realtime writes onto the action client. **No third family** — PC-6's zero-route-handler property becomes a rule | ✅ Additive: the new client exists and has a live consumer; **both legacy clients remain fully functional** | Unit + emulator for family (b), per ADR-106's fixed per-family test strategy | ✅ **READY** |
| **S16** T-106b | ADR-106 · **ADR-115 / NS-1** — converging action *clients* is not converging RBAC *engines*; the two engines stay two | ✅ Server action signatures and result shapes must not change. The `toActionResult` bridge is the compatibility surface (WR-2 couples its retirement to this convergence) | Unit + emulator. ⚠ Migrates `admin.actions.ts` (380 lines, 20 actions, the RBAC enforcement seam) — named untested in W-16 and **not** in ADR-117's coverage priority. Add characterization tests first (X-7) | ✅ **READY** |
| **S17** T-106c, T-106d, T-115b | ADR-106 — the "thin per-surface configuration" **must not regrow into two divergent clients** (ADR-106's named trade-off, and why the convergence contract needs a ledger row) | ✅ Same as S16. **T-106d must land after T-106b and T-106c** — `02-Execution-Waves.md` marks this non-negotiable: removing a superseded client while a call site still uses it breaks the build | Unit + emulator; the permission-metadata property is compile-time enforced — the strongest available check | ✅ **READY** — closes the X-2 write-path dual-state window |
| **S18** T-115a | **ADR-115 / NS-1 — the two RBAC engines stay two.** OP-6 was **rejected-with-reason**: two domains, near-zero consolidatable surface. This sprint converges *inline re-derivations onto their engine*; it must not merge the engines. CS-8: renaming the two `rbac.ts` is optional cosmetic, **not** a mandate to consolidate | ⚠ Deck-access decisions are user-visible permissions. One of the five inline predicates is **semantically divergent** — converging it *changes behavior for some decks*. Whether that divergence was intentional needs a ledger row, not a merge (X-7) | Unit (`resolveRole`, covered in S5) + rules tier (covered in S7). **This sprint is why S5 and S7 are non-negotiable** — ADR-117: `resolveRole` "becomes tested before it is consolidated" | ✅ **READY** — highest-consequence regression scope after S11 (a widened predicate leaks a private deck; a narrowed one locks an owner out) |
| **S19** T-109a | **ADR-109** · **CS-13** (validate at the write boundary) | ⚠ Adding validation to a path that never had it can **reject inputs previously accepted** — a user-visible behavior change | Unit (schema behavior) + emulator (write paths end-to-end) | ✅ **READY** |
| **S20** T-109e, T-109b ⛔, T-109c ⛔, T-109d ⛔ | ADR-109 (**enforce-or-delete per schema** — no schema stays declared-but-unenforced) · CS-13 rule 2 (multi-field forms on RHF + zodResolver; trivial single-input may stay controlled-state) | ⚠ Enforcing `cardContentSchema` changes what a card write accepts — the most user-visible change in Wave 4, and exactly what Q-12's data-compatibility half exists to check | Unit + emulator | ⛔ **NOT READY** (Q-12) · **Partial: T-109e, 3 of 8 d.** ⚠ **Rollback is asymmetric**: deleting a zero-consumer schema is trivially revertible; *enforcing* one is not, once user-visible rejections have occurred. **Recommended if Q-12 stays open:** delete `privacyModeSchema` and `publicRoleSchema` (S-sized, zero-consumer, git-restorable) and hold only `cardContentSchema` — shrinking TD-5's growing exposure without risking the one schema that could reject existing card data |

### Wave 5 — Migration Completion (S21–S25) — **all five NOT READY, as the kernel predicted**

| Sprint | Must not violate | Public APIs | Test tier | Verdict |
|---|---|---|---|---|
| **S21** T-108a, T-108e, T-108b ⛔, T-115c ⛔ | **ADR-108** — the **stored vocabulary is authoritative**; do not narrow the writer (ADR-108 rejected that as deleting working product behavior) · **NS-8** · ADR-115 | ⚠ Widening `NotificationType` forces every consumer to handle 10 cases — ADR-108 states this "surfaces latent gaps the `string` widening hid," and **the short-term cost is the point** | Unit + the compiler (exhaustiveness is the strongest check here) | ⛔ **NOT READY** (NQ-1, Q-10) · **Partial: T-108a + T-108e, 2 of 8 d.** Disproportionately valuable: T-108a alone closes the type-vs-runtime half of the corpus's **#1-ranked debt** and needs no production access (W-7 is a pure code fact). ⚠ `01-Validated-Backlog.md` §5.6 is precise: T-108a is **Ready with Q-7's default in force**, not gate-free. ⚠ T-115c is the risk: aligning admin-authority predicates without knowing the live provisioning source could lock out the only superadmin — "shipping a guess here is the one outcome ADR-115 forbids" |
| **S22** T-108c ⛔, T-119d ⛔ | ADR-108 · **ADR-119** (delete-unless-claimed) · **NS-8** · **CS-3** (no capability without a live consumer) | ⚠ The four `@deprecated` fields are a **stored-data contract**, not just a type | App-emulator. ⚠ The emulator cannot contain production's legacy documents — only Q-5's data sample can prove no legacy document is orphaned | ⛔ **NOT READY** (Q-5, Q-6) · **No partial start.** ⚠ CS-3 names `fanOutNotifications` as its example of *acceptable* forward-provisioning (it self-documents why it exists and how it activates) — `01-Validated-Backlog.md` is blunt that **the gate, not the comment, decides**, but Q-6's delete default deserves more scrutiny than the other four deletions |
| **S23** T-108d ⛔ | ADR-108, **NS-8**, ADR-120. ⚠ ADR-108's rejected alternative 3 governs: retiring the dual machinery without confirming the backfill ran "would **silently hide pre-migration notifications from users**" (RC-3) | ⚠ Removing the dual read path changes which documents are readable — the entire reason for the gate | App-emulator; see S22's caveat | ⛔ **NOT READY** (Q-5) · **No partial start — entirely gated.** ⚠ **This is the critical path's terminal node (X-14): the program cannot reach critical-path-complete on in-repo work.** ⚠ **Rollback is code-reversible but data effects are not** — take a documented Firestore export of the notification collections before the collapse lands |
| **S24** T-119a ⛔, T-119b ⛔ | ADR-119, CS-3 | ✅ Deletions are behavior-neutral by construction — these surfaces have zero producers. If a deletion changes behavior, the premise was wrong and it should stop | Compiler + existing suites. A deletion that breaks a test proves the surface was not dead | ⛔ **NOT READY** (Q-8, Q-11) · **No partial start.** ⚠ **T-119b carries a carve-out**: the kana-practice logging gap is a *provable* omission, "resolved in the direction its gate answers" — **do not delete it by default** |
| **S25** T-119c ⛔, T-119e ⛔ | ADR-119 · **CS-3** — `canChangeSettings` is CS-3's named example of *unacceptable* aspiration: declared in the RBAC matrix, demanded by zero actions, with no marker saying "next sprint" vs "abandoned" | ✅ Behavior-neutral by construction | Compiler + existing suites | ⛔ **NOT READY** (Q-13, Q-17) · **No partial start.** **The most tractable NOT READY sprint in the program**: both questions are `[INTENT]`, need no production access, and are plausibly answerable by the person executing the plan |

### Wave 6 — Structure & Patterns (S26–S29)

| Sprint | Must not violate | Public APIs | Test tier | Verdict |
|---|---|---|---|---|
| **S26** T-105a, T-105b, T-112a | **ADR-105** (feature code in `features/<name>`; routes hold only orchestrators) · **CS-4** (the sanctioned exception is a genuinely orchestrating immersive page — kana survival's `page.tsx` may keep its wiring; its *screens* move) · **ADR-112 / NS-2 — the two pagination mechanisms are THE two**; OP-3 was **rejected-with-reason**, do not unify them | ✅ Pure relocation. **Route URLs must not change** — a source-tree move, not a routing change | Compiler + E2E (the survival route still renders) | ✅ **READY** — perform moves as pure renames in one commit and edits in the next (X-5) |
| **S27** T-104a | **ADR-104 — flashcard remains ONE feature. No top-level split.** This is the sprint most likely to violate its own ADR: internal barrels define sub-modules *within* the feature, they do not become a de-facto split | ✅ The feature's **root** barrel (from S2) is unchanged; this adds *internal* barrels below it. Cross-feature consumers see no difference | Compiler + the flashcard data-service tests from S6 as the behavioral net | ✅ **READY** (needs PF-8) — widest-diff sprint in the program; run on a short-lived branch merged within the sprint (X-5) |
| **S28** T-104b, T-110a, T-110b ⛔ | **ADR-110** (**two sanctioned dialog tiers** — shared primitives, and bespoke `Dialog.Root` via DialogChrome; converging the straggler backdrop must not collapse the two tiers into one) · **CS-1** (`Drawer` is the cautionary case this rule exists for) · CS-2 | ✅ Dialog surfaces keep their behavior. `Drawer` is deleted, **or** adopted with *both* bespoke panels (`DeckDetailsPanel`, `AdminSidebar`) converging on it — half-adoption is not an outcome | Real-browser tier — exactly what it is for (keyboard/focus contracts in a real DOM). ⚠ **NQ-13: no page-level a11y audit exists**, so this cannot claim an a11y improvement beyond the primitive level | ⛔ **NOT READY** (NQ-3, per kernel) · **Partial: T-104b + T-110a, 2 of 5 d.** ⚠ `max-lines` at `error` must land in the same commit that finishes the `ShareModal.tsx` split (436 lines, the only non-test violator), never before (X-10). In practice this sprint is READY the moment the owner confirms the already-recorded NQ-3 decision |
| **S29** T-111a | **ADR-111** — the engine **lifts out of `features/admin` only on a third non-admin consumer** (three-use rule, P-10/CS-1). Reports is the *second* admin consumer, so the engine stays admin-owned | ⚠ Reports' migration changes an admin surface's interaction contract (sorting/selection/filtering semantics). ADR-111 keeps virtualization as a rendering concern; if a genuine variable-height constraint blocks it, **NQ-4's owner veto is the recorded escape hatch** — ADR-111 names this explicitly | Real-browser tier | ✅ **READY** |

---

## 5. Pre-flight — what must be true before Sprint 1

Sprint 1 has no in-plan predecessor, so everything it needs must exist beforehand. These are conditions on starting, not tasks in the plan.

| # | Pre-flight item | Why | Unblocks |
|---|---|---|---|
| **PF-1** | **Make and record a hosting/deployment decision (Q-2 / T-118d).** | The highest-leverage act available. `07-Open-Questions.md` states plainly that Q-2 is "a decision to make, not a fact to find" — it needs a decision-maker, not an investigation. It is upstream of **Q-1**, which gates *verification* of AD-06/07/08/14/16/18 and the answerability of six further gates. ⚠ The kernel marks T-118d `[OPEN]`/not-schedulable, so **the plan cannot do this for itself** (§6 incoherence 2) | X-8, X-14; S9, S14, S21, S22, S23 |
| **PF-2** | **Confirm or provision the production Firebase project identity (Q-1).** | Kernel gate-rule 4 puts Q-1 in Wave 1's readiness; `03-Sprint-Plan.md` opens it in S1. If PF-1 cannot be made, a non-demo project used purely for verification still answers Q-1's provisioned-state half and unblocks Q-4/Q-6/Q-9/Q-10/NQ-1 empirically | Verification of nearly every sprint |
| **PF-3** | **⚠ Add a Q-4 row to `architecture-decision/07-Open-Questions.md`, and reconcile that document's counts.** | **Q-4 gates T-116b/T-116c but appears in none of the register's four owner groups** — it survives only as an aside in NQ-14's row. A question with no row has no answering-owner class, no default and no review-by date, and is therefore skipped by every process that reads the register (X-13). **In the same pass, reconcile the document's arithmetic: its heading says 26 open questions, its roll-up totals 25, and its group tables sum to 32 (A 12 + B 6 + C 2 + D 5 + E 7). Do not pick a number — the register needs a corrective pass.** `03-Sprint-Plan.md` compensates by naming Q-4's owner in S1, but the compensation lives in the plan, not the source | S9; the integrity of PF-6 |
| **PF-4** | **Toolchain verified: Node, Firebase CLI, and a JDK on `PATH`; all five suites green at HEAD.** Pin the CLI and JDK versions | Three of the five suites need the emulator, and the Firestore emulator is a JVM process (R-15). The commit immediately before this program (`a0bbbc4`) was itself a fix to an emulator test crash | S6, S7, S11 (X-11) |
| **PF-5** | **Baseline green: the pre-commit gate (lint + format + full build) passes at HEAD. Record the baseline commit SHA.** | Every sprint's rollback target is a previous deployable state; the chain needs a first link | All sprints |
| **PF-6** | **Name an owner and a review-by date for all 16 gated tasks' questions — at S1, not at their wave.** | ADR-120's trade-off: review-by dates "create a recurring obligation," and an unmaintained ledger "is as misleading as a stale comment." Dating them at the start is what prevents defaults becoming permanent by attrition. ⚠ **Depends on PF-3** — reading the register alone would miss Q-4 | X-3, X-13 |
| **PF-7** | **Dispatch the `[INTENT]` cluster (Q-12, Q-8, Q-11, Q-13, Q-17) as one owner sitting.** | Five questions, no production access needed, longest owner lead time. `02-Execution-Waves.md` calls this the plan's "cheapest schedule lever" | **S20, S24, S25** |
| **PF-8** | **Confirm the CS-7 barrel-reduction scope with the owner.** | `04-Coding-Standards.md` flags it explicitly: the policy "partially reverses a demonstrated preference" (CX-4 — a June barrel removal was reverted in July), so "the owner should confirm the reduction scope **before** lint-enforcing it." Enforcing a contested rule at `error` is X-10's worst case | S2, S27 (and S4's flip) |
| **PF-9** | **Agree the branch and rollback convention:** each sprint ends on a tagged deployable commit; sprint PRs are the revert unit | There is no CI/CD pipeline and no deployment history (R-13) — "rollback" means revert-to-previous-sprint, and that works only if boundaries are tagged | All sprints; X-2, X-6 |
| **PF-10** | **Accept and record the program's shape:** 62 scheduled tasks, 16 gated, 29 sprints ≈ 58 weeks at team size 1; **9 sprints start NOT READY**; and the program has **two completion definitions** — schedule-complete and critical-path-complete (the latter requires Q-5, X-14) | Discovering the gated proportion at Wave 5, or the conditional completion definition at S23, is the failure this document exists to prevent | — |

**PF-1, PF-2, PF-3 and PF-7 are the four that change the readiness table.** The rest is hygiene.

---

## 6. Incoherences found

Recorded rather than silently resolved. The kernel is binding, so where a discrepancy exists this document follows the kernel and flags the conflict. Items 1–3 are independently corroborated by `01-Validated-Backlog.md` §5.

1. **The kernel's task count is wrong.** Its heading says "50 tasks — fixed"; the enumerated list contains **63** entries (62 wave-assigned + T-118d `[OPEN]`). No subsetting reaches 50: minus the open task is 62; minus the 16 gated is 46. **Handling:** the enumerated set is authoritative (the kernel forbids inventing or renumbering); the heading count is an arithmetic error. No task was added or dropped to reconcile it.

2. **The plan's most consequential unblocker is the one item it cannot schedule.** T-118d (hosting/deployment target) is `[OPEN Q-2]`, "not schedulable." But Q-2 is upstream of Q-1, and Q-1 gates verification of AD-06/07/08/14/16/18 plus the answerability of Q-4, Q-5, Q-6, Q-9, Q-10 and NQ-1. Meanwhile kernel gate-rule 4 places Q-1 in **Wave 1's readiness**. The plan therefore requires in Wave 1 an answer whose precondition it declares unschedulable. Not a contradiction in the source — `07-Open-Questions.md` is consistent that Q-2 is a *decision*, not a discovery — but the plan cannot unblock itself. **Handling:** promoted to **PF-1**, outside the plan, where a decision-maker rather than a sprint can act.

3. **T-110b's gate is already closed in the source of truth.** The kernel marks T-110b `[GATED NQ-3]`. `07-Open-Questions.md` §0 lists NQ-3 among the five questions **closed — resolved-by-decision**: AD-10 fixes `Drawer` as delete-unless-claimed with **default = delete**, subject only to an owner veto if `Drawer` was built *for* `DeckDetailsPanel`/`AdminSidebar` with adoption genuinely pending. **Handling:** S28 is NOT READY per the kernel, with the discrepancy flagged and a partial-start scope. A one-line owner confirmation of an already-recorded decision flips it to READY. The same class of discrepancy would apply to NQ-2/NQ-4/NQ-5/NQ-9, but no task is gated on those.

4. **Q-4 gates two tasks but is absent from the open-questions register — and that register's own counts do not close.** `06-Decision-Matrix.md` lists Q-4 as AD-16's gate in four places, `03-Architecture-Decisions.md` records ADR-116 as "Accepted-conditional on Q-4 (activation leg)," and the kernel marks T-116b/T-116c `[GATED Q-4]`. But **`07-Open-Questions.md` never lists Q-4** — not in Group B `[GCP]`/`[OPS]` (Q-1, Q-2, Q-6, Q-9, Q-10, NQ-1), not in any other group, and not in the roll-up. It survives there only as an aside inside NQ-14's row. Separately, **that document's arithmetic is internally inconsistent**: the section heading says **26** open questions, the roll-up totals **25**, and the four group tables sum to **32** (A 12 + B 6 + C 2 + D 5 + E 7). **Handling:** Q-4 is treated as a live `[GCP]`/`[ENV]`+`[INTENT]` gate per the ADR and the kernel. This changes no verdict — S9 is NOT READY either way — but it means the gate has **no recorded owner or default in the register**, which is why it is escalated to **PF-3** as a source-document fix rather than a plan-level workaround, and why PF-6 depends on it. **The count discrepancy is flagged for a corrective pass, not silently resolved by picking a number.**

5. **The critical path terminates in a gated task.** The kernel's critical path ends `… → T-109a → T-108a/d → done`, and **T-108d is `[GATED Q-5]`** — a `[DATA]`+`[OPS]` question. The program therefore has no in-repo completion condition: Sprints 1–22 can execute perfectly and the critical path still terminates one node short. **Handling:** recorded as execution risk **X-14** and as **PF-10**'s two-completion-definitions requirement, so it is visible from Sprint 1 rather than discovered at S23. It is not a defect in the plan — ADR-108 gates the retirement deliberately, because retiring the dual machinery unverified "would silently hide pre-migration notifications from users."

---

## 7. Standing definition of done

Applies to **every task in every sprint**, gated or not. Derived from the kernel's fixed constraints (pre-commit gate, five-suite topology, deployable-per-sprint, traceability) and CS-1 … CS-14. It is the floor beneath each task's own acceptance criteria in `01-Validated-Backlog.md`, not a substitute for them.

**Gate (mechanical — the existing pre-commit hook enforces these; not negotiable per-task):**

1. **Lint passes**, including every boundary rule active at the time (CS-9: one-way layers · `lib` never imports `features` except `lib/providers.tsx` · cross-feature imports target root barrels only · `flashcard → notifications`, never back).
2. **Format passes.**
3. **Full build passes** — TypeScript included. A task that leaves the build red has not landed.

**Tests (five-suite topology, NS-3 — affirmed, not extended):**

4. **The change is proved by at least one of the five tiers**, and the task states which: unit (node) · real-browser component (Vitest Browser Mode) · app emulator + rules · functions emulator · E2E (Playwright). A change with no applicable tier is a readiness failure, not a task.
5. **Existing suites stay green.** Emulator tiers run at every sprint boundary even when untouched — they are the tiers most likely to rot unnoticed at team size 1 (R-15, X-11).
6. **Rules changes carry a rules-suite test** (available from S7 onward). No rules change ships on emulator-free reasoning.

**Standards (CS — checked at review; several also lint-enforced):**

7. **CS-2 file ceiling applies to every file the task touches**: ≤ 250 green · 251–400 allowed with a "is this one cohesive responsibility?" review checkpoint · > 400 blocking. Split by responsibility, never to hit a number; taxonomy-only splits are the named failure mode.
8. **CS-14 tokens and i18n**: no raw hex outside the recharts carve-out (use `chartTheme.ts`, not inline literals) · no hardcoded user-facing strings — all copy through `next-intl`, navigation through the `@/i18n/navigation` wrappers · **en/ja message-key parity is exact** · reuse a `shared/components/ui` primitive before hand-styling; no arbitrary bracket values.
9. **CS-12 report-then-handle**: no new swallow site discards an error without reporting first; surfacing style matches context (render → throw to boundary · subscription → into state · background → fire-and-forget *after* reporting); the bracketed scope-tag convention is kept.
10. **CS-13 validation at the boundary**: any new server write path validates through a zod schema; no schema claims "source of truth" while consumed by nothing; multi-field forms use RHF + zodResolver.
11. **CS-3 no capability without a consumer**: nothing is built ahead of demand. Deliberate forward-provisioning is allowed **only** with a ledger entry naming its intended consumer, activation step and review-by date. CS-1's three-use rule governs extraction.
12. **CS-11 state ownership**: stores hold data, contexts hold resources, realtime stays on `onSnapshot` hooks, auth is never persisted.

**Recording (ADR-120 — the plan's own highest-leverage decision applies to the plan):**

13. **Any staged change adds or updates its ledger row** — intended end state, current stage, owner, review-by — in the same change that lands it. No `@deprecated` marker and no "reconcile later" comment may exist without a corresponding row.
14. **Any gated task executed on its default records that fact**: which question, which default, which alternate branch the answer would trigger, and the review-by date.
15. **Verification provenance is recorded**: which tier verified the change, and — until Q-1 answers — an explicit note where verification was **emulator-only**. Emulator-green is never reported as production-verified (X-8).

**Sprint-level (the constraint every task inherits):**

16. **The sprint ends deployable.** No sprint may end with a half-migrated boundary, a partially-converged client, or a broken gate. If the work cannot reach that state, it reverts to the previous sprint's tagged commit rather than extending.
17. **Traceability holds**: every task traces task → ADR → driving findings → corpus file. **No requirement-ID or recommendation-ID is ever cited** — those documents do not exist, and inventing one to fill a column is the failure this plan's honest-labeling rule exists to prevent.
