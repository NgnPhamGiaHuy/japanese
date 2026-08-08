# Implemented But Not Documented

Changes verified present in code whose state is **not** reflected in the planning corpus. Future agents reading only the plans would incorrectly conclude this work is outstanding.

**Verified:** 2026-08-04 at `f4dd766`.

---

## 1. The entire 63-task backlog executed — progress tables still read day-one zeros

- **What:** Every task T-101a…T-120c reached a terminal state. 61 of 63 appear in commit messages (`git log | grep -oE "T-[0-9]{3}[a-e]?"`); the 2 absent are T-118b (BLOCKED) and T-118d (OPEN), both correctly so.
- **Where documented as incomplete:** `implementation-planning/09-Progress-Tracking.md` §3 — every row has empty `Status`/`PR`/`Done` columns; the §3 roll-up reads **`Done: 0`** for all six waves and `Total 63 / Done 0`.
- **Why it matters:** this is the single most misleading artifact in the repo. It is pre-filled "usable on day one" and was never updated during execution. An agent trusting it would re-plan 63 completed tasks.
- **Recommended update:** add a header banner to `09-Progress-Tracking.md`: *"SUPERSEDED — execution complete. See `project-memory/CURRENT_PROJECT_MEMORY.md` and `docs/migrations-ledger.md`."* Do **not** retro-fill 63 rows; the ledger already carries the durable state.

## 2. The post-backlog cleanup program (12 commits) is in no planning document

- **What:** After the 63 tasks, a full structural cleanup ran — dead-code deletion, 14 shared→feature relocations, 3 route-layer extractions, `duplicateLesson` test-first extraction, barrel trims, 15 dead type-export removals, plus two UI-behavior migrations (N3 survival results screen, N4 SharePrivacyPicker→Base UI).
- **Where:** commits `c982a64` … `f4dd766`.
- **Not in:** any file under `implementation-planning/`, `execution-readiness/`, or `architecture-decision/`. Its own 15-document audit set was **deleted on completion** (`f4dd766`), recoverable at `c982a64`.
- **Why it matters:** ~14 modules moved. Any planning document citing their old paths is now wrong (see `DOCUMENTED_BUT_NOT_VERIFIED.md` §3).
- **Recommended update:** one paragraph in `docs/README.md` noting the program, its commit range, and where the audit is recoverable.

## 3. Ledger rows LDG-16 … LDG-22 were never anticipated by the plan

- **What:** The plan specified LDG-01…LDG-15 (`09-Progress-Tracking.md` §2.3). Seven more exist:
  - **LDG-16, LDG-18** — additional staged work
  - **LDG-17** — ADR-101 Amendment 1's sequencing constraint (T-102a/b before T-101b)
  - **LDG-19** — composite index deploy, now **closed** by owner action
  - **LDG-20** — 7 files bypassing both action clients
  - **LDG-21** — `toActionResult` surviving T-106d, falsifying planning merge-assumption M-2
  - **LDG-22** — a six-mechanism flashcard legacy-compat cluster discovered after planning closed
- **Why it matters:** LDG-20/21/22 record *discovered* facts that contradict planning assumptions. They are the highest-value new knowledge in the repo.
- **Recommended update:** none to the ledger (it is correct and current). The planning corpus should point *at* it rather than restate it.

## 4. ADR-101 Amendment 1 is absent from the master ADR table and from all execution-readiness reviews

- **What:** `architecture-decision/03-Architecture-Decisions.md:63-86` adds Amendment 1 — a feature has **two** entry points (`@/features/<f>` + `@/features/<f>/server`) — plus a hard sequencing constraint: *"T-102a/b must land before T-101b is retried."*
- **Where stale:** the master table row for ADR-101 (`:16`) still reads plain `Accepted / P1 / gate —` with no amendment marker. **No** `execution-readiness/` document mentions the amendment; `03-Task-Status.md:174-175` still treats T-101b and T-102 as independent.
- **Evidence of drift:** reviews cite the file as **555 lines**; it is now **579**, and the ADR-116 status line they cite at `:451` now sits at `:475` — a 24-line offset exactly matching the amendment's insertion.
- **Recommended update:** mark the master-table row with "(+ Amendment 1)".

## 5. `docs/adr/` index drift was repaired — reviews still describe it as broken

- **What:** ADR-003 existed on disk but was missing from the index. Fixed by `f7c6bfa` (T-120c); `docs/README.md:12-14` now records the incident and states the completeness rule.
- **Where stale:** `architecture-decision/03-Architecture-Decisions.md:5`, `implementation-planning/02-Execution-Waves.md:105`, and ADR-120 SC-3 all still describe the omission as present.
- **Verified:** all 3 files on disk are indexed; all 3 indexed files exist. **No drift remains.**

## 6. Sentry / PostHog deferral was executed and recorded

- **What:** T-116b/T-116c's acceptance criteria make *"deferred with the reason logged"* a **pass**, not a failure. Both were recorded as deferred.
- **Where:** commits `bea5206`, `79f2ee1`; `.env.example:118-135` carries the credential-gated wiring, commented out.
- **Why it matters:** an agent might read "Sentry not active" as incomplete work. It is a **completed** task whose outcome was a recorded deferral.

## 7. The vocabulary checker's `NotificationType` target has flipped to `enforce`

- **What:** planning documents describe this target as **report-only** until T-108a lands (a Wave-5 exit criterion). T-108a landed (`257576d`), and the flip happened.
- **Evidence (run this session):** `npm run check:vocab` → `[NotificationType] agrees (10 values) — enforce`.
- **Why it matters:** this is a Wave-5 exit criterion that **has been met** but is recorded nowhere as met.
