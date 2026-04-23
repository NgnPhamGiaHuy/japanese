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
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import { APP_ID, auth, db } from "@/lib/firebase";
import { logNotificationsDelivered } from "./actions";

import type { Unsubscribe } from "firebase/firestore";
import type { AppNotification, NotificationData, NotificationType } from "./types";

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

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Creates a notification document with the new `status` schema.
 * Always sets `status: "unread"`, `isDeleted: false`, and `createdAt`.
 */
export async function createNotification(payload: CreatePayload): Promise<void> {
    await addDoc(notificationsCol(payload.userId), {
        ...payload,
        status: "unread",
        isDeleted: false,
        createdAt: Date.now(),
    });
}

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
        createdAt: Date.now(),
    });
}

/**
 * Called on login — moves all pending notifications for this email into the
 * user's notification center and deletes the pending entries atomically.
 */
export async function deliverPendingNotifications(userId: string, email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const snap = await getDocs(pendingNotificationsCol(normalizedEmail));
    if (snap.empty) return;

    // Log the delivery event (fire-and-forget)
    const count = snap.size;
    void auth.currentUser?.getIdToken().then((token) => {
        logNotificationsDelivered(token, userId, count);
    });

    const batch = writeBatch(db);
    for (const d of snap.docs) {
        const newRef = doc(notificationsCol(userId));
        batch.set(newRef, { ...d.data(), userId, status: "unread", isDeleted: false });
        batch.delete(d.ref);
    }
    await batch.commit();
}

// ─── Typed convenience creators ───────────────────────────────────────────────

export async function notifyInvite({
    toUserId,
    toEmail,
    senderId,
    senderName,
    deckId,
    deckTitle,
    shareLink,
    role,
}: {
    toUserId?: string;
    toEmail?: string;
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
    const payload = {
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
    };

    if (toUserId) {
        await createNotification({ ...payload, userId: toUserId });
    } else if (toEmail) {
        await createPendingNotification(toEmail, payload);
    }
}

export async function notifyComment({
    toUserId,
    senderId,
    senderName,
    deckId,
    deckTitle,
    shareLink,
    cardKanji,
    commentId,
}: {
    toUserId: string;
    senderId: string;
    senderName?: string | null;
    deckId: string;
    deckTitle?: string | null;
    shareLink: string;
    cardKanji?: string | null;
    commentId?: string;
}): Promise<void> {
    if (toUserId === senderId) return;
    const from = senderName || "Someone";
    const card = cardKanji ? ` on "${cardKanji}"` : "";
    await createNotification({
        userId: toUserId,
        type: "comment",
        title: "New comment",
        message: `${from} commented${card} in "${deckTitle || "your deck"}"`,
        senderId,
        senderName,
        data: { lessonId: deckId, shareLink, commentId },
        deckId,
        deckTitle,
        link: shareLink,
    });
}

export async function notifyReply({
    toUserId,
    senderId,
    senderName,
    deckId,
    deckTitle,
    shareLink,
    commentId,
}: {
    toUserId: string;
    senderId: string;
    senderName?: string | null;
    deckId: string;
    deckTitle?: string | null;
    shareLink: string;
    commentId?: string;
}): Promise<void> {
    if (toUserId === senderId) return;
    const from = senderName || "Someone";
    await createNotification({
        userId: toUserId,
        type: "reply",
        title: "New reply",
        message: `${from} replied to your comment in "${deckTitle || "a deck"}"`,
        senderId,
        senderName,
        data: { lessonId: deckId, shareLink, commentId },
        deckId,
        deckTitle,
        link: shareLink,
    });
}

export async function notifyRoleChange({
    toUserId,
    senderId,
    senderName,
    deckId,
    deckTitle,
    shareLink,
    newRole,
}: {
    toUserId: string;
    senderId: string;
    senderName?: string | null;
    deckId: string;
    deckTitle?: string | null;
    shareLink: string;
    newRole: string;
}): Promise<void> {
    if (toUserId === senderId) return;
    const from = senderName || "Someone";
    await createNotification({
        userId: toUserId,
        type: "role_change",
        title: "Access updated",
        message: `${from} changed your role to ${newRole} in "${deckTitle || "a deck"}"`,
        senderId,
        senderName,
        data: { lessonId: deckId, shareLink, inviteRole: newRole },
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
 *
 * IMPORTANT: the fallback listener is captured and returned so the caller can
 * always call the returned unsubscribe function — no listener leaks.
 */
export function subscribeNotifications(
    userId: string,
    onUpdate: (notifications: AppNotification[]) => void,
    onError?: (err: Error) => void,
): Unsubscribe {
    // Mutable ref so the error handler can swap in the fallback unsubscribe.
    let currentUnsub: Unsubscribe = () => {};

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
            onUpdate(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as AppNotification));
        },
        (err) => {
            // Composite index not yet created — swap to the fallback listener.
            console.warn(
                "[NotificationService] Primary query failed, using fallback:",
                err.message,
            );

            // Tear down the failed primary listener before opening the fallback.
            currentUnsub();

            const fallbackQ = query(
                notificationsCol(userId),
                orderBy("createdAt", "desc"),
                limit(50),
            );

            // Assign so the outer unsubscribe closure always calls the live listener.
            currentUnsub = onSnapshot(
                fallbackQ,
                (snap) => {
                    const all = snap.docs.map(
                        (d) => ({ ...d.data(), id: d.id }) as AppNotification,
                    );
                    onUpdate(all.filter((n) => !n.isDeleted));
                },
                (fallbackErr) => {
                    console.error("[NotificationService] Fallback listener error:", fallbackErr);
                    onError?.(fallbackErr);
                },
            );
        },
    );

    // Return a stable unsubscribe that always delegates to whichever listener
    // is currently active (primary or fallback).
    return () => currentUnsub();
}

// ─── Mark as read ─────────────────────────────────────────────────────────────

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
    await updateDoc(notificationDoc(userId, notificationId), {
        status: "read",
        read: true, // keep legacy field in sync
        readAt: Date.now(),
    });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    // Query both old (read==false) and new (status=="unread") unread docs
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

    const now = Date.now();
    const batch = writeBatch(db);
    allDocs.forEach((d) => batch.update(d.ref, { status: "read", read: true, readAt: now }));
    await batch.commit();
}

// ─── Soft delete ──────────────────────────────────────────────────────────────

/**
 * Soft-deletes a notification. The document is never removed from Firestore —
 * it is excluded from all queries via `isDeleted != true`.
 */
export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
    await updateDoc(notificationDoc(userId, notificationId), {
        isDeleted: true,
    });
}

/**
 * Soft-deletes ALL notifications for a user in a single batch.
 * Useful for a "Clear all" action.
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
    const snap = await getDocs(
        query(notificationsCol(userId), where("isDeleted", "!=", true), limit(500)),
    );
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { isDeleted: true }));
    await batch.commit();
}
