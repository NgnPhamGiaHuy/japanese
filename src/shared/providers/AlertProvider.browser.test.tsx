import { NextIntlClientProvider } from "next-intl";

import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";

import messages from "@/messages/en.json";
import { AlertProvider, useAlert } from "./AlertProvider";

/** AlertProvider translates its toast-region aria-label, so it needs locale context. */
function withIntl(children: React.ReactNode) {
    return (
        <NextIntlClientProvider locale="en" messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}

function Trigger() {
    const { showAlert } = useAlert();
    return (
        <button type="button" onClick={() => showAlert("success", "Deck saved!")}>
            Trigger
        </button>
    );
}

function TriggerWithAction({ onAction }: { onAction: () => void }) {
    const { showAlert } = useAlert();
    return (
        <button
            type="button"
            onClick={() =>
                showAlert("error", "Failed to save", {
                    action: { label: "Retry", onClick: onAction },
                })
            }
        >
            Trigger
        </button>
    );
}

/**
 * Real-browser test — the safety net for the sonner migration: the
 * useAlert()/showAlert() facade must stay unchanged for every caller, only
 * the rendering engine underneath (custom FIFO stack -> sonner) changes.
 */
describe("AlertProvider (sonner)", () => {
    test("showAlert renders the message via sonner's toast container", async () => {
        const screen = await render(
            withIntl(
                <AlertProvider>
                    <Trigger />
                </AlertProvider>,
            ),
        );

        await screen.getByRole("button", { name: "Trigger" }).click();

        await expect.element(screen.getByText("Deck saved!")).toBeInTheDocument();
    });

    test("the inline action fires its callback and dismisses the toast", async () => {
        const onAction = vi.fn();
        const screen = await render(
            withIntl(
                <AlertProvider>
                    <TriggerWithAction onAction={onAction} />
                </AlertProvider>,
            ),
        );

        await screen.getByRole("button", { name: "Trigger" }).click();
        await expect.element(screen.getByText("Failed to save")).toBeInTheDocument();

        await screen.getByText("Retry").click();

        expect(onAction).toHaveBeenCalledTimes(1);
        await expect.element(screen.getByText("Failed to save")).not.toBeInTheDocument();
    });

    test("the close button dismisses the toast", async () => {
        const screen = await render(
            withIntl(
                <AlertProvider>
                    <Trigger />
                </AlertProvider>,
            ),
        );

        await screen.getByRole("button", { name: "Trigger" }).click();
        await expect.element(screen.getByText("Deck saved!")).toBeInTheDocument();

        await screen.getByRole("button", { name: "Dismiss" }).click();

        await expect.element(screen.getByText("Deck saved!")).not.toBeInTheDocument();
    });

    test("throws outside the provider", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        // React logs render errors even when caught by an error boundary — the
        // assertion below is what matters; this just keeps the test output clean.
        try {
            await expect(async () => {
                await render(<Trigger />);
            }).rejects.toThrow("useAlert must be used within an AlertProvider");
        } finally {
            consoleError.mockRestore();
        }
    });
});
