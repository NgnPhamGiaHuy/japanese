"use client";

import { useCallback, useEffect, useState } from "react";

import { submitScore, subscribePersonalBests } from "@/features/game/services";
import { useAppStore } from "@/store";

/** Syncs personal best scores from Firestore and exposes a score-submit helper. */
export function useBestScores() {
    const { user } = useAppStore();
    const [bestScores, setBestScores] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!user) {
            setBestScores({});
            return;
        }
        return subscribePersonalBests(user.uid, setBestScores);
    }, [user]);

    /**
     * Submits a score for a game mode.
     * Promotes to leaderboard + personal best only if it is a new high.
     */
    const saveScore = useCallback(
        async (score: number, playerName: string, modeKey: string) => {
            if (!user) return;
            const displayName = (user.displayName || playerName || "Player").substring(0, 20);
            try {
                await submitScore({
                    userId: user.uid,
                    displayName,
                    gameMode: modeKey,
                    score,
                });
            } catch (err) {
                console.error("[useBestScores] Save error:", err);
            }
        },
        [user],
    );

    return { bestScores, saveScore };
}
