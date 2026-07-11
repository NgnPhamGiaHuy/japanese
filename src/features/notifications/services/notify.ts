/**
 * @file services/notify.ts
 * Client facade producers call to emit a notification. Single call site so
 * wiring a new producer is one line and the transport stays swappable.
 *
 * Routes to the authorized server-side writer (emitNotificationAction): the
 * server verifies the sender from the ID token and derives the recipient, so a
 * client can never forge a sender or target an arbitrary inbox.
 *
 * Always fire-and-forget: a notification must never block or fail the user's
 * primary action (posting a comment, etc.).
 *
 * @see NOTIFICATION_SYSTEM_IMPLEMENTATION_PLAN.md — Epic 5, Epic 8
 */

import { auth } from "@/lib/firebase";
import { emitNotificationAction } from "../actions/notification.actions";

import type { EmitNotificationInput } from "../schema";

export async function emitNotification(input: EmitNotificationInput): Promise<void> {
    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        await emitNotificationAction(token, input);
    } catch {
        // Fire-and-forget — never surface a notification failure to the user.
    }
}
