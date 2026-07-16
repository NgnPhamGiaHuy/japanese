import { E2E_DEFAULT_USER, getEmulatorCustomToken } from "./emulator-auth";

import type { Page } from "@playwright/test";
import type { E2ETestUser } from "./emulator-auth";

/**
 * Signs in via the emulator custom-token bridge (see src/lib/firebase.ts) and
 * waits for the real onIdTokenChanged -> setAuthCookie pipeline to actually
 * set the cookie proxy.ts checks — not a fixed sleep. Call this from
 * `/login` (the page must have already loaded there).
 */
export async function signInAsEmulatorUser(
    page: Page,
    user: E2ETestUser = E2E_DEFAULT_USER,
): Promise<E2ETestUser> {
    await page.waitForFunction(() => "__e2eSignIn" in window);

    const token = await getEmulatorCustomToken(user);
    await page.evaluate((customToken) => {
        const bridge = (window as typeof window & { __e2eSignIn?: (t: string) => Promise<void> })
            .__e2eSignIn;
        if (!bridge) throw new Error("__e2eSignIn bridge missing");
        return bridge(customToken);
    }, token);

    await page.waitForFunction(() => document.cookie.includes("auth-token="));

    return user;
}
