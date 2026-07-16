import { expect, test } from "@playwright/test";

import { signInAsEmulatorUser } from "./helpers/sign-in";

// Matches the app root with no further path segments, i.e. NOT redirected
// back to /login.
const HOME_URL_REGEX = /\/$/;

/**
 * Auth journey: unauthenticated visitor is redirected to /login, signs in
 * (via the emulator custom-token bridge, since the real UI is Google-OAuth
 * only), and lands on a protected route. Exercises the real app pipeline —
 * onIdTokenChanged → setAuthCookie → proxy.ts — not a test-only bypass of
 * route protection itself.
 */
test.describe("Auth journey", () => {
    test("unauthenticated visitor is redirected to /login", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByText("Continue with Google")).toBeVisible();
    });

    test("signs in and reaches a protected route", async ({ page }) => {
        await page.goto("/login");
        await expect(page.getByText("Continue with Google")).toBeVisible();

        await signInAsEmulatorUser(page);

        // Re-navigate so proxy.ts's server-side check sees the now-set cookie.
        await page.goto("/");
        await expect(page).toHaveURL(HOME_URL_REGEX);
        // The dashboard greeting only renders once authenticated — a
        // specific, positive assertion rather than "login text is gone".
        await expect(page.getByRole("heading", { name: "Konnichiwa!" })).toBeVisible();
    });
});
