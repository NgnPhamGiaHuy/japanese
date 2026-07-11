/**
 * @file notification.service.ts
 * Full notification lifecycle: create, subscribe (real-time), mark read,
 * soft-delete, batch operations, and pending (pre-login) delivery.
 *
 * Schema note: new documents use `status: "unread" | "read"`.
 * Legacy documents use `read: boolean`. The `isUnread()` helper in types.ts
 * handles both shapes transparently.
 */

import {
    addDoc,
    collection,
    deleteField,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import { APP_ID, auth, db } from "@/lib/firebase";
import { logNotificationsDelivered } from "../actions";
import { chunk, planDelivery, toMillis } from "../domain/utils";

import type { QueryDocumentSnapshot, Unsubscribe } from "firebase/firestore";
import type { AppNotification, NotificationData, NotificationType } from "../types";

// ─── Batch sizing ─────────────────────────────────────────────────────────────
// Firestore caps a write batch at 500 operations. Single-op updates chunk at
// 400; delivery (set + delete per item = 2 ops) chunks at 200.
const UPDATE_CHUNK = 400;
const DELIVERY_CHUNK = 200;

// ─── Retention (TTL) ──────────────────────────────────────────────────────────
// Read/soft-deleted docs get an `expiresAt` so a Firestore TTL policy on the
// `expiresAt` field can reap them (unread docs never expire). The TTL policy
// itself is configured in GCP, not here — see docs/testing-notifications.md.
const DAY_MS = 86_400_000;
const READ_TTL_MS = 180 * DAY_MS;
const DELETED_TTL_MS = 30 * DAY_MS;

// ─── Path helpers ─────────────────────────────────────────────────────────────

function notificationsCol(userId: string) {
    return collection(db, "artifacts", APP_ID, "users", userId, "notifications");
}

function notificationDoc(userId: string, notificationId: string) {
    return doc(db, "artifacts", APP_ID, "users", userId, "notifications", notificationId);
}

/**
 * Pending notifications keyed by email — delivered when the user logs in.
 * Path: artifacts/{appId}/pendingNotifications/{normalizedEmail}/items/{id}
 */
function pendingNotificationsCol(normalizedEmail: string) {
    return collection(db, "artifacts", APP_ID, "pendingNotifications", normalizedEmail, "items");
}

// ─── Internal base shape ──────────────────────────────────────────────────────

type CreatePayload = Omit<AppNotification, "id" | "status" | "read" | "createdAt" | "isDeleted">;

// ─── Read mapping ─────────────────────────────────────────────────────────────

/**
 * Maps a Firestore snapshot to an AppNotification, normalizing `createdAt` to
 * epoch millis regardless of whether the stored value is a legacy client-clock
 * number or a resolved `serverTimestamp()` Timestamp (see domain/utils.toMillis).
 */
function mapNotificationDoc(d: QueryDocumentSnapshot): AppNotification {
    const data = d.data();
    return { ...data, id: d.id, createdAt: toMillis(data.createdAt) } as AppNotification;
}

// ─── Pending (pre-signup) creation & delivery ─────────────────────────────────
//
// Live cross-user notifications are created SERVER-SIDE by emitNotificationAction
// (Admin SDK). The only client-created notifications are email-keyed pending
// invites (below), which target an address before the invitee has a uid and so
// can't go through the recipient-deriving server writer.

/**
 * Stores a notification for a user who hasn't logged in yet (email-based invite).
 * Delivered to their notification center when they first log in.
 */
export async function createPendingNotification(
    toEmail: string,
    payload: Omit<CreatePayload, "userId">,
): Promise<void> {
    const normalizedEmail = toEmail.trim().toLowerCase();
    await addDoc(pendingNotificationsCol(normalizedEmail), {
        ...payload,
        status: "unread",
        isDeleted: false,
        createdAt: serverTimestamp(),
    });
}

/**
 * Called on login — moves all pending notifications for this email into the
 * user's notification center and deletes the pending entries.
 *
 * Idempotency & concurrency (Task 2.4): the destination doc REUSES the pending
 * doc's ID. This makes concurrent deliveries (the same email logging in on two
 * devices, or `onIdTokenChanged` firing on every ~hourly token refresh)
 * converge on a `set` overwrite instead of producing duplicate inbox docs.
 *
 * Batch sizing: each item is a set + delete (2 ops), so we chunk at 200 items
 * (400 ops) to stay under the 500-op ceiling — a >250-item pending queue used
 * to throw and get stuck forever.
 *
 * Delivery is logged only AFTER a successful commit, so a failed batch never
 * records a phantom delivery.
 */
export async function deliverPendingNotifications(userId: string, email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const snap = await getDocs(pendingNotificationsCol(normalizedEmail));
    if (snap.empty) return;

    const items = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    let delivered = 0;
    for (const group of planDelivery(items, userId, DELIVERY_CHUNK)) {
        const batch = writeBatch(db);
        for (const w of group) {
            // Deterministic destination ID = pending ID → idempotent overwrite.
            batch.set(doc(notificationsCol(userId), w.destId), w.data);
            batch.delete(doc(pendingNotificationsCol(normalizedEmail), w.deleteId));
        }
        await batch.commit();
        delivered += group.length;
    }

    // Log the delivery event only after all chunks committed (fire-and-forget).
    void auth.currentUser?.getIdToken().then((token) => {
        logNotificationsDelivered(token, userId, delivered);
    });
}

// ─── Invite (email → pending) ─────────────────────────────────────────────────

/**
 * Creates a pending, email-keyed invite notification, delivered when the invitee
 * first logs in (deliverPendingNotifications). Invites target an email before
 * the user has a uid, so — unlike every other cross-user notification, which is
 * created server-side by emitNotificationAction — this one stays a client write
 * to the pending collection.
 */
export async function notifyInvite({
    toEmail,
    senderId,
    senderName,
    deckId,
    deckTitle,
    shareLink,
    role,
}: {
    toEmail: string;
    senderId: string;
    senderName?: string | null;
    deckId: string;
    deckTitle?: string | null;
    shareLink: string;
    role: string;
}): Promise<void> {
    const from = senderName || "Someone";
    const data: NotificationData = {
        lessonId: deckId,
        inviterId: senderId,
        inviteRole: role,
        shareLink,
    };
    await createPendingNotification(toEmail, {
        type: "invite" as NotificationType,
        title: "You've been invited",
        message: `${from} invited you to "${deckTitle || "a deck"}" as ${role}`,
        senderId,
        senderName,
        data,
        // Legacy fields — kept so existing UI code that reads `link` still works
        deckId,
        deckTitle,
        link: shareLink,
    });
}

// ─── Real-time subscription ───────────────────────────────────────────────────

/**
 * Real-time listener for a user's notifications.
 *
 * Strategy:
 * 1. Try the composite-index query (isDeleted != true + createdAt desc).
 * 2. If Firestore rejects it (index not yet built), transparently fall back to
 *    a simple createdAt-only query and filter isDeleted client-side.
 * 3. If the FALLBACK errors too, surface it via `onError` and re-subscribe with
 *    capped exponential backoff (1s → 2s → … → 60s), resetting on any success.
 *    (Task 2.8 — previously a dead fallback stream stayed dead until the uid
 *    changed, and an errored stream was indistinguishable from an empty inbox.)
 *
 * No listener leaks: the returned unsubscribe stops the active listener AND any
 * pending retry timer.
 */
export function subscribeNotifications(
    userId: string,
    onUpdate: (notifications: AppNotification[]) => void,
    onError?: (err: Error) => void,
): Unsubscribe {
    let active = true;
    let currentUnsub: Unsubscribe = () => {};
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const clearTimer = () => {
        if (retryTimer) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
    };

    const scheduleRetry = (open: () => void) => {
        clearTimer();
        const delay = Math.min(60_000, 1_000 * 2 ** attempt);
        attempt += 1;
        retryTimer = setTimeout(() => {
            if (active) open();
        }, delay);
    };

    const openFallback = () => {
        const fallbackQ = query(notificationsCol(userId), orderBy("createdAt", "desc"), limit(50));
        currentUnsub = onSnapshot(
            fallbackQ,
            (snap) => {
                attempt = 0; // recovered
                onUpdate(snap.docs.map(mapNotificationDoc).filter((n) => !n.isDeleted));
            },
            (fallbackErr) => {
                console.error("[NotificationService] Fallback listener error:", fallbackErr);
                onError?.(fallbackErr);
                scheduleRetry(openFallback);
            },
        );
    };

    const openPrimary = () => {
        const primaryQ = query(
            notificationsCol(userId),
            where("isDeleted", "!=", true),
            orderBy("isDeleted"),
            orderBy("createdAt", "desc"),
            limit(50),
        );
        currentUnsub = onSnapshot(
            primaryQ,
            (snap) => {
                attempt = 0;
                onUpdate(snap.docs.map(mapNotificationDoc));
            },
            (err) => {
                // Composite index not yet created — swap to the fallback listener.
                console.warn(
                    "[NotificationService] Primary query failed, using fallback:",
                    err.message,
                );
                currentUnsub();
                openFallback();
            },
        );
    };

    openPrimary();

    return () => {
        active = false;
        clearTimer();
        currentUnsub();
    };
}

// ─── Mark as read ─────────────────────────────────────────────────────────────

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const now = Date.now();
    await updateDoc(notificationDoc(userId, notificationId), {
        status: "read",
        read: true, // keep legacy field in sync
        readAt: now,
        expiresAt: now + READ_TTL_MS,
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
    for (const group of chunk(allDocs, UPDATE_CHUNK)) {
        const batch = writeBatch(db);
        group.forEach((d) =>
            batch.update(d.ref, {
                status: "read",
                read: true,
                readAt: now,
                expiresAt: now + READ_TTL_MS,
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
        expiresAt: Date.now() + DELETED_TTL_MS,
    });
}

/**
 * Soft-deletes ALL notifications for a user, looping in chunks until the inbox
 * is empty. Returns the affected doc IDs so a "Clear all" action can offer Undo
 * (via restoreNotifications).
 *
 * The previous version capped at a single 500-doc batch and silently stranded
 * anything beyond 500 (Task 2.6). Now it pages through the collection so
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

        const expiresAt = Date.now() + DELETED_TTL_MS;
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
