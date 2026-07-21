# 07 — Open Questions

**Phase 10 — Architecture Decision (residue).** This document is the ledger of everything the decision phase could **not** resolve — the questions on which one or more of the twenty decisions (AD-01 … AD-20) remain conditional, plus the intent/measurement questions the kernel deliberately routes to the product owner or a later audit rather than deciding.

- **Carried from:** `project-discovery/13` (Q-1 … Q-17) and `architecture-assessment/12` (NQ-1 … NQ-14, minor gaps m-1 … m-7).
- **Answer-class legend** (from assessment file 12): **[INTENT]** product-owner / author intent · **[GCP]** console / deployed-state inspection · **[DATA]** live Firestore data sample · **[OPS]** deployment records / runbooks · **[ENV]** production environment config · **[REPO]** in-repo audit — needs no production access · **[MEASURE]** runtime profiling / bundle analysis.
- **Grouping:** by answering-class (who can answer). **Within each group, ordered by how many decisions each blocks** (most first).
- **Defaults:** several kernel decisions are *conditional* — the direction is fixed and a **default is in force while the gate is open**. Those defaults apply *until the gate answers*; the answer can only confirm the default or trigger the pre-named alternate branch.

---

## 0. Closed — RESOLVED-BY-DECISION this phase

Five questions the assessment left open were **answered by a kernel decision** rather than deferred. They are recorded as **closed-with-decision**, not open. Each carries a one-line veto note: the decision is the standing position, and the product/architecture owner may reopen it if the answer contradicts the decision's assumption.

| Q | Resolved by | Decision taken | Veto note (owner may reopen if …) |
|---|---|---|---|
| **NQ-2** — proxy-vs-AuthGate public-allowlist divergence intended? | **AD-18** | Divergence is treated as a **defect, not intent**; one module owns the allowlist, consumed by both proxy and AuthGate. | … the narrower AuthGate list was a deliberate duty-difference (gate ≠ edge). |
| **NQ-3** — `Drawer`: pending adoption or removable? | **AD-10** | **Default = delete** (delete-unless-claimed); the two bespoke slide-panels stay hand-composed via DialogChrome. | … `Drawer` was built *for* `DeckDetailsPanel`/`AdminSidebar` and adoption is genuinely pending. |
| **NQ-4** — why is Reports outside the shared table engine? | **AD-11** | Reports **converges** onto the shared react-table engine. | … Reports' variable-height, non-columnar log entries are a deliberate constraint (the assessment notes this reading is *plausible from code*). |
| **NQ-5** — is kana-survival's route-side placement considered? | **AD-05** | Survival **relocates** to `features/kana/survival/` for sibling parity; the placement rule is written. | … route-private `_components/` for single-route screens was a considered exception. |
| **NQ-9** — should write families B and C converge transports? | **AD-06** | **Converge** on a single verified-identity action client with per-action permission metadata. | … the cookie-session vs idToken transport split is a deliberate per-surface requirement. |

> **Note on NQ-4:** this is the one soft tension between corpus and kernel. File 12 explicitly flags that the constraint reading (Reports = non-columnar) is *plausible but stated nowhere*; the kernel chose convergence. The veto note above is the reconciliation — not a contradiction, a defeasible default.

---

## Open questions (26)

### Group A — [INTENT] Product-owner / author intent (12)

The largest answering-class. None is resolvable from the repo; each needs a person who knows the product roadmap or the original author's intent.

| # | Question (carried) | Why still open | Decisions gated | Default in force while open | Who can answer |
|---|---|---|---|---|---|
| **Q-8** | Which of the 7 inactive `NotificationKind`s are still intended to ship? | Zero-producer status verified; "roadmap vs abandoned" is not recoverable from code (RC-7). | **AD-19** (delete-unless-claimed for the 7 kinds) | **Delete** — each unclaimed kind is removed with its registry/schema/collapse weight. | Product owner |
| **Q-11** | Are the 8 never-emitted `ActivityAction`s + `cloud_function` `LogSource` planned or dead? | Per-member zero-producer verified; kana-practice is a *provable* omission, the rest are roadmap-unknown (TD-6). | **AD-19** | **Delete** unclaimed members; the kana-practice logging gap is *resolved in the direction its gate answers* (log it, or drop the enum). | Product owner |
| **Q-13** | Intended behavior of admin Quick Actions, Settings stub, `canChangeSettings`? | The repo's only inert UI/permission surfaces; pending-vs-abandoned unreadable from code (TD-7, W-10). | **AD-19** | **Delete** (behavior-neutral removal) unless claimed as a pending feature to wire. | Product owner |
| **Q-12** | Where were `cardContentSchema` / `privacyModeSchema` / `publicRoleSchema` meant to be enforced? | Zero-consumer verified; unfinished-adoption vs overtaken-artifact imply opposite treatments (RC-6, R-16). | **AD-09** (per-schema disposition) | **Per-schema gate**: wire into the write path if adoption was intended, else delete. No schema stays declared-but-unenforced. | Author intent |
| **Q-7** | Intended end state of `NotificationType` (4) vs `NotificationKind` (16)? | Drift dated (`725633b`→`ca8a654`, no reconciliation since); target unrecorded (RC-2, OP-4). | **AD-08** (union widening direction) | **Union widens to the 10 written values** (incl. `digest`); rules/TS/writer are brought into agreement. | Author intent (+[DATA] Q-5 for the value census) |
| **Q-17** | Is Storybook adoption active; scaffold artifacts deliberate? | 8 packages : 1 story verified; "nobody decided" is a possible answer no source resolves crisply (TD-12). | **AD-19** | **Delete** the toolchain + scaffold SVGs unless active adoption is claimed. | Author intent |
| **NQ-7** | Is anonymous leaderboard readability (uid + displayName) intended? | Rule verified world-readable; defect-vs-feature depends on product intent (R-3). | *None in kernel* — recorded open (see §2a coverage caveat in file 06). | **No decision** — current world-readable rule stands until product rules on it; **R-3 remains an open risk, not decided.** | Product owner |
| **NQ-8** | Is world-readable card-image Storage accepted? | `storage.rules:8-9` public-read verified; accepted-vs-oversight is intent (R-18). | *None in kernel* — recorded open. | **No decision** — current public-read Storage stands; **R-18 remains open.** | Product owner |
| **NQ-10** | Is the client-gated, no-SSR rendering model a deliberate permanent choice? | Coherent SPA-on-App-Router pattern, ADR-less; intent + a measurement both missing (W-14). | *None in kernel* — recorded open (couples to a future rendering decision). | **No decision** — the client-splash model stands; future work must not assume SSR semantics. | Author intent (+[MEASURE] TTI/Lighthouse) |
| **Q-14** | Is Firebase AI Logic operational; is App Check actually enforced? | Wiring verified; enforcement claim lives only in a comment; project state unknowable (D-2). | **AD-17** (AI test scope); **refines** AD-07 / R-11 residual severity | AD-17 proceeds on structural test floors; App Check state only *refines* the cookie/XSS residual, blocks nothing. | Product owner + [GCP] |
| **Q-15** | Is Google Translate TTS an accepted operating risk; production failure rate? | Header calls it "known-fragile"; replace-later intent + live failure rate outside repo (W-19a). | **None** — informational (audio subsystem). | No decision needed now; the tiered-fallback boundary is preserved regardless. | Author intent (+[DATA] `system_logs` `AUDIO_PLAYBACK_FAILED`) |
| **Q-16** | Is the runtime KanjiVG fetch from GitHub `master` a permanent design? | Unpinned moving-branch fetch verified; permanent-vs-interim not recoverable (W-19b). | **None** — informational. | No decision; the fetch stands. (Attribution/licensing note recorded, not decided.) | Author intent |

### Group B — [GCP] / [OPS] Deployment & production-console state (6)

Answerable only by inspecting the live Firebase project, deployment records, or ops runbooks.

| # | Question (carried) | Why still open | Decisions gated | Default in force while open | Who can answer |
|---|---|---|---|---|---|
| **Q-1** | Which Firebase project is production; what is its provisioned state? | Foundational: no `.firebaserc`, demo-only IDs, env-driven with lazy credentials — nothing in-repo substitutes (verified-absent). | **Verification-gates** AD-06, AD-07, AD-08, AD-14, AD-16, AD-18 (env). Blocks *validation* of the widest set of decisions. | AD-18 documents the ~30 env vars now; the decisions' *directions* stand, but their **production verification** waits on project identity. | [GCP] console + [ENV] |
| **Q-6** | Are the Cloud Functions deployed/operating; do APP_ID vars agree in prod? | Deployment state inherently out-of-repo; `fanOutNotifications` has zero in-repo callers (OP-14, R-14). | **AD-19** (fan-out delete-unless-claimed), **AD-08** (digest doc shape) | **Delete** the un-called fan-out unless an operator invocation is confirmed; digest `type:"digest"` shape preserved until Q-6+Q-5 answer. | [GCP] / [OPS] |
| **Q-10** | How is admin authority provisioned (first superadmin; claims vs `admins/{uid}`)? | No `setCustomUserClaims` anywhere; three predicates already diverge semantically; live source unknown (RC-10, OP-7, R-8). | **AD-15** (admin-authority predicate alignment); **R-8** unresolved | **No alignment yet** — the three divergent predicates stay as-is; AD-15 converges them *only after* the live source is known. | [OPS] / [GCP] |
| **Q-9** | What populates `analytics_daily` / `metadata/counters` in production? | Read-without-write asymmetry verified repo-wide; a live external writer cannot be excluded (RC-5, TD-8). | **AD-14** (analytics branch); **OP-16** | **Honest-UI default**: dashboards must not fabricate zeros. If no writer exists → remove read paths; if one exists → define the contract. Fabricated-zero rendering is out of policy *now*. | [DATA] / [GCP] |
| **NQ-1** | Is the runbook's "NOT yet deployed" status for notification indexes/rules still current? | `docs/testing-notifications.md:30` asserts non-deploy as of its writing; a stale note that outlived a deploy would be worse than none (TD-1f). | **AD-08** (dual-machinery removal gate) | **Retain** dual indexes/queries/fields until the deploy state is confirmed; removal is gated. | [OPS] / [GCP] |
| **Q-2** | Where is the app deployed; what is the canonical URL? | `lib/site.ts` TODO (the repo's only TODO) records no hosting decision; `SITE_URL` falls back to localhost (TD-14, R-13). | **AD-18** — hosting is the **one explicitly-Open** item inside the accepted set. | **localhost fallback** feeds sitemap/robots/OG/metadata until a hosting decision is *made and recorded*. This is a decision to make, not a fact to find. | Hosting decision (product + ops) |

### Group C — [DATA] Live Firestore data sample (2)

| # | Question (carried) | Why still open | Decisions gated | Default in force while open | Who can answer |
|---|---|---|---|---|---|
| **Q-5** | Actual state of the notification schema migration in production data? | Backfill-run, legacy-doc presence, index deploy, TTL config all out-of-repo (RC-3, R-5). | **AD-08** (largest cluster: C1+C2) | **Retain** all dual read paths / `@deprecated` fields / legacy indexes; they are assumed load-bearing until a data sample proves otherwise. Removal is gated. | [DATA] + [OPS] |
| **NQ-6** | What public-deck scale is expected; is the unbounded public listener acceptable at it? | Query + mount verified; severity scales with production public-deck count (R-2). | **AD-14** (bound requirement — severity), **AD-13** (context) | **Explicit bound required** regardless (AD-14 policy); the *scale* only sizes urgency. Honest default = add `limit()`. | [DATA] + [INTENT] (growth expectation) |

### Group D — [REPO] / [MEASURE] In-repo audit or local measurement (5)

Resolvable **without any production access** — audit or profiling work against the repository alone. Queued, not blocked on anyone external.

| # | Question (carried) | Why still open | Decisions gated | Default in force while open | Who can answer |
|---|---|---|---|---|---|
| **NQ-14** | What are the runtime magnitudes (listeners, reads, bundle)? | Structural shapes established; no profiling/bundle analysis exists (R-1, R-10, W-18). | **Informational** to AD-13 / AD-14 prioritization; sizes R-1/R-2/R-10. | Structural decisions (AD-13 centralize, AD-14 bound) proceed on shape alone; magnitude refines urgency, not direction. | [MEASURE] local profiling + bundle analyzer ([ENV]/[DATA] for real-usage, couples to Q-4) |
| **NQ-11** | Which multi-document writes carry read-modify-write invariants? | Three transactions vs many `writeBatch`/`setDoc`; no systematic audit ever ran (R-7, source Med). | *None in kernel* — feeds a reliability-hardening decision (R-7). | **No decision** — R-7 is an *inferred* gap; the invariant audit decides whether it graduates to a defect list. | [REPO] invariant audit |
| **NQ-12** | Do all persisted-content paths pass sanitization before the two `dangerouslySetInnerHTML` sinks? | Escape-at-write assumed; legacy/Admin-SDK/digest/metadata paths untraced (R-17). | **Refines** AD-07 (XSS residual severity of the cookie architecture, C7) | AD-07's httpOnly target reduces token-theft impact regardless; the trace sizes the residual XSS exposure. | [REPO] end-to-end write-path trace |
| **NQ-13** | What is the actual page-level accessibility state? | Primitive-level a11y proven; page-level directional only; one verified gap (`SharePrivacyPicker`) (S-19, W-22). | *None in kernel* — feeds a11y remediation scope. | **No decision** — remediation scope waits on the audit; the one verified gap stands recorded. | [REPO] a11y audit (keyboard, AT, contrast) |
| **Q-3** | Is a Remote Config server template published; live values of `maintenance_mode` / `locale_switch_enabled`? | Flag live-state is by design outside the repo; code tolerates a never-published template (CX-10). | **None** — informational (affects whether the ja locale switch is reachable). | No decision; in-repo `DEFAULT_FLAGS` (locale switch hidden) stands. | [GCP] Remote Config (secondarily [INTENT]) |

*(Q-3 is placed here as its decision-impact is informational; strictly its answer source is [GCP]. Included in this group because it blocks no decision and needs no in-repo change to proceed.)*

### Group E — [INTENT] Minor intent gaps (7) — recorded, blocking nothing

Carried verbatim from file 12 Part C so they are not re-discovered. Each has every decision path open regardless of the answer; **no default and no gate** — informational only.

| # | Gap | Source | Note |
|---|---|---|---|
| m-1 | Why the June barrel-removal commit (`c474f64`) was reversed by July re-accretion | CX-4 | Arc is git-fact; only the reversal's reasoning is missing. |
| m-2 | Skeleton non-consolidation (19 hand-rolled `animate-pulse`, no primitive) | PC-10 | No epic touched it; plausibly never considered. |
| m-3 | Per-game state idioms (Zustand vs class machine vs hook state) | PC-16 | Each arrived with its own April feature commit. |
| m-4 | Module caches' exemption from ADR-002 (gemini Maps, flags TTL) | PC-14 | Each has an in-file rationale; no cross-cutting cache policy names them. |
| m-5 | Tab-filter mechanism split (URL-param vs local state) | PC-12 | Age/authorship are the observable correlates. |
| m-6 | `artifacts/{APP_ID}` layout origin | CX-11 | Labeled conjecture; layout is irreversible either way. |
| m-7 | Motion (runtime-strict) vs audio (lint-error) enforcement asymmetry | CX-5 | Both boundaries work; the asymmetry has no recorded reason. |

---

## Roll-up

| Status | Count | IDs |
|---|---:|---|
| **Closed — resolved-by-decision** (with veto) | 5 | NQ-2, NQ-3, NQ-4, NQ-5, NQ-9 |
| **Open — [INTENT] product/author** | 12 | Q-7, Q-8, Q-11, Q-12, Q-13, Q-14, Q-15, Q-16, Q-17, NQ-7, NQ-8, NQ-10 |
| **Open — [GCP]/[OPS] deployment/console** | 6 | Q-1, Q-2, Q-6, Q-9, Q-10, NQ-1 |
| **Open — [DATA] live sample** | 2 | Q-5, NQ-6 |
| **Open — [REPO]/[MEASURE] in-repo, no prod access** | 5 | Q-3, NQ-11, NQ-12, NQ-13, NQ-14 |
| **Open — minor, non-blocking** | 7 | m-1 … m-7 |
| **Total open** | **25** (18 blocking a decision or a future decision + 7 minor) | |

**Blocking concentration (ordered).** The single most foundational question is **Q-1** (production project identity) — it gates *verification* of the widest set of decisions (AD-06/07/08/14/16/18). The heaviest *cluster* of conditional decisions is **AD-08** (notification migration), gated by **Q-5 + Q-7 + NQ-1** (and Q-6 for the digest) — the corpus's largest single validation-blocked mass (C1+C2). **AD-19** (dead-surface deletion) is gated by the most *distinct* questions — **Q-6, Q-8, Q-11, Q-13, Q-17** — each independently defaulting to *delete-unless-claimed*. Everything in Group D can be cleared by in-repo work alone; everything in Groups A–C needs exactly one of the four external answer sources the discovery phase first named: production Firebase project, deployment records, live data, or author/product intent.

**Standing defaults summary (apply until each gate answers):** dual notification machinery is *retained* (Q-5/NQ-1); the notification union *widens to 10* (Q-7); every dead surface *defaults to delete* (Q-6/8/11/13/17, NQ-3); unenforced schemas are *wired-or-deleted per-schema* (Q-12); analytics *must not fabricate zeros* (Q-9); public listeners *must carry a bound* (NQ-6); the `SITE_URL` *localhost fallback* persists until a hosting decision is recorded (Q-2). Each default is the pre-committed position; the gate answer can only confirm it or trigger the named alternate branch.
