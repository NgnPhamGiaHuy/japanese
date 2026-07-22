/**
 * @file admin.service.emu.test.ts
 * Emulator-backed tests for admin.service.ts's token-verified role resolution
 * (T-107a) — `getCallerContext`/`assertPermissionFromToken`, the explicit-
 * ID-token path shared with the now-session-cookie-based `assertAdminAction`
 * via the extracted `resolveCallerContext` helper.
 *
 * `assertAdminAction` itself calls `next/headers`'s `cookies()`, which only
 * works inside a real Next.js request scope — not reachable from a plain
 * vitest test, so its cookie-reading half is covered at the E2E tier
 * (T-107d). This file proves the shared role-resolution logic underneath
 * both paths is correct.
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 */
import { signInWithCustomToken } from "firebase/auth";
import { afterAll, describe, expect, it } from "vitest";

import { auth } from "@/lib/firebase";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { assertPermissionFromToken, getCallerContext } from "./admin.service";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const FIRESTORE_ADMIN_UID = "emu_admin_svc_firestore_admin";
const CLAIM_SUPERADMIN_UID = "emu_admin_svc_claim_superadmin";
const REGULAR_USER_UID = "emu_admin_svc_regular_user";

async function idTokenFor(uid: string, customClaims?: Record<string, unknown>): Promise<string> {
    try {
        await adminAuth.createUser({ uid });
    } catch (err) {
        if ((err as { code?: string }).code !== "auth/uid-already-exists") throw err;
    }
    if (customClaims) await adminAuth.setCustomUserClaims(uid, customClaims);
    const customToken = await adminAuth.createCustomToken(uid);
    const credential = await signInWithCustomToken(auth, customToken);
    return credential.user.getIdToken(true); // force-refresh to pick up custom claims
}

d("admin.service — token-verified role resolution", () => {
    afterAll(async () => {
        await Promise.all(
            [FIRESTORE_ADMIN_UID, CLAIM_SUPERADMIN_UID, REGULAR_USER_UID].map((uid) =>
                adminAuth.deleteUser(uid).catch(() => {}),
            ),
        );
        await adminDb
            .collection("admins")
            .doc(FIRESTORE_ADMIN_UID)
            .delete()
            .catch(() => {});
    });

    it("resolves 'admin' from a Firestore admins/{uid} document", async () => {
        await adminDb.collection("admins").doc(FIRESTORE_ADMIN_UID).set({ role: "admin" });
        const idToken = await idTokenFor(FIRESTORE_ADMIN_UID);

        const caller = await getCallerContext(idToken);

        expect(caller).toEqual({ uid: FIRESTORE_ADMIN_UID, role: "admin" });
    });

    it("resolves 'superadmin' from a custom claim, taking priority over any Firestore role", async () => {
        await adminDb.collection("admins").doc(CLAIM_SUPERADMIN_UID).set({ role: "admin" });
        const idToken = await idTokenFor(CLAIM_SUPERADMIN_UID, { superadmin: true });

        const caller = await getCallerContext(idToken);

        expect(caller.role).toBe("superadmin");
    });

    it("rejects a user with no claim and no Firestore admins document", async () => {
        const idToken = await idTokenFor(REGULAR_USER_UID);

        await expect(getCallerContext(idToken)).rejects.toThrow(/FORBIDDEN/);
    });

    it("rejects a forged/garbage token", async () => {
        await expect(getCallerContext("not-a-real-token")).rejects.toThrow();
    });

    it("assertPermissionFromToken denies an action outside the caller's granted permission set", async () => {
        // A plain "admin" (not superadmin) lacks canDeleteUsers per the
        // permission matrix — asserts hasPermission is actually consulted,
        // not merely that some role was resolved.
        const idToken = await idTokenFor(FIRESTORE_ADMIN_UID);

        await expect(assertPermissionFromToken(idToken, "canDeleteUsers")).rejects.toThrow(
            /FORBIDDEN/,
        );
    });

    it("assertPermissionFromToken allows an action within the caller's granted permission set", async () => {
        const idToken = await idTokenFor(FIRESTORE_ADMIN_UID);

        const caller = await assertPermissionFromToken(idToken, "canViewDashboard");

        expect(caller.role).toBe("admin");
    });
});
