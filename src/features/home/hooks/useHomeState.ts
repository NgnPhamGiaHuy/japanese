/**
 * useHomeState — Home dashboard state orchestration
 *
 * @remarks
 * Manages progress/lesson data fetching, the recommended-action tile's
 * underlying numbers, live game-stat subscriptions, and deck action modals.
 */
"use client";

import { useEffect, useState } from "react";

import {
    recommendedAction,
    useDashboardModals,
    useDeckProgressStatus,
    useLessons,
} from "@/features/flashcard";
import { subscribeGameStats } from "@/features/game";
import { HIRAGANA_DATA, KATAKANA_DATA } from "@/features/kana";
import { useUserProgress } from "@/features/user";
import { useAppStore } from "@/lib/app-store";

import type { GameStatEntry } from "@/features/game";

const TOTAL_KANA_CHARS = HIRAGANA_DATA.length + KATAKANA_DATA.length;

export function useHomeState() {
    const { userData, loading: progressLoading } = useUserProgress();
    const { user } = useAppStore();
    const { lessons, loading: lessonsLoading } = useLessons();

    const recentLessons = [...lessons].sort((a, b) => b.createdAt - a.createdAt).slice(0, 2);
    const topLesson = recentLessons[0];

    const deckStatus = useDeckProgressStatus(topLesson?.id ?? "", topLesson?.cardCount ?? 0);
    const action = recommendedAction(deckStatus);
    const primaryCount =
        action === "continue"
            ? deckStatus.dueCount
            : action === "learn"
              ? deckStatus.newCount
              : deckStatus.totalCount;

    // Live Speed/Match best-score + tier badges for the deck cards below.
    const [gameStats, setGameStats] = useState<Record<string, GameStatEntry>>({});
    useEffect(() => {
        if (!user) return;
        return subscribeGameStats(user.uid, setGameStats);
    }, [user]);

    const {
        sharingLesson,
        setSharingLesson,
        deletingLesson,
        setDeletingLesson,
        isDeleting,
        handleDelete,
        shareLesson,
        updateLessonRoles,
    } = useDashboardModals();

    const learnedCount = (userData.learnedChars || []).filter(
        (c) => HIRAGANA_DATA.some((d) => d.char === c) || KATAKANA_DATA.some((d) => d.char === c),
    ).length;
    const kanaPct = Math.min(Math.round((learnedCount / TOTAL_KANA_CHARS) * 100), 100);

    return {
        userData,
        progressLoading,
        lessons,
        lessonsLoading,
        recentLessons,
        topLesson,
        deckStatus,
        action,
        primaryCount,
        gameStats,
        learnedCount,
        totalKanaChars: TOTAL_KANA_CHARS,
        kanaPct,
        sharingLesson,
        setSharingLesson,
        deletingLesson,
        setDeletingLesson,
        isDeleting,
        handleDelete,
        shareLesson,
        updateLessonRoles,
    };
}
