"use client";

import { useEffect, useRef } from "react";

import { scoreToTier } from "@/features/game";

import type { User } from "firebase/auth";

interface UseGameCompletionLoggerParams {
    /** Current session phase — logging fires the first time this reaches "results". */
    phase: string;
    score: number;
    user: User | null;
    lessonId: string;
    lessonTitle: string;
    logFn: (
        idToken: string,
        userId: string,
        deckId: string,
        deckTitle: string,
        stats: { score: number; timeMs: number; tier: string },
    ) => Promise<unknown>;
}

/**
 * Logs a game-completion analytics event once, the first time `phase` reaches
 * "results". Shared by MatchGame and SpeedGame, which previously each hand-rolled
 * an identical `loggedRef` + effect for this.
 */
export function useGameCompletionLogger({
    phase,
    score,
    user,
    lessonId,
    lessonTitle,
    logFn,
}: UseGameCompletionLoggerParams) {
    const loggedRef = useRef(false);
    useEffect(() => {
        if (phase !== "results" || loggedRef.current || !user) return;
        loggedRef.current = true;
        void (async () => {
            try {
                const token = await user.getIdToken();
                const finalTier = scoreToTier(score);
                void logFn(token, user.uid, lessonId, lessonTitle, {
                    score,
                    timeMs: 0,
                    tier: finalTier,
                });
            } catch {
                // Non-blocking
            }
        })();
    }, [phase, score, user, lessonId, lessonTitle, logFn]);
}
