# Project Memory

**Read this before modifying the codebase.** Reconciles the planning corpus against the code as it actually is.

**Created:** 2026-08-04 · **Audited at:** commit `f4dd766` · **Method:** code-first — nothing marked done on a document's say-so.

## Read in this order

| # | Document | Answers |
|---|---|---|
| 1 | **[CURRENT_PROJECT_MEMORY.md](CURRENT_PROJECT_MEMORY.md)** | What is this codebase, right now? Architecture, patterns, invariants, debt, risks |
| 2 | **[DO_NOT_REPEAT.md](DO_NOT_REPEAT.md)** | What is already done or already decided? Read before proposing anything |
| 3 | **[REFACTORING_READINESS_REPORT.md](REFACTORING_READINESS_REPORT.md)** | Where are we, what's left, what to do next, in what order |
| 4 | **[BEFORE_CONTINUING.md](BEFORE_CONTINUING.md)** | The pre-flight checklist for any change |

Supporting evidence:

| Document | Contents |
|---|---|
| [IMPLEMENTED_BUT_NOT_DOCUMENTED.md](IMPLEMENTED_BUT_NOT_DOCUMENTED.md) | Work present in code that no plan records — 7 items |
| [DOCUMENTED_BUT_NOT_VERIFIED.md](DOCUMENTED_BUT_NOT_VERIFIED.md) | Claims the code contradicts, or that need validation — 10 items |

## The three facts that matter most

1. **`implementation-planning/09-Progress-Tracking.md` reports `Done: 0` for all 63 tasks. ~61 are complete.** It was pre-filled and never updated. It is the most misleading artifact in the repo.
2. **`docs/migrations-ledger.md` is the live state of record** — 22 rows, 8 closed, 14 open. It kept being updated after the planning corpus froze. Where they disagree, the ledger wins.
3. **Only 2 of 63 tasks are incomplete, both deliberately:** T-118b (BLOCKED — unifying `APP_ID` is a tenant repartition) and T-118d (OPEN — hosting is a decision, not a task).

## Authority order

This did not previously exist anywhere. It does now:

1. **The code** — what runs
2. **`docs/migrations-ledger.md`** — current staged-change state
3. **`docs/adr/`** + `architecture-decision/` — why it's built this way. **All 20 ADR-1xx and all 3 `docs/adr/00X` remain in force**; none is superseded
4. **`architecture-assessment/` · `project-discovery/` · `implementation-planning/` · `execution-readiness/`** — **sealed historical records** of a completed program. Reliable on rationale, unreliable on completion state and file paths. Each now carries a dated supersession banner on its `00-INDEX.md`

## Document classes

| Class | Where | Treat as |
|---|---|---|
| **Current state** | `project-memory/` | Authoritative. Start here |
| **Live operational** | `docs/` — ledger, 3 ADRs, notification runbook | Authoritative, actively maintained |
| **Live decisions** | `architecture-decision/` — ADR-101…120 | In force. Note ADR-101's Amendment 1 |
| **Sealed history** | the 4 phase corpora above | Provenance only. Do not navigate by their paths |

## Scope note

This audit **did not refactor anything**. One production defect was found and fixed because it was breaking CI on `main`: `src/scripts/check-vocabulary-agreement.mjs` referenced a file path that an earlier cleanup commit had moved, crashing the blocking `check:vocab` step. That fix is the only source change.
