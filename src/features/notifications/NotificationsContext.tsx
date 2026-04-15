"use client";

/**
 * @file NotificationsContext.tsx
 *
 * Lifts the Firestore onSnapshot subscription to a single context that lives
 * at the app-shell level (mounted once in Providers, never torn down).
 *
 * WHY THIS IS NEEDED
 * ──────────────────
 * Without this, every component that calls useNotifications() opens its own
 * independent onSnapshot listener. When the user navigates to /notifications,
 * the page mounts fresh, starts with loading=true and an empty array, and
 * waits for the first snapshot event — which looks like "not updating in
 * real-time" even though Firestore is pushing correctly.
 *
 * With this context:
 * - One listener, opened when the user logs in, kept alive for the session.
 * - Every consumer (BottomNav badge, NotificationsPage) reads from the same
 *   already-populated state — zero cold-start delay on navigation.
 * - Firestore pushes arrive once and update every subscriber simultaneously.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useAppStore } from "@/store";
import { subscribeNotifications } from "./notification.service";
import { groupNotificationsByTime, isUnread } from "./types";

import type { AppNotification, NotificationGroup } from "./types";

// ─── Context shape ────────────────────────────────────────────────────────────

interface NotificationsContextValue {
    notifications: AppNotification[];
    groups: NotificationGroup[];
    unreadCount: number;
    loading: boolean;
}

// Exported so useNotifications.ts can re-export it
export type { NotificationsContextValue as UseNotificationsResult };

const NotificationsContext = createContext<NotificationsContextValue>({
    notifications: [],
    groups: [],
    unreadCount: 0,
    loading: true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAppStore();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const uid = user?.uid ?? null;

        if (!uid) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsub = subscribeNotifications(
            uid,
            (updated) => {
                setNotifications(updated);
                setLoading(false);
            },
            () => {
                setLoading(false);
            },
        );

        return unsub;
    }, [user?.uid]);

    const unreadCount = useMemo(() => notifications.filter(isUnread).length, [notifications]);
    const groups = useMemo(() => groupNotificationsByTime(notifications), [notifications]);

    const value = useMemo(
        () => ({ notifications, groups, unreadCount, loading }),
        [notifications, groups, unreadCount, loading],
    );

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

/**
 * Returns the shared notification state.
 * Must be used inside <NotificationsProvider>.
 */
export function useNotifications() {
    return useContext(NotificationsContext);
}
