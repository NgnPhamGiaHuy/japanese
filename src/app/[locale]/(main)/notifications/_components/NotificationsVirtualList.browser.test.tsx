import { NextIntlClientProvider } from "next-intl";

import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";

import messages from "@/messages/en.json";
import { AlertProvider } from "@/shared/providers";
import NotificationsVirtualList from "./NotificationsVirtualList";

import type { AppNotification, NotificationGroup } from "@/features/notifications/types";

// NotificationRow calls next/navigation's useRouter() unconditionally — there's
// no Next.js App Router tree in Vitest Browser Mode, so the real hook throws
// ("invariant expected app router to be mounted") without this.
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    }),
}));

// NotificationRow statically imports these server actions (only invoked from
// click handlers this test never triggers). Under Next's own build pipeline a
// "use server" import is rewritten to a thin client RPC stub — bare Vite has
// no such transform, so it bundles the real implementation for the browser,
// which transitively pulls in the Admin SDK's Google Auth JWT signing chain
// (google-auth-library → jws → Node's `util.inherits`, unpolyfilled in
// Vitest Browser Mode). Mocking the action modules avoids ever needing that
// chain to resolve in a browser context.
vi.mock("@/features/notifications/actions/activity-log.actions", () => ({
    logNotificationRead: vi.fn(),
    logNotificationDeleted: vi.fn(),
    logNotificationsReadAll: vi.fn(),
    logNotificationsCleared: vi.fn(),
    logNotificationsDelivered: vi.fn(),
}));
vi.mock("@/features/flashcard/actions/access.actions", () => ({
    declineInviteAction: vi.fn(),
}));

// lib/firebase.ts eagerly calls getAuth()/getFirestore() at module-evaluation
// time using real env vars that aren't set in Vitest Browser Mode (no .env
// loading here — see vitest.emu.config.ts's own docs for the same gap). None
// of these are actually called by a pure-render test (only from click
// handlers this test never triggers), so stand-ins are enough to let the
// module graph resolve.
vi.mock("@/lib/firebase", () => ({
    auth: {},
    db: {},
    storage: {},
    googleProvider: {},
    firebaseAI: {},
    APP_ID: "test-app",
}));

// The barrel also re-exports notify.ts (ES `export *`, evaluated regardless
// of which named exports a consumer actually uses), which imports
// emitNotificationAction — a next-safe-action-wrapped action that calls
// verifyIdToken (Admin SDK), the same google-auth-library/jws/util.inherits
// chain worked around above for the other action imports. Mocking the barrel
// directly with just what NotificationRow calls sidesteps notify.ts entirely.
vi.mock("@/features/notifications/services", () => ({
    deleteNotification: vi.fn(),
    markNotificationRead: vi.fn(),
    restoreNotifications: vi.fn(),
}));

let seq = 0;
function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
    seq += 1;
    return {
        id: `n-${seq}`,
        userId: "user_recipient",
        type: "comment",
        title: `Notification ${seq}`,
        message: "Someone did a thing.",
        senderId: "user_sender",
        senderName: "Sender",
        status: "read",
        isDeleted: false,
        createdAt: 1_700_000_000_000 + seq,
        ...overrides,
    };
}

function makeGroup(label: NotificationGroup["label"], count: number): NotificationGroup {
    return { label, items: Array.from({ length: count }, () => makeNotification()) };
}

const settle = () => new Promise((r) => setTimeout(r, 100));

// NotificationRow calls useAlert() (for the delete/undo toast) — needs a real
// AlertProvider ancestor, even though this test never triggers that toast.
async function renderList(groups: NotificationGroup[]) {
    const screen = await render(
        <NextIntlClientProvider locale="en" messages={messages}>
            <AlertProvider>
                <NotificationsVirtualList groups={groups} userId="u1" />
            </AlertProvider>
        </NextIntlClientProvider>,
    );
    await settle();
    return screen;
}

describe("NotificationsVirtualList (real virtualization)", () => {
    test("renders far fewer DOM rows than the total dataset size on a large single group", async () => {
        const groups = [makeGroup("Today", 300)];
        const screen = await renderList(groups);

        const rendered = screen.container.querySelectorAll("[data-index]");
        expect(rendered.length).toBeGreaterThan(0);
        // Bounded: nowhere near 300 rows + 1 header — only the visible window + overscan.
        expect(rendered.length).toBeLessThan(60);
    });

    test("renders all rows (no drops/duplicates) for a small list that fits without scrolling", async () => {
        const groups = [makeGroup("Today", 3)];
        const screen = await renderList(groups);

        for (const n of groups[0].items) {
            await expect.element(screen.getByText(n.title)).toBeInTheDocument();
        }
        // 1 header + 3 rows.
        expect(screen.container.querySelectorAll("[data-index]")).toHaveLength(4);
    });

    test("renders each group's header label", async () => {
        const groups = [makeGroup("Today", 1), makeGroup("Earlier", 1)];
        const screen = await renderList(groups);

        await expect.element(screen.getByText("Today")).toBeInTheDocument();
        await expect.element(screen.getByText("Earlier")).toBeInTheDocument();
    });

    test("first/last rows in a group get card-edge styling; only non-last rows get a divider", async () => {
        const groups = [makeGroup("Today", 3)];
        const screen = await renderList(groups);

        const rowWrappers = Array.from(screen.container.querySelectorAll("[data-index]")).filter(
            (el) => el.textContent?.includes("Notification"),
        );
        expect(rowWrappers).toHaveLength(3);

        const [first, middle, last] = rowWrappers.map((el) => el.firstElementChild as HTMLElement);
        expect(first.className).toContain("rounded-t-2xl");
        expect(first.className).not.toContain("rounded-b-2xl");
        expect(middle.className).not.toContain("rounded-t-2xl");
        expect(middle.className).not.toContain("rounded-b-2xl");
        expect(last.className).toContain("rounded-b-2xl");
        expect(last.className).not.toContain("rounded-t-2xl");

        // Divider between rows, none trailing the group's last row.
        expect(first.querySelector(".bg-gray-100")).toBeTruthy();
        expect(middle.querySelector(".bg-gray-100")).toBeTruthy();
        expect(last.querySelector(".bg-gray-100")).toBeFalsy();
    });

    test("a taller row (invite actions) doesn't overlap the row after it (dynamic remeasure)", async () => {
        const tall = makeNotification({
            id: "tall",
            type: "invite",
            status: "unread",
            title: "Tall invite row",
            data: { shareLink: "/flashcard/shared/abc" },
        });
        const groups: NotificationGroup[] = [
            {
                label: "Today",
                items: [tall, makeNotification({ id: "after", title: "Row after" })],
            },
        ];
        const screen = await renderList(groups);

        // The invite row's own Accept/Decline actions confirm the taller
        // branch actually rendered (not just a plain row of the same height).
        await expect.element(screen.getByText("Accept")).toBeInTheDocument();

        const tallRow = screen.container.querySelector('[data-index="1"]') as HTMLElement;
        const afterRow = screen.container.querySelector('[data-index="2"]') as HTMLElement;
        expect(afterRow.getBoundingClientRect().top).toBeGreaterThanOrEqual(
            tallRow.getBoundingClientRect().bottom,
        );
    });
});
