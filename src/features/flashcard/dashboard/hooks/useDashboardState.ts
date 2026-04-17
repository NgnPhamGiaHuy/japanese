/**
 * useDashboardState — Dashboard state orchestration
 *
 * @remarks
 * Manages tab state, game stats subscription, and deck reordering logic.
 * Supports three tabs: personal, shared, and discover (public decks from all users).
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useLessons, usePublicLessons } from "@/features/flashcard/core/hooks";
import { matchGameMode, speedGameMode, subscribeGameStats } from "@/features/game";
import { useAlert } from "@/shared/providers";
import { reorderWithFractionalIndex } from "@/shared/utils";
import { useAppStore } from "@/store";
import { DASHBOARD_TABS, DEFAULT_TAB_ID } from "../constants";

import type { Lesson } from "@/features/flashcard/core/types";
import type { GameStatEntry } from "@/features/game";

type ActiveTab = "personal" | "shared" | "discover";

export function useDashboardState() {
    const { lessons, sharedLessons, loading, error, reorderLesson } = useLessons();
    const { publicLessons, loading: publicLoading, error: publicError } = usePublicLessons();
    const { user } = useAppStore();
    const { showAlert } = useAlert();
    const router = useRouter();
    const searchParams = useSearchParams();

    const tabParam = searchParams.get("tab") as ActiveTab | null;
    const activeTab: ActiveTab =
        tabParam && DASHBOARD_TABS.some((t) => t.id === tabParam) ? tabParam : DEFAULT_TAB_ID;

    const handleTabChange = (tab: ActiveTab) => {
        router.replace(`/flashcard?tab=${tab}`, { scroll: false });
    };

    const [gameStats, setGameStats] = useState<Record<string, GameStatEntry>>({});

    useEffect(() => {
        if (!user) return;
        return subscribeGameStats(user.uid, setGameStats);
    }, [user]);

    const activeDragLessonIdRef = useRef<string | null>(null);
    const [orderedLessons, setOrderedLessons] = useState<Lesson[]>([]);

    useEffect(() => {
        if (activeTab === "personal") setOrderedLessons(lessons);
        else if (activeTab === "shared") setOrderedLessons(sharedLessons);
        else setOrderedLessons(publicLessons);
    }, [lessons, sharedLessons, publicLessons, activeTab]);

    const handleLessonsReorder = async (nextLessons: Lesson[]) => {
        setOrderedLessons(nextLessons);

        const activeId = activeDragLessonIdRef.current;
        if (!activeId || (activeTab !== "personal" && activeTab !== "shared")) return;

        const oldIndex = orderedLessons.findIndex((lesson) => lesson.id === activeId);
        const newIndex = nextLessons.findIndex((lesson) => lesson.id === activeId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        try {
            const movedLesson = orderedLessons.find((l) => l.id === activeId);
            const ownerId = movedLesson?.ownerId ?? movedLesson?.userId ?? user?.uid;
            if (!ownerId) return;

            const { movedId, newOrder } = reorderWithFractionalIndex(
                orderedLessons,
                oldIndex,
                newIndex,
            );
            await reorderLesson(ownerId, movedId, newOrder);
        } catch (err) {
            console.error("[handleLessonsReorder] Reorder failed:", err);
            setOrderedLessons(lessons);
            showAlert("error", "Reorder failed");
        }
    };

    const getGameStats = (lessonId: string) => ({
        matchStats: gameStats[matchGameMode(lessonId)],
        speedStats: gameStats[speedGameMode(lessonId)],
    });

    const isLoading = activeTab === "discover" ? publicLoading : loading;
    const activeError = activeTab === "discover" ? publicError : error;

    return {
        activeTab,
        handleTabChange,
        lessons,
        sharedLessons,
        publicLessons,
        orderedLessons,
        loading: isLoading,
        error: activeError,
        handleLessonsReorder,
        activeDragLessonIdRef,
        getGameStats,
    };
}
