import { collection, onSnapshot } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { persistBestScore } from "./persist-best-score";

import type { Unsubscribe } from "firebase/firestore";

export interface GameStatEntry {
    bestScore: number;
}

/**
 * Real-time subscription to a user's personal best scores across all game modes.
 */
export const subscribePersonalBests = (
    userId: string,
    onUpdate: (scores: Record<string, number>) => void,
): Unsubscribe => {
    const ref = collection(db, "artifacts", APP_ID, "users", userId, "stats");
    return onSnapshot(ref, (snap) => {
        const scores: Record<string, number> = {};
        snap.forEach((d) => {
            scores[d.id] = (d.data().bestScore as number) ?? 0;
        });
        onUpdate(scores);
    });
};

/**
 * Records a completed game, promoting `bestScore` on the leaderboard iff
 * `score` is a new high.
 */
export const recordGameResult = async (
    userId: string,
    displayName: string,
    gameMode: string,
    score: number,
): Promise<void> => {
    await persistBestScore(userId, displayName, gameMode, score);
};

/**
 * Real-time subscription to full game stats for every mode a user has played.
 * Returns a map of gameMode → { bestScore }.
 */
export const subscribeGameStats = (
    userId: string,
    onUpdate: (stats: Record<string, GameStatEntry>) => void,
): Unsubscribe => {
    const ref = collection(db, "artifacts", APP_ID, "users", userId, "stats");
    return onSnapshot(ref, (snap) => {
        const stats: Record<string, GameStatEntry> = {};
        snap.forEach((d) => {
            stats[d.id] = { bestScore: (d.data().bestScore as number) ?? 0 };
        });
        onUpdate(stats);
    });
};
