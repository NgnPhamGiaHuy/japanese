import { E2E_DEFAULT_USER, getEmulatorCustomToken } from "./emulator-auth";

import type { Page } from "@playwright/test";
import type { E2ETestUser } from "./emulator-auth";

const COOKIE_NAME = "auth-token";

/**
 * Signs in via the emulator custom-token bridge (see src/lib/firebase.ts) and
 * waits for the real onIdTokenChanged -> createSessionAction pipeline to
 * actually set the session cookie proxy.ts checks — not a fixed sleep. Call
 * this from `/login` (the page must have already loaded there).
 *
 * @remarks
 * Polls via `page.context().cookies()` (Playwright's browser-automation API,
 * outside page JS), not `document.cookie` — the cookie is httpOnly since
 * ADR-107, so page-context JS can no longer see it at all, even just its
 * presence.
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

    await waitForSessionCookie(page);

    return user;
}

async function waitForSessionCookie(page: Page, timeoutMs = 10_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const cookies = await page.context().cookies();
        if (cookies.some((c) => c.name === COOKIE_NAME)) return;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Timed out waiting for the "${COOKIE_NAME}" session cookie to be set`);
}
