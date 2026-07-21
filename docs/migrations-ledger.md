# Migrations ledger

**Location:** `docs/migrations-ledger.md` (this file). **Authority:** [ADR-120](../architecture-decision/03-Architecture-Decisions.md) — _every staged change records its completion state_.

## Why this file exists

A **staged change** is one that lands in more than one step: a migration, a deprecation, or a capability shipped before its consumers. The repository has historically staged such work well and then lost track of it — six of the twelve root causes in the architecture assessment reduce to the same meta-cause, _"a migration or capability was staged with a defined later step, and the repository has no mechanism that records whether the later step happened or is still intended."_

The failure is not that stages exist. It is that a half-finished stage and a deliberately-final state look identical in the code. A reader — including the original author after time away — cannot tell whether a transitional shape is still intended.

Comments do not solve this: they do not expire, carry no owner, and cannot be reviewed on a date. A `@deprecated` marker says _what_ replaced something, never _whether anyone still intends to finish the replacement_. This ledger records exactly the part the code cannot.

ADRs remain the record of **decisions** (`docs/adr/`). This ledger is their mutable companion: an ADR says what was decided, a ledger row says how far that decision has actually got.

## Row schema

Every row carries **four mandatory fields**:

| Field                  | Meaning                                                                                                                      | Answers                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Intended end state** | The shape the codebase is meant to reach when this change is finished. Written as an observable condition, not an intention. | _"What does done look like?"_               |
| **Current stage**      | Where the change actually is now, from the stages named in the row's own plan.                                               | _"How far did we get?"_                     |
| **Owner**              | A **named person** — never a role, a team, or "unassigned".                                                                  | _"Who decides the next step?"_              |
| **Review-by**          | A date or a named sprint by which the row is revisited.                                                                      | _"When does the silence become a problem?"_ |

> **A row missing any of these four fields is invalid.** It is not a draft, not a placeholder, and not "to be filled in later" — an incomplete row recreates precisely the untracked state this ledger exists to eliminate, while giving the false impression that the work is tracked. Either the four fields can be stated, or the change is not ready to land in stages.

Two optional fields may be added when they apply: **Gate** (the open question that must be answered before the next stage — e.g. `Q-5`), and **Closes** (what the row's completion allows to be deleted or retired).

## The entry-creation obligation

> **Landing a staged change adds its ledger row in the same change.** Not in a follow-up commit, not in the next sprint.

A row added later is written from memory, after the context is gone — which is how the original problem arose. If a pull request leaves the codebase in a state that is not the intended end state, that pull request carries the row explaining it.

The same obligation applies in reverse: **reaching the intended end state closes the row** in the change that reaches it. Rows are closed by moving them to [Closed rows](#closed-rows) with the date and the commit that finished them — never by silent deletion, because the record of _how long a stage took_ is itself worth keeping.

Forward-provisioning — shipping a capability before it has a consumer — is a staged change and needs a row (coding standard CS-3).

## Worked example

The following is an **illustration of the format only**. It is not a tracked row and describes no real work in this repository.

| ID        | Change                                                 | Intended end state                                                                                 | Current stage                                                                                              | Owner    | Review-by | Gate                                                         |
| --------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------ |
| `LDG-000` | _(example)_ Replace the legacy `foo` reader with `bar` | No call site reads `foo`; the `foo` module is deleted and its Firestore field is no longer written | Dual-read shipped: `bar` is authoritative, `foo` retained as fallback for documents written before 2026-07 | Jane Doe | Sprint 9  | `Q-00` — do pre-2026-07 documents still exist in production? |

Read that row as a sentence: _the end state is one reader; we are at two; Jane decides; if nothing has changed by Sprint 9 someone asks why; and the thing preventing the last step is a fact about production data nobody has checked._ A row that cannot be read that way is not finished.

## Rows

17 open rows, grouped by the decision that governs them. Owner for every row is **NgnPhamGiaHuy**, who holds all three answering roles (product intent, GCP/ops console, hosting) — recorded in the Sprint 0 completion record. Review-by follows the wave in which each gate first bites: Wave 1 → Sprint 5, Wave 3 → Sprint 9, Wave 4 → Sprint 14, Wave 5 → Sprint 19, Wave 6 → Sprint 26.

Every stage claim below was verified against the working tree at `f3951e8`, not inherited from the planning documents — a row that misstates its stage is worse than no row at all.

### Notification migration (ADR-108)

| ID       | Change                           | Intended end state                                                                                                               | Current stage                                                                                                                                                                                  | Owner         | Review-by | Gate           |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------- | -------------- |
| `LDG-01` | Retire the legacy document shape | No document is read through `isUnread()`'s legacy branch; the four `@deprecated` fields are deleted; the legacy index is dropped | **Dual-read shipped and frozen.** `deckId`, `deckTitle`, `link`, `read` all live (`features/notifications/types/index.ts:71-81`); `isUnread()` still branches on the legacy shape (`:104-109`) | NgnPhamGiaHuy | Sprint 19 | `Q-5` + `NQ-1` |
| `LDG-02` | Reconcile the type vocabulary    | `NotificationType` describes exactly the set of values writers actually write                                                    | **Drifted, target unrecorded.** The union declares 4 values; writers emit 10 (incl. `digest`). `domain/events.ts:14` says the two "are reconciled as producers migrate" and names no end state | NgnPhamGiaHuy | Sprint 19 | `Q-7`          |

`LDG-01` is the template row ADR-120 calls for: it names its gate, and its stage is a fact about the code rather than an intention. Its two gates are distinct — `Q-5` asks what shape production data is actually in, `NQ-1` asks whether the supporting index/rules deploy the runbook flags as _"NOT yet deployed"_ has since happened. Neither is answerable from the repository.

### Schema enforcement (ADR-109)

| ID       | Change                          | Intended end state                                                        | Current stage                                                                                                             | Owner         | Review-by | Gate   |
| -------- | ------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------- | --------- | ------ |
| `LDG-03` | `cardContentSchema` disposition | Enforced at the card write boundary, or deleted — not declared and unused | **Declared, zero non-test consumers** (verified by grep); its header claims it is "the single validation source of truth" | NgnPhamGiaHuy | Sprint 14 | `Q-12` |
| `LDG-04` | `privacyModeSchema` disposition | Enforced at its write boundary, or deleted                                | **Declared, zero non-test consumers** (verified by grep)                                                                  | NgnPhamGiaHuy | Sprint 14 | `Q-12` |
| `LDG-05` | `publicRoleSchema` disposition  | Enforced at its write boundary, or deleted                                | **Declared, zero non-test consumers** (verified by grep)                                                                  | NgnPhamGiaHuy | Sprint 14 | `Q-12` |

### Dialog primitive (ADR-110)

| ID       | Change               | Intended end state                                                                 | Current stage                                                                                                                                                                                | Owner         | Review-by | Gate                                                 |
| -------- | -------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------- | ---------------------------------------------------- |
| `LDG-06` | `Drawer` disposition | `Drawer` is deleted, or adopted by the two bespoke slide-panels that exist instead | **Shipped with zero render sites.** Both `<Drawer` matches in the tree are inside its own definition — a type annotation and a doc-comment example (`shared/components/ui/Drawer.tsx:21,35`) | NgnPhamGiaHuy | Sprint 26 | `NQ-3` (default: **delete**; owner veto window open) |

### Analytics pipeline (ADR-114)

| ID       | Change                                        | Intended end state                                                                                                       | Current stage                                                                                                                                                                | Owner         | Review-by | Gate  |
| -------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------- | ----- |
| `LDG-07` | `analytics_daily` + `metadata/counters` reads | Both collections have a real writer, or their read paths are removed and every surface renders absent data **as absent** | **Read by admin, written by nothing in-repo.** The dashboard substitutes zeros and the CSV export synthesizes hardcoded-zero rows, both indistinguishable from measured data | NgnPhamGiaHuy | Sprint 9  | `Q-9` |

### Configuration and hosting (ADR-118)

| ID       | Change                               | Intended end state                                                      | Current stage                                                                                                                                                                                                                                                 | Owner         | Review-by | Gate  |
| -------- | ------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------- | ----- |
| `LDG-08` | Canonical deployment origin          | A production origin is recorded as an ADR and `SITE_URL` resolves to it | **OPEN — no decision exists.** `SITE_URL` falls back to `http://localhost:3000` (`src/lib/site.ts:5`), and that fallback silently feeds sitemap, robots, `metadataBase`, OG images and every share URL. **Standing hazard: nothing errors when it is wrong.** | NgnPhamGiaHuy | Sprint 5  | `Q-2` |
| `LDG-09` | One `APP_ID` derivation (**T-118b**) | One derivation consumed by both the app and the functions package       | **BLOCKED, not started.** Satisfying it _is_ a tenant repartition if the two production env vars disagree: reads and writes move to a different `artifacts/{APP_ID}` root, nothing errors, and no code revert reunites the data                               | NgnPhamGiaHuy | Sprint 5  | `Q-6` |

### Dead surfaces (ADR-119)

| ID       | Change                                                     | Intended end state                                                                                            | Current stage                                                                                                                       | Owner         | Review-by | Gate   |
| -------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------- | ------ |
| `LDG-10` | 7 dormant `NotificationKind`s                              | Each kind has a producer, or is deleted from the registry and its schema                                      | **Declared with zero producers** — 7 of 16 kinds; the registry, emit schema, collapse logic and rendering all carry weight for them | NgnPhamGiaHuy | Sprint 19 | `Q-8`  |
| `LDG-11` | 8 dormant `ActivityAction`s + `cloud_function` `LogSource` | Each is emitted somewhere, or deleted — including a decision on the kana-practice logging gap                 | **Declared with zero emitters.** Kana practice completes without logging while its quiz/survival siblings log                       | NgnPhamGiaHuy | Sprint 19 | `Q-11` |
| `LDG-12` | Inert admin controls                                       | Each control is wired, or removed — including the Settings stub and the orphan `canChangeSettings` permission | **Shipped and inert.** Three Quick Action buttons have no handler; the permission is granted to no surface                          | NgnPhamGiaHuy | Sprint 19 | `Q-13` |
| `LDG-13` | `fanOutNotifications` callable                             | Wired into a request path, or deleted from the functions package                                              | **Deployed-but-untriggered by its own docblock.** No in-repo caller exists                                                          | NgnPhamGiaHuy | Sprint 19 | `Q-6`  |
| `LDG-14` | Storybook toolchain                                        | Adopted with stories that justify it, or removed with its 8 devDependencies and unreferenced scaffold SVGs    | **8 devDependencies supporting 1 story file**                                                                                       | NgnPhamGiaHuy | Sprint 19 | `Q-17` |

### Admin authority (ADR-115)

| ID       | Change                           | Intended end state                                                                   | Current stage                                                                                                                                                              | Owner         | Review-by | Gate   |
| -------- | -------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------- | ------ |
| `LDG-15` | Align admin-authority predicates | One predicate answers "is this user an admin", consulted by app, rules and functions | **Three divergent predicates.** The app server, the Firestore rules' `isSystemAdmin` (existence-only), and the functions-side check disagree on what constitutes authority | NgnPhamGiaHuy | Sprint 14 | `Q-10` |

### Landed in stages without a row (backfilled)

| ID       | Change                           | Intended end state                                                       | Current stage                                                                                                           | Owner         | Review-by | Gate                                                       |
| -------- | -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------- | --------- | ---------------------------------------------------------- |
| `LDG-16` | Lint ratchet baseline (Sprint 0) | The baseline list is empty and every error-level rule applies everywhere | **12 files pinned to `warn`** in `src/eslint.config.mjs` so CI lint could become blocking without fixing unrelated code | NgnPhamGiaHuy | Sprint 14 | None — owner-driven; entries retire with T-116a and T-109a |

`LDG-16` is this ledger's own first test case. It was landed in Sprint 0, one commit before the ledger existed, and would otherwise have become exactly the kind of untracked staged state the ledger exists to prevent.

### Boundary migration (in progress)

| ID       | Change                                                 | Intended end state                                                                                                                                                    | Current stage                                                                                                                                                                                                                                                                                                                                                                                                | Owner         | Review-by | Gate                                       |
| -------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | --------- | ------------------------------------------ |
| `LDG-17` | Route cross-feature imports through barrels (T-101b/c) | No cross-feature import reaches a path deeper than `@/features/<f>` or `@/features/<f>/server`; the boundary lint rule is `error` with only the enumerated exceptions | **Migration complete; lint rule not yet enabled.** T-101b retried successfully: 152 statements + 4 inline refs across 89 files migrated, production build green. Zero cross-boundary imports deeper than the two sanctioned entry points remain. **Remaining:** T-101c must add and enable the ESLint rule before this row closes — until then the boundary is migration-clean but not mechanically enforced | NgnPhamGiaHuy | Sprint 6  | None — T-101c is the next task in sequence |

`LDG-17` records a dependency the plan did not have: T-101b could not complete until T-102a/b removed the `notifications → flashcard` back-edge, and ADR-101 Amendment 1 (two entry points per feature) was required to fix the three other failures found in the first attempt. Both are done. The row stays open because its own stated end state bundles the lint rule, which is separate work (T-101c).

## Code markers cross-reference

Every deprecation marker and "reconcile later" comment in the tree maps to a row that names its removal condition. This list is the check ADR-120 asks for; if a new marker appears without a row, the check fails.

| Marker                                               | Location                                            | Row      |
| ---------------------------------------------------- | --------------------------------------------------- | -------- |
| `@deprecated deckId` · `deckTitle` · `link` · `read` | `features/notifications/types/index.ts:71,73,75,78` | `LDG-01` |
| `isUnread()` legacy fallback branch                  | `features/notifications/types/index.ts:104-109`     | `LDG-01` |
| _"the two are reconciled as producers migrate"_      | `features/notifications/domain/events.ts:14`        | `LDG-02` |

## Closed rows

_None yet._

| ID  | Change | Closed | Commit | Notes |
| --- | ------ | ------ | ------ | ----- |
| —   | —      | —      | —      | —     |
