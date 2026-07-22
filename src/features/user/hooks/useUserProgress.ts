"use client";

import { useAppStore } from "@/lib/app-store";
import { useUserProgressContext } from "../context/UserProgressContext";
import { updateUserProgress } from "../services";

/**
 * Manages XP, daily streak, and lesson completion counts strictly synced
 * with Firebase.
 *
 * @remarks
 * The read half (`userData`, `loading`) comes from the single shared
 * subscription in `UserProgressProvider` (ADR-113, T-113a) — mounting this
 * hook N times opens zero additional Firestore listeners. The write actions
 * below are unchanged: one-shot transactional writes, not listeners, so
 * there was never a multiplication cost to centralize.
 */
export function useUserProgress() {
    const { userData, loading } = useUserProgressContext();
    const { user } = useAppStore();

    const addXP = async (amount: number) => {
        if (!user) return;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        try {
            await updateUserProgress(user.uid, (prev) => {
                const newStreak =
                    prev.lastPlayed === today
                        ? prev.streak
                        : prev.lastPlayed === yesterday
                          ? prev.streak + 1
                          : 1;

                return {
                    ...prev,
                    xp: prev.xp + amount,
                    streak: newStreak,
                    lastPlayed: today,
                };
            });
        } catch (err) {
            console.error("[useUserProgress] Failed to add XP:", err);
        }
    };

    const completedLesson = async () => {
        if (!user) return;
        try {
            await updateUserProgress(user.uid, (prev) => ({
                ...prev,
                lessonsCompleted: prev.lessonsCompleted + 1,
            }));
        } catch (err) {
            console.error("[useUserProgress] Failed to complete lesson:", err);
        }
    };

    const markLearned = async (char: string) => {
        if (!user) return;
        try {
            await updateUserProgress(user.uid, (prev) => {
                if (prev.learnedChars.includes(char)) return prev;
                return { ...prev, learnedChars: [...prev.learnedChars, char] };
            });
        } catch (err) {
            console.error("[useUserProgress] Failed to mark learned:", err);
        }
    };

    const recordCharStat = async (char: string, isCorrect: boolean) => {
        if (!user) return;
        try {
            await updateUserProgress(user.uid, (prev) => {
                const charStats = { ...prev.charStats };
                if (!charStats[char]) {
                    charStats[char] = { correct: 0, attempts: 0 };
                }
                charStats[char].attempts += 1;
                if (isCorrect) charStats[char].correct += 1;
                return { ...prev, charStats };
            });
        } catch (err) {
            console.error("[useUserProgress] Failed to record char stat:", err);
        }
    };

    const resetProgress = async () => {
        if (!user) return;
        try {
            await updateUserProgress(user.uid, (prev) => ({
                ...prev,
                learnedChars: [],
                charStats: {},
            }));
        } catch (err) {
            console.error("[useUserProgress] Failed to reset progress:", err);
        }
    };

    return {
        userData,
        addXP,
        completedLesson,
        markLearned,
        recordCharStat,
        resetProgress,
        loading,
    };
}
