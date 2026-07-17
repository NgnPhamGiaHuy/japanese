/**
 * @file digest.ts
 * Daily notification digest — Cloud Functions 2nd gen `onSchedule`.
 *
 * The app's notification writer already collapses same-kind bursts into one
 * doc (writeNotification in features/notifications/actions/notification.actions.ts),
 * but several kinds never collapse (invite, invite_accepted, role_change,
 * access_revoked, content_removed) and an unread one with no further
 * activity just sits in the inbox indefinitely. This sweep finds recipients
 * with notifications that have been unread for >= STALE_AFTER_MS and, once
 * per calendar day (UTC), writes ONE additional digest-summary notification
 * into the same collection/schema so the existing inbox UI renders it with
 * zero client changes.
 */
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { db } from "./firebase-admin";

import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
// A single bounded query rather than hand-rolled pagination — this app's
// scale doesn't warrant it, and pagination here has a real correctness trap:
// a recipient's stale docs split across two pages would be double-digested.
// A hit cap is logged (not silent) and self-heals: anything left over stays
// unread and is picked up by the next day's sweep.
const DIGEST_SWEEP_LIMIT = 2000;

export interface DigestGroup {
    recipientId: string;
    staleCount: number;
}

/**
 * Groups stale-unread notification docs by recipient, derived from each
 * doc's path (artifacts/{appId}/users/{userId}/notifications/{id}).
 */
export function groupStaleByRecipient(docs: QueryDocumentSnapshot[]): DigestGroup[] {
    const counts = new Map<string, number>();
    for (const doc of docs) {
        const recipientId = doc.ref.parent.parent?.id;
        if (!recipientId) continue; // malformed path — skip rather than crash the sweep
        counts.set(recipientId, (counts.get(recipientId) ?? 0) + 1);
    }
    return Array.from(counts, ([recipientId, staleCount]) => ({ recipientId, staleCount }));
}

function periodKey(nowMs: number): string {
    return new Date(nowMs).toISOString().slice(0, 10); // YYYY-MM-DD (UTC) — one digest/day/recipient
}

function notificationsCol(firestore: Firestore, appId: string, userId: string) {
    return firestore
        .collection("artifacts")
        .doc(appId)
        .collection("users")
        .doc(userId)
        .collection("notifications");
}

/**
 * Writes one digest-summary notification for a recipient, keyed by a
 * deterministic `digest:{period}` doc ID so a re-run within the same period
 * is a no-op instead of a duplicate (mirrors the collapse-by-deterministic-ID
 * pattern notification.actions.ts already uses). Returns whether it wrote.
 */
export async function writeDigestForUser(
    firestore: Firestore,
    appId: string,
    group: DigestGroup,
    nowMs: number,
): Promise<boolean> {
    const key = periodKey(nowMs);
    const ref = notificationsCol(firestore, appId, group.recipientId).doc(`digest:${key}`);
    const existing = await ref.get();
    if (existing.exists) return false;

    await ref.set({
        userId: group.recipientId,
        type: "digest",
        title: "Unread notifications waiting",
        message:
            group.staleCount === 1
                ? "You have 1 unread notification from the last day or more."
                : `You have ${group.staleCount} unread notifications from the last day or more.`,
        senderId: "system",
        senderName: null,
        data: { staleCount: group.staleCount },
        link: null,
        priority: "P2",
        category: "system",
        collapseKey: `digest:${group.recipientId}`,
        status: "unread",
        read: false,
        isDeleted: false,
        count: group.staleCount,
        actors: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
}

/**
 * Core sweep, extracted from the onSchedule trigger so it's directly
 * callable from tests against the Firestore emulator without invoking the
 * Cloud Scheduler trigger machinery — the trigger wrapper below is a thin
 * adapter over this.
 *
 * Requires a COLLECTION_GROUP composite index on notifications
 * (status ASC, createdAt ASC) — see firestore.indexes.json.
 */
export async function runDigestSweep(
    firestore: Firestore,
    appId: string,
    nowMs: number = Date.now(),
): Promise<{ usersDigested: number; docsScanned: number; truncated: boolean }> {
    const cutoff = Timestamp.fromMillis(nowMs - STALE_AFTER_MS);
    const snap = await firestore
        .collectionGroup("notifications")
        .where("status", "==", "unread")
        .where("createdAt", "<=", cutoff)
        .orderBy("createdAt")
        .limit(DIGEST_SWEEP_LIMIT)
        .get();

    const truncated = snap.size === DIGEST_SWEEP_LIMIT;
    if (truncated) {
        logger.warn(
            `[runDigestSweep] hit the ${DIGEST_SWEEP_LIMIT}-doc cap; excess stale notifications ` +
                `were not counted this run — they stay unread and are picked up next sweep.`,
        );
    }

    // Exclude prior digests from counting toward the next digest.
    const staleDocs = snap.docs.filter((d) => d.data().type !== "digest");
    const groups = groupStaleByRecipient(staleDocs);
    const wrote = await Promise.all(
        groups.map((g) => writeDigestForUser(firestore, appId, g, nowMs)),
    );

    return {
        usersDigested: wrote.filter(Boolean).length,
        docsScanned: snap.size,
        truncated,
    };
}

const APP_ID = process.env.NOTIFICATIONS_APP_ID ?? "kana-nihongo-master";

export const dailyNotificationDigest = onSchedule(
    { schedule: "every day 09:00", timeZone: "Etc/UTC", region: "us-central1", retryCount: 2 },
    async () => {
        const result = await runDigestSweep(db, APP_ID);
        logger.info("[dailyNotificationDigest] sweep complete", result);
    },
);
