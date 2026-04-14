"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createGameSession, finishGameSession, updateGameScore } from "@/features/game/services";

export interface UseGameSessionOptions {
    userId: string | null;
    userName: string;
    gameMode: string | null;
    currentBest?: number;
}

/**
 * Manages a single Firestore game session lifecycle:
 *   start → live score updates (debounced) → finish
 *
 * This is the single source of truth for session identity.
 * Score state remains local for instant UI responsiveness;
 * Firestore is written to asynchronously via debounce.
 */
export function useGameSession({
    userId,
    userName,
    gameMode,
    currentBest = 0,
}: UseGameSessionOptions) {
    const sessionIdRef = useRef<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSyncedScore = useRef(0);
    const [isSessionActive, setIsSessionActive] = useState(false);

    // Cleanup on unmount — finish any orphaned session
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    /**
     * Call this when the game loop starts.
     * Creates a Firestore session document and stores the ID.
     */
    const startSession = useCallback(async () => {
        if (!userId || !gameMode) return;
        try {
            const id = await createGameSession(userId, userName || "Player", gameMode);
            sessionIdRef.current = id;
            lastSyncedScore.current = 0;
            setIsSessionActive(true);
        } catch (err) {
            console.error("[useGameSession] Failed to create session:", err);
        }
    }, [userId, userName, gameMode]);

    /**
     * Debounced score push — call this on every score change.
     * 500 ms window so we don't flood Firestore on rapid answers.
     */
    const syncScore = useCallback((score: number) => {
        if (!sessionIdRef.current) return;
        if (score <= lastSyncedScore.current) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            if (!sessionIdRef.current) return;
            try {
                await updateGameScore(sessionIdRef.current, score);
                lastSyncedScore.current = score;
            } catch (err) {
                console.error("[useGameSession] Score sync failed:", err);
            }
        }, 500);
    }, []);

    /**
     * Call when the game ends.
     * Flushes the final score and promotes to leaderboard if it's a new best.
     */
    const endSession = useCallback(
        async (finalScore: number) => {
            if (!userId || !gameMode) return;

            // Cancel any pending debounce — we're flushing immediately
            if (debounceRef.current) clearTimeout(debounceRef.current);

            setIsSessionActive(false);

            try {
                await finishGameSession(
                    sessionIdRef.current ?? "orphan",
                    finalScore,
                    userId,
                    userName || "Player",
                    gameMode,
                    currentBest,
                );
            } catch (err) {
                console.error("[useGameSession] Failed to finish session:", err);
            } finally {
                sessionIdRef.current = null;
                lastSyncedScore.current = 0;
            }
        },
        [userId, userName, gameMode, currentBest],
    );

    return { startSession, syncScore, endSession, isSessionActive };
}
