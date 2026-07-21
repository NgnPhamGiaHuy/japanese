/**
 * @file useHomeState.browser.test.tsx
 * Unit coverage for useHomeState's own derivation logic (T-117e) — the
 * numbers unique to the home dashboard, not the hooks it composes (those are
 * covered in their own features). Every dependency is mocked at the module
 * boundary useHomeState.ts itself imports, so this exercises the REAL
 * derivation expressions in the hook, not a reimplementation of them.
 *
 * Runs in the browser tier (renderHook needs a real React render target) —
 * this repo has no direct hook-unit-test precedent, but every dependency
 * here is a stateful client hook, which is exactly the "genuinely requires
 * [a non-default tier]" case ADR-117's own AC anticipates.
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { useHomeState } from "./useHomeState";

import type { Lesson } from "@/features/flashcard";
import type { DeckAction, DeckStatus } from "@/features/flashcard/utils/learningEngine";
import type { UserData } from "@/features/user/types/user.types";

const { recommendedAction, useDashboardModals, useDeckProgressStatus, useLessons } = vi.hoisted(
    () => ({
        recommendedAction: vi.fn(),
        useDashboardModals: vi.fn(),
        useDeckProgressStatus: vi.fn(),
        useLessons: vi.fn(),
    }),
);
vi.mock("@/features/flashcard", () => ({
    recommendedAction,
    useDashboardModals,
    useDeckProgressStatus,
    useLessons,
}));

const { subscribeGameStats } = vi.hoisted(() => ({ subscribeGameStats: vi.fn() }));
vi.mock("@/features/game", () => ({ subscribeGameStats }));

// A small, deterministic fixture — NOT the real (large) kana dataset — so
// kanaPct's arithmetic is predictable regardless of how many kana exist.
vi.mock("@/features/kana", () => ({
    HIRAGANA_DATA: [{ char: "あ" }, { char: "い" }],
    KATAKANA_DATA: [{ char: "ア" }, { char: "イ" }],
}));

const { useUserProgress } = vi.hoisted(() => ({ useUserProgress: vi.fn() }));
vi.mock("@/features/user", () => ({ useUserProgress }));

const { useAppStore } = vi.hoisted(() => ({ useAppStore: vi.fn() }));
vi.mock("@/lib/app-store", () => ({ useAppStore }));

const EMPTY_DASHBOARD_MODALS = {
    sharingLesson: null,
    setSharingLesson: vi.fn(),
    deletingLesson: null,
    setDeletingLesson: vi.fn(),
    isDeleting: false,
    handleDelete: vi.fn(),
    shareLesson: vi.fn(),
    updateLessonRoles: vi.fn(),
};

function deckStatus(overrides: Partial<DeckStatus> = {}): DeckStatus {
    return { newCount: 0, dueCount: 0, mistakeCount: 0, totalCount: 0, ...overrides };
}

function lesson(overrides: Partial<Lesson> = {}): Lesson {
    return {
        id: "l1",
        title: "t",
        description: "d",
        createdAt: 0,
        cardCount: 0,
        ...overrides,
    } as Lesson;
}

function setUp(options: {
    action: DeckAction;
    status: DeckStatus;
    lessons?: Lesson[];
    learnedChars?: string[];
}) {
    useUserProgress.mockReturnValue({
        userData: { learnedChars: options.learnedChars ?? [] } as UserData,
        loading: false,
    });
    useAppStore.mockReturnValue({ user: { uid: "u1" } });
    useLessons.mockReturnValue({ lessons: options.lessons ?? [], loading: false });
    useDeckProgressStatus.mockReturnValue(options.status);
    recommendedAction.mockReturnValue(options.action);
    useDashboardModals.mockReturnValue(EMPTY_DASHBOARD_MODALS);
    subscribeGameStats.mockReturnValue(() => {});
}

describe("useHomeState — primaryCount", () => {
    it("uses dueCount when the recommended action is 'continue'", async () => {
        setUp({
            action: "continue",
            status: deckStatus({ dueCount: 7, newCount: 3, totalCount: 20 }),
        });
        const { result } = await renderHook(() => useHomeState());
        expect(result.current.primaryCount).toBe(7);
    });

    it("uses newCount when the recommended action is 'learn'", async () => {
        setUp({
            action: "learn",
            status: deckStatus({ dueCount: 7, newCount: 3, totalCount: 20 }),
        });
        const { result } = await renderHook(() => useHomeState());
        expect(result.current.primaryCount).toBe(3);
    });

    it("uses totalCount when the recommended action is 'idle'", async () => {
        setUp({ action: "idle", status: deckStatus({ dueCount: 7, newCount: 3, totalCount: 20 }) });
        const { result } = await renderHook(() => useHomeState());
        expect(result.current.primaryCount).toBe(20);
    });
});

describe("useHomeState — recentLessons", () => {
    it("returns at most 2 lessons, newest first", async () => {
        setUp({
            action: "idle",
            status: deckStatus(),
            lessons: [
                lesson({ id: "old", createdAt: 1 }),
                lesson({ id: "newest", createdAt: 3 }),
                lesson({ id: "mid", createdAt: 2 }),
            ],
        });
        const { result } = await renderHook(() => useHomeState());
        expect(result.current.recentLessons.map((l) => l.id)).toEqual(["newest", "mid"]);
        expect(result.current.topLesson?.id).toBe("newest");
    });

    it("does not mutate the original lessons array (sorts a copy)", async () => {
        const original = [lesson({ id: "a", createdAt: 1 }), lesson({ id: "b", createdAt: 2 })];
        setUp({ action: "idle", status: deckStatus(), lessons: original });
        await renderHook(() => useHomeState());
        expect(original.map((l) => l.id)).toEqual(["a", "b"]);
    });

    it("topLesson is undefined when there are no lessons", async () => {
        setUp({ action: "idle", status: deckStatus(), lessons: [] });
        const { result } = await renderHook(() => useHomeState());
        expect(result.current.topLesson).toBeUndefined();
    });
});

describe("useHomeState — kanaPct", () => {
    it("computes the percentage of the (mocked, 4-char) kana set learned", async () => {
        // 2 of the 4 fixture chars ("あ" hiragana, "ア" katakana) learned == 50%.
        setUp({ action: "idle", status: deckStatus(), learnedChars: ["あ", "ア"] });
        const { result } = await renderHook(() => useHomeState());
        expect(result.current.kanaPct).toBe(50);
        expect(result.current.learnedCount).toBe(2);
    });

    it("caps at 100 even if learnedChars somehow exceeds the known set", async () => {
        setUp({
            action: "idle",
            status: deckStatus(),
            learnedChars: ["あ", "い", "ア", "イ", "duplicate-or-stale"],
        });
        const { result } = await renderHook(() => useHomeState());
        expect(result.current.kanaPct).toBe(100);
    });

    it("ignores characters not present in either kana set", async () => {
        setUp({ action: "idle", status: deckStatus(), learnedChars: ["あ", "not-a-kana-char"] });
        const { result } = await renderHook(() => useHomeState());
        expect(result.current.learnedCount).toBe(1);
    });

    it("is 0 when learnedChars is absent", async () => {
        useUserProgress.mockReturnValue({ userData: {} as UserData, loading: false });
        useAppStore.mockReturnValue({ user: { uid: "u1" } });
        useLessons.mockReturnValue({ lessons: [], loading: false });
        useDeckProgressStatus.mockReturnValue(deckStatus());
        recommendedAction.mockReturnValue("idle");
        useDashboardModals.mockReturnValue(EMPTY_DASHBOARD_MODALS);
        subscribeGameStats.mockReturnValue(() => {});

        const { result } = await renderHook(() => useHomeState());
        expect(result.current.kanaPct).toBe(0);
    });
});
