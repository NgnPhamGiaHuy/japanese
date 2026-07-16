import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import Modal from "./Modal";

/**
 * Real-browser test — this is exactly the a11y contract (focus management,
 * Tab trap, Escape) that jsdom can't reliably prove, and the safety net for
 * E6's headless-primitive swap: Modal's internals will change, but this
 * contract must not.
 */
describe("Modal", () => {
    test("renders as an accessible dialog with the title as its accessible name", async () => {
        const onClose = vi.fn();
        const screen = await render(
            <Modal isOpen title="Test Modal" onClose={onClose}>
                <button type="button">Inner action</button>
            </Modal>,
        );

        const dialog = screen.getByRole("dialog");
        await expect.element(dialog).toBeInTheDocument();
        await expect.element(dialog).toHaveAttribute("aria-modal", "true");

        // aria-labelledby must resolve to the visible title text, not just be present.
        const labelledBy = await dialog.element().getAttribute("aria-labelledby");
        expect(labelledBy).toBeTruthy();
        expect(document.getElementById(labelledBy!)?.textContent).toBe("Test Modal");
    });

    test("moves focus into the dialog on open (not left on the trigger/body)", async () => {
        const onClose = vi.fn();
        await render(
            <Modal isOpen title="Test Modal" onClose={onClose}>
                <button type="button">Inner action</button>
            </Modal>,
        );

        await expect.poll(() => document.activeElement?.tagName).not.toBe("BODY");
    });

    test("closes on Escape", async () => {
        const onClose = vi.fn();
        await render(
            <Modal isOpen title="Test Modal" onClose={onClose}>
                <button type="button">Inner action</button>
            </Modal>,
        );

        await userEvent.keyboard("{Escape}");
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("traps Tab focus within the dialog (does not escape to elements outside)", async () => {
        const onClose = vi.fn();
        const screen = await render(
            <div>
                <button type="button">Outside button (must never receive focus)</button>
                <Modal isOpen title="Test Modal" onClose={onClose}>
                    <button type="button">Inner action</button>
                </Modal>
            </div>,
        );

        const dialog = screen.getByRole("dialog").element();

        // Tab repeatedly — with the trap working, focus must always stay
        // inside the dialog, however many times we cycle through it.
        for (let i = 0; i < 5; i++) {
            await userEvent.keyboard("{Tab}");
            expect(dialog.contains(document.activeElement)).toBe(true);
        }
    });
});
