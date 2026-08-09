# ADR-101 … ADR-120 — Refactor-program decisions

**Status: in force.** Twenty kernel decisions taken for the 2026 refactor program.
Nothing here is superseded; the code cites these numbers in 76 places, and
`eslint.config.mjs` quotes several of them in the error messages it shows
developers when a boundary rule trips.

## Why the 1xx namespace

The repository already carried an ADR series — [001 Audio architecture](001-audio-architecture.md),
[002 Data-layer pattern](002-data-layer-pattern.md), [003 Feature flags](003-feature-flags.md).
The 1xx range was chosen so this set could sit alongside that series without
colliding with it. Both series remain in force: ADR-113 explicitly affirms
ADR-002, and nothing here supersedes 001 or 003.

## Reading the shorthand

The bodies below carry short evidence keys from the assessment that produced them —
`S/W/RC/CX/PC/TD/R/OP-n`, `C-n`, `Q-n`/`NQ-n`, `P-n` — and `T-1xx` task IDs appear in code
comments for the same reason. Those working documents are not part of this repository. Read the
keys as labels, not as links; the decision text stands on its own.

---

## Master table

| ADR | Kernel | Title | Status | Priority | Gate(s) | Evidence clusters |
|---|---|---|---|---|---|---|
| ADR-101 | AD-01 | Feature public APIs are enforced, not conventional (+ Amendment 1) | Accepted | P1 | — | C3 (enabler: W-3) |
| ADR-102 | AD-02 | Dependency direction: flashcard → notifications, never back | Accepted | P1 | — | C3 |
| ADR-103 | AD-03 | `lib` never imports `features` | Accepted | P2 | — | C3 |
| ADR-104 | AD-04 | Flashcard remains one feature, with enforced internal sub-module boundaries | Accepted | P2 | — | C15 |
| ADR-105 | AD-05 | One placement rule: features own UI; routes orchestrate | Accepted | P2 | NQ-5 resolved-by-decision (owner may veto) | C4 |
| ADR-106 | AD-06 | Two write-path families, one action-client architecture | Accepted | P1 | NQ-9 resolved-by-decision (architecture level) | C10 |
| ADR-107 | AD-07 | Auth end-state: httpOnly, server-verified session credential | Accepted | P1 | — (D-2 refines, does not gate) | C7 |
| ADR-108 | AD-08 | Stored notification vocabulary is authoritative; the migration completes | Accepted-conditional | P1 | Q-5, NQ-1 | C1, C2 |
| ADR-109 | AD-09 | Validation lives at the write boundary; declared schemas enforced or deleted | Accepted (per-schema disposition conditional) | P1 | Q-12 | C5 |
| ADR-110 | AD-10 | One dialog pattern, two sanctioned tiers; Drawer delete-unless-claimed | Accepted (Drawer branch conditional) | P2 | NQ-3 (Drawer only) | C12 (Drawer) |
| ADR-111 | AD-11 | One table engine; Reports converges; three-use rule for lifting | Accepted | P2 | NQ-4 resolved-by-decision | — |
| ADR-112 | AD-12 | Two pagination mechanisms are codified as THE two | Accepted | P3 | — | — |
| ADR-113 | AD-13 | Four-tier state model affirmed; realtime listeners centralize per entity | Accepted | P1 (listeners) / P3 (affirmation) | — | — |
| ADR-114 | AD-14 | Data-layer guardrails: bounded queries and honest UI | Accepted (analytics disposition conditional) | P1 | Q-9 (analytics reads only) | C6 |
| ADR-115 | AD-15 | Two RBAC engines, two domains; predicates are never inlined | Accepted | P1 (predicates) / P2 (automation) | — | C11 |
| ADR-116 | AD-16 | Observability activates; errors report before they are handled | Accepted-conditional (activation) / Accepted (policy) | P1 | Q-4 (activation leg) | C13 |
| ADR-117 | AD-17 | Coverage follows risk | Accepted | P1 | — | C8 |
| ADR-118 | AD-18 | Configuration is single-sourced; hosting remains Open | Accepted (hosting Open) | P1 | NQ-2 resolved-by-decision; Q-2 keeps hosting Open | C14 |
| ADR-119 | AD-19 | Dead surfaces default to deletion, behind named gates | Accepted-conditional | P2 | Q-8, Q-11, Q-13, Q-6, Q-17 | C12 |
| ADR-120 | AD-20 | Every staged change records its completion state | Accepted | P1 (highest-leverage) | — | C16 |

---

## ADR-101 — Feature public APIs are enforced, not conventional

**Problem.** Only 2 of 9 features expose a root barrel; cross-feature imports routinely reach deep internal paths — 43 sites import `@/features/flashcard/types`, 9 import `flashcard/games/match/config`, 4 import the single file `ShareModal` — and no ESLint rule constrains import direction or depth (the only restriction rules govern audio APIs) (W-3). Feature "boundaries" are directory names, not contracts: internal reorganizations are repo-wide breaking changes, and this openness is the mechanism by which the W-1 cycle arose and can recur (W-3). The 61-barrel convention delivers its analyzability cost "while only partially delivering its promise" because nothing prevents deep imports (CX-4).

**Context.** The layer discipline itself is real and held for 138 commits by convention alone (S-1) — but its enforcement mechanism is single-author discipline (W-6), and the corpus documents that documented-only conventions drift here (W-20's unequal allowlists, CX-9's placement drift; principle P-1 is derived from exactly these findings). The repo also contains the proof that lint-boundary enforcement works and teaches: the audio boundary is an ESLint *error* with a teaching message, installed after a real incident (S-15). ESLint is already in-repo; no new toolchain is required.

**Decision.** Every feature exposes exactly one root barrel (`features/<name>/index.ts`) as its **only** legal cross-feature import surface. Deep imports across feature boundaries (e.g. the 43 sites into `flashcard/types`) become ESLint violations, enforced by import-boundary rules in the existing ESLint config. Intra-feature imports are unrestricted (ADR-104 adds internal discipline for flashcard). Sanctioned exceptions are explicit and enumerated in the rule: the composition root (`lib/providers.tsx`, per S-1/ADR-103) and `app/` orchestrators importing feature roots.

**Alternatives considered.**
1. *Status quo — convention plus optional barrels.* Rejected: W-3 verifies the convention does not hold (43+ deep-import sites; 2 of 9 root barrels), and the corpus's drift evidence (P-1's basis) shows prose conventions decay in this repo.
2. *Physical package split (workspace package per feature).* Rejected: heavier machinery for the same guarantee; blocked until the W-1/W-2 cycles are broken anyway; nothing in the corpus evidences a need for per-feature versioning or independent builds. (Judgment.)
3. *CI-only graph tooling (madge / dependency-cruiser) as the enforcement seam.* Rejected as primary mechanism: feedback lands at CI time, not editor time, and the in-repo precedent for boundary enforcement that actually holds is ESLint-with-teaching-message (S-15). Cycle-detection tooling may complement (TD-4 notes none is installed) but is not the boundary contract.

**Trade-offs.** Barrel-mediated imports deepen CX-4's known costs (dependency-graph opacity to naive edge extraction, two-hop jump-to-definition). A one-time mechanical migration of all deep-import sites is required. The exception list must be maintained in the rule itself, and an over-broad root barrel can degenerate into "everything is public" — ADR-104 counters this for the largest feature.

**Consequences.** Feature internals become privately refactorable (renaming `games/match/config` stops being a repo-wide change). The next W-1-style cycle cannot form silently — it fails lint at the keyboard. Every feature must curate a real public API: what the root barrel exports becomes a reviewed contract. The ESLint config becomes the canonical, self-documenting statement of dependency rules, citing this ADR the way the audio rule cites ADR-001 (S-15/S-20 pattern).

**Success criteria.**
- Introducing a deep cross-feature import locally fails `lint` with a message naming this ADR.
- A grep for cross-feature imports that bypass root barrels (pattern `@/features/<f>/<subpath>` from a different feature, tests excluded) returns zero; the count of external import sites into `flashcard/types` is 0 (was 43, W-3).
- All 9 features have root barrels; the lint rule's exception list contains only the enumerated sanctioned edges.

**Status.** Accepted. **Priority.** P1.

### Amendment 1 — a feature has two entry points, not one (accepted during T-101b)

**What forced it.** The first attempt at T-101b migrated 151 import statements onto root barrels. It type-checked clean and then failed the production build in four distinct ways, because **a barrel is a single module: importing it pulls the whole feature's graph**, and `flashcard` legitimately contains client components, client-only hooks, and Admin-SDK server code at once.

1. A client component importing the barrel pulled `shared-preview.service` (`import "server-only"`) → `firebase-admin` → `child_process` into the browser bundle.
2. Routing both directions of the `flashcard ↔ notifications` cycle through barrels turned a tolerated file-level cycle into a barrel-level one that Turbopack rejects.
3. A Server Component (`opengraph-image.tsx`) importing the barrel for one constant pulled in client-only hooks calling `useEffect`.
4. Fixing (3) at one entry point surfaced four more. The exceptions were multiplying, not converging.

The original decision anticipated an over-broad barrel becoming *"everything is public"*. It did not anticipate that the same breadth **breaks the server/client fence** — a build failure, not a style problem. The `server-only` fencing (S-3) and a single all-purpose barrel cannot both hold.

**Decision.** A feature exposes **two** entry points, and both are curated public API:

| Entry point | Contains | May be imported by |
|---|---|---|
| `@/features/<f>` | Client-safe surface: components, hooks, client services, types, constants | Anything |
| `@/features/<f>/server` | Server-only surface: Admin-SDK services and anything carrying `import "server-only"` | Server Components, route handlers, server actions |

A feature with no server-only surface has no `server.ts`, and most will not. Type-only re-exports may stay in the client barrel regardless of where the type is declared — they are erased at compile time and create no runtime edge. This is the same split Next.js itself uses (`next` vs `next/server`) and it keeps the fence where the framework enforces it.

**Consequence for the boundary rule (ADR-101/T-101c).** The rule permits exactly these two specifiers per feature and continues to forbid deeper paths. Splitting the entry point does not weaken the boundary — it is still two reviewed contracts rather than an open directory.

**Consequence for sequencing.** Failure (2) is not addressed by this amendment: it is the real `flashcard ↔ notifications` cycle. **T-102a/b must land before T-101b is retried.** The original plan treated them as independent; they are not. Recorded as ledger row `LDG-17`.

---

## ADR-102 — Dependency direction is one-way: flashcard → notifications, never back

**Problem.** The repo's only feature-level value-import cycle: flashcard calls notifications' emit services at 3 sites, and notifications' `InviteActions` imports flashcard's `declineInviteAction` back (W-1). Neither feature can be built, tested, extracted, or owned without the other; the cycle is invisible to module-level tooling (it exists only at directory granularity). Risk if unchanged: each new *actionable* notification kind (7 inactive kinds are pre-declared, several plausibly actionable) adds another backward import, "hardening the cycle from one edge into a lattice" (RC-1).

**Context.** RC-1 establishes the back-edge is not sloppiness but a missing half of the platform's abstraction: the write side has an inversion point (registry + `emitNotification` facade — "adding a notification type = adding ONE entry"), while the render/act side has none, so the inbox must import each kind's action handler directly from its producing feature. The registry pattern is proven and unit-tested in-repo (S-9's pure domain core), and the notifications platform's Firebase-free `domain/` layer signals it was built for feature-agnostic reuse (RC-1). TD-4 confirms no cycle-detection tooling guards against growth.

**Decision.** Dependency direction is one-way: producing features (flashcard today; any feature tomorrow) may import notifications' public API; **notifications imports no feature**. The missing render/act-side inversion is built: notifications' public API exposes a registry/injection seam mapping notification kinds to action handlers; producing features register their handlers (e.g. invite accept/decline) at composition time; the inbox renders actions through the seam. The notifications feature becomes feature-agnostic.

**Alternatives considered.**
1. *Accept the cycle (status quo).* Rejected: RC-1's lattice risk compounds with every actionable kind, and the cycle would be a permanent lint exception under ADR-101, undermining the boundary rule from day one.
2. *Merge the two features into one module.* Rejected: notifications has a pure, fully-tested, deliberately Firebase-free domain core built as a platform capability (S-9; RC-1 notes the design "suggests someone wanted" reuse). Merging destroys the cleanest platform seam in the repo to legitimize an accident.
3. *Relocate `InviteActions` into flashcard (move the component to the feature owning the action).* Rejected as a complete fix: the inbox still must render kind-specific action UI, so a kind→handler/renderer mapping must exist somewhere; without a seam, relocation only moves the import. The seam is the general solution; component relocation may fall out of implementing it. (Mechanism judgment; the direction rule itself is the decision.)

**Trade-offs.** An injection seam adds indirection (registration at the composition root) and a new runtime failure mode — a kind rendered with no registered handler — which must be handled explicitly (render-degraded, report per ADR-116). The seam becomes a public-API obligation of notifications that must stay small.

**Consequences.** Notifications becomes independently buildable/testable/extractable. ADR-101's lint boundary can encode "`features/notifications` imports no other feature" as a hard rule. Future actionable kinds have a defined two-step path: one registry entry + one handler registration. The composition root (the S-1 sanctioned exception) gains the registration wiring.

**Success criteria.**
- Grep of `features/notifications/` for `@/features/` (other than itself) returns zero.
- The invite accept/decline flow works end-to-end with flashcard's handler registered through the seam (observable via the existing realtime e2e path).
- Adding an actionable kind requires zero new imports from notifications into any feature (verifiable by inspection of the registration path).

**Status.** Accepted. **Priority.** P1.

---

## ADR-103 — `lib` never imports `features`

**Problem.** `lib/logging/public.ts` imports its canonical log types (`AdminLog`, `LogLevel`, `LogSource`, `LogType`) from `features/admin/types` — the shared infrastructure layer's vocabulary is owned by one of its consumers (W-2). `lib/logging` cannot be reasoned about, extracted, or consumed by a future non-admin surface without the admin feature; and the vocabulary is already duplicated lib-side as a zod enum (`logSourceSchema`) that must be hand-synced with the feature-side TS union — "the same failure shape as RC-9, in miniature" (RC-12).

**Context.** The layering is otherwise clean and verified: `shared/` imports nothing upward; `lib`'s only feature imports are the composition root (`lib/providers.tsx` — the documented, sanctioned exception, S-1) and this one line. RC-12 shows how it happened: the log types were born in the April admin viewer; when logging centralized into `lib/` (E17-T4), the pipeline moved but the vocabulary's home didn't, and a type-only import bridged the gap. The stated risk is precedent: "a second such import would make the composition-root exception into a pattern, and the layering rule stops being checkable by grep" (RC-12).

**Decision.** The rule **`lib` never imports `features`** is absolute, with exactly one sanctioned upward edge: the composition root `lib/providers.tsx`. The single type-only back-edge is eliminated by relocating the log type vocabulary to the layer that owns the pipeline (`lib/logging`); `features/admin` imports it from there. The lib-side zod duplicate merges with the relocated types into one declaration.

**Alternatives considered.**
1. *Status quo — tolerate the type-only import.* Rejected: erased-at-runtime does not mean free; the cost is structural (build graph, extraction, refactor blast radius — W-2), and the precedent risk is RC-12's explicit warning.
2. *Declare the types on both sides and sync by hand.* Rejected: creates exactly the human-enforced vocabulary agreement that OP-19 shows has already drifted elsewhere; the existing zod/TS split for `LogSource` is this failure shape already in place (RC-12).
3. *Extract a dedicated shared-types package/layer.* Rejected: over-machinery for four type aliases; `shared/` is a leaf UI/util layer, not a types annex, and relocation into the owning module achieves the same result with zero new structure. (Judgment.)

**Trade-offs.** A mechanical import-path rename wave across admin (log service, actions, reports components). The admin feature loses nominal ownership of types its UI renders — deliberately: infrastructure defines, features consume (the inversion W-2 names).

**Consequences.** `lib/logging` becomes self-contained and extractable; a future non-admin logging consumer needs no admin dependency. Cycle B (TD-4) dissolves. ADR-101's lint rules encode `lib → features` as an error with a single-file exception, restoring grep-checkability. The `LogSource` vocabulary has one declaration, closing one OP-19 sync surface.

**Success criteria.**
- Grep of `lib/` for `@/features` matches only `lib/providers.tsx`.
- The log type vocabulary has exactly one declaration site, under `lib/logging`; `logSourceSchema` derives from it rather than restating it.
- A synthetic `lib → features` import fails lint.

**Status.** Accepted. **Priority.** P2.

---

## ADR-104 — Flashcard remains ONE feature with enforced internal sub-module boundaries

**Problem.** `features/flashcard` is 146 files / 16,940 lines — 34% of `src/`, 46% of feature code — spanning six loosely related sub-domains (dashboard, detail/editing, sharing/access/comments, import + AI, per-card SRS/progress, three game modes), with one `types` barrel imported from 43 external sites and a flat 27-file `components/` directory mixing sharing, comments, builder, import and practice concerns (W-4, OP-18). Unrelated concerns churn together — "a game tweak and an access-control fix touch the same import graph" (W-4) — and 14 of the repo's 25 largest files live here.

**Context.** The corpus itself contests the "mega-feature = pathology" reading: CX-2, from the same facts, reads flashcard as "concentration matching domain weight, not pathology per se," with the cost showing "only at the seams, not in the bulk"; W-4's severity confidence is Medium, and Decision Readiness files the mega-feature framing in bucket 3 (judgment). The seam costs are addressed by other ADRs (cycle → ADR-102; deep imports → ADR-101). OP-18 verifies internal seams already partially exist (`dashboard/`, `detail/`, `games/`, `loaders/`) and rates further-boundary availability Medium ("size alone does not prove seams"). A top-level split is therefore *not evidenced as necessary* — but the flat interior is a verified cost.

**Decision.** Flashcard remains **one feature**. No top-level split. Its existing sub-domains — dashboard, detail, games, study/SRS, sharing + comments, import/AI — each receive the same public-API barrel discipline internally that ADR-101 imposes externally: one barrel per sub-module, cross-sub-module imports go through it, and the flat `components/` directory dissolves into the sub-modules it serves. The external contract stays a single curated root barrel.

**Alternatives considered.**
1. *Top-level split (flashcard → decks / study / games / sharing …).* Rejected: not evidenced as necessary (CX-2; bucket-3 adjudication); it would multiply public APIs, force an immediate answer to the game-domain-home question (games live in three places, W-4), and convert 43 external import sites into a cross-cutting rename with no verified payoff. Deferred, not forbidden — enforced internal boundaries make a later split cheap if they prove out.
2. *Status quo (flat internals behind one barrel).* Rejected: with ADR-101 in force, a single root barrel over a 27-file grab-bag becomes a 100-export non-API; OP-18's skew and W-4's churn coupling continue uncontained.
3. *Extract the three flashcard games into `features/game` now.* Rejected for now: flashcard→game already carries the largest cross-feature edge (29 import sites, CX-2); relocating concrete game modes would deepen coupling before the game feature's contract is settled. Revisit under the three-use rule (P-10) if a consumer outside flashcard/kana appears. (Judgment.)

**Trade-offs.** Internal barrels extend CX-4's indirection cost inside the largest feature. Sub-module boundaries will be contested at the SRS/sharing seams (progress touches study and dashboard) — boundary calls are design work, not mechanical. "One feature" accepts that the review/ownership unit stays large (W-4's cost (a)).

**Consequences.** Internals reorganize freely behind a stable external contract. The hot oversized files (TD-3's worst offenders are flashcard's) become sub-module-local concerns. Test allocation (ADR-117) can target sub-modules (SRS, sharing) directly. A future split, if ever justified, is a directory move of already-bounded modules rather than surgery.

**Success criteria.**
- `features/flashcard` consists of named sub-modules, each with a barrel; the flat `components/` directory no longer exists.
- Cross-sub-module imports inside flashcard go through sub-module barrels (grep-verifiable).
- The root barrel is a curated export list, not an `export *` chain over all sub-modules (reviewable).

**Status.** Accepted. **Priority.** P2.

---

## ADR-105 — One placement rule: feature code lives in `features/<name>`; the route layer holds only orchestrators

**Problem.** Kana-survival's four screens (483 lines) live under `app/…/survival/_components/` while their state hooks (666 lines) live in `features/kana/hooks/` — one mode bisected across the two layers the repo otherwise keeps distinct; the notifications inbox list is similarly split (W-5). The placement survived three restructures and four in-place edit passes without moving (RC-8); the `app → game` dependency edges exist *only* because of these files (W-5). Two individually-coherent placement conventions coexist with no recorded tiebreaker — a rule "that can only be learned by enumerating exceptions" (CX-9), and the placement is a live template for the next mode built by imitation (TD-10).

**Context.** Route-private `_components/` is a legitimate Next.js idiom and correct for shell chrome and provider-free fallbacks (`app/_components` error/maintenance chrome is "clearly correct there," CX-9). Survival's screens fail any route-privacy test: they import internals of three features — they are feature UI hosted route-side (RC-8, W-5). Sibling quiz — also a single-route mode — lives wholly feature-side, which argues drift over doctrine (RC-8). Decision Readiness lists placement as ready with only an intent caveat: either NQ-5 answer "leaves the same decision open — articulate the placement tiebreaker." The kernel records NQ-5 as resolved-by-decision; the owner may veto.

**Decision.** One placement rule: **feature code lives in `features/<name>`; the route layer holds only orchestrators**, plus shell chrome and provider-free fallbacks. The tiebreaker is a dependency test: a component that imports feature internals (hooks, domain, services) is feature code, wherever it currently sits. Kana-survival's screens relocate to `features/kana/survival/` for parity with its sibling modes; the notifications page-private list components relocate feature-side by the same test. The rule is written down where the repo's other conventions live (P-12; S-2's orchestrator grammar becomes the stated norm).

**Alternatives considered.**
1. *Status quo — two conventions, no tiebreaker.* Rejected: CX-9 identifies this as textbook missing-standard complexity; RC-8 shows contributors infer rules from disagreeing examples, and both relocation programs already paid double-tree taxes (i18n, design sweeps).
2. *Codify Convention B — "single-route screens stay route-private" — and keep survival as-is.* Rejected: contradicted in-repo by quiz (single route, feature-side); consistency would then demand relocating other modes *toward* `app/`, inverting the dominant convention that 29 thin-orchestrator pages already follow (S-2); and survival's screens are feature UI by the dependency test regardless.
3. *Relocate survival but leave the rule unwritten.* Rejected: fixes the instance, not the generator — CX-9's diagnosis is the absent rule, not the file placement.

**Trade-offs.** A behavior-neutral but churny move (import paths; one more pass over files that four epics already touched). The written rule is a new documentation-maintenance duty. NQ-5's owner veto could reverse the relocation — if so, the veto and its rationale get recorded (ADR-120), which still satisfies the real goal: a stated tiebreaker.

**Consequences.** `app → game` and deep app→kana edges disappear; feature-scoped search and tooling see all of kana; the survival page becomes a thin orchestrator like its siblings (P-12). Future placements have a mechanical answer, and ADR-101's boundary rules get a clean layer to enforce against.

**Success criteria.**
- No `_components/` file under `app/` imports feature hooks/domain/services (the dependency test holds; grep-verifiable).
- `features/kana/survival/` exists with the four screens; the survival route page is an orchestrator comparable to its siblings.
- The placement rule is written in-repo and citable in review (rule file or this ADR), closing CX-9's absent-tiebreaker gap.

**Status.** Accepted (NQ-5 resolved-by-decision; owner may veto). **Priority.** P2.

---

## ADR-106 — Two write-path families, one action-client architecture

**Problem.** Three write families with three auth transports coexist: (A) client-SDK-under-rules, (B) `adminActionClient` cookie-session actions, (C) `actionClient` idToken-bind-arg actions (PC-5). A contributor adding one endpoint must first classify it among three security models with different verification, error shapes, and test harnesses; cross-cutting changes are implemented three times (W-12). The B/C transport split is historical residue: both end at `adminAuth.verifyIdToken` on the same kind of token, "differing only in how it travels" (RC-11), and the open convergence question "will be re-litigated by every future maintainer who finds the two clients" (RC-11, NQ-9).

**Context.** Family A is not residue: ADR-002 reaffirms client-SDK realtime as permanent policy (CX-3), and Firestore rules are a genuine second authorization implementation (S-6). OP-1 rates full convergence below two families as likely unavailable ("reduction below three is the observable headroom"). The metadata-permission design of family B is the corpus's model citizen: "an action *cannot be defined* without declaring its required permission" (S-4). The staged evolution that produced the split is understood and dated (RC-11); the July program formalized rather than unified, explicitly for compatibility (CX-3).

**Decision.** Exactly **two** write-path families are sanctioned: **(a)** client Firebase SDK for learner realtime surfaces, rules-protected (the dominant family, per ADR-002/P-11); **(b)** typed safe-action server mutations for privileged/cross-user writes. Within (b), the B/C transport split converges on a **single verified-identity action client with per-action permission metadata** (S-4's pattern generalized to all server mutations), configured thinly per surface (admin session vs user-initiated). NQ-9 is resolved-by-decision at the architecture level; transport verification details are validated during design. No third family — route handlers or ad-hoc transports — may be added (preserving PC-6's zero-route-handler property as a rule).

**Alternatives considered.**
1. *Status quo — three families, two server clients.* Rejected: RC-11's risk is security-shaped, not aesthetic ("every new cross-family flow re-decides auth transport ad hoc, and a mistake … is a security bug"); the split is documented but never justified (NQ-9: `safe-action.ts` "documents the difference without justifying it").
2. *One family: everything through server actions.* Rejected: forfeits the realtime/offline model the product is built on and contradicts ADR-002's written policy (P-11); family A is deliberate, rules-backed architecture (S-6, CX-3), not legacy.
3. *One family: everything client-SDK + rules.* Rejected: rules cannot express privileged/cross-user invariants — the corpus notes moderation-delete lives in TypeScript for exactly this reason (RC-11), and pushing admin mutations into the rules language doubles an already dual rules-mirror burden (PC-8).

**Trade-offs.** Converging B/C touches ~30 actions' plumbing plus their hooks (the `toActionResult` bridge and re-throw shims). The "thin per-surface configuration" must not regrow into two divergent clients — the convergence contract needs recording (ADR-120). Family choice (a)-vs-(b) still requires judgment at the boundary (privileged? cross-user?); this ADR writes the criterion down, it does not eliminate it.

**Consequences.** One token-verification implementation and one permission-metadata grammar for every server mutation; the security-review surface becomes one client plus the rules. Every server action declares its permission (extending S-4's compile-time property from admin to all). Test strategy per family is fixed: rules/emulator for (a), unit/emulator for (b). The family-choice rule lives at the client's definition site.

**Success criteria.**
- `lib/safe-action.ts` (or successor) exports one action client; there is one verification path (grep: no parallel `adminActionClient`/`actionClient` verification implementations).
- Every server action declares `.metadata({ permission })` (grep: zero actions without metadata; today only family B has this).
- The family-choice criterion is written at the definition site, replacing the two-families docstring.

**Status.** Accepted (NQ-9 resolved-by-decision at the architecture level). **Priority.** P1.

---

## ADR-107 — Auth end-state: an httpOnly, server-verified session credential

**Problem.** The edge gate (`proxy.ts`) checks only that the `auth-token` cookie *exists* — any non-empty value passes — and the cookie's value is the raw Firebase ID token, deliberately **not** httpOnly (so the client SDK can refresh it), `SameSite=Lax`, 7-day max-age while the token inside expires hourly (W-15, R-11). Three consequences: the middleware is routing UX, not security, and trains misplaced trust for any future server-side fetch on a "protected" page; any XSS anywhere exfiltrates a live bearer token — for an admin's browser, every admin action (RC-4, R-11); and the 7-day cookie outliving the 1-hour token produces a confusing "page loads, all actions fail" state (W-15).

**Context.** The presence-only property is *structural* to a client-SDK-first auth mirror: the refresh loop runs in client JS, which forbids httpOnly, and ID-token verification needs Google's rotating keys, which the middleware never fetches — so presence is its only cheap predicate (RC-4). The compensating controls are real and verified: every server action re-verifies with `verifyIdToken`, and Firestore rules gate all client access (S-5, W-15) — so this is a fragile trust structure, not a live data bypass. The named unadopted alternative is Firebase **session cookies** minted server-side (httpOnly, edge-verifiable), which "was never adopted; nothing in the repo records that it was considered" (RC-4). Decision Readiness lists auth/cookie as decision-ready: "a values-and-priorities decision that new facts (App Check state, D-2) would refine but not unblock."

**Decision.** The auth end-state is an **httpOnly, server-verified session credential**. The JS-readable raw-ID-token cookie is not the target: the session credential becomes httpOnly and is verified server-side (the Firebase session-cookie shape, or an equivalent server-minted credential). The edge gate remains a routing-UX check only — real verification stays server-side, exactly as today (S-5 preserved) — but the credential it carries is no longer a bearer ID token readable by page JS. Server identity derivation (P-6) is preserved and reinforced.

**Alternatives considered.**
1. *Status quo — presence-only gate over a JS-readable ID-token cookie.* Rejected: TD-15 flags it as an accepted XSS-amplification risk recorded in no ADR; R-11 rates it a genuine security posture (risk rank 3); the fragile trust structure trains the exact mistake (trusting the edge gate) that becomes a data-exposure bug (RC-4's "risk if unchanged").
2. *Verify the ID token at the edge on every request.* Rejected: requires fetching Google's rotating public keys in middleware (latency + complexity RC-4 explains the current design avoids), and does not fix JS-readability of the credential — the XSS exfiltration path stays open.
3. *Keep the credential JS-readable but shorten its lifetime to the token's.* Rejected: reduces the stale-cookie window but leaves the core exposure (any XSS steals a live token) untouched; httpOnly is the property that closes it, and only a server-minted credential can be both httpOnly and refresh-safe.

**Trade-offs.** Server-minted session cookies add a server round-trip on sign-in/refresh and a session-cookie lifecycle to manage (mint, refresh, revoke) — real work replacing a client-only refresh loop. The client SDK's own in-memory token still exists (the SDK is unchanged), so this narrows, not eliminates, token exposure to page JS; the win is that the *cookie* — which rides every same-origin request — stops being a bearer credential. App Check (D-2/Q-14) would further backstop but is out of scope here.

**Consequences.** XSS no longer yields the session credential via `document.cookie`; the credential stops riding every same-origin request as a bearer token. The stale-cookie "loads-but-fails" state is eliminated (cookie lifetime tracks a server-verifiable session). A future server-rendered protected page can trust a verified session rather than presence. This decision is recorded as the ADR that TD-15 noted was missing.

**Success criteria.**
- The `auth-token` (or successor) cookie is `HttpOnly` (grep of the cookie-set path shows the flag; the current non-httpOnly rationale comment is gone).
- Server-side verification of the session credential is demonstrable (a request with a forged/absent credential is rejected by verification, not merely by presence).
- No client code reads the session credential from `document.cookie`; the edge gate's role is documented as routing-UX only.

**Status.** Accepted. **Priority.** P1.

---

## ADR-108 — The stored notification vocabulary is authoritative; the migration completes

**Problem.** `AppNotification.type` is a 4-value TS union while the same codebase writes 10 distinct runtime values (9 active kinds via the server action + `"digest"` from the Cloud Function) (W-7, corrected count per §5 adj-7). The compile-time contract is "a lie the codebase itself tells": any exhaustive switch silently mishandles 6 of 10 values, and correctness currently depends on `NotificationIcon` widening to `string` (W-7). Alongside it the feature carries a full migration's machinery frozen mid-flight: four `@deprecated` fields, dual read paths, dual composite indexes, an unrun-status backfill script, and a runbook heading "Pending index & rules deploy (**NOT yet deployed**)" (TD-1, C1/C2). TD-1 is the corpus's top-ranked debt (score 8).

**Context.** RC-2 dates the drift precisely (union created `725633b` 2026-04-14; forward vocabulary added `ca8a654` 2026-07-11; no reconciliation commit since) and establishes the exact 10-value composition; `events.ts` says the vocabularies "are reconciled as producers migrate" but the end state is unrecorded. RC-3 shows the dual machinery is pinned by an operational fact the repo cannot observe (did the backfill run in prod?), which "has become the permanent state." Two answers gate the *retirement* half: **Q-5** (do legacy-shape docs still exist; are indexes/TTL deployed) and **NQ-1** (is the "NOT yet deployed" runbook note still current). The *type-vs-runtime* half is a pure code fact needing no production access (W-7 is bucket 1).

**Decision.** The **stored vocabulary is authoritative**: the TS union widens to the 10 values actually written (including `digest`), so the type describes the data and exhaustive switches become sound. The deprecated fields, dual read paths, and dual indexes get a **defined end state and a removal gate**: each is retired once Q-5/NQ-1 confirm no legacy-shape documents remain and the indexes/rules/TTL are deployed. Until that confirmation, the compatibility machinery stays (it is what protects pre-migration docs from vanishing, RC-3) but is recorded as gated-for-removal in the migrations ledger (ADR-120). Vocabulary agreement across the union, the writer, and the rules list becomes an automated check (ADR-115's automation leg / OP-19).

**Alternatives considered.**
1. *Keep the 4-value union; treat wider values as `string` at read sites (status quo).* Rejected: RC-2's "risk if unchanged" — the first exhaustive match or analytics group-by written against the declared union "will be wrong in a way no tool flags"; TS's main safety tool for the field is disabled precisely where it matters.
2. *Narrow the writer back to 4 values.* Rejected: contradicts the shipped platform — 9 active kinds and the digest function all write wider values by design (RC-2); the forward vocabulary is the intended direction, and narrowing would delete working product behavior.
3. *Retire the dual machinery now, without waiting for Q-5/NQ-1.* Rejected: RC-3 is explicit — "cleaning up" the `read` dual-write without confirming the backfill ran "would silently hide pre-migration notifications from users." The removal is gated for a reason; the ledger records the gate rather than guessing.

**Trade-offs.** Widening the union forces every consumer to handle 10 cases now (surfacing latent gaps the `string` widening hid — a short-term cost that is the point). The retirement stays blocked on out-of-repo facts, so the two-schema tax persists until they arrive; the ledger keeps that state visible rather than letting it rot (RC-3's failure mode). The automated vocabulary check is new CI surface to maintain.

**Consequences.** The persisted-field type stops lying; exhaustive handling, preference matrices, and analytics keyed on `type` become correct on live data. The migration acquires an explicit completion condition and owner (ADR-120), converting RC-3's permanent-transitional state into a tracked, closeable one. A concrete removal PR becomes safe the moment Q-5/NQ-1 are answered.

**Success criteria.**
- `NotificationType` (or successor) enumerates the 10 stored values; a deliberately non-exhaustive switch over it fails typecheck.
- An automated check asserts agreement among the TS union, the server writer's accepted kinds, the digest value, and the `firestore.rules` list; it fails on divergence (OP-19).
- The migrations ledger carries the notification migration with its removal gate (Q-5/NQ-1), current stage, owner, and review-by date; deprecated fields/dual indexes are removed within one change once the gate clears.

**Status.** Accepted-conditional on Q-5 (legacy data present?) and NQ-1 (runbook deploy currency). **Priority.** P1.

---

## ADR-109 — Validation lives at the write boundary; declared schemas are enforced or deleted

**Problem.** Three exported schemas have zero non-test consumers while their headers claim to be the validation source of truth: `cardContentSchema` ("the single validation source of truth shared by client forms … server actions, and runtime parsing of AI/import output"), `privacyModeSchema`, and `publicRoleSchema` (W-9, TD-5). Every real write path validates through the narrower `validateAtomicCard` (primary-field only), so `meaning`/`example`/`hint`/cloze-token/difficulty/privacy-mode/public-role constraints are enforced **nowhere** — cards violating every non-primary rule save successfully from manual entry, import, and AI output alike (RC-6). The headers actively mislead: strengthening the schema changes dead code (W-9).

**Context.** RC-6 locates the exact compatibility line: the July validation epic wired zod end-to-end where the surface was new or small but preserved legacy card call sites "unchanged"; the header asserts the *intended* end state as if it were current. Forms already have a proven beachhead — react-hook-form + zodResolver at 2 sites (PC-1) — and the corpus shows the same file's sibling schemas *are* consumed, so partial adoption is the shape (RC-6). TD-5's cost-of-delay is High: "retrofitting the schema later meets non-conforming stored data … Deferral converts a code fix into a data migration" — the exact trap ADR-108 is stuck in. The per-schema *disposition* is gated on **Q-12** (were these the intended validators, and is production data compatible?).

**Decision.** **Validation lives at the write boundary**: every server write path validates through its zod schema (P-7). The three zero-consumer schemas are each **wired into their write paths or deleted** — a per-schema decision. Multi-field forms standardize on react-hook-form + zodResolver (the existing PC-1 beachhead); trivial single-input cases may stay controlled-state. The enforce-or-delete disposition per schema is **conditional on Q-12**: enforcement lands where intended if production data is compatible; the schema is deleted (and its misleading header with it) if it was overtaken.

**Alternatives considered.**
1. *Leave the schemas as declared "source of truth" (status quo).* Rejected: W-9/RC-6 — the headers mislead and tests deepen the illusion; the constraints are enforced nowhere, and data quality drifts (RC-6's "self-widening gap").
2. *Enforce all three immediately, without Q-12.* Rejected: TD-5/RC-6 — enforcement against non-conforming stored data is a data migration, not a code change; turning on `cardContentSchema` blind could reject or break reads of existing cards. The gate exists because the branch (enforce vs delete) genuinely depends on production data compatibility.
3. *Delete all three now as dead code.* Rejected symmetrically: if these are the intended validators (Q-12 = "adoption unfinished"), deletion discards the correct target state; the per-schema, Q-12-gated disposition avoids both irreversible mistakes.

**Trade-offs.** The per-schema gate means this decision does not fully resolve until Q-12 is answered — some schemas may sit in a documented "pending disposition" state meanwhile (recorded in the ledger, ADR-120). Enforcing content caps on a write path that never had them can surface user-visible rejection of inputs previously accepted; that behavior change needs the compatibility check Q-12 provides. Standardizing forms on RHF+zod is incremental migration work (P-5).

**Consequences.** Every card/lesson write is validated by a live schema or by an explicitly-chosen narrower validator — no path claims a protection it lacks. The "source of truth" headers become true or gone. The cloze `___`-token invariant that study mode depends on gains a write-time guard (RC-6's named runtime-bug risk closes). Firestore accumulates no further unvalidated non-primary fields.

**Success criteria.**
- No exported schema has a "source of truth" header while having zero non-test consumers (grep: each such schema is either imported by a write path or removed).
- A card write violating a non-primary constraint (e.g. over-long `meaning`, malformed cloze) is rejected on at least one enforced path, or the constraint is explicitly documented as unenforced-by-decision.
- Multi-field forms use react-hook-form + zodResolver; the per-schema disposition (enforce/delete) for the three schemas is recorded against Q-12 in the ledger.

**Status.** Accepted; per-schema disposition conditional on Q-12 (production data compatibility). **Priority.** P1.

---

## ADR-110 — One dialog pattern with two sanctioned tiers

**Problem.** Overlay UI is built two ways: shared primitives (`Modal`/`ConfirmModal` on Base UI Dialog + `DialogChrome`) and direct `Dialog.Root` composition in four feature components (PC-3, OP-2). Backdrop styling has already drifted — `DeckDetailsPanel` uses a bespoke `bg-[#3c3c3c]/30` instead of the shared `DIALOG_BACKDROP_CLASSNAME` (W-21, OP-2). Separately, the shared `Drawer` primitive has **zero** render sites while two surfaces (`DeckDetailsPanel`, `AdminSidebar`) hand-compose the same slide-panel it provides — "a misleading affordance" (W-21, TD-11, OP-12).

**Context.** PC-3 establishes the two tiers are *deliberate*, not accidental: the July migration's own commit "names AdminSidebar and DeckDetailsPanel as completed migrations" — direct `Dialog.Root` composition **is** the migrated end-state for bespoke overlays, and `CommandPalette` was built new already composing it. So convergence is not "collapse to one component" but "one pattern, two sanctioned tiers, one shared chrome." The `Drawer` question is genuinely open: **NQ-3** asks whether it was built *for* those two surfaces (adoption pending) or speculatively (removable) — the corpus flags no discovery question covers it.

**Decision.** **One dialog pattern with two sanctioned tiers.** Tier 1: shared primitives (`Modal`/`ConfirmModal` on Base UI + `DialogChrome`) for standard dialogs. Tier 2: direct `Dialog.Root` composition for bespoke overlays — the documented end-state — but **always via `DialogChrome`** so backdrop, close-button a11y, and scroll behavior are guaranteed on both tiers. The one straggler (`DeckDetailsPanel`'s bespoke backdrop) converges onto the shared backdrop constant. `Drawer` (zero consumers, two bespoke slide-panels exist) is **delete-unless-claimed**, conditional on **NQ-3**: adopted by the two bespoke drawers if it was built for them, deleted otherwise.

**Alternatives considered.**
1. *Force all overlays onto the shared primitives (one tier).* Rejected: PC-3 shows Tier 2 is the deliberate migrated end-state for bespoke layouts (ShareModal, CommandPalette, the two drawers) — collapsing to one component would fight a decision the July migration already made and recorded in its commit messages.
2. *Leave both tiers unconstrained (status quo).* Rejected: OP-2/W-21 — without the shared-chrome requirement, Tier 2 drifts (the `DeckDetailsPanel` backdrop already has), so the a11y/backdrop guarantees are only on Tier 1; two composition styles with no shared floor is the drift surface.
3. *Keep `Drawer` regardless (defer the question indefinitely).* Rejected: W-21's "misleading affordance" cost persists until either branch is taken — an unused primitive that looks canonical while the real drawers ignore it actively misleads the next author. NQ-3 forces a resolution rather than permanent limbo.

**Trade-offs.** Requiring `DialogChrome` on Tier 2 constrains bespoke overlays slightly (they must route backdrop/close through the shared chrome). The `Drawer` disposition waits on NQ-3 (an author-intent answer); until then it sits explicitly in the ledger as delete-unless-claimed, not silently dead.

**Consequences.** Backdrop, focus-trap, Escape, and scroll behavior are guaranteed for every overlay regardless of tier; the `DeckDetailsPanel` drift closes. The shared-UI inventory stops advertising an unused-but-canonical-looking `Drawer` — either it has real consumers or it is gone. Overlay authors have a two-line rule: standard → Tier 1; bespoke → Tier 2 via `DialogChrome`.

**Success criteria.**
- Every `Dialog.Root` composition routes its backdrop/close through `DialogChrome` (grep: no overlay uses a hardcoded backdrop className; `DIALOG_BACKDROP_CLASSNAME` is the only backdrop source).
- `Drawer` has ≥1 render site (adopted) or is removed from the barrel and tree (deleted) — no zero-consumer exported drawer remains.
- The two bespoke drawers and `ShareModal`/`CommandPalette` share one documented pattern; new overlays follow the two-tier rule.

**Status.** Accepted (Drawer branch conditional on NQ-3). **Priority.** P2.

---

## ADR-111 — One table engine

**Problem.** Tabular UI has two shapes: the shared react-table engine (`useDataTable` + `AdminTable*` chrome) backs Users and Content, while Reports wraps the same visual shell around a non-table virtualized list, sharing "the visual chrome but none of the engine semantics (sorting/selection/filtering)" — so "how does an admin grid behave" has two answers (PC-2, W-12). All table code lives inside `features/admin/`; no non-admin consumer exists.

**Context.** The shared engine is 3 days old at assessment time and deliberately built (`684482e`); Content's filtering/sorting opt-outs are documented in-code with a stated reason (PC-2). Reports' exclusion is plausibly principled — log entries are variable-height, virtualized, non-columnar — but no commit or comment states it (**NQ-4**, resolved-by-decision per the kernel). The engine currently serves exactly two consumers, both admin; the corpus's own three-use rule (P-10, from OP-11's lift logic and the `Drawer` counter-example) governs premature extraction.

**Decision.** The shared react-table engine is **the** table architecture. **Reports converges onto it** (the log list becomes a table view of the engine, keeping its virtualization as a rendering concern rather than a parallel shell) — NQ-4 is resolved-by-decision: the exclusion is treated as unfinished migration, not doctrine, unless the owner supplies a constraint that forbids it. The engine **lifts out of `features/admin` scope only when a third, non-admin consumer exists** (the three-use rule, P-10); until then it stays admin-owned to avoid the `Drawer`-shaped premature-abstraction cost.

**Alternatives considered.**
1. *Codify Reports as a permanent second pattern (status quo).* Rejected: PC-2/W-12 — two behavior contracts for "admin grid" is the drift/learning cost; the exclusion's rationale is unrecorded (NQ-4), so treating it as doctrine would freeze an unexamined divergence. If a real variable-height constraint exists, the owner's veto records it (ADR-120).
2. *Lift the engine to `shared/` now for future reuse.* Rejected: only two consumers exist, both admin; premature extraction is exactly the `Drawer`/`fanOutNotifications` capability-ahead-of-consumer cost the corpus catalogues (CX-7), and P-10 requires three uses before lifting.
3. *Build a bespoke Reports table outside the engine.* Rejected: reintroduces the divergence the decision closes; virtualization is compatible with the engine's row model as a rendering strategy, not a reason for a separate shell (PC-4 shows one library, two documented scroll strategies already coexist).

**Trade-offs.** Converging Reports onto the engine is real work (its virtualized variable-height list must become an engine-driven view) and could hit a genuine constraint mid-implementation — if so, NQ-4's owner veto is the escape hatch, recorded rather than silent. Keeping the engine admin-scoped means the first non-admin table consumer pays a lift cost then (deliberately deferred by P-10).

**Consequences.** "Admin grid" has one behavior contract (sorting/selection/filtering semantics uniform across Users, Content, Reports). The engine's scope rule is explicit, so the next contributor knows it stays admin-owned until a third consumer appears. Content's documented filtering opt-out remains a sanctioned engine configuration, not a separate pattern.

**Success criteria.**
- Reports renders through `useDataTable` (grep: no parallel table/list shell duplicating the engine's role), or an owner-recorded constraint documents why not.
- The engine has one home; it moves to a shared layer only in the change that introduces its third, non-admin consumer.
- New tabular surfaces use the engine; no second table implementation exists (grep `useReactTable` / `<table` stays within the engine's files).

**Status.** Accepted (NQ-4 resolved-by-decision). **Priority.** P2.

---

## ADR-112 — Two pagination mechanisms are codified as THE two

**Problem.** Paging exists in two mechanisms: cursor-token bookkeeping over one-shot admin queries (`useCursorPagination`) and grow-the-window resubscribe over the realtime notifications listener (PC-11, OP-3). Two mental models of "next page" coexist, with different `hasMore` semantics (W-18(b), PC-11).

**Context.** The two variants sit on genuinely different data channels — one-shot Admin-SDK fetches vs an `onSnapshot` stream — and **each documents its channel-specific rationale in-code** (`useCursorPagination`'s sequential-cursor docstring; the notifications grow-window rationale) (PC-11, OP-3). Admin-side pagination was *just unified* (`d9a8d5d`, E17-T5c collapsed two hand-rolled implementations). OP-3 rates unification headroom **Low**: "it is not established that a single mechanism could serve both channels," and Decision Readiness files this as bucket-1 with the caveat that the two are channel-forced. The grow-window's read-amplification is a documented deliberate correctness tradeoff, not unmanaged debt (TD's performance section).

**Decision.** The two mechanisms are **codified as THE two**, each bound to its channel: **cursor-token pagination for jumpable one-shot administrative lists; grow-window resubscribe for realtime feeds.** Both are constraint-documented in-code today; that documentation is the contract. **No third pagination mechanism may be added** (no offset pagination, no `useInfiniteQuery` — both currently absent, PC-11). A new paged surface picks the mechanism its data channel dictates.

**Alternatives considered.**
1. *Unify onto one mechanism.* Rejected: OP-3 (Low headroom) — the mechanisms are forced by different data channels with documented channel-specific rationale; a forced unification would degrade one channel (realtime consistency vs jumpable cursors) with no evidenced benefit.
2. *Leave pagination unspecified (status quo intent).* Rejected: without a codified rule, a third mechanism (offset, infinite-query) can appear on the next surface, reintroducing exactly the "N mental models" cost the two-mechanism cap prevents; PC-11 notes both are currently absent — a property worth protecting.
3. *Adopt a single third-party pagination abstraction over both.* Rejected: adds a dependency and an abstraction layer to unify two already-documented, already-consolidated mechanisms — cost without a corpus-evidenced problem (this is P3 precisely because the divergence is principled, OP-3).

**Trade-offs.** Contributors still learn two "next page" idioms — accepted, because the alternative (one forced idiom) is worse for one channel. The rule constrains future surfaces to the channel-matched mechanism even if a designer prefers otherwise; the constraint is the point.

**Consequences.** The pagination surface stays at two documented mechanisms; the recently-unified admin side and the realtime side both have a stated home. The "no third mechanism" rule is a small, checkable boundary (absence of offset/infinite-query stays true).

**Success criteria.**
- Grep confirms no offset pagination and no `useInfiniteQuery` (the two forbidden third mechanisms remain absent).
- Each of the two mechanisms carries its channel-rationale docstring at its definition (the contract is in-code).
- A new paged list uses the mechanism matching its data channel; no third pattern is introduced.

**Status.** Accepted. **Priority.** P3.

---

## ADR-113 — The four-tier state model (ADR-002) is affirmed; realtime listeners centralize per entity

**Problem.** SRS progress opens one `onSnapshot` listener **per consuming component**: `useUserProgress` has 10 mount sites (`useHomeState`, `useStudySession`, `MatchGame`, `SpeedGame`, `KanaLearn`, `KanaChart`, `useKanaQuizSession`, `useKanaHubState`, `SettingsPageClient`, `profile/page`), each opening its own listener — "in explicit contrast to the single centralized notifications listener" (R-1). Listener count multiplies per render across every authenticated screen; the dashboard alone concurrently holds ≥3 collection listeners plus each progress consumer's own (R-1, R-10). Blast radius is "every authenticated screen" (R-1).

**Context.** The four-tier state model is deliberate and codified in ADR-002 (S-14): local state → Zustand stores → three contexts → React Query for one-shot server state, with `onSnapshot` as the realtime channel; PC-14 confirms the code matches the ADR at every re-verified site. The contexts already demonstrate the target pattern: `NotificationsContext` mounts **one** app-lifetime shared listener (S-14, R-1). So the fix is not a new architecture but applying the existing centralized-subscription pattern to per-entity realtime data. R-1's magnitude is unprofiled (NQ-14, bucket 2) — but the *structural* multiplication is verified and needs no measurement to act on; the listener-centralization is P1, the ADR-002 affirmation is P3.

**Decision.** The **four-tier state model of ADR-002 is affirmed** (P-11: realtime by default, cache by exception). Additionally, **per-entity realtime subscriptions centralize into single shared listeners**: the `useUserProgress` one-listener-per-mount × 10 pattern converges onto a single shared subscription per entity (the notifications-context pattern generalized), so N consumers of one user's progress share one listener, not N. `onSnapshot` remains the realtime channel; React Query stays for one-shot server state; stores and contexts keep their codified roles (S-14).

**Alternatives considered.**
1. *Status quo — one listener per mount.* Rejected: R-1 — the multiplication is structural (happens on every render of those hooks), drives Firestore connection cost, client memory, and read-quota billing, and risks listener storms on reconnect; it directly contradicts the centralized pattern the same codebase already uses for notifications.
2. *Replace realtime progress with React Query one-shot fetches.* Rejected: contradicts ADR-002's affirmed policy (P-11) and the product's realtime study experience; the problem is listener *multiplication*, not realtime itself — S-14/PC-14 show realtime-by-default is deliberate and working.
3. *Defer until NQ-14 profiling quantifies the cost.* Rejected: the structural multiplication is bucket-1 verified (R-1) and the corpus already has the target pattern in-repo; centralizing per-entity listeners is low-risk and does not need magnitude numbers to justify (NQ-14 would size urgency, not validity).

**Trade-offs.** A shared per-entity subscription needs lifecycle management (reference-count mounts; tear down on last unmount) — the same complexity the notifications context already carries, now generalized. Consumers move from "own the listener" to "subscribe to a shared one," a mechanical but non-trivial hook refactor across 10 mount sites.

**Consequences.** Concurrent listener count per screen drops from per-mount to per-entity; the dashboard and study surfaces stop multiplying progress listeners. The four-tier model has one consistent realtime-subscription idiom (centralized), removing the `useUserProgress`-vs-`NotificationsContext` inconsistency R-1 names. ADR-002 stays the written policy; this ADR extends it with the centralization rule.

**Success criteria.**
- Mounting N components that read one user's progress opens one listener, not N (observable via the subscription implementation; the 10 `useUserProgress` sites share a listener).
- `onSnapshot` call sites for per-entity realtime data are centralized (grep: no per-component `onSnapshot` for the same entity across multiple consumers).
- ADR-002's four-tier model remains the documented state architecture; new realtime data follows the centralized-subscription pattern.

**Status.** Accepted. **Priority.** P1 (listener centralization) / P3 (ADR-002 affirmation).

---

## ADR-114 — Data-layer guardrails: bounded queries and honest UI

**Problem.** Two guardrail violations coexist. First, `subscribePublicLessons` runs a live `collectionGroup` query over all `isPublic == true` lessons with **no `limit()`**, mounted on the flashcard dashboard — every viewer streams the entire public-deck corpus into an un-virtualized grid, cost growing linearly and unboundedly with the global public-deck count (R-2, W-11-adjacent). Second, admin dashboards read `analytics_daily` and `metadata/counters` — collections **no repo code writes** — and substitute fabricated zeros when empty, so "Error rate: 0" and "Active users today: 0" render identically whether the system is healthy, idle, or unpopulated (W-11, TD-8, RC-5). An operator "cannot distinguish truth from unpopulated fallback, on exactly the surface built to answer that question" (W-11).

**Context.** The unbounded listener's severity scales with production public-deck count (**NQ-6**, a data/intent question) but the out-of-policy query shape is verified now (R-2, bucket 1 on the code fact). The analytics collections are read-but-never-written repo-wide (RC-5 adds: the repo had no server compute for three months after the readers were built, so no in-repo producer ever existed); whether an out-of-repo pipeline populates them is **Q-9** — the delete-vs-complete branch for the read paths. Principle P-9 (honest UI — absent data renders as absent) is derived from exactly this cluster (C6).

**Decision.** **Data-layer guardrails.** (1) Every collection/collectionGroup listener carries an **explicit bound** — the unbounded public-lesson listener is out of policy and gains a `limit()` (with the grid virtualized or paged per ADR-112's realtime mechanism). (2) **Honest UI**: dashboards render absent data as absent — fabricated zeros are out of policy; unpopulated metrics render as "no data," visually distinct from a true zero (P-9). (3) The never-written analytics collections: their read paths are **removed or a real writer is defined** — **conditional on Q-9** (does an out-of-repo pipeline populate them?).

**Alternatives considered.**
1. *Leave the unbounded listener; rely on low current public-deck count.* Rejected: R-2 — "Low now, High at scale"; the query cost is unbounded by construction and the fix (a bound) is cheap and channel-appropriate. NQ-6 sizes urgency, not whether the bound is correct policy.
2. *Keep fabricated-zero fallbacks (status quo).* Rejected: W-11/TD-8 — presenting invented zeros as data on the operations surface built to answer "is the system healthy" is a correctness defect that drives wrong operational decisions; P-9 is derived to forbid exactly this.
3. *Unconditionally delete the analytics read paths now.* Rejected: RC-5/Q-9 — an out-of-repo aggregation pipeline may exist; deleting the reads could sever a live external contract, while keeping them without a writer preserves a dead path. The branch genuinely depends on Q-9, so the read-path disposition is gated; the honest-UI and bounded-query legs are not.

**Trade-offs.** A `limit()` on public lessons changes product behavior (the dashboard shows a bounded set, needing pagination/virtualization for "see more") — a deliberate trade of completeness for bounded cost. Honest "no data" states are new UI work across the admin stat cards and `SystemHealthCard`. The analytics read-path disposition waits on Q-9 (recorded in the ledger meanwhile).

**Consequences.** No listener can stream an unbounded corpus into a client; read-cost per screen is bounded by construction. Operators can distinguish "healthy," "idle," and "unmeasured" — the dashboard stops lying. The analytics pipeline gets a defined end state (real writer or removed reads) rather than a permanent phantom contract.

**Success criteria.**
- Grep of collection/collectionGroup subscriptions shows every listener carries an explicit bound; the public-lesson listener has a `limit()`.
- Admin metrics render a distinct "no data" state when the source is absent (no code path substitutes a literal `0` for a missing metric).
- `analytics_daily` / `metadata/counters` either have a defined writer in-repo or their read paths are removed — recorded against Q-9 in the ledger; no read path silently fabricates values.

**Status.** Accepted; analytics read-path disposition conditional on Q-9. **Priority.** P1.

---

## ADR-115 — Two RBAC engines are affirmed as two domains; predicates are never inlined

**Problem.** The deck-access predicate is re-derived inline at ≥5 sites outside its canonical engine (whose own header says "Never inline role logic in components or pages"), and **one derivation is semantically divergent**: `shared.service.ts`'s `isOwner` checks `lesson.roles?.[uid] === "owner"` while the engine uses `ownerId ?? userId` — "the closest thing in the corpus to a discovered live bug" (OP-5). Separately, the shared-deck public-access predicate is encoded three times (client resolver, Admin-SDK preview, Firestore rules) that must agree by hand, one running rules-free on the Admin SDK (W-13, TD-9, RC-9). And cross-artifact vocabulary agreements (TS unions ↔ rules lists ↔ writers) are human-enforced, with one already drifted (OP-19).

**Context.** The two RBAC engines are *principled* duplication: admin RBAC (fixed role→permission matrix) and deck-sharing RBAC (per-resource role resolution) are structurally different domains that "share no roles, no storage, and no callers" — merging "would be worse" (PC-8, CX-12, OP-6 rated Low headroom). So the decision is not "unify the engines" but "stop inlining predicates and automate vocabulary agreement." OP-5 is bucket-1 and flagged "urgent to examine regardless" (the `isOwner` divergence is a live behavioral difference in an access path). The public-access predicate's three copies (C11) and the automation opportunity (OP-19/OP-20) round out the cluster.

**Decision.** The **two RBAC engines are affirmed as two domains** (principled duplication, CX-12/PC-8 — no merge). **Predicates are never inlined**: the five inline re-derivations of the deck-access predicate converge on the canonical engine, and the semantically-divergent one (`isOwner` via `roles[uid]`) is corrected to the engine's definition. The three-copy public-access predicate is consolidated behind the engine where SDK boundaries allow (the documented client/Admin bundle-isolation split may keep two *files*, but they share the predicate, not two implementations — RC-9's distinction). **Vocabulary agreement becomes an automated check** instead of prose comments: TS unions ↔ rules lists ↔ writers are machine-verified (OP-19), and the rules-coverage ↔ written-collection correspondence moves toward a check (OP-20).

**Alternatives considered.**
1. *Merge the two RBAC engines.* Rejected: OP-6 (Low), PC-8, CX-12 — the domains share nothing; a merged engine would force one vocabulary onto two unrelated permission models, and the corpus explicitly judges merging "worse."
2. *Leave inline predicates; fix the one divergence only.* Rejected: OP-5 — the engine's own contract forbids inlining, and nothing structural stops the next inline copy from diverging again; fixing one instance without the no-inline rule leaves the generator in place. The rules-bypass property of the Admin-SDK preview (RC-9) makes a future divergence a private-data leak, not a style issue.
3. *Keep hand-synced vocabulary agreements with better comments.* Rejected: OP-19 — one such agreement has already drifted; comments "don't expire," and the corpus's whole P-1/P-4 thrust is enforcement over documentation. Automation is the only mechanism that fails at the moment of divergence.

**Trade-offs.** Routing every predicate through the engine adds a call-indirection at sites that currently inline (minor). The public-access predicate consolidation must respect the real client/Admin SDK bundle-isolation constraint (RC-9) — two files sharing one pure predicate, which is more design care than a naive merge. The automated vocabulary check is new CI surface (shared with ADR-108's check).

**Consequences.** The `isOwner` behavioral divergence — an owner potentially denied access when their lesson lacks a `roles` self-entry (OP-5) — is closed. Deck-access decisions have one implementation; a privacy-model change lands in the engine (and the automated check catches any rules/writer disagreement) rather than in 5+ hand-synced copies. The two-engine structure is affirmed and written down, so future contributors don't "consolidate" the principled duplication by mistake.

**Success criteria.**
- Grep for inline deck-access derivations (`roles?.[uid]`, `allowLinkAccess || isPublic`, ad-hoc owner checks) outside the engine returns zero; all sites call the engine.
- The `isOwner` semantics match the engine's `ownerId ?? userId` everywhere (the OP-5 divergence is gone).
- An automated check fails when the notification-type union, its rules list, and its writer disagree (OP-19); the two RBAC engines remain separate, each the documented source of truth for its domain.

**Status.** Accepted. **Priority.** P1 (inline predicates) / P2 (automation).

---

## ADR-116 — Observability activates; errors report before they are handled

**Problem.** Client errors are visible in production only if they crash one of four route-level boundaries (which call `Sentry.captureException`); the other path is 59 `console.error` sites that "reach no one," and 17 swallow-all catches include the audit-trail writes themselves (W-17, OP-22). A Firestore write that fails inside a service catch "logs to the user's own console and vanishes" (W-17). The Sentry/PostHog wiring is real but double-gated on production credentials the repo cannot see, and the sole captured product event is one manual `$pageview` (OP-21). The swallows sit on *real state* — SRS counters, Storage cleanup, pending-notification delivery, login logging — not just telemetry (R-6, OP-22).

**Context.** The report-then-handle policy is a pure code decision needing no production access (OP-22 is bucket-1). The *activation* of Sentry/PostHog is gated on **Q-4** (do production credentials exist; what analytics scope was intended). The corpus is careful that the swallow idiom is *partly* deliberate — S-12/S-21 read the same sites as a designed fire-and-forget policy so telemetry never blocks user flows (C13's "dual reading"). The one counter-example shows the target shape: audio failures *are* sampled into the activity log (`AUDIO_PLAYBACK_FAILED`), "the only subsystem whose silent failures leave a trace" (OP-22). Principle P-8 (report before you handle) is derived from this cluster.

**Decision.** **Observability activates and errors report before they are handled.** (1) The credential-gated Sentry/PostHog wiring becomes **live** — **conditional on Q-4** (credentials/ownership confirmed; intended analytics scope decided). (2) The **report-then-handle policy is adopted unconditionally** (P-8): the 17 swallow-sites report through the existing logging pipeline before applying their fail-open/fire-and-forget handling; boundaries surface errors, services report them. Deliberate suppression stays deliberate — but it reports first, so silent loss of real state ends (the `AUDIO_PLAYBACK_FAILED` pattern generalized). No error path below the four boundaries stays report-less.

**Alternatives considered.**
1. *Status quo — swallow-and-continue, boundaries-only reporting.* Rejected: W-17/R-6 — production failure modes below the crash threshold are invisible; the audit trail is "best-effort by construction" where it carries security-adjacent events (login, role changes), and orphaned Storage objects/lost notifications accrue undetectably.
2. *Remove the "unused" Sentry/PostHog wiring as dead code.* Rejected: OP-21/Q-4 — it is credential-gated, not dead; removing it presumes the credentials don't exist, which the repo cannot know. The activation branch is gated precisely so this isn't guessed.
3. *Make every swallow a thrown error (surface everything to the user).* Rejected: contradicts the deliberate, corpus-praised fire-and-forget policy (S-12/S-21) — telemetry and secondary writes *should not* block primary user flows; the fix is report-then-handle, which preserves the UX contract while ending the invisibility.

**Trade-offs.** Report-then-handle adds a logging call at 17+ sites and depends on the logging pipeline itself not becoming a new failure amplifier (it is already fire-and-forget by design, S-21). Full observability value waits on Q-4 (activation) — until then the report-then-handle policy still lands, reporting into the in-repo pipeline even if Sentry is a no-op. Deciding analytics scope (Q-4's intent half) is a product decision this ADR defers to the owner.

**Consequences.** Every below-boundary failure of real state leaves a trace (audit writes, SRS increments, Storage cleanup, notification delivery). Once Q-4 clears, production errors are observed; the `/ingest` proxy carries real traffic; the near-empty PostHog surface is widened or accepted by decision. The four boundaries stop being the only reporting surface. This decision is recorded (closing the "no ADR" gap TD-15/W-17 note for the observability posture).

**Success criteria.**
- No swallow site discards an error affecting real state without first reporting it (grep: `.catch(() => {})` on state-mutating writes is replaced by report-then-handle; the count of report-less swallows on real-state writes is 0, was 17).
- At least one non-boundary layer (service/hook/action) reports errors (today only the four boundaries do); reporting exists below the boundaries.
- Sentry/PostHog activation is decided and recorded against Q-4 (live with confirmed credentials, or explicitly deferred with the reason logged in the ledger).

**Status.** Accepted-conditional on Q-4 (activation leg); Accepted (report-then-handle policy). **Priority.** P1.

---

## ADR-117 — Coverage follows risk

**Problem.** Test coverage is inverted relative to risk: pure leaf domains are well-tested (notifications domain, audio, schemas, UI primitives) while the highest-consequence logic is unguarded — all flashcard data services (`lesson-save`'s diff-based batch writer, `progress.service`'s 335-line SRS math, `card`/`comment`/`access`/`shared` services), the sharing-RBAC resolver `resolveRole` (security-relevant, pure, 9 consumers, zero tests), all game-session hooks, and `admin.actions.ts` (380 lines, 20 actions, the RBAC enforcement seam) (W-16, TD-2, OP-23). Four feature modules (`ai`, `game`, `home`, `command-palette`) have zero test files (OP-23). The gap "is allocation, not tooling" — the emulator/browser harnesses that could cover them demonstrably exist (W-16).

**Context.** The five-suite architecture is a verified strength: unit / real-browser / emulator / functions / e2e, each proving what only it can prove, mirrored job-for-job in CI (S-10, S-11). TD-2 is the corpus's #2 debt (score 8), cost-of-delay High: the untested mass "is precisely the code the repo's own plans target for restructuring" (the 44 over-ceiling files), so refactors "either proceed blind or must pay for characterization tests first." The rules suite covers a minority of the rules surface — lessons/cards/comments sharing, `admins`, `system_logs`, `sharedProgress`, the collection-group read are untested (OP-24). This is decision-ready (bucket 1, C8): only *percent* coverage is unmeasured, and no listed decision depends on it.

**Decision.** **Coverage follows risk.** The five-suite topology is affirmed (S-10). Floors are set: **every feature has unit coverage of its domain logic; every ruled collection appears in the rules suite.** The allocation priority is the highest-risk untested units the corpus names: **SRS math** (`progress.service`), the **sharing-RBAC resolver** (`resolveRole` — pure, security-relevant, 9 consumers, and the ADR-115 convergence target), and **flashcard data services** (the diff-based `lesson-save`, `shared.service`). Coverage is measured against risk, not line count — new tests target the money-path logic where regressions are user-data-affecting and hard to notice (P-8/P-9-adjacent).

**Alternatives considered.**
1. *Status quo — coverage where it's easy (leaf domains).* Rejected: W-16/TD-2 — the tests "guard the code least likely to break users" while the diff-based save, SRS math, and access-role resolver run unguarded; refactors in exactly the hot files (TD-3) carry unbounded regression risk.
2. *Mandate a global line-coverage percentage.* Rejected: no coverage tooling output exists in-repo (TD-2's explicit scope note), and a blanket percentage would reward testing trivial leaves (already over-covered) over the hard money-path logic; risk-targeted floors match the actual gap. (Judgment.)
3. *Add characterization tests only at refactor time.* Rejected: TD-2 cost-of-delay — testing at refactor time is "at a higher price than testing at write time," and the file-splitting program (TD-3) "cannot proceed safely without a net"; front-loading the highest-risk units de-risks the restructuring ADR-104/ADR-101 imply.

**Trade-offs.** The named units are the hardest to test (live-deck diffing, SRS state, session hooks) — real effort, some needing the emulator tier (JDK dependency, R-15). Risk-targeted floors are a judgment call per feature rather than a mechanical percentage, so "unit coverage of domain logic" needs interpretation at review. Coverage work competes with the structural ADRs for the same scarce single-author time (W-6).

**Consequences.** The refactors ADR-101/ADR-104/ADR-106/ADR-115 imply gain a regression net over exactly the code they touch. `resolveRole` — an ADR-115 convergence target and a security predicate — becomes tested before it is consolidated. Every ruled collection has a rules-suite test, so ADR-114/ADR-115 rules changes are verifiable. The five-suite infrastructure (already built) gets used where it pays.

**Success criteria.**
- `resolveRole`, `progress.service` SRS logic, and `lesson-save`'s diff writer each have direct tests (grep: `resolveRole`/`rbac` test references > 0, was 0).
- Each of the four zero-coverage features (`ai`, `game`, `home`, `command-palette`) has at least domain-logic unit coverage.
- Every collection with a `firestore.rules` block appears in the rules suite (OP-24's uncovered blocks — lessons/cards/comments, `admins`, `system_logs`, `sharedProgress`, collection-group read — gain tests).

**Status.** Accepted. **Priority.** P1.

---

## ADR-118 — Configuration is single-sourced

**Problem.** Config kept in sync by hand: the public-route allowlist exists twice and is *already unequal* — `proxy.ts` admits `/login`, sitemap/robots, and the OG-image pattern; `lib/providers.tsx`'s AuthGate regex admits only the deck landing page — while its comment claims it "mirrors" the proxy list (W-20(a), verified inequality per §5 adj-14). `APP_ID` is derived from two different env vars in two packages (`NEXT_PUBLIC_APP_ID` vs `NOTIFICATIONS_APP_ID`), a mismatch silently splitting app and functions across two tenant roots (W-20(b), TD-16, R-14). There is no `.env.example` for ~30 referenced env vars (W-20(c), TD-13). And `SITE_URL` falls back to `http://localhost:3000` behind a TODO recording that no hosting decision exists (W-20(d), TD-14).

**Context.** The allowlist divergence's *intent* is **NQ-2** (deliberate difference or drift?), resolved-by-decision here. The APP_ID and env-doc facts are bucket-1 and need no external input (TD-16, TD-13). The hosting decision is genuinely **Open** — **Q-2** requires a product/ops decision that "no repo fact can substitute for" (TD-14); the localhost fallback is correct for dev but wrong-by-default in any mis-configured deploy. Principle P-1 (enforcement over documentation) and the config-sync cluster C14 anchor this.

**Decision.** **Configuration is single-sourced.** (1) One module owns the public-path allowlist, consumed by both proxy and AuthGate — the two divergent copies collapse to one; NQ-2 is resolved-by-decision: the divergence is treated as a **defect, not intent**, and a single canonical allowlist replaces both (if the two lists genuinely need different subsets, that difference is expressed as explicit derivations from the one source, not two hand-maintained lists). (2) One derivation for `APP_ID` shared across both packages (app and functions read the same source). (3) `.env.example` documents the ~30 env vars. (4) The **hosting decision remains OPEN (Q-2)** — `SITE_URL`'s production value cannot be decided from documents; this ADR records the gap rather than inventing an answer.

**Alternatives considered.**
1. *Keep two allowlists better-commented (status quo intent).* Rejected: W-20(a)/NQ-2 — the "mirror" comment is already false; two hand-synced lists produce silent failures (a "public" page hidden behind auth splash, or an auth-splash bypass). P-1: the corpus's whole thrust is one source, not synchronized copies.
2. *Treat the allowlist divergence as intentional (proxy and gate have different duties).* Rejected as the default: NQ-2 is resolved-by-decision toward "defect" because the divergence is undocumented and its failure modes are silent (W-20); if the owner later shows the difference is deliberate, the single source expresses it as explicit derivations (owner veto recorded, ADR-120) — but two free-floating lists are never the answer.
3. *Decide hosting now to unblock `SITE_URL`.* Rejected: Q-2/TD-14 — hosting is a product/ops decision outside the repo's knowledge; inventing a canonical URL would be a guess embedded in sitemap/robots/OG/share URLs. The honest position is Open, recorded.

**Trade-offs.** Collapsing the allowlist requires care that proxy (edge, redirect) and AuthGate (client, splash) genuinely can share one source — they gate different things, so the single source may need two explicit derived views (still one source of truth). Unifying `APP_ID` touches both deploy units. Leaving hosting Open means the localhost-fallback hazard persists until Q-2 is answered — recorded in the ledger, not silently.

**Consequences.** Adding a public route is a one-place change that both the edge and the gate honor (the silent SEO-broken / splash-bypass failure modes close). App and functions cannot split across tenant roots from a single mis-set env var. A new environment is stand-up-able from `.env.example` rather than by grepping source (mitigating the W-6 bus-factor amplifier). The hosting decision is visibly outstanding, not buried in a TODO.

**Success criteria.**
- One module exports the public-path allowlist; grep shows proxy and AuthGate both import it (no second hand-maintained list).
- `APP_ID` has one derivation shared by app and functions (grep: not two independent `?? "kana-nihongo-master"` literals).
- `.env.example` exists and lists the ~30 referenced env vars; the hosting decision (Q-2) is recorded as Open in the ledger with `SITE_URL`'s fallback flagged.

**Status.** Accepted (NQ-2 resolved-by-decision toward single-source); hosting Open (Q-2). **Priority.** P1.

---

## ADR-119 — Dead surfaces default to deletion, behind named gates

**Problem.** A verified stratum of built-but-unconsumed capability that a reader "cannot distinguish from live product without producer-tracing" (CX-7): 7 inactive `NotificationKind`s (zero producers), 8 never-emitted `ActivityAction`s + the producer-less `"cloud_function"` `LogSource`, three handler-less admin Quick Action buttons + a stub Settings page + the orphan `canChangeSettings` permission, the `fanOutNotifications` callable with zero in-repo callers, and the 1-story Storybook toolchain (8 packages) (W-8, W-10, TD-6/7/12, OP-8/9/10/13/14). The kana-practice logging gap is a *proven omission* (its quiz and survival siblings log completions; practice logs nothing — activity analytics undercount one of three modes) (W-8, RC-7, TD-6). Dead vocabulary is not free: every reader carries branches that can never fire, and each new contributor must determine per-member whether "no producer" means pending or abandoned (W-8).

**Context.** These are all delete-vs-complete branches, each gated on a product/author-intent question the repo cannot answer (CX-7, bucket 2): kinds → **Q-8**, logging vocabulary → **Q-11**, admin surfaces/`canChangeSettings` → **Q-13**, fan-out callable → **Q-6**, Storybook/scaffold → **Q-17**. Principle P-3 (delete before refactor) is derived from exactly this stratum (AD-19/CX-7). The kana-practice gap is the one item that is a bucket-1 omission, not an intent unknown — it is resolved by *filling* whichever direction its gate (Q-11) answers.

**Decision.** **Dead surfaces default to deletion, behind named gates** (P-3). Each dormant surface is **delete-unless-claimed**: it is removed unless the gating question confirms it is planned roadmap, in which case its completion step is scheduled. Specifically — dormant `NotificationKind`s (Q-8), `ActivityAction`s + `"cloud_function"` `LogSource` (Q-11), handler-less admin buttons + Settings stub + `canChangeSettings` (Q-13), the un-called `fanOutNotifications` callable (Q-6), the 1-story Storybook toolchain + scaffold SVGs (Q-17) — each defaults to deletion pending its answer. The **kana-practice logging gap is resolved in whichever direction Q-11 answers** (practice logs a completion like its siblings, or the `KANA_PRACTICE_COMPLETED` member is deleted) — not left asymmetric.

**Alternatives considered.**
1. *Keep all dormant surfaces as extension points (status quo).* Rejected: CX-7/W-8 — the cost is epistemic and compounding: every audit must producer-trace, "unconsumed capability is where drift accumulates unnoticed," and readers can't tell roadmap from residue; the kana-practice undercount "widens daily" (TD-6).
2. *Delete everything now without the gates.* Rejected: several items self-document as forward provisioning with a defined activation step (the fan-out callable, the inactive registry kinds — CX-7's "documented staging" flavor); deleting a genuinely-planned capability discards intended work. The gates distinguish the two flavors (documented staging vs undocumented aspiration) rather than guessing.
3. *Complete everything (wire the producers/handlers).* Rejected: symmetric error — building consumers for abandoned vocabulary is waste, and the corpus cannot confirm any of these are still planned; default-to-deletion with a claim escape hatch is the asymmetric bet P-3 encodes (deletion is reversible via git; carrying dead surface indefinitely is the corpus's documented cost).

**Trade-offs.** The delete/complete disposition for most items waits on intent answers (Q-6/8/11/13/17), so they sit in the ledger as delete-unless-claimed meanwhile — visible, not silently carried. Deleting a surface that is later wanted costs a git revert (cheap and reversible, which is why deletion is the default). The kana-practice fix is the one item that is unconditional work now (fill or remove the gap).

**Consequences.** The capability-ahead-of-consumer stratum stops growing and starts shrinking; readers can trust that a declared vocabulary member has a producer (or is scheduled). Admin operators stop seeing three buttons that silently do nothing (TD-7's trust defect). Activity analytics stop undercounting kana practice. Each surviving surface has a recorded reason to exist (a claimed gate); each deleted one is behavior-neutral (P-3).

**Success criteria.**
- Every dormant surface named above is either removed or has a claimed gate recorded in the ledger (Q-6/8/11/13/17) with an owner and completion step — none remains in undocumented limbo.
- The kana-practice logging asymmetry is gone: practice either logs a completion like quiz/survival, or `KANA_PRACTICE_COMPLETED` is deleted (grep: the three modes are symmetric).
- No declared enum member has zero producers without a ledger entry marking it claimed-roadmap; `canChangeSettings` is either required by an action or removed from the matrix.

**Status.** Accepted-conditional on Q-8, Q-11, Q-13, Q-6, Q-17. **Priority.** P2.

---

## ADR-120 — Every staged change records its completion state

**Problem.** Six of the twelve root causes (RC-2, RC-3, RC-5, RC-6, RC-7, RC-10) reduce to one meta-cause: "a migration or capability was staged with a defined later step, and the repository has no mechanism that records whether the later step happened or is still intended" — no migration ledger, no expiring TODOs, no roadmap references in code (RC cross-cutting observation, C16). The complexity analysis independently reaches the same closing taxonomy: the hardest-to-reason-about complexity is "staged work whose later steps have no recorded status" (CX-7, CX-9, CX closing note). The concrete symptoms are the notification migration frozen mid-flight (ADR-108), the unenforced schemas (ADR-109), the dormant vocabularies (ADR-119), the phantom analytics pipeline (ADR-114), and the out-of-band admin bootstrap (RC-10) — each a stage whose completion no artifact records.

**Context.** The repo demonstrably knows how to record decisions (ADRs 001–003 exist and are cross-referenced from code, S-20) and how to stage migrations well (the notification migration is "textbook staging: dual-write → backfill → retire", CX-1) — the missing piece is a completion-state record, adopted "only in July and only for three decisions" (RC closing). The kernel names this the **highest-leverage single decision** (P1). Principle P-4 (record completion state) *is* this meta-finding. Nearly the entire Q/NQ catalogue is, in effect, this cluster's resolution (C16): the open questions exist because completion state lives nowhere.

**Decision.** **Every staged change records its completion state.** Any migration, deprecation, or capability landed in stages must carry a **ledger entry** — intended end state, current stage, owner, and review-by date — kept in-repo (an ADR addendum or a dedicated migrations ledger). ADRs continue to record *decisions* (the 001–003 series persists; the docs index gap W-21/TD-13 is fixed so the index lists every ADR). The gated dispositions in this decision set (ADR-108's removal gate, ADR-109's per-schema Q-12 disposition, ADR-110's Drawer/NQ-3, ADR-114's Q-9 analytics, ADR-119's delete-unless-claimed gates, ADR-118's Open hosting) are the ledger's initial entries — each becomes a tracked row rather than an unrecorded assumption.

**Alternatives considered.**
1. *Status quo — inline comments and `@deprecated` markers.* Rejected: RC-3/CX-1 — comments "don't expire" and `@deprecated` markers "point at replacements but cannot be acted on, training readers to ignore deprecation notices"; the notification migration's retirement condition *is* written in a comment and has still frozen the transitional state permanently. Prose without a review-by date and owner is exactly what failed.
2. *Track completion state in an external tool (issue tracker, roadmap doc).* Rejected: the corpus's repeated finding is that out-of-repo state is unknowable to the code and to any future maintainer (every Q/NQ is an out-of-repo fact); a bus-factor-1 repo (W-6) needs the completion state *in the repo* where it survives contributor turnover — the same reason ADRs live in `docs/adr/`. (Judgment, grounded in W-6/C9.)
3. *Rely on ADRs alone (no separate ledger).* Rejected: ADRs record decisions at a point in time; a *staged* change needs mutable current-stage tracking (stage moved? backfill run? gate cleared?) that a static decision record doesn't carry. The ledger is the mutable companion to the immutable ADR.

**Trade-offs.** A ledger is a new artifact to maintain, and its value depends entirely on discipline — an unmaintained ledger is as misleading as a stale comment (the failure mode it exists to prevent). Review-by dates create a recurring obligation (someone must check them). For a single author (W-6) the discipline cost falls on one person — but that is also why the *record* matters most: it converts "every unknown into a permanent unknown" (W-6) into a tracked, hand-offable state.

**Consequences.** Staged work acquires an expiry and an owner: the notification migration (ADR-108), the schema dispositions (ADR-109), and the dead-surface gates (ADR-119) become closeable rather than permanently transitional. A future maintainer (or the sole author after time away) can answer "is this still intended?" from the repo. The C16 meta-pattern — the generator behind most of the corpus's bucket-2 mass — gets a structural fix, not per-instance patches. The docs ADR index becomes complete and trustworthy again.

**Success criteria.**
- A migrations ledger exists in-repo; every gated disposition in this ADR set (ADR-108/109/110/114/118/119) has a row with end state, current stage, owner, and review-by date.
- No `@deprecated` field or "reconcile later" comment exists without a corresponding ledger entry naming its removal condition (grep: deprecation markers cross-reference the ledger).
- The docs ADR index lists every ADR on disk (the missing-003 drift, W-21(d)/TD-13, is fixed); new staged work adds a ledger row as part of the change that lands it.

**Status.** Accepted. **Priority.** P1 — the highest-leverage single decision.
