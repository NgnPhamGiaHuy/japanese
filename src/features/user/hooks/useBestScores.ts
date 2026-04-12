"use client";

import { useCallback, useEffect } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { getDeviceId } from "@/shared/utils/device";
import { useAppStore } from "@/store/useAppStore";
import { useKanaStore } from "@/store/useKanaStore";

/** Syncs best scores from Firestore → Zustand and exposes a save function */
export function useBestScores() {
    const { user } = useAppStore();
    const { bestScores, setBestScores, updateBestScore } = useKanaStore();

    // Real-time listener for best scores
    useEffect(() => {
        if (!user) return;
        const ref = collection(db, "artifacts", APP_ID, "users", user.uid, "stats");
        const unsub = onSnapshot(ref, (snap) => {
            const scores: Record<string, number> = {};
            snap.forEach((d) => {
                scores[d.id] = d.data().bestScore ?? 0;
            });
            setBestScores(scores);
        });
        return unsub;
    }, [user, setBestScores]);

    /** Writes a new score if it beats the current best, and updates the leaderboard */
    const saveScore = useCallback(
        async (score: number, playerName: string, modeKey: string) => {
            if (!user) return;
            const currentBest = bestScores[modeKey] ?? 0;

            try {
                if (score > currentBest) {
                    await setDoc(
                        doc(db, "artifacts", APP_ID, "users", user.uid, "stats", modeKey),
                        {
                            bestScore: score,
                            lastUpdated: new Date().toISOString(),
                        },
                        { merge: true },
                    );
                    updateBestScore(modeKey, score);
                }

                const scoreToSubmit = Math.max(score, currentBest);
                if (scoreToSubmit > 0) {
                    const deviceId = getDeviceId();
                    await setDoc(
                        doc(
                            db,
                            "artifacts",
                            APP_ID,
                            "public",
                            "data",
                            `leaderboard_${modeKey}`,
                            deviceId,
                        ),
                        {
                            userId: user.uid,
                            deviceId,
                            name: playerName.substring(0, 10).toUpperCase(),
                            score: scoreToSubmit,
                            timestamp: new Date().toISOString(),
                        },
                        { merge: true },
                    );
                }
            } catch (err) {
                console.error("[Firestore] Score save error:", err);
            }
        },
        [user, bestScores, updateBestScore],
    );

    return { bestScores, saveScore };
}
