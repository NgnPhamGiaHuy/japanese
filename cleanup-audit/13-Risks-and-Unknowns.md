# 13 — Risks and Unknowns

## 1. What this audit could not prove

| # | Unknown | Impact on the plan |
| --- | --- | --- |
| U1 | **Production data shapes** (lessons/cards without `ownerId`/`roles`/fractional order; notification docs in the legacy shape) | Blocks all of doc 03's compat removal — already handled by classifying it NEEDS_PRODUCTION_EVIDENCE and proposing ledger row LDG-22 rather than any deletion |
| U2 | **i18n key-level usage** — dynamic `t(\`level.${x}\`)` construction makes per-key liveness undecidable statically | Audit stopped at namespace level (all 33 live). No key was flagged for deletion; none should be without runtime telemetry |
| U3 | **Ad-hoc developer workflows** — `vitest run --coverage`, manual barrel-import habits, external tools importing barrels | Drives P1 (`@vitest/coverage-v8`) and P5 (barrel-trim policy) being owner questions, not unilateral deletions |
| U4 | **Intent of very recent APIs** (`action-registry` quartet — 3 sprints old) | Held as NEEDS_PRODUCT_DECISION; usage snapshots are a bad judge of fresh deliberate design |
| U5 | **Whether `next build`'s tree-shaking depends on any current barrel shape** | Barrel trims (D7) are lint/build-verified per PR; if a trim ever changes bundle behavior the PR's build step surfaces it |

## 2. Execution risks and their controls

| # | Risk | Control |
| --- | --- | --- |
| R1 | A "move" silently edits gated/compat content (A6 reorder, A7 lesson.schema) | Byte-identical rule (doc 09 §rules); reviewer diff-check named in the PR plan; ledger path updates in the same commit so the gate record never dangles |
| R2 | Barrel trims break an import path the graph missed (dynamic import, string ref) | The graph already resolved dynamic imports; belt-and-braces: every PR runs full `next build` (whole-tree typecheck) via the pre-commit hook — a missed consumer fails the commit, not production |
| R3 | Screenshot-test churn when browser-tested components move (A1/A3) | Re-baseline in the same PR; `__screenshots__` are gitignored artifacts, so this is local-only |
| R4 | Route-layer extractions (B1/B2) alter behavior unnoticed | B1/B2 are relocation-only by rule; nets: browser tests, E2E `auth.spec.ts` for login, plus the interactive verification pattern this repo already uses |
| R5 | `duplicateLesson` (N1) regresses the untested save path | Hard-gated in the plan: emu test written **before** the move |
| R6 | M3 changes the `"invalid-input"` error string consumers may match on | Pre-flight grep for the literal is written into PR 4's notes |
| R7 | Two sessions/tools racing on `docs/migrations-ledger.md` (PR 2 vs gate work) | Ledger edits are append/amend-only, one PR, small diff |
| R8 | ESLint zone config drifts when files move between zones | The zones target directories, and shared→feature moves put files *inside* their consumers' zone (direction-safe by construction); the lint run in every PR is the check. The audit found the home-feature **test-file deep imports** (doc 06) — fix by exporting types from barrels, not by loosening zones |
| R9 | Cumulative churn conflicts with in-flight gated work (e.g. owner answers Q-12 mid-cleanup and edits `lesson.schema.ts` at its old path) | PR 5b lands the move + ledger path update atomically; after that, the ledger points at the new path — the gate owner's entry point stays correct |

## 3. Deliberately unresolved (and why that's correct)

- **PR 3 is empty.** Legacy implementations are all gated or backfill-blocked. Any pressure to "find something to delete" there should be resisted — the honest result of the modernization is that legacy removal is now an *operations* problem (run backfills, answer gates), not a code problem.
- **No P0 exists.** If a future reviewer believes a security-risk cleanup item exists, it belongs in the ledger/backlog process (like T-115c's gated predicates), not in this cleanup stream.
- **N3/N4 change behavior** (survival results screen adoption, SharePrivacyPicker a11y migration) and sit outside the "cleanup must not change behavior" rule — scheduled only by explicit owner choice.
- **The `cleanup-audit/` directory itself** is untracked. Committing it is the owner's call (it references file:line evidence that will drift as PRs land — commit at a tagged baseline or regenerate).
