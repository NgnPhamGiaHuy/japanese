import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import DeckDetailsPanel from "./DeckDetailsPanel";

/**
 * Real-browser test — the safety net for the useDialogA11y retirement:
 * this was one of the 5 hand-set aria-modal surfaces; its internals now run
 * on the same Base UI Dialog as Modal/ConfirmModal, but this contract must
 * still hold.
 */
describe("DeckDetailsPanel", () => {
    test("renders as an accessible dialog labelled by the deck title", async () => {
        const onClose = vi.fn();
        const screen = await render(
            <DeckDetailsPanel
                isOpen
                onClose={onClose}
                deckTitle="JLPT N5 Verbs"
                cards={[]}
                isLoading={false}
            />,
        );

        const dialog = screen.getByRole("dialog");
        await expect.element(dialog).toBeInTheDocument();
        await expect.element(dialog).toHaveAttribute("aria-modal", "true");

        const labelledBy = await dialog.element().getAttribute("aria-labelledby");
        expect(labelledBy).toBeTruthy();
        expect(document.getElementById(labelledBy!)?.textContent).toBe("JLPT N5 Verbs");
    });

    test("closes on Escape", async () => {
        const onClose = vi.fn();
        await render(
            <DeckDetailsPanel
                isOpen
                onClose={onClose}
                deckTitle="JLPT N5 Verbs"
                cards={[]}
                isLoading={false}
            />,
        );

        await userEvent.keyboard("{Escape}");
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("traps Tab focus within the panel", async () => {
        const onClose = vi.fn();
        const screen = await render(
            <div>
                <button type="button">Outside button (must never receive focus)</button>
                <DeckDetailsPanel
                    isOpen
                    onClose={onClose}
                    deckTitle="JLPT N5 Verbs"
                    cards={[]}
                    isLoading={false}
                />
            </div>,
        );

        const dialog = screen.getByRole("dialog").element();
        for (let i = 0; i < 5; i++) {
            await userEvent.keyboard("{Tab}");
            expect(dialog.contains(document.activeElement)).toBe(true);
        }
    });
});
