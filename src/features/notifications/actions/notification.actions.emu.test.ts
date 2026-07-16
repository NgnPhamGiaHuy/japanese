/**
 * @file actions/notification.actions.emu.test.ts
 * Emulator-backed regression test for `emitNotificationAction`'s
 * server-authoritative guarantees — asserting rejection of forged/absent
 * tokens and forged input IDs (the notifications suite already proves
 * senderId/recipientId stripping separately). No such test existed before
 * this file — added here so the next-safe-action migration has a real
 * regression net instead of code review alone for the most security-sensitive
 * action in the app.
 *
 * GATED: requires the Firestore + Auth emulator (`npm run test:emu`, which
 * boots both via `firebase emulators:exec`). Skips itself when the emulator
 * env is absent so a stray invocation is a no-op rather than a hang.
 */
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { emitNotificationAction } from "./notification.actions";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const APP_ID = "kana-nihongo-master";
const OWNER = "emu_owner";
const COLLABORATOR = "emu_collaborator";
const OUTSIDER = "emu_outsider";
const LESSON_ID = "emu_lesson_1";

function lessonPath(ownerId: string, lessonId: string) {
    return `artifacts/${APP_ID}/users/${ownerId}/lessons/${lessonId}`;
}

function notificationsCol(recipientId: string) {
    return `artifacts/${APP_ID}/users/${recipientId}/notifications`;
}

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

async function seedLesson(overrides: Record<string, unknown> = {}) {
    await adminDb.doc(lessonPath(OWNER, LESSON_ID)).set({
        title: "Emulator Test Deck",
        ownerId: OWNER,
        userId: OWNER,
        roles: { [OWNER]: "owner", [COLLABORATOR]: "editor" },
        ...overrides,
    });
}

async function clearAll() {
    for (const uid of [OWNER, COLLABORATOR, OUTSIDER]) {
        const snap = await adminDb.collection(notificationsCol(uid)).get();
        await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
    }
    await adminDb.doc(lessonPath(OWNER, LESSON_ID)).delete();
}

d("emitNotificationAction — server-authoritative guarantees", () => {
    afterEach(() => clearAll());
    afterAll(() => clearAll());

    it("derives senderId from the verified token, never from the input (input schema has no senderId field)", async () => {
        await seedLesson();
        const token = await mintIdToken(COLLABORATOR);

        const result = await emitNotificationAction(token, {
            kind: "comment",
            ownerId: OWNER,
            lessonId: LESSON_ID,
            cardId: "card1",
            commentId: "comment1",
        });

        expect(result.ok).toBe(true);
        const snap = await adminDb.collection(notificationsCol(OWNER)).get();
        expect(snap.docs).toHaveLength(1);
        expect(snap.docs[0].data().senderId).toBe(COLLABORATOR);
    });

    it("rejects a sender with no role on the lesson (forbidden, nothing written)", async () => {
        await seedLesson();
        const token = await mintIdToken(OUTSIDER);

        const result = await emitNotificationAction(token, {
            kind: "comment",
            ownerId: OWNER,
            lessonId: LESSON_ID,
            cardId: "card1",
            commentId: "comment1",
        });

        expect(result).toEqual({ ok: false, error: "forbidden" });
        const snap = await adminDb.collection(notificationsCol(OWNER)).get();
        expect(snap.docs).toHaveLength(0);
    });

    it("rejects a non-owner attempting a role_change (recipient can never be self-granted by a non-owner)", async () => {
        await seedLesson();
        const token = await mintIdToken(COLLABORATOR);

        const result = await emitNotificationAction(token, {
            kind: "role_change",
            ownerId: OWNER,
            lessonId: LESSON_ID,
            targetUserId: COLLABORATOR,
            newRole: "owner",
        });

        expect(result).toEqual({ ok: false, error: "forbidden" });
        const snap = await adminDb.collection(notificationsCol(COLLABORATOR)).get();
        expect(snap.docs).toHaveLength(0);
    });

    it("lets the owner emit a role_change; recipient is exactly targetUserId (server-derived, not the sender)", async () => {
        await seedLesson();
        const token = await mintIdToken(OWNER);

        const result = await emitNotificationAction(token, {
            kind: "role_change",
            ownerId: OWNER,
            lessonId: LESSON_ID,
            targetUserId: COLLABORATOR,
            newRole: "viewer",
        });

        expect(result.ok).toBe(true);
        const recipientSnap = await adminDb.collection(notificationsCol(COLLABORATOR)).get();
        expect(recipientSnap.docs).toHaveLength(1);
        expect(recipientSnap.docs[0].data().senderId).toBe(OWNER);
        const ownerInbox = await adminDb.collection(notificationsCol(OWNER)).get();
        expect(ownerInbox.docs).toHaveLength(0); // never self-notifies
    });

    it("collapses a repeated comment notification into one doc with an incrementing count (idempotent, not duplicated)", async () => {
        await seedLesson();
        const token = await mintIdToken(COLLABORATOR);
        const input = {
            kind: "comment" as const,
            ownerId: OWNER,
            lessonId: LESSON_ID,
            cardId: "card1",
            commentId: "comment1",
        };

        await emitNotificationAction(token, input);
        await emitNotificationAction(token, input);

        const snap = await adminDb.collection(notificationsCol(OWNER)).get();
        expect(snap.docs).toHaveLength(1);
        expect(snap.docs[0].data().count).toBe(2);
    });

    it("rejects a forged/invalid token before any authorization or write runs", async () => {
        await seedLesson();

        const result = await emitNotificationAction("not-a-real-token", {
            kind: "comment",
            ownerId: OWNER,
            lessonId: LESSON_ID,
            cardId: "card1",
            commentId: "comment1",
        });

        expect(result.ok).toBe(false);
        const snap = await adminDb.collection(notificationsCol(OWNER)).get();
        expect(snap.docs).toHaveLength(0);
    });
});
