# Notification testing & migration runbook

Covers how to run the two test tiers, the pending index/rules deploy, and the
one-time data backfill. All commands run from the project root (`src/`).

## Test tiers

| Tier           | Command            | Needs                                | What it covers                                                                                                                                                                                |
| -------------- | ------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (default) | `npm test`         | nothing                              | Pure logic: `toMillis`, `chunk`, `planDelivery` (delivery idempotency), `groupNotificationsByTime` (DST-safe buckets), `isUnread` across all doc shapes. Runs in the plain `node` Vitest env. |
| Emulator       | `npm run test:emu` | Firebase CLI + a JRE + `npm install` | Security-rules tests (`firestore-rules.test.ts`) and any `*.emu.test.ts`. Boots the Firestore/Auth emulator via `firebase emulators:exec`.                                                    |

The default unit run **excludes** `*.emu.test.ts` and `firestore-rules.test.ts`
(see `vitest.config.ts`) so it stays green without any infrastructure. The
emulator tier is also excluded from the app's typecheck (`tsconfig.json`), so a
missing emulator dependency never breaks `next build`.

### Prereqs for the emulator tier

```
npm install                       # installs @firebase/rules-unit-testing (devDep)
npm i -g firebase-tools           # or use npx
# a Java runtime must be on PATH (the Firestore emulator is a JVM process)
npm run test:emu
```

`npm run emulators:start` boots the emulator standalone (UI at :4000) for
interactive work.

## Pending index & rules deploy (NOT yet deployed)

Phase 1 PREPARES these but does not deploy them. Deploy only when ready:

```
# Composite indexes for markAllNotificationsRead's dual query (status/isDeleted,
# read/isDeleted) + the existing isDeleted/createdAt index.
firebase deploy --only firestore:indexes

# Security rules (Stage 2): notifications create is now owner-self only —
# cross-user notifications are written server-side via the Admin SDK. Also:
# immutable fields on update, no hard-delete, sender-bound pending creates.
firebase deploy --only firestore:rules
```

Rollback for rules: the previous version is in git — `git revert` the rules
change and redeploy `firestore:rules` (~1 min). Rehearse against the emulator
(`npm run test:emu`) before deploying to prod.

> **Ordering note**: `markAllNotificationsRead` throws `failed-precondition`
> until the two new composite indexes finish building. Deploy indexes first,
> wait for the build to complete in the console, then deploy rules.

## One-time data backfill (NOT yet run)

`scripts/backfill-notifications.mjs` stamps `status` / `isDeleted` / `expiresAt`
onto legacy docs (fixes the `!=` field-existence trap and prepares TTL). It is
**dry-run by default** and idempotent.

```
# 1. Rehearse on the emulator (no real creds needed):
FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/backfill-notifications.mjs

# 2. Dry-run against prod — inspect the printed manifest, write nothing:
node scripts/backfill-notifications.mjs

# 3. Only after reviewing the manifest, commit the writes:
node scripts/backfill-notifications.mjs --commit
```

Prod runs need `FIREBASE_ADMIN_PROJECT_ID` / `FIREBASE_ADMIN_CLIENT_EMAIL` /
`FIREBASE_ADMIN_PRIVATE_KEY` in the environment. The script batches at 400
writes and prints progress; it can be re-run safely if interrupted.

## Server-side Notification Service (always on)

Cross-user notifications (comment, reply, comment_resolved, invite_accepted,
role_change, access_revoked, deck_duplicated, content_removed) are created
**server-side** by `emitNotificationAction` / `notifySystemEvent` using the
Admin SDK — the sender is verified from the ID token, the recipient is derived
server-side, and bursts collapse via `collapseId`. There is **no feature flag**:
this is the notification-creation path.

Requirements & verification:

1. The Admin SDK env (`FIREBASE_ADMIN_*`) must be set in the server runtime (the
   admin dashboard already relies on it). The SDK is lazy, so builds need no
   creds.
2. Clients can no longer create cross-user notifications at all — the Stage-2
   `create: if isOwner(userId)` rule enforces it. The only client-created
   notifications are email-keyed **pending invites** (pre-signup) and the
   owner-self writes of pending **delivery**.
3. Verify on the emulator/staging that a comment on someone else's shared deck
   produces exactly one collapsed notification and a forged call is rejected
   (`firestore-rules.test.ts` + `npm run test:emu`).

## TTL policy (reap expired notifications)

Read docs get `expiresAt = readAt + 180d`; soft-deleted docs get
`expiresAt = deletedAt + 30d`; unread docs never expire. The writer/backfill
populate `expiresAt`; Firestore reaps them only once a **TTL policy** exists on
the field (a GCP-side config, not in this repo):

```
gcloud firestore fields ttls update expiresAt \
  --collection-group=notifications --enable-ttl
```

## Not yet wired

Registry kinds declared but without a producer yet (see
`features/notifications/domain/registry.ts`, `active: false`): `invite_declined`,
`deck_updated`, `deck_deleted`, `privacy_changed`, `overtaken`,
`leaderboard_top3`, `achievement`. The achievement/leaderboard kinds need hooks
into the XP/streak/game code; the rest are lower priority.

Also outstanding: seen/read badge split + `count()` unread, history pagination,
per-type/per-deck preferences (Phase 3 remainder); FCM push + email digests
(Phase 4).
