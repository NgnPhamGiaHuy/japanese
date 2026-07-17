import { NextIntlClientProvider } from "next-intl";

import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import messages from "@/messages/en.json";
import ConfirmModal from "./ConfirmModal";

function withIntl(children: React.ReactNode) {
    return (
        <NextIntlClientProvider locale="en" messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}

/**
 * Real-browser test — mirrors Modal.browser.test.tsx as the safety net for
 * E6's headless-primitive swap: ConfirmModal's internals will change, but
 * this contract must not.
 */
describe("ConfirmModal", () => {
    test("renders as an accessible dialog with the title as its accessible name", async () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        const screen = await render(
            withIntl(
                <ConfirmModal
                    isOpen
                    onClose={onClose}
                    onConfirm={onConfirm}
                    title="Delete Deck?"
                    message="This action is irreversible."
                />,
            ),
        );

        const dialog = screen.getByRole("dialog");
        await expect.element(dialog).toBeInTheDocument();
        await expect.element(dialog).toHaveAttribute("aria-modal", "true");

        const labelledBy = await dialog.element().getAttribute("aria-labelledby");
        expect(labelledBy).toBeTruthy();
        expect(document.getElementById(labelledBy!)?.textContent).toBe("Delete Deck?");

        const describedBy = await dialog.element().getAttribute("aria-describedby");
        expect(describedBy).toBeTruthy();
        expect(document.getElementById(describedBy!)?.textContent).toBe(
            "This action is irreversible.",
        );
    });

    test("moves focus into the dialog on open (not left on the trigger/body)", async () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        await render(
            withIntl(
                <ConfirmModal
                    isOpen
                    onClose={onClose}
                    onConfirm={onConfirm}
                    title="Delete Deck?"
                    message="This action is irreversible."
                />,
            ),
        );

        await expect.poll(() => document.activeElement?.tagName).not.toBe("BODY");
    });

    test("closes on Escape", async () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        await render(
            withIntl(
                <ConfirmModal
                    isOpen
                    onClose={onClose}
                    onConfirm={onConfirm}
                    title="Delete Deck?"
                    message="This action is irreversible."
                />,
            ),
        );

        await userEvent.keyboard("{Escape}");
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("does not close on Escape while loading", async () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        await render(
            withIntl(
                <ConfirmModal
                    isOpen
                    loading
                    onClose={onClose}
                    onConfirm={onConfirm}
                    title="Delete Deck?"
                    message="This action is irreversible."
                />,
            ),
        );

        await userEvent.keyboard("{Escape}");
        expect(onClose).not.toHaveBeenCalled();
    });

    test("traps Tab focus within the dialog (does not escape to elements outside)", async () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();
        const screen = await render(
            withIntl(
                <div>
                    <button type="button">Outside button (must never receive focus)</button>
                    <ConfirmModal
                        isOpen
                        onClose={onClose}
                        onConfirm={onConfirm}
                        title="Delete Deck?"
                        message="This action is irreversible."
                    />
                </div>,
            ),
        );

        const dialog = screen.getByRole("dialog").element();

        for (let i = 0; i < 5; i++) {
            await userEvent.keyboard("{Tab}");
            expect(dialog.contains(document.activeElement)).toBe(true);
        }
    });
});
