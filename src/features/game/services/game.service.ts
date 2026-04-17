import {
    addDoc,
    collection,
    doc,
    getDoc,
    increment,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";

import { scoreToTier } from "@/features/game/logic";
import { APP_ID, db } from "@/lib/firebase";

import type { Unsubscribe } from "firebase/firestore";
import type { Tier } from "@/features/game/logic";

// ─── Collection helpers ───────────────────────────────────────────────────────

/** /artifacts/{APP_ID}/public/data/game_sessions */
const sessionsCol = () => collection(db, "artifacts", APP_ID, "public", "data", "game_sessions");

/** /artifacts/{APP_ID}/public/data/leaderboard_{mode}/{userId} */
const lbDoc = (gameMode: string, userId: string) =>
    doc(db, "artifacts", APP_ID, "public", "data", `leaderboard_${gameMode}`, userId);

/** /artifacts/{APP_ID}/users/{uid}/stats/{gameMode} */
const personalBestDoc = (userId: string, gameMode: string) =>
    doc(db, "artifacts", APP_ID, "users", userId, "stats", gameMode);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    score: number;
    gameMode: string;
    timestamp: string;
}

export interface GameSession {
    id: string;
    userId: string;
    userName: string;
    gameMode: string;
    score: number;
    status: "playing" | "finished";
    updatedAt: Date | null;
}

export interface GameResultInput {
    userId: string;
    displayName: string;
    gameMode: string;
    score: number;
    currentBest?: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

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
 * Private — consumed by `finishGameSession`, `submitScore`, and `recordGameResult`.
 */
async function persistBestScore(
    userId: string,
    displayName: string,
    gameMode: string,
    score: number,
): Promise<void> {
    if (score <= 0) {
        console.log(`[persistBestScore] Invalid score ${score}, skipping`);
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
                console.log(
                    `[persistBestScore] Score ${score} <= current best ${currentBest} for ${gameMode}, skipping`,
                );
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
                    tier: scoreToTier(score),
                    lastUpdated: now,
                },
                { merge: true },
            );

            console.log(
                `[persistBestScore] ✅ New best for ${gameMode}: ${score} (previous: ${currentBest})`,
            );
        });
    } catch (error) {
        console.error(`[persistBestScore] Transaction failed for ${gameMode}:`, error);
        throw error;
    }
}

// ─── Game Sessions ────────────────────────────────────────────────────────────

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
 *
 * @remarks
 * The `currentBest` parameter is now IGNORED - the function fetches the latest
 * value from the database atomically to prevent race conditions.
 */
export const finishGameSession = async (
    sessionId: string,
    finalScore: number,
    userId: string,
    displayName: string,
    gameMode: string,
    currentBest: number = 0, // ⚠️ DEPRECATED: Kept for backward compatibility, not used
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

/**
 * Standalone score submission — use when there is no managed session
 * (e.g. a short one-shot game that skips the full session lifecycle).
 *
 * Promotes the score to the leaderboard and personal best if it is a new high.
 *
 * @remarks
 * The `currentBest` parameter is now IGNORED - the function fetches the latest
 * value from the database atomically to prevent race conditions.
 */
export const submitScore = async ({
    userId,
    displayName,
    gameMode,
    score,
    currentBest = 0, // ⚠️ DEPRECATED: Kept for backward compatibility, not used
}: GameResultInput): Promise<void> => {
    // ✅ No longer passes currentBest - fetched atomically inside
    await persistBestScore(userId, displayName, gameMode, score);
};

// ─── Leaderboard ──────────────────────────────────────────────────────────────

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

// ─── Extended game stats ──────────────────────────────────────────────────────

export interface GameStatEntry {
    bestScore: number;
    tier: Tier;
    totalGames: number;
    lastPlayedAt: string | null;
}

/**
 * Records a completed game.
 *  - Always increments `totalGames` and stamps `lastPlayedAt`.
 *  - Promotes `bestScore` + `tier` on the leaderboard iff `score` is a new high.
 *
 * @remarks
 * The `currentBest` parameter is now IGNORED - the function fetches the latest
 * value from the database atomically to prevent race conditions.
 */
export const recordGameResult = async (
    userId: string,
    displayName: string,
    gameMode: string,
    score: number,
    currentBest: number = 0, // ⚠️ DEPRECATED: Kept for backward compatibility, not used
): Promise<void> => {
    const now = new Date().toISOString();

    // Always track play count and last-played timestamp
    await setDoc(
        personalBestDoc(userId, gameMode),
        { totalGames: increment(1), lastPlayedAt: now },
        { merge: true },
    );

    // ✅ No longer passes currentBest - fetched atomically inside
    await persistBestScore(userId, displayName, gameMode, score);
};

/**
 * Real-time subscription to full game stats for every mode a user has played.
 * Returns a map of gameMode → { bestScore, tier, totalGames, lastPlayedAt }.
 */
export const subscribeGameStats = (
    userId: string,
    onUpdate: (stats: Record<string, GameStatEntry>) => void,
): Unsubscribe => {
    const ref = collection(db, "artifacts", APP_ID, "users", userId, "stats");
    return onSnapshot(ref, (snap) => {
        const stats: Record<string, GameStatEntry> = {};
        snap.forEach((d) => {
            const data = d.data();
            const best = (data.bestScore as number) ?? 0;
            stats[d.id] = {
                bestScore: best,
                tier: (data.tier as Tier | undefined) ?? scoreToTier(best),
                totalGames: (data.totalGames as number) ?? 0,
                lastPlayedAt: (data.lastPlayedAt as string | null) ?? null,
            };
        });
        onUpdate(stats);
    });
};

/**
 * Real-time subscription to active game sessions for a given mode.
 * Useful for showing "live" players during gameplay.
 */
export const subscribeActiveSessions = (
    gameMode: string,
    onUpdate: (sessions: GameSession[]) => void,
): Unsubscribe => {
    const q = query(
        sessionsCol(),
        where("gameMode", "==", gameMode),
        where("status", "==", "playing"),
        orderBy("score", "desc"),
        limit(10),
    );

    return onSnapshot(q, (snap) => {
        const sessions: GameSession[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<GameSession, "id">),
            updatedAt: d.data().updatedAt?.toDate() ?? null,
        }));
        onUpdate(sessions);
    });
};
