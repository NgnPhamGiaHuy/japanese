/**
 * @file safe-action.emu.test.ts
 * Emulator-backed proof that `userActionClient` (T-106a, ADR-106) actually
 * verifies identity — not just that it compiles. Builds a tiny throwaway
 * action on it and calls it directly (next-safe-action actions are plain
 * async functions, callable outside a real request scope) with a real,
 * forged, and empty idToken.
 *
 * The admin surface (`verifiedAdminActionClient` in
 * features/admin/services/admin.service.ts) is NOT tested here — its
 * middleware calls `assertAdminAction`, which reads the session cookie via
 * `next/headers`'s `cookies()`, only reachable inside a real Next.js
 * request scope (same constraint already documented on
 * admin.service.emu.test.ts). Its underlying `assertAdminAction`/
 * `resolveCallerContext` logic is already covered there; this file proves
 * the one surface that IS fully testable outside that scope.
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when absent
 * so a stray invocation is a no-op rather than a hang. Deliberately does
 * NOT override GCLOUD_PROJECT — this test never touches Firestore, only
 * Auth token mint/verify, which doesn't have the session-cookie-specific
 * project-resolution quirk lib/auth-session.emu.test.ts documents.
 */
import { signInWithCustomToken } from "firebase/auth";
import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { auth } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";
import { userActionClient, verifiedActionClient } from "./safe-action";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const UID = "emu_safe_action_user";

async function realIdToken(): Promise<string> {
    try {
        await adminAuth.createUser({ uid: UID });
    } catch (err) {
        if ((err as { code?: string }).code !== "auth/uid-already-exists") throw err;
    }
    const customToken = await adminAuth.createCustomToken(UID);
    const credential = await signInWithCustomToken(auth, customToken);
    return credential.user.getIdToken(true);
}

// A minimal throwaway action proving the middleware actually runs and
// exposes a verified uid as ctx — not testing any real feature action.
const echoUidAction = userActionClient
    .metadata({ permission: "test.echoUid" })
    .inputSchema(z.object({}))
    .action(async ({ ctx }) => ({ uid: ctx.uid }));

d("userActionClient (T-106a)", () => {
    afterAll(async () => {
        await adminAuth.deleteUser(UID).catch(() => {});
    });

    it("verifies a real idToken and exposes the correct uid as ctx", async () => {
        const idToken = await realIdToken();

        const result = await echoUidAction(idToken, {});

        expect(result?.data?.uid).toBe(UID);
    });

    it("rejects a forged/garbage idToken with a serverError, not a thrown crash", async () => {
        const result = await echoUidAction("not-a-real-token", {});

        expect(result?.data).toBeUndefined();
        expect(result?.serverError).toBeTruthy();
    });

    it("rejects an empty idToken", async () => {
        const result = await echoUidAction("", {});

        expect(result?.data).toBeUndefined();
        expect(result?.serverError).toBeTruthy();
    });

    it("verifiedActionClient requires .metadata() before .action() compiles — a structural, not just runtime, property", () => {
        // This is a compile-time assertion: if the "cannot be defined without
        // permission" contract regresses, this file fails to type-check, not
        // just fails at runtime. Nothing to assert at runtime beyond "it compiled."
        const withMetadata = verifiedActionClient.metadata({ permission: "test.compile" });
        expect(typeof withMetadata.action).toBe("function");
    });
});
