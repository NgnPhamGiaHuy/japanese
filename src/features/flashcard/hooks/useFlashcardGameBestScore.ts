"use client";

import { useEffect, useState } from "react";

import { subscribeGameStats } from "@/features/game/services/game.service";

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
