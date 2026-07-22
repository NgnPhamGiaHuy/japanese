# 14 — Cleanup Readiness (final report)

## The 11 questions, answered

**1. How many files can be safely deleted?**
**One** (`features/admin/components/content/index.ts`), plus 4 dead symbols, 1 empty directory, ~20 barrel-export lines, and 2 stale comments. That's the whole hard-delete surface of ~600 source files — the modernization program already removed the dead mass (Storybook, 7 notification kinds, 8 activity actions, inert admin controls, Drawer, superseded action clients), and this audit independently confirms almost nothing grew back.

**2. How many fallbacks are obsolete?**
**Zero.** 28 fallback constructs inventoried: 19 load-bearing runtime resilience, 7 ledger-gated, 2 test-only. None removable (doc 02).

**3. How many legacy implementations remain?**
**22 items in 3 clusters** — notifications migration (4, gated Q-5/NQ-1), flashcard legacy-doc compat (7, **newly discovered as untracked**; proposed ledger row LDG-22), individually-justified keeps (11, incl. gated). **Zero removable today** (doc 03).

**4. How many duplicate implementations exist?**
**3 accidental merge-ready groups** (relative-time copied verbatim, admin date formatting split two ways, inline `toActionResult` copy) + 1 spinner pair + 4 judgment calls (best: `subscribeLessonProgress`, closing the audit's only 2 boundary leaks). 6 suspected pairs verified intentional (doc 05).

**5. How many files should move from shared → feature?**
**12 firm** + 2 per-export splits. `shared/` goes 52 → ~38 files; `shared/schemas/` shrinks to one module; single-feature items in shared drop 15 → ≤3 recorded exceptions (doc 07).

**6. Which features have the most problematic folder structures?**
None are problematic. Ranked by residual debt: **notifications** (its inbox screen lives in `app/` — the one real T-105b breach), **admin** (20-file `components/shared/` grab-bag; inconsistent sub-barrels), **kana** (nits: non-hook in `hooks/`, single-file dirs). `game` is exemplary; `flashcard`'s ADR-104 structure held at 166 files (doc 06).

**7. What should the standard feature structure be?**
The one the codebase already converged on — codified descriptively in doc 08: curated `index.ts` barrel (9/9 today), `hooks/ services/ components/ domain/ types/ actions/` as needed, sub-modules with own barrels only at flashcard/kana scale, two-tier types convention, **no folder without ≥2 files, no symmetry for its own sake**. Small features stay flat.

**8. What is the safest cleanup order?**
PR 1 (dead code) → PR 2 (ledger docs, any time) → PR 4/4b (consolidations) → PR 5a-c (shared→feature) → PR 6a-d (route extractions) → PR 7 (in-feature tidy) → PR 8 (barrel/dep trims). Constraints: 4b before 5b; A13+M1 atomic; nothing structural mixed into P1 (docs 11–12).

**9. What cleanup can be completed immediately?**
PR 1 and PR 2 today, zero decisions needed. PR 4/4b/5/7 after review of this audit — all evidence-verified, behavior-preserving. That's ~85% of the actionable volume.

**10. What cleanup requires a product or production decision?**
**Product (6):** coverage devDep, action-registry quartet, UserAvatar home, route-registry coupling, barrel-trim policy, `makeCard` fixture. **Production evidence (2 clusters):** every ledger-gated item (Q-2/4/5/6/9/10/12, NQ-1), and the flashcard compat cluster awaiting a backfill that doesn't exist (doc 10).

**11. What cleanup should NOT be done?**
Deleting any fallback (all load-bearing or gated) · touching gated surfaces on usage-count evidence (`getCallerContext` looks dead; it's the Q-10 predicate) · promoting `game`'s kit to `shared/` (documented platform-feature design) · merging the two virtual lists, two rbac files, two pagination mechanisms, or parallel game-mode routers (all verified intentional) · moving Modal/Textarea out of the primitive family · flattening kana's single-file sub-module dirs (convention consistency) · inventing features for the settings/profile screens · any i18n key deletion (namespace-level liveness only) (docs 02/03/05/06/13).

## Go/No-Go per PR

| PR | Verdict | Gate |
| --- | --- | --- |
| 1 dead code | ✅ **GO** | none |
| 2 ledger docs | ✅ **GO** | none (owner reviews LDG-22 wording) |
| 3 legacy removal | ⛔ **NO-GO by finding** | empty — nothing removable |
| 4/4b consolidation | ✅ GO after audit review | M3 string-literal pre-grep; 4b listener care |
| 5a-c shared→feature | ✅ GO after audit review | A6/A7 byte-identical + ledger-path rule |
| 6a-c route extraction | ✅ GO after audit review | relocation-only rule; E2E nets |
| 6d duplicateLesson | ⚠️ GO **only after** its emu test exists | test-first |
| 7 tidy | ✅ GO after audit review | none |
| 8 trims | ⚠️ GO after P5 policy answer | owner's barrel-API stance |
| N3/N4 UI migrations | ⏸️ owner opt-in | behavior changes, outside cleanup rules |

## Bottom line

This codebase does not need a cleanup program — it needs **one small PR train** (≈8 lightweight PRs, mostly moves) and **one documentation act** (ledger row LDG-22). The audit's strongest finding is negative and high-confidence: after 63 modernization tasks, the remaining "old-looking" code is almost entirely *deliberate*, gated, and correctly kept — and now it's all written down, so nobody has to rediscover that the hard way.

*Analysis complete. Nothing was deleted, moved, or modified in `src/` during this audit. Implementation awaits explicit approval per PR.*
