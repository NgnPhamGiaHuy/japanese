/**
 * @file notification-subscribe
 * Real-time notification listener — split out of notification.service.ts
 * (E11-T4).
 */
import { limit, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { notificationsCol } from "./notification-paths";
import { toMillis } from "../domain/utils";

import type { QueryDocumentSnapshot, Unsubscribe } from "firebase/firestore";
import type { AppNotification } from "../types";

/**
 * Maps a Firestore snapshot to an AppNotification, normalizing `createdAt` to
 * epoch millis regardless of whether the stored value is a legacy client-clock
 * number or a resolved `serverTimestamp()` Timestamp (see domain/utils.toMillis).
 */
function mapNotificationDoc(d: QueryDocumentSnapshot): AppNotification {
    const data = d.data();
    return { ...data, id: d.id, createdAt: toMillis(data.createdAt) } as AppNotification;
}

/**
 * Real-time listener for a user's notifications.
 *
 * Strategy:
 * 1. Try the composite-index query (isDeleted != true + createdAt desc).
 * 2. If Firestore rejects it (index not yet built), transparently fall back to
 *    a simple createdAt-only query and filter isDeleted client-side.
 * 3. If the FALLBACK errors too, surface it via `onError` and re-subscribe with
 *    capped exponential backoff (1s → 2s → … → 60s), resetting on any success.
 *    (previously a dead fallback stream stayed dead until the uid
 *    changed, and an errored stream was indistinguishable from an empty inbox.)
 *
 * No listener leaks: the returned unsubscribe stops the active listener AND any
 * pending retry timer.
 *
 * Pagination: `limitCount` grows the live window itself (50 → 100
 * → 150 …) rather than layering a separate one-shot "older page" cache on top.
 * A static tail cache would go stale in a subtle way — as new docs push the
 * live window's oldest item out, that item falls into a gap that's neither
 * live-covered nor part of any already-fetched page. Re-querying with a bigger
 * limit keeps everything under one always-live source of truth instead.
 */
export function subscribeNotifications(
    userId: string,
    onUpdate: (notifications: AppNotification[]) => void,
    onError?: (err: Error) => void,
    limitCount: number = 50,
): Unsubscribe {
    let active = true;
    let currentUnsub: Unsubscribe = () => {};
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const clearTimer = () => {
        if (retryTimer) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
    };

    const scheduleRetry = (open: () => void) => {
        clearTimer();
        const delay = Math.min(60_000, 1_000 * 2 ** attempt);
        attempt += 1;
        retryTimer = setTimeout(() => {
            if (active) open();
        }, delay);
    };

    const openFallback = () => {
        const fallbackQ = query(
            notificationsCol(userId),
            orderBy("createdAt", "desc"),
            limit(limitCount),
        );
        currentUnsub = onSnapshot(
            fallbackQ,
            (snap) => {
                attempt = 0; // recovered
                onUpdate(snap.docs.map(mapNotificationDoc).filter((n) => !n.isDeleted));
            },
            (fallbackErr) => {
                console.error("[NotificationService] Fallback listener error:", fallbackErr);
                onError?.(fallbackErr);
                scheduleRetry(openFallback);
            },
        );
    };

    const openPrimary = () => {
        const primaryQ = query(
            notificationsCol(userId),
            where("isDeleted", "!=", true),
            orderBy("isDeleted"),
            orderBy("createdAt", "desc"),
            limit(limitCount),
        );
        currentUnsub = onSnapshot(
            primaryQ,
            (snap) => {
                attempt = 0;
                onUpdate(snap.docs.map(mapNotificationDoc));
            },
            (err) => {
                // Composite index not yet created — swap to the fallback listener.
                console.warn(
                    "[NotificationService] Primary query failed, using fallback:",
                    err.message,
                );
                currentUnsub();
                openFallback();
            },
        );
    };

    openPrimary();

    return () => {
        active = false;
        clearTimer();
        currentUnsub();
    };
}
