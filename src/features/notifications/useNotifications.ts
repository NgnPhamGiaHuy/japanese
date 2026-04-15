"use client";

/**
 * Re-exports useNotifications from the context so all existing call sites
 * (BottomNav, NotificationsPage, etc.) continue to work without any changes.
 *
 * The actual subscription now lives in NotificationsContext — one listener
 * for the entire session, shared by every consumer.
 */
export { useNotifications } from "./NotificationsContext";
export type { UseNotificationsResult } from "./NotificationsContext";
