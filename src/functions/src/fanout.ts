/**
 * @file fanout.ts
 * Durable multi-recipient notification fan-out via Cloud Tasks (2nd gen
 * `onTaskDispatched`) — each recipient gets its own retrying task instead of
 * a single synchronous loop where one failure can silently drop the rest.
 *
 * No current product action triggers this yet: every notification producer
 * in the app today (features/notifications/actions/notification.actions.ts)
 * derives exactly one recipient server-side. This is the durable primitive
 * AC-E14.2 asks for ("If adopted") so a genuinely multi-recipient event has
 * somewhere durable to land without a synchronous-loop rewrite later.
 * `fanOutNotifications` below is its one real, deployed, admin-authorized
 * entry point — not wired into any existing app request path (Definition of
 * Done: additive, separately revertable).
 */
import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onTaskDispatched } from "firebase-functions/v2/tasks";

import { db } from "./firebase-admin";

import type { Firestore } from "firebase-admin/firestore";

const TASK_QUEUE_NAME = "deliverNotificationTask";
// One callable invocation shouldn't enqueue an unbounded number of tasks.
const MAX_FANOUT_RECIPIENTS = 500;

export interface FanoutNotificationPayload {
    appId: string;
    recipientId: string;
    notification: {
        type: string;
        title: string;
        message: string;
        senderId: string;
        senderName: string | null;
        lessonId?: string;
        link?: string | null;
    };
}

function notificationDoc(firestore: Firestore, appId: string, recipientId: string, docId: string) {
    return firestore
        .collection("artifacts")
        .doc(appId)
        .collection("users")
        .doc(recipientId)
        .collection("notifications")
        .doc(docId);
}

/**
 * Durable single-recipient write, run inside the Cloud Tasks consumer.
 * Exported separately so it's testable directly against the Firestore
 * emulator without dispatching a real task.
 */
export async function deliverOneNotification(
    firestore: Firestore,
    payload: FanoutNotificationPayload,
): Promise<void> {
    const { appId, recipientId, notification } = payload;
    // Deterministic ID: the same (recipient, type, lessonId, sender) within a
    // fan-out collapses to one doc on task retry instead of duplicating.
    const docId = `fanout:${notification.type}:${notification.lessonId ?? "none"}:${notification.senderId}`;
    await notificationDoc(firestore, appId, recipientId, docId).set(
        {
            userId: recipientId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            senderId: notification.senderId,
            senderName: notification.senderName,
            data: notification.lessonId ? { lessonId: notification.lessonId } : {},
            link: notification.link ?? null,
            priority: "P2",
            category: "system",
            collapseKey: `fanout:${notification.type}:${notification.lessonId ?? "none"}`,
            status: "unread",
            read: false,
            isDeleted: false,
            count: 1,
            actors: [],
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
    );
}

export const deliverNotificationTask = onTaskDispatched<FanoutNotificationPayload>(
    {
        retryConfig: { maxAttempts: 5, minBackoffSeconds: 30 },
        rateLimits: { maxConcurrentDispatches: 10 },
        region: "us-central1",
    },
    async (request) => {
        await deliverOneNotification(db, request.data);
    },
);

/**
 * Enqueues one durable Cloud Task per recipient. Each task retries
 * independently (deliverNotificationTask's retryConfig) so a transient
 * failure for one recipient never drops the others the way a single
 * synchronous write loop would.
 */
export async function enqueueNotificationFanout(
    recipientIds: string[],
    notification: FanoutNotificationPayload["notification"],
    appId: string,
): Promise<void> {
    const queue = getFunctions().taskQueue<FanoutNotificationPayload>(TASK_QUEUE_NAME);
    await Promise.all(
        recipientIds.map((recipientId) => queue.enqueue({ appId, recipientId, notification })),
    );
}

async function isAdmin(uid: string): Promise<boolean> {
    const snap = await db.collection("admins").doc(uid).get();
    const role = snap.data()?.role as string | undefined;
    return snap.exists && (role === "admin" || role === "superadmin");
}

const APP_ID = process.env.NOTIFICATIONS_APP_ID ?? "kana-nihongo-master";

/**
 * Admin-only callable entry point for the fan-out primitive — mirrors the
 * app's existing admin-authority model (admins/{uid}.role, see
 * features/admin/services/user.service.ts:isAdminInFirestore) rather than
 * inventing a new one. Not called from any existing app code path today;
 * exists so the durable fan-out capability is actually reachable and
 * deployable rather than dead code inside this package.
 */
export const fanOutNotifications = onCall<{
    recipientIds: string[];
    notification: FanoutNotificationPayload["notification"];
}>({ region: "us-central1" }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign-in required.");
    if (!(await isAdmin(request.auth.uid))) {
        throw new HttpsError("permission-denied", "Admin role required.");
    }

    const { recipientIds, notification } = request.data;
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        throw new HttpsError("invalid-argument", "recipientIds must be a non-empty array.");
    }
    if (recipientIds.length > MAX_FANOUT_RECIPIENTS) {
        throw new HttpsError(
            "invalid-argument",
            `recipientIds exceeds the ${MAX_FANOUT_RECIPIENTS}-recipient cap per call.`,
        );
    }

    await enqueueNotificationFanout(recipientIds, notification, APP_ID);
    logger.info(`[fanOutNotifications] enqueued ${recipientIds.length} tasks`, {
        actor: request.auth.uid,
    });
    return { enqueued: recipientIds.length };
});
