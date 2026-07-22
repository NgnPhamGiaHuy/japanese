# 03 — Legacy Code Audit

Every legacy implementation, compat shim, and migration leftover in `src/`, with reader/writer evidence. **Headline: nothing here is deletable today.** Legacy code in this repo falls into exactly three clusters: (1) the ledger-gated notifications migration, (2) a **previously-untracked flashcard legacy-doc compat cluster** — the most important discovery of this audit, and (3) individually-justified permanent keeps.

Classifications: `DELETE` / `MERGE` / `MIGRATE` / `KEEP` / `INVESTIGATE` / `GATED(id)`.

## 1. Notifications migration cluster — GATED (Q-5 + NQ-1, LDG-01)

All tracked; listed with **new evidence useful to the gate owner**:

| # | Item | Status detail discovered by this audit |
| --- | --- | --- |
| L1 | `notifications/types/index.ts:84-95,118-123` — 4 `@deprecated` fields + `isUnread()` legacy branch | **`deckId`/`deckTitle` are already read-dead**: `grep -rn '\.deckId\b\|\.deckTitle\b' features/notifications app` → 0 hits (re-verified directly). Only `link` (1 reader: `domain/format.ts:56`, behind `data?.shareLink ??`) and `read` still have live readers. The gate decision is narrower than the ledger row implies |
| L2 | `notifications/services/notification.service.ts:48-106` — `read: true` dual-write; `markAllNotificationsRead` dual query | Retire checklist already written in the code comment (backfill + `(read,isDeleted)` index, present in `firestore.indexes.json:47` and **now confirmed deployed** per LDG-19 closure) |
| L3 | `notifications/services/notification-pending.ts:117-121` — `notifyInvite` **still writes** legacy `deckId`/`deckTitle`/`link` on new docs | **Flag for gate owner:** the legacy corpus is still *growing*. Stopping the new writes is safe independently of backfilling old docs — `data.shareLink` is also written and `format.ts` prefers it, and `deckId`/`deckTitle` have zero readers. A same-shape change to `scripts/check-vocabulary-agreement.mjs:187-193` (L20, the regex arm tracking this writer) retires with it |
| L4 | `scripts/backfill-notifications.mjs` | Dry-run-default one-time backfill; **not yet run** against prod |

## 2. Flashcard legacy-doc compat cluster — KEEP, **needs a new ledger row**

Six interlocking compat mechanisms defend lesson/card documents written before the current schema. None is tracked in the migrations ledger — this is exactly the "staged change without a row" state ADR-120 exists to prevent, and the flashcard analog of LDG-01. **Recommended action: add one ledger row (suggested `LDG-22`) covering the cluster, gated on a lessons/cards backfill decision.** No code change until then.

| # | Item | Mechanism | Evidence it's still needed |
| --- | --- | --- | --- |
| L5 | `flashcard/utils/rbac.ts:114-115` | `resolveRole` owner check reads `lesson.ownerId ?? lesson.userId` | Pre-`ownerId` docs may exist; no lessons backfill script exists (`scripts/` holds only the notifications backfill + vocab checker) |
| L7 | `flashcard/services/lesson-subscriptions.ts:87-114` | `roles.{uid}` query → on error, retries with legacy `collaborators array-contains` query (verified lines 87/90/108) | Pre-`roles` shared decks are only findable via `collaborators` |
| L8 | `lesson-save.ts:100`, `lesson.service.ts:107`, `access.service.ts:58` | `collaborators` dual-write kept in sync with `roles` on every save/share/invite-accept | Required by L7's fallback query; also referenced by `firestore.rules` and `visibility.ts` |
| L9 | `flashcard/services/lesson-normalize.ts` (whole file) | Read-time healing: `__ownerIdFallback` from doc path, `userId`↔`ownerId` mirroring, owner injected into `roles`, `sharedBy*`→`lastSharedBy*` mapping | The compat choke point — deliberately never deletes legacy fields. Future cleanup should shrink exactly this one file |
| L10 | `flashcard/hooks/useLessons.ts:74,81` | Writes `userId: ownerId` on every lesson save | Keeps L5's fallback populated; cheap; referenced in rules paths |
| L11 | `shared/utils/reorder.ts:37-72` + type fields | Legacy numeric `order`/`sortOrder` read support with era-mixing compare rule | `sortOrder` verified never written anymore (only write site is the strip in `lesson-save.ts:180`); old docs still carry it; migration is lazy (heals on first save). Deletable only after a scan proves no numeric-order docs remain |
| L12 | `flashcard/services/card.service.ts:83-105` | `assertCardSchema` heals missing `alternatives` by writing `[]` back, logging `CARD_SCHEMA_HEAL_FAILED` | Self-retiring by design; the heal-log volume is the natural retire signal |

**Why one row, not six:** all six defend the same corpus (pre-modernization lesson/card docs), share one end state ("every lesson/card doc carries `ownerId`, `roles`, fractional order keys, `alternatives`"), and retire together after one backfill. Splitting them hides the coherence.

## 3. Individually-justified keeps

| # | Item | Class | Rationale |
| --- | --- | --- | --- |
| L6 | `flashcard/utils/rbac.ts:136-143` + `sanitizePublicRole:173` — legacy `publicRole:"editor"` guard | KEEP (permanent) | Defense-in-depth against privilege escalation via stored data that can't be proven absent. Sits adjacent to the Q-12-gated `publicRoleSchema`; cheap; security-relevant — explicitly protected by this audit's safety rules |
| L13 | `admin/services/analytics-content.ts:59-83` — legacy `type` field classification + keyword fallback | KEEP | `lesson.type` has no writer in src (verified); read-compat so old decks don't land in "Uncategorized". Harmless heuristic; retires with the L5-cluster backfill |
| L14 | `admin/services/log.service.ts:125-131` + `lib/logging/public.ts:105-140` — "legacy-friendly" `AdminLog` adapter | KEEP | This is the **live** admin-logs read/write path, not dead compat — the "legacy" is the UI model it adapts to. Modernizing the UI model would be a feature task, not cleanup |
| L15 | `lib/safe-action.ts:96-116` — `toActionResult` | GATED (LDG-21, recorded keep) | 21 call sites in `admin.actions.ts` alone; docblock explicitly says "NOT a migration-era shim" |
| L16 | `cardContentSchema` / `privacyModeSchema` / `publicRoleSchema` | GATED (Q-12, LDG-03/04/05) | Zero consumers is *known and recorded*; enforce-or-delete is the owner's call |
| L17 | `admin/services/admin.service.ts:65-69` — dual admin-identity paths | GATED (Q-10, LDG-15) | One of the 3 divergent admin predicates |
| L18 | `eslint.config.mjs` — 12-entry lint-ratchet baseline | GATED (LDG-16) | Shrinks only via the owning tasks (T-116a/T-109a file ownership) |
| L19 | `app/…/opengraph-image.tsx:26-35` — old-Chrome UA spoof for font fetch | KEEP (load-bearing workaround) | Satori cannot parse woff2; the spoof gets legacy TTF. Retires when Satori supports woff2 — an upstream event, not a repo decision |
| L20 | `scripts/check-vocabulary-agreement.mjs:187-193` — regex arm for the legacy pending-invite writer | KEEP | Must keep matching while L3's writer exists; retire together |

## 4. Swept and clean (descriptive prose, not constructs)

Fifteen files contain the words "legacy/old/migration" purely as history narration (e.g. `proxy.ts:34` on the Next 16 rename, `audio/policy.ts:9` documenting a *removed* guard, admin table docblocks recording the tanstack migration). One stale docblock found: `flashcard/types/flashcard.types.ts:152` labels `isPublic` "Legacy or computed" but the field is actively queried by `subscribePublicLessons` and RBAC — **the docblock is wrong, not the field** (P4 hygiene item, doc 10).

## 5. Verdict

| Classification | Count |
| --- | --- |
| GATED (notifications cluster + schemas + predicates + shim + ratchet) | 10 items |
| KEEP — flashcard compat cluster (**new ledger row recommended**) | 7 items |
| KEEP — individually justified | 5 items |
| **DELETE** | **0** |
| MERGE / MIGRATE | 0 |
| INVESTIGATE | 0 |

No legacy implementation in this codebase is removable without either a gate answer or a production backfill that does not yet exist. The actionable outputs are documentation-level: one new ledger row (L5 cluster), one narrowed gate note (L1: `deckId`/`deckTitle` read-dead), one flagged safe-independent step for the gate owner (L3: stop growing the legacy corpus), and one stale docblock fix.
