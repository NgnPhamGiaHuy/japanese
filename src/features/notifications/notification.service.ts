import {
    addDoc,
    collection,
    deleteDoc,
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

import { APP_ID, db } from "@/lib/firebase";

import type { Unsubscribe } from "firebase/firestore";
import type { AppNotification } from "./types";

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

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createNotification(
    notification: Omit<AppNotification, "id" | "read" | "createdAt">,
): Promise<void> {
    await addDoc(notificationsCol(notification.userId), {
        ...notification,
        read: false,
        createdAt: Date.now(),
    });
}

/**
 * Stores a notification for a user who hasn't logged in yet (email-based invite).
 * Delivered to their notification center when they first log in via deliverPendingNotifications.
 */
export async function createPendingNotification(
    toEmail: string,
    notification: Omit<AppNotification, "id" | "userId" | "read" | "createdAt">,
): Promise<void> {
    const normalizedEmail = toEmail.trim().toLowerCase();
    await addDoc(pendingNotificationsCol(normalizedEmail), {
        ...notification,
        read: false,
        createdAt: Date.now(),
    });
}

/**
 * Called on login — moves all pending notifications for this email into the user's
 * notification center and deletes the pending entries.
 */
export async function deliverPendingNotifications(userId: string, email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const snap = await getDocs(pendingNotificationsCol(normalizedEmail));
    if (snap.empty) return;

    const batch = writeBatch(db);
    for (const d of snap.docs) {
        // Write to user's notification collection
        const newRef = doc(notificationsCol(userId));
        batch.set(newRef, { ...d.data(), userId });
        // Delete the pending entry
        batch.delete(d.ref);
    }
    await batch.commit();
}

// ─── Convenience creators ─────────────────────────────────────────────────────

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
    const payload = {
        type: "invite" as const,
        title: "You've been invited",
        message: `${from} invited you to "${deckTitle || "a deck"}" as ${role}`,
        senderId,
        senderName,
        deckId,
        deckTitle,
        link: shareLink,
    };

    if (toUserId) {
        // User is known — deliver immediately
        await createNotification({ ...payload, userId: toUserId });
    } else if (toEmail) {
        // User not yet registered — store as pending, delivered on login
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
}: {
    toUserId: string;
    senderId: string;
    senderName?: string | null;
    deckId: string;
    deckTitle?: string | null;
    shareLink: string;
    cardKanji?: string | null;
}): Promise<void> {
    if (toUserId === senderId) return; // Don't notify yourself
    const from = senderName || "Someone";
    const card = cardKanji ? ` on "${cardKanji}"` : "";
    await createNotification({
        userId: toUserId,
        type: "comment",
        title: "New comment",
        message: `${from} commented${card} in "${deckTitle || "your deck"}"`,
        senderId,
        senderName,
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
}: {
    toUserId: string;
    senderId: string;
    senderName?: string | null;
    deckId: string;
    deckTitle?: string | null;
    shareLink: string;
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
        deckId,
        deckTitle,
        link: shareLink,
    });
}

// ─── Read / Subscribe ─────────────────────────────────────────────────────────

export function subscribeNotifications(
    userId: string,
    onUpdate: (notifications: AppNotification[]) => void,
    onError?: (err: Error) => void,
): Unsubscribe {
    const q = query(notificationsCol(userId), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(
        q,
        (snap) => {
            onUpdate(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as AppNotification));
        },
        (err) => {
            console.error("[NotificationService] Snapshot error:", err);
            onError?.(err);
        },
    );
}

// ─── Mark as read ─────────────────────────────────────────────────────────────

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
    await updateDoc(notificationDoc(userId, notificationId), { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    const snap = await getDocs(query(notificationsCol(userId), where("read", "==", false)));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
}
