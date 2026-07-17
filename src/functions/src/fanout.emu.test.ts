/**
 * @file fanout.emu.test.ts
 * Emulator-backed test for the fan-out delivery write path
 * (deliverOneNotification) — proves the durable per-recipient write is
 * correct and idempotent on retry, without dispatching a real Cloud Task
 * (the trigger wrappers — onTaskDispatched/onCall — stay untested here as
 * thin framework adapters; same testing boundary as digest.ts).
 *
 * GATED: requires the Firestore emulator (`npm run test:emu`).
 */
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { deliverOneNotification } from "./fanout";

import type { FanoutNotificationPayload } from "./fanout";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

if (getApps().length === 0) initializeApp({ projectId: "demo-kana-nihongo" });
const db = getFirestore();

const APP_ID = "kana-nihongo-master";
const RECIPIENT = "emu_fanout_recipient";

function notificationsCol(userId: string) {
    return db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("users")
        .doc(userId)
        .collection("notifications");
}

function payload(
    overrides: Partial<FanoutNotificationPayload["notification"]> = {},
): FanoutNotificationPayload {
    return {
        appId: APP_ID,
        recipientId: RECIPIENT,
        notification: {
            type: "content_removed",
            title: "A deck was removed",
            message: "One of your decks was removed by an administrator.",
            senderId: "system",
            senderName: null,
            lessonId: "emu_lesson_1",
            ...overrides,
        },
    };
}

async function clear(userId: string) {
    const snap = await notificationsCol(userId).get();
    await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
}

d("deliverOneNotification", () => {
    afterEach(() => clear(RECIPIENT));

    afterAll(async () => {
        await Promise.all(getApps().map((app) => app.delete()));
    });

    it("writes a notification doc for the recipient", async () => {
        await deliverOneNotification(db, payload());

        const snap = await notificationsCol(RECIPIENT).get();
        expect(snap.size).toBe(1);
        expect(snap.docs[0].data()).toMatchObject({
            userId: RECIPIENT,
            type: "content_removed",
            status: "unread",
        });
    });

    it("is idempotent — a Cloud Tasks retry of the same payload does not duplicate the doc", async () => {
        await deliverOneNotification(db, payload());
        await deliverOneNotification(db, payload()); // simulates an at-least-once retry

        const snap = await notificationsCol(RECIPIENT).get();
        expect(snap.size).toBe(1);
    });

    it("collapses distinct recipients into distinct docs", async () => {
        const OTHER = "emu_fanout_recipient_2";
        await deliverOneNotification(db, payload());
        await deliverOneNotification(db, { ...payload(), recipientId: OTHER });

        const mine = await notificationsCol(RECIPIENT).get();
        const theirs = await notificationsCol(OTHER).get();
        expect(mine.size).toBe(1);
        expect(theirs.size).toBe(1);

        await clear(OTHER);
    });
});
