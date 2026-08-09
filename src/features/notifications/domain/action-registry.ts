/**
 * @file action-registry.ts
 * The act-side inversion point: notification kind → action handlers.
 *
 * @remarks
 * Notifications already inverts the **write** side — producing features call
 * `emitNotification` and a registry decides how the event is shaped. There was
 * no equivalent for the **act** side, so the inbox had to import each kind's
 * handler directly from the feature that produced it. That single import
 * (`InviteActions` → flashcard's decline action) was the repository's only
 * feature-level value-import cycle, and it is why a barrel migration of both
 * directions fails the build.
 *
 * This is the missing half. Producing features register their handlers at the
 * composition root; the inbox renders whatever is registered and never names a
 * feature. Adding an actionable kind touches the producing feature and the
 * composition root — never this file, and never the inbox.
 *
 * Deliberately Firebase-free and dependency-free: this is domain-layer code,
 * and the handlers themselves live in the features that own the work.
 */
import type { NotificationKind } from "./events";
import type { AppNotification } from "../types";

/** What a handler is given when the user acts on a notification. */
export interface NotificationActionContext {
    /** Fresh Firebase ID token, for handlers that call server actions. */
    idToken: string;
    /** The notification being acted on. */
    notification: AppNotification;
    /** The signed-in user performing the action. */
    userId: string;
}

/**
 * Handlers a producing feature may register for one kind.
 *
 * Optional by design: a kind that only needs the inbox's own behaviour
 * (mark-read, navigate, delete) registers nothing and is not "unhandled".
 */
export interface NotificationActionHandlers {
    /**
     * Feature-specific work when the user accepts — e.g. converting a pending
     * email invite into a real role grant.
     *
     * Unlike {@link onDecline} this is **awaited before the inbox navigates**,
     * because the destination usually depends on the grant having landed.
     * A rejection is reported and navigation still proceeds — the destination
     * renders its own access-denied state, which is more honest than trapping
     * the user in the inbox.
     */
    onAccept?: (ctx: NotificationActionContext) => void | Promise<void>;

    /**
     * Feature-specific work when the user declines — e.g. revoking a pending
     * invite so it cannot silently re-convert to access later.
     *
     * The inbox has already performed its own part (deleting the notification,
     * writing the audit log) before this runs.
     */
    onDecline?: (ctx: NotificationActionContext) => void | Promise<void>;
}

const registry = new Map<NotificationKind, NotificationActionHandlers>();

/**
 * Register a producing feature's handlers for one kind. Call at the
 * composition root, before the inbox can render.
 *
 * Re-registering the same kind replaces the previous entry — the composition
 * root is expected to run once, and a duplicate registration in development
 * (Fast Refresh, StrictMode double-invoke) should be idempotent rather than
 * an error.
 */
export function registerNotificationActions(
    kind: NotificationKind,
    handlers: NotificationActionHandlers,
): void {
    registry.set(kind, handlers);
}

/** Whether any handlers are registered for a kind. */
export function hasNotificationActions(kind: NotificationKind): boolean {
    return registry.has(kind);
}

/**
 * Look up handlers for a kind.
 *
 * Returns `undefined` when nothing is registered. Callers that *expect* a
 * handler should use {@link resolveNotificationActions} instead, so the
 * missing-registration case is reported rather than silently rendering a
 * button that does nothing.
 */
export function getNotificationActions(
    kind: NotificationKind,
): NotificationActionHandlers | undefined {
    return registry.get(kind);
}

/** Kinds already reported as unregistered, so the report fires once per kind. */
const reportedMissing = new Set<NotificationKind>();

/**
 * Look up handlers for a kind that is expected to have them, reporting once if
 * none are registered.
 *
 * This is the degraded path ADR-102 names as the seam's new failure mode: a
 * missed registration turns a working action into a silently missing button.
 * Silence is the danger, so the caller renders without the action (never
 * crashing) and the absence is reported through the injected reporter.
 *
 * The reporter is injected rather than imported so this module stays
 * dependency-free and unit-testable without a logging stack.
 */
export function resolveNotificationActions(
    kind: NotificationKind,
    report: (message: string) => void,
): NotificationActionHandlers | undefined {
    const handlers = registry.get(kind);
    if (!handlers && !reportedMissing.has(kind)) {
        reportedMissing.add(kind);
        report(
            `No notification action handlers registered for kind "${kind}". ` +
                `The action was not rendered. A producing feature must call ` +
                `registerNotificationActions("${kind}", …) at the composition root.`,
        );
    }
    return handlers;
}

/** Test-only: clear all registrations and the reported-missing memo. */
export function __resetNotificationActionsForTest(): void {
    registry.clear();
    reportedMissing.clear();
}
