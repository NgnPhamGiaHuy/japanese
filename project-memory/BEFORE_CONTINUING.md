# Before Continuing Development

Run this checklist before implementing any feature, bug fix, or refactor in this repo.

**Why it exists:** this codebase completed a 63-task modernization program plus a structural cleanup program. Most "obvious" improvements have already been made, several were made *and then deliberately reverted*, and the planning documents still describe zero of it as done. Skipping this checklist reliably produces duplicate or contradictory work.

---

## Context

- [ ] Read `project-memory/CURRENT_PROJECT_MEMORY.md`
- [ ] Read `project-memory/DO_NOT_REPEAT.md` — check whether your area is already settled
- [ ] Read `docs/migrations-ledger.md` — **the live state of record**, more current than any plan
- [ ] Check `docs/adr/` (3 files, `00X` series) **and** `architecture-decision/03-Architecture-Decisions.md` (ADR-101…120)
- [ ] Check `project-memory/REFACTORING_READINESS_REPORT.md` §9 for current priorities

⚠ **Do not treat `implementation-planning/09-Progress-Tracking.md` as current.** Its roll-up reads `Done: 0` for all 63 tasks; ~61 are in fact complete.

## Existing implementation

- [ ] Locate the current implementation — **by searching the code, not by following paths in planning docs** (many are stale after the cleanup program)
- [ ] Locate related hooks (`features/<f>/hooks/`)
- [ ] Locate related services (`features/<f>/services/`) — **all Firestore I/O is here**
- [ ] Locate related server actions (`features/<f>/actions/`, `"use server"`)
- [ ] Locate related domain logic (`features/<f>/domain/` — pure, no React/Firebase)
- [ ] Locate related components and their sub-module barrel
- [ ] Locate tests across all five tiers (`.test.ts`, `.browser.test.tsx`, `.emu.test.ts`, `e2e/*.spec.ts`, `firestore-rules.test.ts`)

## Plan reconciliation

- [ ] Confirm the work is not already implemented → search `git log --oneline | grep -i "<keyword>"`
- [ ] Confirm it is not already **partially** implemented behind a gate → search the ledger
- [ ] Confirm it is not obsolete or already **deliberately deferred** (TD-3's 200-line ceiling, NQ-7/NQ-8, T-118b)
- [ ] Confirm no newer ADR supersedes it — note ADR-101 **Amendment 1** is not marked in the master table
- [ ] Confirm you are not about to restore something already reverted (**barrels were removed in June, re-adopted and lint-enforced in July**)

## Impact analysis

- [ ] Identify affected features and whether you cross a **lint-enforced boundary** (`import/no-restricted-paths` is at `error`)
- [ ] Confirm you are not opening a Firestore listener outside `services/` — all 12 current `onSnapshot` sites are in services, and that invariant is load-bearing
- [ ] Identify permission implications — deck RBAC (`resolveRole()`) and admin authority are **separate engines by decision**
- [ ] Identify Cloud Functions implications (`src/functions/` is a separate package with its own CI job)
- [ ] **If you move or rename a file:** check `src/scripts/check-vocabulary-agreement.mjs`, which hardcodes source paths and is a **blocking CI step**. It now fails loudly with a named-file message and has a disk-resolution test (fixed 2026-08-04, R-1) instead of crashing with a raw ENOENT — but still update the path proactively rather than relying on the guard to catch it

## Before coding

- [ ] State the current implementation (file:line)
- [ ] State the intended change
- [ ] State why it is still needed — cite the ledger row, ADR, or a code problem
- [ ] State affected files
- [ ] State dependencies and ordering constraints
- [ ] State the validation plan — which of the six gates below you will run

## Validation gates (the real definition of green)

Run from `src/`. Firebase env: `export $(grep "^NEXT_PUBLIC_FIREBASE" .env | xargs)`

```bash
npm run build          # includes full-tree typecheck
npx eslint .           # baseline: 101 warnings, 0 errors (shrink-only ratchet)
npm run check:vocab    # BLOCKING in CI — often forgotten
npm test -- --run      # 375 unit tests
npm run test:browser -- --run   # 84 tests / 20 files
npm run test:emu       # 133 tests / 18 files — needs JDK 21:
                       # JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
```

- [ ] All six pass. **`check:vocab` is easy to miss and is CI-blocking** — a moved file silently broke it once
- [ ] Lint warning count did not increase above 102
- [ ] If a component changed, verify visually in the browser — don't ask a human to check what you can check

## After coding

- [ ] **If you advanced a staged change, move its ledger row in the same commit** (ADR-120; a staged change landing without its row moving is a review defect)
- [ ] **If you created staged work** (a `@deprecated` marker, a "later step", a conditional path), add a ledger row **now**, not later
- [ ] Update `project-memory/CURRENT_PROJECT_MEMORY.md` if architecture or patterns changed
- [ ] Add to `project-memory/DO_NOT_REPEAT.md` if you settled a decision or rejected an approach
- [ ] Record new architecture decisions as an ADR — `docs/adr/` for the `00X` series, or amend `architecture-decision/03-Architecture-Decisions.md` for the `1xx` series

---

## Hard stops — do not do these without an explicit owner decision

| Action | Why |
|---|---|
| Unify `NEXT_PUBLIC_APP_ID` / `NOTIFICATIONS_APP_ID` (T-118b) | **Is a tenant repartition** if production values differ. Silent, non-revertible. Ledger LDG-09 = BLOCKED |
| Collapse the notification dual read path (T-108d) | Would *"silently hide pre-migration notifications from users"*. Inaction fallback, gated on Q-5 |
| Align the 3 admin-authority predicates (T-115c) | Aligning to the wrong source could lock out all admins or over-grant. Inaction fallback, gated on Q-10 |
| Delete the `@deprecated` notification fields (T-108c) | Gated on Q-5 — legacy data presence is unknown |
| Verify/complete the index+rules deploy (T-108b) | Gated on NQ-1 — deploy state unknowable from the repo |
| Delete any fallback | A full audit of 28 fallbacks found **zero** obsolete |
| Remove `toActionResult` | Survives by design (LDG-21) — 19 admin actions need its envelope |
| Merge the two RBAC engines | ADR-115 affirms them as two domains |

## A note on `.rules/`

`.rules/` contains ~95 files with **no stated authority order** and **no `CLAUDE.md` to load them**. Roughly a quarter target frameworks this repo does not use (a SvelteKit pack, a styled-components pack), and one vendored rule marks barrel files `impact: CRITICAL` — the exact opposite of what this repo enforces at `error` severity.

**Trust, in order:** the code → `.claude/skills/design-system/` (written from this codebase, cites real files) → `.rules/ai-rules/*.rule.md` (first-party) → everything else in `.rules/` (vendored, largely inapplicable).
