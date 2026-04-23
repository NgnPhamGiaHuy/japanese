"use server";

import { ActivityAction } from "@/lib/logging/actions.enum";
import { logUserActionServer } from "@/lib/logging/user-actions";

/**
 * Logs when a single notification is marked as read.
 */
export async function logNotificationRead(
    idToken: string,
    userId: string,
    notificationId: string,
    type: string,
    title?: string,
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.NOTIFICATION_READ,
        entityType: "notification",
        entityId: notificationId,
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", type, title },
    });
}

/**
 * Logs when a single notification is deleted.
 */
export async function logNotificationDeleted(
    idToken: string,
    userId: string,
    notificationId: string,
    type: string,
    title?: string,
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.NOTIFICATION_DELETED,
        entityType: "notification",
        entityId: notificationId,
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", type, title },
    });
}

/**
 * Logs when all notifications are marked as read in bulk.
 */
export async function logNotificationsReadAll(
    idToken: string,
    userId: string,
    count: number,
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.NOTIFICATION_READ_ALL,
        entityType: "notification",
        entityId: "all",
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", count },
    });
}

/**
 * Logs when all notifications are cleared (soft-deleted) in bulk.
 */
export async function logNotificationsCleared(
    idToken: string,
    userId: string,
    count: number,
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.NOTIFICATIONS_CLEARED,
        entityType: "notification",
        entityId: "all",
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", count },
    });
}

/**
 * Logs when pending notifications (email-based) are delivered to a user's account.
 */
export async function logNotificationsDelivered(
    idToken: string,
    userId: string,
    count: number,
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.NOTIFICATIONS_DELIVERED,
        entityType: "notification",
        entityId: "batch",
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", count },
    });
}
