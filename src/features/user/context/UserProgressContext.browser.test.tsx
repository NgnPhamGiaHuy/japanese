/**
 * @file UserProgressContext.browser.test.tsx
 * Proves the core T-113a invariant: mounting N consumers of useUserProgress
 * opens exactly ONE Firestore listener, not N — and that all consumers see
 * the same data, updating together from a single snapshot.
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { UserProgressProvider } from "./UserProgressContext";
import { useUserProgress } from "../hooks/useUserProgress";

const { subscribeUserProgress, unsubscribeSpy } = vi.hoisted(() => ({
    subscribeUserProgress: vi.fn(),
    unsubscribeSpy: vi.fn(),
}));
vi.mock("../services", () => ({ subscribeUserProgress, updateUserProgress: vi.fn() }));

const { useAppStore } = vi.hoisted(() => ({ useAppStore: vi.fn() }));
vi.mock("@/lib/app-store", () => ({ useAppStore }));

function ConsumerXP({ label }: { label: string }) {
    const { userData, loading } = useUserProgress();
    return <div data-testid={label}>{loading ? "loading" : `xp:${userData.xp}`}</div>;
}

describe("UserProgressProvider — single shared subscription", () => {
    it("mounting 3 consumer components opens exactly one subscription", async () => {
        useAppStore.mockReturnValue({ user: { uid: "u1" } });
        subscribeUserProgress.mockImplementation((_uid, onUpdate) => {
            onUpdate({
                xp: 42,
                streak: 0,
                lastPlayed: "",
                lessonsCompleted: 0,
                learnedChars: [],
                charStats: {},
            });
            return unsubscribeSpy;
        });

        const screen = await render(
            <UserProgressProvider>
                <ConsumerXP label="a" />
                <ConsumerXP label="b" />
                <ConsumerXP label="c" />
            </UserProgressProvider>,
        );

        expect(subscribeUserProgress).toHaveBeenCalledTimes(1);
        await expect.element(screen.getByTestId("a")).toHaveTextContent("xp:42");
        await expect.element(screen.getByTestId("b")).toHaveTextContent("xp:42");
        await expect.element(screen.getByTestId("c")).toHaveTextContent("xp:42");
    });

    it("unmounting the provider tears down the single subscription", async () => {
        useAppStore.mockReturnValue({ user: { uid: "u2" } });
        subscribeUserProgress.mockReturnValue(unsubscribeSpy);
        unsubscribeSpy.mockClear();

        const screen = await render(
            <UserProgressProvider>
                <ConsumerXP label="only" />
            </UserProgressProvider>,
        );
        await expect.element(screen.getByTestId("only")).toBeInTheDocument();

        await screen.unmount();

        expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });

    it("a single snapshot update is reflected by every mounted consumer simultaneously", async () => {
        useAppStore.mockReturnValue({ user: { uid: "u3" } });
        let pushUpdate: ((data: unknown) => void) | undefined;
        subscribeUserProgress.mockImplementation((_uid, onUpdate) => {
            pushUpdate = onUpdate;
            return unsubscribeSpy;
        });

        const screen = await render(
            <UserProgressProvider>
                <ConsumerXP label="x" />
                <ConsumerXP label="y" />
            </UserProgressProvider>,
        );

        pushUpdate!({
            xp: 7,
            streak: 1,
            lastPlayed: "",
            lessonsCompleted: 0,
            learnedChars: [],
            charStats: {},
        });

        await expect.element(screen.getByTestId("x")).toHaveTextContent("xp:7");
        await expect.element(screen.getByTestId("y")).toHaveTextContent("xp:7");
    });
});
