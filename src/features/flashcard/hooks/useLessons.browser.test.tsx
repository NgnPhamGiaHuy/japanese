/**
 * @file useLessons.browser.test.tsx
 * Proves the T-114a invariant for the public-decks listener: the Firestore
 * subscription is always bounded by an explicit `pageSize`, and `loadMore()`
 * grows that window (resubscribing at a higher limit) rather than switching
 * to an unbounded stream.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react/pure";

import { usePublicLessons } from "./useLessons";

const { subscribePublicLessons } = vi.hoisted(() => ({
    subscribePublicLessons: vi.fn(),
}));
vi.mock("../services", () => ({ subscribePublicLessons }));

const { useAppStore } = vi.hoisted(() => ({ useAppStore: vi.fn() }));
vi.mock("@/lib/app-store", () => ({ useAppStore }));

vi.mock("../actions/activity-log.actions", () => ({
    logDeckCreated: vi.fn(),
    logDeckDeleted: vi.fn(),
    logDeckUpdated: vi.fn(),
}));

const { useLessonsContext } = vi.hoisted(() => ({ useLessonsContext: vi.fn() }));
vi.mock("../context/LessonsContext", () => ({ useLessonsContext }));

const PAGE_SIZE = 30;

function makeLessons(count: number) {
    return Array.from({ length: count }, (_, i) => ({ id: `l${i}` }));
}

describe("usePublicLessons — bounded query + grow-window pagination (T-114a)", () => {
    beforeEach(() => {
        subscribePublicLessons.mockClear();
    });

    it("subscribes with the default page size on first mount", async () => {
        useAppStore.mockImplementation((selector) => {
            const state = { user: { uid: "u1" } };
            return selector ? selector(state) : state;
        });
        subscribePublicLessons.mockImplementation((_uid, onUpdate) => {
            onUpdate(makeLessons(10));
            return vi.fn();
        });

        const { result } = await renderHook(() => usePublicLessons());

        await expect.poll(() => result.current.loading).toBe(false);
        expect(subscribePublicLessons).toHaveBeenCalledTimes(1);
        expect(subscribePublicLessons).toHaveBeenLastCalledWith(
            "u1",
            expect.any(Function),
            expect.any(Function),
            PAGE_SIZE,
        );
    });

    it("reports hasMore when a full page comes back, and false for a short page", async () => {
        useAppStore.mockImplementation((selector) => {
            const state = { user: { uid: "u2" } };
            return selector ? selector(state) : state;
        });
        subscribePublicLessons.mockImplementation((_uid, onUpdate, _onError, pageSize) => {
            onUpdate(makeLessons(pageSize));
            return vi.fn();
        });

        const { result } = await renderHook(() => usePublicLessons());
        await expect.poll(() => result.current.loading).toBe(false);
        expect(result.current.hasMore).toBe(true);

        subscribePublicLessons.mockImplementation((_uid, onUpdate) => {
            onUpdate(makeLessons(5));
            return vi.fn();
        });
        result.current.loadMore();

        await expect.poll(() => result.current.hasMore).toBe(false);
    });

    it("loadMore() grows the window and resubscribes at the larger limit, tearing down the old listener", async () => {
        useAppStore.mockImplementation((selector) => {
            const state = { user: { uid: "u3" } };
            return selector ? selector(state) : state;
        });
        const unsubFirst = vi.fn();
        const unsubSecond = vi.fn();
        subscribePublicLessons.mockImplementationOnce((_uid, onUpdate) => {
            onUpdate(makeLessons(PAGE_SIZE));
            return unsubFirst;
        });

        const { result } = await renderHook(() => usePublicLessons());
        await expect.poll(() => result.current.loading).toBe(false);
        expect(subscribePublicLessons).toHaveBeenLastCalledWith(
            "u3",
            expect.any(Function),
            expect.any(Function),
            PAGE_SIZE,
        );

        subscribePublicLessons.mockImplementationOnce((_uid, onUpdate) => {
            onUpdate(makeLessons(PAGE_SIZE * 2));
            return unsubSecond;
        });
        result.current.loadMore();

        await expect.poll(() => subscribePublicLessons).toHaveBeenCalledTimes(2);
        expect(unsubFirst).toHaveBeenCalledTimes(1);
        expect(subscribePublicLessons).toHaveBeenLastCalledWith(
            "u3",
            expect.any(Function),
            expect.any(Function),
            PAGE_SIZE * 2,
        );
    });

    it("resets the page size back to the default when the user identity changes", async () => {
        useAppStore.mockImplementation((selector) => {
            const state = { user: { uid: "u4" } };
            return selector ? selector(state) : state;
        });
        subscribePublicLessons.mockImplementation((_uid, onUpdate, _onError, pageSize) => {
            onUpdate(makeLessons(pageSize));
            return vi.fn();
        });

        const { result, rerender } = await renderHook(() => usePublicLessons());
        await expect.poll(() => result.current.loading).toBe(false);
        result.current.loadMore();
        await expect.poll(() => subscribePublicLessons).toHaveBeenCalledTimes(2);
        expect(subscribePublicLessons).toHaveBeenLastCalledWith(
            "u4",
            expect.any(Function),
            expect.any(Function),
            PAGE_SIZE * 2,
        );

        useAppStore.mockImplementation((selector) => {
            const state = { user: { uid: "u5" } };
            return selector ? selector(state) : state;
        });
        rerender();

        await expect.poll(() => result.current.loading).toBe(false);
        expect(subscribePublicLessons).toHaveBeenLastCalledWith(
            "u5",
            expect.any(Function),
            expect.any(Function),
            PAGE_SIZE,
        );
    });
});
