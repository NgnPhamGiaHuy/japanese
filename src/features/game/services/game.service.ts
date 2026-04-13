import {
    addDoc,
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";

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
    /** The caller's current known best — skip write if score doesn't beat it */
    currentBest?: number;
}

// ─── Game Sessions ────────────────────────────────────────────────────────────

/**
 * Creates a new game session in Firestore and returns its auto-generated ID.
 * Called once when the user clicks "Start".
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
        // Session doc may not exist yet on very first write race — swallow silently
        console.warn("[GameService] updateGameScore skipped:", err);
    }
};

/**
 * Marks a session as finished and flushes the final score to both
 * the public leaderboard and personal best atomically.
 */
export const finishGameSession = async (
    sessionId: string,
    finalScore: number,
    userId: string,
    displayName: string,
    gameMode: string,
    currentBest: number = 0,
): Promise<void> => {
    // Mark session finished
    try {
        await updateDoc(doc(sessionsCol(), sessionId), {
            score: finalScore,
            status: "finished",
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn("[GameService] finishGameSession session update skipped:", err);
    }

    // Only promote to leaderboard / personal best if it's a new high score
    if (finalScore <= 0 || finalScore <= currentBest) return;

    const now = new Date().toISOString();

    await setDoc(lbDoc(gameMode, userId), {
        userId,
        displayName: displayName.substring(0, 20),
        score: finalScore,
        gameMode,
        timestamp: now,
    });

    await setDoc(
        personalBestDoc(userId, gameMode),
        { bestScore: finalScore, lastUpdated: now },
        { merge: true },
    );
};

// ─── Leaderboard ──────────────────────────────────────────────────────────────

/**
 * Real-time subscription to the top-N leaderboard (personal-best table).
 * Uses onSnapshot — never getDocs.
 */
export const subscribeLeaderboard = (
    gameMode: string,
    topN: number,
    onUpdate: (entries: LeaderboardEntry[]) => void,
    onError?: (err: Error) => void,
): (() => void) => {
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
 * Real-time subscription to active game sessions for a given mode.
 * Useful for showing "live" players during gameplay (future feature).
 */
export const subscribeActiveSessions = (
    gameMode: string,
    onUpdate: (sessions: GameSession[]) => void,
): (() => void) => {
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

// ─── Legacy compat ────────────────────────────────────────────────────────────

/**
 * @deprecated Use finishGameSession() for new code.
 * Kept so that existing callsites don't break during migration.
 */
export const saveGameResult = async ({
    userId,
    displayName,
    gameMode,
    score,
    currentBest = 0,
}: GameResultInput): Promise<void> => {
    if (score <= 0 || score <= currentBest) return;
    const now = new Date().toISOString();

    await setDoc(
        personalBestDoc(userId, gameMode),
        { bestScore: score, lastUpdated: now },
        { merge: true },
    );

    await setDoc(lbDoc(gameMode, userId), {
        userId,
        displayName: displayName.substring(0, 20),
        score,
        gameMode,
        timestamp: now,
    });
};

export const subscribeTopScores = subscribeLeaderboard;
