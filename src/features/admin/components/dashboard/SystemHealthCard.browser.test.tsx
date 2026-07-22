/**
 * @file SystemHealthCard.browser.test.tsx
 * Proves the T-114b honest-UI invariant: a `null` errorRate renders a
 * distinct "no data" state — never "0%" and never a filled progress bar
 * (ADR-114's own named example: "Error rate: 0").
 */
import { NextIntlClientProvider } from "next-intl";

import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import messages from "@/messages/en.json";
import SystemHealthCard from "./SystemHealthCard";

function renderWithIntl(ui: React.ReactElement) {
    return render(
        <NextIntlClientProvider locale="en" messages={messages}>
            {ui}
        </NextIntlClientProvider>,
    );
}

describe("SystemHealthCard — honest absent-data (T-114b)", () => {
    it("renders a genuine 0% error rate as a real measured value", async () => {
        const screen = await renderWithIntl(
            <SystemHealthCard errorRate={0} activeAdmins={1} activeSuperAdmins={1} />,
        );

        await expect.element(screen.getByText("0%")).toBeInTheDocument();
    });

    it("renders null as 'No data', not '0%', and shows no progress-bar fill", async () => {
        const screen = await renderWithIntl(
            <SystemHealthCard errorRate={null} activeAdmins={1} activeSuperAdmins={1} />,
        );

        await expect.element(screen.getByText("No data")).toBeInTheDocument();
        expect(screen.container.textContent).not.toContain("0%");
        expect(screen.container.querySelector(".bg-danger")).toBeNull();
    });

    it("still renders a high genuine error rate with the danger treatment", async () => {
        const screen = await renderWithIntl(
            <SystemHealthCard errorRate={5} activeAdmins={1} activeSuperAdmins={1} />,
        );

        const value = screen.getByText("5%");
        await expect.element(value).toHaveClass(/text-danger/);
    });
});
