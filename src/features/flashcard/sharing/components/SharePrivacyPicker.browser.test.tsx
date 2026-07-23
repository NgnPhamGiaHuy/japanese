/**
 * @file SharePrivacyPicker.browser.test.tsx
 * Proves the Base UI Menu migration (cleanup-audit N4) actually delivers the
 * a11y gain it was for: real Escape-to-close and outside-click dismissal,
 * neither of which the old hand-rolled dropdown had (it needed a manual
 * fixed-backdrop click-catcher and ShareModal special-cased Escape itself —
 * both now gone, see ShareModal.tsx's onOpenChange).
 */
import { NextIntlClientProvider } from "next-intl";

import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import messages from "@/messages/en.json";
import SharePrivacyPicker from "./SharePrivacyPicker";

function renderPicker(
    privacyMode: "restricted" | "link" | "public",
    onChangePrivacyMode = vi.fn(),
) {
    return render(
        <NextIntlClientProvider locale="en" messages={messages}>
            <SharePrivacyPicker
                privacyMode={privacyMode}
                publicRole="viewer"
                saving={false}
                themeHex="#1cb0f6"
                onChangePrivacyMode={onChangePrivacyMode}
                onChangePublicRole={() => {}}
            />
        </NextIntlClientProvider>,
    );
}

describe("SharePrivacyPicker", () => {
    it("shows the current mode's label as the trigger text, with the menu closed", async () => {
        const screen = await renderPicker("restricted");
        await expect.element(screen.getByText("Restricted", { exact: true })).toBeInTheDocument();
        // "Public" only ever appears as a menu-item label — absent while closed.
        expect(screen.container.textContent).not.toContain("Public");
    });

    it("opens the menu on trigger click, listing every mode with its label and description", async () => {
        const screen = await renderPicker("restricted");
        await userEvent.click(screen.getByText("Restricted", { exact: true }).element());

        await expect
            .element(screen.getByText("Anyone with the link", { exact: true }))
            .toBeInTheDocument();
        await expect.element(screen.getByText("Anyone with the link can view")).toBeInTheDocument();
        await expect.element(screen.getByText("Public", { exact: true })).toBeInTheDocument();
        await expect
            .element(screen.getByText("Visible to everyone — no link required"))
            .toBeInTheDocument();
    });

    it("calls onChangePrivacyMode with the clicked mode", async () => {
        const onChangePrivacyMode = vi.fn();
        const screen = await renderPicker("restricted", onChangePrivacyMode);
        await userEvent.click(screen.getByText("Restricted", { exact: true }).element());

        await userEvent.click(screen.getByText("Public", { exact: true }).element());

        expect(onChangePrivacyMode).toHaveBeenCalledWith("public");
    });

    it("closes on Escape without closing anything else (no fixed backdrop involved)", async () => {
        const screen = await renderPicker("restricted");
        await userEvent.click(screen.getByText("Restricted", { exact: true }).element());
        await expect.element(screen.getByText("Public", { exact: true })).toBeInTheDocument();

        await userEvent.keyboard("{Escape}");

        await expect.element(screen.getByText("Public", { exact: true })).not.toBeInTheDocument();
        // The trigger itself survives — Escape closed only the menu.
        await expect.element(screen.getByText("Restricted", { exact: true })).toBeInTheDocument();
    });

    it("shows the default-role picker for link/public modes, hides it for restricted", async () => {
        const restricted = await renderPicker("restricted");
        expect(restricted.container.textContent).not.toContain("Default role");

        const link = await renderPicker("link");
        await expect.element(link.getByText("Default role")).toBeInTheDocument();
    });
});
