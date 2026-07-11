/**
 * @file domain/registry.ts
 * The notification type registry (Epic 4) — the single source of truth mapping
 * each NotificationKind to its policy: priority, category, whether a producer is
 * wired this phase, and how it collapses.
 *
 * Adding a notification type = adding ONE entry here. The server writer
 * (collapse + priority), the preferences UI (category), and the grouped
 * renderer all read from this table instead of re-deriving behavior per type.
 *
 * Pure (no Firebase). `collapseKey` returns the OBJECT-scoped grouping token;
 * the recipient is folded in by domain/id.ts collapseId(), so two different
 * users never share a collapse doc.
 *
 * @see NOTIFICATION_SYSTEM_IMPLEMENTATION_PLAN.md — Epic 4, Epic 8
 */

import type {
    NotificationCategory,
    NotificationInput,
    NotificationKind,
    NotificationPriority,
} from "./events";

export interface NotificationPolicy {
    priority: NotificationPriority;
    category: NotificationCategory;
    /**
     * Whether a producer emits this kind in the CURRENT phase. Planned kinds are
     * declared (so the registry is complete) but not yet wired — flip to true
     * when the producer lands.
     */
    active: boolean;
    /**
     * Does this kind COLLAPSE multiple events into one inbox doc (comment
     * bursts, "5 people saved your deck"), or is each event its own doc that is
     * merely DEDUPED on retry?
     */
    collapses: boolean;
    /**
     * Object-scoped collapse token (recipient added later by collapseId). Two
     * inputs with the same token + recipient target the same inbox document.
     */
    collapseKey: (input: NotificationInput) => string;
}

const lesson = (i: NotificationInput) => i.lessonId ?? "unknown";

export const NOTIFICATION_REGISTRY: Record<NotificationKind, NotificationPolicy> = {
    // ─── Collaboration ────────────────────────────────────────────────────
    invite: {
        priority: "P0",
        category: "collaboration",
        active: true, // wired today (access.service)
        collapses: false, // dedup only — one invite per (deck, recipient)
        collapseKey: (i) => `invite:${lesson(i)}`,
    },
    invite_accepted: {
        priority: "P1",
        category: "collaboration",
        active: true, // wired (access.service syncInviteToCollaborator)
        collapses: false,
        collapseKey: (i) => `invite_accepted:${lesson(i)}:${i.senderId}`,
    },
    invite_declined: {
        priority: "P2",
        category: "collaboration",
        active: false,
        collapses: false,
        collapseKey: (i) => `invite_declined:${lesson(i)}:${i.senderId}`,
    },
    role_change: {
        priority: "P1",
        category: "collaboration",
        active: true, // wired (ShareModal handleUpdateUserRole)
        collapses: false,
        collapseKey: (i) => `role_change:${lesson(i)}`,
    },
    access_revoked: {
        priority: "P1",
        category: "collaboration",
        active: true, // wired (ShareModal handleRemoveUser)
        collapses: false,
        collapseKey: (i) => `access_revoked:${lesson(i)}`,
    },
    comment: {
        priority: "P0",
        category: "collaboration",
        active: true, // wired (comment.service addComment)
        collapses: true, // "3 new comments on <card>"
        collapseKey: (i) => `comment:${lesson(i)}:${i.cardId ?? "deck"}`,
    },
    reply: {
        priority: "P0",
        category: "collaboration",
        active: true, // wired (comment.service replyToComment)
        collapses: true,
        collapseKey: (i) => `reply:${i.commentId ?? lesson(i)}`,
    },
    comment_resolved: {
        priority: "P1",
        category: "collaboration",
        active: true, // wired (comment.service resolveComment)
        collapses: false,
        collapseKey: (i) => `comment_resolved:${i.commentId ?? lesson(i)}`,
    },
    deck_updated: {
        priority: "P1",
        category: "collaboration",
        active: false,
        collapses: true, // collapse an edit burst per actor per day
        collapseKey: (i) => `deck_updated:${lesson(i)}:${i.senderId}`,
    },
    deck_deleted: {
        priority: "P1",
        category: "collaboration",
        active: false,
        collapses: false,
        collapseKey: (i) => `deck_deleted:${lesson(i)}`,
    },
    deck_duplicated: {
        priority: "P2",
        category: "collaboration",
        active: true, // wired (shared deck duplication)
        collapses: true, // "5 people saved your deck"
        collapseKey: (i) => `deck_duplicated:${lesson(i)}`,
    },
    privacy_changed: {
        priority: "P2",
        category: "collaboration",
        active: false,
        collapses: false,
        collapseKey: (i) => `privacy_changed:${lesson(i)}`,
    },
    // ─── System ───────────────────────────────────────────────────────────
    content_removed: {
        priority: "P0",
        category: "system",
        active: true, // wired (admin deleteGlobalFlashcardAction, server-internal)
        collapses: false,
        collapseKey: (i) => `content_removed:${lesson(i)}`,
    },
    // ─── Social / competitive ─────────────────────────────────────────────
    overtaken: {
        priority: "P2",
        category: "social",
        active: false,
        collapses: true, // one per game mode per day
        collapseKey: (i) => `overtaken:${i.gameMode ?? "unknown"}`,
    },
    leaderboard_top3: {
        priority: "P2",
        category: "social",
        active: false,
        collapses: false,
        collapseKey: (i) => `leaderboard_top3:${i.gameMode ?? "unknown"}`,
    },
    // ─── Self / progress ──────────────────────────────────────────────────
    achievement: {
        priority: "P1",
        category: "achievement",
        active: false,
        collapses: false,
        collapseKey: (i) => `achievement:${i.achievementKind ?? "unknown"}`,
    },
};

export function policyOf(kind: NotificationKind): NotificationPolicy {
    return NOTIFICATION_REGISTRY[kind];
}

/** Object-scoped collapse token for an input (see collapseId for the doc ID). */
export function collapseKeyOf(input: NotificationInput): string {
    return NOTIFICATION_REGISTRY[input.kind].collapseKey(input);
}
