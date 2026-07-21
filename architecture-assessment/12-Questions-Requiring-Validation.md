# 12 — Questions Requiring Validation

**Phase 8 — Architecture Assessment (synthesis).** The assessment-phase successor to discovery's `project-discovery/13-Questions-Before-Refactoring.md` (Q-1 … Q-17). It catalogues every question that must be answered before a decision/planning phase, in two parts: **Part A** — the 17 inherited discovery questions, referenced and *extended* with what the assessment added (not restated wholesale); **Part B** — 14 **new** questions the assessment raised that no discovery question covers; **Part C** — minor intent gaps that do not block any decision. It asks and classifies; it proposes no answers, solutions, or tasks.

- **Repo root:** `/Users/yuh.nguyenpham/GitHub/japanese`; project root `src/`. Compiled 2026-07-19 at HEAD `a0bbbc4`.
- **Answer classes** used throughout: **[GCP]** console / deployed-state inspection · **[DATA]** live Firestore data sample · **[ENV]** production environment configuration · **[INTENT]** product-owner / author intent · **[OPS]** deployment records / runbooks · **[REPO]** in-repo audit or local measurement — *needs no production access* · **[MEASURE]** runtime profiling / bundle analysis.
- Bucket-2 finding IDs from `10-Decision-Readiness.md` map onto these questions; cluster IDs (C1…C16) from `11-Evidence-Matrix.md` §2.

---

## Part A — Inherited questions (Q-1 … Q-17), extended by the assessment

All seventeen remain open; none was answered by the assessment (the repo cannot answer them — that is why they exist). What changed: each now has assessment findings hanging on it, and several gained sharper in-repo evidence.

| Q | Still asks | Assessment findings now gated on it | What the assessment added |
|---|---|---|---|
| Q-1 | Production Firebase project identity + provisioned state | R-9, R-13, OP-20, OP-24 (context), OP-21 | R-13 verified the full absence set (no `.firebaserc`, no hosting block, demo-only IDs) — upgraded from “unknown” to “verified absent in-repo.” |
| Q-2 | Deployment platform + canonical URL | TD-14, R-13, OP-21 | TD-14 confirmed `lib/site.ts`'s TODO is the repo's **only** TODO, and enumerated every URL surface fed by the localhost fallback. |
| Q-3 | Remote Config template published; live flag values | CX-10 | CX-10 sharpened the stake: the entire locale-routing cost is paid while the user-visible benefit sits behind `locale_switch_enabled` (in-repo default `false`) — “cost paid, benefit gated.” |
| Q-4 | Sentry/PostHog credentials + intended analytics scope | OP-21, OP-22, R-6, W-17 (production dimension) | OP-22 quantified what dark telemetry hides: 17 promise-swallows + ~20 bare catches with no reporting path below the four boundaries; R-6 showed the swallows sit on real state (SRS counters, Storage cleanup), not just telemetry. |
| Q-5 | Notification migration state in production data (backfill run? legacy docs? indexes? TTL?) | TD-1, RC-3, CX-1, R-5, OP-4, OP-15 (cluster C1/C2) | TD-1 found the runbook heading **“Pending index & rules deploy (NOT yet deployed)”** (`docs/testing-notifications.md:30`, re-verified) — the first in-repo *statement* about deploy state; see NQ-1 for its currency. |
| Q-6 | Cloud Functions deployed/operating; APP_ID env agreement | OP-14, R-14, R-19, TD-16 (severity side) | TD-16/R-14 pinned the exact dual-env-var mechanism and its silent-partition failure mode. |
| Q-7 | Intended end state of `NotificationType` vs `NotificationKind` | W-7, RC-2, OP-4, OP-19(a) (cluster C1) | RC-2 dated the drift precisely (`725633b` → `ca8a654`, no reconciliation commit since) and established the composition of the 10 stored values (adjudicated in `10 §5.7`). |
| Q-8 | Which of the 7 inactive kinds are still planned | W-8, RC-7, TD-6, OP-8, CX-7 | RC-7 separated the one *provable omission* (kana practice logs nothing while both siblings do) from the unknowable-roadmap remainder. |
| Q-9 | What populates `analytics_daily` / `metadata/counters` | W-11, RC-5, TD-8, OP-16 (cluster C6) | RC-5 added the timeline argument: the repo had **no server compute at all** for the three months after the readers were built, so no in-repo producer ever existed; TD-8 added the side cost (every dashboard load pays live `count()` aggregation because the cache path can never hit). |
| Q-10 | Admin-authority provisioning (claims vs `admins/{uid}`) | RC-10, R-8, OP-7 | OP-7 established that the **three predicates already diverge semantically** (rules accept doc-existence with any role value; functions ignore claims; app checks both) — raising the stake from “which is used” to “which divergences are live grants.” |
| Q-11 | Never-emitted logging vocabulary: planned or dead | W-8(b), RC-7, TD-6, OP-9 | TD-6 quantified the live consequence: activity analytics undercount one of three kana modes today, regardless of intent. |
| Q-12 | Where were the unenforced schemas supposed to be enforced | W-9, RC-6, TD-5, R-16, OP-11 (cluster C5) | RC-6 located the exact compatibility line in the epic (`card.schema.ts:25-27` preserves legacy call sites “unchanged”) — the intent question is now “was crossing that line still planned,” which is narrower than discovery's framing. |
| Q-13 | Intended behavior of Quick Actions / Settings stub / `canChangeSettings` | W-10, TD-7, OP-10 | TD-7 confirmed via discovery's U-8 sweep that these are the repo's *only* no-behavior controls — the pattern has not spread, so the answer scopes three surfaces, not a class. |
| Q-14 | AI Logic operational; App Check enforced | OP-23 (context for what AI tests should assert), R-11/R-17 (App Check as backstop — §D D-2) | The risk file registered App Check as D-2: its absence/presence changes the *residual* severity of the cookie and XSS findings but blocks nothing else. |
| Q-15 | Google Translate TTS: accepted risk? production failure rate? | W-19(a), S-15/S-18 (context: the boundary confines it) | W-19 re-verified the endpoint and the silent `speechSynthesis` downgrade path; OP-22 noted audio is the *only* subsystem whose failures leave any trace (`AUDIO_PLAYBACK_FAILED`) — so Q-15's failure-rate half is answerable from production `system_logs` if they exist. |
| Q-16 | KanjiVG `master`-branch fetch: permanent or interim | W-19(b) | W-19 re-verified the unpinned moving-branch URL; no new evidence either way on intent. |
| Q-17 | Storybook adoption active; scaffold artifacts deliberate | TD-12, OP-13, CX-7, W-21(b) | TD-12/OP-13 corrected the package count (8, incl. `eslint-plugin-storybook`) and confirmed the 1-story census at HEAD. |

---

## Part B — New questions raised by the assessment (NQ-1 … NQ-14)

None of these is covered by Q-1 … Q-17. Where one *extends* an inherited question, the relationship is stated; it is listed here because the assessment surfaced a new fact or a new decision dependency that the discovery question does not capture.

### NQ-1 — Is the runbook's “NOT yet deployed” status for the notification indexes/rules still current?

- **Question:** `docs/testing-notifications.md:30` carries the heading “Pending index & rules deploy (**NOT yet deployed**)”. Is that statement still accurate at assessment time — and if a deploy has since happened, what exactly was deployed (indexes, rules, TTL), when, and to which project?
- **Raised by:** TD-1 (evidence item f); interacts with RC-3, CX-1, OP-15, R-9, R-19.
- **Discovery cross-ref:** extends Q-5. Q-5 asked *whether* indexes/TTL are deployed as an open unknown; the assessment found an in-repo document *asserting* the answer is “no” as of its writing — which converts the question from “unknown” to “dated statement of unknown currency.” A stale “NOT yet deployed” note that outlived an actual deploy would be worse than no note.
- **What would answer it:** [OPS] deployment records / [GCP] Firebase console index+rules inspection, diffed against `firestore.indexes.json` and `firestore.rules` at HEAD.
- **Decisions blocked by it:** retiring any dual-query/dual-index machinery (cluster C2); trusting the runbook as an ops artifact; the R-9 emulator-vs-prod gap assessment.

### NQ-2 — Is the proxy-vs-AuthGate public-allowlist divergence intended?

- **Question:** `proxy.ts:9-18` admits `/login`, `/sitemap.xml`, `/robots.txt`, and the shared-deck OG-image pattern as public; `lib/providers.tsx:24` admits only `/flashcard/shared/[^/]+` — while its comment claims it “mirrors proxy.ts's public-path allowlist.” Is the narrower AuthGate list a deliberate difference (the gate has different duties than the edge) or drift against the stated mirror intent — and which list is the canonical definition of “public route”?
- **Raised by:** W-20(a); CX-6; RC-4 (technical impact); discovery's own description (“mirrors the proxy allowlist”) is factually wrong at HEAD — flagged in 03 §Discrepancies.
- **Discovery cross-ref:** none (Q-2 covers hosting/URL, not the allowlist contract). New.
- **What would answer it:** [INTENT] author/product statement of the intended public-route set; secondarily [REPO] a behavior spec of what each list actually controls (redirect vs splash), which is derivable from code.
- **Decisions blocked by it:** any new public route or SEO surface (both silent-failure modes W-20 names); consolidation of the five-layer gating stack (CX-6); canonicalizing a single allowlist source.

### NQ-3 — `Drawer`: pending adoption or removable?

- **Question:** The shared `Drawer` primitive (built 07-17, E13-T2, barrel-exported, zero render sites — re-verified) coexists with two hand-composed drawers (`DeckDetailsPanel`, `AdminSidebar`) built on the same Base UI Dialog. Was `Drawer` built *for* those two surfaces (adoption pending) or speculatively (removable)?
- **Raised by:** OP-12 (which explicitly flags that no discovery question covers it), TD-11, W-21(c), PC-3, CX-7.
- **Discovery cross-ref:** none — a stated gap; nearest analogue is Q-17's adoption-status framing for Storybook.
- **What would answer it:** [INTENT] author intent (E13-T2's scope).
- **Decisions blocked by it:** the overlay-standardization branch of OP-2; the shared-UI inventory's credibility (W-21's “misleading affordance” cost persists until either branch is taken).

### NQ-4 — Why is Reports outside the shared table engine?

- **Question:** The 07-16 migration moved Users and Content onto the shared react-table engine (`684482e`); the same day, Reports was instead virtualized as a non-table list sharing only the visual shell (`fe7d1b5`). Is Reports' exclusion a deliberate constraint decision (variable-height, non-columnar log entries) or an unfinished migration?
- **Raised by:** PC-2 (explicitly: “the *reason* Reports was excluded … is intent unknown”).
- **Discovery cross-ref:** none. New.
- **What would answer it:** [INTENT] author intent; the constraint reading is plausible from code but stated nowhere.
- **Decisions blocked by it:** admin table standardization scope; whether “admin grid” has one behavior contract or two.

### NQ-5 — Is kana-survival's route-side placement a considered choice?

- **Question:** Survival's four screens have survived three relocation passes (and were edited in place by four epics) while every sibling mode lives feature-side. Was this a considered application of route-private `_components/` (“single-route screens stay route-side”) or unexamined drift?
- **Raised by:** PC-15, RC-8, W-5, TD-10, CX-9, OP-17 (cluster C4).
- **Discovery cross-ref:** none. New.
- **What would answer it:** [INTENT] author intent. Note (from `10 §6`): either answer leaves the same decision open — articulate the placement tiebreaker — so this question colors the narrative, not the decision inputs; it is listed because the *convention rule* someone writes should not contradict a deliberate exception if one exists.
- **Decisions blocked by it:** none strictly; it de-risks the placement-rule decision (C4 is otherwise decision-ready).

### NQ-6 — What public-deck scale is expected, and is the unbounded public listener acceptable at it?

- **Question:** The flashcard dashboard mounts a live, `limit()`-less `collectionGroup` listener over all `isPublic == true` lessons (`lesson-subscriptions.ts:120-127`). How many public decks exist today, what growth is expected, and is streaming the entire public corpus to every dashboard visitor an accepted design at that scale?
- **Raised by:** R-2; compounded by R-1/R-10 (same screen holds ≥3 listeners + per-mount progress listeners).
- **Discovery cross-ref:** none (discovery recorded the listener neutrally; no Q rated or scoped it). New.
- **What would answer it:** [DATA] live count of public lessons + [INTENT] product growth expectation.
- **Decisions blocked by it:** dashboard data-loading architecture decisions; virtualization scope; any Firestore read-cost budget.

### NQ-7 — Is anonymous leaderboard readability (uid + displayName) intended?

- **Question:** `firestore.rules:170-173` allows unauthenticated reads of `leaderboard_*` documents whose IDs are Firebase uids and whose bodies carry display names. Is the uid↔displayName mapping's public readability an intended product requirement (public leaderboards) or an oversight?
- **Raised by:** R-3 (the risk file flags that discovery's inventory framed this as a design choice without confirmation).
- **Discovery cross-ref:** none. New.
- **What would answer it:** [INTENT] product-owner confirmation.
- **Decisions blocked by it:** leaderboard rules decisions; the app's PII posture statement; R-3's severity (defect vs feature).

### NQ-8 — Is world-readable card-image Storage accepted?

- **Question:** `storage.rules:8-9` makes every uploaded card image publicly readable (to support share links). Is unbounded public readability of *all* card images — including those on never-shared private decks — an accepted product decision?
- **Raised by:** R-18.
- **Discovery cross-ref:** none. New.
- **What would answer it:** [INTENT] product-owner confirmation.
- **Decisions blocked by it:** Storage rules decisions; privacy expectations documentation for uploads.

### NQ-9 — Should write families B and C converge transports?

- **Question:** Families B (cookie session) and C (idToken bind-arg) both terminate in `adminAuth.verifyIdToken` on the same kind of token, differing only in transport; `lib/safe-action.ts:14-31` documents the difference without justifying it, and both RC-11 and CX-3 identify it as the one open question the staged evolution left behind. Is convergence intended, rejected, or undecided?
- **Raised by:** RC-11, CX-3, W-12, OP-1 (cluster C10).
- **Discovery cross-ref:** none (discovery catalogued the families; no Q asks about the end state). New.
- **What would answer it:** [INTENT] — note this is a *decision to be made*, not a fact to be discovered; the question is whether one was already made and unrecorded.
- **Decisions blocked by it:** OP-1's standardization scope; every future write endpoint's family choice (RC-11's “re-litigated by every future maintainer”).

### NQ-10 — Is the client-gated, no-SSR rendering model a deliberate permanent choice?

- **Question:** Every route except the shared-deck page renders behind a client auth splash; 0 `loading.tsx`, 1 `Suspense`, no data-cache usage — a coherent SPA-on-App-Router choice that no ADR records (docs cover audio, data layer, flags only). Is this the intended permanent rendering model, and what is its measured cost?
- **Raised by:** W-14; PC-10 (uniform `loading.tsx` absence); CX-6 (AuthGate layer).
- **Discovery cross-ref:** none directly (Q-2 covers hosting, not rendering strategy). New.
- **What would answer it:** [INTENT] author confirmation + [MEASURE] a TTI/Lighthouse measurement to size the cost the decision accepts (runnable locally — no production needed for a first signal).
- **Decisions blocked by it:** any rendering/performance strategy decision; whether future work may assume SSR semantics (W-14's stated hazard).

### NQ-11 — Which multi-document writes carry read-modify-write invariants?

- **Question:** Transactions protect exactly three write paths (each with a documented race); everything else multi-doc uses `writeBatch`/`setDoc`. The one known race was patched reactively (`f03fe8e`), implying no systematic audit ever ran. Which of the remaining multi-doc writes (lesson save diff, reorders, cascades, SRS-grade + counter pairs) have read-before-write dependencies that a concurrent writer can violate?
- **Raised by:** R-7 (source confidence Med: “an inferred gap, not a proven bug”); S-8 provides the positive baseline.
- **Discovery cross-ref:** none. New.
- **What would answer it:** [REPO] an invariant-level code audit — fully answerable in-repo, no production access needed.
- **Decisions blocked by it:** reliability-hardening scope; whether R-7 graduates to a defect list or is dismissed.

### NQ-12 — Do all persisted-content paths pass sanitization before the two `dangerouslySetInnerHTML` sinks?

- **Question:** Comment rendering assumes escape-at-write-time (`sanitizeCommentContent`), and the JSON-LD block stringifies lesson metadata (`title`, `ownerName`) without `</script>`-escaping. Does every path that can place content into those sinks — including legacy docs, Admin-SDK writes, digest/function writes, and lesson-metadata edits — pass through escaping?
- **Raised by:** R-17 (which itself notes this is “a code audit, resolvable in-repo”); severity couples to R-11/W-15 (any XSS steals the JS-readable token).
- **Discovery cross-ref:** none. New.
- **What would answer it:** [REPO] end-to-end write-path trace — no production access needed.
- **Decisions blocked by it:** XSS-posture sign-off; the residual severity of the cookie architecture decision (C7).

### NQ-13 — What is the actual page-level accessibility state?

- **Question:** Primitive-level a11y contracts are proven (S-19); the sampled posture beyond primitives is directional only (W-22: no screen-reader pass, no keyboard walkthrough, no contrast measurement), with one verified gap (`SharePrivacyPicker`). What does a real audit find at page level?
- **Raised by:** S-19, W-22 (both explicitly declare the insufficiency); TD's §Insufficient-evidence declines to claim a11y debt for the same reason.
- **Discovery cross-ref:** none. New.
- **What would answer it:** [REPO] an accessibility audit (keyboard, AT, contrast) — local browser work, no production access needed.
- **Decisions blocked by it:** a11y remediation scope and priority; whether W-22's single gap is representative or exceptional.

### NQ-14 — What are the runtime magnitudes (listeners, reads, bundle)?

- **Question:** Structural findings establish *shapes* — per-mount listener multiplication (10 `useUserProgress` mount sites), ≥3 concurrent dashboard listeners, 9 recharts charts, per-keystroke admin queries — but no profiling or bundle analysis exists. What are the actual concurrent-listener counts per screen, Firestore reads per session, and route-level bundle weights?
- **Raised by:** R-1, R-10, W-18 (magnitude caveats in each); S-18's scope note (mechanisms proven, outcomes unmeasured).
- **Discovery cross-ref:** none (discovery §7 flags the listener-count unknown but no Q captures it). New.
- **What would answer it:** [MEASURE] local profiling + bundle analyzer for first-order numbers; [ENV]/[DATA] production telemetry for real-usage numbers once observability exists (couples to Q-4).
- **Decisions blocked by it:** performance-work prioritization; whether R-1/R-2/R-10 are urgent or theoretical.

---

## Part C — Minor intent gaps (recorded; blocking nothing)

Assessment-surfaced “intent unknown” items where every decision path is open regardless of the answer. Listed so they are not re-discovered, not because they gate anything.

| # | Gap | Source | Note |
|---|---|---|---|
| m-1 | Why the June barrel-removal commit (`c474f64`) was reversed by July re-accretion | CX-4 | The arc itself is git-fact; only the reversal's reasoning is missing. |
| m-2 | Skeleton non-consolidation (19 hand-rolled `animate-pulse` files, no primitive) | PC-10 | No epic touched it; plausibly never considered. |
| m-3 | Per-game state idioms (Zustand vs class machine vs hook state) | PC-16 | Each arrived with its own April feature commit. |
| m-4 | Module caches' exemption from ADR-002 (gemini Maps, flags TTL) | PC-14 | Each has an in-file rationale; no cross-cutting cache policy names them. |
| m-5 | Tab-filter mechanism split (URL-param vs local state) | PC-12 | Age/authorship are the observable correlates. |
| m-6 | `artifacts/{APP_ID}` layout origin | CX-11 | Labeled conjecture (scaffold-template signature); layout is irreversible either way. |
| m-7 | Motion (runtime-strict) vs audio (lint-error) enforcement asymmetry | CX-5 | Both boundaries work; the asymmetry has no recorded reason. |

---

## Roll-up

| Class | Count | IDs |
|---|---|---|
| Inherited, still open, extended | 17 | Q-1 … Q-17 |
| New — production/ops/data state | 3 | NQ-1, NQ-6 (data half), NQ-14 (telemetry half) |
| New — product/author intent | 7 | NQ-2, NQ-3, NQ-4, NQ-5, NQ-7, NQ-8, NQ-9 |
| New — intent + measurement | 1 | NQ-10 |
| New — resolvable entirely in-repo (no production access) | 3 | NQ-11, NQ-12, NQ-13 |
| Minor, non-blocking | 7 | m-1 … m-7 |

Three of the fourteen new questions (NQ-11, NQ-12, NQ-13) — and the local halves of NQ-10/NQ-14 — can be cleared by audit/measurement work against the repository alone. Every other open question requires exactly one of: the production Firebase project, deployment records, a live data sample, or the author's intent — the same four answer classes discovery identified, which the assessment narrowed but could not eliminate.
