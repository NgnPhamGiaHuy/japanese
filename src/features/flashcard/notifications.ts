/**
 * @file notifications.ts
 * Flashcard's registration of its own notification action handlers.
 *
 * @remarks
 * Invites are issued by this feature, so revoking one when the recipient
 * declines is this feature's work. The inbox must not know that — it renders
 * whatever handlers are registered and never names a producing feature.
 *
 * This is the direction that closes the repository's only feature-level
 * value-import cycle: notifications no longer reaches into flashcard, and
 * flashcard reaches into notifications' seam instead (ADR-102).
 *
 * Called once from the composition root. Adding another actionable kind means
 * another entry here — never an edit inside notifications.
 */
import { registerNotificationActions } from "@/features/notifications";
import { acceptInviteAction, declineInviteAction } from "./actions/access.actions";

let registered = false;

/**
 * Registers flashcard's handlers on notifications' act-side seam.
 *
 * Guarded so repeated calls are cheap — the composition root can re-run under
 * Fast Refresh and StrictMode. (The registry itself is idempotent; this simply
 * avoids redundant work.)
 */
export function registerFlashcardNotificationActions(): void {
    if (registered) return;
    registered = true;

    registerNotificationActions("invite", {
        onAccept: async ({ idToken, notification }) => {
            const ownerId = notification.data?.inviterId;
            const lessonId = notification.data?.lessonId;

            if (!ownerId || !lessonId) return;
            const result = await acceptInviteAction(idToken, ownerId, lessonId);
            if (!result.ok) {
                console.error("[flashcard] accepting invite failed:", result.error);
            }
        },

        onDecline: async ({ idToken, notification }) => {
            const ownerId = notification.data?.inviterId;
            const lessonId = notification.data?.lessonId;
            // Revoke the pending invite so it cannot silently re-convert to
            // access on the next share-link visit. Missing ids mean the
            // notification predates the current payload shape; the decline
            // still stands, there is simply nothing to revoke.
            if (!ownerId || !lessonId) return;
            await declineInviteAction(idToken, ownerId, lessonId);
        },
    });
}
