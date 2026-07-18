import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { persistBestScore } from "./persist-best-score";

import type { Unsubscribe } from "firebase/firestore";

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    score: number;
    gameMode: string;
    timestamp: string;
}

export interface GameResultInput {
    userId: string;
    displayName: string;
    gameMode: string;
    score: number;
}

/**
 * Real-time subscription to the top-N leaderboard for a game mode.
 * Uses `onSnapshot` — never `getDocs`.
 */
export const subscribeLeaderboard = (
    gameMode: string,
    topN: number,
    onUpdate: (entries: LeaderboardEntry[]) => void,
    onError?: (err: Error) => void,
): Unsubscribe => {
    const ref = collection(db, "artifacts", APP_ID, "public", "data", `leaderboard_${gameMode}`);
    const q = query(ref, orderBy("score", "desc"), limit(topN));

    return onSnapshot(
        q,
        (snap) => {
            const entries: LeaderboardEntry[] = snap.docs.map((d) => ({
                userId: d.id,
                ...(d.data() as Omit<LeaderboardEntry, "userId">),
            }));
            onUpdate(entries);
        },
        (err) => {
            console.error("[GameService] Leaderboard snapshot error:", err);
            onError?.(err);
        },
    );
};

/**
 * Standalone score submission — use when there is no managed session.
 * Promotes the score to the leaderboard and personal best if it is a new high.
 */
export const submitScore = async ({
    userId,
    displayName,
    gameMode,
    score,
}: GameResultInput): Promise<void> => {
    await persistBestScore(userId, displayName, gameMode, score);
};
