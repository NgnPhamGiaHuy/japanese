import { expect, test } from "@playwright/test";

import { createUniqueE2EUser } from "./helpers/emulator-auth";
import { seedNotification } from "./helpers/emulator-firestore";
import { signInAsEmulatorUser } from "./helpers/sign-in";

/**
 * Realtime journey: proves the app's onSnapshot live-update path end-to-end.
 * A notification document is written directly to the Firestore emulator
 * (server-side change, mirroring what emitNotificationAction would produce)
 * WHILE the notifications page is already open — the UI must pick it up via
 * subscribeNotifications' listener, with no reload and no fixed sleep.
 */
test.describe("Realtime journey", () => {
    test("a server-side notification write appears live, with no reload", async ({ page }) => {
        // A unique user (not the shared default) guarantees zero pre-existing
        // notifications, regardless of how many times this suite has already
        // run against a persistent local emulator.
        const user = createUniqueE2EUser();

        await page.goto("/login");
        await signInAsEmulatorUser(page, user);

        await page.goto("/notifications");
        // Confirm the empty state has actually rendered (skeleton resolved,
        // zero existing notifications for this fresh test user) before
        // seeding — makes the later assertion an unambiguous "it arrived via
        // the listener", not a race with the initial snapshot.
        await expect(page.getByText("No notifications yet")).toBeVisible();

        const title = `E2E Realtime Notification ${Date.now()}`;
        await seedNotification(user.uid, {
            title,
            message: "Seeded directly in the Firestore emulator by the realtime E2E test.",
        });

        // No page.reload() anywhere in this test — if this text appears, it
        // arrived via the onSnapshot listener, not a fresh server render.
        await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
    });
});
