/**
 * @file session.actions.emu.test.ts
 * Emulator-backed tests for the session-cookie mint/revoke Server Actions
 * (T-107a). `next/headers`'s `cookies()` only works inside a real Next.js
 * request scope, so it's mocked here with a minimal in-memory cookie jar —
 * everything downstream (mint/verify/revoke) runs against the real Auth
 * emulator, unmocked.
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 */
import { signInWithCustomToken } from "firebase/auth";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

interface FakeCookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: string;
    maxAge?: number;
    path?: string;
}
interface FakeCookieEntry {
    value: string;
    options: FakeCookieOptions;
}

const cookieJar = new Map<string, FakeCookieEntry>();

vi.mock("next/headers", () => ({
    cookies: async () => ({
        get: (name: string) =>
            cookieJar.has(name) ? { name, value: cookieJar.get(name)!.value } : undefined,
        set: (name: string, value: string, options: FakeCookieOptions) => {
            cookieJar.set(name, { value, options });
        },
    }),
}));

const { createSessionAction, revokeSessionAction } = await import("./session.actions");
const { auth } = await import("@/lib/firebase");
const { adminAuth } = await import("@/lib/firebase-admin");

const UID = "emu_session_actions_user";
const COOKIE_NAME = "auth-token";

async function realIdToken(): Promise<string> {
    try {
        await adminAuth.createUser({ uid: UID });
    } catch (err) {
        if ((err as { code?: string }).code !== "auth/uid-already-exists") throw err;
    }
    const customToken = await adminAuth.createCustomToken(UID);
    const credential = await signInWithCustomToken(auth, customToken);
    return credential.user.getIdToken();
}

d("session.actions", () => {
    afterEach(() => cookieJar.clear());
    afterAll(async () => {
        await adminAuth.deleteUser(UID).catch(() => {});
    });

    it("createSessionAction sets an httpOnly cookie whose value verifies back to the signed-in uid", async () => {
        const idToken = await realIdToken();

        const result = await createSessionAction(idToken);

        expect(result.ok).toBe(true);
        const entry = cookieJar.get(COOKIE_NAME);
        expect(entry).toBeDefined();
        expect(entry!.options.httpOnly).toBe(true);
        expect(entry!.value).not.toBe(idToken); // a session cookie, not a token passthrough

        const decoded = await adminAuth.verifySessionCookie(entry!.value, true);
        expect(decoded.uid).toBe(UID);
    });

    it("createSessionAction returns {ok:false} for a forged ID token, and sets no cookie", async () => {
        const result = await createSessionAction("not-a-real-id-token");

        expect(result.ok).toBe(false);
        expect(cookieJar.has(COOKIE_NAME)).toBe(false);
    });

    it("revokeSessionAction clears the cookie and revokes the session server-side", async () => {
        const idToken = await realIdToken();
        await createSessionAction(idToken);
        const sessionCookie = cookieJar.get(COOKIE_NAME)!.value;

        // Revocation compares the cookie's issued-at second against a
        // same-granularity "valid since" timestamp — a revoke in the same
        // wall-clock second as the mint can tie rather than exclude it (see
        // lib/auth-session.emu.test.ts for the same margin, explained fully).
        await new Promise((resolve) => setTimeout(resolve, 1200));

        await revokeSessionAction();

        // Cookie cleared (empty value, maxAge 0).
        const cleared = cookieJar.get(COOKIE_NAME);
        expect(cleared?.value).toBe("");
        expect(cleared?.options.maxAge).toBe(0);

        // And the old session cookie value is now actually revoked, not just
        // locally forgotten — matches T-107a's "revoke actually invalidates
        // the credential server-side" AC.
        await expect(adminAuth.verifySessionCookie(sessionCookie, true)).rejects.toThrow();
    });

    it("revokeSessionAction is a harmless no-op when no cookie is set", async () => {
        const result = await revokeSessionAction();
        expect(result.ok).toBe(true);
    });
});
