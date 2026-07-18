/**
 * @file lib/logging/user-actions.emu.test.ts
 * Emulator-backed regression test for the merged `persistUserLog` core and
 * its two thin wrappers (`logUserActionServer`, `appendClientLogAction`) —
 * added alongside the E17-T4 consolidation since no test previously asserted
 * on the exact `system_logs` document shape these functions produce.
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 */
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { appendClientLogAction } from "./actions";
import { SYSTEM_LOGS_COLLECTION } from "./public";
import { logUserActionServer } from "./user-actions";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const USER = "emu_log_user";
const OTHER = "emu_log_other";

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
    const snap = await adminDb
        .collection(SYSTEM_LOGS_COLLECTION)
        .where("userId", "in", [USER, OTHER])
        .get();
    await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
}

d("persistUserLog core (logUserActionServer / appendClientLogAction)", () => {
    afterEach(() => clearAll());
    afterAll(async () => {
        await clearAll();
        await adminAuth.deleteUser(USER).catch(() => {});
    });

    it("logUserActionServer persists a log enriched with the token's userName/userEmail", async () => {
        await adminAuth.createUser({
            uid: USER,
            email: "logtest@example.com",
            displayName: "Log Tester",
        });
        const token = await mintIdToken(USER);

        await logUserActionServer(token, {
            action: "test.action",
            entityType: "test",
            entityId: "entity-1",
            level: "info",
            userId: USER,
            metadata: { logType: "USER_ACTION", foo: "bar" },
        });

        const snap = await adminDb
            .collection(SYSTEM_LOGS_COLLECTION)
            .where("userId", "==", USER)
            .where("action", "==", "test.action")
            .get();
        expect(snap.size).toBe(1);
        const doc = snap.docs[0].data();
        expect(doc.entityType).toBe("test");
        expect(doc.entityId).toBe("entity-1");
        expect(doc.level).toBe("info");
        expect(doc.source).toBe("client");
        expect(doc.metadata.logType).toBe("USER_ACTION");
        expect(doc.metadata.foo).toBe("bar");
        expect(doc.metadata.userName).toBe("Log Tester");
        expect(doc.metadata.userEmail).toBe("logtest@example.com");
    });

    it("appendClientLogAction persists a log WITHOUT token enrichment and returns {ok:true}", async () => {
        const token = await mintIdToken(USER);

        const result = await appendClientLogAction(token, {
            action: "test.append",
            entityType: "test",
            entityId: "entity-2",
            level: "info",
            metadata: { foo: "baz" },
        });

        expect(result).toEqual({ ok: true });

        const snap = await adminDb
            .collection(SYSTEM_LOGS_COLLECTION)
            .where("userId", "==", USER)
            .where("action", "==", "test.append")
            .get();
        expect(snap.size).toBe(1);
        const doc = snap.docs[0].data();
        expect(doc.metadata.foo).toBe("baz");
        expect(doc.metadata.userName).toBeUndefined();
        expect(doc.metadata.userEmail).toBeUndefined();
    });

    it("logUserActionServer silently no-ops on userId spoofing (never throws, never writes)", async () => {
        const token = await mintIdToken(USER);

        await expect(
            logUserActionServer(token, {
                action: "test.spoof",
                entityType: "test",
                entityId: "entity-3",
                level: "info",
                userId: OTHER,
                metadata: {},
            }),
        ).resolves.toBeUndefined();

        const snap = await adminDb
            .collection(SYSTEM_LOGS_COLLECTION)
            .where("action", "==", "test.spoof")
            .get();
        expect(snap.size).toBe(0);
    });

    it("appendClientLogAction rejects userId spoofing with {ok:false}", async () => {
        const token = await mintIdToken(USER);

        const result = await appendClientLogAction(token, {
            action: "test.spoof2",
            entityType: "test",
            entityId: "entity-4",
            level: "info",
            userId: OTHER,
            metadata: {},
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toContain("FORBIDDEN");
    });

    it("both functions reject a forged token and write nothing", async () => {
        const bogusToken = "this-is-not-a-real-token";

        const appendResult = await appendClientLogAction(bogusToken, {
            action: "test.forged",
            entityType: "test",
            entityId: "entity-5",
            level: "info",
            metadata: {},
        });
        expect(appendResult.ok).toBe(false);

        await expect(
            logUserActionServer(bogusToken, {
                action: "test.forged2",
                entityType: "test",
                entityId: "entity-6",
                level: "info",
                metadata: {},
            }),
        ).resolves.toBeUndefined();

        const snap = await adminDb
            .collection(SYSTEM_LOGS_COLLECTION)
            .where("action", "in", ["test.forged", "test.forged2"])
            .get();
        expect(snap.size).toBe(0);
    });
});
