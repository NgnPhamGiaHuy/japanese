# 07 — Technical Debt

Architecture Assessment phase. Catalogs and ranks debt only: what each item is and what it costs. No remediation designs, refactor proposals, or task lists appear here.

- **Repo root:** `/Users/yuh.nguyenpham/GitHub/japanese`; Next.js project root `src/`. Paths below are relative to `src/` unless prefixed with `/`.
- **Inputs:** discovery corpus (`/project-discovery/`, esp. 08, 10, 11, 12) used as a candidate list only. **Every citation below was re-verified directly against the repository at assessment time** (2026-07-19, branch `main`, HEAD `a0bbbc4`). Candidates that did not re-verify were dropped (none failed; see Discrepancies).
- **Scope discipline:** genuine debt (code that costs something today) is ranked. Facts that depend on production/ops state the repo cannot answer are **not** ranked as debt; they are cross-referenced in §"Production unknowns" at the end.

---

## Ranking rubric

Each item is scored on three axes, High = 3 / Med = 2 / Low = 1:

| Axis | Question scored |
|---|---|
| **Impact** | If this debt bites, how wide and how severe is the damage (correctness, security, user-visible quality, maintainability)? |
| **Urgency** | Does anything *force* timing — a pending operational step, user-visible breakage today, or a stated plan that depends on it? |
| **Cost of delay** | Does the debt *compound* if deferred (more non-conforming data, more copies of a pattern, more untested code), or does it merely persist? |

**Rank = Impact + Urgency + Cost-of-delay** (max 9). Ties are broken by Impact, then Urgency, then Cost-of-delay; residual ties are broken by documented judgment noted in the item ("Tie-break" line). Confidence does not move rank; it is reported so low-confidence items can be discounted by the reader.

---

## Ranked master table

| Rank | ID | Debt (one line) | Category | Impact | Urgency | Cost of delay | Score |
|---:|---|---|---|---|---|---|---:|
| 1 | TD-1 | Notification schema migration frozen mid-flight: 4-value `NotificationType` vs 10 runtime values, dual read paths, 4 `@deprecated` fields, legacy+new indexes, backfill/deploy still marked pending | Architectural | High | Med | High | 8 |
| 2 | TD-2 | Test coverage topology inverted: the largest features (flashcard 16.9k LOC, kana game hooks, game, ai) have zero-to-4 test files; sharing RBAC `resolveRole` untested | Testing | High | Med | High | 8 |
| 3 | TD-5 | Schemas declared "single source of truth" with zero non-test consumers (`cardContentSchema`, `privacyModeSchema`, `publicRoleSchema`); write paths enforce a narrower legacy check | Code | Med | Med | High | 7 |
| 4 | TD-8 | Admin analytics reads two collections no repo code writes (`analytics_daily`, `metadata/counters`) and fabricates zero-valued metrics/export rows when they're empty | Architectural | Med | Med | Med | 6 |
| 5 | TD-3 | Self-imposed 200-line ceiling is warn-only and exceeded by 44 files (max 436); warning noise on every lint run | Code | Med | Med | Med | 6 |
| 6 | TD-7 | Live admin UI with no behavior: 3 handler-less "Quick Actions" buttons on the dashboard; Settings page is an explicit stub with an unwired `canChangeSettings` permission | Code | Med | Med | Low | 5 |
| 7 | TD-14 | Hosting/production-domain decision never recorded (the repo's only TODO); `SITE_URL` falls back to localhost and feeds sitemap/robots/metadata/share URLs | Documentation | Med | Med | Low | 5 |
| 8 | TD-9 | Shared-deck public-access predicate duplicated across client SDK, Admin SDK, and Firestore rules — three copies of a privacy boundary that must move in lockstep | Architectural | Med | Low | Med | 5 |
| 9 | TD-4 | Two directory-level import cycles (`flashcard ↔ notifications`; `admin ↔ lib/logging`) with no cycle-detection tooling installed | Architectural | Med | Low | Med | 5 |
| 10 | TD-13 | Onboarding/ops documentation gap: no README, no `.env.example` for 30 referenced env vars, ADR index drift (003 unlisted), major subsystems ADR-less | Documentation | Med | Low | Med | 5 |
| 11 | TD-15 | Auth ID token in a JS-readable (non-httpOnly) cookie — deliberate, documented, but an accepted XSS-amplification risk with no recorded ADR | Security | Med | Low | Low | 4 |
| 12 | TD-6 | Dormant vocabularies: 7/16 `NotificationKind`s inactive, 8/32 `ActivityAction`s never emitted (incl. a shipped kana-practice mode that logs nothing), `LogSource "cloud_function"` producer-less | Code | Low | Low | Med | 4 |
| 13 | TD-10 | Kana survival screens live in the route layer (`app/**/_components/`) while every sibling kana mode's screens live in `features/kana/` — feature split across layers | Structural | Low | Low | Med | 4 |
| 14 | TD-12 | Full Storybook toolchain (7 packages + eslint plugin + config + scripts) carried for exactly one story | Developer Experience | Low | Low | Med | 4 |
| 15 | TD-16 | App and Cloud Functions derive the same `APP_ID` from two different env vars with independently overridable defaults | Architectural | Low | Low | Low | 3 |
| 16 | TD-11 | `Drawer` shared primitive: built, themed, barrel-exported, zero render sites | Structural | Low | Low | Low | 3 |

Tie-breaks applied: TD-1 over TD-2 (equal 8s) because TD-1 has an in-repo pending operational step explicitly marked "NOT yet deployed" and diverges *data* today, while TD-2's cost is realized only when code changes. TD-8 over TD-3 (equal 6s) because TD-8 presents fabricated numbers to humans today. TD-7/TD-14 over TD-9/TD-4/TD-13 (equal 5s) on Urgency; TD-9 over TD-4/TD-13 on potential severity (privacy boundary).

---

## Architectural debt

### TD-1 — Notification schema migration frozen mid-flight

- **Debt:** The notifications subsystem carries a full schema migration's machinery with the migration not finished. Concretely: (a) the compile-time type `NotificationType = "invite" | "comment" | "reply" | "role_change"` is a 4-value union, while the same codebase writes 10 distinct values into that field (9 active kinds via the server action + `"digest"` from the Cloud Function); (b) 4 fields are `@deprecated` but load-bearing ("Kept for existing Firestore docs"); (c) the realtime listener maintains two query paths (composite-index primary + createdAt-only fallback with client-side filtering); (d) `firestore.indexes.json` provisions both the legacy `read+isDeleted` index and the new `status+isDeleted` index; (e) a one-time backfill script exists, dry-run by default; (f) the runbook explicitly says the index/rules deploy is "NOT yet deployed"; (g) Firestore rules validate `type` against only the 4 legacy values on the one client-write path.
- **Evidence (all verified):**
  - `features/notifications/types/index.ts:5` (4-value union), `:47` (`AppNotification.type` uses it), `:71-81` (four `@deprecated` fields), `:104-109` (`isUnread()` legacy `read` fallback)
  - `features/notifications/actions/notification.actions.ts:209` (`type: input.kind` — writes any of the 9 active kinds); `features/notifications/schema.ts:74-82` (server input schema accepts 7 client-emitted kinds)
  - `functions/src/digest.ts:82` (`type: "digest"` — an 10th stored value outside every union), `:138` (digest logic itself filters on it)
  - `features/notifications/services/notification-subscribe.ts:26-33` (documented primary/fallback strategy), `openFallback`/`openPrimary` at `:75-118`
  - `firestore.indexes.json:36-43` (`status+isDeleted`) **and** `:44-51` (legacy `read+isDeleted`)
  - `scripts/backfill-notifications.mjs:1-32` (one-time backfill; documents the `!=` field-existence trap that makes legacy docs render differently per listener path)
  - `/docs/testing-notifications.md` — section "Pending index & rules deploy (**NOT yet deployed**)"
  - `firestore.rules:39-41` (`isValidNotificationType` = the 4 legacy values), `:185-188` (applied to the pending-invite create path)
- **Category:** Architectural
- **Impact:** High — every notification read/write path, inbox correctness (same inbox can render differently depending on which listener path is live — stated by the backfill script itself), and type-safety: `AppNotification.type`'s TypeScript type is narrower than what the same repo writes, so every `switch` on it is silently non-exhaustive (`NotificationIcon` already falls back to a default branch for values the type says can't exist).
- **Urgency:** Med — nothing breaks tomorrow, but the runbook records unfinished operational steps, and every newly activated `NotificationKind` widens the type/runtime gap.
- **Cost of delay:** Compounds in *data*: every day of writes adds documents under the new shape while legacy docs remain unstamped, so the dual read paths, dual indexes, deprecated fields, and `isUnread()` fallback all stay load-bearing; the eventual reconciliation grows strictly harder (more shapes, more docs, more consumers of the lying type).
- **Confidence:** High (all facts in-repo). Whether the backfill ever ran in production is a separate unknown (see §Production unknowns, U-2).

### TD-8 — Writer-less analytics collections with fabricated fallbacks

- **Debt:** The admin analytics surface is structurally wired to data no repo code produces. `analytics_daily` is read in two places and written nowhere; `metadata/counters` is read once and written nowhere. Both readers carry fallbacks that *fabricate* plausible-looking output: the dashboard reports `activeUsersToday`/`totalSessions`/`errorRate` as `0` when the cache doc is absent (indistinguishable from a true zero), and the analytics export synthesizes a single row with hardcoded `newUsers: 0` and `featureUsage: { flashcards: 0, kana: 0, matching: 0 }`. Side cost: with no cache writer, `getAdminStats()`'s "fallback" is the *only* path — every dashboard load performs live `count()` aggregations plus a full `admins` collection fetch.
- **Evidence (all verified):**
  - `features/admin/services/analytics.service.ts:22,29` (reads `analytics_daily`, described as "pre-aggregated"); `features/admin/actions/admin.actions.ts:278-281` (export reads it). Repo-wide grep for `analytics_daily` across `app/ features/ lib/ functions/ scripts/`: no writer.
  - `features/admin/services/user.service.ts:65` (sole `metadata` collection reference repo-wide), `:63-115` (`getAdminStats` — live `count()` fallbacks for totals; `0` fallbacks for activity metrics with comment "never fabricate activity metrics", yet the rendered `0` is unmarked)
  - `features/admin/actions/admin.actions.ts:277-299` (export: returns real docs if any, else synthesizes the hardcoded-zeros row)
- **Category:** Architectural (with correctness and cost consequences)
- **Impact:** Med — confined to the admin surface, but that surface presents fabricated metrics as real: "Active users today: 0 / Error rate: 0" and export rows with invented zeros can drive wrong operational conclusions.
- **Urgency:** Med — the misleading numbers render on every admin dashboard/export use, today.
- **Cost of delay:** Med — whatever pipeline is eventually supposed to populate these collections will face an ever-longer historical gap; meanwhile every dashboard load pays the aggregation cost and every export propagates invented data.
- **Confidence:** High on repo facts. Whether an out-of-repo pipeline populates these collections in production is unknowable here (§Production unknowns, U-12/U-13).

### TD-9 — Shared-deck public-access predicate triplicated

- **Debt:** The predicate that decides whether a deck is publicly reachable ("link access or public") exists in three places that must change in lockstep: the client-SDK resolution path, the Admin-SDK SEO/first-paint preview path, and the Firestore rules. The client/Admin file split is deliberate and documented (SDK bundle isolation), but the *predicate itself* is re-implemented rather than shared between the two TS modules, and the rules mirror it a third time. The preview path runs unauthenticated and server-side, so divergence there is a private-data exposure, not just a rendering bug.
- **Evidence (all verified):**
  - `features/flashcard/services/shared.service.ts:186` — `const linkAccess = lesson.allowLinkAccess || lesson.isPublic;`
  - `features/flashcard/services/shared-preview.service.ts:76` — `if (!data.allowLinkAccess && !data.isPublic) return null;` (server-only, Admin SDK, unauthenticated render path); `:5-16` documents the deliberate file separation; `:102` adds a third variant scoped to `isPublic` only (sitemap)
  - `firestore.rules:29-31` — `isPublicLesson(lessonData)` = `isPublic == true || allowLinkAccess == true`; applied at `:68,83,99,209-210`
- **Category:** Architectural
- **Impact:** Med — three copies of a privacy boundary; a future privacy mode added to one copy but not another either leaks a private deck on the anonymous preview/OG path or breaks legitimate access. (Note `privacyModeSchema`, the enum meant to formalize these modes, is itself unenforced — TD-5 — so nothing structural catches divergence.)
- **Urgency:** Low — the three copies agree today.
- **Cost of delay:** Med — each new privacy mode or access rule multiplies the sync surface; the unenforced enum means drift would be silent.
- **Confidence:** High.

### TD-4 — Feature-level import cycles, unguarded

- **Debt:** Two directory-level dependency cycles exist. Cycle A: `features/flashcard` → `features/notifications` (3 value-import sites) and back (`notifications` → flashcard's `declineInviteAction`). Cycle B: `features/admin` → `lib/logging` (value imports) and `lib/logging` → `features/admin/types` (type-only) — meaning the shared `lib/` layer depends on a feature package. No module-level cycle exists among the individual files, and no cycle-detection tool (`madge`, `dependency-cruiser`) is installed to keep it that way.
- **Evidence (all verified):**
  - Cycle A: `features/flashcard/components/ShareModal.tsx:12`, `features/flashcard/services/comment.service.ts:29`, `features/flashcard/services/access.service.ts:11` (all `@/features/notifications/services`); back-edge `features/notifications/components/InviteActions.tsx:8` (`@/features/flashcard/actions/access.actions`)
  - Cycle B: `features/admin/services/log.service.ts:8-9`, `features/admin/actions/admin.actions.ts:8` (`@/lib/logging/*`); back-edge `lib/logging/public.ts:1` (`import type … from "@/features/admin/types"`)
  - Tooling absence: no madge/depcruise in `node_modules/.bin` or on PATH (re-confirmed discovery 11 §10)
- **Category:** Architectural
- **Impact:** Med — the cycles block clean extraction/ownership of either feature and invert the `lib` ← `features` layering that the rest of the codebase observes (`shared/` imports neither `lib` nor `features`; `lib` otherwise imports features only in the composition root).
- **Urgency:** Low — nothing forces timing; both cycles are stable.
- **Cost of delay:** Med — with no tooling guard, new edges accrete undetected; each new notification producer inside `flashcard` (the pattern already used 3×) deepens Cycle A.
- **Confidence:** High.

### TD-16 — Dual `APP_ID` env vars across deployment units

- **Debt:** The Next.js app and the Cloud Functions package address the same Firestore namespace (`artifacts/{APP_ID}/…`) but derive `APP_ID` from two different env vars (`NEXT_PUBLIC_APP_ID` vs `NOTIFICATIONS_APP_ID`), each with its own copy of the same default literal. A mismatch in either environment silently splits the app's data namespace (functions would digest/fan-out a different tenant than the app writes).
- **Evidence (verified):** `lib/app-id.ts:1` (`NEXT_PUBLIC_APP_ID ?? "kana-nihongo-master"`); `functions/src/fanout.ts:126` and `functions/src/digest.ts:151` (`NOTIFICATIONS_APP_ID ?? "kana-nihongo-master"`).
- **Category:** Architectural
- **Impact:** Low — defaults agree today; failure requires a mis-set env in exactly one unit, and the failure mode is silent no-op digests rather than corruption.
- **Urgency:** Low. **Cost of delay:** Low — persists rather than compounds.
- **Confidence:** High on the facts; Medium that this is unintentional (no comment explains the divergence, but none records it as deliberate either).

---

## Structural debt

### TD-10 — Kana survival feature split across layers

- **Debt:** The kana survival game's four screen components live in the route layer (`app/[locale]/(immersive)/kana/survival/_components/`) while its session hook (`useSurvivalGame`) and all sibling kana modes keep their screens inside `features/kana/` (`quiz/`, `practice/`, `learn/`, `chart/`, `hub/` each have their own `components/`). The survival screens import `@/features/game/components` and `@/features/kana/hooks` from the app layer — app→feature edges no sibling mode creates. One feature's UI is findable in two trees, and the route layer hosts feature logic it hosts nowhere else (the only other `_components/` dirs are app-shell chrome and the notifications virtual-list page wrapper).
- **Evidence (verified):** `app/[locale]/(immersive)/kana/survival/_components/{SurvivalSetupScreen,SurvivalQuizScreen,SurvivalDropScreen,SurvivalGameOverScreen}.tsx` with imports at e.g. `SurvivalQuizScreen.tsx:7-9`; hook at `features/kana/hooks/useSurvivalGame.ts` (299 lines); sibling structure `features/kana/quiz/components/`, `features/kana/practice/components/`; full `_components` inventory: `app/_components`, `app/[locale]/(main)/_components`, `app/[locale]/(main)/notifications/_components`, and this one.
- **Category:** Structural
- **Impact:** Low — consistency/discoverability; refactors of kana must touch two trees.
- **Urgency:** Low. **Cost of delay:** Med — the placement is a live template; the next immersive mode built by imitation replicates the split.
- **Confidence:** High.

### TD-11 — `Drawer` primitive with zero usage

- **Debt:** `shared/components/ui/Drawer.tsx` (64 lines) is a finished, documented slide-in panel primitive exported from the shared UI barrel, with zero render sites anywhere. Meanwhile the two surfaces that *are* drawers (`DeckDetailsPanel` right-edge panel, `AdminSidebar` mobile nav) compose Base UI `Dialog` directly instead. The primitive misrepresents the component inventory: it looks like the sanctioned way to build a drawer, but the codebase's actual drawers ignore it.
- **Evidence (verified):** grep `<Drawer` across `app/ features/ shared/ lib/` matches only the definition; barrel export `shared/components/ui/index.ts:8`; direct-composition drawers at `features/admin/components/content/DeckDetailsPanel.tsx:37-114` and `features/admin/components/shared/AdminSidebar.tsx:140-170` (per Pattern Catalog §2, spot-verified).
- **Category:** Structural
- **Impact:** Low. **Urgency:** Low. **Cost of delay:** Low — dead weight persists; a future drawer author must guess which of two patterns is canonical.
- **Confidence:** High.

---

## Code debt

### TD-5 — Schemas that claim authority nothing grants them

- **Debt:** Three Zod schemas are documented as the validation source of truth and consumed by nothing outside tests. `cardContentSchema`'s file header calls it "the single validation source of truth shared by client forms …, server actions, and runtime parsing of AI/import output"; the import graph contradicts this — every real write path uses the narrower `validateAtomicCard` (primary-field-only), so the schema's `meaning`/`example`/`hint`/`clozeTemplate`/`difficulty` constraints are enforced **nowhere**. `privacyModeSchema`/`publicRoleSchema` likewise claim to enforce the "never editor via public link" cap "by the enum itself," but nothing parses with them (their siblings `shareInviteSchema`/`lessonMetadataSchema` in the same file *are* consumed).
- **Evidence (all verified):**
  - `shared/schemas/card.schema.ts:1-5` (header claim), `:63-80` (schema). Grep for `cardContentSchema` across `app/ features/ shared/ lib/`: only the schema file and its test.
  - Actual write-path validation: `features/flashcard/services/lesson-save.ts:61`, `features/flashcard/utils/parser.ts:147`, `features/ai/services/gemini.service.ts:39,86,132` — all `validateAtomicCard` (primary-only).
  - `shared/schemas/lesson.schema.ts:33,35` (`privacyModeSchema`, `publicRoleSchema`); grep: consumed only by `lesson.schema.test.ts`.
- **Category:** Code
- **Impact:** Med — two distinct costs today: (1) card fields beyond `primary` are written unvalidated by every path (manual builder, import parser, AI output), so Firestore accumulates documents no schema has checked; (2) the headers actively mislead — a developer reading them will assume protections that don't exist (the same header-vs-reality gap that produced TD-1's vocabulary drift).
- **Urgency:** Med — every card written today adds to the unvalidated corpus.
- **Cost of delay:** High — retrofitting the schema later meets non-conforming stored data, i.e. exactly the migration trap the notifications feature is currently stuck in (TD-1). Deferral converts a code fix into a data migration.
- **Confidence:** High that the enforcement gap is real; Medium on intent (adoption-unfinished vs. overtaken — undecidable from code, per discovery U-10/U-11).

### TD-3 — 200-line ceiling: declared, exceeded by 44 files, warn-only

- **Debt:** The repo declares a 200-line-per-file ceiling (`max-lines`) but at `"warn"`, with an in-config comment acknowledging "~46 pre-existing files over the limit" to be tightened "per file as they're split (see R31/E11)". Verified current state: **44** non-test files exceed 200 lines, topped by `ShareModal.tsx` (436), `FlashcardPractice.tsx` (396), `admin.actions.ts` (380), `analytics-drilldowns.ts` (379), `useDropMode.ts` (367). No file-level `eslint-disable max-lines` exists, so all 44 emit warnings on every lint run. The heaviest files are also the deepest-nested (up to 70 leading spaces, `AnalyticsDetailModal.tsx`) and contain the longest single functions (~367-line component body in `ShareModal`).
- **Evidence (all verified):** `eslint.config.mjs:59-67` (rule + comment); `find … | awk '$1>200'` over `app/ features/ shared/ lib/` = 44 non-test files; top sizes re-measured via `wc -l` (match discovery 11 §2); grep for `eslint-disable.*max-lines` = 0 hits; nesting figures from discovery 11 §9 (method re-read, not re-run).
- **Category:** Code
- **Impact:** Med — maintainability of exactly the files where the complex logic lives (share flow, practice session, admin actions, kana drop mode); plus lint-signal degradation: 44 permanent warnings train developers to scroll past lint output, masking new warnings of any kind.
- **Urgency:** Med — the config's own plan (split per file, then tighten) is stalled: the count has moved from ~46 to 44 since the comment was written; meanwhile any file under the ceiling can grow past it without failing anything.
- **Cost of delay:** Med — oversized files keep accreting logic (they are the hot files), and each addition raises the later splitting cost; the warning-noise habit is self-reinforcing.
- **Confidence:** High.

### TD-7 — Live admin UI with no behavior

- **Debt:** The admin dashboard renders a "Quick Actions" card whose three buttons ("Global Settings", "Content Audit", "Security Review") have no `onClick`, no `href`, and no form context — they are plain `type="button"` no-ops, while the component's JSDoc claims it "Provides immediate access to frequent administrative tasks." Adjacent: the Admin Settings route renders an explicit not-available stub, and the `canChangeSettings` permission exists in the RBAC matrix and the safe-action metadata enum with **no** server action ever declaring it.
- **Evidence (all verified):** `features/admin/components/dashboard/QuickActionsCard.tsx:11-15` (JSDoc claim), `:20-42` (three `<Button variant="ghost">` with only `className`/children); mounted at `features/admin/components/dashboard/AdminOverviewPage.tsx:9,132`. Stub: `features/admin/components/settings/AdminSettingsPageContent.tsx:10-16` (deliberate, documented). Permission: `features/admin/utils/rbac.ts:11,23,33` + `features/admin/services/admin.service.ts:76`; grep `permission: "canChangeSettings"` across `features/` = 0.
- **Category:** Code
- **Impact:** Med — user-visible on every admin dashboard load; clicking a labeled action that silently does nothing reads as breakage and erodes trust in the whole admin surface. The settings stub, by contrast, is honest about itself (it says "not available"), so its cost is lower — it is included here because the minted-but-unwired permission is invisible dead vocabulary in the security matrix.
- **Urgency:** Med — it ships to admins today.
- **Cost of delay:** Low — persists rather than compounds.
- **Confidence:** High. (Discovery U-8 confirms this is the *only* no-behavior control in the codebase; the pattern has not spread.)

### TD-6 — Dormant vocabularies: declared members nothing produces

- **Debt:** Three enum/union vocabularies carry members with zero producers, and code cannot distinguish roadmap from abandonment: (a) 7 of 16 `NotificationKind`s are registry-declared with full metadata (priority, category, collapse keys) but `active: false` and producer-less; (b) 8 of 32 `ActivityAction` members are never emitted — notably `KANA_PRACTICE_COMPLETED`, whose route **exists and ships** while its quiz and survival siblings both log completions, so activity analytics silently undercount one of three kana modes; (c) `LogSource` includes `"cloud_function"` with a rendering badge component, but the functions package never writes `system_logs`.
- **Evidence (all verified):**
  - `features/notifications/domain/registry.ts:66,108,115,129,145,152,160` (7 × `active: false`); kinds enumerated in `features/notifications/domain/events.ts:24-43`
  - `lib/logging/actions.enum.ts` (32 members); per-member grep across `app/ features/ shared/ lib/ functions/src`: `DECK_SHARED`, `DECK_UNSHARED`, `CARD_CREATED`, `CARD_UPDATED`, `CARD_DELETED`, `SHARE_INVITE_SENT`, `SHARE_INVITE_REVOKED`, `KANA_PRACTICE_COMPLETED` = 0 producers each; practice route exists at `app/[locale]/(immersive)/kana/practice/page.tsx`
  - `features/admin/types/log.types.ts:4`; grep `cloud_function` in `functions/src` = 0; normalizer `lib/logging/public.ts:41`
- **Category:** Code
- **Impact:** Low overall, with one Med edge: the kana-practice telemetry asymmetry is a real data gap today (any usage analysis over activity logs misses practice sessions entirely). The rest is speculative surface that misleads readers about system behavior.
- **Urgency:** Low. **Cost of delay:** Med — intent decays (the registry comments say "flip to true when the producer lands" but comments don't expire), and the practice-mode undercount widens daily.
- **Confidence:** High on producer absence; Low on intent (roadmap vs. dead — explicitly unknowable, discovery U-4/U-6/U-7).

---

## Testing debt

### TD-2 — Coverage topology inverted relative to code mass

- **Debt:** 41 test files exist, but their placement is inverted relative to where the code and risk are. Zero test files: `features/game` (20 files / 1,453 lines — score submission, leaderboards, personal bests), `features/ai` (22 / 1,022 — Gemini transport/parsing; only the output *schema* is tested, from `shared/`), `features/home`, `features/command-palette`. Near-zero: `features/flashcard` — the largest feature at 146 files / 16,940 lines — has **4** test files (two browser tests for form components, two unit tests for the speed-game engine); none of its 12+ services (`progress.service.ts` 335 lines, `comment.service.ts` 302, `lesson-save.ts`, `shared.service.ts` 251, `card.service.ts`…) has any test. The deck-sharing permission engine `resolveRole` (5-step resolution, owner→role→invite→public-cap→none) has zero direct tests — grep for `resolveRole`/`rbac` across all test files: 0 hits (rules-side behavior is covered by `firestore-rules.test.ts`, but the client/TS resolution that drives UI affordances and service guards is not). `features/kana`'s three large session hooks (`useDropMode` 367, `useKanaQuizSession` 319, `useSurvivalGame` 299) are untested (kana's 2 test files cover a chart cell and stroke-SVG fetching). E2E covers exactly two flows (`e2e/auth.spec.ts`, `e2e/realtime.spec.ts`); no game, sharing, study, or admin flow has an e2e path. By contrast, `notifications` (8 test files across domain/schema/actions), `shared/audio` (6), `shared/components/ui` (6 browser tests), and the Firestore rules (415-line suite) are well covered — the infrastructure for all four test tiers (unit/browser/emulator/e2e) exists and works.
- **Evidence (all verified):** full 41-file enumeration via `find … -name '*.test.*'` (per-feature counts: flashcard 4, admin 4, kana 2, notifications 8, game 0, ai 0, home 0, command-palette 0, user 1); `e2e/` contents; line sizes per `wc -l`; `resolveRole` at `features/flashcard/utils/rbac.ts:97-133` with zero test references; tier configs `vitest.config.ts` / `vitest.browser.config.ts` / `vitest.emu.config.ts` / `playwright.config.ts`.
- **Category:** Testing
- **Impact:** High — the untested mass is precisely the code the repo's own plans target for restructuring (the 44 over-ceiling files, TD-3, are to be "split … see R31/E11"), and it includes money-path logic (SRS progress, lesson save diffing, sharing permissions) where regressions are user-data-affecting and hard to notice.
- **Urgency:** Med — forced by any change activity; the declared file-splitting plan cannot proceed safely without a net, and every feature added to flashcard/kana grows the untested surface.
- **Cost of delay:** High — compounds twice over: new code in untested features inherits the topology, and the eventual refactors either proceed blind or must pay for characterization tests first, at a higher price than testing at write time.
- **Confidence:** High. (This measures test *existence* per area, not line coverage — no coverage tooling output exists in-repo to verify percentages; see §Insufficient evidence.)

---

## Performance debt

No independently rankable performance debt verified. Two observations, recorded for completeness rather than ranked:

- The admin dashboard's per-request live `count()` aggregations + full `admins` collection fetch are a *consequence* of TD-8 (the counters cache has no writer, so the "fallback" is the only path) and are costed there.
- The notifications grow-the-window pagination re-reads the entire window on every `loadMore` (50 → 100 → 150 …). This is billed-read amplification, but the code documents it as a deliberate correctness tradeoff against a stale-tail-cache bug (`features/notifications/services/notification-subscribe.ts:37-44`) — a recorded design decision, not unmanaged debt.
- Minor, verified, not ranked: no search-input debouncing anywhere (grep `debounce` matches only game-score persistence and an audio comment); all current search surfaces filter client-side arrays, so the cost today is negligible.

---

## Security debt

### TD-15 — Auth ID token in a JS-readable cookie (accepted risk, unrecorded)

- **Debt:** The Firebase ID token is mirrored into an `auth-token` cookie that is deliberately **not** httpOnly so the client SDK can refresh it; the proxy trusts its presence for route gating. This is documented at both write sites but exists as an accepted XSS-amplification risk (any script injection can exfiltrate a live ID token) with no ADR recording the decision, its alternatives, or its mitigations. Mitigations that *are* in place: `SameSite=Lax`, `Secure` on HTTPS, server actions independently re-verify the token (`verifyIdToken`), and comment content is escaped (`sanitizeCommentContent`).
- **Evidence (verified):** `proxy.ts:48` ("The cookie is NOT httpOnly so Firebase client SDK can refresh it seamlessly"); `shared/utils/cookie.ts:5-13` (deliberate, `SameSite=Lax`, conditional `Secure`); server-side re-verification per `lib/safe-action.ts:40-45`.
- **Category:** Security
- **Impact:** Med — the cookie is a bearer credential reachable from any XSS foothold; blast radius is bounded by the token's TTL and the server-side re-verification, but includes everything the user can do.
- **Urgency:** Low — no known injection vector in-repo (no `dangerouslySetInnerHTML` on user content found; comment escaping exists).
- **Cost of delay:** Low — persists rather than compounds.
- **Confidence:** High on facts; Medium on classifying it as debt rather than a settled tradeoff — the decision is documented in code comments but not in the ADR series where decisions of this weight otherwise live (`docs/adr/`), which is what keeps it reviewable.

Security-adjacent items ranked elsewhere: rules-vs-schema vocabulary drift (TD-1), triplicated public-access predicate (TD-9), untested `resolveRole` (TD-2), unwired `canChangeSettings` (TD-7). Admin-bootstrap provisioning (no `setCustomUserClaims` caller in-repo) is a production unknown (U-14), not ranked.

---

## Documentation debt

### TD-14 — Hosting decision unrecorded; localhost fallback feeds production-facing URLs

- **Debt:** The repository's **only** TODO marks that no hosting-platform decision has ever been recorded (it cites an "ADR-10" that does not exist — the ADR series stops at 003). `SITE_URL` falls back to `http://localhost:3000` and feeds `app/sitemap.ts`, `app/robots.ts`, `metadataBase` in the root layout, and user-visible share URLs in `SharedLessonPageClient`. If the app is deployed anywhere without `NEXT_PUBLIC_SITE_URL` set, every sitemap entry, OG URL, and copied share link is a localhost URL — silently.
- **Evidence (verified):** `lib/site.ts:1-5` (TODO + fallback; sole `TODO` hit in a marker sweep over `app/ features/ shared/ lib/ i18n/ scripts/ functions/src/ e2e/`); consumers `app/sitemap.ts:3,10`, `app/robots.ts:1,19`, `app/[locale]/layout.tsx:15,26`, `app/[locale]/(main)/flashcard/shared/[shareId]/SharedLessonPageClient.tsx:20,77`; `docs/adr/` contains only 001–003; no `vercel.json`, no `hosting` block in `firebase.json`.
- **Category:** Documentation (the artifact is a missing decision record; the code fallback is correct for dev)
- **Impact:** Med — wrong absolute URLs on every SEO/social/sharing surface in a mis-configured deploy, with no error raised.
- **Urgency:** Med — it gates the first correct production deploy; until decided, share-link copy features are building on a guess.
- **Cost of delay:** Low — does not compound in-repo. Cross-reference: production deployment state is U-1 (unknowable here).
- **Confidence:** High.

### TD-13 — Onboarding and env-var documentation absent; ADR index drifting

- **Debt:** (a) No `README.md` exists at repo root or in `src/`. (b) **30 distinct** `process.env.*` variables are referenced across the app and functions (Firebase client ×6, Admin ×3, Sentry ×3, PostHog ×2, AI tuning ×7, app-id ×2, site URL, emulator switches…), with no `.env.example`/`.env.sample` anywhere — the required environment is discoverable only by grep, and misconfiguration is silent by design (integrations are deliberately env-gated no-ops). (c) The docs index (`/docs/README.md`) lists ADR 001 and 002 but omits the existing `adr/003-feature-flags.md`. (d) ADR coverage stops at three subsystems (audio, data-layer, feature flags) while the subsystems where this assessment found the costliest ambiguity — the notifications platform migration end-state (TD-1), the two RBAC systems, the logging pipeline, AI transport, hosting (TD-14), the non-httpOnly cookie (TD-15) — have no decision record; most of discovery's 25 Known-Unknowns exist precisely because these decisions live nowhere.
- **Evidence (verified):** `ls` for READMEs (absent both levels); `find` for `*.example`/`*.sample` (none); env-var inventory via `grep -rhoE 'process\.env\.[A-Z_]+' … | sort -u` = 30 names; `/docs/README.md` contents vs `/docs/adr/` listing (003 present on disk, absent from index).
- **Category:** Documentation
- **Impact:** Med — onboarding cost and ops risk: a new environment stood up from the repo alone will silently lack monitoring, analytics, flags, or the correct site URL, and nothing states what "fully configured" means.
- **Urgency:** Low — current contributors evidently carry the knowledge.
- **Cost of delay:** Med — every new env var (the AI feature alone added 7) widens the undocumented surface; tribal knowledge decays with contributor turnover; unrecorded decisions keep regenerating known-unknowns.
- **Confidence:** High.

---

## Developer Experience debt

### TD-12 — Storybook toolchain carried for one story

- **Debt:** The full Storybook 10 toolchain is installed and wired — 7 runtime/dev packages (`storybook`, `@storybook/nextjs-vite`, `addon-a11y`, `addon-docs`, `addon-mcp`, `addon-vitest`, `@chromatic-com/storybook`) plus `eslint-plugin-storybook` (loaded into the flat config), two config files, and two npm scripts — for exactly **one** story (`Badge.stories.tsx`). The shared UI inventory it would document (29 `ui/` entries incl. `Button` at 256 lines) is unstoried; `addon-a11y` implies accessibility checks that in practice run against a single Badge.
- **Evidence (verified):** `package.json` devDependencies + `scripts.storybook`/`build-storybook`; `.storybook/main.ts`, `.storybook/preview.tsx`; `find` for `*.stories.*` = 1 file; `eslint.config.mjs:1,4,69` (storybook plugin + flat config).
- **Category:** Developer Experience
- **Impact:** Low-Med — dependency surface and upgrade toil (Storybook majors are heavy migrations) paid for capability ~0% utilized; the toolchain's presence also implies a component-documentation practice that doesn't exist, misleading newcomers.
- **Urgency:** Low. **Cost of delay:** Med — the packages age; each Storybook/Next major raises the cost of either adopting or removing it. Whether adoption is beginning or abandoned is unknowable from code (discovery U-23).
- **Confidence:** High on facts; Low on intent.

Also DX-relevant, costed elsewhere: permanent lint-warning noise from 44 over-ceiling files (TD-3); no cycle-detection or LOC tooling installed (TD-4).

---

## Production unknowns — cross-reference (not ranked as debt)

These are facts the repo cannot answer; they gate the *severity* of several ranked items but are not themselves code debt. Full statements in `/project-discovery/12-Known-Unknowns.md`.

| Unknown | Bears on | Why it isn't ranked here |
|---|---|---|
| U-1 hosting/production domain | TD-14 | Deployment/DNS/env are ops facts outside the repo |
| U-2 do legacy-shape notification docs still exist; did the backfill run | TD-1 | Data-state fact; determines when dual paths could ever be retired |
| U-3 live Remote Config values / template publication | — | Runtime state; code handles absence correctly |
| U-12 / U-13 is anything populating `analytics_daily` / `metadata/counters` in production | TD-8 | An out-of-repo pipeline may exist; only the live DB can tell |
| U-14 first-admin provisioning (no `setCustomUserClaims` caller in-repo) | Security posture | Bootstrap was done out-of-band; mechanism unknowable |
| U-15–U-18 Sentry DSN / PostHog key / Firebase project + credentials / AI Logic + App Check enablement | TD-13 | Env-gated integrations; production on/off state invisible |
| U-19 / U-20 functions deployment, Cloud Tasks queue, scheduler, indexes, TTL policy | TD-1 | The code is written to survive their absence; deployed state unknowable |
| U-4 / U-7 intent behind inactive kinds / unemitted actions | TD-6 | Roadmap-vs-abandonment is a product fact, not a code fact |

## Where evidence is insufficient

- **Accessibility:** No a11y audit was performed and none exists in-repo to verify against. Signals cut both ways (`aria-sort` implemented in `DataTableHeader.tsx`; `@storybook/addon-a11y` installed but effectively unused, TD-12). A11y debt is therefore **not claimed** — an actual audit would be required.
- **Line/branch coverage percentages:** No coverage reports are committed and none were generated for this assessment; TD-2 is based on test-file existence and placement, which is verifiable, not on coverage numbers, which are not.
- **Module-level cycles beyond the two found:** grep-based edge extraction (discovery 08 method) cannot see cycles routed purely through barrels or computed imports; no cycle-detection tool is installed to check (noted inside TD-4).
- **`analytics-drilldowns.ts` and admin query cost at scale:** reads are `limit()`-bounded (verified: 50/100/200-doc caps throughout), so no unbounded-scan claim is made; real cost depends on production data volume (unknowable).
- **Dead-code sweep completeness:** the unimported-file sweep (discovery U-25) and no-behavior-control scan (U-8) were spot-checked, not re-run in full; TD-7/TD-11 rely on targeted re-verification of their specific claims.

## Discrepancies vs discovery corpus

1. **Over-ceiling file count:** `eslint.config.mjs:60-61` says "~46 pre-existing files over the limit"; verified count at HEAD is **44** non-test files (45 including tests). The config comment, not discovery, is the stale figure; discovery did not state a count.
2. **Storybook package count:** discovery U-23 says "seven Storybook devDependencies"; there are 7 Storybook packages **plus** `eslint-plugin-storybook` (8 storybook-related devDependencies total). Immaterial to the ranking.
3. **New finding not in discovery:** `/docs/README.md` omits the existing `adr/003-feature-flags.md` from its ADR index (folded into TD-13).
4. Everything else re-verified exactly as discovery recorded it, including all import-cycle lines, the zero-consumer schema greps, the 8 producer-less `ActivityAction` members, the writer-less collections, the `type: input.kind` / `"digest"` writes, and the QuickActionsCard no-op buttons.
