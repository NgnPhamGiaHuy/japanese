/**
 * @file notification-pending
 * Pre-signup (email-keyed) notification creation and login-time delivery —
 * split out of notification.service.ts (E11-T4).
 *
 * Live cross-user notifications are created SERVER-SIDE by emitNotificationAction
 * (Admin SDK). The only client-created notifications are email-keyed pending
 * invites (below), which target an address before the invitee has a uid and so
 * can't go through the recipient-deriving server writer.
 */
import { addDoc, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { DELIVERY_CHUNK, notificationsCol, pendingNotificationsCol } from "./notification-paths";
import { logNotificationsDelivered } from "../actions";
import { planDelivery } from "../domain/utils";

import type { AppNotification, NotificationData, NotificationType } from "../types";

type CreatePayload = Omit<AppNotification, "id" | "status" | "read" | "createdAt" | "isDeleted">;

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
 * Idempotency & concurrency: the destination doc REUSES the pending
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
