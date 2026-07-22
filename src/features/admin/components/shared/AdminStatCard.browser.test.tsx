/**
 * @file AdminStatCard.browser.test.tsx
 * Proves the T-114b honest-UI invariant: a `null` value renders a distinct
 * "no data" state, never the number `0` or a blank cell (ADR-114).
 */
import { Activity } from "lucide-react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import AdminStatCard from "./AdminStatCard";

describe("AdminStatCard — honest absent-data (T-114b)", () => {
    it("renders a real value, including a genuine 0, as the bold numeric style", async () => {
        const screen = await render(
            <AdminStatCard label="Active Today" value={0} icon={Activity} />,
        );

        const value = screen.getByText("0");
        await expect.element(value).toBeInTheDocument();
        await expect.element(value).toHaveClass(/font-black/);
    });

    it("renders null as the noDataLabel, not as 0 or blank, with a visually distinct style", async () => {
        const screen = await render(
            <AdminStatCard
                label="Active Today"
                value={null}
                icon={Activity}
                noDataLabel="No data"
            />,
        );

        await expect.element(screen.getByText("No data")).toBeInTheDocument();
        expect(screen.container.textContent).not.toContain("0");

        const value = screen.getByText("No data");
        await expect.element(value).toHaveClass(/text-muted/);
        await expect.element(value).not.toHaveClass(/font-black/);
    });

    it("suppresses the trend indicator when the value is absent", async () => {
        const screen = await render(
            <AdminStatCard
                label="Active Today"
                value={null}
                icon={Activity}
                noDataLabel="No data"
                trend={{ value: 12, isPositive: true }}
            />,
        );

        expect(screen.container.textContent).not.toContain("12%");
    });
});
