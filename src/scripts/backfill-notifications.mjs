#!/usr/bin/env node
/**
 * @file scripts/backfill-notifications.mjs
 * One-time backfill for notification documents (Epic 2, Task 2.2).
 *
 * WHY
 * ───
 * The notification schema migration left three problems that this script fixes
 * in the stored data:
 *   1. Legacy docs missing `status` / `isDeleted` are invisible to the primary
 *      `where("isDeleted","!=",true)` query (the `!=` field-existence trap),
 *      yet visible to the fallback query — so the same inbox renders
 *      differently depending on which listener path is live.
 *   2. `status` must exist on every doc before we can drop the legacy
 *      `read`-based query (Epic 14.1).
 *   3. TTL (Epic 13.1) needs an `expiresAt` field to reap old docs.
 *
 * WHAT IT DOES (per notifications doc, via collectionGroup across all users):
 *   - stamps `status` (derived from existing `status` → `read` → default unread)
 *   - stamps `isDeleted: false` when absent
 *   - stamps `expiresAt` per the retention policy, as a Firestore `Timestamp`:
 *       soft-deleted → +30d,  read → +180d,  unread → (none, never expires)
 *
 * `expiresAt` MUST be a Firestore `Timestamp`, not a plain number — native
 * Firestore TTL policies only evaluate `Timestamp`-typed fields and silently
 * ignore a raw epoch-millis number. This script also RE-PATCHES any doc whose
 * `expiresAt` is already present but stored as a number (written by the
 * pre-fix client code) — see the `alreadyTimestamp` check in computePatch().
 *
 * SAFETY
 * ──────
 *   - DRY RUN BY DEFAULT. It only writes when invoked with `--commit`.
 *   - Idempotent: re-running never double-applies (it only fills missing fields,
 *     converts numeric `expiresAt` to `Timestamp`, and recomputes deterministically).
 *   - Chunked at 400 writes/batch (under the 500-op ceiling).
 *   - Writes a manifest of every touched doc path to stdout for auditing.
 *   - Rehearse on the emulator first:
 *       FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/backfill-notifications.mjs
 *     then dry-run against prod (default), inspect the manifest, and only then
 *     re-run with `--commit`.
 *
 * CREDS: uses firebase-admin. Against prod, set FIREBASE_ADMIN_PROJECT_ID /
 * FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY. Against the
 * emulator, FIRESTORE_EMULATOR_HOST is enough (no real creds needed).
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const COMMIT = process.argv.includes("--commit");
const WRITE_CHUNK = 400;
const DAY_MS = 86_400_000;
const READ_TTL_DAYS = 180;
const DELETED_TTL_DAYS = 30;

function initAdmin() {
    if (getApps().length) return;
    // Emulator: no creds required (FIRESTORE_EMULATOR_HOST short-circuits auth).
    if (process.env.FIRESTORE_EMULATOR_HOST) {
        initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID ?? "demo-notifications" });
        return;
    }
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

/** Mirrors features/notifications/types isUnread() for legacy docs. */
function deriveStatus(data) {
    if (data.status === "unread" || data.status === "read") return data.status;
    if (data.read === false) return "unread";
    return "read"; // read===true, or neither field present (treated as read)
}

function toMillis(value) {
    if (typeof value === "number") return value;
    if (value && typeof value.toMillis === "function") return value.toMillis();
    return Date.now();
}

/** Returns the patch needed for a doc, or null if it's already compliant. */
function computePatch(data) {
    const patch = {};

    const status = deriveStatus(data);
    if (data.status !== status) patch.status = status;

    const isDeleted = data.isDeleted === true;
    if (data.isDeleted === undefined) patch.isDeleted = false;

    const created = toMillis(data.createdAt);
    let expiresAtMillis;
    if (isDeleted) expiresAtMillis = created + DELETED_TTL_DAYS * DAY_MS;
    else if (status === "read") expiresAtMillis = created + READ_TTL_DAYS * DAY_MS;
    else expiresAtMillis = null; // unread — never expires

    if (expiresAtMillis !== null) {
        const alreadyTimestamp = data.expiresAt instanceof Timestamp;
        const currentMillis = alreadyTimestamp
            ? data.expiresAt.toMillis()
            : typeof data.expiresAt === "number"
              ? data.expiresAt
              : null;
        // Patch when: the field is missing, stored as the wrong type (a plain
        // number instead of a Timestamp — the bug this script exists to fix),
        // or numerically stale relative to the freshly-derived value.
        if (!alreadyTimestamp || currentMillis !== expiresAtMillis) {
            patch.expiresAt = Timestamp.fromMillis(expiresAtMillis);
        }
    }

    return Object.keys(patch).length > 0 ? patch : null;
}

/** Renders a patch for the audit manifest, expanding Timestamp fields to ISO strings. */
function formatPatchForLog(patch) {
    const readable = {};
    for (const [key, value] of Object.entries(patch)) {
        readable[key] = value instanceof Timestamp ? value.toDate().toISOString() : value;
    }
    return JSON.stringify(readable);
}

async function main() {
    initAdmin();
    const db = getFirestore();

    console.log(`[backfill] mode=${COMMIT ? "COMMIT" : "DRY-RUN"}`);
    const snap = await db.collectionGroup("notifications").get();
    console.log(`[backfill] scanned ${snap.size} notification docs`);

    const patches = [];
    for (const doc of snap.docs) {
        const patch = computePatch(doc.data());
        if (patch) patches.push({ ref: doc.ref, path: doc.ref.path, patch });
    }

    console.log(`[backfill] ${patches.length} docs need patching`);
    for (const p of patches) {
        console.log(`  ${p.path} ← ${formatPatchForLog(p.patch)}`);
    }

    if (!COMMIT) {
        console.log("[backfill] DRY-RUN complete — no writes performed. Re-run with --commit.");
        return;
    }

    let written = 0;
    for (let i = 0; i < patches.length; i += WRITE_CHUNK) {
        const batch = db.batch();
        for (const p of patches.slice(i, i + WRITE_CHUNK)) {
            batch.set(p.ref, p.patch, { merge: true });
        }
        await batch.commit();
        written += Math.min(WRITE_CHUNK, patches.length - i);
        console.log(`[backfill] committed ${written}/${patches.length}`);
    }
    console.log("[backfill] COMMIT complete.");
}

main().catch((err) => {
    console.error("[backfill] failed:", err);
    process.exit(1);
});
