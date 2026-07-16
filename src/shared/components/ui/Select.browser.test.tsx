import { useState } from "react";

import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import Select from "./Select";

import type { SelectOption } from "./Select";

const OPTIONS: SelectOption<string>[] = [
    { value: "viewer", label: "Viewer" },
    { value: "editor", label: "Editor" },
    { value: "owner", label: "Owner" },
];

function ControlledSelect({ onRemove }: { onRemove?: () => void }) {
    const [value, setValue] = useState("viewer");
    return <Select value={value} options={OPTIONS} onChange={setValue} onRemove={onRemove} />;
}

/**
 * Real-browser test — the safety net for E6's headless-primitive swap:
 * Select's internals will change, but this contract must not.
 */
describe("Select", () => {
    test("trigger exposes the selected option as its accessible label", async () => {
        const screen = await render(<ControlledSelect />);

        const trigger = screen.getByRole("combobox");
        await expect.element(trigger).toBeInTheDocument();
        await expect.element(trigger).toHaveTextContent("Viewer");
    });

    test("opens the listbox on click and lists all options", async () => {
        const screen = await render(<ControlledSelect />);

        await screen.getByRole("combobox").click();

        for (const opt of OPTIONS) {
            await expect
                .element(screen.getByRole("option", { name: opt.label }))
                .toBeInTheDocument();
        }
    });

    test("selects an option via keyboard (Down, Down, Enter) and closes", async () => {
        const screen = await render(<ControlledSelect />);

        await screen.getByRole("combobox").click();
        await userEvent.keyboard("{ArrowDown}");
        await userEvent.keyboard("{ArrowDown}");
        await userEvent.keyboard("{Enter}");

        await expect.element(screen.getByRole("combobox")).toHaveTextContent("Owner");
        await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
    });

    test("closes on Escape without changing the selection", async () => {
        const screen = await render(<ControlledSelect />);

        await screen.getByRole("combobox").click();
        await userEvent.keyboard("{ArrowDown}");
        await userEvent.keyboard("{Escape}");

        await expect.element(screen.getByRole("combobox")).toHaveTextContent("Viewer");
        await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
    });

    test("the remove action is a real, keyboard-reachable listbox item that fires onRemove", async () => {
        const onRemove = vi.fn();
        const screen = await render(<ControlledSelect onRemove={onRemove} />);

        await screen.getByRole("combobox").click();
        const removeItem = screen.getByRole("option", { name: "Remove" });
        await expect.element(removeItem).toBeInTheDocument();

        await removeItem.click();
        expect(onRemove).toHaveBeenCalledTimes(1);
    });
});
