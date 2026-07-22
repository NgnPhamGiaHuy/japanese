# 11 — Cleanup Priority

| Priority | Definition | Contents | Volume |
| --- | --- | --- | --- |
| **P0 — Security / correctness risk** | Must fix before anything else | **Empty.** The audit found no security-risk cleanup items. The nearest candidates are correctness-adjacent, not risks: M1 (comments' relative-time doesn't tick — cosmetic staleness), M2 (admin date locale inconsistency — cosmetic). The security-relevant legacy guards (L6 `publicRole:"editor"`, gated admin predicates) are explicitly **kept** | 0 |
| **P1 — Clearly dead or obsolete** | Zero-consumer, evidence-verified | D1 (redundant barrel file) · D2 (`getComments`) · D3 (`AIGenerateMode`) · D4 (2 test helpers) · D5 (empty dir) · D6 (2 stale comments/docblocks) | 1 file, 4 symbols, 1 dir, 2 comments |
| **P2 — Safe consolidation** | Merges/trims with no behavior change (one deliberate exception) | M1–M4 (relative-time, admin date, toActionResult inline, spinners) · D7 barrel trims (after P5 policy nod) · N2 (`subscribeLessonProgress` — the highest-value item in the whole audit: closes the only 2 boundary leaks found) | ~10 small changes |
| **P3 — Folder restructuring** | Moves; import-path churn, no behavior change | Group A (shared→feature, 12+2) · Group B1–B3 (route logic→feature) · Group C1–C5 (in-feature tidy) · N1 (duplicateLesson, test-first) — plus the two documentation actions: new ledger row LDG-22 (flashcard compat cluster), LDG-01 narrowing note | ~25 moves |
| **P4 — Cosmetic** | Naming, doc headers, dead type exports, dep placement | The tail from doc 10 §P4 + N3/N4 if the owner wants them (UI-behavior changes, schedule consciously) | opportunistic |

## Ordering rationale

1. **P1 before P3**: deleting D1 first means Group C's admin barrel work never touches a dead file.
2. **P2's N2 before P3's flashcard moves**: `subscribeLessonProgress` changes `progress.service.ts`'s export surface; land it before A5/A6 move files around it.
3. **P3 Group A before Group B**: shared→feature moves shrink `shared/` first, so the route-layer extractions (B) land against the final import geography.
4. **A13 (useNow) and M1 (formatRelativeTime) must ship together** — both touch `notifications/domain/format.ts` (doc 09 note).
5. **P0/P1 are never mixed with structural moves** — per the audit's own rule and because P1 diffs are the reviewable proof of "nothing behavioral changed."
6. Gated/production-evidence clusters (E1/E2) have **no priority slot** — they are not cleanup work; they are owner decisions tracked in the ledger.
