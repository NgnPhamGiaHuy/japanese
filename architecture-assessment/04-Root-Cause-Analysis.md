# 04 — Root-Cause Analysis

**Architecture Assessment phase.** This document traces observed issues to their actual root causes. It evaluates and explains only — it proposes no fixes, libraries, or refactors.

- **Repo root:** `/Users/yuh.nguyenpham/GitHub/japanese`; Next.js project root `src/`. Paths below are relative to `src/` unless prefixed with `/`.
- **Method:** every issue was re-verified in the repository at commit `a0bbbc4` (2026-07-19) before being written up; the discovery corpus (`/project-discovery/`) was used as a map, the repo as the source of truth. Git history (138 commits, epic-tagged messages) is cited as evidence for how things evolved; commit messages are treated as observable facts about what changed, not as proof of intent.
- **Convention:** inside each issue, **Evidence** contains observations (file:line, grep results, commit citations); the **Root Cause** narrative is interpretation argued from that evidence, and it says so where evidence is insufficient.

## Summary table

| ID | Symptom (short) | Root cause (short) | Affected modules |
|---|---|---|---|
| RC-1 | `flashcard` ↔ `notifications` feature-level import cycle | Inbox UI renders a producing feature's domain action (invite decline) with no inversion point between "notification rendering" and "domain handlers" | features/flashcard, features/notifications |
| RC-2 | Stored notification `type` has 10 runtime values; declared union has 4 | July platform migration introduced a forward vocabulary (`NotificationKind`) with explicit "reconcile later" intent; reconciliation was never completed and no end-state was recorded | features/notifications, functions/src |
| RC-3 | Dual read/write paths, dual indexes, `@deprecated` fields, one-time backfill script all still live | Schema migration's retirement condition depends on an out-of-repo operational fact (whether the backfill ran in prod) that the repo has no way to record | features/notifications, firestore.indexes.json, scripts/ |
| RC-4 | Edge auth gate checks only cookie *presence*; the cookie holds a raw Firebase ID token and is JS-readable | Session management was bolted onto client-SDK-first auth as a cookie mirror; the client SDK must refresh the token, which structurally forbids httpOnly and leaves the Edge with nothing it can verify cheaply | proxy.ts, shared/utils/cookie.ts, features/user, features/admin |
| RC-5 | Admin analytics reads `analytics_daily` and `metadata/counters`, which no code writes; fallbacks fabricate zeros | Consumer-first construction of the admin surface against an aspirational aggregation pipeline whose producer was never built (in-repo or, as far as the repo shows, anywhere) | features/admin, functions/src (absence) |
| RC-6 | `cardContentSchema` claims to be "the single validation source of truth"; zero write paths use it | July validation epic landed the schema module at full aspiration but stopped adoption at the legacy call-site boundary (`validateAtomicCard`, primary-field-only) | shared/schemas, features/flashcard, features/ai |
| RC-7 | 7/16 notification kinds, 8/32 activity actions, 1/3 log sources declared but never produced | Vocabulary-first design convention: complete enums declared as "extension points" with no mechanism or record tying members to producers | features/notifications, lib/logging, features/admin |
| RC-8 | Kana Survival's four screens live under `app/`, its state machine under `features/kana` — unlike every sibling mode | Two coexisting placement conventions (feature module vs route-private `_components`) never reconciled; relocation epics touched neighbors and skipped survival | app/[locale]/(immersive)/kana/survival, features/kana |
| RC-9 | Shared-deck resolution (decode → fetch → access gate) implemented twice: client SDK and Admin SDK | The client-SDK-first data layer collided with the July SSR epic; no SDK-neutral domain module exists for share resolution, so the access predicate lives in three places | features/flashcard/services, firestore.rules |
| RC-10 | No in-repo way for the first admin to come to exist | Admin identity assumes an out-of-band provisioned superadmin (claims or `admins/{uid}` doc); that dependency was never captured as script, doc, or ADR | features/admin, firestore.rules, functions/src |
| RC-11 | Three coexisting write-path families with three different auth transports | Staged evolution: April client-SDK era → April admin cookie actions → July next-safe-action formalization that preserved (rather than unified) both server transports for compatibility | features/*/services, features/*/actions, lib/safe-action.ts, lib/logging |
| RC-12 | `lib/logging` (infrastructure) imports types from `features/admin` (a consumer) | Log types were born in the admin viewer (April) before the pipeline was centralized into `lib/` — the pipeline moved, the vocabulary's home didn't | lib/logging, features/admin |

---

## RC-1 — `flashcard` ↔ `notifications` feature-level import cycle

**Symptom**
The only feature-level dependency cycle in the codebase: `features/flashcard` imports from `features/notifications` at 3 sites, and `features/notifications` imports back from `features/flashcard` at 1 site. Neither feature can be understood, tested, or extracted without the other.

**Root Cause**
The forward edges are inherent to a notification system (producers emit). The *backward* edge exists because the notifications inbox renders a domain action belonging to the producing feature: `InviteActions.tsx` — the accept/decline buttons on an invite notification — calls `declineInviteAction` from flashcard's access domain. The notifications platform (built July 2026) provides an inversion point on the *write* side (the registry maps kinds to policy; producers call a neutral `emitNotification` facade) but no equivalent inversion on the *render/act* side: there is no registry mapping a notification kind to its action handler, so the inbox component must import the handler directly from the feature that owns it. The cycle is therefore not accidental sloppiness but a missing half of the platform's abstraction — the platform decoupled emission and deliberately did not decouple action handling.

**Evidence**
- Forward: `features/flashcard/components/ShareModal.tsx:12`, `features/flashcard/services/comment.service.ts:29`, `features/flashcard/services/access.service.ts:11` — all import `emitNotification`/`notifyInvite` from `@/features/notifications/services` (grep verified 2026-07-19).
- Backward: `features/notifications/components/InviteActions.tsx:8` — `import { declineInviteAction } from "@/features/flashcard/actions/access.actions"`.
- The write-side inversion exists: `features/notifications/services/notify.ts` ("Client facade producers call… Single call site so wiring a new producer is one line"); `domain/registry.ts:1-13` ("Adding a notification type = adding ONE entry here").
- Git: both halves landed together in `ca8a654` (2026-07-11, "feat(notifications): server-authoritative notification platform") — the same commit that created `notification.actions.ts` also created `features/flashcard/actions/access.actions.ts` (+56 lines) with `declineInviteAction` as its only export, whose only caller is `InviteActions.tsx` (verified: `08-Dependency-Graph.md` §5.1; re-grepped).
- At the individual-module level there is no cycle among the four files (each direction goes through different modules); the cycle exists at the feature-directory level only.

**Affected modules**
`features/flashcard` (ShareModal, comment.service, access.service, actions/access.actions), `features/notifications` (services barrel, InviteActions).

**Business impact**
None visible to users today. The cost is organizational: any attempt to version, extract, or independently own either feature (e.g. reusing the notification platform for another app, as its Firebase-free `domain/` layer suggests someone wanted) is blocked by the inbox's dependency on flashcard internals.

**Technical impact**
- Feature boundaries are advisory, not real: a change to `access.actions.ts`'s signature ripples into notifications' components.
- Build-graph and test isolation degrade — mocking one feature's barrel in the other's tests must account for the back edge.
- The cycle is invisible to module-level tooling (it only appears at directory granularity), so it will not be caught mechanically if it grows.

**Risk if unchanged**
Each new actionable notification kind (the registry declares 7 inactive kinds, several of which — `deck_updated`, `privacy_changed` — would plausibly carry actions) adds another backward import, hardening the cycle from one edge into a lattice. The longer it stands, the more the two features converge into a de-facto single module while still presenting as two.

---

## RC-2 — Notification type-vocabulary drift (10 stored values vs a 4-value union)

**Symptom**
`AppNotification.type` is declared as `NotificationType = "invite" | "comment" | "reply" | "role_change"` (4 values), but the codebase itself writes 10 distinct values into that field: the 7 kinds the server action schema accepts (`comment`, `reply`, `comment_resolved`, `invite_accepted`, `role_change`, `access_revoked`, `deck_duplicated`), plus `content_removed` (server-internal), `invite` (client-written pending path), and `digest` (Cloud Function). The compile-time type is a lie about runtime data produced by the same repository.

**Root Cause**
A deliberate but unfinished two-vocabulary migration. The April-era notification system (commit `725633b`, 2026-04-14) established the 4-value `NotificationType`. The July platform rebuild (`ca8a654`, 2026-07-11) introduced `NotificationKind` — a 16-value "FORWARD superset the platform is built around" — and stated in code that "the two are reconciled as producers migrate" (`domain/events.ts:11-15`). The server writer was pointed at the new vocabulary immediately (`type: input.kind`), but the declared document type, the Firestore rules validation, and the icon switch were left on (or straddling) the old one. The reconciliation's end state — retire `NotificationType`, widen it, or keep both — was never recorded anywhere (no ADR, no TODO with a target), so the migration has no defined completion condition. Git history shows no commit since `ca8a654` touching the union. This is a code fact plus one unrecorded design decision; whether reconciliation is still intended is not answerable from the repo (see `12-Known-Unknowns.md` U-5, confirmed in-repo).

**Evidence**
- `features/notifications/types/index.ts:5` — 4-value union; `:47` — `AppNotification.type: NotificationType`.
- `features/notifications/actions/notification.actions.ts:209` — `type: input.kind` (writes any schema-accepted kind); `schema.ts:74-82` — 7-kind discriminated union; `notification.actions.ts:170-189` — `notifySystemEvent` writes `content_removed`.
- `features/notifications/services/notification-pending.ts:26-37` — client-written pending invites (stored `type: "invite"`, the only client-create path; rules-validated at `firestore.rules:39-41,181-190`).
- `functions/src/digest.ts:82` — `type: "digest"`, outside *both* vocabularies; `digest.ts:138` even filters on it.
- `features/notifications/components/NotificationIcon.tsx:6-46` — switches on `type: string` (not the union), covering 9 kinds + a default branch that silently absorbs `digest` and anything else.
- `domain/events.ts:11-15` — "the legacy 4-value union still describes stored documents… the two are reconciled as producers migrate."
- Git: `git log --follow -- src/features/notifications/types/index.ts` → union created `725633b` (2026-04-14), platform superset added `ca8a654` (2026-07-11), no reconciliation commit since (latest touches are mechanical refactors `489312a`, `348c484`).

**Affected modules**
`features/notifications` (types, schema, actions, components), `functions/src/digest.ts`, `firestore.rules` (validates the 4-value set only on the pending-invite path).

**Business impact**
Low today — the UI degrades gracefully (default icon). The latent product risk is misrendering or misfiltering of notification categories if any code starts trusting the declared union (e.g. an exhaustive `switch` on `NotificationType` would silently drop 6 of the 10 real values).

**Technical impact**
- TypeScript's exhaustiveness checking — the main safety tool for discriminated unions — is unavailable/false on the field where it matters most.
- Every consumer must know, tribally, that `type` is wider than its type; `NotificationIcon` already codes to `string` as a workaround.
- Rules-level validation (`isValidNotificationType`) and TS-level validation disagree with each other and with the writer, so the "what is a valid notification" question has three inconsistent answers.

**Risk if unchanged**
Each new active kind (7 more are pre-declared in the registry) widens the gap. New contributors reading `types/index.ts` will design against a 4-value world; the first exhaustive match or analytics group-by on `type` written from the declared union will be wrong in a way no tool flags.

---

## RC-3 — Migration-era dual read/write machinery pinned in place by an unknowable data state

**Symptom**
The notifications feature permanently carries both halves of a schema migration: four `@deprecated` fields (`deckId`, `deckTitle`, `link`, `read`); an `isUnread()` helper with a legacy fallback; every write dual-writing `status: "unread"` *and* `read: false`, `data.shareLink` *and* `link`; `markAllAsRead` running two queries (legacy `read == false` and current `status == "unread"`); two composite indexes for the same question; and a one-time backfill script still in `scripts/`.

**Root Cause**
The July migration was correctly staged (new schema, dual-write, backfill script, then retire), but the retire step is gated on an operational fact the repository cannot observe or record: whether `scripts/backfill-notifications.mjs` was ever run with `--commit` against production. The code says this explicitly — "Once scripts/backfill-notifications.mjs has run in prod (stamping `status` on every doc), drop the `read` query + its (read,isDeleted) index and the legacy `read` dual-write below." No deployment log, migration ledger, or ADR records execution, so no maintainer can safely delete the compatibility machinery, and the transitional state has become the permanent state. The root cause is not the migration design (which is sound) but the absence of any in-repo mechanism for recording that a data migration completed.

**Evidence**
- `features/notifications/types/index.ts:71-81` (`@deprecated` block, "Kept for existing Firestore docs"), `:104-109` (`isUnread` legacy fallback).
- `features/notifications/actions/notification.actions.ts:219,223-224` — writer emits `link`, `status`, and `read: false` ("keep legacy field in sync" appears at the mark-read site).
- `features/notifications/services/notification.service.ts:51-52` (dual-write on mark-read), `:59-63` (the TRANSITIONAL comment quoted above, naming the retirement condition), `:68,75` (dual unread queries), `:99-101` (dual-write in mark-all).
- `firestore.indexes.json:39,47,55` — both a `read+isDeleted` and a `status+isDeleted` index exist for `notifications`.
- `scripts/backfill-notifications.mjs:1-40` — "One-time backfill… DRY RUN BY DEFAULT"; whether it ran is a data-state fact (`12-Known-Unknowns.md` U-2, confirmed).
- Git: all of this machinery arrived in `ca8a654` (2026-07-11); five subsequent notification-touching commits (`9527089`, `c067b60`, `489312a`, `b4204dd`, `348c484`) refactored around it without retiring any of it — 8 days and an entire refactor program later, the transitional state is intact.

**Affected modules**
`features/notifications` (types, services, actions), `firestore.indexes.json`, `scripts/backfill-notifications.mjs`, `functions/src/digest.ts` (must also write the dual shape or produce legacy-invisible docs).

**Business impact**
None directly; the dual machinery is what *protects* users from a rendering split (legacy docs invisible to the primary query — the `!=` field-existence trap the backfill header describes). The cost is velocity: every notifications change pays a two-schema tax.

**Technical impact**
- Every reader/writer must handle two document shapes forever; new code (the digest function) had to adopt the dual conventions to be safe.
- Index count, rules complexity, and test surface are all doubled for read-state.
- The `@deprecated` markers point at replacements but cannot be acted on, training readers to ignore deprecation notices.

**Risk if unchanged**
The compatibility code outlives all context: eventually no one will know whether legacy docs still exist, making removal feel dangerous forever (this is already true — the repo cannot answer it today). Conversely, someone "cleaning up" the seemingly redundant `read` dual-write without confirming the backfill ran would silently hide pre-migration notifications from users.

---

## RC-4 — Presence-only cookie gate in `proxy.ts` over a JS-readable raw ID token

**Symptom**
The Edge auth gate admits any request whose `auth-token` cookie merely *exists* — no signature check, no expiry check (`const token = request.cookies.get(COOKIE_NAME)?.value; if (!token && !isPublic) … redirect`). The cookie's value is a raw Firebase ID token, deliberately not `httpOnly` (readable by any injected script), set with `max-age` 7 days while the token inside it is only valid for ~1 hour.

**Root Cause**
The auth architecture is client-SDK-first: Firebase's browser SDK owns sign-in, persistence, and hourly token refresh (`onIdTokenChanged` → `setAuthCookie(token)`). The cookie exists only as a *mirror* so that (a) the Edge proxy has some routing signal and (b) admin server actions have a token transport. Because the refresh loop runs in client JS, the cookie structurally cannot be `httpOnly` — the code documents this as intentional twice ("Intentionally not httpOnly: the Firebase client SDK refreshes this token", `cookie.ts:5-6`; same at `proxy.ts:48`). And because Firebase ID-token verification requires Google's rotating public keys (a fetch + JWT verify the middleware never does), the proxy is left with presence as its only cheap predicate. The alternative design — Firebase *session cookies* minted server-side (httpOnly, Edge-verifiable) — was never adopted; nothing in the repo records that it was considered. April origin: cookie-based gating arrived in `fa99063` (2026-04-19, "feat: use cookie-based auth…"); the July security pass (`afdc948`, 2026-07-03) *hardened within the design* (added `Secure`, stopped credential logging) rather than changing it — evidence the presence-only property is a conscious trade-off of the mirror architecture, not an oversight.

**Evidence**
- `proxy.ts:81` (presence read), `:87-97` (redirect logic), `:43-48` (docstring: "Reads the `auth-token` cookie… NOT httpOnly so Firebase client SDK can refresh it").
- `shared/utils/cookie.ts:1-15` — raw token in cookie value, `MAX_AGE = 60*60*24*7`, `SameSite=Lax`, `Secure` only on https.
- `features/user/hooks/useFirebaseAuth.ts:46-53` — `onIdTokenChanged` → `getIdToken()` → `setAuthCookie(token)`.
- Real authorization does not rest on the gate: every server action re-verifies (`lib/safe-action.ts:40-45` `adminAuth.verifyIdToken`; `features/admin/services/admin.service.ts:51-56` `assertAdminAction` reads the same cookie but verifies it), and Firestore rules gate client SDK reads/writes. Verified: no server code trusts the cookie without `verifyIdToken`.
- Git: `befcd83`/`0ddb6b6` (2026-04-12/13) middleware origins; `fa99063` (2026-04-19) cookie auth; `afdc948` (2026-07-03) hardening commit message quoted above.

**Affected modules**
`proxy.ts`, `shared/utils/cookie.ts`, `features/user/hooks/useFirebaseAuth.ts`, `features/admin/services/admin.service.ts` (cookie as admin-action transport), all `(main)`/`(immersive)` routes (gated surface).

**Business impact**
The route gate itself is UX, not security — the worst a forged cookie yields is seeing a page shell whose data calls all fail. The real exposure is different: because the session credential is JS-readable, **any XSS anywhere in the app exfiltrates a live Firebase ID token**, which grants the attacker everything the user can do — including, for an admin's browser, every admin server action (the admin transport is this same token). The app's XSS surface is small (React + an escaping sanitizer at `comment-validation.ts:28-35`) but the blast radius of a single miss is total account takeover for one hour per stolen token, renewable while the victim's tab stays open.

**Technical impact**
- Two sources of truth for "signed in" (SDK state vs cookie presence) that can disagree: a cookie can outlive token validity by ~7 days minus an hour, producing users who pass the proxy but fail every server call; `AuthGate` + per-page redirects exist partly to paper over this.
- The public-path allowlist is duplicated between `proxy.ts:9-18` and `lib/providers.tsx` (`PUBLIC_ROUTE_PATTERNS`, mirroring stated in its comment) and must be maintained in lockstep by hand.
- Defense-in-depth at the Edge is zero; everything rides on per-action verification being remembered forever.

**Risk if unchanged**
Any future server-rendered page that reads the cookie and *forgets* to verify (the pattern `assertAdminAction` makes easy to get right but nothing makes hard to get wrong) becomes a data-exposure bug with no second gate behind it. The XSS-to-token pipeline stays open permanently, and its severity grows with every privilege added to admin actions.

---

## RC-5 — Read-but-never-written analytics collections with hardcoded-zero fallbacks

**Symptom**
The admin dashboard and analytics surfaces read from `analytics_daily` (twice) and `metadata/counters` (once) — collections that **no code in the repository writes**: not the app, not `functions/src/`, not `scripts/`. Every reader carries a fallback that fabricates data: a single zeroed base row for charts, `newUsers: 0` and `featureUsage: {flashcards: 0, kana: 0, matching: 0}` in the export, and `activeUsersToday / totalSessions / errorRate = 0` on the stat cards.

**Root Cause**
The admin analytics surface was built consumer-first, in April, against a data contract — nightly pre-aggregated snapshots and a counters cache — whose producer was deferred and then never built. The April admin sprint (`36d3931` → `04b5e06` → `af80991`, 2026-04-18 to 04-23, "log-driven analytics and admin UI improvements") created readers, charts, drilldowns, and an export flow in five days; a producer would have required a scheduler, and the project had no server compute at all until the Cloud Functions package arrived **three months later** (`7bd2256`, 2026-07-17, E14-T2) — and that epic built notification digest/fan-out, not analytics aggregation. The fallbacks were written defensively from day one (one is even commented "Only use real values from cache — never fabricate activity metrics" — fabricating zeros instead), which made the missing pipeline *silent*: the dashboard renders plausibly with or without it, so nothing ever forced the producer to exist. Whether an out-of-repo job populates these collections in production is unknowable from code (`12-Known-Unknowns.md` U-12/U-13, confirmed); what is knowable is that this repo, deployed alone, has a permanently zeroed analytics surface.

**Evidence**
- Readers: `features/admin/services/analytics.service.ts:27-48` (reads `analytics_daily`, fabricates the zeroed base row at 36-48); `features/admin/actions/admin.actions.ts:273-299` (`exportAnalyticsAction`, hardcoded `newUsers: 0`, zeroed `featureUsage` at ~291-297); `features/admin/services/user.service.ts:63-115` (`metadata/counters` cache; zeros at 96-104).
- Writers: repo-wide grep for `analytics_daily` → 3 hits, all readers; only reference to a `metadata` collection is the reader (`user.service.ts:65`). `functions/src/` exports exactly three bindings, none analytics (`functions/src/index.ts`; digest/fanout only).
- Consumers of the zeros: `features/admin/components/dashboard/AdminOverviewPage.tsx` stat cards + `SystemHealthCard` ("Active users today", "Error rate").
- Git: readers born `36d3931`/`04b5e06` (2026-04-18); `git log --follow` on `analytics.service.ts` shows only splits/refactors since (E11-T3) — no writer was ever added in the file's entire history.
- Related same-cause evidence: the admin surface has other consumer-first artifacts — three Quick Action buttons with no handlers (`QuickActionsCard.tsx:21-41`) and an explicitly stubbed Settings page whose `canChangeSettings` permission no action ever declares (verified by grep).

**Affected modules**
`features/admin` (analytics.service, user.service, admin.actions, dashboard/analytics components), `functions/src` (by absence).

**Business impact**
An operator reading the deployed dashboard sees "Active users today: 0", "Error rate: 0%", and flat charts and **cannot distinguish a healthy-but-unmeasured system from a dead one**. Export files present fabricated zeros as data. Any operational decision made from this surface is made from fiction.

**Technical impact**
- The data contract (`analytics_daily` doc shape, counter field names) exists only implicitly in reader code; a future producer must reverse-engineer it from fallbacks.
- Fallback logic and real logic are interleaved, so the readers can't be tested against realistic data without first inventing the writer.
- The pattern normalizes phantom contracts: readers referencing collections nothing writes passes review here.

**Risk if unchanged**
The dashboard's credibility silently decays to zero — worst case, someone eventually notices metrics never move and, worse, discovers others had been trusting them. If an out-of-band producer *is* someday added (console script, scheduled job), nothing validates it matches the shape the readers infer, and the field-existence-sensitive fallbacks (`typeof cached.totalUsers === "number"`) will mask partial mismatches indefinitely.

---

## RC-6 — Unenforced schemas: `card.schema.ts`'s claims vs `validateAtomicCard` reality

**Symptom**
`shared/schemas/card.schema.ts` opens by declaring itself "the single validation source of truth shared by client forms (LessonBuilder, via @hookform/resolvers), server actions, and runtime parsing of AI/import output." In fact `cardContentSchema` has **zero non-test consumers**; every real write path (lesson save, CSV/text import parsing, all three AI generation paths) validates with `validateAtomicCard`, which checks only the `primary` field. The schema's constraints on `meaning` (required, ≤500), `example`, `hint`, `usageNote`, `mnemonic`, `difficulty` literals, and the cloze `___` token rule are enforced **nowhere**. The sibling `privacyModeSchema`/`publicRoleSchema` (`lesson.schema.ts:33,35`) likewise have zero consumers despite a comment claiming the public-role cap is "enforced by the enum itself."

**Root Cause**
The July validation epic (`8fd3f2f`, 2026-07-16, "feat: schema-driven validation, react-hook-form, next-safe-action") was an adoption wave that stopped at a deliberately drawn compatibility line. It wired zod end-to-end where the surface was new or small (2 `useForm` sites, comment content, notification inputs, log inputs, server-action `.inputSchema()`s) but explicitly preserved the pre-existing card validation call sites: `card.schema.ts:25-27` says the rule check is "kept as a plain testable function… to reuse from the legacy `validateAtomicCard` call sites **unchanged**." The epic upgraded the *implementation* under the legacy entry point (the header notes `validateAtomicCard` "was a no-op stub" before — the epic made it real) but never migrated the call sites to the full schema, and never revised the header's aspirational claim to match what was actually adopted. The result is documentation asserting the intended end state as if it were the current state. Whether full adoption is still planned is unrecorded and unknowable (`12-Known-Unknowns.md` U-10/U-11, confirmed).

**Evidence**
- Claim: `shared/schemas/card.schema.ts:1-5` (header), `:63-80` (`cardContentSchema` with the unenforced constraints).
- Reality: repo-wide grep for `cardContentSchema` → no imports outside `shared/schemas/` + tests. Actual write-path validators: `features/flashcard/services/lesson-save.ts:61`, `features/flashcard/utils/parser.ts:147`, `features/ai/services/gemini.service.ts:39,86,132` — all `validateAtomicCard` (primary-only; `shared/utils/atomicCard.ts` delegates to `checkAtomicPrimaryViolations`).
- The compatibility line, in the schema's own words: `card.schema.ts:25-27`.
- `shared/schemas/lesson.schema.ts:28-35` — enum schemas + "enforced by the enum itself" comment; grep shows zero consumers, while the *same file's* `shareInviteSchema` and `lessonMetadataSchema` are genuinely consumed (`useShareInvites.ts:10,31`; `useLessonBuilder.ts:12,61`; `lesson-save.ts:14,54`) — proving the epic's partial-adoption shape within a single module.
- Git: `8fd3f2f` (2026-07-16) is the sole commit introducing these schemas; no subsequent adoption commits exist.

**Affected modules**
`shared/schemas` (card, lesson), `features/flashcard` (lesson-save, parser, LessonBuilder import path), `features/ai` (gemini.service), Firestore data quality downstream.

**Business impact**
Cards violating every non-primary rule — empty meanings, 10,000-character examples, malformed cloze templates — save successfully today, from manual entry, CSV import, and AI output alike. Cloze study mode's correctness depends on a `___` token invariant that nothing checks at write time.

**Technical impact**
- Two validation vocabularies for one entity: readers of the schema believe constraints exist that don't; readers of the services see the real, narrower rule.
- The schema module accrues test coverage (its tests pass) that validates nothing about the product.
- Firestore rules can't compensate: card writes are client-SDK writes whose rules don't re-implement these content constraints.

**Risk if unchanged**
The gap is self-widening: new fields will be added to the schema (the natural home) without anyone noticing the schema is decorative, while data quality drifts. The first feature that *trusts* a schema constraint at read time (e.g. rendering cloze by splitting on the single `___`) becomes a runtime bug seeded by writes that were never validated.

---

## RC-7 — Dormant notification/activity vocabularies (declared, never produced)

**Symptom**
Three vocabularies carry substantial dead weight, verified by producer grep: 7 of 16 `NotificationKind`s are registered `active: false` with no producer anywhere; 8 of 32 `ActivityAction` members (`DECK_SHARED`, `DECK_UNSHARED`, `CARD_CREATED/UPDATED/DELETED`, `SHARE_INVITE_SENT/REVOKED`, `KANA_PRACTICE_COMPLETED`) are never emitted; `LogSource` declares `"cloud_function"` but no Cloud Function writes `system_logs` at all (the functions package logs only via `firebase-functions/logger`).

**Root Cause**
A vocabulary-first design convention applied consistently across three subsystems: declare the *complete* intended vocabulary up front as an extension point, wire producers later. The notifications registry says so verbatim ("Planned kinds are declared (so the registry is complete) but not yet wired — flip to true when the producer lands"); the enum header claims authority ("All logging calls across the system MUST use these constants") without claiming completeness of wiring. The convention is coherent — but it comes with no mechanism distinguishing "not yet wired" from "no longer planned," no dates, no roadmap references, and comments don't expire. One member is demonstrably an *omission* rather than a plan: the kana practice route exists and completes sessions, and its two sibling modes (quiz, survival) log their completion actions, while practice never logs `KANA_PRACTICE_COMPLETED` — an asymmetry no comment explains. For the rest, intent is a product-roadmap fact the repo cannot answer (`12-Known-Unknowns.md` U-4/U-6/U-7, all confirmed by fresh greps).

**Evidence**
- `features/notifications/domain/registry.ts` — grep: 7 × `active: false`, 9 × `active: true`; forward-looking comment at `:27-30`.
- `lib/logging/actions.enum.ts:12-37` — the 8 unproduced members; grep over `app features lib` for each symbol and raw string → zero producers (re-verified 2026-07-19); the other 24 each have ≥1 producer.
- `features/admin/types/log.types.ts:4` + `lib/logging/schema.ts:3` — `"cloud_function"` declared twice; grep of `functions/src/` → no `system_logs` reference; `lib/logging/public.ts:38-43` normalizes unknown sources to `"server"`, so the member is unreachable in practice.
- Asymmetry: `app/[locale]/(immersive)/kana/practice/page.tsx` exists; `features/kana/actions/activity-log.actions.ts` exports only `logKanaQuizCompleted`/`logKanaSurvivalCompleted`.
- Git: the enum arrived with the April logging wave (`af80991`/`4406014`/`49d6a22`, 2026-04-23); the July logging consolidation (`bbd1534`, E17-T4) reworked the write path without pruning or wiring the dormant members — one full cleanup program passed over them.

**Affected modules**
`features/notifications/domain`, `lib/logging`, `features/admin` (log viewer renders sources/actions incl. impossible ones), `features/kana` (missing practice logging).

**Business impact**
Minor but real: an admin filtering audit logs believes card-level edits, share events, and kana practice are audited — they are not. Any compliance-flavored claim resting on "the audit log" overstates coverage by these 8 actions.

**Technical impact**
- Vocabulary size misrepresents system capability to every reader; exhaustive handling (icons, badges, filters) is written and tested for members that cannot occur.
- Dead members shield typos: a producer emitting a *new* raw string would be caught, but wiring the wrong existing constant would not.
- The `active` flag exists only in notifications; the other two vocabularies have no machine-readable liveness marker at all, so this analysis required per-member greps — as will every future audit.

**Risk if unchanged**
The declared/actual gap grows with each roadmap change that never circles back. Eventually the vocabularies function as misinformation: new code will emit `DECK_SHARED` believing it joins an existing stream, or build preference UI for notification kinds that can never arrive, with no signal that they are first-in-history rather than one-of-many.

---

## RC-8 — Kana Survival's screens live under `app/`, its logic under `features/`

**Symptom**
Survival is the only kana mode split across layers: its four screens (`SurvivalSetupScreen`, `SurvivalQuizScreen`, `SurvivalDropScreen`, `SurvivalGameOverScreen`) sit in `app/[locale]/(immersive)/kana/survival/_components/`, while its state machine (`useSurvivalGame`, 299 lines) and drop-mode logic (`useDropMode`, 367 lines) sit in `features/kana/hooks/`. Every sibling mode — quiz, learn, practice, chart, hub — owns both its screens and its hooks inside `features/kana/<mode>/`.

**Root Cause**
Two placement conventions coexist in this codebase and were never reconciled for this one surface. Convention A (dominant): feature modules own everything, routes are thin re-exports. Convention B (legitimate in Next.js): route-private components live in a co-located `_components/` directory — used by `app/_components/`, `(main)/_components/`, and `notifications/_components/`. Survival's screens were born route-side during the April sprint and, unlike its *hooks* (which were extracted to `features/kana` as they grew), the screens were never moved. Both major relocation passes explicitly moved *other* things and skipped these files: `9e1893f` (2026-07-03, "relocate store, shared game ui, and the game engine into their owning features") and `348c484` (2026-07-18, E17-T8, "extract HomePage/useEditableLesson, relocate notifications"). Later epics repeatedly *modified* the survival screens in place (i18n `14b0949`, dead-code sweep `8a8cfe7`, E17-T6 `1664956`), demonstrating they were seen and worked on — the placement survived at least four deliberate passes. Whether that is a considered application of Convention B ("single-route screens stay route-private") or drift is unrecorded; the inconsistency with quiz — also a single route, screens feature-side — argues drift, but the intent question cannot be settled from the repo.

**Evidence**
- `ls app/[locale]/(immersive)/kana/survival/_components/` → the 4 screens; `features/kana/` has no `survival/` directory; `find features/kana -iname '*survival*'` → only `hooks/useSurvivalGame.ts`.
- The screens are not thin: `SurvivalQuizScreen.tsx` imports feature internals from three features (`@/features/game/components`, `@/features/kana/components`, `@/features/kana/hooks`) — it is feature UI hosted in the route layer.
- Contrast: `features/kana/quiz/` contains `components/` + `hooks/`; the route `app/[locale]/(immersive)/kana/quiz/page.tsx` is a consumer.
- Git: `git log --follow` on the survival directory shows continuous in-place edits from the April era through E17-T6 (2026-07-18) with no relocation.
- Dependency-graph consequence: these files are why `app → game` edges exist at all (`08-Dependency-Graph.md` §1.2, verified: `(immersive)/kana/survival/_components/*` are the app→game importers).

**Affected modules**
`app/[locale]/(immersive)/kana/survival/`, `features/kana`, `features/game` (imported from the route layer).

**Business impact**
None functional. The cost is purely organizational/maintainability.

**Technical impact**
- The stated architecture ("features own their UI; app is a thin route layer") has a standing counterexample, weakening it as a review criterion — anyone placing new screens route-side can point at survival.
- Kana-wide changes (design sweeps, i18n extraction, shared-component adoption) must remember to look in two trees; the survival screens' membership in "the kana feature" is invisible to any `features/kana`-scoped search or tooling.
- Cross-feature imports from the route layer (`app → features/game`) exist only because of these files, muddying the dependency graph's layering story.

**Risk if unchanged**
Low and static in code terms — but each new contributor infers the placement rule from examples, and the examples disagree. Expect further Convention B/A drift on future modes, and continued double-maintenance on kana-wide passes (the i18n and design epics already paid this tax once each).

---

## RC-9 — Shared-deck resolution duplicated across client SDK and Admin SDK

**Symptom**
The "resolve a share link to a deck" operation is implemented twice with no shared code: `features/flashcard/services/shared.service.ts` (`getSharedLesson`, client SDK — decode shareId → fetch lesson → invite auto-conversion → access gate → cards+progress merge → `resolveRole`) and `features/flashcard/services/shared-preview.service.ts` (`getPublicSharedLessonPreview`, Admin SDK, server-only — decode shareId → fetch lesson → access gate → preview projection). The critical access predicate — `isPublic || allowLinkAccess` — is hand-written in both, and a third time in `firestore.rules` (`isPublicLesson()`), three copies that must agree for the security model to hold.

**Root Cause**
A structural collision between two commitments. First, the data layer is client-SDK-first by explicit decision: ADR-002 (2026-07-16) keeps authoritative reads client-side on `onSnapshot`/client `getDoc`, under Firestore rules. Second, the July SEO epic (E10-T1 `a7963ea`, 2026-07-17, "server-render the public shared-deck page") required the *same resolution* to run during SSR — where the client SDK cannot go, and where the Admin SDK (which bypasses rules) must re-implement the access check the rules would have enforced. The codebase has no SDK-neutral home for share-resolution *domain logic* (decode → gate → project); `shareToken` encode/decode is shared (`shared/utils/shareToken`), but the gate and projection are not. The duplication is conscious and documented — `shared-preview.service.ts:5-15` explains the bundle-isolation reason ("Deliberately separate… must never leak the client SDK's module-scope init into a server bundle") — but the documented reason justifies *two files*, not *two implementations of the predicate*. The root cause is that the trust-boundary split was solved at the file level without extracting the pure logic both sides need.

**Evidence**
- `features/flashcard/services/shared.service.ts:144-256` — full client resolution; gate at `const linkAccess = lesson.allowLinkAccess || lesson.isPublic` and the four-way access check.
- `features/flashcard/services/shared-preview.service.ts:55-91` — Admin resolution; gate at `:76` `if (!data.allowLinkAccess && !data.isPublic) return null`; header `:5-15` (deliberate-separation rationale).
- `firestore.rules` `isPublicLesson()` (~:28-31) — third copy: `lessonData.isPublic == true || lessonData.allowLinkAccess == true`.
- Both files re-derive the path (`artifacts/{APP_ID}/users/{ownerId}/lessons/{lessonId}`) independently (client via `doc(db, …)` at `shared.service.ts:152`, admin via chained `.collection()` at `shared-preview.service.ts:64-71`).
- Git: `shared.service.ts` history runs from the April sharing era (`3413d46`/`2b35a6c`); `shared-preview.service.ts` was created in `a7963ea` (2026-07-17) — the duplication is 2 days old at assessment time and was born fully formed with the SSR epic.

**Affected modules**
`features/flashcard/services` (both files), `app/[locale]/(main)/flashcard/shared/[shareId]/` (page + metadata + OG image consume the preview), `firestore.rules`.

**Business impact**
The invariant "private decks are never exposed" now depends on three hand-synchronized predicates. A future privacy tier (e.g. "unlisted", "org-only") that updates two of the three copies produces either a data leak (server preview renders a deck the rules would deny) or a ghost 404 (client grants what SSR denies) — both user-facing trust failures on the app's only public/SEO surface.

**Technical impact**
- Semantic drift between the copies is already visible in embryo: the preview intentionally excludes invite-only resolution while the client path includes it — correct today, but the *difference* lives only in prose comments, not in shared code that could make it explicit.
- The Admin-SDK copy operates rules-free, so nothing behind it catches a gate bug; tests must cover the predicate separately per copy (and the rules copy is tested in a third harness, `firestore-rules.test.ts`).

**Risk if unchanged**
Every future server-rendered surface that touches lesson access (more SEO pages, OG variants, feeds) will clone the Admin-side gate again — `listPublicSharedLessonUrls` in the same file already adds a fourth, subtly different predicate (`isPublic` only, deliberately). The predicate family grows with no single point of truth, and the probability that one privacy-model change misses a copy approaches certainty.

---

## RC-10 — Admin bootstrap has no in-repo mechanism

**Symptom**
Admin authority is recognized from two sources — custom claims (`decoded.superadmin`/`decoded.admin`) or an `admins/{uid}` Firestore doc — but the repo contains no way to create the *first* one: no code calls `setCustomUserClaims` (repo-wide grep: zero; the only `customClaims` references are reads), client writes to `admins/{uid}` are `allow write: if false`, and the only server writer (`setAdminRole`) is reachable solely through an action requiring `canPromoteUsers` — a permission held only by an already-existing superadmin.

**Root Cause**
The admin subsystem was designed from its first commit (April 18) around an assumed pre-existing privileged identity, and the assumption was never discharged. Circular grant chains are the *correct* end-state for RBAC (only superadmins mint admins); the missing piece is the bootstrap escape hatch — a provisioning script, a documented `gcloud`/console procedure, or a first-run path — and *none* was ever committed. The repo demonstrates it knows how to ship operational scripts when it wants to (`scripts/backfill-notifications.mjs`, with dry-run/commit discipline), which makes the absence here read as "done out-of-band and never written down" rather than "not yet needed." Whether the production superadmin rides on a claim or a doc, and how it was minted, is unknowable from the repo (`12-Known-Unknowns.md` U-14, confirmed).

**Evidence**
- Role resolution: `features/admin/services/admin.service.ts:25-38` (`getCallerContext`: claim-or-doc); mirrored in `firestore.rules:16-22` (`isSystemAdmin`) and `functions/src/fanout.ts:120-124` (doc-only — note the three checks are not even identical in what they accept).
- No claim writer: grep `setCustomUserClaims` across `src/` incl. `functions/`, `scripts/` → zero. Reads only at `features/admin/services/user.service.ts:22,142`.
- No doc bootstrap: `firestore.rules:194-197` (`admins/{uid}` — client write denied); `features/admin/services/user.service.ts:117+` (`setAdminRole`, Admin SDK) gated by `setAdminRoleAction` → `canPromoteUsers` → superadmin-only (`features/admin/utils/rbac.ts:14-34`).
- Git: the admin module's full history (`36d3931`, 2026-04-18 onward) never contained a seeding path (verified via `git log --follow` on `user.service.ts` and grep of historical commits touching `admins`).

**Affected modules**
`features/admin` (services, rbac), `firestore.rules`, `functions/src/fanout.ts`, every admin route/action (all dead-end without a bootstrapped identity).

**Business impact**
Disaster-recovery and portability: standing up this system in a fresh Firebase project (staging, a new region, post-incident restore, a handover) yields an app whose entire admin surface — user management, content moderation, reports, the fan-out callable — is unreachable until someone reinvents the undocumented provisioning step. The moderation path (`content_removed` notifications, `deleteGlobalFlashcardAction`) is inert exactly when a new deployment would need it.

**Technical impact**
- The claims-vs-doc duality doubles the unknowns: code must forever check both (three call sites already diverge on which they honor), because nobody can say which one production actually uses.
- Emulator/e2e setups must fabricate admin identity by their own means, encoding the bootstrap knowledge in test harnesses instead of a canonical script.

**Risk if unchanged**
Bus-factor-one on an out-of-band ritual. The failure mode is not gradual — it is a cliff discovered during an incident or migration, when the one person who once ran the console command (or the memory of which mechanism was used) is unavailable.

---

## RC-11 — Three coexisting write-path families

**Symptom**
Three distinct mutation architectures run side by side, split by domain: **(A)** learner-facing features write Firestore directly with the client SDK under security rules (flashcard/kana/game/user services); **(B)** admin mutations go through `adminActionClient` server actions authenticated by the session *cookie* + per-action permission metadata, paired with React Query mutations; **(C)** notification emission and activity logging go through `actionClient` server actions taking a Firebase ID token as an explicit *bind argument*, verified inline. Three auth transports (rules-checked SDK call, cookie, token argument), two result conventions bridged by an adapter, and three different testing surfaces.

**Root Cause**
Staged evolution, with each stage layering rather than replacing — and the final stage explicitly optimizing for not disturbing the earlier ones. Timeline from git: the April sprint (2026-04-12 → 04-23) built everything client-SDK-first (family A) because there was no server trust boundary at all; the admin epic (`36d3931`+, 04-18) needed privileged reads/writes the rules model can't express, so it invented ad-hoc server actions with cookie transport (proto-B); cross-user notification writes (July platform, `ca8a654`) needed the Admin SDK *plus* verified caller identity from client call sites that had a live SDK user but no cookie contract, so they passed the ID token explicitly (proto-C). The July safe-action epic (`8fd3f2f`, 2026-07-16) then *formalized* B and C as two named clients rather than unifying them — `lib/safe-action.ts:14-31` documents "Two families of actions exist in this repo, with different auth entry points, so there are two clients" — and shipped `toActionResult` (`:47-60`) precisely "so callers written against the pre-migration `ActionResult<T>` contract are unaffected." Family A was simultaneously *reaffirmed* as permanent by ADR-002 (realtime stays client-side, `3ce6560`). Each family has a defensible driver (offline/realtime; privileged cookie-session UX; token-carrying client services), but the *transport* divergence between B and C is historical residue: both end at `adminAuth.verifyIdToken` on the same kind of token, differing only in how it travels.

**Evidence**
- Family A: `features/flashcard/services/card.service.ts:107-148`, `lesson.service.ts:39-117`, guarded by `firestore.rules`; ADR: `/docs/adr/002-data-layer-pattern.md` ("Realtime data stays on bespoke `onSnapshot` hooks — unconditionally").
- Family B: `features/admin/services/admin.service.ts:51-85` (`assertAdminAction` reads the cookie via `next/headers`, `adminActionClient` middleware + permission enum); ~20 actions in `features/admin/actions/admin.actions.ts`; React Query pairing in `features/admin/hooks/useUsers.ts:41-76`.
- Family C: `lib/safe-action.ts:14-31` (the two-families docstring), `:40-45` (`verifyIdToken`); consumers `features/notifications/actions/notification.actions.ts:66-70`, `lib/logging/user-actions.ts`, the three per-feature `activity-log.actions.ts` files.
- Bridge: `toActionResult` (`lib/safe-action.ts:52-60`) + re-throw shims in hooks (`useUsers.ts:25`).
- Git dating: family A April 12-17 (`befcd83`, `f6a4418`); family B April 18 (`36d3931`); cookie transport April 19 (`fa99063`); family C July 11 (`ca8a654`); formalization-not-unification July 16 (`8fd3f2f`); write-path consolidation *within* C July 18 (`bbd1534`, E17-T4 — the program consolidated inside families, never across them).

**Affected modules**
All `features/*/services` and `features/*/actions`, `lib/safe-action.ts`, `lib/logging/*`, `firestore.rules` (the entire A-family authorization model), admin hooks.

**Business impact**
Indirect: velocity and defect surface. Any feature that crosses families — and sharing already does: a deck edit is family A, its notification is family C, its admin moderation is family B — requires a developer to hold three security models simultaneously to reason about one user story.

**Technical impact**
- Three authorization review surfaces: rules language, cookie-session middleware, and per-action token verification each need separate expertise and separate test harnesses (rules tests, emulator tests, unit tests — all three exist and must all be maintained).
- The same invariant is expressed in different systems per family (e.g. "only the owner mutates a lesson" lives in rules for A but in TypeScript for B's moderation delete), so invariant changes fan out across languages.
- Family choice for new code is precedent-driven, not rule-driven; nothing but tribal knowledge stops a fourth family (`app/api` routes, other transports) from appearing.

**Risk if unchanged**
The families are stable individually but the *seams* accumulate risk: every new cross-family flow re-decides auth transport ad hoc, and a mistake (a privileged mutation added to family A because it was convenient, guarded only by rules that can't express it) is a security bug, not a style issue. The documented-but-unrecorded question — whether B's cookie and C's bind-arg should converge — will be re-litigated by every future maintainer who finds the two clients.

---

## RC-12 — Layering inversion: `lib/logging` depends on `features/admin` types

**Symptom**
The second (and only other) directory-level cycle: `features/admin` imports `lib/logging` machinery (`log.service.ts:8-9`, `admin.actions.ts:8`), while `lib/logging/public.ts:1` imports `AdminLog`, `LogLevel`, `LogSource`, `LogType` back from `@/features/admin/types`. The infrastructure layer's canonical record shape is defined by one of its consumers.

**Root Cause**
Ownership never migrated with the code. The logging *viewer* (admin reports UI) was built first, in April, and its feature directory became the natural home for the log types it rendered. When logging was later centralized into `lib/logging` as shared infrastructure (culminating in E17-T4, `bbd1534`, 2026-07-18, "consolidate activity-log write path"), the pipeline, enum, and schema moved or were created `lib`-side — but the type vocabulary stayed feature-side, and `public.ts` bridged the gap with a type-only import rather than relocating the types. The leg is `import type`, so it is erased at runtime and harmless to bundling — likely why every consolidation pass tolerated it — but architecturally the arrow still points the wrong way: `lib` is otherwise feature-free (grep confirms `shared/` imports neither `lib` nor `features`; `lib`'s only feature imports are the composition root and this line).

**Evidence**
- `lib/logging/public.ts:1` — `import type { AdminLog, LogLevel, LogSource, LogType } from "@/features/admin/types";`.
- Forward legs: `features/admin/services/log.service.ts:8-9`, `features/admin/actions/admin.actions.ts:8`.
- `lib/logging/schema.ts:3` re-declares `logSourceSchema = z.enum(["client","server","cloud_function"])` — the same vocabulary duplicated `lib`-side as a zod enum because the TS type lives in the feature; the two must be kept in sync by hand.
- Git: admin types predate `lib/logging`'s canonicalization (April admin epic vs E17-T4); `08-Dependency-Graph.md` §1.4 Cycle B, re-verified.

**Affected modules**
`lib/logging` (public, schema), `features/admin` (types, log.service, actions).

**Business impact**
None direct.

**Technical impact**
- `lib/logging` cannot be reasoned about (or extracted, or consumed by a future non-admin surface) without the admin feature; the "canonical pipeline" advertises independence it doesn't have.
- The duplicated source vocabulary (TS union feature-side, zod enum lib-side) is a two-copy sync obligation — the same failure shape as RC-9, in miniature.

**Risk if unchanged**
Low severity, but it sets the precedent that `lib → features` imports are acceptable if type-only; a second such import would make the composition-root exception into a pattern, and the layering rule (features may use lib, never the reverse) stops being checkable by grep.

---

## Cross-cutting observation

Six of the twelve root causes (RC-2, RC-3, RC-5, RC-6, RC-7, RC-10) reduce to the same meta-cause: **a migration or capability was staged with a defined later step, and the repository has no mechanism that records whether the later step happened or is still intended** — no migration ledger, no expiring TODOs, no roadmap references in code, and ADRs (which exist and are good: 001-003) were adopted only in July and only for three decisions. The individual issues are symptoms; the absence of recorded completion state is the pattern. This is stated here as analysis, not recommendation, per the assessment's scope.
