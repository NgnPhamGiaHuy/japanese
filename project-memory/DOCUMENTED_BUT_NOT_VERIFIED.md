# Documented But Not Verified

Claims in the corpus that the code does **not** support, or that could not be confirmed. Each states what would settle it.

**Verified:** 2026-08-04 at `f4dd766`. Status vocabulary: `CONTRADICTED` · `STALE` · `NEEDS_VALIDATION` · `UNKNOWN`.

---

## 1. `CONTRADICTED` — "Done: 0" across the whole progress table

| | |
|---|---|
| **Claim** | `implementation-planning/09-Progress-Tracking.md` §3 roll-up: every wave `Done = 0`, `Total 63 / Done 0` |
| **Expected** | No task implemented |
| **Actual** | 61 of 63 task IDs appear in commit messages; all six waves' work is present in code |
| **Evidence** | `git log --oneline \| grep -oE "T-[0-9]{3}[a-e]?" \| sort -u` → 61 IDs (excl. T-118b, T-118d) |
| **Required action** | Banner the document as superseded. See `IMPLEMENTED_BUT_NOT_DOCUMENTED.md` §1 |

## 2. `CONTRADICTED` — CI lint described as non-blocking / "no CI/CD pipeline"

| | |
|---|---|
| **Claim** | `implementation-planning/07-Risk-and-Mitigation.md` §318 and `08-Implementation-Readiness.md:207`: *"There is no CI/CD pipeline and no deployment history (R-13)"* |
| **Actual** | `.github/workflows/ci.yml` runs **five** jobs; lint is **blocking** (`continue-on-error` removed in `4fd206c`); `check:vocab`, build, unit, emu, browser, and E2E all run on PR |
| **Evidence** | workflow file read this session; `execution-readiness/02-Open-Questions.md:287` already adjudicated the claim as *"wrong as stated"* — the source risk R-13 says only *"No hosting or deployment decision recorded"* |
| **Required action** | Correct both documents; the widening from "no deployment decision" → "no CI/CD pipeline" is a factual error |

## 3. `STALE` — file paths cited across the planning corpus

| | |
|---|---|
| **Claim** | Numerous documents cite paths such as `shared/utils/romaji.ts`, `shared/utils/reorder.ts`, `shared/schemas/lesson.schema.ts`, `features/notifications/schema.ts`, `shared/hooks/usePrefersReducedMotion.ts` |
| **Actual** | All moved by the post-backlog cleanup program. E.g. `features/notifications/schema.ts` → `features/notifications/domain/schema.ts` |
| **Evidence** | commits `41afaaa`, `7e3327c`, `8f62f08`; **one of these stale paths broke CI** — `scripts/check-vocabulary-agreement.mjs` hardcoded the old notifications path and crashed the blocking `check:vocab` step (found and fixed this session) |
| **Required action** | Treat every file path in `architecture-assessment/`, `project-discovery/`, `implementation-planning/`, `execution-readiness/` as **historical**. Do not use them for navigation |

## 4. `CONTRADICTED` — the gated-task split is stated six different ways

| | |
|---|---|
| **Claim** | Kernel + `09-Progress-Tracking.md:282`: *"12 executable / 4 inaction"* |
| **Competing** | `03-Task-Status.md:45` "10 / 6" · `02-Open-Questions.md:145` "6E·2R·3P·1C·4I" · `01-Readiness-Review.md:202` "11 / 4 / 1" · `08-Sprint-0-Completion.md:183` "~10–12 / 4–6" · `07-Go-NoGo-Decision.md:60` "not 12/4" |
| **Settled part** | The **4-inaction** figure is verbatim-correct and agreed everywhere: **T-115c, T-108b, T-108c, T-108d** |
| **Required action** | Use the 4-inaction list; treat the executable count as unreliable |

## 5. `CONTRADICTED` — two incompatible "C-1 … C-7" condition sets

| | |
|---|---|
| **Claim** | `execution-readiness/07-Go-NoGo-Decision.md:28` C-1 = *"Run Sprint 0"*; `04-Sprint-1-Approval.md:238` C-1 = *"Run PF-4 … JDK on PATH"* |
| **Actual** | Both files label conditions C-1…C-7 with entirely different content; `08-Sprint-0-Completion.md` tracks only **07's** set, so **04's C-3/C-5/C-6 have no closure record anywhere** |
| **Required action** | Renumber one set, or add a cross-reference note. Currently "C-3 is closed" is ambiguous |

## 6. `NEEDS_VALIDATION` — the 200-line violation count

| | |
|---|---|
| **Claim** | `eslint.config.mjs:58-60`: *"the repo has 47 pre-existing files over the limit (verified count…)"* |
| **Actual now** | **53** files exceed 200 lines |
| **Uncertainty** | I could not reliably measure the count at the ratchet commit (`4fd206c`) — a detached-HEAD probe returned an unusable result because dependencies did not resolve there. I will not assert a regression I could not measure |
| **Required validation** | Re-measure at `4fd206c` in a clean checkout with `npm ci`. If it was genuinely 47, six files crossed the ceiling during the program and the config comment needs updating |

## 7. `CONTRADICTED` — T-117d described as droppable float

| | |
|---|---|
| **Claim** | `05-Dependency-Map.md` §D.2: T-117d *"nothing downstream depends on it"*; §D.3 it can slip *"out of the program"* |
| **Actual** | `01-Validated-Backlog.md` T-115a: *"Requires T-117b and T-117d complete first"* — plus six more dependent sites |
| **Status** | Escalated as Go/No-Go **C-4**, recorded **still open** at `08-Sprint-0-Completion.md:203`. Both tasks did in fact land (`895a00f`, `185dc15`), so the hazard did not materialize — but the contradiction is unrepaired |

## 8. `CONTRADICTED` — ADR-106 / ADR-115 permission-vocabulary collision

| | |
|---|---|
| **Claim** | ADR-106 SC-2: *"Every server action declares `.metadata({ permission })`"*; ADR-115: the two RBAC engines are *"affirmed as two domains … no merge"* |
| **Problem** | Neither ADR names the other; no acceptance criterion says which vocabulary a **deck-sharing server action** declares |
| **Status** | Escalated as Go/No-Go **C-7**, **still open**. In practice `userActionClient.metadata({permission})` is used with ad-hoc labels (e.g. `"notifications.emit"`, explicitly *"not consumed for authorization"*) |
| **Required action** | An architecture decision, or an explicit note that the metadata label is descriptive-only |

## 9. `CONTRADICTED` — open-question count stated as 26 / 25 / 32 / 18 / 33

| | |
|---|---|
| **Claim** | `07-Open-Questions.md:28` header "26"; `:109` roll-up "25"; group tables sum to **32**; `:109` also says "18 blocking" |
| **Adjudicated** | `02-Open-Questions.md:115` sets the authoritative count at **33** (26 substantive incl. Q-4 + 7 minor); `:111` shows "18 blocking" is impossible under any reading |
| **Root cause** | **Q-4 has no row at all** in the register — it survives only as an aside inside NQ-14's cell (`:75`) |
| **Required action** | Add Q-4's row (this was PF-3, still open) |

## 10. `UNKNOWN` — every production-dependent claim

| | |
|---|---|
| **Claim** | Various documents assert deployment state, index/rules deploy currency, legacy data presence, admin-authority provisioning |
| **Actual** | Unknowable from the repo. `docs/testing-notifications.md` flags an index/rules deploy as *"NOT yet deployed"*; LDG-19 records that the index half was later deployed by owner action, but the **rules** half remains unverified |
| **Status** | Correctly gated (Q-1, Q-2, Q-5, Q-6, NQ-1). No document overclaims here — recording for completeness |

---

## Cross-cutting conclusion

The planning corpus is **reliable on intent and rationale** and **unreliable on completion state and file paths**. Its own execution-readiness layer already caught ~33 internal contradictions (documented at `execution-readiness/01-Readiness-Review.md` D-1…D-16 and `02-Open-Questions.md` §E) — those adjudications are sound and worth reading. What it never got was a final pass reconciling itself against the finished code. That is what this document set provides.
