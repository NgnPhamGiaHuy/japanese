import {
    addDoc,
    collection,
    doc,
    increment,
    limit,
    onSnapshot,
    orderBy,
    query,
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
 * Writes the final score to the public leaderboard and the user's personal
 * best if (and only if) `score` beats `currentBest`.
 *
 * Private — consumed by `finishGameSession` and `submitScore`.
 */
async function persistBestScore(
    userId: string,
    displayName: string,
    gameMode: string,
    score: number,
    currentBest: number,
): Promise<void> {
    if (score <= 0 || score <= currentBest) return;

    const now = new Date().toISOString();

    await setDoc(lbDoc(gameMode, userId), {
        userId,
        displayName: displayName.substring(0, 20),
        score,
        gameMode,
        timestamp: now,
    });

    await setDoc(
        personalBestDoc(userId, gameMode),
        { bestScore: score, tier: scoreToTier(score), lastUpdated: now },
        { merge: true },
    );
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
 */
export const finishGameSession = async (
    sessionId: string,
    finalScore: number,
    userId: string,
    displayName: string,
    gameMode: string,
    currentBest: number = 0,
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

    await persistBestScore(userId, displayName, gameMode, finalScore, currentBest);
};

/**
 * Standalone score submission — use when there is no managed session
 * (e.g. a short one-shot game that skips the full session lifecycle).
 *
 * Promotes the score to the leaderboard and personal best if it is a new high.
 */
export const submitScore = async ({
    userId,
    displayName,
    gameMode,
    score,
    currentBest = 0,
}: GameResultInput): Promise<void> => {
    await persistBestScore(userId, displayName, gameMode, score, currentBest);
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
 */
export const recordGameResult = async (
    userId: string,
    displayName: string,
    gameMode: string,
    score: number,
    currentBest: number = 0,
): Promise<void> => {
    const now = new Date().toISOString();

    // Always track play count and last-played timestamp
    await setDoc(
        personalBestDoc(userId, gameMode),
        { totalGames: increment(1), lastPlayedAt: now },
        { merge: true },
    );

    // Conditionally update best score + leaderboard
    await persistBestScore(userId, displayName, gameMode, score, currentBest);
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
