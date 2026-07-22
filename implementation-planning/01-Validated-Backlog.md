# 01 — Validated Backlog (ADR-derived)

**Phase 11 — Implementation Planning.** This is the traceable task backlog for executing the twenty architecture decisions (ADR-101 … ADR-120) fixed in `architecture-decision/`. It elaborates the task set fixed by the planning kernel; it invents no tasks, renumbers nothing, and drops nothing.

---

## 1. Preamble — input state, honest labelling

### 1.1 The two absent inputs

`engineering-tasks/` and `requirements-consolidation/` **do not exist**. They were deleted before the discovery phase, were never committed, and are **unrecoverable**. Two consequences bind every entry below:

1. **This document is derived from the 20 ADRs. It is not a validation of a pre-existing backlog.** There was no prior task list to validate, deduplicate, or re-scope. The conventional Phase-1 activity — take an existing backlog and test each item against the architecture — had no input. What is applied instead is described in §2: the same validation questions, turned on the _derivation_ rather than on a prior artifact.
2. **No Requirement-IDs and no Recommendation-IDs may be cited**, because the documents that would have carried them are gone. Any such ID appearing anywhere in this plan would be fabricated. Traceability therefore runs:

   > **task → ADR → driving findings (W/RC/CX/PC/TD/R/OP/S-n, cluster C-n) → corpus file**

   That chain is complete and verifiable against `architecture-decision/06-Decision-Matrix.md` and the `architecture-assessment/` corpus. It is the only chain this plan claims.

`architecture-audit/` is likewise absent (recorded as an input-state note in `architecture-decision/03` and `/06`); no repository rescan was performed for this file, and no file under `src/` was read. Every file:line fact quoted downstream is the corpus's, re-verified by the assessment at HEAD `a0bbbc4`.

### 1.2 Supersession of the E15–E18 epic backlog

A prior epic backlog existed and is **superseded by the ADR set**. Its recorded state at the start of this phase:

- **E15, E16 executed and committed.**
- **E17 executed and committed** for T1 and T3–T10 (`94a9ef4`, `254a486`, and the HEAD-adjacent fix commits). **E17-T2 remained blocked on a product decision.**
- **E18 was 7 open decisions**, never converted into executable work.

Those IDs are **not resurrected**. Where E15–E18 work overlaps an ADR (E17-T4's logging centralization behind ADR-103; E17-T5c's admin-pagination unification behind ADR-112; E17-T10's pass-through sweep behind ADR-101; E11's "below 400 lines" program behind CS-2), the ADR is the authority and the epic is cited only as evidence of prior art. No task below carries an E-prefixed ID, and no E-prefixed ID may be used to justify or descope a task here.

### 1.3 What "validated" means in this title

It means each task has been checked against the five questions in §2 and carries: a single owning ADR, at least one driving finding, observable acceptance criteria, a named regression scope, a rollback path, and an explicit Ready/Gated/Open status. It does **not** mean the task was reconciled against a requirements document — there is none.

---

## 2. Phase-1 validation applied to the derivation

With no prior backlog to validate, the validation questions are applied to the **derived set**: _is this task real, is it single-owned, is it already covered elsewhere, is it schedulable, and is it honestly statused?_ This section shows the work — what was merged, what was deliberately not created, what is deferred, and what is gated rather than ready.

### 2.1 Merges and folds (candidate tasks collapsed into one)

| #   | Candidates                                                                                               | Disposition                                        | Rationale                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-1 | ADR-115's vocabulary-agreement automation **+** ADR-108's TS-union ↔ rules ↔ writer check                | **One task: T-115b**                               | They are the _same mechanism_. ADR-108 SC#2 and ADR-115 SC#3 describe one check with two targets (OP-19). Build once; point it at the notification vocabulary when T-108a lands. No separate T-108 check task exists.            |
| M-2 | `toActionResult` compatibility shim retirement (WR-2)                                                    | **Folded into T-106d — assumption found false**    | The shim was assumed to "retire by its consumers migrating" (05 §WR-2), its last caller disappearing once the superseded clients were removed. T-106d found this false: `admin.actions.ts`'s 19 actions, fully migrated onto `verifiedAdminActionClient`, still call it — the need was never tied to which client backs an action, only to whether consuming hooks still expect the pre-safe-action `{ok,error}` envelope. Recorded as `LDG-21` rather than silently forced to match the original plan. |
| M-3 | Two non-conforming dialog backdrops (`DeckDetailsPanel` `bg-[#3c3c3c]/30`, `AdminSidebar` `bg-black/40`) | **One task: T-110a**                               | 05 §UR-2: PC-3 counts one straggler, OP-2 evidences two, "the decision is identical for both."                                                                                                                                   |
| M-4 | Kana-practice logging gap (a _provable_ omission, not an intent unknown)                                 | **Folded into T-119b**                             | ADR-119 resolves it "in whichever direction Q-11 answers" — it shares Q-11's gate and inverts with the same answer. Splitting it out would create a task whose direction is undecidable alone.                                   |
| M-5 | `ShareModal.tsx` (436 lines) CS-2 hard-ceiling split                                                     | **Folded into T-115a**                             | Kernel cross-cutting rule: split under whichever task next touches the file. T-115a is the first task that edits ShareModal's _body_ (its inline deck-access predicate at `:98`, UR-1). Cross-referenced from T-104a and T-110a. |
| M-6 | Raw-hex tail (38 occurrences / 29 files, charts carve-out excepted — UR-3)                               | **Folded into T-110a + T-111a**                    | Kernel cross-cutting rule: rides along with the dialog and table work. Not a standalone task.                                                                                                                                    |
| M-7 | Stale lint-config standards count ("~46 pre-existing files"; true count 44 — UR-4)                       | **Folded into T-101c**                             | A one-line correction in `eslint.config.mjs`, which T-101c is already editing.                                                                                                                                                   |
| M-8 | Deep-barrel retirement below feature roots (WR-1)                                                        | **Folded into T-101a / T-101b / T-104a**           | Once deep cross-feature imports are lint violations, a sub-directory barrel with no internal consumers has no client. It is an outcome of the barrel policy, not separate work.                                                  |
| M-9 | `SITE_URL` centralisation + hosting hazard record (CF-2)                                                 | **T-118d [OPEN] + a ledger row created by T-120b** | 05 §CF-2: "documented, not decided." The documentation half is a ledger row; the decision half is not schedulable.                                                                                                               |

**One deliberate split (the inverse move).** DEL-7 (never-written analytics reads + fabricated zeros) is _not_ one task: the honest-UI legs are **ungated policy** (T-114b dashboard, T-114c export rows) while the read-path disposition is **Q-9-gated** (T-114d). 05 §DEL-7 states the honest-UI rule "is **not** gated — fabricated zeros are out of policy on _both_ branches." Keeping them together would have held ungated correctness work hostage to a production-console answer.

### 2.2 Deliberately NOT created

| Candidate                                                                                                                         | Why no task                                                                                                                                                                                    | Authority                            |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Merge the two RBAC engines                                                                                                        | Principled duplication — two domains sharing no roles, no storage, no callers. Merging judged "worse."                                                                                         | 05 §NS-1; ADR-115; OP-6, PC-8, CX-12 |
| Unify the two pagination mechanisms                                                                                               | Rejected-with-reason; channel-forced. T-112a **codifies** them instead of unifying.                                                                                                            | 05 §NS-2; ADR-112; OP-3              |
| Collapse / consolidate the five test suites                                                                                       | Topology is a verified strength; the finding is inverted _allocation_, addressed by T-117a–e.                                                                                                  | 05 §NS-3; ADR-117; S-10, TD-2        |
| Simplify the motion / audio boundaries                                                                                            | Complexity bought deliberately against a documented prior failure.                                                                                                                             | 05 §NS-4; CX-5, S-15                 |
| Simplify the auth-gating layer stack                                                                                              | Each stratum correctly distrusts the one above; only the hand-mirrored allowlist is accidental (T-118a).                                                                                       | 05 §NS-5; CX-6                       |
| Consolidate the two virtualizer variants / two form-state mechanisms                                                              | Examined and rejected by the assessment; ADR-109 sanctions the form split explicitly.                                                                                                          | 05 §NS-6; PC-4, ADR-109              |
| Migrate the `artifacts/{APP_ID}` Firestore layout; merge `shared-preview.service.ts`                                              | Least-reversible decision in the codebase; the file split is documented bundle isolation. Only the env-var split-brain simplifies (T-118b).                                                    | 05 §NS-7; CX-11, TD-9                |
| Strip notification compatibility machinery now                                                                                    | Deletion gates certify deadness; data-state gates certify retirement readiness — not interchangeable. Handled as gated T-108c/d.                                                               | 05 §NS-8; CX-1, RC-3                 |
| Cycle-detection tooling (madge / dependency-cruiser) as its own task                                                              | ADR-101 rejected CI graph tooling as the _primary_ mechanism; TD-4 is closed by the lint rules in T-101c / T-102c / T-103b. May complement later; not a backlog item now.                      | ADR-101 Alt-3; TD-4                  |
| Tighten the 200-line ceiling to `error` and clear its 44 warnings (TD-3, a top-10 debt)                                           | **Deliberate deferral, explicitly flagged in the source.** No ADR addresses it; CS-2's tiered ceiling applies per-file as each file is touched. Recorded here so the omission stays auditable. | 06 §2a ⚠FLAG, §5.2; CS-2             |
| Leaderboard PII readability (R-3/NQ-7); world-readable card-image Storage (R-18/NQ-8); the client-gated no-SSR model (W-14/NQ-10) | Product-owner **privacy/intent** calls the kernel deliberately did not decide. No ADR ⇒ no task. They remain **open risks**, not silently-closed ones.                                         | 06 §5.4, §2b; 07 Group A             |
| Transaction-invariant audit (NQ-11), sanitization-path trace (NQ-12), a11y audit (NQ-13), runtime profiling (NQ-14)               | In-repo audit/measurement whose _output_ would feed a **later** decision. Not implementations of the current twenty. Queued in 07 under `[REPO]`/`[MEASURE]`, not scheduled here.              | 06 §5.1, §5.6; 07 Group D            |
| Anything for Q-3, Q-14, Q-15, Q-16, m-1 … m-7                                                                                     | Informational; block no decision.                                                                                                                                                              | 07 Groups A, D, E                    |

### 2.3 Deferred — not schedulable

| Task                                     | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T-118d** — hosting / deployment target | The single explicitly-**Open** item inside the accepted set. Q-2 "is a decision to make, not a fact to find" — no repo fact substitutes for it, and inventing a canonical URL would embed a guess in sitemap, robots, OG images and user-visible share URLs. It carries **no size and no wave**. Its output is a _new ADR_, after which the implementing work can be planned. Until then the localhost fallback stands, flagged in the ledger by T-120b. |

### 2.4 Gated rather than ready (16 tasks)

Each is scheduled into a wave but is **NOT READY** until its question answers. Each carries the standing default from `07-Open-Questions.md` §Standing-defaults as its pre-committed fallback, so no gate can stall indefinitely.

| Task                   | Gate     | Answering class                                     | Default in force (= fallback if unanswered)                                                                                                                                  |
| ---------------------- | -------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-116b, T-116c         | **Q-4**  | [GCP]/[INTENT] — _see incoherence note §5.2_        | Report-then-handle (T-116a) lands regardless; activation is deferred with the reason logged in the ledger.                                                                   |
| T-114d                 | **Q-9**  | [DATA]/[GCP]                                        | Remove the dead read paths and their zero-fabricating fallbacks. Honest-UI is out of scope of the gate — it is policy on both branches.                                      |
| T-109b, T-109c, T-109d | **Q-12** | [INTENT] author                                     | Per-schema: wire into the write path if adoption was intended, else delete. **No schema stays declared-but-unenforced.**                                                     |
| T-115c                 | **Q-10** | [OPS]/[GCP]                                         | **No alignment yet** — the three divergent admin-authority predicates stay as-is until the live authority source is known. This is the one gate whose default is _inaction_. |
| T-108b                 | **NQ-1** | [OPS]/[GCP]                                         | Retain dual indexes/queries/fields until the deploy state is confirmed.                                                                                                      |
| T-108c, T-108d         | **Q-5**  | [DATA]+[OPS]                                        | Retain all dual read paths, `@deprecated` fields, and legacy indexes; they are assumed load-bearing until a data sample proves otherwise.                                    |
| T-119a                 | **Q-8**  | [INTENT] product                                    | Delete each unclaimed kind with its registry entry, schema weight and collapse logic.                                                                                        |
| T-119b                 | **Q-11** | [INTENT] product                                    | Delete unclaimed members; the kana-practice gap resolves in whichever direction the gate answers.                                                                            |
| T-119c                 | **Q-13** | [INTENT] product                                    | Delete (behavior-neutral) unless claimed as pending.                                                                                                                         |
| T-119d                 | **Q-6**  | [GCP]/[OPS]                                         | Delete the un-called callable unless an out-of-repo operator invocation is confirmed.                                                                                        |
| T-119e                 | **Q-17** | [INTENT] author                                     | Delete the toolchain + scaffold SVGs. Q-17's own answerability is rated **Low** — under ADR-119 an undecidable gate resolves to the default.                                 |
| T-110b                 | **NQ-3** | Closed-by-decision — **veto window, not a blocker** | Default = **delete**. NQ-3 sits in 07 §0 as _resolved-by-decision_; the gate is an owner-veto opportunity, not an unanswered question. _See §5.3._                           |

**Q-1 is a Wave-1 readiness item, not a task gate.** Production project identity gates _verification_ of ADR-106/107/108/114/116/118 but blocks no task's execution. Per kernel gate-rule 4 it belongs to Wave 1's readiness, and every wave containing gated tasks must open with a question-resolution item naming its questions (kernel gate-rule 3) — that scheduling lives in files 02/03/08, not here.

---

## 3. The backlog

**Legend.** **Size** S ≤1d · M 2–4d · L 5–8d (XL is disallowed — any task reaching it must be split). **Status** Ready / Gated Q-n / Open. **Traces to** = owning ADR → driving findings → evidence cluster → corpus file. **Standards** = the CS-n rules from `04-Coding-Standards.md` the task's output must satisfy. Corpus paths are abbreviated `assess/nn` = `architecture-assessment/nn-*.md`, `disc/nn` = `project-discovery/nn-*.md`.

---

### ADR-120 — Every staged change records its completion state (P1, highest leverage)

#### T-120a — Create the in-repo migration ledger

**Size** S · **Wave** 1 · **Status** ✅ **DONE** (Sprint 1) — _was: Ready_
**Delivered** `docs/migrations-ledger.md` (new) + `docs/README.md` index entry. All four acceptance criteria verified. The `Rows` table is deliberately empty — backfilling it is T-120b.
**Traces to** ADR-120 (AD-20) · RC-2/3/5/6/7/10 (cross-cutting), CX-7, W-21, TD-13 · cluster **C16** · `assess/04`, `/05`, `/11`
**Description.** Establish the ledger artifact itself: its in-repo location, its format, and the four required fields every row carries — intended end state, current stage, owner, review-by date. This is the structural fix for the corpus's meta-finding, that six of twelve root causes reduce to staged work whose later steps had no recorded status.
**Acceptance criteria**

- A ledger file exists in-repo at a documented path, with a stated format and a worked example row.
- Every row schema field is mandatory and named: intended end state · current stage · owner · review-by date. A row missing any of the four is invalid by the format's own statement.
- The ledger's own entry-creation obligation is written down: landing a staged change adds a row in the same change.
- The ledger is discoverable from the docs index (coordinates with T-120c).
  **Standards** CS-3 (forward-provisioning requires a ledger entry), CS-7
  **Regression scope** None behavioral — a new documentation artifact. Risk is adoption, not breakage.
  **Rollback** Delete the file; no code depends on it.

#### T-120b — Backfill ledger entries for all in-flight staged work

**Size** M · **Wave** 1 · **Status** ✅ **DONE** (Sprint 1) — _was: Ready_
**Delivered** 16 rows (`LDG-01`…`LDG-16`) in `docs/migrations-ledger.md`, grouped by governing ADR, every stage claim verified against the working tree rather than inherited from the planning documents. Covers all six ADRs named in the criteria, plus ADR-115's Q-10 predicate divergence and the Sprint 0 lint ratchet (which had been landed in stages one commit before the ledger existed). All five code markers cross-referenced.
**Traces to** ADR-120 (AD-20) · RC-3, CX-1, TD-1, W-21 · cluster **C16** · `assess/04`, `/05`, `/07`
**Description.** Populate the ledger with the staged work already in flight, so the plan's own gated dispositions stop being unrecorded assumptions. ADR-120 names these as the ledger's initial entries: ADR-108's removal gate, ADR-109's per-schema Q-12 disposition, ADR-110's Drawer/NQ-3, ADR-114's Q-9 analytics, ADR-119's five delete-unless-claimed gates, and ADR-118's Open hosting.
**Acceptance criteria**

- Every gated disposition in the ADR set (ADR-108, -109, -110, -114, -118, -119) has a ledger row with all four fields populated.
- The notification-migration row names its gate (Q-5 / NQ-1) and its current stage explicitly; it is the template ADR-120 calls for.
- The hosting row records Q-2 as **Open** and flags the `SITE_URL` localhost fallback as the standing hazard.
- No `@deprecated` field or "reconcile later" comment remains without a corresponding ledger row naming its removal condition.
  **Standards** CS-3, CS-12 (scope-tag discipline for anything logged), CS-13
  **Regression scope** None behavioral. Risk: a row that misstates a current stage is worse than no row — each stage claim must be corpus-cited, not assumed.
  **Rollback** Revert the ledger rows; the gated code is untouched by this task.

#### T-120c — Fix the docs ADR index omission and record the ADR process note

**Size** S · **Wave** 1 · **Status** ✅ **DONE** (Sprint 1) — _was: Ready_
**Delivered** `docs/README.md`: ADR 003 added (index now 3 entries ↔ 3 files on disk, verified by scripted count), a completeness rule stating the index must name every file in `adr/`, the ADRs-001–003-remain-in-force record, and the ADR-vs-ledger process note as a comparison table.
**Traces to** ADR-120 (AD-20) · W-21(d), TD-13, S-20 · cluster **C16** · `assess/07`, `/03`
**Description.** The in-repo ADR series (`docs/adr/001`, `002`, `003`) is real and cross-referenced from code, but the docs index omits ADR-003 — a small, concrete instance of the standards-decay the whole decision set is guarding against. Restore index completeness and write the process note distinguishing ADRs (immutable decisions) from the ledger (mutable stage tracking).
**Acceptance criteria**

- The docs ADR index lists every ADR file present on disk; a file-count comparison of index entries against `docs/adr/*.md` matches exactly.
- The process note states the ADR-vs-ledger division: ADRs record decisions at a point in time, the ledger tracks mutable current stage.
- ADRs 001–003 are explicitly recorded as remaining in force (nothing in the 1xx set supersedes 001 or 003; ADR-113 affirms 002).
  **Standards** CS-3, CS-7
  **Regression scope** Documentation only.
  **Rollback** Revert the index edit.

---

### ADR-118 — Configuration is single-sourced (P1; hosting Open)

#### T-118a — One module owns the public-path allowlist; proxy and AuthGate both consume it

**Size** M · **Wave** 1 · **Status** ✅ **DONE** (Sprint 1) — _was: Ready_
**Delivered** `src/shared/constants/public-routes.ts` (new, single source) + 36 tests, consumed by `proxy.ts` (PR-1.4, neutral — `b3ac2de`) and the AuthGate in `lib/providers.tsx` (PR-1.5, behavioral). The live divergence is closed: `/login` is now honored by both consumers. Reconciliation adjudicated in-code at the AuthGate; assets (`sitemap`/`robots`/OG-image) excluded by the `asset` kind, by design rather than omission.
**Traces to** ADR-118 (AD-18) · W-20(a), CX-6, NQ-2 (resolved-by-decision) · cluster **C14** · `assess/03`, `/07`, `/11`
**Description.** The public-route allowlist exists twice and is **already unequal** — the proxy admits `/login`, sitemap/robots and the OG-image pattern; the AuthGate regex admits only the deck landing page, while its comment claims to mirror the proxy. **This fixes a live divergence defect**, not a stylistic duplication. One module becomes the single source; each consumer keeps its own duty (edge redirect vs render splash), expressed as an explicit derivation.
**Acceptance criteria**

- One module exports the allowlist; both the proxy and the AuthGate import it. A search for a second hand-maintained public-path list returns zero.
- Where the two consumers genuinely need different subsets, the difference is an explicit named derivation from the one source — not two independently editable lists.
- The reconciliation of the two currently-unequal sets is recorded as an explicit adjudication (which proxy-only entries the AuthGate must now honor); **no route silently changes between public, splash-gated and redirected** without that decision being written down.
- Adding a public route is demonstrably a one-place change that both the edge and the gate honor.
  **Standards** CS-9, CS-6 (path/config ownership), CS-3
  **Regression scope** Route access semantics at both the edge and the client gate: a wrongly-widened list is an auth-splash bypass; a wrongly-narrowed one hides a public page (SEO/share-link breakage). The OG-image and shared-deck routes are the sensitive entries.
  **Rollback** Restore the two literal lists from git; the module is additive until both consumers switch, so revert is a one-commit import swap.

#### T-118b — One APP_ID derivation shared across app and functions

**Size** M · **Wave** 1 · **Status** 🔒 **BLOCKED** (Sprint 0, `a0bbbc4`) — _was: Ready_

> **BLOCKED — do not implement. Not in Sprint 1 or Sprint 2 scope.**
> **Why.** Acceptance criterion 2 requires both packages to resolve _the same namespace root_. If the two production env vars currently hold different values, satisfying that criterion **is** a tenant repartition: reads and writes move to a different `artifacts/{APP_ID}` root, nothing errors, and no code revert reunites the data (`10-Release-Plan` §3.3(6)). The fact needed to execute safely — do the two production values agree? — is Q-6, which chains to Q-1 (production project identity) and Q-2/T-118d (hosting), and T-118d is `[OPEN]`/not-schedulable. The plan cannot unblock itself here (`08-Implementation-Readiness` §6.2).
> **Rejected reconciliation.** "Land the derivation ungated, gate only the old-variable retirement" does not hold: the derivation _is_ the repartition, and `04-PR-Plan` PR-2.1 concedes the point by requiring the PR body to state **which env var wins**.
> **Unblocks when.** Q-6 is answered with the two production values compared — or the project accepts a deliberate one-time repartition with a backup taken first (see the irreversible-migration rule, `execution-readiness/08` §4).
> **Consequence for Wave 1.** Wave 1 completes at **13 of 14 tasks** and cannot claim ADR-118 success criterion 2. Sprint 2 drops from 8 to 5 task-days with no downstream impact (`execution-readiness/03` §T-118b).
> **Source.** `execution-readiness/03-Task-Status.md` §T-118b (adjudication); `07-Go-NoGo-Decision.md` condition **C-3**.
> **Traces to** ADR-118 (AD-18) · TD-16, W-20(b), R-14, CX-11, OP-19(b) · cluster **C14** · `assess/07`, `/08`, `/11`
> **Description.** The app derives the Firestore namespace root from `NEXT_PUBLIC_APP_ID` and the functions package from `NOTIFICATIONS_APP_ID`, each with its own copy of the same default literal. A mismatch silently splits app and functions across two tenant roots. One derivation replaces both.
> **Acceptance criteria**

- `APP_ID` has exactly one derivation consumed by both packages; a search finds no two independent `?? "kana-nihongo-master"`-style default literals.
- The functions package and the app resolve the same namespace root from the same source under the emulator suite.
- The env-contract change is documented in `.env.example` (coordinates with T-118c) and carries a ledger row noting that production agreement is verified by Q-6 before the old variable retires.
  **Standards** CS-6 (path-literal ownership), CS-9, CS-3
  **Regression scope** **Tenant-root split is the failure mode being eliminated and also the risk of the change itself** — a deploy that updates one package's env but not the other's writes to a different `artifacts/{APP_ID}` root. The `artifacts/{APP_ID}` layout itself is explicitly out of scope (05 §NS-7).
  **Rollback** Restore the second env var read; because the old variable retires only after Q-6 confirms production agreement, both remain readable during the transition.

#### T-118c — Add `.env.example` documenting the ~30 referenced env vars

**Size** S · **Wave** 1 · **Status** ✅ **DONE** (Sprint 2) — _was: Ready_
**Delivered** `src/.env.example` documenting all **31** source-referenced variables in 8 groups, each with purpose and observable degradation; `src/.gitignore` gains `!.env.example` (the `.env*` rule would otherwise have excluded the file from the repo); `src/env-contract.test.ts` asserts completeness and absence of credential material. **AC4 is PARTIAL** — its "plus the README" clause references a README that does not exist in the repo; no task in the backlog creates one.
**Traces to** ADR-118 (AD-18) · TD-13, W-20(c), W-6 · clusters **C14**, **C9** · `assess/07`, `/11`
**Description.** The required environment is discoverable only by grepping source, and misconfiguration is silent by design because the integrations are env-gated no-ops. A checked-in `.env.example` documents each variable's name, purpose, and what degrades silently without it — directly mitigating the bus-factor-1 amplifier where bootstrap knowledge lives in one person's untracked `.env`.
**Acceptance criteria**

- `.env.example` exists and enumerates the ~30 referenced `process.env.*` variables across all groups: Firebase client, Firebase Admin, Sentry, PostHog, AI tuning, app-id, site URL, emulator switches.
- Each entry states purpose **and** the observable degradation when unset (this is what makes silent env-gating auditable).
- **No secret values are present** — names, purposes and placeholder shapes only.
- A clean checkout can reach a running dev environment using only `.env.example` plus the README, without grepping source.
  **Standards** CS-3, CS-6, CS-14 (no secrets, no invented values)
  **Regression scope** None behavioral — pure documentation of an existing contract. The one real risk is committing a real secret.
  **Rollback** Delete the file.

#### T-118d — Hosting / deployment target decision

**Size** — · **Wave** — (not schedulable) · **Status** **Open (Q-2)**
**Traces to** ADR-118 (AD-18) · TD-14, W-20(d), R-13, U-1 · cluster **C14** · `assess/07`, `/11`; `disc/13`
**Description.** `lib/site.ts`'s localhost fallback — behind the repository's only TODO, citing an ADR that does not exist — feeds sitemap, robots, `metadataBase` and user-visible share URLs. ADR-118 leaves hosting **explicitly Open**: it is a product/ops decision that no repository fact can substitute for. This entry exists so the gap is visible rather than buried in a TODO.
**Acceptance criteria (of the decision, not of an implementation)**

- A hosting/deployment target is chosen and recorded as a **new ADR**; the implementing work is planned only after that ADR exists.
- Until then, the ledger row created by T-120b carries the hosting decision as Open with an owner and a review-by date, and flags the `SITE_URL` localhost fallback as the standing hazard.
- The dev-correct localhost fallback is preserved unchanged in the meantime.
  **Standards** CS-3, CS-6
  **Regression scope** None while Open. Any premature canonical URL would embed a guess into sitemap, robots, OG images and share URLs — the specific harm ADR-118 refuses.
  **Rollback** N/A — nothing ships.

---

### ADR-101 — Feature public APIs are enforced (P1)

#### T-101a — Define and publish root barrels as the public API for all 9 features

**Size** M · **Wave** 1 · **Status** ✅ **DONE** (Sprint 2) — _was: Ready_
**Delivered** 7 new curated root barrels (admin, ai, flashcard, game, kana, notifications, user); `command-palette` and `home` already had one. All **110** cross-boundary symbols are covered, verified by script. Additive only — no import site migrated (that is T-101b), so deep imports still resolve and this is a stable intermediate state.
**AC4 finding (feeds T-101b / T-104a).** Exactly **one** sub-barrel qualifies for retirement: `features/admin/components/content` — single consumer `app/[locale]/(main)/admin/content/page.tsx`, zero internal consumers. A first pass suggested 20 candidates, but that count only measured `@/`-alias imports; re-run with relative-path resolution, **50 sub-barrels have internal consumers and must stay**. Acting on the uncorrected list would have deleted barrels still in use.
**Traces to** ADR-101 (AD-01) · W-3, S-1, CX-4, TD-4 · cluster **C3** · `assess/03`, `/02`, `/11`; `disc/08`, `/10`
**Description.** Only 2 of 9 features expose a root barrel, so "feature boundary" is a directory name rather than a contract. Each feature gains exactly one root barrel that is a **curated** export list — the single legal cross-feature import surface. This is the prerequisite for the migration (T-101b) and the lint rule (T-101c).
**Acceptance criteria**

- All 9 features have a root barrel at `features/<name>/index.ts`.
- Each root barrel is a curated export list, **not** an `export *` chain over everything internal — reviewable as an intentional public API.
- Every symbol currently deep-imported across a feature boundary is either exported from the owning feature's root barrel or explicitly designated internal (which makes it T-101b's job to remove the import site).
- Sub-directory barrels whose only clients were deep cross-feature imports are identified for retirement (WR-1; executed with T-101b / T-104a).
  **Standards** CS-7 (barrel = public-API surface, not per-directory), CS-9, CS-8
  **Regression scope** Build graph only at this step — barrels are compile-time. Risk is an over-broad barrel degenerating into "everything is public," which ADR-104 counters for the largest feature.
  **Rollback** Delete the added barrels; no import site depends on them until T-101b.

#### T-101b — Migrate the 43 deep-import sites onto barrel imports

**Size** L · **Wave** 1 · **Status** ✅ **DONE** (Sprint 4, retried) — _was: Deferred_

> **History.** First attempted Sprint 3: 151 statements across 88 files migrated, type-checked clean, then the production build failed in four ways (Admin SDK into the client bundle; a barrel-level `flashcard ↔ notifications` cycle; client hooks into a Server Component; the fix to the third spreading to more entry points). Reverted to `776c844`. Owner adopted **ADR-101 Amendment 1** (two entry points per feature) and directed T-102a/b to land first.
>
> **Retry (this entry).** With the cycle closed (T-102b) and `@/features/flashcard/server` + `@/features/notifications/server` added, the same migration was re-run. **Production build is green.** All four original failure classes resolved:
>
> 1. Admin-SDK values (`getPublicSharedLessonPreview`, `listPublicSharedLessonUrls`) moved to `flashcard/server`; only their type stays on the client barrel (erased, no runtime edge).
> 2. The cycle is gone (T-102b) — nothing to re-trigger.
>    3–4. `admin.actions.ts` and `content.service.ts` — both server-side — now import `@/features/notifications/server` / `@/features/flashcard/server` instead of the client barrels that dragged in `useEffect`-calling hooks.
>
> One further gap closed during this retry: `notifySystemEvent` had been placed on the _client_ barrel (needed there for admin's now-relocated consumer) — removed from the client barrel entirely, since Vitest's browser-mode transform cannot load an Admin-SDK-backed `"use server"` action the way a real Next.js build strips it into an RPC stub. Caught by a browser-suite regression (51 → 46 → 51), not by inspection.
>
> **Corrected inventory (verified, not estimated):** 152 `from`-statement rewrites + 4 inline `import()` type refs across 89 files. Zero deep cross-boundary imports remain except the 3 sanctioned `@/features/<f>/server` edges (Amendment 1's second entry point, used feature-to-feature exactly as designed).
> **Traces to** ADR-101 (AD-01) · W-3, CX-4, TD-4 · cluster **C3** · `assess/03`, `/11`; `disc/08`
> **Description.** Move every cross-feature deep import onto the owning feature's root barrel — the 43 sites into `flashcard/types`, the 9 into `flashcard/games/match/config`, the 4 into `flashcard/utils/rbac`, and the 4 into the single file `ShareModal`. This is the mechanical migration that makes the boundary rule enforceable without a permanent exception list.
> **Acceptance criteria**

- A search for cross-feature imports that bypass root barrels (pattern `@/features/<f>/<subpath>` from a different feature, tests excluded) returns **zero**.
- The count of external import sites into `flashcard/types` is **0** (was 43).
- The build, the full type-check, and all five test suites pass with no behavioral diff — this migration changes import specifiers only.
- Sub-directory barrels left with no internal consumers after the migration are removed (WR-1).
  **Standards** CS-9, CS-7, CS-8 (the two `rbac.ts` collision stops mattering once both are barrel-only)
  **Regression scope** Broad but shallow: any missed re-export produces a compile error, not a runtime one. Watch for accidental import-cycle creation through barrels and for barrel-induced module-init order changes in modules with side effects.
  **Rollback** Revert the commit; the barrels from T-101a remain and are harmless.

#### T-101c — Add the ESLint import-boundary rule and set it to error

**Size** S · **Wave** 1 · **Status** ✅ **DONE** (Sprint 4) — _was: Ready_

> **Delivered.** `import/no-restricted-paths` (already available via `eslint-config-next`, no new dependency) configured as 10 zones — one per feature (may import own internals + every feature's `index.ts`/`server.ts`, never another feature's internals) plus one for `app/` (may only mount the two sanctioned entry points). Same uniform exception list reused across all zones; no feature-specific carve-outs. Test/story files exempted via flat-config `ignores` — a `vi.mock()` naming a cross-feature path is not a runtime coupling.
>
> **Deliberately out of scope:** `lib/**` is untouched by this rule. That boundary (`lib` importing `features`) is ADR-103's concern and lands separately as **T-103b**; `lib/providers.tsx` needs no exception here since it already imports only bare feature barrels post-T-101b.
>
> **Verified by experiment, not inspection** (same discipline as the Sprint 0 CI-lint proof): injected a probe importing a genuine deep path (fails, with a message naming ADR-101), a `/server` path (passes), and a bare barrel (passes) — from both a feature and from `app/`; a same-feature deep self-import (passes); a test-file cross-feature mock (passes). Full existing codebase: **0 errors** — the T-101b migration left nothing for this rule to catch. `LDG-17` closes: its stated end state (migration complete **and** rule at `error`) is now fully reached.
>
> Also corrects the stale line comment ("~46 pre-existing files") to the freshly re-verified count of **47** (grown from the earlier ~44 during this session's work; cross-checked against ESLint's own `max-lines` output, not just `wc -l`).
> **Traces to** ADR-101 (AD-01) · W-3, S-1, S-15, P-1 · cluster **C3** · `assess/03`, `/02`
> **Description.** Convert the boundary from convention into enforcement, using the mechanism the repo has already proven — the audio boundary is an ESLint _error_ with a teaching message, installed after a real incident. Also folds in the stale standards-count correction (UR-4).
> **Acceptance criteria**

- Introducing a deep cross-feature import fails `lint` locally with a message **naming this ADR** (matching the audio rule's teaching-message precedent).
- The rule is severity `error`, not `warn`.
- The rule's exception list contains only the enumerated sanctioned edges: the composition root `lib/providers.tsx`, and `app/` orchestrators importing feature roots. No feature-specific exceptions.
- The stale `eslint.config.mjs` standards-count comment ("~46 pre-existing files over the limit") is corrected to the verified count of 44 or removed (UR-4).
  **Standards** CS-9, CS-7, CS-2 (the count comment)
  **Regression scope** A too-broad rule blocks legitimate intra-feature imports and stalls all other work; a too-narrow one silently permits the violation class. The pre-commit gate runs lint, so an error-severity mistake blocks every commit — verify against a full clean run before merging.
  **Rollback** Downgrade to `warn` or remove the rule block; single-file change.

---

### ADR-103 — `lib` never imports `features` (P2)

#### T-103a — Relocate the admin log types consumed by `lib/logging/public.ts`; remove the back-edge

**Size** S · **Wave** 1 · **Status** ✅ **DONE** (Sprint 2) — _was: Ready_
**Delivered** `lib/logging/log-types.ts` (new) is the single declaration site for `AdminLog`/`LogLevel`/`LogType`/`LogSource`; `LOG_SOURCES` is a const tuple from which both the union and `logSourceSchema` derive. `features/admin/types/log.types.ts` re-exports the vocabulary and keeps only its own `AdminLogFilters`/`PaginatedLogs`, so admin's 22 consuming files were untouched. Cycle B is gone: `lib/logging → features/admin` is now **0** imports, `features/admin → lib/logging` is 5.
**Observed, not fixed (out of AC scope):** `canonicalLevelSchema` in `lib/logging/schema.ts` still restates `CanonicalLogLevel` from `public.ts` — the same hand-synced-pair defect AC3 fixed for `LogSource`, but confined within `lib/` so it is not a boundary issue. Candidate for a future tidy.
**Traces to** ADR-103 (AD-03) · W-2, RC-12, S-1 · cluster **C3** · `assess/03`, `/04`, `/11`
**Description.** The shared infrastructure layer imports its canonical log vocabulary (`AdminLog`, `LogLevel`, `LogSource`, `LogType`) from `features/admin/types` — infrastructure owning its vocabulary from a consumer. Relocate the types to the layer that owns the pipeline and merge the lib-side zod duplicate into one declaration.
**Acceptance criteria**

- A search of `lib/` for `@/features` matches **only** `lib/providers.tsx` (the one sanctioned composition-root edge).
- The log type vocabulary has exactly **one** declaration site, under `lib/logging`; `features/admin` imports from there.
- `logSourceSchema` **derives** from the relocated types rather than restating them — one vocabulary, not a hand-synced pair.
- Cycle B (the `admin ↔ lib/logging` pair of TD-4) no longer exists.
  **Standards** CS-9, CS-6, CS-8
  **Regression scope** A mechanical import-path rename wave across the admin log service, actions and reports components. Type-only, so failures are compile-time. Watch the zod-enum merge: a narrowed enum could reject stored `LogSource` values (the normalizer that maps unknown sources to `"server"` must survive intact — see T-119b).
  **Rollback** Revert; the import direction returns to its current state with no data implication.

#### T-103b — Extend the boundary lint to forbid `lib → features`

**Size** S · **Wave** 1 · **Status** ✅ **DONE** (Sprint 4) — _was: Ready_

> **Delivered.** A third `import/no-restricted-paths` zone: `target: "./lib"`, `from: "./features"`, no zone-level `except` at all — this is the absolute rule RC-12 calls for, not a narrower one with carve-outs. The single sanctioned edge, `lib/providers.tsx`, is excluded at the config-file-matching layer (`ignores`) rather than zone-excepted, so "exactly one entry" is enforced by not checking that file, matching how test/story files are already handled for the T-101c rules.
>
> **Verified by experiment:** a synthetic `lib/__t103b_probe.ts` importing even the _bare_ barrel `@/features/home` fails, with a message naming ADR-103; `lib/providers.tsx` itself — which imports 5 feature barrels — lints clean; the full existing codebase is unaffected (0 errors, same as before this change). Probe created, tested, deleted; tree confirmed clean.
>
> No ledger row needed: like T-103a, this is a direct, single-step completion with no future stage — ADR-103's back-edge is closed and mechanically checkable, full stop.
> **Traces to** ADR-103 (AD-03) · W-2, RC-12, P-1 · cluster **C3** · `assess/03`, `/11`
> **Description.** Make the absolute rule mechanically checkable, with the composition root as the single allowlisted file, so a second back-edge cannot re-establish the pattern that RC-12 warns would make the layering rule uncheckable by grep.
> **Acceptance criteria**

- A synthetic `lib → features` import fails lint.
- The allowlist contains exactly one entry: `lib/providers.tsx`.
- The rule is severity `error` and its message names ADR-103.
  **Standards** CS-9, CS-7
  **Regression scope** Must not collide with the T-101c rule set; both edit the same config. Sequence after T-103a or the rule fails against the existing back-edge.
  **Rollback** Remove the rule block.

---

### ADR-102 — One-way flashcard → notifications (P1)

#### T-102a — Introduce the notifications injection/registry seam for cross-feature actions

**Size** M · **Wave** 1 · **Status** ✅ **DONE** (Sprint 3, re-sequenced) — _was: Ready_
**Delivered** `features/notifications/domain/action-registry.ts` — a kind → handlers seam, dependency-free and Firebase-free, exposed on the notifications public API. The degraded path is the point: an unregistered kind returns `undefined` (the inbox renders without the action, never crashes) and reports **once per kind** through an injected reporter, naming the kind and the fix. 8 unit tests cover it. Additive — `InviteActions` still holds its direct import until T-102b.
**Traces to** ADR-102 (AD-02) · W-1, RC-1, TD-4, S-9 · cluster **C3** · `assess/03`, `/04`, `/07`, `/11`; `disc/08`
**Description.** The notifications platform has a write-side inversion point (registry + `emitNotification` facade) but no render/act-side equivalent, so the inbox must import each kind's action handler directly from its producing feature. Build the missing half: a seam on notifications' public API mapping notification kinds to action handlers, registered by producing features at composition time.
**Acceptance criteria**

- Notifications' public API exposes a kind → action-handler seam; producing features register handlers at the composition root.
- A kind rendered with **no registered handler** degrades explicitly (renders without the action) **and reports** through the logging pipeline — it does not crash and does not fail silently (ADR-102's named new failure mode; CS-12).
- Adding an actionable kind requires **zero** new imports from notifications into any feature — verifiable by inspecting the registration path.
- The seam surface is small and curated; it is a stated public-API obligation of notifications.
  **Standards** CS-6 (no cross-service reach-around), CS-9, CS-12 (report-then-handle for the unregistered-kind path), CS-3
  **Regression scope** Composition-root wiring — a missed registration turns a working action into a silently missing button, which is exactly why the degraded path must report. Notifications' domain layer must stay Firebase-free.
  **Rollback** The seam is additive; revert leaves the direct import in place and working.

#### T-102b — Rewire `InviteActions` off flashcard access actions onto the seam

**Size** M · **Wave** 1 · **Status** ✅ **DONE** (Sprint 3, re-sequenced) — _was: Ready_
**Delivered** `features/flashcard/notifications.ts` registers flashcard's invite-decline handler on the seam; `lib/providers.tsx` calls it once at module scope so registration precedes any inbox render; `InviteActions` resolves handlers through the registry and names no feature. **`features/notifications` now imports zero features** — the repository's only feature-level value-import cycle is closed, which unblocks the T-101b retry (`LDG-17`).
**Traces to** ADR-102 (AD-02) · W-1, RC-1 · cluster **C3** · `assess/03`, `/04`; `disc/08`
**Description.** Close the repository's only feature-level value-import cycle by moving the one back-edge — notifications' `InviteActions` importing flashcard's `declineInviteAction` — onto the seam built in T-102a. Flashcard registers its invite accept/decline handlers; the inbox renders them through the registry.
**Acceptance criteria**

- A search of `features/notifications/` for `@/features/` (other than itself) returns **zero**.
- The invite **accept and decline** flows work end-to-end with flashcard's handlers registered through the seam, observable via the existing realtime e2e path.
- Notifications builds and its tests pass with flashcard absent from its import graph.
  **Standards** CS-9, CS-6, CS-4 (presentational leaf raises events, does not call cross-feature services)
  **Regression scope** The invite accept/decline user flow is the highest-value path touched by Wave 1. A registration timing bug renders the inbox without action buttons. The e2e realtime path is the regression net.
  **Rollback** Revert to the direct import; the seam remains and is unused.

#### T-102c — Lint rule forbidding notifications → flashcard imports

**Size** S · **Wave** 1 · **Status** Ready
**Traces to** ADR-102 (AD-02) · W-1, RC-1, TD-4, P-1 · cluster **C3** · `assess/03`, `/11`
**Description.** Encode the one-way direction as a hard rule so the lattice risk RC-1 names — each new actionable kind adding another backward import — cannot materialize silently.
**Acceptance criteria**

- An import from `features/notifications/**` to any other feature fails lint with a message naming ADR-102.
- The rule has **no exceptions**; notifications is feature-agnostic by contract.
- The rule is severity `error`.
  **Standards** CS-9, CS-7
  **Regression scope** Sequence after T-102b or the rule fails against the existing back-edge and blocks the pre-commit gate.
  **Rollback** Remove the rule block.

---

### ADR-117 — Coverage follows risk (P1)

#### T-117a — Unit tests for the SRS math (`domain/srs`)

**Size** M · **Wave** 2 · **Status** ✅ **DONE** (Sprint 5) — _was: Ready_
**Delivered** 33 tests in `domain/srs.test.ts` covering `deriveStatus`, all four `computeNextSRS` grade branches, `nextReviewAt` scheduling, and the new/due/mistake card selectors. Discrimination verified empirically: an injected off-by-one in Hard's interval math broke exactly 2 tests, confirmed, then the source was reverted (`git diff --stat` clean).
**Traces to** ADR-117 (AD-17) · W-16, TD-2, OP-23, S-10 · cluster **C8** · `assess/02`, `/03`, `/07`, `/09`
**Description.** `progress.service`'s SRS logic is the highest-consequence untested unit in the repository — scheduling math whose regressions are user-data-affecting and hard to notice. It is also a named allocation priority in ADR-117 and sits under paths that later waves rewrite.
**Acceptance criteria**

- Direct unit tests exist for the SRS scheduling logic; a search for SRS/progress test references returns > 0 (was 0).
- Tests cover interval progression, the grading-to-interval mapping, and boundary transitions (first review, lapse, and the daily-review counter path that ADR-116's swallow-site work also touches).
- A deliberately introduced off-by-one in the interval calculation fails at least one test — the suite discriminates, it does not merely execute.
- Tests are pure unit tests in the unit suite (no emulator dependency).
  **Standards** CS-5, CS-8 (`*.test.ts` naming), CS-6
  **Regression scope** None — additive tests. The risk is a test that codifies current _buggy_ behavior as correct; each assertion should be justified against the domain rule, not against observed output.
  **Rollback** Delete the test file.

#### T-117b — Unit tests for the sharing-RBAC `resolveRole` engine

**Size** M · **Wave** 2 · **Status** ✅ **DONE** (Sprint 5) — _was: Ready_
**Delivered** 28 tests in `utils/rbac.test.ts` against `rbac.ts`'s real engine (not `shared.service.ts`'s divergent copy). Covers all 5 role-resolution steps in priority order, the exact `ownerId ?? userId` owner semantics (including the legacy-fallback and ownerId-wins-over-stale-userId cases), the public-link editor cap, and deny-by-default. Discrimination verified: reverting the `ownerId ?? userId` order to `userId ?? ownerId` broke exactly the dedicated divergence test.
**Traces to** ADR-117 (AD-17) · W-16, TD-2, OP-23, OP-5 · clusters **C8**, **C11** · `assess/02`, `/03`, `/09`, `/11`
**Description.** `resolveRole` is pure, security-relevant, has 9 consumers, and zero tests — and it is the convergence target of ADR-115. ADR-117 names it a test-floor priority **precisely so the T-115a convergence lands against a net**. This task must therefore complete before T-115a.
**Acceptance criteria**

- Direct tests exist for `resolveRole`; a search for `resolveRole`/rbac test references returns > 0 (was 0).
- All five roles resolve correctly across the resolution pipeline: per-resource roles, invites, public links, owner.
- The owner-resolution semantics are asserted explicitly at the `ownerId ?? userId` definition — the exact predicate whose inline divergence OP-5 calls the closest thing to a discovered live bug — so T-115a's convergence has a behavioral oracle.
- Deny-by-default is asserted: an unknown user against a private resource resolves to no access.
  **Standards** CS-5, CS-8, CS-13
  **Regression scope** None — additive. Must be written against the **engine's** semantics, not against `shared.service.ts`'s divergent inline copy, or it will certify the wrong behavior.
  **Rollback** Delete the test file.

#### T-117c — Tests for the flashcard data services

**Size** L · **Wave** 2 · **Status** ✅ **DONE** (Sprint 5) — _was: Ready_
**Delivered** Emulator-tier coverage for `lesson-save` (create/update/delete/reorder/no-op diffs, 10 tests), `card.service` (CRUD + batch reorder, 5 tests), `comment.service` (CRUD + notification-skip, 11 tests), `access.service` (invite lifecycle, 6 tests), `shared.service` (`getSharedLesson`'s access gate + field-stripping, 7 tests), plus a unit-tier `comment-validation.test.ts` (5 tests) for the pure sanitize/validate helpers. New shared harness (`services/__tests__/emu-auth.ts`) signs the ambient client SDK into the Auth emulator via a minted custom token, since none of these services accept an injectable `db`. **Two production bugs found and pinned as labeled regression tests, not silently fixed:** (1) `syncInviteToCollaborator`'s client-side write is rejected by `firestore.rules` for every first-time invite acceptance (the rule only allows the owner or an existing editor to update a lesson doc); (2) `getSharedLesson` masks that same failure as a plain 404 via its blanket `permission-denied → null` catch.
**Traces to** ADR-117 (AD-17) · W-16, TD-2, OP-23 · cluster **C8** · `assess/02`, `/03`, `/07`, `/09`
**Description.** All flashcard data services are unguarded: `lesson-save`'s diff-based batch writer, `card`, `comment`, `access` and `shared` services. These are the paths ADR-106, ADR-109 and ADR-115 rewrite, so this is the regression net for Waves 3–5.
**Acceptance criteria**

- `lesson-save`'s diff-based batch writer has direct tests covering create, update, delete and reorder diffs, including the no-op diff.
- `shared.service`, `access.service`, `card` and `comment` services each have service-level coverage in the emulator suite where they touch Firestore.
- Tests run in the emulator tier where a real Firestore interaction is under test, and in the unit tier where the logic is pure — the split is explicit, per the five-suite topology.
- Test names state the invariant being protected, not the method being called.
  **Standards** CS-6 (execution-context marking mirrored in the tests), CS-8, CS-5
  **Regression scope** None to production code. The emulator tier carries a JDK dependency (R-15, an accepted cost); a flaky emulator setup here would slow every later wave.
  **Rollback** Delete the test files.

#### T-117d — Rules-suite coverage for the uncovered collections

**Size** L · **Wave** 2 · **Status** ✅ **DONE** (Sprint 5) — _was: Ready_
**Delivered** 44 new tests appended to `firestore-rules.test.ts` (root): lessons (owner CRUD, stranger deny, public read, editor-vs-viewer update), cards (owner/editor write, viewer deny, public-lesson read), comments (role-gated create, author/editor update-delete), `admins` (self-read only; **no client write path exists at all — self-grant is provably impossible**), `system_logs` (admin-only read; zero client writes, even for admins), `sharedProgress` (owner-only). **Second production bug found:** the cards `write` rule's editor clause dereferences `resource.data.lessonId`, which is `null` on a CREATE — an invited editor can update existing cards but cannot add a new one; only the owner can. Pinned as a labeled discovered-gap test, not silently worked around. **3 collection-group-read tests written and correct but `.skip()`-gated** on a confirmed local tooling limitation: `cloud-firestore-emulator-v1.20.4` throws on any `collectionGroup("lessons")` query under this rule regardless of data shape, reproduced 3 ways (rules-unit-testing, the ambient real connection, zero-filter query) — not a rules defect.
**Traces to** ADR-117 (AD-17) · OP-24, W-16, TD-2 · cluster **C8** · `assess/09`, `/03`, `/11`
**Description.** The Firestore rules suite covers a minority of the rules surface. The uncovered blocks are exactly the ones later waves modify: lessons/cards/comments sharing, `admins`, `system_logs`, `sharedProgress`, and the collection-group read. Without them, ADR-114 and ADR-115 rules changes are unverifiable.
**Acceptance criteria**

- Every collection with a `firestore.rules` block appears in the rules suite — the named gaps (lessons/cards/comments, `admins`, `system_logs`, `sharedProgress`, collection-group read) all gain tests.
- Each block has both an **allow** and a **deny** case; a rules file that grants blanket read fails the suite.
- The collection-group read test asserts the public-lesson access predicate, giving T-114a and T-115a a rules-side oracle.
- The `admins` collection test asserts that admin authority cannot be self-granted from the client — relevant to the Q-10 question T-115c is gated on.
  **Standards** CS-13, CS-8, CS-9
  **Regression scope** None to production code. A rules test written to match a _wrong_ current rule certifies the wrong posture — each deny case must derive from the intended access model, not from observed behavior.
  **Rollback** Delete the test files.

#### T-117e — Baseline coverage for the four zero-coverage features

**Size** L · **Wave** 2 · **Status** ✅ **DONE** (Sprint 5) — _was: Ready_
**Delivered** `game`: `combo.test.ts` + `tier.test.ts` (18 tests) for the named shared scoring/tier engine. `ai`: `gemini-dedup.test.ts`, `gemini-parsing.test.ts`, `gemini-distractors.test.ts` (26 tests) covering deck-generation dedup, output-parsing/error-classification, and Match-mode distractor generation (transport mocked, real filtering/clamping/fallback logic exercised). `command-palette`: `actions.test.ts` (5 tests) — this feature's only real "domain logic" is its static route/icon data's own consistency (cmdk owns the actual fuzzy-search). `home`: `useHomeState.browser.test.tsx` (10 tests, new `renderHook`-from-`vitest-browser-react` pattern for this repo) covering the hook's real derivation logic (primaryCount's action-based branch, recentLessons ordering, kanaPct rounding/capping) with every dependency mocked at the module boundary.
**Traces to** ADR-117 (AD-17) · OP-23, W-16, TD-2 · cluster **C8** · `assess/02`, `/09`
**Description.** `ai`, `game`, `home` and `command-palette` have zero test files. ADR-117 sets the floor that every feature has unit coverage of its domain logic; this task establishes that floor for the four features that have none.
**Acceptance criteria**

- Each of `ai`, `game`, `home`, `command-palette` has at least domain-logic unit coverage — the feature's decision/derivation logic, not its rendering.
- The `game` session/scoring/tier engine (shared by both flashcard game modes and kana) is covered, since it is a genuine cross-feature shared unit.
- Coverage targets risk, not line count: no test exists purely to raise a percentage.
- Each feature's tests run in the unit tier and pass without emulator or browser dependencies, unless the feature genuinely requires one.
  **Standards** CS-5, CS-8, CS-1 (recognizing the genuinely-shared game engine)
  **Regression scope** None — additive. Scope creep is the real risk: the floor is domain-logic coverage, not comprehensive coverage.
  **Rollback** Delete the test files.

---

### ADR-116 — Observability activates; report-then-handle (P1)

#### T-116a — Apply report-then-handle to the 17 swallow sites

**Size** L · **Wave** 2 · **Status** ✅ **DONE** (Sprint 5) — _was: Ready_
**Delivered** Re-grepped rather than trusting the assessment-time count (codebase has moved since): found 15 in-scope swallow sites on real-state writes (SRS: `progress.service.ts`, `useMatchScoring.ts`, `FlashcardPractice.tsx`, `useCardSessionState.ts`; Storage cleanup: `useLessonBuilder.ts` ×2, `lesson.service.ts`, `lesson-save.ts` ×2; login logging: `auth.service.ts`, `useFirebaseAuth.ts`; invite delivery: `useFirebaseAuth.ts`, `access.service.ts`; card-schema heal: `card.service.ts`; admin cleanup: admin `user.service.ts`) — matching the task's own SRS/Storage/invite-delivery priority order. Each now both `console.error`s with the existing `"[scope]"` tag convention (local dev visibility, unchanged) **and** reports through `enqueueClientLog`/`persistSystemLog` into `system_logs` (production durability, new) before continuing its original fire-and-forget handling — no primary flow gained a new blocking failure. 6 new `ActivityAction` constants added for the failure classes. **3 audio sites** (`shared/audio/channels.ts` ×2, `googleTranslateTts.ts`) were inspected and deliberately left alone — ephemeral playback-control swallows, not real-state, out of W-17's own framing. **Root-cause fix, not a workaround:** `enqueueClientLog`'s static import of its "use server" action pulled the whole server-action chain (down to `firebase-admin`'s `server-only` guard) into any module that merely imported it, transitively breaking `GameEngine.test.ts` the moment `progress.service.ts` (reachable via `utils/learningEngine.ts`'s barrel re-export) gained the import; fixed by making that import lazy (`await import("./actions")` at call time), which benefits every existing and future caller, not just this task's new ones. **Scope note:** `eslint.config.mjs`'s ratchet-list comment and ledger row `LDG-16` both say "T-116a owns the react-hooks entries" (6 files' `react-hooks/set-state-in-effect` warnings) — that scope is absent from this task's own AC in `02-Execution-Waves.md` and was not attempted; flagged as a stale cross-reference for the user to reconcile, not silently actioned either way.
**Traces to** ADR-116 (AD-16) · W-17, R-6, OP-22, S-12/S-21 · cluster **C13** · `assess/03`, `/08`, `/09`, `/11`
**Description.** Seventeen swallow-all catches discard failures of **real state** — SRS counters, Storage cleanup, invite-notification delivery, login logging — not merely telemetry. Each must route the error through the existing logging pipeline **before** applying its fail-open handling. The deliberate fire-and-forget UX contract is preserved; only the invisibility ends. ADR-116 names SRS counters, Storage cleanup and invite delivery as the ordering priority.
**Acceptance criteria**

- The count of report-less swallows on real-state writes is **0** (was 17); a search for `.catch(() => {})` and bare `catch {}` on state-mutating writes returns zero un-reported instances.
- At least one **non-boundary** layer (service, hook, or action) reports errors — today only the four route boundaries do.
- Each converted site still applies its original handling (fire-and-forget stays fire-and-forget); **no primary user flow gains a new blocking failure** — telemetry never blocks the user.
- Reports carry the bracketed scope tag convention (`"[useLessons]"`-style), and the three sanctioned surfacing styles are respected: render-path throws to a boundary, subscription failures go into state, background writes report-then-continue.
  **Standards** CS-12 (the governing standard), CS-6, CS-5
  **Regression scope** The widest-touching task in Wave 2. Two risks: (a) converting a fire-and-forget site into a throwing one breaks a primary flow; (b) the logging pipeline itself becoming a failure amplifier — it is fire-and-forget by design and must stay so. Sites touching SRS counters intersect T-117a's tests; sites touching invite delivery intersect T-102b.
  **Rollback** Per-site revert; the changes are independent and can be reverted individually.

#### T-116b — Activate Sentry

**Size** S · **Wave** 2 · **Status** **Gated Q-4**
**Traces to** ADR-116 (AD-16) · OP-21, W-17, R-6 · cluster **C13** · `assess/03`, `/08`, `/09`
**Description.** The Sentry wiring is real but double-gated on production credentials and project ownership the repository cannot see. Activation is the conditional leg of ADR-116; the policy leg (T-116a) lands regardless.
**Acceptance criteria**

- Sentry activation is **decided and recorded against Q-4** — live with confirmed credentials and project ownership, **or** explicitly deferred with the reason logged in the ledger. An undecided state is a failure of this task.
- If activated: a deliberately thrown error in a non-production environment appears in the Sentry project, and the `/ingest` proxy carries real traffic.
- If deferred: the wiring is left intact (it is credential-gated, **not** dead code — removing it would presume the credentials do not exist, which the repo cannot know) and the ledger row names the review-by date.
  **Standards** CS-12, CS-3, CS-6
  **Regression scope** Activation adds a live outbound reporting path; verify no PII rides in error payloads and that the pipeline stays non-blocking. Deferral changes nothing.
  **Rollback** Disable via the existing credential gate — no code change needed.
  **Fallback if Q-4 is unanswered** Defer activation, record the deferral and its reason in the ledger. T-116a's value is unaffected: reports land in the in-repo pipeline even with Sentry a no-op.

#### T-116c — Activate PostHog

**Size** S · **Wave** 2 · **Status** **Gated Q-4**
**Traces to** ADR-116 (AD-16) · OP-21 · cluster **C13** · `assess/03`, `/09`
**Description.** PostHog captures exactly one manual `$pageview` despite the wiring promising product events. Activation depends on credentials **and** on the intended analytics scope — a product decision ADR-116 explicitly defers to the owner.
**Acceptance criteria**

- Activation **and the intended analytics scope** are decided and recorded against Q-4 — the near-empty product-event surface is either widened by decision or accepted by decision.
- If activated: at least one product event beyond `$pageview` is captured, and the captured event set matches the recorded scope decision.
- If deferred: the wiring stays intact and the ledger row records the reason and review-by date.
- Whatever is captured carries no user-identifying content beyond what the recorded scope decision authorizes.
  **Standards** CS-12, CS-3, CS-14 (no user-facing string or data leaves without deliberate decision)
  **Regression scope** Analytics capture is a privacy surface — scope creep here is a product-consent question, not a technical one. This task must not be used to widen data collection beyond the recorded decision.
  **Rollback** Disable via the credential gate.
  **Fallback if Q-4 is unanswered** Defer, record, and leave the wiring untouched.

---

### ADR-107 — httpOnly, server-verified session (P1)

#### T-107a — Introduce httpOnly session-cookie issuance and server verification

**Size** L · **Wave** 3 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** `lib/auth-session.ts` (mint/verify/revoke via `adminAuth.createSessionCookie`/`verifySessionCookie(checkRevoked=true)`/`revokeRefreshTokens`), `features/user/actions/session.actions.ts` (`createSessionAction`/`revokeSessionAction` setting/clearing an httpOnly+secure(prod)+sameSite=lax cookie via `next/headers`). `admin.service.ts`'s `assertAdminAction` now verifies the cookie via `verifySessionCookie` instead of the old `verifyIdToken`. 5 emu tests (`lib/auth-session.emu.test.ts`) prove mint→verify round-trip, forged/empty-cookie rejection, revocation (with a deliberate delay to dodge a same-second mint/revoke timestamp tie), and uid fidelity — this harness intentionally skips the `GCLOUD_PROJECT` override other emu tests use, since the emulator stamps its own project onto session cookies regardless of client override. Verified green across unit/browser/emu/E2E. Deliberately did not add a legacy-insecure rollback toggle — re-introducing the exact XSS-bearer-token exposure this task closes is worse than a git revert.
**Traces to** ADR-107 (AD-07) · W-15, R-11, TD-15, RC-4 · cluster **C7** · `assess/03`, `/08`, `/07`, `/04`, `/11`
**Description.** The auth cookie currently carries the raw Firebase ID token and is deliberately **not** httpOnly so the client SDK can refresh it, so any XSS anywhere exfiltrates a live bearer token — for an admin's browser, every admin action. Introduce a server-minted, httpOnly session credential with real server-side verification.
**Acceptance criteria**

- The session cookie is set with the `HttpOnly` flag; the current non-httpOnly rationale comment is gone.
- Server-side verification is **demonstrable**: a request carrying a forged or absent credential is rejected **by verification**, not merely by presence.
- The session lifecycle is complete — mint on sign-in, refresh, and revoke — with revoke actually invalidating the credential server-side.
- Existing compensating controls are preserved unchanged: every server action still re-verifies identity, and Firestore rules still gate all client access.
  **Standards** CS-6 (execution-context marking; `server-only` boundary), CS-9, CS-12, CS-13
  **Regression scope** **The highest-risk task in the plan.** Every authenticated flow depends on it. Specific hazards: sign-in/refresh round-trip regressions, the client SDK's own in-memory token path diverging from the cookie session, and admin surfaces losing authority mid-session. Q-1 (production project identity) gates _verification_ of this in production — direction is fixed, production confirmation is not.
  **Rollback** The new issuance path should ship behind a switch so the previous cookie path can be restored without a redeploy; without that, rollback is a revert plus a forced re-authentication of all sessions.

#### T-107b — Migrate client auth plumbing off the raw ID-token cookie

**Size** M · **Wave** 3 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** `shared/utils/cookie.ts` now exports only `COOKIE_NAME`, with a docblock explaining the httpOnly migration; every client-side `setAuthCookie`/`clearAuthCookie`/`getAuthCookie` is deleted. `useFirebaseAuth.ts`/`auth.service.ts` call the T-107a server actions (`createSessionAction`/`revokeSessionAction`) instead. A repo-wide search confirms zero remaining client reads of the session credential from `document.cookie`.
**Traces to** ADR-107 (AD-07) · W-15, R-11, RC-4 · cluster **C7** · `assess/03`, `/07`, `/04`
**Description.** Remove every client-side dependency on reading the credential from `document.cookie`, so the cookie stops being a JS-reachable bearer token. The client SDK keeps its own in-memory token — this narrows, not eliminates, token exposure to page JS, which is the honest scope of ADR-107.
**Acceptance criteria**

- **No client code reads the session credential from `document.cookie`** — a search returns zero such reads.
- Client auth state derives from the SDK and/or the verified server session, not from parsing the cookie.
- All authenticated client flows (study, sharing, admin) work with the credential unreadable from page JS.
  **Standards** CS-9, CS-6, CS-11 (auth is never persisted to a client store)
  **Regression scope** Auth-state derivation on first paint and after token refresh; the AuthGate splash path (which T-118a also touches) is the most sensitive interaction.
  **Rollback** Revert; T-107a's cookie remains httpOnly, so any restored client read would fail loudly rather than silently — verify before reverting.

#### T-107c — Align cookie lifetime to session semantics; make the edge gate routing-only by contract

**Size** S · **Wave** 3 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** A single `SESSION_COOKIE_MAX_AGE_MS` (5 days) in `lib/auth-session.ts` now drives both the mint call's `expiresIn` and the cookie's own max-age, closing the old 7-day-cookie/1-hour-token mismatch that produced the "loads but every action fails" state. `proxy.ts`'s docblock is rewritten to document the edge gate as routing-UX-only per ADR-107, removing the stale "not httpOnly so the client SDK can refresh it" comment that no longer applied post-T-107a.
**Traces to** ADR-107 (AD-07) · W-15, RC-4, TD-15 · cluster **C7** · `assess/03`, `/08`
**Description.** A 7-day cookie currently outlives the 1-hour token inside it, producing the confusing "page loads, all actions fail" state. Align the credential's lifetime to real session semantics, and write down that the edge gate is a routing-UX check only — never a security boundary.
**Acceptance criteria**

- The cookie's lifetime tracks the server-verifiable session; the stale-cookie "loads-but-fails" state is no longer reachable.
- The edge gate's role is **documented in-code as routing-UX only**, so no future server-side fetch on a "protected" page infers verification from it.
- Expiry produces a clean re-authentication prompt rather than a loaded page with uniformly failing actions.
  **Standards** CS-6, CS-12, CS-9
  **Regression scope** Too-short a lifetime forces disruptive re-authentication; too long re-opens the stale-cookie state. Interacts with T-118a — the edge gate consumes the shared allowlist.
  **Rollback** Restore the previous max-age; single-value change.

#### T-107d — E2E auth regression pass across protected and public routes

**Size** M · **Wave** 3 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** Full `npx playwright test` pass confirmed green across the protected/public route matrix. Found and fixed a real latent bug this migration would otherwise have introduced: `e2e/helpers/sign-in.ts` polled `document.cookie.includes("auth-token=")`, which would hang forever once the cookie became httpOnly (page JS can no longer read it); replaced with a `waitForSessionCookie` helper that polls Playwright's own `page.context().cookies()` API, which does see httpOnly cookies.
**Traces to** ADR-117 (test tier) applied to ADR-107 (AD-07) · W-15, R-11, S-10 · clusters **C7**, **C8** · `assess/03`, `/02`, `/08`
**Description.** The auth change touches the one subsystem with no cheap unit-level oracle. This is the Playwright-tier regression net for the whole ADR-107 sequence, exercising the protected/public route matrix that T-118a's single allowlist now defines.
**Acceptance criteria**

- E2E coverage exists for: signed-out access to a protected route (redirect), signed-in access to a protected route (loads), signed-out access to each **public** allowlisted route (loads without splash), sign-out mid-session, and expired-session behavior.
- The public-route cases are driven by the **single allowlist module** from T-118a, so allowlist and gate cannot drift apart untested.
- The suite fails if the edge gate is bypassed on a protected route or if a public route regresses behind the splash.
- The pass runs in CI alongside the other four suites.
  **Standards** CS-8 (suite naming), CS-9
  **Regression scope** None to production code. E2E flakiness is the practical risk — a flaky auth suite trains the team to ignore red, which is exactly the standards-decay pattern the whole set guards against.
  **Rollback** Delete or quarantine the spec.

---

### ADR-113 — Four-tier state; listeners centralize (P1 listener / P3 affirmation)

#### T-113a — Centralize `useUserProgress` into one shared subscription

**Size** L · **Wave** 3 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** `UserProgressContext.tsx` (Context+Provider, mirroring the pre-existing `NotificationsContext` pattern), mounted once in `lib/providers.tsx`. `useUserProgress.ts`'s read half (`userData`, `loading`) now delegates to the context; all 6 write actions (`addXP`, `completedLesson`, `markLearned`, `recordCharStat`, `resetProgress`) are unchanged. A browser test proves the invariant directly: mounting 3 consumers opens exactly 1 `subscribeUserProgress` call, with correct teardown-on-unmount and simultaneous update propagation to all consumers.
**Traces to** ADR-113 (AD-13) · R-1, S-14, PC-16, R-10 · `assess/02`, `/08`, `/06`; `disc/07`, `/09`
**Description.** `useUserProgress` opens one `onSnapshot` listener **per consuming component** across 10 mount sites, in explicit contrast to the single centralized notifications listener the same codebase already runs. Converge it onto one shared per-entity subscription using the pattern that already exists in-repo.
**Acceptance criteria**

- Mounting N components that read one user's progress opens **one** listener, not N — observable in the subscription implementation and assertable in a test that mounts multiple consumers.
- All 10 `useUserProgress` mount sites share the single subscription; none opens its own.
- Subscription lifecycle is reference-counted: the listener is created on first subscriber and torn down on last unsubscribe, with no leak across route changes.
- Consumer-visible behavior is unchanged — progress data still updates in realtime on every surface that had it.
  **Standards** CS-10 (centralize realtime listeners per entity), CS-11 (context holds a resource, store holds data), CS-5
  **Regression scope** Every authenticated screen — the blast radius R-1 names. Specific hazards: a lifecycle bug that tears down the listener while a consumer is still mounted (silent stale data), and reconnect behavior after network loss. T-117a's SRS tests and T-117c's service tests are the net.
  **Rollback** Revert to per-mount listeners; the change is contained to the hook and its provider.

#### T-113b — Audit remaining per-mount listeners and centralize per entity

**Size** M · **Wave** 3 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** `LessonsContext.tsx` (same Context+Provider pattern) for `lessons`/`sharedLessons`, mounted alongside `UserProgressProvider` in `lib/providers.tsx`. This found a genuine, real 3× listener duplication on `FlashcardDashboard`: the component itself, `useDashboardState`, and `useDashboardModals` each independently called `useLessons()`, opening 3 separate subscription pairs for the same data — now 1. A browser test proves exactly 1 subscription pair for 3 mounted consumers. Also audited `useLeaderboard` (not centralized — phase-exclusive game screens never mount concurrently, so there is no real duplication) and `useCardsWithProgress` (a genuine duplication between `useFlashcardLoader`/`useStudySession`, but an **intentional, already-documented** design split per `useStudySession`'s own docblock explaining why Study mode needs a live subscription distinct from Match/Speed's static snapshot) — both deliberately left as design questions for the owner rather than mechanically merged, to avoid introducing a regression the corpus already reasoned through once.
**Traces to** ADR-113 (AD-13) · R-1, R-10, S-14, PC-14 · `assess/02`, `/08`; `disc/07`, `/09`
**Description.** Extend the centralization rule beyond progress: identify every other per-entity realtime subscription that is opened per consumer rather than once, and converge each. Also confirm ADR-002's four-tier model remains the documented state architecture — the P3 affirmation leg.
**Acceptance criteria**

- A search for `onSnapshot` call sites shows no per-component subscription for an entity that has multiple consumers.
- Each remaining realtime entity has a named single owner (context or shared subscription), documented at its definition.
- ADR-002's four-tier model is confirmed as the documented state architecture, with the centralization rule recorded as its extension; new realtime data follows the centralized pattern.
- The dashboard's concurrent listener count is measurably lower than before Wave 3 (a count, not a percentage — magnitude is unprofiled per NQ-14).
  **Standards** CS-10, CS-11, CS-5, CS-3
  **Regression scope** Same class as T-113a but spread thinner. Over-centralizing genuinely per-surface state would violate CS-11's tier rules — a store is not a substitute for local state.
  **Rollback** Per-entity revert; each centralization is independent.

---

### ADR-114 — Bounded queries and honest UI (P1; analytics gated)

#### T-114a — Add explicit bounds to unbounded listeners

**Size** M · **Wave** 3 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** `subscribePublicLessons` now runs `where("isPublic","==",true)` + `orderBy("createdAt","desc")` + `limit(pageSize)`, backed by a new composite index in `firestore.indexes.json`. `usePublicLessons()` grows the window via resubscribe (`loadMore`/`hasMore`/`loadingMore`) — the same grow-window mechanism `NotificationsContext` already uses for its bounded realtime channel, per the AC's "not a third [mechanism]." A new "Load more" button appears on the discover tab. A dedicated browser test proves the bound (exact `pageSize` argument on every call), the grow-window behavior, and the page-size reset when the signed-in user changes. Verified empirically against the real Firestore emulator (with the new index) that the bounded query executes correctly — this doubles as confirmation that T-117d's rules-suite collection-group read test's known emulator-version limitation is unrelated to query shape. Found and ledgered (`LDG-19`) that the new composite index is declared but not yet deployed to the production Firebase project — deploying `firestore.indexes.json` changes to a shared production project is an infrastructure action outside agent scope; flagged for the owner to run `firebase deploy --only firestore:indexes`.
**Traces to** ADR-114 (AD-14) · R-2, NQ-6, R-19 · cluster **C6** · `assess/03`, `/04`, `/08`, `/11`
**Description.** `subscribePublicLessons` runs a live `collectionGroup` query over all public lessons with no `limit()`, mounted on the flashcard dashboard — every viewer streams the entire public-deck corpus into an un-virtualized grid, with cost growing linearly and unboundedly. Add explicit bounds to it and to every other unbounded listener.
**Acceptance criteria**

- A search across collection/`collectionGroup` subscriptions shows **every** listener carrying an explicit bound; the public-lesson listener has a `limit()`.
- The bounded public-lesson surface remains usable — "see more" is served by pagination or virtualization using one of ADR-112's two sanctioned mechanisms (grow-window resubscribe for this realtime channel), **not a third**.
- The rules-suite collection-group read test (T-117d) passes against the bounded query.
- The bound value is stated with its rationale at the call site, not a bare magic number.
  **Standards** CS-10 (bounded queries; virtualize by trigger), CS-6, CS-12
  **Regression scope** **This changes product behavior** — the dashboard shows a bounded set, a deliberate trade of completeness for bounded cost. Verify the bounded set is ordered deterministically, or users see an arbitrary subset. NQ-6 sizes urgency only; the bound is correct policy regardless.
  **Rollback** Remove the `limit()`; the unbounded behavior returns immediately.

#### T-114b — Replace fabricated dashboard zeros with absent-data rendering

**Size** M · **Wave** 3 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** `getAdminStats()`'s `activeUsersToday`/`totalSessions`/`errorRate` are now `null` — not a fabricated `0` — when `metadata/counters` is absent or missing that field (the misleading "never fabricate" comment now matches the code). `getAdminAnalytics()` no longer substitutes a fabricated all-zero day when `analytics_daily` is empty; an empty collection now correctly yields empty `growth`/`activity`/`errorTrends` arrays, which activates `AdminAnalyticsPageContent`'s existing `isGlobalEmpty` → `EmptyState` path that was previously unreachable dead code (it never saw a truly-empty array because of the fabrication). `AdminStatCard`, `SystemHealthCard`, and `AdminChartContainer` (used by `GrowthChart`/`ErrorTrendChart`) now render a visually distinct muted "no data" state instead of a bold fabricated number — new `noDataSource`/`noChartData` i18n keys in en/ja. 8 new tests (2 emulator, 6 browser) prove the absent-vs-measured-zero distinction at both the service and rendering layers. While writing the browser tests, found and fixed a pre-existing, unrelated latent bug: `AdminContext.tsx` imported `useAdminRoleCheck` through the admin hooks barrel, which eagerly pulled the whole `firebase-admin`/`google-auth-library` chain into any browser bundle touching admin components — fixed via a direct file import plus lazy-importing the one hook (`useAdminRoleCheck.ts`) that statically imported a server action.
**Traces to** ADR-114 (AD-14) · W-11, TD-8, RC-5, OP-16 · cluster **C6** · `assess/03`, `/07`, `/09`, `/11`
**Description.** Admin dashboards substitute fabricated zeros when a metric source is empty, so "Error rate: 0" and "Active users today: 0" render identically whether the system is healthy, idle, or unpopulated — on exactly the surface built to answer that question. This leg is **ungated policy**: fabricated zeros are out of policy on both branches of Q-9.
**Acceptance criteria**

- Admin metrics render a **distinct "no data" state** when the source is absent, visually distinguishable from a true zero.
- **No code path substitutes a literal `0` for a missing metric** — a search of the metric-fallback paths returns zero fabricating fallbacks.
- The real-data path is untouched: live `count()` aggregations and any genuine `analytics_daily` documents render exactly as before.
- An operator can distinguish "healthy", "idle", and "unmeasured" on the dashboard.
  **Standards** CS-14 (i18n for the new absent-data strings; tokens not raw hex), CS-4, CS-12
  **Regression scope** Admin dashboard rendering, including `SystemHealthCard`. New UI states need en/ja message parity — a missing key is a visible defect. Do not conflate "zero results" with "no data source".
  **Rollback** Revert the rendering change; the fabricated-zero behavior returns.

#### T-114c — Replace hardcoded-zero export rows with absent-data semantics

**Size** S · **Wave** 3 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** `exportAnalyticsAction`'s fallback row (emitted only when `analytics_daily` has zero documents) now sets `newUsers`/`featureUsage` to `null` (neither has any live source at all) and `sessions`/`activeUsers`/`errors` to `null` whenever their underlying `metadata/counters` values are themselves absent, rather than hardcoded zeros. The populated-data path (`docs.length > 0`) is untouched — byte-identical for genuine data. Verified the existing CSV flatten/stringify pipeline (`useAnalyticsExport.ts`, `export.utils.ts`) handles the `null`s safely without a ragged-column risk, since the absent-data case only ever produces a single row.
**Traces to** ADR-114 (AD-14) · W-11, TD-8, OP-16 · cluster **C6** · `assess/07`, `/09`
**Description.** The analytics export synthesizes a row with hardcoded zeros, carrying the same fabrication into a file an operator may treat as a record. Same ungated honest-UI policy as T-114b, applied to the export path.
**Acceptance criteria**

- The export emits an explicit absent-data representation rather than synthesized zeros; no hardcoded zero row is produced.
- An exported file makes "no data" distinguishable from "measured zero" without needing the dashboard for context.
- Existing genuine export rows are byte-identical to before for populated data.
  **Standards** CS-14, CS-12, CS-6
  **Regression scope** Any downstream consumer parsing the export's column shape — the absent representation must not break the schema, only the values.
  **Rollback** Revert; single export-path change.

#### T-114d — `analytics_daily` + `metadata/counters`: remove read paths or define a writer

**Size** M · **Wave** 3 · **Status** ⏸️ **RECORDED — still Gated Q-9** (Sprint 9) — _was: Gated Q-9_
**Delivered** The two in-repo-actionable AC items are done: (1) re-verified by grep that zero read paths outside `user.service.ts`/`analytics.service.ts`/`admin.actions.ts` (all fixed by T-114b/c) reference either collection, and confirmed (again) that no writer exists anywhere in `app`, `functions`, or `scripts`; (2) the disposition is recorded against `Q-9` in `docs/migrations-ledger.md`'s `LDG-07` row, updated to reflect the post-T-114b/c state. The delete-vs-complete branch itself remains genuinely open — Q-9 (does an out-of-repo pipeline populate these collections?) cannot be answered from the repository. The task's own "Fallback if Q-9 is unanswered" (delete the dead reads) was deliberately **not self-invoked**: severing a possibly-live external contract is a hard-to-reverse, real-infrastructure decision for the owner to make explicitly, not one an agent should take autonomously just because a fallback clause permits it. Awaiting the owner's answer to Q-9 (or explicit instruction to invoke the standing-default deletion) to close this row.
**Traces to** ADR-114 (AD-14) · RC-5, TD-8, OP-16, W-11 · cluster **C6** · `assess/03`, `/04`, `/07`, `/11`
**Description.** Both collections are read but written by **no** code in the app, functions, or scripts — and the repo had no server compute for months after the readers were built, so no in-repo producer ever existed. Whether an out-of-repo pipeline populates them is Q-9, and it is the delete-vs-complete branch.
**Acceptance criteria**

- `analytics_daily` and `metadata/counters` either have a **defined writer in-repo** or their **read paths are removed** — the disposition is recorded against Q-9 in the ledger, with owner and date.
- No read path silently fabricates values (already guaranteed by T-114b/c, and re-verified here).
- If the claimed branch fires: the collection schemas become a **named external contract** documented as such, with the statement that it must not change unilaterally.
- If the default branch fires: the dead reads and their fallbacks are gone, and the dashboard renders what the live `count()` path actually knows.
  **Standards** CS-6, CS-3 (no capability without a consumer), CS-12
  **Regression scope** Deleting reads could sever a live external contract if a pipeline exists — which is exactly why the gate exists. Note TD-8's side-fact: with no cache writer, the "fallback" aggregation is currently the _only_ path, and its cost is a data-layer concern on either branch.
  **Rollback** Restore the read paths from git; behavior returns to the current (fabrication-free, post-T-114b) state.
  **Fallback if Q-9 is unanswered** Delete the dead reads and their zero-fabricating fallbacks (the standing default). The honest-UI legs have already shipped ungated, so no user-visible correctness waits on this.

---

### ADR-109 — Validate at the write boundary (P1; per-schema gated)

#### T-109a — Audit every server write path and wire zod validation at each boundary

**Size** L · **Wave** 4 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** Full write-path audit completed (every `"use server"` file and every client-SDK write function mapped to whether/what it validates). The cloze `___`-token invariant now has a write-time guard independent of `cardContentSchema`'s own gated (Q-12) disposition: `hasValidClozeToken` extracted as a standalone, exported function in `card.schema.ts` and enforced directly in `saveLessonWithCards` (`lesson-save.ts`) — a cloze card missing/miscounting the token is rejected before any Firestore write, proven by a discriminating emu test. The comment-length limit's hand-synced copies (`comment.schema.ts`, `CommentPanel.tsx`, `CommentInput.tsx`) now derive from one exported `COMMENT_MAX_LENGTH` constant. Also closed a genuine gap the audit surfaced beyond the AC's literal wording: `firestore.rules` had **no** server-side size limit on comment creation at all — the 2000-char cap existed only as client-JS validation, so a caller writing directly with a valid auth token faced no backstop. Added `withinCommentSizeLimits()` to rules, scoped to `create` only (not `update`) since enforcing it retroactively on edits risks locking out any already-stored over-length comment this repo has no way to check for — proven by a new rules-suite test (create ≤2000 succeeds, >2000 fails). The 2 zero-consumer/gated schemas' non-primary-constraint question (T-109b) is satisfied via the "explicitly documented as unenforced-by-decision" branch, not enforcement — see T-109b/c/d. Other identified gaps (e.g. `card.service.ts`'s `createCard`/`updateCard`, confirmed dead/unreachable; `lesson.service.ts`'s `shareLessonSettings`/`updateLessonRoles`, tied to T-109d's gated `publicRoleSchema`) were left as documented findings rather than fixed, since acting on them either touches confirmed-dead code or presumes T-109d's still-open Q-12 answer.
**Traces to** ADR-109 (AD-09) · W-9, TD-5, R-16, PC-7, OP-11 · cluster **C5** · `assess/03`, `/06`, `/07`, `/08`, `/09`
**Description.** Validation is currently narrower than the write surface: real card writes go through `validateAtomicCard` (primary fields only), so meaning/example/hint/cloze-token/difficulty constraints are enforced nowhere. Audit every server write path and wire schema validation at the boundary, so no path claims a protection it lacks.
**Acceptance criteria**

- Every server write path validates through a zod schema at its boundary before persisting; the audit's result is a documented list of write paths and the schema each uses.
- A card write violating a non-primary constraint (over-long `meaning`, malformed cloze) is **rejected on at least one enforced path**, or that constraint is explicitly documented as unenforced-by-decision.
- The cloze `___`-token invariant that study mode depends on has a write-time guard.
- Any limit with multiple hand-synced copies (e.g. comment length 2000) has **one** authoritative source.
  **Standards** CS-13 (the governing standard), CS-6, CS-9, CS-12
  **Regression scope** **Enforcing constraints on a path that never had them can reject inputs previously accepted** — a user-visible behavior change. Existing non-conforming stored data must still _read_ correctly; validation is at the write boundary, not the read boundary. T-117c's service tests are the net.
  **Rollback** Per-path revert; each boundary is independently revertible.

#### T-109b — `cardContentSchema`: enforce or delete

**Size** M · **Wave** 4 · **Status** ⏸️ **RECORDED — still Gated Q-12** (Sprint 14) — _was: Gated Q-12_
**Delivered** Re-verified by grep: still zero non-test consumers (LessonBuilder's card array is plain `useState`, not wired to a resolver; no server action or write-boundary function imports it; AI/import output validates through the separate `generatedCardSchema` instead). The misleading "single validation source of truth" header is corrected to describe the actual current state (declared, unused, gated on Q-12) rather than an adoption that never happened — satisfying the AC's "misleading header is removed or corrected even while the disposition is pending" independent of the enforce-or-delete answer. `LDG-03` in the ledger already tracked this disposition; left as-is (still accurate). Did not wire or delete the schema itself — Q-12 asks for author intent (was adoption planned but unfinished, or is this overtaken?), which isn't answerable from the repository, and the task's own fallback is explicit: do not guess.
**Traces to** ADR-109 (AD-09) · W-9, TD-5, RC-6, R-16 · cluster **C5** · `assess/03`, `/07`, `/08`
**Description.** `cardContentSchema`'s header claims to be "the single validation source of truth shared by client forms, server actions, and runtime parsing of AI/import output" — and it has zero non-test consumers. Its disposition depends on whether adoption was intended and whether production data is compatible.
**Acceptance criteria**

- The schema is either imported by a real write path **or removed** — the "source of truth" header is true or gone.
- The disposition is recorded against Q-12 in the ledger with owner and date.
- If enforced: manual entry, import, and AI output all validate through it, and the compatibility check against existing stored cards is recorded.
- If deleted: the constraints it declared are either covered elsewhere or explicitly recorded as unenforced-by-decision — not silently dropped.
  **Standards** CS-13, CS-3, CS-6
  **Regression scope** The riskiest of the three schemas: enforcement against non-conforming stored data converts a code change into a data migration (TD-5's named trap, and exactly what ADR-108 is stuck in). Enforcement touches three input surfaces at once — manual, import, AI.
  **Rollback** Revert the wiring (enforcement branch) or restore the file (deletion branch).
  **Fallback if Q-12 is unanswered** Do not guess. Hold at documented "pending disposition" in the ledger with a review-by date. **No schema stays declared-but-unenforced without a ledger row** — the misleading header is removed or corrected even while the disposition is pending.

#### T-109c — `privacyModeSchema`: enforce or delete

**Size** S · **Wave** 4 · **Status** ⏸️ **RECORDED — still Gated Q-12** (Sprint 14) — _was: Gated Q-12_
**Delivered** Re-verified: `privacyModeSchema` still has zero non-test consumers — `ShareModal`/`useShareModal`'s privacy-mode writes take plain strings, not this schema. Corrected the misleading "mirrors ShareModal... enforced by the enum itself" comment to state plainly that neither this nor `publicRoleSchema` has a real consumer today, and that the "editor" cap is actually enforced by `rbac.ts`'s `sanitizePublicRole`, not this enum. `LDG-04` already tracks the disposition. Not wired or deleted — same Q-12 author-intent gate as T-109b, same "do not guess" fallback.
**Traces to** ADR-109 (AD-09) · W-9, TD-5, RC-6 · cluster **C5** · `assess/03`, `/07`
**Description.** A zero-consumer schema declaring privacy-mode constraints while real writes bypass it. Same enforce-or-delete rule, smaller surface.
**Acceptance criteria**

- The schema is imported by a write path or removed; no zero-consumer schema retains a source-of-truth header.
- The disposition is recorded against Q-12 in the ledger.
- If enforced: the privacy-mode write path rejects an out-of-vocabulary value.
  **Standards** CS-13, CS-3
  **Regression scope** Privacy mode is an access-control-adjacent field — a narrowed vocabulary that rejects a stored value would break existing decks. Intersects T-115a's deck-access convergence.
  **Rollback** Revert the wiring or restore the file.
  **Fallback if Q-12 is unanswered** Hold at documented pending disposition with a ledger row and review-by date.

#### T-109d — `publicRoleSchema`: enforce or delete

**Size** S · **Wave** 4 · **Status** ⏸️ **RECORDED — still Gated Q-12** (Sprint 14) — _was: Gated Q-12_
**Delivered** Re-verified: `publicRoleSchema` has zero consumers of any kind — not even its own test file references it, the only one of the three schemas with no test coverage either. Header corrected alongside T-109c's (same file, same comment block). `LDG-05`'s ledger wording updated to reflect this more precise "zero consumers of any kind" finding. Not wired or deleted — same Q-12 gate; if this is later enforced, its vocabulary agreement with the deck-access engine's role set becomes a natural addition to T-115b's checker, not before.
**Traces to** ADR-109 (AD-09) · W-9, TD-5, RC-6 · cluster **C5** · `assess/03`, `/07`
**Description.** A zero-consumer schema declaring the public-role vocabulary while real writes bypass it. Same enforce-or-delete rule.
**Acceptance criteria**

- The schema is imported by a write path or removed; the misleading header is gone either way.
- The disposition is recorded against Q-12 in the ledger.
- If enforced: a write with an out-of-vocabulary public role is rejected, and the vocabulary agrees with the deck-access engine's role set (checkable by T-115b's mechanism).
  **Standards** CS-13, CS-3, CS-8
  **Regression scope** Public-role values feed the deck-access engine and the Firestore rules; a vocabulary mismatch here is an access defect, not a validation nicety. T-117b and T-117d are the net.
  **Rollback** Revert the wiring or restore the file.
  **Fallback if Q-12 is unanswered** Hold at documented pending disposition with a ledger row and review-by date.

#### T-109e — Standardize multi-field forms on react-hook-form + zodResolver

**Size** M · **Wave** 4 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** Converted the AI Bulk Generation panel (`AIBulkPanel.tsx`, 4 fields: mode/topic/count/level) onto a new `useAIBulkForm` controller hook + a fresh `aiGenerateInputSchema` (`shared/schemas/ai-generate-input.schema.ts`, unit-tested) — no schema existed for this form before. `mode`/`count`/`level` are custom button groups, not native inputs, so they're exposed via `watch()`+`setValue()` (same shape as `useLessonBuilder`'s own non-native-input fields, e.g. `addTag`/`removeCategory`) rather than `register()`; `handleSubmit`'s zod validation runs against the current values either way. Audited the remaining candidates from the research pass: the per-card content editor (`DraggableCard`/`LessonBuilderCardList`, backed by `cardContentSchema`) was **deliberately not converted** — wiring it to `cardContentSchema` via `useFieldArray` would be a de facto enforcement of a schema whose disposition T-109b left explicitly gated on Q-12; converting the form now would presuppose the answer. Confirmed the researched exclusion list (Settings toggles, comment input, admin filters, kana setup screens) correctly stays controlled-state per the AC's own "trivial single-input" carve-out. Verified via `tsc`/lint/unit suite (new schema tests) — could not verify the panel live in a browser: it sits behind Google OAuth, and this session has no way to authenticate without real credentials, which it should not attempt to obtain or enter regardless.
**Traces to** ADR-109 (AD-09) · PC-1, PC-7, OP-11 · cluster **C5** · `assess/06`, `/09`
**Description.** `useLessonBuilder` and `useShareInvites` are the existing rhf + zodResolver beachhead. Extend that pattern to the remaining multi-field forms so validation lives in one place per form and matches the write-boundary schema. Trivial single-input cases stay controlled-state by design.
**Acceptance criteria**

- Every multi-field form uses react-hook-form + zodResolver; a list of forms and their chosen mechanism is reviewable.
- The **controller hook owns the `useForm` instance** and passes `register`/state down as props; presentational components never call `useForm` themselves.
- Trivial single-input cases remain controlled-state — the split is sanctioned, and this task does not over-convert them.
- Each converted form's client schema is the same schema (or a documented derivation of it) as its write boundary uses, so client and server cannot drift.
  **Standards** CS-13, CS-5 (controller-hook-owns-the-form), CS-4, CS-14 (validation messages are i18n keys, not literals)
  **Regression scope** Form submission and error display across converted surfaces; validation messages must exist at en/ja parity or errors render as raw keys. Incremental migration — do not convert all forms in one commit.
  **Rollback** Per-form revert.

---

### ADR-115 — Two RBAC engines; predicates never inlined (P1/P2)

#### T-115a — Converge the 5 inline deck-access predicates onto the engine

**Size** L · **Wave** 4 · **Status** ✅ **DONE**
**Delivered** All 5 inline deck-access derivations now call `resolveRole`/`canEdit`/`canComment`/`isPubliclyAccessible` (the last extracted from `resolveRole`'s own inline check) instead of re-deriving role logic locally: `shared-preview.service.ts`, `shared.service.ts`, `lesson-subscriptions.ts`, `DetailActionsPanel.tsx`, `DetailCardsPanel.tsx`, `DetailCommentsPanel.tsx`, `DeckCard.tsx`, and `SharedLessonPageClient.tsx` (the last required adding `canEdit` to the `features/flashcard` barrel, since ADR-103 requires `app/` files to import through it). One important correction to the original architecture assessment's characterization: `shared.service.ts`'s divergent `isOwner` check (`roles?.[uid] === "owner"` vs. the engine's `ownerId ?? userId`) is empirically **masked** by `normalizeLesson()`'s pre-existing read-time healing (it unconditionally back-fills a missing self-entry into `roles`) for every caller that normalizes first — verified by reverting the fix and confirming the regression test still passed unchanged. The convergence is genuine hygiene/defense-in-depth for this specific caller, not a currently-reachable-bug fix as originally suspected; a separate, genuinely-live gap **was** found and fixed in the same pass — `ShareModal.tsx`'s own missing-pending-invite gate. `ShareModal.tsx` (436 lines) is split below the CS-2 ceiling by extracting all state/logic into a new `useShareModal` controller hook (256 lines, following the established `useLessonBuilder`/`useShareInvites` pattern), leaving the component as a 244-line presentational shell. Verified against a new `shared.service.emu.test.ts` case (owner access still granted when the stored `roles` map lacks a self-entry) plus the full unit/browser/emu suites, all green.
**Traces to** ADR-115 (AD-15) · OP-5, W-13, TD-9, RC-9 · cluster **C11** · `assess/09`, `/03`, `/04`, `/11`
**Description.** The deck-access predicate is re-derived inline at five sites outside the canonical engine — whose own header says "Never inline role logic" — and **one derivation is semantically divergent**: `shared.service.ts` checks `roles?.[uid] === "owner"` where the engine uses `ownerId ?? userId`, the closest thing in the corpus to a discovered live bug. All five converge; the divergent one is corrected to the engine's definition. Per kernel cross-cutting rule, this task also carries the **`ShareModal.tsx` (436 lines) CS-2 hard-ceiling split**, as the first task to edit that file's body.
**Acceptance criteria**

- A search for inline deck-access derivations (`roles?.[uid]`, ad-hoc owner checks, `allowLinkAccess || isPublic`) outside the engine returns **zero**; all five sites call the engine.
- `isOwner` semantics match the engine's `ownerId ?? userId` **everywhere** — the OP-5 divergence is gone, and the behavioral delta (an owner whose lesson lacks a `roles` self-entry is now granted access) is the one deliberate, recorded change.
- `shared-preview.service.ts` keeps its documented client/server file separation; convergence there is at the **predicate-definition** level, not a cross-bundle import.
- Every other access outcome — public gate, invite path, link access — resolves identically before and after, verified against T-117b's `resolveRole` tests and T-117d's rules tests.
- `ShareModal.tsx` is split by responsibility below the 400-line hard ceiling (test files exempt); the split follows real seams, not line count.
  **Standards** CS-13, CS-9, CS-6, CS-2 (the ShareModal split), CS-8
  **Regression scope** **Access control** — the highest-consequence semantics in the repo. The Admin-SDK preview path runs rules-free, so a divergence there is a private-data leak rather than a style issue. Requires T-117b and T-117d complete first (ADR-117 names `resolveRole` a test floor _precisely_ so this convergence lands against a net).
  **Rollback** Per-site revert. The `isOwner` correction is the one change with an intended behavioral delta — reverting it restores the divergence, so revert it only deliberately.

#### T-115b — Automate the vocabulary-agreement check

**Size** M · **Wave** 4 · **Status** ✅ **DONE**
**Delivered** Built one config-driven, mechanism-general checker (`scripts/check-vocabulary-agreement.mjs`) rather than a bespoke script per vocabulary — a `VOCABULARIES` array of `{name, mode, ts, rules, writers}` entries, each independently comparing a TS union/tuple against an optional `firestore.rules` literal list (subset check) and optional writer literals across named files (bidirectional: a writer value missing from the union is a blocking problem in `enforce` mode; a union member with no writer is a separate, always-non-blocking "dead value" warning regardless of mode). Two vocabularies run in `enforce` mode today — `LogSource` (agrees, 3 values) and `DeckAccessRole` (agrees, 5 values, checked against `firestore.rules`) — and `NotificationType` runs in `report-only` mode per the task's own AC, since T-108a (Wave 5) hasn't yet widened the union; it currently reports a real mismatch (6 writer literals not in the 4-value union) without failing the build. The check found a genuine, previously-unknown dead value in the process — `LogSource`'s `"cloud_function"` has zero writers — flagged via a spawned background task rather than silently fixed or ignored, since fixing it wasn't this task's scope. Wired into `.github/workflows/ci.yml` immediately after the Lint step, with a `npm run check:vocab` script in `package.json`. 9 unit tests cover the pure parsing/diffing functions in isolation. The two RBAC engines (deck-access vs. admin-authority) remain deliberately separate — this checker verifies agreement, it does not merge them.
**Traces to** ADR-115 (AD-15) + ADR-108 (AD-08) · OP-19, OP-20, RC-9, RC-12 · clusters **C11**, **C1** · `assess/09`, `/03`, `/11`
**Description.** Cross-artifact vocabulary agreements — TS unions ↔ Firestore rules lists ↔ writers — are human-enforced, and one has already drifted. Build the automated check **once** (kernel: same mechanism as ADR-108's check) and point it at each vocabulary that needs it.
**Acceptance criteria**

- An automated check fails when a TS union, its `firestore.rules` list, and its writer disagree; it runs in CI alongside the existing suites.
- The check is **mechanism-general**, configured per vocabulary — not a bespoke script per union.
- The notification-type target is wired in **after T-108a widens the union** (Wave 5); until then that target runs in report-only mode so the check does not fail on a divergence T-108a is scheduled to fix. _See §5.4._
- The `LogSource` vocabulary (one declaration after T-103a) and the deck-access role vocabulary are covered targets.
- The two RBAC engines remain **separate**; this check verifies agreement, it does not merge anything.
  **Standards** CS-8, CS-13, CS-9, CS-3
  **Regression scope** New CI surface. A check that is noisy or slow gets disabled, which is the standards-decay failure mode; report-only staging for not-yet-converged vocabularies is deliberate, not a loophole.
  **Rollback** Disable the CI step; no production code depends on it.

#### T-115c — Align the 3 divergent admin-authority predicates

**Size** M · **Wave** 4 · **Status** ⏸️ **RECORDED — still Gated Q-10** (Sprint 14) — _was: Gated Q-10_
**Delivered** Re-verified and precisely recorded the three predicates' exact observable differences against `LDG-15` in the migrations ledger: `resolveCallerContext` (app) grants on custom claim **or** the Firestore role field's value; `isSystemAdmin()` (rules) grants on the same claims **or** mere existence of the `admins/{uid}` doc, never reading its role field; `isAdmin()` (functions) reads only the Firestore role field, never checking claims at all — three genuinely different disagreement shapes, not one. Confirmed (again) that `setCustomUserClaims` is called nowhere in production code. Per the task's own fallback, **no predicate was touched** — aligning to the wrong source risks locking out all admins or over-granting, so this stays the one gate where inaction is correct until Q-10 answers.
**Traces to** ADR-115 (AD-15) · OP-7, RC-10, R-8 · cluster **C11** · `assess/09`, `/04`, `/11`
**Description.** Three admin-authority predicates already diverge semantically, and no `setCustomUserClaims` call exists anywhere — so how admin authority is actually provisioned in production (custom claims vs `admins/{uid}`) is unknown. ADR-115 converges them **only after** the live source is known.
**Acceptance criteria**

- The live admin-authority source is recorded (Q-10's answer) before any predicate changes.
- After the answer: all three predicates resolve admin authority identically from the single recorded source; a search finds one authority derivation.
- The `admins` rules-suite test (T-117d) passes against the aligned predicates, including the case that admin authority cannot be self-granted from the client.
- R-8 (admin bootstrap out-of-band) is either closed or explicitly recorded as remaining open with its reason.
  **Standards** CS-13, CS-9, CS-6
  **Regression scope** **Aligning to the wrong source could lock out all admins or grant authority too broadly.** This is the one gate whose default is _inaction_ precisely for this reason.
  **Rollback** Revert to the three predicates; because alignment happens in one change, revert is clean.
  **Fallback if Q-10 is unanswered** **Do nothing to the predicates** — the standing default is "no alignment yet." Record the three divergences and their observable differences in the ledger so the state is tracked rather than assumed.

---

### ADR-106 — Two write families, one action client (P1)

#### T-106a — Build the unified verified-identity action client with per-action permission metadata

**Size** L · **Wave** 4 · **Status** ✅ **DONE** (Sprint 9) — _was: Ready_
**Delivered** `verifiedActionClient` (`lib/safe-action.ts`) is the one shared base every server mutation client now extends — `.metadata()` structurally required before `.action()` compiles (next-safe-action's `HasMetadata` type parameter), proven by a real emu test (not just "it compiled"). Two thin, surface-specific configs extend it: `userActionClient` (idToken bind-arg, fully generic, lives in `lib/`) and `verifiedAdminActionClient` (`features/admin/services/admin.service.ts`, cookie-session + the admin `PermissionSet` — kept in the feature since ADR-103 forbids `lib/` importing `features/`). The `{ok,data}|{ok,error}` envelope (`toActionResult`) is unchanged. One real trade-off, disclosed in-code: `next-safe-action`'s metadata schema is fixed at client creation and can't be narrowed per-surface afterward, so admin's `.metadata({permission})` call sites lose their exact `PermissionAction` enum's compile-time typo protection in favor of the existing runtime `hasPermission` check — a DX cost, not a security gap (a typo still fails closed). Purely additive: the pre-unification `adminActionClient`/`actionClient` and all their current callers are untouched; `userActionClient` proven against a real emulator (valid idToken accepted, forged/empty tokens rejected via `serverError`, not a crash). Found a confirmed third, unconverted "use server" pattern (7 hand-rolled files bypassing both clients, including this wave's own `session.actions.ts` from T-107a) that ADR-106's "no third family... generalized to all server mutations" language technically covers but neither this task nor T-106b/c name explicitly — flagged as a scope gap for the owner rather than silently expanded into or ignored.
**Traces to** ADR-106 (AD-06) · PC-5, CX-3, RC-11, W-12, OP-1, S-4 · cluster **C10** · `assess/06`, `/05`, `/04`, `/03`, `/09`
**Description.** Two server-action clients (cookie-session `adminActionClient`, idToken bind-arg `actionClient`) both terminate at `adminAuth.verifyIdToken` on the same kind of token, differing only in how it travels. Build the single verified-identity client that generalizes family B's model-citizen property — an action _cannot be defined_ without declaring its required permission — to all server mutations.
**Acceptance criteria**

- One action client exists with a single identity-verification path; per-action permission metadata is **structurally required** — an action without `.metadata({ permission })` does not compile.
- The `{ok,data} | {ok,error}` envelope consumed by existing hooks is preserved exactly.
- The **family-choice criterion is written at the client's definition site** (privileged / cross-user ⇒ server action; learner realtime ⇒ client SDK under rules), replacing the two-families docstring.
- The convergence contract is recorded in the ledger, so the "thin per-surface configuration" cannot regrow into two divergent clients.
- No third family is introduced — the zero-route-handler property holds.
  **Standards** CS-6 (execution-context marking), CS-13, CS-9, CS-12, CS-3
  **Regression scope** Additive at this step (no call sites migrate yet), but the client's verification semantics must be at least as strong as both predecessors on day one — a weaker verification path is a security regression. Depends on T-107a's session semantics.
  **Rollback** Delete the new client; nothing consumes it until T-106b.

#### T-106b — Migrate `adminActionClient` call sites

**Size** L · **Wave** 4 · **Status** ✅ **DONE**
**Traces to** ADR-106 (AD-06) · PC-5, RC-11, W-12, S-4 · cluster **C10** · `assess/06`, `/05`, `/09`
**Delivered** All 19 `adminActionClient` call sites in `admin.actions.ts` (of its 20 exported actions — `fetchAdminRoleAction` is the one deliberate exception, calling `assertPermissionFromToken`/`assertAdminAction` directly since it runs before a session cookie is guaranteed to exist) now run on `verifiedAdminActionClient` (T-106a's unified base), each retaining its exact `.metadata({permission})` declaration unchanged — a pure client swap, no permission remapped. The file's own docblock and import list were updated to match; import order re-sorted (the renamed identifier sorts last, case-insensitively). `admin.service.ts`'s `adminActionClient` export now has zero remaining callers anywhere in the repo (confirmed by grep) and is kept only until T-106d deletes it alongside `lib/safe-action.ts`'s `actionClient` — its docblock updated to say so rather than left pointing at a stale "19 remaining callers." No file split needed: the migration is a rename, not a restructuring, and line count is unchanged (389, was 390) — CS-2's "if the migration makes it two" condition never triggers. Verified: `next build` (full-tree typecheck) clean, lint 0 errors, 368 unit + 76 browser + 126 emu (3 skipped) all green — the emu suite exercises exactly the admin-action authorization paths this task touches (T-117d's `admins` rules tests, `admin.service.emu.test.ts`'s `assertAdminAction` coverage), so the "same caller permitted/denied as before" acceptance criterion is proven against real tokens, not just typechecked.
**Description.** Move the cookie-session admin actions onto the unified client, preserving each action's declared permission. `admin.actions.ts` alone is 380 lines and 20 actions — the RBAC enforcement seam.
**Acceptance criteria**

- All former `adminActionClient` actions run on the unified client, each retaining its exact permission declaration.
- Every migrated action's authorization outcome is unchanged: the same caller is permitted or denied as before, verified against T-117d's `admins` rules tests and the admin action tests.
- No action loses its permission metadata during migration (a compile-time property per T-106a).
- The `{ok,error}` shapes consumed by admin hooks are unchanged.
  **Standards** CS-6, CS-13, CS-9, CS-2 (`admin.actions.ts` at 380 lines is in the review tier — split by responsibility if the migration makes it two)
  **Regression scope** Every admin mutation. A permission-mapping error here grants or denies admin capability incorrectly. Intersects T-115c (admin authority) — if Q-10 is still open, this task migrates the _transport_ without changing _authority derivation_.
  **Rollback** Per-action revert; migrate in reviewable batches, not one commit.

#### T-106c — Migrate the idToken bind-arg `actionClient` call sites

**Size** M · **Wave** 4 · **Status** ✅ **DONE**
**Traces to** ADR-106 (AD-06) · PC-5, RC-11, CX-3 · cluster **C10** · `assess/06`, `/05`
**Delivered** All 6 former `actionClient` call sites — 5 in `features/notifications/actions/activity-log.actions.ts` (`logNotificationRead/Deleted/ReadAll/Cleared/Delivered`) and `emitNotificationAction`'s `notification.actions.ts` — now run on `userActionClient`, each declaring a `.metadata({permission})` label it previously lacked (the 5 activity-log actions reuse their own `ActivityAction` string verbatim rather than inventing a parallel vocabulary; `emitNotificationAction` uses `"notifications.emit"` since it spans 7 `NotificationInput.kind`s, no single `ActivityAction` fits). Identity verification is preserved, not weakened, at both call sites — proven, not assumed: `notification.actions.emu.test.ts` (pre-existing, unchanged) already exercises `emitNotificationAction` end-to-end against a real emulator (forged tokens, per-kind authorization, collapsing) and passes unmodified against the migrated code; a new `activity-log.actions.emu.test.ts` (3 tests) proves the same for the activity-log side, since no prior test exercised those 5 wrappers' real behavior (the only existing reference mocked them out entirely). Disclosed, harmless trade-off: both surfaces now verify the same idToken twice (once in `userActionClient`'s own middleware, producing an unused `ctx.uid`; once more inside `logActivity`/`emitNotificationSafeAction`'s own body, which still need either the full `decoded` claims or a shared helper's untouched signature) — this session's `lib/safe-action.ts` docblock is corrected to describe this accurately (it previously described a `.useValidated()` pattern that, on inspection of the real call sites, none of them actually used). Consuming hooks/call sites are unchanged — the `Promise<void>`/`{ok,error}` envelopes are untouched. Verified: `next build` clean, lint 0 errors, 368 unit + 76 browser + 129 emu (3 skipped) all green.
**Description.** Move the user-initiated server actions off the idToken bind-arg transport onto the unified client, so identity arrives one way for every server mutation.
**Acceptance criteria**

- All former `actionClient` actions run on the unified client; each now declares permission metadata it previously lacked.
- Identity verification location and strength are preserved per surface — both transports already terminated in `verifyIdToken`, and the migration must not weaken either.
- Consuming hooks are unchanged (the envelope is preserved), or their changes are explicitly enumerated.
  **Standards** CS-6, CS-13, CS-9
  **Regression scope** User-initiated privileged writes — sharing, invites, comments. Depends on T-107a/b: the transport change and the credential change touch the same request path, so sequence them and do not land both in one commit.
  **Rollback** Per-action revert.

#### T-106d — Remove the superseded client(s) and retire the compatibility shim

**Size** S · **Wave** 4 · **Status** ✅ **DONE — 1 of 2 shim criteria met; the other found inapplicable, disclosed rather than forced**
**Delivered** Both superseded clients are deleted — `adminActionClient` (`features/admin/services/admin.service.ts`) and `actionClient` (`lib/safe-action.ts`), each confirmed to have zero remaining callers by repo-wide grep before deletion. `lib/safe-action.ts` now exports exactly one verification mechanism (`verifiedActionClient`) with two thin surface configs on top (`userActionClient`, `verifiedAdminActionClient`) — a search finds no parallel `createSafeActionClient` verification implementation anywhere in the app. Both files' docblocks were rewritten to describe the current, real state rather than the pre-T-106d transitional one (including correcting `lib/safe-action.ts`'s own prior claim that migrated call sites used a `.useValidated()` pattern — on inspection, none of them did).
`toActionResult` is **not** gone, and its acceptance criterion could not be honestly satisfied as originally worded: `admin.actions.ts`'s 19 actions, fully migrated onto the unified `verifiedAdminActionClient`, still call it to preserve the `{ok,data}|{ok,error}` envelope their own consuming hooks expect — a need that was never actually tied to which safe-action client backs an action, only to whether consuming code expects the pre-migration envelope. M-2's planning assumption ("retires by its consumers migrating... a separate task would have a zero-length body") is empirically false. Not force-fit: inlining the same 3-line branch at 19 call sites to avoid calling a function named `toActionResult` would be pure churn with no behavior change, and deleting it outright would break `admin.actions.ts`. Recorded as `LDG-21` (`docs/migrations-ledger.md`) rather than silently kept without explanation or silently deleted without checking — the one genuinely open question it surfaces (should admin hooks eventually migrate off the `{ok,error}` envelope onto next-safe-action's native client-side conventions?) is an unscoped initiative well beyond ADR-106's client-unification scope, left for the owner alongside the pre-existing `LDG-20` (the confirmed third "use server" pattern, also untouched here by design). Verified: `next build` clean, lint 0 errors, 368 unit + 76 browser + 129 emu (3 skipped) all green — no test referenced either deleted client by name, so none needed updating.
**Traces to** ADR-106 (AD-06) · RC-11, CX-3, OP-1, WR-2 · cluster **C10** · `assess/05`, `/06`
**Description.** With no callers left, delete the superseded action clients and retire the `toActionResult` normalization shim — a compatibility layer for a completed migration whose expiry date was never set. ADR-106's convergence sets it.
**Acceptance criteria**

- `lib/safe-action.ts` (or successor) exports **one** action client; a search finds no parallel `adminActionClient`/`actionClient` verification implementation.
- The `toActionResult` shim is gone, with **zero** remaining pre-migration callers — it retires by its consumers having migrated, never by cutting them over silently.
- The error-envelope semantics every hook consumes are unchanged after the shim's removal.
- The ledger row for this convergence is closed with its end state recorded.
  **Standards** CS-3 (no abstraction without a consumer), CS-6, CS-9
  **Regression scope** Any missed caller is a compile error, not a runtime one — provided the shim is deleted rather than emptied. Verify the caller count is zero before deleting, not after.
  **Rollback** Restore from git; the deleted clients are unreferenced by then.

---

### ADR-108 — Notification vocabulary authoritative (P1; gate-heavy)

#### T-108a — Widen `NotificationType` to the 10 values actually written

**Size** S · **Wave** 5 · **Status** Ready _(Q-7 default in force — see §5.6)_
**Traces to** ADR-108 (AD-08) · W-7, RC-2, OP-4 · cluster **C1** · `assess/03`, `/04`, `/07`, `/11`
**Description.** `AppNotification.type` is a 4-value TS union while the codebase writes 10 distinct runtime values (9 active kinds plus `"digest"` from the Cloud Function) — a compile-time contract the codebase itself contradicts, with correctness currently resting on `NotificationIcon` widening to `string`. The stored vocabulary is authoritative; the union widens to match.
**Acceptance criteria**

- `NotificationType` (or successor) enumerates the **10** stored values, including `digest`.
- A deliberately non-exhaustive switch over the union **fails typecheck** — the `string` widening that hid latent gaps is removed.
- Every consumer surfaced by the widening handles all 10 cases (this short-term cost is the point of the change).
- T-115b's check is pointed at this vocabulary and moved from report-only to failing, now that union, writer, digest value and rules list agree.
  **Standards** CS-8, CS-13, CS-3
  **Regression scope** Widening surfaces latent gaps in every exhaustive consumer — icon mapping, preference matrices, analytics group-by. These are compile-time failures, which is the safe direction. It touches no stored data and no read path.
  **Rollback** Revert the union; consumers return to the `string`-widened state.

#### T-108b — Verify/complete the index and rules deployment the runbook flags as "NOT yet deployed"

**Size** M · **Wave** 5 · **Status** ⏸️ **RECORDED — still Gated NQ-1** — _was: Gated NQ-1_
**Delivered** Confirmed NQ-1 is genuinely unanswerable from the repository, not merely unchecked: this repo has **no `.firebaserc`** (verified — the file doesn't exist) and `firebase.json` declares no project alias/hosting target either, so there is no repo-level binding to a specific live Firebase project at all. The local Firebase CLI happens to be authenticated to a project ("Devfolio" / `ngnphamgiahuy-devfolio`), but nothing establishes that this is the actual production target for this app rather than an unrelated personal/test project — querying its deployed-index state would not reliably answer NQ-1, and asserting it does would be exactly the kind of unfounded guess this gate exists to prevent. `docs/testing-notifications.md` itself still says "NOT yet deployed" (self-reported, undated as a live claim) and `firestore.indexes.json` still only *declares* the two new composite indexes (`status+isDeleted`, `read+isDeleted`) alongside the legacy `isDeleted+createdAt` one — declaring an index is not deploying it, and nothing in the repo can distinguish "not yet run" from "run against an environment this repo doesn't identify." Per the task's own fallback: retained as-is, no deploy attempted, no index dropped. Recorded honestly rather than silently left stale or guessed at.
**Traces to** ADR-108 (AD-08) · TD-1, RC-3, R-19 · cluster **C2** · `assess/07`, `/08`, `/11`
**Description.** `docs/testing-notifications.md` asserts the notification indexes and rules were not deployed as of its writing. A stale note that outlived a real deploy would be worse than no note. Establish the true deployment state and bring it current.
**Acceptance criteria**

- The current deployment state of the notification composite indexes, rules, and TTL configuration is **established and recorded** (NQ-1's answer) with its source and date.
- If not deployed: the deployment is completed and verified.
- The runbook is corrected to state the true, dated status — no assertion survives without a date and a verification method.
- The ledger row for the notification migration is updated with the confirmed stage; this unblocks T-108c/d's gate evaluation.
  **Standards** CS-3, CS-6, CS-12
  **Regression scope** Deploying indexes/rules affects live query behavior and access. Rules changes must be verified against T-117d's suite before deployment, not after.
  **Rollback** Rules and indexes are independently revertible via redeploy; record the prior state before changing it.
  **Fallback if NQ-1 is unanswered** **Retain** dual indexes, dual queries and dual fields. Removal stays gated. Record the unresolved state in the ledger with a review-by date rather than assuming either answer.

#### T-108c — Legacy-data verdict: retain or remove the 4 `@deprecated` fields

**Size** M · **Wave** 5 · **Status** ⏸️ **RECORDED — still Gated Q-5** — _was: Gated Q-5_
**Delivered** Re-confirmed Q-5 requires a live production Firestore data sample (does any stored `notifications` document lack `status`, i.e. predate the migration?) that cannot be taken from this session — no production credentials, no console access, and (per T-108b) no repo-level way to even confirm which project would be production. `scripts/backfill-notifications.mjs` (the one-time migration script) still exists in the repo, un-deleted, and `docs/testing-notifications.md` still self-reports it as "NOT yet run" — both consistent with the fields still being load-bearing. Confirmed the 4 fields (`deckId`, `deckTitle`, `link`, `read`) and `isUnread()`'s legacy fallback branch are untouched (`features/notifications/types/index.ts`). Per the task's own fallback: retain everything, nothing removed. The gate stays open and honestly recorded rather than assumed answered.
**Traces to** ADR-108 (AD-08) · TD-1, RC-3, R-5, OP-15 · clusters **C1**, **C2** · `assess/03`, `/04`, `/07`, `/11`
**Description.** Four `@deprecated` fields persist as migration-era compatibility. Whether legacy-shaped documents still exist in production, and whether the backfill ever ran, is Q-5 — and cleaning up without that answer would silently hide pre-migration notifications from users.
**Acceptance criteria**

- Q-5's answer is recorded: whether legacy-shaped documents remain, whether the backfill ran, and the sample's date and method.
- If none remain: the four `@deprecated` fields are removed, and the `isUnread()` legacy fallback goes with them.
- If any remain: the fields stay, and the ledger row records the retirement condition plus a re-check date — the state stays tracked, not frozen.
- Every pre-migration document still renders correctly (unread state, deep links) up to the moment the gate certifies none remain.
  **Standards** CS-3, CS-13, CS-12
  **Regression scope** **Removing compatibility fields prematurely hides users' existing notifications** — the specific harm RC-3 names, and the reason 05 §NS-8 forbids stripping legacy-compatible code before its gate answers.
  **Rollback** Restore the fields and fallback from git — but any documents written in the interim will lack them, so rollback is not fully symmetric. Ship this only on a confirmed gate.
  **Fallback if Q-5 is unanswered** **Retain everything.** The machinery is assumed load-bearing until a data sample proves otherwise.

#### T-108d — Collapse the dual read paths and dual indexes to one

**Size** L · **Wave** 5 · **Status** ⏸️ **RECORDED — still Gated Q-5** (blocked on T-108b/c) — _was: Gated Q-5_
**Delivered** Confirmed the exact dual machinery this task would collapse is still fully in place: `subscribeNotifications` (`features/notifications/services/notification-subscribe.ts`) still runs the primary composite-index query (`isDeleted != true` + `createdAt desc`) with a runtime fallback to a `createdAt`-only query + client-side `isDeleted` filter if the primary query errors (i.e., if the composite index isn't built yet) — precisely the "primary-vs-fallback listener strategy with runtime swap" this task targets. `firestore.indexes.json` still declares both the legacy `isDeleted+createdAt` index and the two newer ones. `scripts/backfill-notifications.mjs` still exists. This task explicitly depends on T-108b (deploy state) and T-108c (legacy-data verdict), both still gated and unresolved — T-108d cannot honestly proceed ahead of its own stated prerequisites. Per the task's own fallback: retain the dual machinery, nothing collapsed. This is the fixed critical path's gate-bound tail (05 §5.6): T-108a completes the wave's ungated work, T-108d remains the one item that cannot complete on in-repo work alone.
**Traces to** ADR-108 (AD-08) · TD-1 (top-ranked debt), CX-1, RC-3, OP-15 · clusters **C1**, **C2** · `assess/03`, `/04`, `/07`, `/08`, `/11`
**Description.** The dual-schema stratum — primary-vs-fallback listener strategy with runtime swap, dual composite indexes (`read+isDeleted` and `status+isDeleted`), and the one-time backfill script — receives the end state CX-1 says it lacks: a single read path on the new shape, the legacy index dropped, and the backfill script leaving the repo once its execution is confirmed.
**Acceptance criteria**

- One read path remains; the runtime primary/fallback swap is gone.
- The legacy composite index is dropped and only the current index remains deployed.
- The backfill script is removed from the repo, with its confirmed execution recorded in the ledger.
- Notification list, unread counts and deep links behave identically to before for every document that exists post-gate.
- The ledger row for the notification migration is **closed** — this is the change that converts RC-3's permanent-transitional state into a completed one.
  **Standards** CS-6 (path ownership), CS-10 (the remaining listener carries its bound), CS-3, CS-13
  **Regression scope** The notifications inbox end to end. Dropping an index that a query still needs produces runtime query failures, not compile errors — verify query shapes against the remaining index before dropping. Must follow T-108b (deploy state) and T-108c (legacy-data verdict).
  **Rollback** Restoring an index is a redeploy; restoring the fallback read path is a revert. Both are recoverable, but the window between drop and restore is user-visible.
  **Fallback if Q-5 is unanswered** **Retain the dual machinery.** Do not collapse. The ledger keeps the state visible rather than letting it rot.

#### T-108e — Ledger entry recording the migration's end state and current stage

**Size** S · **Wave** 5 · **Status** ✅ **DONE**
**Delivered** `LDG-01` (the legacy-shape row) **stays open**, updated with the precise, current-as-of-this-wave facts from T-108b/c/d's own re-verification: no `.firebaserc` exists (so `NQ-1` isn't just unanswered, it's unanswerable at the repo level — a stronger, more precise finding than the row previously stated), the backfill script and 4 legacy fields are all still in place, and the dual read-path/index machinery T-108d would collapse is confirmed still fully wired. `LDG-02` closed already, as T-108a's own direct consequence — the same one-task-closes-its-own-row pattern every other Wave 5 fallback-applied task followed — so this task's job was specifically bringing the still-gated `LDG-01` current, not re-touching what T-108a already reached. `domain/events.ts`'s in-code retirement comment (previously "the two are reconciled as producers migrate," naming no end state) now points at the ledger by ADR reference rather than restating its content inline. Every stage claim above is cited against a specific file this task or T-108a/b/c/d directly read this wave, not assumed from the prior audit.
**Traces to** ADR-108 (AD-08) + ADR-120 (AD-20) · RC-3, TD-1, CX-1 · clusters **C2**, **C16** · `assess/04`, `/05`, `/07`
**Description.** The notification migration is the canonical instance of the corpus's meta-finding, and ADR-120 names its ledger entry the template for all others. This task brings that row to a final, accurate state as T-108a–d resolve.
**Acceptance criteria**

- The ledger row states the migration's intended end state, its current stage, owner, and review-by date, with each gate (Q-5, NQ-1) named.
- The row is accurate as of the completion of T-108a–d — including honestly recording "still gated" if it is.
- The retirement condition currently written only in a code comment is adopted **into the ledger**, and the comment points at the row rather than restating it.
- The row's stage claims are corpus- or verification-cited, never assumed.
  **Standards** CS-3, CS-12
  **Regression scope** None behavioral. A row that overstates progress is worse than no row.
  **Rollback** Revert the row.

---

### ADR-119 — Dead surfaces default to deletion (P2; multi-gated)

#### T-119a — 7 dormant `NotificationKind`s: delete or complete

**Size** M · **Wave** 5 · **Status** ✅ **DONE (Q-8 fallback applied)**
**Delivered** Applied the task's own standing fallback: verified zero producers for all 7 (`invite_declined`, `deck_updated`, `deck_deleted`, `privacy_changed`, `overtaken`, `leaderboard_top3`, `achievement` — repo-wide search, no hits beyond their own declarations and generic test fixtures) and deleted each from `NotificationKind` (`domain/events.ts`) and its registry entry (`domain/registry.ts`). The originally-cited "registry, emit schema, collapse logic and rendering all carry weight" turned out to overstate the real footprint — direct inspection showed the emit schema (`schema.ts`) and rendering (`NotificationIcon`, `contentFor`) carry zero kind-specific code for any of the 7 (no case ever existed for them); the actual change was the registry entries, the union members, 2 now-dead `NotificationInput` fields (`gameMode`, `achievementKind` — read by nothing once their only 3 kinds were gone) and 3 test files referencing dormant kinds as example values. `NOTIFICATION_REGISTRY`'s `Record<NotificationKind, NotificationPolicy>` shape enforces the union and registry can't drift again. Sequenced deliberately **before** T-108a (not after, despite numbering) — shrinking `NotificationKind` to exactly its 9 active members first lets `NotificationType` (T-108a) become the clean, self-maintaining `NotificationKind | "digest"` rather than hand-listing 9 literals or excluding 7 by name. Verified: `next build` clean, lint 0 errors, 366 unit + 76 browser + 129 emu (3 skipped) all green.
**Traces to** ADR-119 (AD-19) · OP-8, W-8(a), TD-6(a), RC-7, CX-7 · cluster **C12** · `assess/03`, `/07`, `/09`, `/11`
**Description.** Seven `NotificationKind`s are registry-declared with full metadata (priority, category, collapse keys) but marked inactive and have zero producers. Each defaults to deletion with its registry entry, its weight in `domain/events.ts`, and its share of collapse and formatting logic.
**Acceptance criteria**

- Each of the 7 kinds is **removed** or has a **claimed** ledger row naming its producing feature, activation step, owner and review-by date — none remains in undocumented limbo.
- A claim must name a **concrete producer** and an activation intent; an in-code comment saying "flip when the producer lands" does **not** count (comments do not expire).
- Behavior of the 9 active kinds and the server emit schema's 7 client-emitted kinds is unchanged.
- No read path changes: zero producers ever existed, so no stored document carries a dormant kind — verified, not assumed.
- Every kind deleted is one the widened `NotificationType` union (T-108a) no longer has to carry — coordinate so the union and the registry agree, checked by T-115b.
  **Standards** CS-3 (no capability without a consumer), CS-8, CS-13
  **Regression scope** Notification rendering and collapse logic. If any kind is claimed, its completion is _new work_ to schedule, not part of this task.
  **Rollback** Git revert — deletion is cheap and reversible, which is why it is the default.
  **Fallback if Q-8 is unanswered** Delete each unclaimed kind (the standing default).

#### T-119b — 8 `ActivityAction`s + `cloud_function` LogSource, including the kana-practice gap

**Size** M · **Wave** 5 · **Status** ✅ **DONE (Q-11 fallback applied)**
**Delivered** Applied the task's own standing fallback: verified exactly 8 zero-producer `ActivityAction` members (`DECK_SHARED`, `DECK_UNSHARED`, `CARD_CREATED`, `CARD_UPDATED`, `CARD_DELETED`, `SHARE_INVITE_SENT`, `SHARE_INVITE_REVOKED`, `KANA_PRACTICE_COMPLETED` — repo-wide search including bracket/destructured access and raw string values, zero hits beyond their own enum declaration) and `"cloud_function"` `LogSource` (zero writers, already flagged as a dead value by T-115b's own checker), deleted all 9 from `lib/logging/actions.enum.ts`/`log-types.ts`. Corrected 2 premises the original audit overstated: no admin-log badge branch or report-filter dropdown is keyed on individual `ActivityAction`/`LogSource` values anywhere in the repo (action renders as plain text; the log-source badge's only branch is `=== "client"`, unaffected) — so that clause of the AC was already trivially satisfied, not additional work. The one real, non-optional fix: `lib/logging/public.ts`'s normalizer used a **hardcoded 3-way literal check**, not one derived from `LOG_SOURCES`, so narrowing the union would have left a stale reference to a value no longer in the type — simplified to the equivalent 2-way check (`"client"` vs. fallback-to-`"server"`), preserving exactly the existing "unknown values render as server, never rejected" behavior for any historical document. Kana-practice asymmetry resolved in the deletion direction per the fallback: `KANA_PRACTICE_COMPLETED` removed, the asymmetry recorded as intended in a code comment (practice has no session/phase concept at all — infinite modulo-wrapped navigation, no start/end — so "completion" isn't a defined moment the way quiz/survival's phase machines have one; adding logging would require designing that concept first, which is new product work, not this task's scope). Verified: `next build` clean, lint 0 errors, 366 unit + 76 browser + 129 emu (3 skipped) all green, `check:vocab` shows `[LogSource] agrees (2 values)` with no remaining dead-value warning.
**Traces to** ADR-119 (AD-19) · OP-9, W-8(b), TD-6(b,c), OP-19(c) · cluster **C12** · `assess/03`, `/07`, `/09`
**Acceptance criteria**

- Each of the 8 members and the `cloud_function` source is removed (with its badge branch and any admin report filter keyed on it) or has a claimed ledger row.
- **The kana-practice asymmetry is gone**: practice either logs a completion like quiz and survival, or `KANA_PRACTICE_COMPLETED` is deleted and the asymmetry is recorded as intended. The three modes are symmetric either way.
- **Rendering of historical log documents is preserved** — stored `system_logs` data may carry values an enum prune would orphan; the normalizer that maps unknown sources to `"server"` must remain intact.
- The enum's "MUST use these constants" contract becomes true, giving T-115b's vocabulary check an honest target.
  **Standards** CS-12 (logging standards), CS-8, CS-3
  **Regression scope** The admin log viewer rendering historical entries is the real risk — a narrowed enum must not break the display of already-stored values. Intersects T-103a (the relocated log vocabulary).
  **Rollback** Git revert; if kana-practice logging was added, removing it is independent.
  **Fallback if Q-11 is unanswered** Delete unclaimed members; resolve the kana-practice gap in the deletion direction and record the asymmetry as intended.

#### T-119c — Handler-less admin buttons + Settings stub + orphan `canChangeSettings`

**Size** M · **Wave** 5 · **Status** ✅ **DONE (Q-13 fallback applied)**
**Delivered** Applied the task's own standing fallback (behavior-neutral delete): removed `QuickActionsCard.tsx` entirely (all 3 buttons — hardcoded JSX, confirmed zero handlers, zero props from its mount site) and its mount in `AdminOverviewPage.tsx`; removed the Settings route (`app/.../admin/settings/page.tsx`), `AdminSettingsPageContent.tsx` (confirmed a deliberate, honest "not available yet" stub — not an oversight, git history shows it replaced a real-but-non-persisting form), and its nav entry in both `AdminSidebar.tsx` **and** `command-palette/data/actions.ts` (the latter explicitly comments "mirrors AdminSidebar.tsx's route list exactly" — caught by checking every reference, not just the sidebar the original audit named). Removed `canChangeSettings` from `PermissionSet`/`ROLE_PERMISSIONS` (`rbac.ts`) — confirmed by repo-wide grep to have exactly 3 references, all in that one file, zero consumers anywhere. One correction to the AC's own premise: the "action-metadata enum" it also names to update **no longer exists** — the old `adminActionClient`'s separate `z.enum([...])` metadata schema was deleted in this same wave's T-106d (ADR-106 unification); the unified `verifiedAdminActionClient`'s metadata schema is a generic `z.string().min(1)`, so removing `canChangeSettings` required touching only `rbac.ts`. Confirmed the remaining 7 permissions are not just "not explicitly dead" but each traces to a real, currently-shipping server action. Removed every orphaned i18n key at both locales (`AdminDashboard.{quickActions,globalSettings,contentAudit,securityReview}`, `AdminSettings.*` — all 4 keys, `Metadata.{adminSettingsTitle,adminSettingsDescription}`, `AdminNav.settings`). Verified: `next build` clean (the `/admin/settings` route is confirmed gone from the route manifest), lint 0 errors, 366 unit + 76 browser + 129 emu (3 skipped) all green — the emu suite's `admins` rules tests confirm the `PermissionSet` shape change didn't alter any other permission's resolution.
**Traces to** ADR-119 (AD-19) · OP-10, W-10, TD-7 · cluster **C12** · `assess/03`, `/07`, `/09`
**Acceptance criteria**

- Each surface is removed or has a claimed ledger row **naming the intended backend** — a claim without a named backend is not a claim.
- `canChangeSettings` is **either required by an action or removed** from both the matrix and the metadata enum.
- The `PermissionSet` matrix stays shape-compatible for its 7 remaining live permissions: every action that declares a permission resolves exactly as before (verified against T-117d's `admins` tests).
- The admin overview renders correctly without the removed card.
- An auditor reading the RBAC matrix can no longer infer a settings-mutation capability that does not exist.
  **Standards** CS-3, CS-4, CS-13, CS-14 (removed strings leave no orphan message keys at either locale)
  **Regression scope** Admin overview layout, and the RBAC matrix shape consumed by the action metadata. Removing a permission from the matrix without removing its enum member (or vice versa) is a type-level break.
  **Rollback** Git revert.
  **Fallback if Q-13 is unanswered** Delete (behavior-neutral — these controls do nothing today).

#### T-119d — `fanOutNotifications` callable: delete or wire

**Size** M · **Wave** 5 · **Status** ⏸️ **RECORDED — still Gated Q-6** — _was: Gated Q-6_
**Delivered** Re-confirmed and sharpened the code-side evidence, per the gate's own explicit standard ("a code-only search is insufficient evidence here"): zero matches for `httpsCallable` anywhere in the repo; the only `getFunctions` usage is `fanout.ts` itself calling the **Admin SDK**'s Task Queue API (`firebase-admin/functions`) to enqueue onto its own queue — not a client invocation of anything. `deliverNotificationTask`'s queue name (`"deliverNotificationTask"`, a hardcoded string) matches `fanOutNotifications`'s enqueue target exactly, and Firebase's 2nd-gen `onTaskDispatched` auto-provisions a queue named after the function with no override anywhere in this repo — so by code construction these are the same queue, not two independently-assessable bindings, narrowing what Q-6 actually needs to determine to one fact: has this queue/callable pair ever been deployed and invoked. No test, script, or doc anywhere instructs an operator to invoke it manually; the only test (`fanout.emu.test.ts`) exercises `deliverOneNotification` directly, never the callable or task-dispatch wrappers. None of this reaches the deployment/invocation-history evidence the gate requires — that remains outside this session's reach (no GCP/Firebase console access, and per T-108b's finding, no repo-level way to even identify the production project). Not deleted: the fallback's own precondition ("only after the deployment-facts half of the gate is satisfied") is unmet, so deleting now would be jumping the gate's own stated order, not applying its default. `digest.ts`/`dailyNotificationDigest` and `deliverNotificationTask` confirmed untouched and unaffected either way.
**Traces to** ADR-119 (AD-19) · OP-14, R-14, CX-7 · cluster **C12** · `assess/07`, `/09`; `disc/13`
**Description.** The admin-only fan-out callable self-documents "No current product action triggers this yet," and no `httpsCallable`/`getFunctions` usage exists anywhere in the app. ADR-119 calls this the strongest test of its own discipline: the code politely documents its dormancy, and **the gate, not the comment, decides**.
**Acceptance criteria**

- The gate answer **rules out an out-of-repo operator invocation** and states the deployment facts: queue existence and any invocation history. A code-only search is insufficient evidence here.
- If unclaimed: the callable, its export binding, and the Cloud Tasks queue contract are removed.
- If claimed: the ledger row names the operator invocation path and the activation intent.
- The digest sibling and `deliverNotificationTask` are **preserved if the gate shows they are live** — Q-6 covers all three bindings and they must be assessed separately.
- Every single-recipient notification producer in the app is unaffected (the callable never served them).
  **Standards** CS-3, CS-6, CS-12
  **Regression scope** Deleting a **deployed** callable that an operator invokes out-of-band breaks an out-of-repo workflow — the reason "zero producers in-repo" is not "zero effects in production." Removing the wrong binding could break the digest path, which T-108a depends on.
  **Rollback** Git revert plus a functions redeploy; the redeploy is the slow part.
  **Fallback if Q-6 is unanswered** Delete the un-called fan-out (the standing default), **but only after** the deployment-facts half of the gate is satisfied — the default covers intent, not deployment state.

#### T-119e — Storybook toolchain + unreferenced scaffold SVGs: delete or adopt

**Size** M · **Wave** 5 · **Status** ✅ **DONE (Q-17 fallback applied)**
**Delivered** Applied the task's own standing fallback (Q-17 rated Low answerability — "nobody decided" is a live possibility, and an undecidable gate resolves to the default): removed all 8 Storybook devDependencies + 2 npm scripts (`package.json`), the `.storybook/` directory, the one story file (`Badge.stories.tsx` — confirmed `Badge.tsx` itself is real and used in ~20 files, only its story left), the `eslint-plugin-storybook` import/spread in `eslint.config.mjs` (3 lines total — confirmed the audio-boundary, `max-lines`, and cross-feature/lib import-boundary rules from T-101c/T-103b are untouched; T-102c/T-104b, also named in the task, turned out not to exist in this file yet — future work, not something this task's removal could disturb), and the 2 Storybook-only `.gitignore` lines. The one genuinely non-trivial edit: `vitest.config.ts` had `@storybook/addon-vitest` wired as a second Vitest project (browser-mode, running the story file itself as tests) — removed that project plus its now-dead `path`/`playwright` imports and `dirname` const, keeping the real unit-test project verbatim. Also removed the 5 unreferenced create-next-app scaffold SVGs (`public/{file,globe,next,vercel,window}.svg`, confirmed zero references by repo-wide search) and, as the task's own "adjacent hygiene" line invites, 2 stray untracked `firestore-debug.log` files (already gitignored, already inert). Ran `npm install` to sync `package-lock.json` (removed 118 packages). Verified: `next build` clean, lint 0 errors (all non-Storybook rules preserved), 361 unit (366 minus the 5 Storybook-integration "tests" that only ever existed because `addon-vitest` turned the story's 5 named exports into Vitest tests — not a loss of real coverage) + 76 browser + 129 emu (3 skipped) all green.
**Traces to** ADR-119 (AD-19) · OP-13, TD-12, W-21(b), CX-7 · cluster **C12** · `assess/07`, `/09`, `/03`
**Description.** Eight Storybook-related devDependencies, two npm scripts and the `.storybook/` config support exactly one story; five create-next-app scaffold SVGs in `public/` are unreferenced. A toolchain implying a component-documentation practice that does not exist misleads newcomers.
**Acceptance criteria**

- The toolchain, scripts, config, lint-plugin wiring, the single story, and the five scaffold SVGs are removed — or active adoption is claimed with a ledger row naming the adoption plan and owner.
- **The lint config's non-Storybook rules are preserved exactly** — the audio boundaries, `max-lines`, and the new import-boundary rules from T-101c/T-102c/T-103b/T-104b.
- The `Badge` component itself survives; only its story leaves.
- The `addon-vitest` removal **does not disturb the four real test configs** — all five suites run unchanged afterward.
- Untracked emulator/build artifacts (`firestore-debug.log` and siblings) are gitignored or removed as adjacent hygiene under the same gate.
  **Standards** CS-3, CS-1 (a toolchain is infrastructure with one consumer), CS-8
  **Regression scope** **The lint and test configuration are the blast radius**, not the UI. A careless devDependency removal breaks the pre-commit gate or a test suite for every subsequent task — run all five suites plus a clean install before merging.
  **Rollback** Restore `package.json`, the lockfile and the config from git, then reinstall.
  **Fallback if Q-17 is unanswered** Delete. Q-17's answerability is rated **Low** — "nobody decided" is a live possibility, and under ADR-119 an undecidable gate resolves to the default.

---

### ADR-105 — Features own UI; routes orchestrate (P2)

#### T-105a — Relocate kana-survival screens to `features/kana/survival/`

**Size** M · **Wave** 6 · **Status** Ready
**Traces to** ADR-105 (AD-05) · W-5, RC-8, CX-9, TD-10, OP-17, PC-15 · cluster **C4** · `assess/03`, `/06`, `/05`, `/09`
**Description.** Kana-survival's four screens (483 lines) live under `app/…/survival/_components/` while their state hooks (666 lines) live in `features/kana/hooks/` — one mode bisected across the two layers the repo otherwise keeps distinct, while its sibling quiz mode lives wholly feature-side. Relocate the screens for sibling parity.
**Acceptance criteria**

- `features/kana/survival/` exists and contains the four screens.
- The survival route page is a thin orchestrator comparable to its sibling mode pages.
- The `app → game` dependency edges that existed **only** because of these files are gone.
- Behavior is unchanged — this is a behavior-neutral move; the survival mode plays identically.
  **Standards** CS-4 (three component tiers), CS-7 (feature grammar), CS-9, CS-14 (no i18n key or token regressions during the move)
  **Regression scope** Import paths across the survival mode; a behavior-neutral but churny move over files four epics already touched. Scheduled in Wave 6 because relocation causes the widest merge conflicts. NQ-5 is closed-by-decision with an owner-veto note — if vetoed, the veto and its rationale get recorded in the ledger, which still satisfies the real goal (a stated tiebreaker).
  **Rollback** Move the files back; no behavioral state to restore.

#### T-105b — Route-layer audit: remaining `_components` are orchestrator-only

**Size** M · **Wave** 6 · **Status** Ready
**Traces to** ADR-105 (AD-05) · W-5, CX-9, RC-8 · cluster **C4** · `assess/03`, `/06`, `/07`
**Description.** Apply the dependency tiebreaker across the whole route layer: a component that imports feature internals (hooks, domain, services) is feature code wherever it currently sits. The notifications page-private list components are the other named instance. Then write the rule down where the repo's other conventions live.
**Acceptance criteria**

- **No `_components/` file under `app/` imports feature hooks, domain, or services** — the dependency test holds, verifiable by search.
- Genuine route chrome remains route-private by name: error and maintenance fallbacks, bottom navigation.
- The notifications page-private list components are relocated feature-side, or documented as chrome under the same test.
- **The placement rule is written in-repo and citable in review**, closing CX-9's absent-tiebreaker gap — this is what fixes the generator, not just the instances.
  **Standards** CS-4, CS-7, CS-9
  **Regression scope** Import-path churn across relocated files. The rule text is a new documentation-maintenance duty; a rule written but not enforced is the standards-decay pattern.
  **Rollback** Move the files back; the written rule can stand independently.

---

### ADR-104 — Flashcard one feature, internal boundaries (P2)

#### T-104a — Define flashcard sub-module boundaries and internal barrels

**Size** L · **Wave** 6 · **Status** Ready
**Traces to** ADR-104 (AD-04) · W-4, CX-2, OP-18, R-4 · cluster **C15** · `assess/03`, `/05`, `/09`, `/11`; `disc/11`
**Description.** Flashcard is 146 files / 16,940 lines with a flat 27-file `components/` directory mixing sharing, comments, builder, import and practice concerns. It **remains one feature** — no top-level split — but its six existing sub-domains (dashboard, detail, games, study/SRS, sharing + comments, import/AI) each receive the same barrel discipline internally that ADR-101 imposes externally.
**Acceptance criteria**

- `features/flashcard` consists of named sub-modules, each with a barrel; **the flat `components/` directory no longer exists**.
- Cross-sub-module imports inside flashcard go through sub-module barrels (verifiable by search).
- The **root barrel is a curated export list, not an `export *` chain** over all sub-modules — reviewable as a real public API.
- The external contract is unchanged: every consumer that imported through the root barrel after T-101b still resolves.
- Boundary calls at the contested seams (progress touches study and dashboard) are decided and documented, not left implicit.
  **Standards** CS-7 (barrel policy), CS-9, CS-2 (files touched during the move meet the tiered ceiling), CS-8
  **Regression scope** The largest file-move task in the plan, over the feature holding 14 of the repo's 25 largest files. Scheduled last precisely because it is merge-conflict-prone. Boundary placement is design work, not mechanical — a wrong seam entrenches the wrong internal API.
  **Rollback** Revert; because the external root barrel is unchanged, rollback does not ripple outside flashcard.

#### T-104b — Enforce flashcard's internal boundaries via lint

**Size** S · **Wave** 6 · **Status** Ready
**Traces to** ADR-104 (AD-04) · W-4, OP-18, P-1 · cluster **C15** · `assess/03`, `/11`
**Description.** Make the internal sub-module boundaries mechanical, so the flat interior cannot re-form behind a single root barrel.
**Acceptance criteria**

- A cross-sub-module import that bypasses a sub-module barrel fails lint with a message naming ADR-104.
- The rule is severity `error` and its scope is confined to `features/flashcard/**` — it must not affect other features.
- The rule composes with T-101c's and T-103b's rules without conflict; a full clean lint run passes.
  **Standards** CS-9, CS-7
  **Regression scope** Sequence after T-104a or the rule fails against the current structure and blocks the pre-commit gate for everyone.
  **Rollback** Remove the rule block.

---

### ADR-110 — One dialog pattern, two tiers (P2)

#### T-110a — Converge the straggler backdrops onto DialogChrome

**Size** S · **Wave** 6 · **Status** Ready
**Traces to** ADR-110 (AD-10) · PC-3, OP-2, W-21, PC-17 · cluster **C12** · `assess/06`, `/09`, `/03`
**Description.** Backdrop styling has drifted: `DeckDetailsPanel` uses a bespoke `bg-[#3c3c3c]/30` and `AdminSidebar` a `bg-black/40` instead of the shared constant. Both converge (per §2.1 M-3). Per the kernel's cross-cutting rule, this task also carries its share of the **raw-hex token cleanup** (UR-3) on the surfaces it touches.
**Acceptance criteria**

- Every `Dialog.Root` composition routes its backdrop and close affordance through `DialogChrome`; `DIALOG_BACKDROP_CLASSNAME` is the **only** backdrop source (no hardcoded backdrop className remains).
- Each overlay's dismiss behavior, focus handling and layout are unchanged — only backdrop styling unifies.
- The two bespoke drawers, `ShareModal` and `CommandPalette` share one documented two-tier pattern: standard → Tier 1 primitives, bespoke → Tier 2 via `DialogChrome`.
- Raw-hex classNames on the touched dialog surfaces are replaced with real tokens. **Where a hex is not an exact token value, the mapping is an explicit adjudication, not a silent nearest-match** — the `#ffc800` phantom-token history is the cautionary precedent.
  **Standards** CS-14 (tokens not raw hex; charts carve-out excepted), CS-1, CS-4, CS-7
  **Regression scope** Overlay appearance app-wide once the backdrop is single-sourced — the next `DIALOG_BACKDROP_CLASSNAME` change will now propagate everywhere, which is the intent and also the risk. Verify focus trap and Escape on every converged overlay.
  **Rollback** Restore the bespoke classNames; per-overlay revert.

#### T-110b — `Drawer`: delete, or adopt with the two bespoke panels converging on it

**Size** M · **Wave** 6 · **Status** **Gated NQ-3** _(veto window — default = delete; see §5.3)_
**Traces to** ADR-110 (AD-10) · OP-12, TD-11, W-21(c), PC-3, CX-7 · cluster **C12** · `assess/06`, `/09`, `/11`
**Description.** The finished, themed, barrel-exported `Drawer` primitive has **zero** render sites while the two surfaces that _are_ drawers hand-compose Base UI `Dialog` directly — CS-1's named counter-example of a shared extraction with zero uses. It is delete-unless-claimed; the only legitimate claim is adoption by those two existing panels.
**Acceptance criteria**

- `Drawer` has **≥1 render site** (adopted) **or** is removed from the barrel and the tree (deleted) — no zero-consumer exported drawer remains.
- If deleted: the two bespoke slide-panels' current behavior is unchanged — under ADR-110 they are already the sanctioned Tier-2 end state, so deleting `Drawer` changes no rendered surface.
- If adopted: **both** `DeckDetailsPanel` and `AdminSidebar` converge on it (anything less fails CS-1's three-use logic and re-creates the problem).
- The shared-UI inventory no longer advertises an unused-but-canonical-looking primitive.
  **Standards** CS-1 (three-use rule; never build ahead of a consumer), CS-3, CS-7
  **Regression scope** Deletion: none if no render site exists — verify the zero-site claim at removal time rather than trusting the corpus count. Adoption: both panels' dismiss, focus and layout behavior.
  **Rollback** Git revert.
  **Fallback if NQ-3 is unanswered** **Delete.** NQ-3 is already closed-by-decision toward deletion; an unanswered veto window simply expires.

---

### ADR-111 — One table engine (P2)

#### T-111a — Migrate Reports onto the shared react-table engine

**Size** L · **Wave** 6 · **Status** Ready
**Traces to** ADR-111 (AD-11) · PC-2, CX-12, W-12, PC-17 · `assess/06`, `/05`; `disc/13`
**Description.** Reports wraps the shared visual shell around a non-table virtualized list, sharing the chrome but none of the engine's sorting/selection/filtering semantics — so "how does an admin grid behave" has two answers. Reports converges onto the engine that Users and Content already run on. Per the kernel's cross-cutting rule, this task also carries its share of the **raw-hex cleanup** (UR-3) on the surfaces it touches.
**Acceptance criteria**

- Reports renders through `useDataTable`; a search finds no parallel table/list shell duplicating the engine's role.
- **The virtualization performance property Reports was deliberately given is not regressed** — variable-height log rows stay virtualized, as a rendering concern within the engine rather than a parallel shell.
- The log-filter semantics survive the move: `applyLogFilters` remains shared by server and client, with identical results before and after.
- The engine keeps **one home inside `features/admin`** — it moves to a shared layer only in the change that introduces a third, non-admin consumer (the three-use rule).
- Raw-hex classNames on the touched table surfaces are replaced with real tokens; the `chartTheme.ts` recharts carve-out is left intact.
  **Standards** CS-1 (three-use rule for lifting), CS-10 (virtualize by trigger), CS-14, CS-2, CS-11
  **Regression scope** The admin Reports surface end to end: sorting, filtering, selection and scroll performance on long log lists. If a genuine variable-height constraint is hit mid-implementation, NQ-4's owner veto is the recorded escape hatch — record it, do not silently abandon the convergence.
  **Rollback** Revert to the previous shell; contained to the Reports surface.

---

### ADR-112 — Two pagination mechanisms codified (P3)

#### T-112a — Record both mechanisms as the sanctioned two; add the review gate against a third

**Size** S · **Wave** 6 · **Status** ✅ **DONE**
**Traces to** ADR-112 (AD-12) · PC-11, OP-3, W-18(b) · `assess/06`, `/09`
**Delivered** Confirmed by repo-wide search: zero `useInfiniteQuery` matches, zero offset-pagination patterns (`.offset(`, `page * pageSize`, `OFFSET`) anywhere in `src/`. Both sanctioned mechanisms already carried channel-rationale docstrings at their definitions (`useCursorPagination.ts:5-17`'s sequential-cursor rationale; `notification-subscribe.ts`'s grow-window rationale) — the one gap was that the grow-window comment explained *why not a static cache* without naming the *cost* of the alternative it chose. Closed that gap directly: `notification-subscribe.ts`'s `subscribeNotifications` docblock now states the O(N·page) read-amplification explicitly as a deliberate correctness tradeoff, names it as the ADR-112-sanctioned mechanism, and states the "no third mechanism" constraint inline. Added CS-10 a sixth numbered rule (`architecture-decision/04-Coding-Standards.md`) — "Pagination — pick per channel, no third mechanism" — since ADR-112 itself already stated this rule in full but the day-to-day coding standard contributors actually consult during review did not carry its own line for it (previously only an incidental parenthetical on the virtualization rule). Updated CS-10's Why/Example prose and the standards-summary line to match. No behavioral change; no ledger entry needed (this task was never gated).
**Description.** Cursor-token paging (one-shot admin queries) and grow-window resubscribe (realtime notifications) sit on genuinely different data channels and each documents its channel-specific rationale in code. Codify them as **the** two and close the door on a third.
**Acceptance criteria**

- A search confirms **no offset pagination and no `useInfiniteQuery`** — the two forbidden third mechanisms remain absent.
- Each of the two mechanisms carries its channel-rationale docstring at its definition; the in-code documentation **is** the contract.
- The rule that a new paged surface picks the mechanism its data channel dictates is written where reviewers will see it, with the "no third mechanism" constraint stated explicitly.
- The grow-window's read-amplification is recorded as a **deliberate correctness tradeoff**, not as unmanaged debt to be "fixed" later.
  **Standards** CS-10 (virtualize/paginate by trigger), CS-7, CS-3
  **Regression scope** None behavioral — documentation plus a review gate. The risk is a future contributor reading the codification as an invitation to unify; the rule must state that unification was rejected with reason.
  **Rollback** Revert the documentation.

---

## 4. Summary tables

### 4.1 By wave

| Wave      | Theme                   |  Tasks |  Ready |  Gated |  Open | Releasable outcome                                                         |
| --------- | ----------------------- | -----: | -----: | -----: | ----: | -------------------------------------------------------------------------- |
| **1**     | Platform Foundations    |     14 |     14 |      0 |     0 | Boundaries lint-enforced, config single-sourced, cycle broken, ledger live |
| **2**     | Safety Net              |      8 |      6 |      2 |     0 | High-risk logic under test; failures reported, not swallowed               |
| **3**     | Security & Data Layer   |     10 |      9 |      1 |     0 | httpOnly session, bounded queries, honest UI                               |
| **4**     | Contracts & Convergence |     12 |      8 |      4 |     0 | Validated writes, one action client, no inline predicates                  |
| **5**     | Migration Completion    |     10 |      2 |      8 |     0 | Notification migration closed, dead surfaces resolved                      |
| **6**     | Structure & Patterns    |      8 |      7 |      1 |     0 | Placement parity, one dialog pattern, one table engine                     |
| **—**     | Unscheduled             |      1 |      0 |      0 |     1 | T-118d (hosting) — awaits a decision, then a new ADR                       |
| **Total** |                         | **63** | **46** | **16** | **1** |                                                                            |

### 4.2 By size

| Size   | Definition                 | Count | Tasks                                                                                                                                                                                                                                  |
| ------ | -------------------------- | ----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S**  | ≤ 1 day                    |    19 | T-120a, T-120c, T-118c, T-101c, T-103a, T-103b, T-102c, T-116b, T-116c, T-107c, T-114c, T-109c, T-109d, T-106d, T-108a, T-108e, T-104b, T-110a, T-112a                                                                                 |
| **M**  | 2–4 days                   |    29 | T-120b, T-118a, T-118b, T-101a, T-102a, T-102b, T-117a, T-117b, T-107b, T-107d, T-113b, T-114a, T-114b, T-114d, T-109b, T-109e, T-115b, T-115c, T-106c, T-108b, T-108c, T-119a, T-119b, T-119c, T-119d, T-119e, T-105a, T-105b, T-110b |
| **L**  | 5–8 days                   |    14 | T-101b, T-117c, T-117d, T-117e, T-116a, T-107a, T-113a, T-109a, T-115a, T-106a, T-106b, T-108d, T-104a, T-111a                                                                                                                         |
| **—**  | unsized (Open)             |     1 | T-118d                                                                                                                                                                                                                                 |
| **XL** | disallowed — must be split |     0 | —                                                                                                                                                                                                                                      |

_(ADR-116 contributes no M-sized task — its three tasks are L, S, S.)_

**Nominal effort at team size 1:** 19×(≤1d) + 29×(2–4d) + 14×(5–8d) ≈ **147–247 developer-days**. Sprint packing, buffer and parallelization notes belong to files 02/03; this is only the raw sum implied by the sizes above.

### 4.3 By status

| Status    | Count | Share | Notes                                                                                    |
| --------- | ----: | ----: | ---------------------------------------------------------------------------------------- |
| **Ready** |    46 |   73% | Schedulable now; no external answer required                                             |
| **Gated** |    16 |   25% | Scheduled into a wave, **NOT READY** until the gate answers; each has a defined fallback |
| **Open**  |     1 |    2% | T-118d — not schedulable; output is a new ADR                                            |

**Gates by question:** Q-12 → 3 · Q-5 → 2 · Q-4 → 2 · Q-8, Q-9, Q-10, Q-11, Q-13, Q-6, Q-17, NQ-1, NQ-3 → 1 each.
**Gates by answering class (by task):** [INTENT] product/author → 7 (Q-8, Q-11, Q-12×3, Q-13, Q-17) · [GCP]/[OPS] → 3 (Q-6, Q-10, NQ-1) · [GCP]+[INTENT] hybrid → 2 (Q-4: credentials **and** analytics scope) · [DATA] → 3 (Q-5×2, Q-9) · closed-by-decision veto window → 1 (NQ-3).
**Gate concentration:** Wave 5 holds 8 of 16 gated tasks and is expected to be **NOT READY** until its questions answer — stated plainly rather than presented as readiness.

### 4.4 By ADR

| ADR     | Decision                                     | Priority |  Tasks | IDs            | Ready / Gated / Open | Wave(s) |
| ------- | -------------------------------------------- | -------- | -----: | -------------- | -------------------- | ------- |
| ADR-101 | Feature public APIs enforced                 | P1       |      3 | T-101a/b/c     | 3 / 0 / 0            | 1       |
| ADR-102 | flashcard → notifications, never back        | P1       |      3 | T-102a/b/c     | 3 / 0 / 0            | 1       |
| ADR-103 | `lib` never imports `features`               | P2       |      2 | T-103a/b       | 2 / 0 / 0            | 1       |
| ADR-104 | Flashcard one feature, internal boundaries   | P2       |      2 | T-104a/b       | 2 / 0 / 0            | 6       |
| ADR-105 | Features own UI; routes orchestrate          | P2       |      2 | T-105a/b       | 2 / 0 / 0            | 6       |
| ADR-106 | Two write families, one action client        | P1       |      4 | T-106a/b/c/d   | 4 / 0 / 0            | 4       |
| ADR-107 | httpOnly server-verified session             | P1       |      4 | T-107a/b/c/d   | 4 / 0 / 0            | 3       |
| ADR-108 | Stored notification vocabulary authoritative | P1       |      5 | T-108a/b/c/d/e | 2 / 3 / 0            | 5       |
| ADR-109 | Validate at the write boundary               | P1       |      5 | T-109a/b/c/d/e | 2 / 3 / 0            | 4       |
| ADR-110 | One dialog pattern, two tiers                | P2       |      2 | T-110a/b       | 1 / 1 / 0            | 6       |
| ADR-111 | One table engine                             | P2       |      1 | T-111a         | 1 / 0 / 0            | 6       |
| ADR-112 | Two pagination mechanisms codified           | P3       |      1 | T-112a         | 1 / 0 / 0            | 6       |
| ADR-113 | Four-tier state; listeners centralize        | P1/P3    |      2 | T-113a/b       | 2 / 0 / 0            | 3       |
| ADR-114 | Bounded queries and honest UI                | P1       |      4 | T-114a/b/c/d   | 3 / 1 / 0            | 3       |
| ADR-115 | Two RBAC engines; no inline predicates       | P1/P2    |      3 | T-115a/b/c     | 2 / 1 / 0            | 4       |
| ADR-116 | Observability activates; report-then-handle  | P1       |      3 | T-116a/b/c     | 1 / 2 / 0            | 2       |
| ADR-117 | Coverage follows risk                        | P1       |      5 | T-117a/b/c/d/e | 5 / 0 / 0            | 2       |
| ADR-118 | Configuration single-sourced                 | P1       |      4 | T-118a/b/c/d   | 3 / 0 / 1            | 1, —    |
| ADR-119 | Dead surfaces default to deletion            | P2       |      5 | T-119a/b/c/d/e | 0 / 5 / 0            | 5       |
| ADR-120 | Staged changes record completion state       | P1       |      3 | T-120a/b/c     | 3 / 0 / 0            | 1       |
|         |                                              |          | **63** |                | **46 / 16 / 1**      |         |

**Coverage check.** All 20 ADRs have at least one task. The 20 ADRs' 60 Success Criteria are distributed across the 63 tasks with no criterion unassigned; the only ADR whose criteria are not fully dischargeable by this backlog is **ADR-118**, whose hosting criterion depends on T-118d (Open, by design).

### 4.5 Standards coverage (CS-n → tasks that must satisfy them)

| Standard                                  | Applied by                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| **CS-1** Three-use rule                   | T-110b, T-111a, T-117e, T-110a                                                          |
| **CS-2** Tiered file-size ceiling         | T-115a (`ShareModal` split), T-106b, T-104a, T-101c — _applies as each file is touched_ |
| **CS-3** No capability without a consumer | T-120a/b/c, T-119a–e, T-114d, T-106d, T-110b, T-109b/c/d, T-116b/c                      |
| **CS-4** Component tiers                  | T-105a/b, T-104a, T-114b, T-102b, T-119c, T-110a                                        |
| **CS-5** Hook responsibilities            | T-113a/b, T-109e, T-117a/b/e, T-116a, T-102a                                            |
| **CS-6** Service responsibilities         | T-118a/b, T-103a, T-102a, T-107a, T-106a/b/c/d, T-108d, T-114d                          |
| **CS-7** Folders and barrel policy        | T-101a/b/c, T-104a/b, T-105b, T-110a, T-112a                                            |
| **CS-8** Naming conventions               | T-101b, T-103a, T-108a, T-115b, T-117a–e, T-119a/b/e                                    |
| **CS-9** Dependency and import rules      | T-101a/b/c, T-102a/b/c, T-103a/b, T-104a/b, T-105a/b, T-106a/b/c, T-115a                |
| **CS-10** Performance guidelines          | T-114a, T-113a/b, T-111a, T-108d                                                        |
| **CS-11** State ownership                 | T-113a/b, T-107b, T-111a                                                                |
| **CS-12** Error and logging               | T-116a (governing), T-102a, T-119b, T-114b/c/d, T-107a, T-120b                          |
| **CS-13** Validation                      | T-109a (governing), T-109b/c/d/e, T-115a/b/c, T-106a/b/c, T-117d                        |
| **CS-14** i18n and theming                | T-110a, T-111a (raw-hex rider), T-114b/c, T-109e, T-119c, T-105a, T-118c                |

---

## 5. Kernel incoherences found (flagged, not silently corrected)

Per the drafting instruction, incoherences are reported rather than deviated from. Nothing below changed a task ID, size, gate or wave.

### 5.1 The task set is **63 tasks, not 50**

The kernel's heading reads "THE TASK SET (50 tasks — fixed)" and its output rules say "each of the ~50 tasks." The **enumerated** set contains **63 task IDs**, and the wave assignment accounts for **62** of them plus the unscheduled T-118d — internally consistent at 63. Since the kernel binds the _IDs_ ("agents elaborate, never invent or renumber"), the enumeration is authoritative and the headline count is a transcription error. All 63 are elaborated above. **Downstream files must plan against 63, not 50** — a 26% under-count would badly distort sprint math.

### 5.2 **Q-4 is not enumerated in `07-Open-Questions.md`**

The kernel gates T-116b/T-116c on Q-4, and both `03-Architecture-Decisions.md` (ADR-116 status) and `06-Decision-Matrix.md` (§2b rank 4, §3 OP-21) treat Q-4 as the live activation gate. But 07's four open-question groups do **not** list Q-4 anywhere; it survives only as an aside in NQ-14's row ("couples to Q-4"). 07's own roll-up arithmetic is also internally inconsistent (header "26", roll-up "25", groups summing to 32). Q-4 is therefore a **real gate with no owner row** — its answering class is inferred here as [GCP] (credentials/ownership) + [INTENT] (analytics scope) from ADR-116's text. Wave 2's question-resolution item needs to name Q-4 explicitly, or it will be the one gate nobody is assigned to answer.

### 5.3 **NQ-3 is gated in the kernel but closed in the source**

The kernel marks T-110b `[GATED NQ-3]`. But 07 §0 lists NQ-3 in the **"Closed — RESOLVED-BY-DECISION"** table, default = delete, with an owner-veto note. The kernel treats the other four resolved-by-decision questions consistently as _ungated_ (NQ-2 → T-118a, NQ-4 → T-111a, NQ-5 → T-105a, NQ-9 → T-106a are all unmarked), so NQ-3 is the lone inconsistency. T-110b's status is kept as the kernel fixes it, annotated as a **veto window rather than a blocker** — practically, it is Ready-on-default and cannot stall.

### 5.4 **T-115b (Wave 4) precedes T-108a (Wave 5), but checks T-108a's output**

T-115b builds the vocabulary-agreement check; one of its targets is the notification union that T-108a widens a wave later. Run failing from Wave 4, the check would fail on a divergence that is already scheduled to be fixed — and a CI check that is red by design is the standards-decay pattern the whole set guards against. Resolved within the kernel's constraints by staging the _target_, not the task: the mechanism ships in Wave 4, the notification target runs **report-only** until T-108a lands and then flips to failing (recorded in T-115b's and T-108a's acceptance criteria). No wave or ID changed.

### 5.5 **The critical path terminates in a gated task**

The fixed critical path ends `… → T-109a → T-108a/d → done`. **T-108d is Q-5-gated**, so the critical path cannot complete on in-repo work alone — it terminates on a live-data answer. T-108a (ungated) can complete; T-108d cannot. Downstream sequencing should treat the path as ending at T-108a with T-108d as a gate-bound tail, and Wave 5's question-resolution item must open Q-5 early enough that the tail is not the schedule's blocker.

### 5.6 **T-108a is labelled "ungated" while Q-7 remains open**

The kernel marks T-108a **ungated**, which is defensible: Q-7's standing default _is_ "the union widens to the 10 written values," so the direction is pre-committed and the answer can only confirm it or trigger a named alternate. But Q-7 is still an open [INTENT] question in 07 Group A. Recorded above as **Ready (Q-7 default in force)** rather than silently ungated, so no reader concludes the question is closed.

### 5.7 Minor: two cross-cutting items had no named owner

The kernel's cross-cutting paragraph assigns the `ShareModal` split and the raw-hex cleanup by rule ("whichever task next touches it") without naming tasks. Assigned here per §2.1 (M-5 → T-115a; M-6 → T-110a + T-111a). UR-4 (the stale lint-config count) is named nowhere in the kernel at all; folded into T-101c (M-7) as the only Wave-1 task editing that file. These are assignments, not additions — no new task IDs were created.

---

_End of file 01. Sequencing rationale, sprint packing, dependency graph and readiness assessment are files 02, 03, 06 and 08._
