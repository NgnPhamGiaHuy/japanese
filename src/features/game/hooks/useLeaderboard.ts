"use client";

import { useEffect, useMemo, useState } from "react";

import { subscribeLeaderboard } from "@/features/game/services";

import type { LeaderboardEntry } from "@/features/game/services";

export interface ComputedLeaderboardEntry extends LeaderboardEntry {
    rank: number;
    isCurrentUser: boolean;
}

/**
 * Subscribes to the real-time leaderboard for a given game mode.
 * Pass `null` to pause the subscription (e.g. while setup screen is visible).
 */
export function useLeaderboard(
    gameMode: string | null,
    topN = 10,
    currentUser?: { userId: string; displayName: string },
    currentScore: number = 0,
) {
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

    const { leaderboard, userRank, nearbyPlayers } = useMemo(() => {
        let allEntries = [...entries];

        if (currentUser && currentScore > 0) {
            const existingIdx = allEntries.findIndex((e) => e.userId === currentUser.userId);
            if (existingIdx !== -1) {
                if (currentScore > allEntries[existingIdx].score) {
                    allEntries[existingIdx] = { ...allEntries[existingIdx], score: currentScore };
                }
            } else {
                allEntries.push({
                    userId: currentUser.userId,
                    displayName: currentUser.displayName,
                    score: currentScore,
                    gameMode: gameMode || "",
                    timestamp: new Date().toISOString(),
                });
            }
        }

        allEntries.sort((a, b) => b.score - a.score);

        const computed: ComputedLeaderboardEntry[] = allEntries.map((e, i) => ({
            ...e,
            rank: i + 1,
            isCurrentUser: currentUser?.userId === e.userId,
        }));

        const rank = currentUser ? computed.find((e) => e.isCurrentUser)?.rank || null : null;
        const nearby = rank ? computed.filter((e) => Math.abs(e.rank - rank) <= 1) : [];

        return {
            leaderboard: computed.slice(0, topN),
            userRank: rank,
            nearbyPlayers: nearby,
        };
    }, [entries, currentUser, currentScore, gameMode, topN]);

    return { entries: leaderboard, userRank, nearbyPlayers, loading, error };
}
