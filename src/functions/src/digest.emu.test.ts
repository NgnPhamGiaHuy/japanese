/**
 * @file digest.emu.test.ts
 * Emulator-backed test for the digest sweep's Firestore semantics
 * (collectionGroup query + idempotent per-period write) — exercises
 * runDigestSweep/groupStaleByRecipient directly against the Firestore
 * emulator, not through the onSchedule trigger wrapper (Firebase's own
 * recommended testing approach for v2 functions — see digest.ts's header).
 *
 * GATED: requires the Firestore emulator (`npm run test:emu`, which boots it
 * via `firebase emulators:exec`). Skips itself when the emulator env is
 * absent so a stray `vitest run` is a no-op rather than a hang.
 */
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { groupStaleByRecipient, runDigestSweep } from "./digest";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

if (getApps().length === 0) initializeApp({ projectId: "demo-kana-nihongo" });
const db = getFirestore();

const APP_ID = "kana-nihongo-master";
const DAY_MS = 86_400_000;

function notificationsCol(userId: string) {
    return db
        .collection("artifacts")
        .doc(APP_ID)
        .collection("users")
        .doc(userId)
        .collection("notifications");
}

async function seedNotification(
    userId: string,
    id: string,
    overrides: Record<string, unknown> = {},
) {
    await notificationsCol(userId)
        .doc(id)
        .set({
            userId,
            type: "comment",
            status: "unread",
            isDeleted: false,
            createdAt: Timestamp.fromMillis(Date.now() - 2 * DAY_MS),
            ...overrides,
        });
}

async function clear(userId: string) {
    const snap = await notificationsCol(userId).get();
    await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
}

d("runDigestSweep", () => {
    const USER_A = "emu_digest_user_a";
    const USER_B = "emu_digest_user_b";

    afterEach(async () => {
        await Promise.all([clear(USER_A), clear(USER_B)]);
    });

    afterAll(async () => {
        // vitest keeps the process alive otherwise — the Admin SDK holds an
        // open gRPC channel to the emulator.
        await Promise.all(getApps().map((app) => app.delete()));
    });

    it("writes one digest per recipient for stale unread notifications", async () => {
        await seedNotification(USER_A, "n1");
        await seedNotification(USER_A, "n2");
        await seedNotification(USER_B, "n3");
        // Fresh (not stale) — must not count.
        await seedNotification(USER_B, "n4", { createdAt: Timestamp.fromMillis(Date.now()) });

        const result = await runDigestSweep(db, APP_ID);
        expect(result.usersDigested).toBe(2);

        const today = new Date().toISOString().slice(0, 10);
        const digestA = await notificationsCol(USER_A).doc(`digest:${today}`).get();
        expect(digestA.exists).toBe(true);
        expect(digestA.data()?.count).toBe(2);

        const digestB = await notificationsCol(USER_B).doc(`digest:${today}`).get();
        expect(digestB.exists).toBe(true);
        expect(digestB.data()?.count).toBe(1);
    });

    it("is idempotent within the same period — a second sweep does not duplicate or re-count", async () => {
        await seedNotification(USER_A, "n1");

        const first = await runDigestSweep(db, APP_ID);
        expect(first.usersDigested).toBe(1);

        const second = await runDigestSweep(db, APP_ID);
        expect(second.usersDigested).toBe(0);

        const today = new Date().toISOString().slice(0, 10);
        const snap = await notificationsCol(USER_A).get();
        expect(snap.docs.filter((doc) => doc.id === `digest:${today}`)).toHaveLength(1);
    });

    it("excludes prior digest docs from the next digest's count", async () => {
        await seedNotification(USER_A, "n1");
        await runDigestSweep(db, APP_ID); // writes a digest doc for USER_A

        // Force the just-written digest to look stale too, then sweep again —
        // it must not count itself.
        const today = new Date().toISOString().slice(0, 10);
        await notificationsCol(USER_A)
            .doc(`digest:${today}`)
            .update({ createdAt: Timestamp.fromMillis(Date.now() - 2 * DAY_MS) });

        const result = await runDigestSweep(db, APP_ID);
        expect(result.usersDigested).toBe(0);
    });
});

d("groupStaleByRecipient", () => {
    const USER_A = "emu_group_user_a";

    afterEach(() => clear(USER_A));

    it("groups by the recipient derived from each doc's Firestore path", async () => {
        await seedNotification(USER_A, "n1");
        await seedNotification(USER_A, "n2");
        const snap = await notificationsCol(USER_A).get();

        expect(groupStaleByRecipient(snap.docs)).toEqual([{ recipientId: USER_A, staleCount: 2 }]);
    });
});
