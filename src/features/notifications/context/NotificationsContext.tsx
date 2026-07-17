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
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useAppStore } from "@/lib/app-store";
import { subscribeNotifications } from "../services";
import { groupNotificationsByTime, isUnread } from "../types";

import type { AppNotification, NotificationGroup } from "../types";

// Initial live-window size and the increment each loadMore() call adds to it.
// See subscribeNotifications' docstring for why this grows the
// live window itself rather than layering a separate one-shot page cache.
const PAGE_SIZE = 50;

// ─── Context shape ────────────────────────────────────────────────────────────

interface NotificationsContextValue {
    notifications: AppNotification[];
    groups: NotificationGroup[];
    unreadCount: number;
    loading: boolean;
    /** True only while a loadMore()-triggered resubscribe is in flight — the
     *  already-loaded list stays on screen throughout (unlike `loading`, which
     *  gates the full skeleton state on first load / user change / retry). */
    loadingMore: boolean;
    /** Heuristic: the last page came back full, so more may exist. Flips to
     *  false as soon as a page returns short (see loadMore() docstring). */
    hasMore: boolean;
    loadMore: () => void;
    error: Error | null;
    retry: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
    notifications: [],
    groups: [],
    unreadCount: 0,
    loading: true,
    loadingMore: false,
    hasMore: false,
    loadMore: () => {},
    error: null,
    retry: () => {},
});

// Stable empty reference so the render-time guard doesn't allocate each render.
const EMPTY: AppNotification[] = [];

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAppStore();
    const currentUid = user?.uid ?? null;

    const [state, setState] = useState<{ uid: string | null; items: AppNotification[] }>({
        uid: null,
        items: EMPTY,
    });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    // Bumping this forces the subscription effect to re-run (manual retry).
    const [retryNonce, setRetryNonce] = useState(0);
    // Live-window size — loadMore() grows this, which re-subscribes with a
    // bigger limit() (see subscribeNotifications' docstring).
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    // Tracks which uid the current pageSize/subscription belong to, so a user
    // switch resets pagination instead of carrying over a previous user's
    // expanded window.
    const loadedUidRef = useRef<string | null>(null);

    const retry = useCallback(() => setRetryNonce((n) => n + 1), []);
    const loadMore = useCallback(() => {
        setLoadingMore(true);
        setPageSize((n) => n + PAGE_SIZE);
    }, []);

    // Reset pagination on user change (login as a different user, or logout
    // then login) — otherwise a previous user's expanded window would carry
    // over as an oversized initial fetch for the new one. Adjusted directly
    // during render (React's documented pattern for "reset state when a prop
    // changes") rather than in an effect, since a following effect would cost
    // an extra wasted render with the previous user's stale pageSize.
    const [pageSizeUid, setPageSizeUid] = useState(currentUid);
    if (pageSizeUid !== currentUid) {
        setPageSizeUid(currentUid);
        setPageSize(PAGE_SIZE);
    }

    useEffect(() => {
        // On logout the render-time guards below already yield EMPTY/false
        // (cached uid !== null), so there's nothing to subscribe to and no
        // state to clear beyond the ref.
        if (!currentUid) {
            loadedUidRef.current = null;
            return;
        }
        const uid = currentUid;

        // Only show the full skeleton state on this uid's first-ever load —
        // a loadMore()-driven resubscribe keeps the current list on screen
        // (loadingMore covers that case instead).
        if (loadedUidRef.current !== uid) {
            setLoading(true);
        }

        const unsub = subscribeNotifications(
            uid,
            (updated) => {
                loadedUidRef.current = uid;
                setState({ uid, items: updated });
                setError(null);
                setLoading(false);
                setLoadingMore(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
                setLoadingMore(false);
            },
            pageSize,
        );

        return unsub;
    }, [currentUid, retryNonce, pageSize]);

    // Only trust cached items that belong to the CURRENT user. On an A → B
    // switch, `state` still holds A's items until B's first snapshot arrives —
    // this render-time guard prevents A's list/badge from flashing.
    const notifications = state.uid === currentUid ? state.items : EMPTY;

    const unreadCount = useMemo(() => notifications.filter(isUnread).length, [notifications]);
    const groups = useMemo(() => groupNotificationsByTime(notifications), [notifications]);

    // A full page came back, so the collection may extend further — a short
    // page means we've reached the end. Self-corrects on the very next
    // loadMore() even in the rare exact-multiple-of-pageSize edge case.
    const hasMore = notifications.length >= pageSize;

    // No signed-in user means nothing is loading, regardless of leftover
    // state from a previous session — folded in here rather than reset via
    // setState inside the effect above (see the effect's early-return branch).
    const effectiveLoading = currentUid ? loading : false;
    const effectiveLoadingMore = currentUid ? loadingMore : false;

    const value = useMemo(
        () => ({
            notifications,
            groups,
            unreadCount,
            loading: effectiveLoading,
            loadingMore: effectiveLoadingMore,
            hasMore,
            loadMore,
            error,
            retry,
        }),
        [
            notifications,
            groups,
            unreadCount,
            effectiveLoading,
            effectiveLoadingMore,
            hasMore,
            loadMore,
            error,
            retry,
        ],
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
