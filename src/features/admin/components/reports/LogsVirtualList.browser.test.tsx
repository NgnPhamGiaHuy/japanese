import { NextIntlClientProvider } from "next-intl";

import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";

import messages from "@/messages/en.json";
import LogsVirtualList from "./LogsVirtualList";

import type { AdminLog } from "../../types";

function withIntl(children: React.ReactNode) {
    return (
        <NextIntlClientProvider locale="en" messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}

function makeLogs(count: number): AdminLog[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(2026, 0, 1, 0, i).toISOString(),
        level: "info" as const,
        type: "SYSTEM" as const,
        action: `test.action.${i}`,
        userId: `user-${i}`,
        userName: `User ${i}`,
        userEmail: `user${i}@example.com`,
        metadata: {},
    }));
}

describe("LogsVirtualList (real virtualization)", () => {
    test("renders far fewer DOM rows than the total dataset size on a large list", async () => {
        const logs = makeLogs(500);
        const screen = await render(withIntl(<LogsVirtualList logs={logs} />));

        // Let the virtualizer measure and settle after first paint.
        await new Promise((r) => setTimeout(r, 100));

        const renderedArticles = screen.container.querySelectorAll("article");
        expect(renderedArticles.length).toBeGreaterThan(0);
        // Bounded: nowhere near the full 500 rows — only the visible window + overscan.
        expect(renderedArticles.length).toBeLessThan(50);
    });

    test("renders all rows (no drops/duplicates) for a small list that fits without scrolling", async () => {
        const logs = makeLogs(3);
        const screen = await render(withIntl(<LogsVirtualList logs={logs} />));
        await new Promise((r) => setTimeout(r, 100));

        for (const log of logs) {
            await expect.element(screen.getByText(log.action)).toBeInTheDocument();
        }
        expect(screen.container.querySelectorAll("article")).toHaveLength(3);
    });

    test("the scroll container is height-bounded so windowing is meaningful", async () => {
        const logs = makeLogs(200);
        const screen = await render(withIntl(<LogsVirtualList logs={logs} />));

        const scrollContainer = screen.container.firstElementChild as HTMLElement;
        expect(scrollContainer.style.maxHeight).toBe("600px");
        expect(scrollContainer.style.overflowY).toBe("auto");
    });

    test("expanding a row to show its detail does not break virtualization (dynamic remeasure)", async () => {
        const logs = makeLogs(5).map((log, i) =>
            i === 0 ? { ...log, metadata: { key: "value", another: "field" } } : log,
        );
        const screen = await render(withIntl(<LogsVirtualList logs={logs} />));
        await new Promise((r) => setTimeout(r, 100));

        const firstRowButton = screen.container.querySelector('[role="button"]') as HTMLElement;
        expect(firstRowButton).toBeTruthy();
        firstRowButton.click();
        await new Promise((r) => setTimeout(r, 100));

        await expect.element(screen.getByText("Log ID")).toBeInTheDocument();
    });
});
