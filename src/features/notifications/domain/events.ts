/**
 * @file domain/events.ts
 * The normalized event vocabulary of the notification platform (Epic 4).
 *
 * A "domain event" is what a producer emits ("user A commented on card X in deck
 * Y, owner is B"). The notification policy (registry.ts) turns that into an
 * inbox document with a priority and a collapse key. Keeping this vocabulary in
 * one pure, Firebase-free module makes it unit-testable and the single place new
 * event kinds are declared.
 *
 * NOTE on `NotificationKind` vs the legacy `NotificationType` (types/index.ts):
 * the legacy 4-value union still describes stored documents and drives the
 * existing icon switch. `NotificationKind` is the FORWARD superset the platform
 * is built around; the two are reconciled as producers migrate (Epic 8).
 *
 * @see NOTIFICATION_SYSTEM_IMPLEMENTATION_PLAN.md — Epic 4
 */

/**
 * Every notification kind the platform knows about. `active: true` entries in
 * the registry are wired to a producer in the current phase; the rest are
 * declared here so the registry, preferences UI, and grouped renderer have a
 * single, complete extension point.
 */
export type NotificationKind =
    // Collaboration
    | "invite"
    | "invite_accepted"
    | "invite_declined"
    | "role_change"
    | "access_revoked"
    | "comment"
    | "reply"
    | "comment_resolved"
    | "deck_updated"
    | "deck_deleted"
    | "deck_duplicated"
    | "privacy_changed"
    // System
    | "content_removed"
    // Social / competitive
    | "overtaken"
    | "leaderboard_top3"
    // Self / progress
    | "achievement";

/** Interruption tier. P0 = badge (+ future push); P1 = inbox; P2 = quiet/feed. */
export type NotificationPriority = "P0" | "P1" | "P2";

/** Grouping bucket for preferences and rendering. */
export type NotificationCategory = "collaboration" | "system" | "social" | "achievement";

/**
 * The normalized shape a producer emits. Only `kind`, `recipientId`, and
 * `senderId` are always required; the rest scope the collapse key and payload
 * per kind. `senderId === recipientId` is allowed only for self-notifications
 * (achievements).
 */
export interface NotificationInput {
    kind: NotificationKind;
    recipientId: string;
    senderId: string;
    senderName?: string | null;
    /** Deck/lesson this event concerns (most collaboration kinds). */
    lessonId?: string;
    /** Card the event concerns (comment kinds). */
    cardId?: string;
    /** Comment the event concerns (reply / resolve). */
    commentId?: string;
    /** Game mode for competitive kinds (overtaken / leaderboard_top3). */
    gameMode?: string;
    /** Sub-kind for achievements (new_best / tier_up / level_up / streak / mastered). */
    achievementKind?: string;
    /** New role label for role_change messages. */
    role?: string;
    /** Optional prebuilt display strings (producers may supply). */
    title?: string;
    message?: string;
    shareLink?: string;
}
