"use server";

import { z } from "zod";

import { ActivityAction } from "@/lib/logging/actions.enum";
import { logUserActionServer } from "@/lib/logging/user-actions";
import { actionClient } from "@/lib/safe-action";

/**
 * @file Notification activity-log Server Actions — migrated to
 * next-safe-action. Each action now validates its input via
 * `.inputSchema()` (previously untyped positional strings/numbers with no
 * validation at all). Auth stays exactly as before: `idToken` (bind arg #1)
 * flows straight through to `logUserActionServer`, which does its own
 * `verifyIdToken` + "can't log on behalf of another user" check — that
 * function is shared with features/kana's activity-log actions (out of scope
 * here), so its signature is intentionally untouched.
 *
 * External contract (`Promise<void>`, errors always swallowed) is unchanged:
 * every call site is a fire-and-forget `void ...getIdToken().then(...)` that
 * has never read a return value. next-safe-action's `.action()` never rejects
 * (it converts thrown/validation errors into the result object instead), so
 * there is nothing left to catch here.
 */

const notificationIdInput = z.object({
    userId: z.string().min(1),
    notificationId: z.string().min(1),
    type: z.string().min(1),
    title: z.string().optional(),
});

const countInput = z.object({
    userId: z.string().min(1),
    count: z.number().int().nonnegative(),
});

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
    await actionClient
        .bindArgsSchemas([z.string()])
        .inputSchema(notificationIdInput)
        .action(async ({ parsedInput, bindArgsParsedInputs }) => {
            await logUserActionServer(bindArgsParsedInputs[0], {
                action: ActivityAction.NOTIFICATION_READ,
                entityType: "notification",
                entityId: parsedInput.notificationId,
                level: "info",
                userId: parsedInput.userId,
                metadata: {
                    logType: "USER_ACTION",
                    type: parsedInput.type,
                    title: parsedInput.title,
                },
            });
        })(idToken, { userId, notificationId, type, title });
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
    await actionClient
        .bindArgsSchemas([z.string()])
        .inputSchema(notificationIdInput)
        .action(async ({ parsedInput, bindArgsParsedInputs }) => {
            await logUserActionServer(bindArgsParsedInputs[0], {
                action: ActivityAction.NOTIFICATION_DELETED,
                entityType: "notification",
                entityId: parsedInput.notificationId,
                level: "info",
                userId: parsedInput.userId,
                metadata: {
                    logType: "USER_ACTION",
                    type: parsedInput.type,
                    title: parsedInput.title,
                },
            });
        })(idToken, { userId, notificationId, type, title });
}

/**
 * Logs when all notifications are marked as read in bulk.
 */
export async function logNotificationsReadAll(
    idToken: string,
    userId: string,
    count: number,
): Promise<void> {
    await actionClient
        .bindArgsSchemas([z.string()])
        .inputSchema(countInput)
        .action(async ({ parsedInput, bindArgsParsedInputs }) => {
            await logUserActionServer(bindArgsParsedInputs[0], {
                action: ActivityAction.NOTIFICATION_READ_ALL,
                entityType: "notification",
                entityId: "all",
                level: "info",
                userId: parsedInput.userId,
                metadata: { logType: "USER_ACTION", count: parsedInput.count },
            });
        })(idToken, { userId, count });
}

/**
 * Logs when all notifications are cleared (soft-deleted) in bulk.
 */
export async function logNotificationsCleared(
    idToken: string,
    userId: string,
    count: number,
): Promise<void> {
    await actionClient
        .bindArgsSchemas([z.string()])
        .inputSchema(countInput)
        .action(async ({ parsedInput, bindArgsParsedInputs }) => {
            await logUserActionServer(bindArgsParsedInputs[0], {
                action: ActivityAction.NOTIFICATIONS_CLEARED,
                entityType: "notification",
                entityId: "all",
                level: "info",
                userId: parsedInput.userId,
                metadata: { logType: "USER_ACTION", count: parsedInput.count },
            });
        })(idToken, { userId, count });
}

/**
 * Logs when pending notifications (email-based) are delivered to a user's account.
 */
export async function logNotificationsDelivered(
    idToken: string,
    userId: string,
    count: number,
): Promise<void> {
    await actionClient
        .bindArgsSchemas([z.string()])
        .inputSchema(countInput)
        .action(async ({ parsedInput, bindArgsParsedInputs }) => {
            await logUserActionServer(bindArgsParsedInputs[0], {
                action: ActivityAction.NOTIFICATIONS_DELIVERED,
                entityType: "notification",
                entityId: "batch",
                level: "info",
                userId: parsedInput.userId,
                metadata: { logType: "USER_ACTION", count: parsedInput.count },
            });
        })(idToken, { userId, count });
}
