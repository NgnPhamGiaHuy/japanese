import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { persistBestScore } from "./persist-best-score";

/** /artifacts/{APP_ID}/public/data/game_sessions */
const sessionsCol = () => collection(db, "artifacts", APP_ID, "public", "data", "game_sessions");

/**
 * Creates a new game session in Firestore and returns its auto-generated ID.
 * Call once when the user clicks "Start".
 */
export const createGameSession = async (
    userId: string,
    userName: string,
    gameMode: string,
): Promise<string> => {
    const ref = await addDoc(sessionsCol(), {
        userId,
        userName: userName.substring(0, 20),
        gameMode,
        score: 0,
        status: "playing",
        updatedAt: serverTimestamp(),
    });
    return ref.id;
};

/**
 * Debounce-friendly score updater — call this during gameplay.
 * Does NOT check for best; just stamps the live score.
 */
export const updateGameScore = async (sessionId: string, score: number): Promise<void> => {
    try {
        await updateDoc(doc(sessionsCol(), sessionId), {
            score,
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        // Session doc may not exist yet on a very fast first write — swallow silently
        console.warn("[GameService] updateGameScore skipped:", err);
    }
};

/**
 * Marks a session as finished and flushes the final score to both the public
 * leaderboard and the user's personal best (only if `finalScore` is a new high).
 */
export const finishGameSession = async (
    sessionId: string,
    finalScore: number,
    userId: string,
    displayName: string,
    gameMode: string,
): Promise<void> => {
    try {
        await updateDoc(doc(sessionsCol(), sessionId), {
            score: finalScore,
            status: "finished",
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn("[GameService] finishGameSession session update skipped:", err);
    }

    // ✅ No longer passes currentBest - fetched atomically inside
    await persistBestScore(userId, displayName, gameMode, finalScore);
};
