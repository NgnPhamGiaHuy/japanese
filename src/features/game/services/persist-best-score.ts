import { doc, runTransaction } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";

/** /artifacts/{APP_ID}/public/data/leaderboard_{mode}/{userId} */
const lbDoc = (gameMode: string, userId: string) =>
    doc(db, "artifacts", APP_ID, "public", "data", `leaderboard_${gameMode}`, userId);

/** /artifacts/{APP_ID}/users/{uid}/stats/{gameMode} */
const personalBestDoc = (userId: string, gameMode: string) =>
    doc(db, "artifacts", APP_ID, "users", userId, "stats", gameMode);

/**
 * Atomically writes the final score to the public leaderboard and the user's
 * personal best if (and only if) `score` beats the current database value.
 *
 * @remarks
 * Uses Firestore transaction to ensure:
 * - Read-check-write atomicity (no race conditions)
 * - Concurrent-safe (automatic retries on conflicts)
 * - No stale data (always reads latest value at write time)
 *
 * Shared by session.service.ts, leaderboard.service.ts, and stats.service.ts —
 * deliberately not part of the public `@/features/game/services` barrel.
 */
export async function persistBestScore(
    userId: string,
    displayName: string,
    gameMode: string,
    score: number,
): Promise<void> {
    if (score <= 0) {
        return;
    }

    const now = new Date().toISOString();
    const lbRef = lbDoc(gameMode, userId);
    const statsRef = personalBestDoc(userId, gameMode);

    try {
        // ✅ ATOMIC TRANSACTION: Read-Check-Write in single operation
        await runTransaction(db, async (transaction) => {
            // Read current best score from database
            const statsSnap = await transaction.get(statsRef);
            const currentBest = statsSnap.data()?.bestScore ?? 0;

            // Guard: Only proceed if new score is higher
            if (score <= currentBest) {
                return; // Transaction aborts, no writes
            }

            // Write new best score atomically to both locations
            transaction.set(lbRef, {
                userId,
                displayName: displayName.substring(0, 20),
                score,
                gameMode,
                timestamp: now,
            });

            transaction.set(
                statsRef,
                {
                    bestScore: score,
                    lastUpdated: now,
                },
                { merge: true },
            );
        });
    } catch (error) {
        console.error(`[persistBestScore] Transaction failed for ${gameMode}:`, error);
        throw error;
    }
}
