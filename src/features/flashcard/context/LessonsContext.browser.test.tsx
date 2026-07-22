/**
 * @file LessonsContext.browser.test.tsx
 * Proves the core T-113b invariant for lessons: mounting N consumers of
 * useLessons opens exactly ONE pair of Firestore listeners (personal +
 * shared), not N pairs — the exact duplication FlashcardDashboard had
 * (itself + useDashboardState + useDashboardModals, each calling
 * useLessons() independently).
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { LessonsProvider, useLessonsContext } from "./LessonsContext";

const { subscribeLessons, subscribeSharedLessons, unsubPersonalSpy, unsubSharedSpy } = vi.hoisted(
    () => ({
        subscribeLessons: vi.fn(),
        subscribeSharedLessons: vi.fn(),
        unsubPersonalSpy: vi.fn(),
        unsubSharedSpy: vi.fn(),
    }),
);
vi.mock("../services", () => ({ subscribeLessons, subscribeSharedLessons }));

const { useAppStore } = vi.hoisted(() => ({ useAppStore: vi.fn() }));
vi.mock("@/lib/app-store", () => ({ useAppStore }));

function ConsumerCount({ label }: { label: string }) {
    const { lessons, loading } = useLessonsContext();
    return <div data-testid={label}>{loading ? "loading" : `count:${lessons.length}`}</div>;
}

describe("LessonsProvider — single shared subscription", () => {
    it("mounting 3 consumer components (matching FlashcardDashboard's real shape) opens exactly one subscription pair", async () => {
        useAppStore.mockImplementation((selector) => {
            const state = { user: { uid: "u1" } };
            return selector ? selector(state) : state;
        });
        subscribeLessons.mockImplementation((_uid, onUpdate) => {
            onUpdate([{ id: "l1" }, { id: "l2" }]);
            return unsubPersonalSpy;
        });
        subscribeSharedLessons.mockImplementation(() => unsubSharedSpy);

        const screen = await render(
            <LessonsProvider>
                <ConsumerCount label="dashboard-root" />
                <ConsumerCount label="dashboard-state" />
                <ConsumerCount label="dashboard-modals" />
            </LessonsProvider>,
        );

        expect(subscribeLessons).toHaveBeenCalledTimes(1);
        expect(subscribeSharedLessons).toHaveBeenCalledTimes(1);
        await expect.element(screen.getByTestId("dashboard-root")).toHaveTextContent("count:2");
        await expect.element(screen.getByTestId("dashboard-state")).toHaveTextContent("count:2");
        await expect.element(screen.getByTestId("dashboard-modals")).toHaveTextContent("count:2");
    });

    it("unmounting the provider tears down both the personal and shared subscriptions", async () => {
        useAppStore.mockImplementation((selector) => {
            const state = { user: { uid: "u2" } };
            return selector ? selector(state) : state;
        });
        subscribeLessons.mockReturnValue(unsubPersonalSpy);
        subscribeSharedLessons.mockReturnValue(unsubSharedSpy);
        unsubPersonalSpy.mockClear();
        unsubSharedSpy.mockClear();

        const screen = await render(
            <LessonsProvider>
                <ConsumerCount label="only" />
            </LessonsProvider>,
        );
        await expect.element(screen.getByTestId("only")).toBeInTheDocument();

        await screen.unmount();

        expect(unsubPersonalSpy).toHaveBeenCalledTimes(1);
        expect(unsubSharedSpy).toHaveBeenCalledTimes(1);
    });
});
