# Project Memory

**Read this before modifying the codebase.** What the code is right now — not what any plan
intended.

**Verified:** 2026-08-09, against `e629c25`, by direct code inspection plus a full run of all
five test suites.

## Read in this order

| # | Document | Answers |
|---|---|---|
| 1 | **[CURRENT_PROJECT_MEMORY.md](CURRENT_PROJECT_MEMORY.md)** | What is this codebase? Architecture, patterns, invariants, debt, risks |
| 2 | **[DO_NOT_REPEAT.md](DO_NOT_REPEAT.md)** | What is already done or already decided? Read before proposing anything |
| 3 | **[BEFORE_CONTINUING.md](BEFORE_CONTINUING.md)** | The pre-flight checklist for any change |

## Authority order

1. **The code** — what runs
2. **[`docs/migrations-ledger.md`](../docs/migrations-ledger.md)** — current staged-change state,
   and the home of the still-open questions
3. **[`docs/adr/`](../docs/README.md)** — why it is built this way. Both series (001–003 and
   101–120) are in force; none is superseded
4. **This directory** — the reconciliation between the three above

## Scope note

This is a *small* set on purpose. Three earlier documents here
(`DOCUMENTED_BUT_NOT_VERIFIED`, `IMPLEMENTED_BUT_NOT_DOCUMENTED`,
`REFACTORING_READINESS_REPORT`) existed only to reconcile a planning corpus against the code.
That corpus was deleted on 2026-08-09, so those three documents were deleted with it — a
reconciliation of files that no longer exist is not knowledge, it is noise. Anything from them
that described the *code* rather than the *corpus* was folded into
`CURRENT_PROJECT_MEMORY.md`.
