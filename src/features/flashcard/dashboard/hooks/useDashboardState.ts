/**
 * useDashboardState — Dashboard state orchestration
 *
 * @remarks
 * Manages tab state, game stats subscription, and deck reordering logic.
 * Supports three tabs: personal, shared, and discover (public decks from all users).
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { matchGameMode } from "@/features/flashcard/games/match/config";
import { speedGameMode } from "@/features/flashcard/games/speed/config";
import { useLessons, usePublicLessons } from "@/features/flashcard/hooks";
import { subscribeGameStats } from "@/features/game/services";
import { useAppStore } from "@/lib/app-store";
import { useAlert } from "@/shared/providers";
import { reorderWithFractionalIndex } from "@/shared/utils";
import { DASHBOARD_TABS, DEFAULT_TAB_ID } from "../constants";

import type { Lesson } from "@/features/flashcard/types";
import type { GameStatEntry } from "@/features/game/services";

type ActiveTab = "personal" | "shared" | "discover";

export function useDashboardState() {
    const { lessons, sharedLessons, loading, error, reorderLessons } = useLessons();
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

    // orderedLessons mirrors the active tab's list, but can be locally overridden
    // mid-drag by handleLessonsReorder for an optimistic reorder before the
    // Firestore write confirms. Synced during render (not an effect) so a tab/data
    // change takes effect immediately, without an extra commit-then-recompute pass.
    const sourceList =
        activeTab === "personal" ? lessons : activeTab === "shared" ? sharedLessons : publicLessons;
    const [orderedLessons, setOrderedLessons] = useState<Lesson[]>(sourceList);
    const [syncedSourceList, setSyncedSourceList] = useState(sourceList);
    if (sourceList !== syncedSourceList) {
        setSyncedSourceList(sourceList);
        setOrderedLessons(sourceList);
    }

    /**
     * @dnd-kit's DragEndEvent hands us the moved item's id and the id it was
     * dropped on directly — unlike framer-motion's Reorder, which only gives
     * an already-reordered array back, forcing the caller to track "which id
     * is being dragged" separately to reverse-engineer old/new indices.
     */
    const handleLessonsReorder = async (activeId: string, overId: string) => {
        const oldIndex = orderedLessons.findIndex((lesson) => lesson.id === activeId);
        const newIndex = orderedLessons.findIndex((lesson) => lesson.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const { nextItems, changes } = reorderWithFractionalIndex(
            orderedLessons,
            oldIndex,
            newIndex,
        );
        setOrderedLessons(nextItems);

        // Discover-tab cards render non-draggable (canReorder=false disables
        // their useSortable), so this is a defensive check, not a live path.
        if (activeTab !== "personal" && activeTab !== "shared") return;

        try {
            const movedLesson = orderedLessons.find((l) => l.id === activeId);
            const ownerId = movedLesson?.ownerId ?? movedLesson?.userId ?? user?.uid;
            if (!ownerId) return;

            await reorderLessons(ownerId, changes);
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
        getGameStats,
    };
}
