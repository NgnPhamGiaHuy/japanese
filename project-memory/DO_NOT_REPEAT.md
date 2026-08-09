# Do Not Repeat

Work already completed, or decisions already made, that must **not** be re-proposed or re-implemented without new evidence.

**Verified:** 2026-08-09 at commit `e629c25`. Every entry carries code evidence or a commit SHA.

> **How to use this.** Before proposing a refactor, search this file for the area you are touching. If it appears here, the work is done or the decision is settled — read the "Do not reimplement unless" clause and honor it.

---

## Completed refactors

### Feature barrels as public API (ADR-101)
- **Status:** DONE `[HIGH]`
- **Evidence:** all 9 features have `index.ts`; external deep-imports into `features/flashcard/types` = **0** (was 43); `eslint.config.mjs` `import/no-restricted-paths` at **`"error"`**
- **Commits:** `cbf210a` (T-101a) · `91d1150` (T-101b) · `7e16edc` (T-101c)
- **Important detail:** **Amendment 1** — a feature has **two** entry points, not one: `@/features/<f>` (client-safe) and `@/features/<f>/server` (Admin SDK). A single barrel could not serve both sides of the Next.js server/client fence. Recorded as LDG-17. `360d502`
- **Do not reimplement unless:** you are adding a *third* entry point — which needs a new ADR.
- ⚠ **A vendored rule contradicts this.** `.rules/skills/react-best-practices/rules/bundle-barrel-imports.md` marks barrel files `impact: CRITICAL` and says to import from source files directly. **The repo deliberately went the other way and enforces it at `error`.** Do not "fix" the codebase to satisfy that vendored rule.

### Flashcard internal sub-modules (ADR-104)
- **Status:** DONE `[HIGH]` — flat `components/` dissolved into `builder/ dashboard/ detail/ games/ sharing/`, each with its own barrel, lint-enforced
- **Commits:** `a928ff1` (T-104a) · `e2492ae` (T-104b)
- **Do not reimplement unless:** splitting flashcard into separate top-level features — explicitly *deferred, not forbidden* (ADR-104 alt 1).

### Notifications act-side seam (ADR-102)
- **Status:** DONE `[HIGH]` — `features/notifications/` imports **zero** other features (grep-verified); producing features register handlers via `registerNotificationActions`
- **Commits:** `c759eb1` (T-102a) · `84eedb7` (T-102b) · `aa53482` (T-102c, lint)
- **Do not reimplement unless:** never. Importing a feature from `notifications` re-forms the W-1 cycle and fails lint.

### Listener centralization (ADR-113)
- **Status:** DONE `[HIGH]` — **all 12** real `onSnapshot(` call sites are in `services/`; providers mounted once in `lib/providers.tsx`
- **Commits:** `2a76799` (T-113a) · `a177192` (T-113b) · `2e10ea2` (cleanup PR4b, closed the last 2 hook-level leaks)
- **Do not reimplement unless:** never. Opening a listener in a hook or component is an architecture violation.

### Unified verified-identity action client (ADR-106)
- **Status:** DONE `[HIGH]` — `lib/safe-action.ts` exports one mechanism (`verifiedActionClient`) with thin surface configs; `adminActionClient` and `actionClient` deleted
- **Commits:** `93e0bf6` · `a6af78b` · `1cf8de4` · `ed117f6`
- **Do not reimplement unless:** never re-add a parallel action client.

### httpOnly session auth (ADR-107)
- **Status:** DONE `[HIGH]` — `lib/auth-session.ts`; client reads no credential from `document.cookie`; edge gate documented as routing-only
- **Commits:** `48cf8cb` · `91ffcd8` · `924aa74` · `957113c`

### Test floors (ADR-117)
- **Status:** DONE `[HIGH]` — 375 unit · 84 browser (20 files) · 133 emu (18 files, 3 skipped) · 2 E2E specs, all green as of 2026-08-04 (count drifts slightly with each change — treat as approximate, re-run rather than trust the exact number)
- **Commits:** `51633d8` · `4fd14cb` · `fe05455` · `895a00f` · `a5ee2e4`

### Migration ledger (ADR-120)
- **Status:** DONE and **actively maintained** `[HIGH]` — `docs/migrations-ledger.md`, 22 real rows (+1 `_(example)_` template), 8 closed, 14 open, every row carries all four required fields
- **Commits:** `f3951e8` · `80aac83` · `f7c6bfa`
- **This is the live state of record.** It has been updated *after* the planning corpus froze, and it is more current than any planning document.

### Lesson-level legacy fallback removal (LDG-22, lesson half)
- **Status:** DONE `[HIGH]` — empirically verified against the live database before removal (read-only scan, 0 of 9 lessons needed it), not assumed
- **Removed:** `rbac.ts`'s `ownerId ?? userId` fallback; `lesson-subscriptions.ts`'s `collaborators`-array fallback query; the `collaborators` dual-write in `lesson-save.ts`/`lesson.service.ts`/`access.service.ts`/`lesson-duplicate.ts`; `lesson-normalize.ts`'s `__ownerIdFallback`/`sharedBy*` mapping; `useLessons.ts`'s `userId: ownerId` write; the matching `firestore.rules` collection-group branch (`resource.data.collaborators.hasAny(...)`) — verified structurally redundant, not just empirically, since every write site always set `roles` and `collaborators` together, atomically
- **`ShareModal`'s `onUpdateRoles` prop lost its second parameter** (`newCollaborators: string[]`) — if you're adding a caller, it's single-arg now: `(newRoles) => Promise<void>`
- **Validated:** typecheck, lint (0 errors), 375 unit + 84 browser + 133 emu (rules-suite included) all green
- **Do not reimplement unless:** a future data audit finds real documents missing `ownerId`/`roles` — re-run the same read-only `collectionGroup` check before restoring any fallback, don't restore on assumption alone
- ⚠ **Do not confuse this with the card-level half of LDG-22, which is NOT done** — see Known constraints below

### Structural cleanup program (post-backlog)
- **Status:** DONE `[HIGH]` — 12 commits `c982a64`…`f4dd766`
- Dead code removed; 14 single-consumer modules moved shared→feature; 3 route-layer screens extracted into features; `duplicateLesson` extracted test-first; barrel over-exports trimmed; 15 dead type exports removed; `SurvivalGameOverScreen` adopted `GameResultsScreen`; `SharePrivacyPicker` migrated to Base UI Menu
- **The audit set that drove it was deleted on completion** — recoverable at `c982a64` if its evidence is ever needed.
- **Do not re-run a "find dead code" sweep expecting a large yield.** The last full audit of ~600 files found a hard-delete surface of **1 file + 4 symbols + 1 empty directory**.

---

## Superseded approaches

### Barrel removal (June) → barrel adoption (July, enforced)
- **Replaced by:** ADR-101 + Amendment 1
- **Reason:** a June commit `c474f64 refactor(architecture): remove barrel exports and standardize import paths` was reversed by the modernization program.
- **Do not restore unless:** a new ADR supersedes ADR-101. Note the reversal history when proposing anything barrel-related — this ground has been fought over twice.

### `framer-motion` → `motion`
- **Replaced by:** `motion` v12 with `LazyMotion` + `m` for tree-shaking. `1ef527c`
- ⚠ `.claude/skills/design-system/references/tokens.md:105` still says "Framer Motion". The spring values are correct; only the library name is stale.

### Storybook
- **Removed:** `fdbe6db` (T-119e, Q-17 fallback). No rule file mandates it. Do not re-add without a decision.

### Separate `adminActionClient` / `actionClient`
- **Replaced by:** the unified client. Deleted in `ed117f6`.

---

## Architecture decisions (do not re-litigate)

### The two RBAC engines stay two (ADR-115)
- **Decision:** deck-sharing RBAC and admin authority are separate domains. **No merge.**
- **Do not propose:** "unify the permission systems."

### `game/` is a platform feature, not `shared/` (ADR-113 / cleanup audit)
- **Decision:** `features/game/` is consumed by kana and flashcard and stays a feature. Its kit is **not** promoted to `shared/`.

### `toActionResult` survives the client unification (LDG-21)
- **Decision:** the shim was expected to retire with T-106d. It did **not** — `admin.actions.ts`'s 19 actions need the `{ok,data}` envelope for their consuming hooks, a need orthogonal to which client backs the action.
- **Evidence:** `lib/safe-action.ts:108`; commit `ed117f6` explicitly records the planning assumption (M-2) as **empirically false**.
- **Do not propose deleting it** as "leftover migration scaffolding."

### Two pagination mechanisms are THE two (ADR-112)
- Codified deliberately. A third needs a review gate. `3778afc`

### The 200-line ceiling is deferred **on purpose** (TD-3)
- **Decision:** `max-lines` stays at `warn`. 52 files currently exceed it.
- **Evidence:** the refactor program recorded this as "a **deliberate deferral, not an oversight**", noted "so its absence is auditable, not mistaken for coverage." The rule is `warn` in `eslint.config.mjs` and has never been flipped to `error`.
- **Do not report this as newly-discovered debt.**

### Every fallback in the codebase is load-bearing or gated
- A full audit of 28 fallback constructs found **zero** obsolete: 19 runtime-resilience, 7 ledger-gated, 2 test-only.
- **Do not delete a fallback** without checking the ledger first.

---

## Known constraints

### Nothing is production-verified
- **Constraint:** Q-1 (which Firebase project is production) and Q-2 (hosting target) are unanswered.
- **Affected:** every "deployable"/"done" claim means **merge-visible**, not user-visible.

### T-118b (APP_ID unification) is BLOCKED, not forgotten
- **Constraint:** unifying `NEXT_PUBLIC_APP_ID` and `NOTIFICATIONS_APP_ID` **is a tenant repartition** if the two production values differ — reads/writes move to a different `artifacts/{APP_ID}` root, nothing errors, and no code revert reunites the data.
- **Evidence:** split-brain confirmed in code (`lib/app-id.ts:1` vs `functions/src/digest.ts:151`, `functions/src/fanout.ts:126`); ledger LDG-09 = "BLOCKED, not started"; backlog marks it 🔒 BLOCKED; `04-PR-Plan.md` PR-2.1 marked **DO NOT OPEN**.
- **Do not implement unless:** Q-6 answers with the two production values compared, **or** the owner accepts a deliberate one-time repartition with a backup taken first.

### 4 tasks have inaction fallbacks — they cannot be worked at all
- **T-115c** (admin predicates), **T-108b** (index/rules deploy), **T-108c** (`@deprecated` fields), **T-108d** (collapse dual read paths).
- Executing them unanswered causes the exact harm their ADR names (e.g. collapsing the dual read path "would silently hide pre-migration notifications from users").

### The critical path terminates in a gated task
- It ends at **T-108d**, gated on Q-5. **The program cannot complete on in-repo work alone.** This is a known, recorded property — not a planning failure.

### Card-level legacy compat (LDG-22, card half) is confirmed still needed — do not remove
- **Constraint:** `card.service.ts`'s `assertCardSchema` heal-on-read for missing `alternatives`, and `shared/utils/reorder.ts`'s legacy numeric `order`/`sortOrder` read support, are both **empirically confirmed load-bearing**, not just theoretically risky.
- **Evidence (2026-08-04, read-only `collectionGroup("cards")` scan, 817 total cards):** **192 (23.5%)** are missing `alternatives` — removing the heal would make these cards throw (`assertCardSchema` hard-errors on a non-array `alternatives`), not just render wrong. **621 (76%!)** still carry legacy numeric `order`/`sortOrder`, not a fractional-index string key — the large majority of all cards, not a long tail.
- **Do not remove either** without running a cards backfill first (mirrors `scripts/backfill-notifications.mjs`'s pattern) — see ledger LDG-22.
- **Contrast:** the lesson-level half of LDG-22 (owner/collaborator fallbacks) *was* removed the same day, after the equivalent check found 0 of 9 lessons needed it. The two halves are not the same risk — check before assuming either one generalizes to the other.

### NQ-7 / NQ-8 survive the program with no task and no owner
- World-readable leaderboard (uid + displayName) and world-readable card-image Storage.
- **Recorded, not dropped** — but nothing in the 63-task plan touches them. Highest-value unclaimed risk reduction available.

### Rules do not auto-load
- **There is no `CLAUDE.md` and no root `AGENTS.md`.** `[HIGH]` Nothing loads `.rules/` automatically; the 14 `ai-rules/*.rule.md` files are persona prompts written for manual paste, yet read as ambient policy.
- **Consequence:** an agent that ingests `.rules/` wholesale will absorb a SvelteKit pack, a styled-components pack, and a barrel-ban that all contradict this codebase. Treat `.rules/` as third-party rule packs, not as this project's conventions.
