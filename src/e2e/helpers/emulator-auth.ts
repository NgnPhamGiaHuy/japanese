/**
 * @file e2e/helpers/emulator-auth.ts
 * Creates a test user directly against the Firebase Auth EMULATOR (via the
 * Admin SDK) and mints a custom token for it, bypassing the app's
 * Google-OAuth-only login UI, which E2E cannot drive reliably.
 *
 * SAFETY: this file must never run against real Firebase. `initE2EAdmin()`
 * refuses to initialize unless `FIREBASE_AUTH_EMULATOR_HOST` is set — no
 * service-account credentials are read or required.
 */
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function initE2EAdmin(): void {
    if (getApps().length) return;
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        throw new Error(
            "[e2e] FIREBASE_AUTH_EMULATOR_HOST is not set. Refusing to initialize the Admin SDK — " +
                "E2E auth helpers must never be able to reach real Firebase. Set it in playwright.config.ts.",
        );
    }
    initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID ?? "demo-e2e" });
}

export interface E2ETestUser {
    uid: string;
    email: string;
    displayName: string;
}

export const E2E_DEFAULT_USER: E2ETestUser = {
    uid: "e2e-test-user-1",
    email: "e2e-test-user-1@example.test",
    displayName: "E2E Test User",
};

/**
 * A fresh user per call, for tests whose assertions depend on a clean slate
 * (e.g. "zero notifications exist yet"). `reuseExistingServer` means the
 * local emulator's data can persist across consecutive `playwright test`
 * invocations — E2E_DEFAULT_USER accumulates state across runs, a unique
 * user never has any.
 */
export function createUniqueE2EUser(): E2ETestUser {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    return {
        uid: `e2e-test-user-${suffix}`,
        email: `e2e-test-user-${suffix}@example.test`,
        displayName: "E2E Test User",
    };
}

/**
 * Ensures the given test user exists in the Auth emulator (idempotent — safe
 * to call once per test or once per suite) and returns a fresh custom token
 * for it. The test signs in by calling `window.__e2eSignIn(token)` — see
 * `src/lib/firebase.ts`'s emulator-wiring block.
 */
export async function getEmulatorCustomToken(
    user: E2ETestUser = E2E_DEFAULT_USER,
): Promise<string> {
    initE2EAdmin();
    const auth = getAuth();

    try {
        await auth.createUser({
            uid: user.uid,
            email: user.email,
            emailVerified: true,
            displayName: user.displayName,
        });
    } catch (err) {
        const code = (err as { code?: string }).code;
        if (code !== "auth/uid-already-exists") throw err;
    }

    return auth.createCustomToken(user.uid);
}
