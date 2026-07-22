# Cleanup Audit — Index

**Scope:** Evidence-based cleanup + legacy removal + folder-structure consolidation audit of `src/`, performed **after** the 63-task modernization program completed (50 done, 13 correctly gated). Analysis only — **no file was deleted, moved, or modified** by this audit.

**Date:** 2026-07-22 · **Baseline commit:** `4ce20cc` · **Authority for gated items:** [docs/migrations-ledger.md](../docs/migrations-ledger.md)

## Reading order

| Doc | Contents | Read when |
| --- | --- | --- |
| [01-Current-Structure.md](01-Current-Structure.md) | Inventory: top-level layout, per-feature trees, shared/lib/infra surfaces, migration-related files | Orienting |
| [02-Fallback-Audit.md](02-Fallback-Audit.md) | Every fallback implementation, classified with call-site evidence | Before touching any fallback |
| [03-Legacy-Code-Audit.md](03-Legacy-Code-Audit.md) | Legacy/migration leftovers: deprecated markers, compat shims, old shapes | Before deleting "old-looking" code |
| [04-Dead-Code-Audit.md](04-Dead-Code-Audit.md) | Zero-import files, unused exports, unused deps/env/i18n, unreachable branches | Before PR 1 |
| [05-Duplicate-Implementation-Audit.md](05-Duplicate-Implementation-Audit.md) | Same-responsibility implementations: what merges, what stays specialized | Before PR 4 |
| [06-Feature-Structure-Analysis.md](06-Feature-Structure-Analysis.md) | Per-feature internal shape, naming, boundaries, de-facto standard | Before PR 6 |
| [07-Shared-Code-Audit.md](07-Shared-Code-Audit.md) | shared/ + lib/ ownership: single-consumer items, dumping-ground check | Before PR 5 |
| [08-Target-Folder-Structure.md](08-Target-Folder-Structure.md) | The proposed standard + current→target tree | Planning moves |
| [09-File-Move-Map.md](09-File-Move-Map.md) | Every proposed move with import impact and risk | Executing moves |
| [10-Cleanup-Candidates.md](10-Cleanup-Candidates.md) | Master candidate list with final decision-gate classification | The single source of truth |
| [11-Cleanup-Priority.md](11-Cleanup-Priority.md) | P0–P4 prioritization | Sequencing |
| [12-PR-Cleanup-Plan.md](12-PR-Cleanup-Plan.md) | Small, reversible PR breakdown | Executing |
| [13-Risks-and-Unknowns.md](13-Risks-and-Unknowns.md) | What could go wrong; what this audit could not prove | Before approving |
| [14-Cleanup-Readiness.md](14-Cleanup-Readiness.md) | Final report: the 11 questions answered, go/no-go per PR | Decision |

## Ground rules this audit operated under

- Nothing was deleted/moved/changed during analysis.
- No deletion claim without usage evidence (grep command + hit count recorded).
- Zero static imports ≠ dead: dynamic imports, App Router conventions, `"use server"` form actions, config/script/test entry points, and Firebase functions were checked before any DELETE verdict.
- Items tracked as **gated** in the migrations ledger (Q-2, Q-4, Q-5, Q-6, Q-9, Q-10, Q-12, NQ-1; rows LDG-01…LDG-21) are **out of scope for deletion by definition**, regardless of usage counts — they carry `GATED` classification here and appear only so nobody "rediscovers" them as dead code.
- Folder moves are proposed only where they fix a real problem (mis-ownership, boundary leak, single-file directory, oversize directory) — never for symmetry.

## Final decision-gate vocabulary (used in 10/14)

`SAFE_TO_DELETE` · `SAFE_TO_MOVE` · `SAFE_TO_MERGE` · `NEEDS_MIGRATION` · `NEEDS_PRODUCT_DECISION` · `NEEDS_PRODUCTION_EVIDENCE` · `KEEP` · `UNKNOWN`

Only the first three may proceed without additional decisions.
