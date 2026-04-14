"use client";

import { useEffect, useState } from "react";

import { useAppStore } from "@/store";
import { subscribeUserProgress, updateUserProgress } from "../services/user.service";
import { INITIAL_USER_DATA } from "../types/user.types";

import type { UserData } from "../types/user.types";

/** Manages XP, daily streak, and lesson completion counts strictly synced with Firebase */
export function useUserProgress() {
    const [userData, setUserData] = useState<UserData>(INITIAL_USER_DATA);
    const [loading, setLoading] = useState(true);
    const { user } = useAppStore();

    useEffect(() => {
        if (!user) {
            setUserData(INITIAL_USER_DATA);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsub = subscribeUserProgress(
            user.uid,
            (data) => {
                setUserData(data);
                setLoading(false);
            },
            () => setLoading(false),
        );

        return unsub;
    }, [user]);

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
