export type NotificationType = "invite" | "comment" | "reply" | "role_change";

/**
 * Lifecycle status of a notification.
 * - `unread`: delivered but not yet opened
 * - `read`: user has opened or explicitly marked it
 */
export type NotificationStatus = "unread" | "read";

/**
 * Structured payload for actionable notifications.
 * Kept separate from top-level fields to avoid schema bloat.
 */
export interface NotificationData {
    /** The deck/lesson this notification relates to */
    lessonId?: string;
    /** UID of the user who sent the invite (for accept/decline flows) */
    inviterId?: string;
    /** The role being offered in an invite notification */
    inviteRole?: string;
    /** The share link for the deck */
    shareLink?: string;
    /** Comment ID for comment/reply notifications */
    commentId?: string;
}

export interface AppNotification {
    id: string;
    /** The user who should receive this notification */
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    /** Structured payload for action handling (accept invite, navigate to comment, etc.) */
    data?: NotificationData;

    // ─── Lifecycle ────────────────────────────────────────────────────────
    /** Read/unread state — replaces the old boolean `read` field */
    status: NotificationStatus;
    /** Epoch ms when the user read this notification */
    readAt?: number;
    /**
     * Soft-delete flag. Never hard-delete — keeps audit history intact.
     * Filtered out at the query level.
     */
    isDeleted?: boolean;

    // ─── Sender snapshot ──────────────────────────────────────────────────
    /** UID of the user who triggered the event */
    senderId: string;
    /** Display name of the sender (snapshot at creation time) */
    senderName?: string | null;

    // ─── Legacy fields (kept for backward compat with existing documents) ─
    /** @deprecated Use `data.lessonId` instead. Kept for existing Firestore docs. */
    deckId?: string;
    /** @deprecated Use message field. Kept for existing Firestore docs. */
    deckTitle?: string | null;
    /** @deprecated Use `data.shareLink` instead. Kept for existing Firestore docs. */
    link?: string;
    /**
     * @deprecated Use `status === "unread"` instead.
     * Kept so old documents without `status` still work via `isUnread()` helper.
     */
    read?: boolean;

    createdAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Unified unread check that handles both old (`read: boolean`) and
 * new (`status: "unread"`) document shapes.
 */
export function isUnread(n: AppNotification): boolean {
    // New schema takes priority
    if (n.status !== undefined) return n.status === "unread";
    // Legacy fallback
    return n.read === false;
}

/**
 * Groups a flat notification list into time buckets for display.
 */
export type NotificationGroup = {
    label: "Today" | "Yesterday" | "Earlier";
    items: AppNotification[];
};

export function groupNotificationsByTime(notifications: AppNotification[]): NotificationGroup[] {
    const now = Date.now();
    const DAY = 86_400_000;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const yesterdayMs = todayMs - DAY;

    const groups: Record<"Today" | "Yesterday" | "Earlier", AppNotification[]> = {
        Today: [],
        Yesterday: [],
        Earlier: [],
    };

    for (const n of notifications) {
        if (n.createdAt >= todayMs) {
            groups.Today.push(n);
        } else if (n.createdAt >= yesterdayMs) {
            groups.Yesterday.push(n);
        } else {
            groups.Earlier.push(n);
        }
    }

    return (["Today", "Yesterday", "Earlier"] as const)
        .filter((label) => groups[label].length > 0)
        .map((label) => ({ label, items: groups[label] }));
}
