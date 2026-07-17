/**
 * @file notification-paths
 * Firestore path helpers, batch-sizing constants, and the TTL-timestamp
 * helper shared across the notification service modules — split out of
 * notification.service.ts (E11-T4).
 */
import { collection, doc, Timestamp } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";

// ─── Batch sizing ─────────────────────────────────────────────────────────────
// Firestore caps a write batch at 500 operations. Single-op updates chunk at
// 400; delivery (set + delete per item = 2 ops) chunks at 200.
export const UPDATE_CHUNK = 400;
export const DELIVERY_CHUNK = 200;

// ─── Retention (TTL) ──────────────────────────────────────────────────────────
// Read/soft-deleted docs get an `expiresAt` so a Firestore TTL policy on the
// `expiresAt` field can reap them (unread docs never expire). The TTL policy
// itself is configured in GCP, not here — see docs/testing-notifications.md.
const DAY_MS = 86_400_000;
export const READ_TTL_MS = 180 * DAY_MS;
export const DELETED_TTL_MS = 30 * DAY_MS;

export function expiresAtFromNow(ttlMs: number, nowMs: number = Date.now()): Timestamp {
    return Timestamp.fromMillis(nowMs + ttlMs);
}

export function notificationsCol(userId: string) {
    return collection(db, "artifacts", APP_ID, "users", userId, "notifications");
}

export function notificationDoc(userId: string, notificationId: string) {
    return doc(db, "artifacts", APP_ID, "users", userId, "notifications", notificationId);
}

/**
 * Pending notifications keyed by email — delivered when the user logs in.
 * Path: artifacts/{appId}/pendingNotifications/{normalizedEmail}/items/{id}
 */
export function pendingNotificationsCol(normalizedEmail: string) {
    return collection(db, "artifacts", APP_ID, "pendingNotifications", normalizedEmail, "items");
}
