/**
 * @file domain/events.ts
 * The normalized event vocabulary of the notification platform.
 *
 * A "domain event" is what a producer emits ("user A commented on card X in deck
 * Y, owner is B"). The notification policy (registry.ts) turns that into an
 * inbox document with a priority and a collapse key. Keeping this vocabulary in
 * one pure, Firebase-free module makes it unit-testable and the single place new
 * event kinds are declared.
 *
 * NOTE on `NotificationKind` vs the stored-document `NotificationType`
 * (types/index.ts, ADR-108/T-108a): the two are reconciled — `NotificationType`
 * is defined as `NotificationKind | "digest"`, the one value a producer writes
 * without going through this vocabulary (the Cloud Function digest sweep
 * writes directly to Firestore, bypassing `NotificationInput` entirely).
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
    | "role_change"
    | "access_revoked"
    | "comment"
    | "reply"
    | "comment_resolved"
    | "deck_duplicated"
    // System
    | "content_removed";

/** Interruption tier. P0 = badge (+ future push); P1 = inbox; P2 = quiet/feed. */
export type NotificationPriority = "P0" | "P1" | "P2";

/** Grouping bucket for preferences and rendering. */
export type NotificationCategory = "collaboration" | "system" | "social" | "achievement";

/**
 * The normalized shape a producer emits. Only `kind`, `recipientId`, and
 * `senderId` are always required; the rest scope the collapse key and payload
 * per kind. `writeNotification`'s caller treats `senderId === recipientId` as
 * a no-op for every kind (never self-notifies) — see notification.actions.ts.
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
    /** New role label for role_change messages. */
    role?: string;
    /** Optional prebuilt display strings (producers may supply). */
    title?: string;
    message?: string;
    shareLink?: string;
}
