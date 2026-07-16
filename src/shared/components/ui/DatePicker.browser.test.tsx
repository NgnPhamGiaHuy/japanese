import { useState } from "react";

import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";

import DatePicker from "./DatePicker";

function ControlledDatePicker({ onChange }: { onChange: (value?: string) => void }) {
    const [value, setValue] = useState<string | undefined>("2026-07-05");
    return (
        <DatePicker
            label="Start date"
            value={value}
            onChange={(v) => {
                setValue(v);
                onChange(v);
            }}
        />
    );
}

/**
 * Real-browser test — the safety net for the react-day-picker swap: the
 * value/onChange ISO-date-string contract must not change, only the
 * calendar-grid internals do.
 */
describe("DatePicker", () => {
    test("displays the initial value and opens the calendar on trigger click", async () => {
        const screen = await render(<ControlledDatePicker onChange={vi.fn()} />);

        await expect.element(screen.getByText("07/05/2026")).toBeInTheDocument();

        await screen.getByText("07/05/2026").click();

        await expect.element(screen.getByRole("grid")).toBeInTheDocument();
    });

    test("selecting a day calls onChange with the correct ISO date and closes the calendar", async () => {
        const onChange = vi.fn();
        const screen = await render(<ControlledDatePicker onChange={onChange} />);

        await screen.getByText("07/05/2026").click();
        await screen.getByText("10", { exact: true }).click();

        expect(onChange).toHaveBeenCalledWith("2026-07-10");
        await expect.element(screen.getByRole("grid")).not.toBeInTheDocument();
    });

    test("the clear button calls onChange with undefined", async () => {
        const onChange = vi.fn();
        const screen = await render(<ControlledDatePicker onChange={onChange} />);

        await screen.getByRole("button", { name: "Clear date" }).click();

        expect(onChange).toHaveBeenCalledWith(undefined);
        await expect.element(screen.getByText("Start date")).toBeInTheDocument();
    });
});
