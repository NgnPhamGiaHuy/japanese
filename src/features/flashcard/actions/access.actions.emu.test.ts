/**
 * @file actions/access.actions.emu.test.ts
 * Emulator-backed regression test for `acceptInviteAction`.
 *
 * WHY THIS FILE EXISTS
 * ────────────────────
 * Accepting an emailed deck invite was broken end to end: the invitee pressed
 * Accept, landed on the shared-deck route and got "Deck Not Found", because the
 * conversion ran in the invitee's own client SDK — which `firestore.rules`
 * permits neither to READ the lesson recording their invite (read needs
 * public/link-access, the owner, or an existing `roles[uid]`; `invitedEmails`
 * is never consulted) nor to WRITE their own `roles` entry (update needs the
 * owner or an editor).
 *
 * The suite did have coverage of the old client-side conversion —
 * `services/access.service.emu.test.ts` — but it authenticates as the OWNER
 * and says so in its own comment ("owner performing it on their behalf"). That
 * is the one identity for which the rules allow the write, and the one identity
 * that never actually walks this path. So the tests passed while the feature
 * did not work.
 *
 * **Every test here therefore authenticates as the INVITEE**, which is the
 * property that was missing. A regression that reintroduces a client-side
 * grant, or narrows the action back to the owner, fails here.
 *
 * GATED: requires the Firestore + Auth emulator (`npm run test:emu`). Skips
 * itself when the emulator env is absent so a stray invocation is a no-op.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { acceptInviteAction } from "./access.actions";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const APP_ID = "kana-nihongo-master";
const OWNER = "emu_accept_owner";
const INVITEE = "emu_accept_invitee";
const INVITEE_EMAIL = "emu-accept-invitee@example.test";
const STRANGER = "emu_accept_stranger";
const STRANGER_EMAIL = "emu-accept-stranger@example.test";
const LESSON_ID = "emu_accept_lesson";

const lessonPath = (ownerId: string, lessonId: string) =>
    `artifacts/${APP_ID}/users/${ownerId}/lessons/${lessonId}`;

/** Creates the user (idempotent) so its ID token actually carries an email — `acceptInviteAction` matches on `decoded.email`. */
async function ensureUser(uid: string, email: string) {
    try {
        await adminAuth.createUser({ uid, email, emailVerified: true });
    } catch (err) {
        if ((err as { code?: string }).code !== "auth/uid-already-exists") throw err;
    }
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
        title: "Emulator Accept Deck",
        ownerId: OWNER,
        roles: { [OWNER]: "owner" },
        allowLinkAccess: false,
        invitedEmails: { [INVITEE_EMAIL]: { role: "viewer", invitedAt: 1 } },
        ...overrides,
    });
}

const readLesson = async () => (await adminDb.doc(lessonPath(OWNER, LESSON_ID)).get()).data() ?? {};

const clearAll = () => adminDb.doc(lessonPath(OWNER, LESSON_ID)).delete();

d("acceptInviteAction — the invitee converts their own invite", () => {
    beforeAll(async () => {
        await ensureUser(INVITEE, INVITEE_EMAIL);
        await ensureUser(STRANGER, STRANGER_EMAIL);
    });
    afterEach(() => clearAll());
    afterAll(() => clearAll());

    it("grants the invited role and clears the pending entry, authenticated AS THE INVITEE", async () => {
        await seedLesson();

        const result = await acceptInviteAction(await mintIdToken(INVITEE), OWNER, LESSON_ID);

        expect(result).toEqual({ ok: true, role: "viewer" });
        const lesson = await readLesson();
        expect(lesson.roles).toEqual({ [OWNER]: "owner", [INVITEE]: "viewer" });
        // The pending entry must go, or the shared-deck route keeps retrying a
        // conversion the invitee's client SDK is not allowed to perform.
        expect(lesson.invitedEmails).toEqual({});
    });

    it("honors the role the owner chose, not a default", async () => {
        await seedLesson({ invitedEmails: { [INVITEE_EMAIL]: { role: "editor", invitedAt: 1 } } });

        const result = await acceptInviteAction(await mintIdToken(INVITEE), OWNER, LESSON_ID);

        expect(result.role).toBe("editor");
        expect((await readLesson()).roles[INVITEE]).toBe("editor");
    });

    it("refuses an invite addressed to somebody else — the caller's OWN token email is what is matched", async () => {
        await seedLesson(); // invite is for INVITEE_EMAIL

        const result = await acceptInviteAction(await mintIdToken(STRANGER), OWNER, LESSON_ID);

        expect(result).toEqual({ ok: false, error: "not-invited" });
        const lesson = await readLesson();
        expect(lesson.roles).toEqual({ [OWNER]: "owner" });
        expect(lesson.invitedEmails).toHaveProperty(INVITEE_EMAIL);
    });

    it("never downgrades an existing role — re-accepting a stale notification keeps the higher grant", async () => {
        await seedLesson({
            roles: { [OWNER]: "owner", [INVITEE]: "editor" },
            invitedEmails: { [INVITEE_EMAIL]: { role: "viewer", invitedAt: 1 } },
        });

        const result = await acceptInviteAction(await mintIdToken(INVITEE), OWNER, LESSON_ID);

        expect(result.role).toBe("editor");
        const lesson = await readLesson();
        expect(lesson.roles[INVITEE]).toBe("editor");
        expect(lesson.invitedEmails).toEqual({});
    });

    it("is idempotent — accepting twice leaves the same state and still reports the role", async () => {
        await seedLesson();
        const token = await mintIdToken(INVITEE);

        await acceptInviteAction(token, OWNER, LESSON_ID);
        const second = await acceptInviteAction(token, OWNER, LESSON_ID);

        expect(second).toEqual({ ok: true, role: "viewer" });
        expect((await readLesson()).roles).toEqual({ [OWNER]: "owner", [INVITEE]: "viewer" });
    });

    it("falls back to viewer when the stored invite names a role an invite may not confer", async () => {
        await seedLesson({ invitedEmails: { [INVITEE_EMAIL]: { role: "owner", invitedAt: 1 } } });

        const result = await acceptInviteAction(await mintIdToken(INVITEE), OWNER, LESSON_ID);

        expect(result.role).toBe("viewer");
        expect((await readLesson()).roles[INVITEE]).toBe("viewer");
    });

    it("reports not-found for a deck that no longer exists, without throwing", async () => {
        const result = await acceptInviteAction(await mintIdToken(INVITEE), OWNER, LESSON_ID);
        expect(result).toEqual({ ok: false, error: "not-found" });
    });

    it("rejects a forged token instead of trusting the caller-supplied ids", async () => {
        await seedLesson();

        const result = await acceptInviteAction("not-a-real-token", OWNER, LESSON_ID);

        expect(result.ok).toBe(false);
        expect((await readLesson()).roles).toEqual({ [OWNER]: "owner" });
    });

    it("rejects missing ids rather than writing to a malformed path", async () => {
        const token = await mintIdToken(INVITEE);
        expect(await acceptInviteAction(token, "", LESSON_ID)).toEqual({
            ok: false,
            error: "bad-args",
        });
        expect(await acceptInviteAction(token, OWNER, "")).toEqual({
            ok: false,
            error: "bad-args",
        });
    });
});
