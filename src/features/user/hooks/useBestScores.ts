"use client";

import { useCallback, useEffect, useState } from "react";

import { collection, onSnapshot } from "firebase/firestore";

import { saveGameResult } from "@/features/game/services/game.service";
import { APP_ID, db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";

/** Syncs personal best scores from Firestore */
export function useBestScores() {
    const { user } = useAppStore();
    const [bestScores, setBestScores] = useState<Record<string, number>>({});

    // Real-time listener: keeps state in sync with Firestore personal bests
    useEffect(() => {
        if (!user) {
            setBestScores({});
            return;
        }

        const ref = collection(db, "artifacts", APP_ID, "users", user.uid, "stats");
        return onSnapshot(ref, (snap) => {
            const scores: Record<string, number> = {};
            snap.forEach((d) => {
                scores[d.id] = d.data().bestScore ?? 0;
            });
            setBestScores(scores);
        });
    }, [user]);

    /**
     * Save a score for a game mode.
     * Legacy mode for non-session-based games (like non-time/drop modes if any exist)
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
            } catch (err) {
                console.error("[useBestScores] Save error:", err);
            }
        },
        [user, bestScores],
    );

    return { bestScores, saveScore };
}
