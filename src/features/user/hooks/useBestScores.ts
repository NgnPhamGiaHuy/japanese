"use client";

import { useCallback, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";

import { saveGameResult } from "@/features/game/services/game.service";
import { APP_ID, db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import { useKanaStore } from "@/store/useKanaStore";

/** Syncs personal best scores from Firestore → Zustand and exposes a save function. */
export function useBestScores() {
    const { user } = useAppStore();
    const { bestScores, setBestScores, updateBestScore } = useKanaStore();

    // Real-time listener: keeps Zustand in sync with Firestore personal bests
    useEffect(() => {
        if (!user) return;
        const ref = collection(db, "artifacts", APP_ID, "users", user.uid, "stats");
        return onSnapshot(ref, (snap) => {
            const scores: Record<string, number> = {};
            snap.forEach((d) => {
                scores[d.id] = d.data().bestScore ?? 0;
            });
            setBestScores(scores);
        });
    }, [user, setBestScores]);

    /**
     * Save a score for a game mode.
     *
     * - Uses Google display name when available, falls back to `playerName`.
     * - Only writes to Firestore when the new score beats the current best.
     * - Updates both personal best AND public leaderboard atomically via game.service.
     */
    const saveScore = useCallback(
        async (score: number, playerName: string, modeKey: string) => {
            if (!user) return;
            const currentBest = bestScores[modeKey] ?? 0;
            const displayName = (user.displayName || playerName || "Player").substring(0, 20);

            try {
                await saveGameResult({
                    userId: user.uid,
                    displayName,
                    gameMode: modeKey,
                    score,
                    currentBest,
                });
                if (score > currentBest) {
                    updateBestScore(modeKey, score);
                }
            } catch (err) {
                console.error("[useBestScores] Save error:", err);
            }
        },
        [user, bestScores, updateBestScore],
    );

    return { bestScores, saveScore };
}
