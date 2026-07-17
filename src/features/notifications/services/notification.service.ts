/**
 * @file notification.service.ts
 * Full notification lifecycle: create, subscribe (real-time), mark read,
 * soft-delete, batch operations, and pending (pre-login) delivery.
 *
 * Schema note: new documents use `status: "unread" | "read"`.
 * Legacy documents use `read: boolean`. The `isUnread()` helper in types.ts
 * handles both shapes transparently.
 *
 * Split from a single 430-line file (E11-T4): path helpers + batch/TTL
 * constants → notification-paths.ts, pending/invite creation & delivery →
 * notification-pending.ts, the real-time listener → notification-subscribe.ts.
 * This file keeps the mark-read/soft-delete/restore mutations and re-exports
 * everything else, so `export * from "./notification.service"` in
 * services/index.ts keeps working unchanged.
 */

import {
    deleteField,
    getDocs,
    limit,
    query,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
    DELETED_TTL_MS,
    expiresAtFromNow,
    notificationDoc,
    notificationsCol,
    READ_TTL_MS,
    UPDATE_CHUNK,
} from "./notification-paths";
import { chunk } from "../domain/utils";

export {
    createPendingNotification,
    deliverPendingNotifications,
    notifyInvite,
} from "./notification-pending";
export { subscribeNotifications } from "./notification-subscribe";

// ─── Mark as read ─────────────────────────────────────────────────────────────

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const now = Date.now();
    await updateDoc(notificationDoc(userId, notificationId), {
        status: "read",
        read: true, // keep legacy field in sync
        readAt: now,
        expiresAt: expiresAtFromNow(READ_TTL_MS, now),
    });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    // TRANSITIONAL: query both legacy (read==false) and current (status=="unread")
    // unread docs so docs written before the status migration aren't missed.
    // Once scripts/backfill-notifications.mjs has run in prod (stamping `status`
    // on every doc), drop the `read` query + its (read,isDeleted) index and the
    // legacy `read` dual-write below. See docs/testing-notifications.md.
    const [oldSnap, newSnap] = await Promise.all([
        getDocs(
            query(
                notificationsCol(userId),
                where("read", "==", false),
                where("isDeleted", "!=", true),
            ),
        ),
        getDocs(
            query(
                notificationsCol(userId),
                where("status", "==", "unread"),
                where("isDeleted", "!=", true),
            ),
        ),
    ]);

    // Deduplicate by doc ID (a doc could appear in both if it has both fields)
    const seen = new Set<string>();
    const allDocs = [...oldSnap.docs, ...newSnap.docs].filter((d) => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
    });

    if (allDocs.length === 0) return;

    // Chunk at 400 updates/batch — a user with >500 unread used to throw here
    // (single unbounded batch exceeded the 500-op ceiling).
    const now = Date.now();
    const expiresAt = expiresAtFromNow(READ_TTL_MS, now);
    for (const group of chunk(allDocs, UPDATE_CHUNK)) {
        const batch = writeBatch(db);
        group.forEach((d) =>
            batch.update(d.ref, {
                status: "read",
                read: true,
                readAt: now,
                expiresAt,
            }),
        );
        await batch.commit();
    }
}

// ─── Soft delete ──────────────────────────────────────────────────────────────

/**
 * Soft-deletes a notification. The document is never removed from Firestore —
 * it is excluded from all queries via `isDeleted != true`.
 */
export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
    await updateDoc(notificationDoc(userId, notificationId), {
        isDeleted: true,
        expiresAt: expiresAtFromNow(DELETED_TTL_MS),
    });
}

/**
 * Soft-deletes ALL notifications for a user, looping in chunks until the inbox
 * is empty. Returns the affected doc IDs so a "Clear all" action can offer Undo
 * (via restoreNotifications).
 *
 * The previous version capped at a single 500-doc batch and silently stranded
 * anything beyond 500. Now it pages through the collection so
 * "Clear all" actually clears all.
 */
export async function deleteAllNotifications(userId: string): Promise<string[]> {
    const affected: string[] = [];
    // Loop: fetch up to a batch's worth of live docs, soft-delete them, repeat
    // until none remain. `isDeleted != true` excludes docs we just updated.
    for (;;) {
        const snap = await getDocs(
            query(notificationsCol(userId), where("isDeleted", "!=", true), limit(UPDATE_CHUNK)),
        );
        if (snap.empty) break;

        const expiresAt = expiresAtFromNow(DELETED_TTL_MS);
        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
            batch.update(d.ref, { isDeleted: true, expiresAt });
            affected.push(d.id);
        });
        await batch.commit();

        // Fewer than a full page means we just cleared the tail.
        if (snap.size < UPDATE_CHUNK) break;
    }
    return affected;
}

/**
 * Restores soft-deleted notifications (Undo). Flips `isDeleted` back to false
 * and removes the TTL `expiresAt` so a restored doc won't be reaped. Chunked to
 * stay under the batch ceiling.
 */
export async function restoreNotifications(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    for (const group of chunk(ids, UPDATE_CHUNK)) {
        const batch = writeBatch(db);
        group.forEach((id) =>
            batch.update(notificationDoc(userId, id), {
                isDeleted: false,
                expiresAt: deleteField(),
            }),
        );
        await batch.commit();
    }
}
