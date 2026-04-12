"use client";

import { useState } from "react";

import { INITIAL_USER_DATA } from "../types/user.types";

import type { UserData } from "../types/user.types";

const STORAGE_KEY = "nihongo_user";

function load(): UserData {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : INITIAL_USER_DATA;
    } catch {
        return INITIAL_USER_DATA;
    }
}

function save(data: UserData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
}

/** Manages XP, daily streak, and lesson completion counts */
export function useUserProgress() {
    const [userData, setUserData] = useState<UserData>(load);

    const addXP = (amount: number) => {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        setUserData((prev) => {
            const newStreak =
                prev.lastPlayed === today
                    ? prev.streak
                    : prev.lastPlayed === yesterday
                      ? prev.streak + 1
                      : 1;

            const updated = {
                ...prev,
                xp: prev.xp + amount,
                streak: newStreak,
                lastPlayed: today,
            };
            save(updated);
            return updated;
        });
    };

    const completedLesson = () => {
        setUserData((prev) => {
            const updated = {
                ...prev,
                lessonsCompleted: prev.lessonsCompleted + 1,
            };
            save(updated);
            return updated;
        });
    };

    return { userData, addXP, completedLesson };
}
