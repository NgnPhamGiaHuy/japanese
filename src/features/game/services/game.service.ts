import { collection, doc, limit, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";

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
    /** The caller's current known best — skip write if score doesn't beat it */
    currentBest?: number;
}

/**
 * Persist a game result.
 *
 * Writes to two locations:
 *  - users/{uid}/stats/{gameMode}        — personal best (private)
 *  - public/data/leaderboard_{gameMode}/{userId}  — one entry per user (public)
 *
 * Both writes only happen when the new score beats the known best.
 */
export async function saveGameResult({
    userId,
    displayName,
    gameMode,
    score,
    currentBest = 0,
}: GameResultInput): Promise<void> {
    if (score <= 0) return;
    if (score <= currentBest) return;

    const now = new Date().toISOString();

    await setDoc(
        doc(db, "artifacts", APP_ID, "users", userId, "stats", gameMode),
        { bestScore: score, lastUpdated: now },
        { merge: true },
    );

    await setDoc(
        doc(db, "artifacts", APP_ID, "public", "data", `leaderboard_${gameMode}`, userId),
        {
            userId,
            displayName: displayName.substring(0, 20),
            score,
            gameMode,
            timestamp: now,
        },
    );
}

/**
 * Subscribe to the top-N leaderboard for a given game mode.
 * Returns an `Unsubscribe` function.
 */
export function subscribeLeaderboard(
    gameMode: string,
    topN: number,
    onUpdate: (entries: LeaderboardEntry[]) => void,
    onError?: (err: Error) => void,
): () => void {
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
            console.error("[GameService] Leaderboard error:", err);
            onError?.(err);
        },
    );
}
