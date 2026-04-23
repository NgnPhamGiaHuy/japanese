/**
 * Canonical activity action constants — single source of truth.
 *
 * All logging calls across the system MUST use these constants.
 * Never use raw strings for the `action` field.
 */
export const ActivityAction = {
    // ── Auth ──────────────────────────────────────────────────────────────────
    LOGIN: "user.login",
    LOGOUT: "user.logout",

    // ── Flashcard / Deck (user-facing) ────────────────────────────────────────
    DECK_CREATED: "deck.created",
    DECK_UPDATED: "deck.updated",
    DECK_DELETED: "deck.deleted",
    DECK_SHARED: "deck.shared",
    DECK_UNSHARED: "deck.unshared",

    CARD_CREATED: "card.created",
    CARD_UPDATED: "card.updated",
    CARD_DELETED: "card.deleted",

    STUDY_SESSION_COMPLETED: "study.session_completed",
    STUDY_PROGRESS_RESET: "study.progress_reset",
    MATCH_GAME_COMPLETED: "match.game_completed",
    SPEED_GAME_COMPLETED: "speed.game_completed",

    // ── Sharing / Collaboration ───────────────────────────────────────────────
    SHARE_PRIVACY_UPDATED: "share.privacy_updated",
    SHARE_INVITE_SENT: "share.invite_sent",
    SHARE_INVITE_REVOKED: "share.invite_revoked",
    SHARE_ROLES_UPDATED: "share.roles_updated",

    // ── Kana game modes ───────────────────────────────────────────────────────
    KANA_QUIZ_COMPLETED: "kana.quiz_completed",
    KANA_SURVIVAL_COMPLETED: "kana.survival_completed",
    KANA_PRACTICE_COMPLETED: "kana.practice_completed",

    // ── Admin actions ─────────────────────────────────────────────────────────
    ADMIN_ROLE_GRANTED: "admin.role_granted",
    ADMIN_ROLE_REVOKED: "admin.role_revoked",
    ADMIN_USER_DELETED: "admin.user_deleted",
    ADMIN_CONTENT_DELETED: "admin.content_deleted",
    ADMIN_TEST_LOG: "admin.test_log",
} as const;
