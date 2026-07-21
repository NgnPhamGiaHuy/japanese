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

    // ── Notifications ─────────────────────────────────────────────────────────
    NOTIFICATION_READ: "notification.read",
    NOTIFICATION_READ_ALL: "notification.read_all",
    NOTIFICATION_DELETED: "notification.deleted",
    NOTIFICATIONS_CLEARED: "notification.cleared_all",
    NOTIFICATIONS_DELIVERED: "notification.delivered",

    // ── Audio ─────────────────────────────────────────────────────────────────
    AUDIO_PLAYBACK_FAILED: "audio.playback_failed",

    // ── Admin actions ─────────────────────────────────────────────────────────
    ADMIN_ROLE_GRANTED: "admin.role_granted",
    ADMIN_ROLE_REVOKED: "admin.role_revoked",
    ADMIN_USER_DELETED: "admin.user_deleted",
    ADMIN_CONTENT_DELETED: "admin.content_deleted",
    ADMIN_TEST_LOG: "admin.test_log",

    // ── Report-then-handle: below-boundary failures on real state (T-116a) ────
    // Each covers a class of write that a previous swallow-catch (`.catch(() =>
    // {})`) hid entirely. These are best-effort reports on an already-failed
    // operation, not the operation's own action log.
    SRS_WRITE_FAILED: "study.srs_write_failed",
    STORAGE_CLEANUP_FAILED: "storage.cleanup_failed",
    LOGIN_LOG_FAILED: "user.login_log_failed",
    NOTIFICATION_DELIVERY_FAILED: "notification.delivery_failed",
    CARD_SCHEMA_HEAL_FAILED: "card.schema_heal_failed",
    ADMIN_CLEANUP_FAILED: "admin.cleanup_failed",
} as const;
