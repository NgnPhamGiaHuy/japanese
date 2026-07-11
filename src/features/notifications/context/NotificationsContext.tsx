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
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAppStore } from "@/lib/app-store";
import { subscribeNotifications } from "../services";
import { groupNotificationsByTime, isUnread } from "../types";

import type { AppNotification, NotificationGroup } from "../types";

// ─── Context shape ────────────────────────────────────────────────────────────

interface NotificationsContextValue {
    notifications: AppNotification[];
    groups: NotificationGroup[];
    unreadCount: number;
    loading: boolean;
    error: Error | null;
    retry: () => void;
}

// Exported so useNotifications.ts can re-export it
export type { NotificationsContextValue as UseNotificationsResult };

const NotificationsContext = createContext<NotificationsContextValue>({
    notifications: [],
    groups: [],
    unreadCount: 0,
    loading: true,
    error: null,
    retry: () => {},
});

// Stable empty reference so the render-time guard doesn't allocate each render.
const EMPTY: AppNotification[] = [];

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAppStore();

    const [state, setState] = useState<{ uid: string | null; items: AppNotification[] }>({
        uid: null,
        items: EMPTY,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    // Bumping this forces the subscription effect to re-run (manual retry).
    const [retryNonce, setRetryNonce] = useState(0);

    const retry = useCallback(() => setRetryNonce((n) => n + 1), []);

    useEffect(() => {
        const uid = user?.uid ?? null;

        // On logout the render-time guard below already yields EMPTY (cached
        // uid !== null), so no state reset is needed here — just stop loading.
        if (!uid) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsub = subscribeNotifications(
            uid,
            (updated) => {
                setState({ uid, items: updated });
                setError(null);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            },
        );

        return unsub;
    }, [user?.uid, retryNonce]);

    // Only trust cached items that belong to the CURRENT user. On an A → B
    // switch, `state` still holds A's items until B's first snapshot arrives —
    // this render-time guard prevents A's list/badge from flashing.
    const currentUid = user?.uid ?? null;
    const notifications = state.uid === currentUid ? state.items : EMPTY;

    const unreadCount = useMemo(() => notifications.filter(isUnread).length, [notifications]);
    const groups = useMemo(() => groupNotificationsByTime(notifications), [notifications]);

    const value = useMemo(
        () => ({ notifications, groups, unreadCount, loading, error, retry }),
        [notifications, groups, unreadCount, loading, error, retry],
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
