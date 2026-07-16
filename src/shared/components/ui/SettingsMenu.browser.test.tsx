import { useState } from "react";

import { Volume2 } from "lucide-react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import SettingsMenu from "./SettingsMenu";

function ControlledSettingsMenu({ onResetConfirm }: { onResetConfirm: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [audioOn, setAudioOn] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <SettingsMenu
            isOpen={isOpen}
            onToggle={() => setIsOpen((v) => !v)}
            primaryBg="bg-blue-500"
            audioToggle={{
                label: "Autoplay Audio",
                icon: Volume2,
                value: audioOn,
                onChange: () => setAudioOn((v) => !v),
            }}
            dangerAction={{
                label: "Reset Progress",
                confirmText: "Reset",
                onConfirm: onResetConfirm,
                showConfirm,
                onRequestConfirm: () => setShowConfirm(true),
                onCancelConfirm: () => setShowConfirm(false),
            }}
        />
    );
}

/**
 * Real-browser test — the safety net for E6's headless-primitive swap:
 * SettingsMenu's internals will change, but this contract must not. Also the
 * regression net for its parent-controlled open state (isOpen/onToggle, not
 * Menu-internal state) and its two non-standard menu behaviors: toggles that
 * must NOT close the menu, and an inline danger-zone confirm step that also
 * must NOT close the menu until acted on from outside.
 */
describe("SettingsMenu", () => {
    test("opens via the trigger and lists the audio toggle + danger action", async () => {
        const screen = await render(<ControlledSettingsMenu onResetConfirm={vi.fn()} />);

        await screen.getByRole("button", { name: "Settings" }).click();

        await expect.element(screen.getByText("Autoplay Audio")).toBeInTheDocument();
        await expect.element(screen.getByText("Reset Progress")).toBeInTheDocument();
    });

    test("toggling a checkbox item flips it and does not force-close the menu (Menu.CheckboxItem closeOnClick=false)", async () => {
        const screen = await render(<ControlledSettingsMenu onResetConfirm={vi.fn()} />);

        await screen.getByRole("button", { name: "Settings" }).click();
        const toggle = screen.getByRole("menuitemcheckbox", { name: /Autoplay Audio/ });
        await expect.element(toggle).toHaveAttribute("aria-checked", "true");

        await toggle.click();

        await expect.element(toggle).toHaveAttribute("aria-checked", "false");
        // Proves the primitive itself doesn't force a close on Item click —
        // NOT a claim that the real app keeps the menu open after toggling.
        // KanaHub.tsx's own onChange calls setShowSettings(false) after
        // toggling (pre-existing, unrelated to this migration), so in the
        // live app the menu *does* close — driven by the controlled `open`
        // prop the caller owns, exactly like the original hand-rolled
        // version, which also had no internal auto-close.
        await expect.element(screen.getByText("Reset Progress")).toBeInTheDocument();
    });

    test("danger action reveals an inline confirm without closing the menu", async () => {
        const onResetConfirm = vi.fn();
        const screen = await render(<ControlledSettingsMenu onResetConfirm={onResetConfirm} />);

        await screen.getByRole("button", { name: "Settings" }).click();
        await screen.getByText("Reset Progress").click();

        await expect
            .element(screen.getByText("Are you sure? This cannot be undone."))
            .toBeInTheDocument();
        expect(onResetConfirm).not.toHaveBeenCalled();

        // still open — the toggle is still present
        await expect.element(screen.getByText("Autoplay Audio")).toBeInTheDocument();
    });

    test("confirming the danger action calls onConfirm", async () => {
        const onResetConfirm = vi.fn();
        const screen = await render(<ControlledSettingsMenu onResetConfirm={onResetConfirm} />);

        await screen.getByRole("button", { name: "Settings" }).click();
        await screen.getByText("Reset Progress").click();
        await screen.getByText("Reset").click();

        expect(onResetConfirm).toHaveBeenCalledTimes(1);
    });

    test("closes on Escape", async () => {
        const screen = await render(<ControlledSettingsMenu onResetConfirm={vi.fn()} />);

        await screen.getByRole("button", { name: "Settings" }).click();
        await expect.element(screen.getByText("Autoplay Audio")).toBeInTheDocument();

        await userEvent.keyboard("{Escape}");

        await expect.element(screen.getByText("Autoplay Audio")).not.toBeInTheDocument();
    });
});
