/**
 * useDashboardState — Dashboard state orchestration
 *
 * @remarks
 * Manages tab state, game stats subscription, and deck reordering logic.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useLessons } from "@/features/flashcard/core/hooks";
import { matchGameMode, speedGameMode, subscribeGameStats } from "@/features/game";
import { useAlert } from "@/shared/providers";
import { reorderWithFractionalIndex } from "@/shared/utils";
import { useAppStore } from "@/store";

import type { Lesson } from "@/features/flashcard/core/types";
import type { GameStatEntry } from "@/features/game";

export function useDashboardState() {
    const { lessons, sharedLessons, loading, error, reorderLesson } = useLessons();
    const { user } = useAppStore();
    const { showAlert } = useAlert();
    const router = useRouter();
    const searchParams = useSearchParams();

    const tabParam = searchParams.get("tab") as "personal" | "shared" | null;
    const activeTab = tabParam || "personal";

    const handleTabChange = (tab: "personal" | "shared") => {
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
        setOrderedLessons(activeTab === "personal" ? lessons : sharedLessons);
    }, [lessons, sharedLessons, activeTab]);

    const handleLessonsReorder = async (nextLessons: Lesson[]) => {
        setOrderedLessons(nextLessons);

        const activeId = activeDragLessonIdRef.current;
        if (!activeId || activeTab !== "personal") return;

        const oldIndex = orderedLessons.findIndex((lesson) => lesson.id === activeId);
        const newIndex = nextLessons.findIndex((lesson) => lesson.id === activeId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        try {
            const { movedId, newOrder } = reorderWithFractionalIndex(
                orderedLessons,
                oldIndex,
                newIndex,
            );
            await reorderLesson(movedId, newOrder);
        } catch (err) {
            console.error("[handleLessonsReorder] Reorder failed:", err);
            setOrderedLessons(activeTab === "personal" ? lessons : sharedLessons);
            showAlert("error", "Reorder failed");
        }
    };

    const getGameStats = (lessonId: string) => ({
        matchStats: gameStats[matchGameMode(lessonId)],
        speedStats: gameStats[speedGameMode(lessonId)],
    });

    return {
        activeTab,
        handleTabChange,
        lessons,
        sharedLessons,
        orderedLessons,
        loading,
        error,
        handleLessonsReorder,
        activeDragLessonIdRef,
        getGameStats,
    };
}
