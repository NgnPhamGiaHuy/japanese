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

_No rows yet. Backfilling the ledger with the program's in-flight staged work — the notification migration, the gated schema dispositions, the dead-surface gates, and the open hosting decision — is **T-120b**, the next task in Sprint 1._

| ID  | Change | Intended end state | Current stage | Owner | Review-by | Gate |
| --- | ------ | ------------------ | ------------- | ----- | --------- | ---- |
| —   | —      | —                  | —             | —     | —         | —    |

## Closed rows

_None yet._

| ID  | Change | Closed | Commit | Notes |
| --- | ------ | ------ | ------ | ----- |
| —   | —      | —      | —      | —     |
