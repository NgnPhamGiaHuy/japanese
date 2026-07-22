/**
 * @file auth-session.emu.test.ts
 * Emulator-backed tests for the httpOnly session-cookie lifecycle (ADR-107,
 * T-107a) — mint, verify, and revoke, against the real Auth emulator.
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 *
 * Deliberately does NOT force `GCLOUD_PROJECT` here (unlike T-117c's
 * harness): the emulator's "single project mode" stamps session cookies
 * with its OWN actual linked project as the "aud" claim regardless of what
 * project any calling SDK requests, so `createSessionCookie` and
 * `verifySessionCookie` only agree when both run under the Admin SDK's
 * natural (un-overridden) default — verified empirically.
 */
import { signInWithCustomToken } from "firebase/auth";
import { afterAll, describe, expect, it } from "vitest";

import { auth } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";
import { mintSessionCookie, revokeSession, verifySessionCookie } from "./auth-session";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const UID = "emu_auth_session_user";

async function realIdToken(): Promise<string> {
    try {
        await adminAuth.createUser({ uid: UID, email: "session-test@example.com" });
    } catch (err) {
        if ((err as { code?: string }).code !== "auth/uid-already-exists") throw err;
    }
    const customToken = await adminAuth.createCustomToken(UID);
    const credential = await signInWithCustomToken(auth, customToken);
    return credential.user.getIdToken();
}

d("auth-session lifecycle", () => {
    afterAll(async () => {
        await adminAuth.deleteUser(UID).catch(() => {});
    });

    it("mints a session cookie from a real ID token, and verifies it back to the same uid", async () => {
        const idToken = await realIdToken();
        const sessionCookie = await mintSessionCookie(idToken);

        expect(sessionCookie).toBeTruthy();
        expect(sessionCookie).not.toBe(idToken); // a distinct credential, not a passthrough

        const decoded = await verifySessionCookie(sessionCookie);
        expect(decoded.uid).toBe(UID);
    });

    it("[real server-side verification, not presence] rejects a forged/garbage session cookie", async () => {
        await expect(verifySessionCookie("this-is-not-a-real-session-cookie")).rejects.toThrow();
    });

    it("rejects an empty string", async () => {
        await expect(verifySessionCookie("")).rejects.toThrow();
    });

    it("[revoke actually invalidates the credential] a revoked session cookie fails verification with checkRevoked", async () => {
        const idToken = await realIdToken();
        const sessionCookie = await mintSessionCookie(idToken);

        // Sanity: valid before revocation.
        await expect(verifySessionCookie(sessionCookie)).resolves.toMatchObject({ uid: UID });

        // Revocation compares the cookie's issued-at second against a
        // "valid since" timestamp of the same granularity — a revoke in the
        // same wall-clock second as the mint can tie rather than exclude it.
        // A real revoke and a real mint are never this close in practice;
        // this margin exists only so a genuinely fast test doesn't produce a
        // false negative on the invariant being asserted.
        await new Promise((resolve) => setTimeout(resolve, 1200));

        await revokeSession(UID);

        await expect(verifySessionCookie(sessionCookie)).rejects.toThrow();
    });

    it("a session cookie minted for one user never verifies as a different uid", async () => {
        const idToken = await realIdToken();
        const sessionCookie = await mintSessionCookie(idToken);
        const decoded = await verifySessionCookie(sessionCookie);
        expect(decoded.uid).not.toBe("some-other-uid");
        expect(decoded.uid).toBe(UID);
    });
});
