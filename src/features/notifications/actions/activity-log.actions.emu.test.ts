/**
 * @file actions/activity-log.actions.emu.test.ts
 * Emulator-backed proof that the T-106c migration onto `userActionClient`
 * didn't change these 5 wrappers' observable behavior: a real token still
 * results in the expected `system_logs` doc via `logActivity`, and a forged
 * token still resolves to `undefined` (never throws) with nothing written.
 * `logActivity`/`logUserActionServer`'s own identity verification and
 * userId-spoof rejection are already covered thoroughly by
 * `lib/logging/user-actions.emu.test.ts` — not re-derived here. This file
 * only proves the new client wiring (unified base + `.metadata()` +
 * `.inputSchema()`) still reaches that inner layer correctly for both input
 * shapes in this file (`notificationIdInput` and `countInput`).
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 */
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { SYSTEM_LOGS_COLLECTION } from "@/lib/logging/public";
import { logNotificationRead, logNotificationsCleared } from "./activity-log.actions";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const USER = "emu_activitylog_user";

/** Mints a real, emulator-verifiable ID token for `uid` via the Auth emulator's REST API. */
async function mintIdToken(uid: string): Promise<string> {
    const customToken = await adminAuth.createCustomToken(uid);
    const res = await fetch(
        `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        },
    );
    const body = await res.json();
    if (!body.idToken) throw new Error(`Failed to mint test ID token: ${JSON.stringify(body)}`);
    return body.idToken as string;
}

async function clearAll() {
    const snap = await adminDb.collection(SYSTEM_LOGS_COLLECTION).where("userId", "==", USER).get();
    await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
}

d("notifications activity-log actions on userActionClient (T-106c)", () => {
    afterEach(() => clearAll());
    afterAll(async () => {
        await clearAll();
        await adminAuth.deleteUser(USER).catch(() => {});
    });

    it("logNotificationRead persists a system_logs doc via the new client wiring", async () => {
        const token = await mintIdToken(USER);

        await logNotificationRead(token, USER, "noti-1", "comment", "A title");

        const snap = await adminDb
            .collection(SYSTEM_LOGS_COLLECTION)
            .where("userId", "==", USER)
            .where("action", "==", "notification.read")
            .get();
        expect(snap.size).toBe(1);
        const doc = snap.docs[0].data();
        expect(doc.entityType).toBe("notification");
        expect(doc.entityId).toBe("noti-1");
        expect(doc.metadata.type).toBe("comment");
        expect(doc.metadata.title).toBe("A title");
    });

    it("logNotificationsCleared (countInput shape) persists a system_logs doc via the new client wiring", async () => {
        const token = await mintIdToken(USER);

        await logNotificationsCleared(token, USER, 3);

        const snap = await adminDb
            .collection(SYSTEM_LOGS_COLLECTION)
            .where("userId", "==", USER)
            .where("action", "==", "notification.cleared_all")
            .get();
        expect(snap.size).toBe(1);
        const doc = snap.docs[0].data();
        expect(doc.entityType).toBe("notification");
        expect(doc.entityId).toBe("all");
        expect(doc.metadata.count).toBe(3);
    });

    it("a forged token resolves without throwing and writes nothing (userActionClient's own layer rejects before logActivity runs)", async () => {
        await expect(
            logNotificationRead("not-a-real-token", USER, "noti-2", "comment"),
        ).resolves.toBeUndefined();

        const snap = await adminDb
            .collection(SYSTEM_LOGS_COLLECTION)
            .where("userId", "==", USER)
            .where("entityId", "==", "noti-2")
            .get();
        expect(snap.size).toBe(0);
    });
});
