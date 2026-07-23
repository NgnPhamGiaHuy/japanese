/**
 * Notifications Feature — Public API
 *
 * @remarks
 * A headless feature: a realtime context, a server-authoritative write path,
 * and the row renderer the inbox composes. Cross-user writes are never done by
 * the caller — `emitNotification` and friends route through server actions that
 * derive the recipient server-side.
 *
 * This feature must not import from `flashcard`. The invite-action seam
 * (T-102a/b) exists so cross-feature callbacks are injected rather than
 * imported, keeping the dependency one-way.
 */

// Realtime context — mounted once in the provider composition root.
export { NotificationsProvider, useNotifications } from "./context/NotificationsContext";

// Inbox rendering.
export { NotificationsInbox } from "./components";

// Act-side seam. Producing features register their own handlers here at the
// composition root; the inbox renders whatever is registered and never imports
// a feature. This is a public-API obligation of notifications, not an internal
// detail — adding an actionable kind must not require a new import into this
// feature, which is what keeps the dependency one-way (ADR-102).
export { hasNotificationActions, registerNotificationActions } from "./domain/action-registry";
export type {
    NotificationActionContext,
    NotificationActionHandlers,
} from "./domain/action-registry";

// Write path. Server-authoritative: the caller supplies intent, not a recipient.
export {
    deleteAllNotifications,
    deliverPendingNotifications,
    emitNotification,
    markAllNotificationsRead,
    notifyInvite,
    restoreNotifications,
} from "./services";
export { logNotificationsCleared, logNotificationsReadAll } from "./actions/activity-log.actions";

// notifySystemEvent lives on ./server only (ADR-101 Amendment 1). Its sole
// consumer (features/admin) is server-side, and — independent of that —
// importing it here would put an Admin-SDK-backed "use server" action in the
// same module as NotificationsProvider, which Vitest's browser-mode transform
// cannot load (it does not strip "use server" into an RPC stub the way a real
// Next.js build does), breaking every browser test that touches this barrel.

export { isUnread } from "./types";
export type { AppNotification, NotificationGroup } from "./types";
