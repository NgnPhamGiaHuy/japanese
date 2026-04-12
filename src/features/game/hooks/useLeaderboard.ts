"use client";

import { useEffect, useState } from "react";

import { subscribeLeaderboard } from "@/features/game/services/game.service";

import type { LeaderboardEntry } from "@/features/game/services/game.service";

/**
 * Subscribes to the real-time leaderboard for a given game mode.
 * Pass `null` to pause the subscription (e.g. while setup screen is visible).
 */
export function useLeaderboard(gameMode: string | null, topN = 10) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!gameMode) {
            setEntries([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsub = subscribeLeaderboard(
            gameMode,
            topN,
            (data) => {
                setEntries(data);
                setLoading(false);
            },
            () => {
                setError("Failed to load leaderboard");
                setLoading(false);
            },
        );

        return unsub;
    }, [gameMode, topN]);

    return { entries, loading, error };
}
