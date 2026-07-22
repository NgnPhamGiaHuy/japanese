"use server";

import { z } from "zod";

import { ActivityAction } from "@/lib/logging/actions.enum";
import { logActivity } from "@/lib/logging/activity";
import { userActionClient } from "@/lib/safe-action";

/**
 * @file Notification activity-log Server Actions — on the unified action
 * client (T-106c, ADR-106). Each action validates its input via
 * `.inputSchema()` and now declares a `.metadata({permission})` label (the
 * `ActivityAction` it logs, reused verbatim rather than inventing a parallel
 * vocabulary) — structurally required by `userActionClient`'s base, though
 * nothing here consumes it for authorization.
 *
 * Auth stays exactly as before: `idToken` (bind arg #1) flows straight
 * through to `logActivity`, which does its own `verifyIdToken` + "can't log
 * on behalf of another user" check — that helper is shared with every other
 * feature's activity-log actions (out of scope here), so its signature is
 * intentionally untouched. `userActionClient`'s own middleware also verifies
 * the same token (producing an unused `ctx.uid`) before `logActivity` runs —
 * a disclosed, harmless double-verification, not a weakening: identity is
 * checked at least as strongly as before, just redundantly.
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
    await userActionClient
        .metadata({ permission: ActivityAction.NOTIFICATION_READ })
        .inputSchema(notificationIdInput)
        .action(async ({ parsedInput, bindArgsParsedInputs }) => {
            await logActivity(
                bindArgsParsedInputs[0],
                parsedInput.userId,
                ActivityAction.NOTIFICATION_READ,
                "notification",
                parsedInput.notificationId,
                { type: parsedInput.type, title: parsedInput.title },
            );
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
    await userActionClient
        .metadata({ permission: ActivityAction.NOTIFICATION_DELETED })
        .inputSchema(notificationIdInput)
        .action(async ({ parsedInput, bindArgsParsedInputs }) => {
            await logActivity(
                bindArgsParsedInputs[0],
                parsedInput.userId,
                ActivityAction.NOTIFICATION_DELETED,
                "notification",
                parsedInput.notificationId,
                { type: parsedInput.type, title: parsedInput.title },
            );
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
    await userActionClient
        .metadata({ permission: ActivityAction.NOTIFICATION_READ_ALL })
        .inputSchema(countInput)
        .action(async ({ parsedInput, bindArgsParsedInputs }) => {
            await logActivity(
                bindArgsParsedInputs[0],
                parsedInput.userId,
                ActivityAction.NOTIFICATION_READ_ALL,
                "notification",
                "all",
                { count: parsedInput.count },
            );
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
    await userActionClient
        .metadata({ permission: ActivityAction.NOTIFICATIONS_CLEARED })
        .inputSchema(countInput)
        .action(async ({ parsedInput, bindArgsParsedInputs }) => {
            await logActivity(
                bindArgsParsedInputs[0],
                parsedInput.userId,
                ActivityAction.NOTIFICATIONS_CLEARED,
                "notification",
                "all",
                { count: parsedInput.count },
            );
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
    await userActionClient
        .metadata({ permission: ActivityAction.NOTIFICATIONS_DELIVERED })
        .inputSchema(countInput)
        .action(async ({ parsedInput, bindArgsParsedInputs }) => {
            await logActivity(
                bindArgsParsedInputs[0],
                parsedInput.userId,
                ActivityAction.NOTIFICATIONS_DELIVERED,
                "notification",
                "batch",
                { count: parsedInput.count },
            );
        })(idToken, { userId, count });
}
