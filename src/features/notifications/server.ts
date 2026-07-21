/**
 * Notifications Feature — Server Public API
 *
 * @remarks
 * The second entry point (ADR-101 Amendment 1). The client barrel
 * (`@/features/notifications`) exports the inbox's React surface — the
 * provider, the row renderer — so a server action or `server-only` service
 * importing it drags client components into the server graph and fails the
 * build.
 *
 * Server-side callers import from here instead. Nothing in this file may
 * export a React component or a hook.
 */

// Server-authoritative emit path. The caller supplies intent; the recipient is
// derived server-side, never passed in.
export { notifySystemEvent } from "./actions/notification.actions";
