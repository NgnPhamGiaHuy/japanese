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
            return;
        }

        // onSnapshot never fires synchronously, so there's no way to signal
        // "fetch started" without a synchronous setState here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const { leaderboard, userRank } = useMemo(() => {
        const allEntries = gameMode ? [...entries] : [];

        if (currentUser && currentScore > 0) {
            const existingIdx = allEntries.findIndex(
                (entry) => entry.userId === currentUser.userId,
            );
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

        const computed: ComputedLeaderboardEntry[] = allEntries.map((entry, index) => ({
            ...entry,
            rank: index + 1,
            isCurrentUser: currentUser?.userId === entry.userId,
        }));

        const rank = currentUser
            ? (computed.find((entry) => entry.isCurrentUser)?.rank ?? null)
            : null;

        return {
            leaderboard: computed.slice(0, topN),
            userRank: rank,
        };
    }, [entries, currentUser, currentScore, gameMode, topN]);

    return { entries: leaderboard, userRank, loading: gameMode ? loading : false, error };
}
