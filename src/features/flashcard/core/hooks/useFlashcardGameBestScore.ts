"use client";

import { useEffect, useState } from "react";

import { subscribeGameStats } from "@/features/game/services";

/**
 * Subscribes to real-time personal best scores for a specific game mode.
 *
 * @remarks
 * Uses a persistent Firestore listener to ensure the UI reflects high-score
 * updates immediately after a session completes or a sync occurs.
 *
 * @param userId - UID of the player to track.
 * @param gameMode - The unique key for the game mode (e.g., 'match', 'speed').
 * @returns The current best score recorded in Firestore, or 0 if none exists.
 */
export function useFlashcardGameBestScore(userId: string | undefined, gameMode: string) {
    const [bestScore, setBestScore] = useState(0);

    useEffect(() => {
        if (!userId) return;
        return subscribeGameStats(userId, (stats) => {
            setBestScore(stats[gameMode]?.bestScore ?? 0);
        });
    }, [userId, gameMode]);

    return userId ? bestScore : 0;
}
