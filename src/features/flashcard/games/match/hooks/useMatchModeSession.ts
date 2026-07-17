/**
 * Match Mode session hook using unified game engine infrastructure.
 *
 * @remarks
 * Match Mode uses a visible tile-grid mechanic (tap A → tap B → resolve pair)
 * that is fundamentally different from the Q&A loop driven by GameEngine.
 * This hook therefore does NOT use GameEngine directly. Instead it consumes:
 *
 * - `useGameSession` — Firestore session lifecycle (start, sync, end)
 * - `recordGameResult` — leaderboard persistence
 * - `DIFFICULTY_CONFIG` / scoring helpers — from the shared modes config
 * - `useMatchScoring` (E11-T4 split) — pair resolution, score/streak/combo
 *   state, and tap handling
 * - `buildGridItems` (matchGrid.ts, E11-T4 split) — pure grid setup
 *
 * Grid state lives in `useMatchGameStore` (Zustand) so the playing view can
 * subscribe to tile selections without prop-drilling through this hook.
 *
 * Session lifecycle mirrors the engine pattern:
 *   intro → playing → results
 */

"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { generateMatchDistractors } from "@/features/ai/services/gemini.service";
import { calcTimeBonus, DIFFICULTY_CONFIG } from "@/features/flashcard/games/match/config";
import { useGameSession } from "@/features/game/hooks";
import { recordGameResult } from "@/features/game/services";
import { shuffleArray } from "@/shared/utils";
import { buildGridItems } from "./matchGrid";
import { useMatchScoring } from "./useMatchScoring";
import { useMatchGameStore } from "../../../hooks";

import type { MatchDifficulty } from "@/features/flashcard/games/match/config";
import type { FlashCard } from "../../../types";

type MatchPhase = "intro" | "playing" | "results";

/** Minimum pairs required to form a playable grid. */
const MIN_PAIRS = 4;
/** Maximum pairs to prevent an unmanageably large grid. */
const MAX_PAIRS = 12;

interface UseMatchModeSessionParams {
    cards: FlashCard[];
    gameMode: string;
    userId?: string;
    displayName?: string | null;
    addXP: (amount: number) => Promise<void>;
}

/**
 * Match Mode session controller.
 *
 * @remarks
 * Manages the full lifecycle of a pair-matching game session:
 * - Difficulty selection and grid preparation
 * - Countdown timer with lives/timeout end conditions
 * - Pair resolution, scoring, and tap handling (delegated to useMatchScoring)
 * - Session persistence via useGameSession + recordGameResult
 *
 * Grid tile state (selection, shake, matched) is owned by useMatchGameStore
 * and accessed imperatively via `.getState()` inside callbacks to avoid
 * stale closure issues without adding store state to dependency arrays.
 */
export function useMatchModeSession({
    cards,
    gameMode,
    userId,
    displayName,
    addXP,
}: UseMatchModeSessionParams) {
    const tCommon = useTranslations("Common");
    const [phase, setPhase] = useState<MatchPhase>("intro");
    const [difficulty, setDifficulty] = useState<MatchDifficulty>(2);
    const [prepLoading, setPrepLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(-1);
    const [livesLeft, setLivesLeft] = useState(0);
    const [pairCount, setPairCount] = useState(0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const savedRef = useRef(false);
    const finalScoreRef = useRef(0);
    const livesModeRef = useRef(false);

    const config = DIFFICULTY_CONFIG[difficulty];
    const gameCfg = config.game;
    const timeUnlimited = !gameCfg.timePressure;

    const { startSession, syncScore, endSession } = useGameSession({
        userId: userId ?? null,
        userName: displayName ?? tCommon("player"),
        gameMode,
    });

    // Stable refs for callbacks passed to async operations — prevents stale closures
    // without triggering engine/session rebuilds on every render.
    const addXPRef = useRef(addXP);
    const endSessionRef = useRef(endSession);
    const syncScoreRef = useRef(syncScore);
    const userIdRef = useRef(userId);
    const displayNameRef = useRef(displayName);
    const gameModeRef = useRef(gameMode);

    /**
     * Keeps all callback refs current after every render.
     *
     * @remarks
     * useLayoutEffect runs synchronously before the browser paints, ensuring
     * refs are fresh before any subsequent effect or event handler reads them.
     * This satisfies react-hooks/refs without triggering unnecessary rebuilds.
     */
    useLayoutEffect(() => {
        addXPRef.current = addXP;
        endSessionRef.current = endSession;
        syncScoreRef.current = syncScore;
        userIdRef.current = userId;
        displayNameRef.current = displayName;
        gameModeRef.current = gameMode;
    });

    const {
        score,
        setScore,
        streak,
        maxStreak,
        wrongAttempts,
        comboPopup,
        scoreRef,
        resetScoring,
        onCellTap,
    } = useMatchScoring({
        cards,
        userIdRef,
        syncScoreRef,
        livesModeRef,
        setLivesLeft,
    });

    /**
     * Countdown timer — runs only when time-pressure mode is active.
     *
     * @remarks
     * Clears itself when time reaches 1 to avoid an extra tick to -1.
     * The end-game effect observes `timeLeft === 0` to trigger results.
     */
    useEffect(() => {
        if (phase !== "playing" || timeUnlimited) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase, timeUnlimited]);

    /**
     * Prepares and starts a new game round.
     *
     * @remarks
     * Clamps pair count to [MIN_PAIRS, MAX_PAIRS] and the available card count.
     * Fetches AI distractors when the difficulty config requests them — falls back
     * silently on failure so the game always starts.
     *
     * Grid is initialised in the Zustand store before phase transitions to
     * "playing" so the view renders a complete grid on first paint.
     */
    const startGame = useCallback(async () => {
        const clampedPairs = Math.min(
            Math.max(Math.min(config.pairs, cards.length), MIN_PAIRS),
            MAX_PAIRS,
        );
        if (clampedPairs < 1) return;

        setPrepLoading(true);
        savedRef.current = false;
        finalScoreRef.current = 0;

        try {
            const pool = shuffleArray(cards).slice(0, clampedPairs);
            setPairCount(pool.length);
            livesModeRef.current = config.lives > 0;
            setLivesLeft(livesModeRef.current ? config.lives : 0);

            let distractorLabels: string[] = [];
            if (config.distractorTiles > 0) {
                try {
                    distractorLabels = await generateMatchDistractors(pool, config.distractorTiles);
                } catch {
                    console.warn("[MatchMode] Distractor generation failed, using fallback.");
                }
            }

            useMatchGameStore.getState().initGrid(buildGridItems(pool, distractorLabels));

            setPhase("playing");
            resetScoring();
            setTimeLeft(gameCfg.timePressure ? config.timeLimit : -1);
            void startSession();
        } finally {
            setPrepLoading(false);
        }
    }, [cards, config, gameCfg.timePressure, startSession, resetScoring]);

    const matchedLen = useMatchGameStore((s) => s.matchedPairIds.length);

    /**
     * Detects end-game conditions and transitions to results.
     *
     * @remarks
     * Three conditions end the game:
     * - All pairs matched (cleared)
     * - Timer reached zero (timedOut)
     * - All lives lost (dead)
     *
     * Uses requestAnimationFrame to batch the final score write and phase
     * transition into the same paint cycle, preventing a flash of stale score.
     */
    useEffect(() => {
        if (phase !== "playing") return;

        const cleared = pairCount > 0 && matchedLen >= pairCount;
        const timedOut = gameCfg.timePressure && timeLeft === 0;
        const dead = livesModeRef.current && livesLeft <= 0;

        if (!cleared && !timedOut && !dead) return;

        if (timerRef.current) clearInterval(timerRef.current);

        const bonus = cleared && gameCfg.timePressure ? calcTimeBonus(Math.max(0, timeLeft)) : 0;

        const raf = requestAnimationFrame(() => {
            const finalScore = scoreRef.current + bonus;
            finalScoreRef.current = finalScore;
            setScore(finalScore);
            setPhase("results");
        });

        return () => cancelAnimationFrame(raf);
    }, [
        phase,
        matchedLen,
        timeLeft,
        gameCfg.timePressure,
        livesLeft,
        pairCount,
        scoreRef,
        setScore,
    ]);

    /**
     * Persists session results when the results phase is entered.
     *
     * @remarks
     * `savedRef` guards against double-firing if the effect re-runs.
     * All async calls are fire-and-forget — results phase must not be blocked
     * by network latency.
     */
    useEffect(() => {
        if (phase !== "results" || savedRef.current) return;
        savedRef.current = true;

        const finalScore = finalScoreRef.current;
        void addXPRef.current(finalScore);

        void endSessionRef.current(finalScore);

        const uid = userIdRef.current;
        if (uid) {
            void recordGameResult(
                uid,
                displayNameRef.current ?? tCommon("player"),
                gameModeRef.current,
                finalScore,
            );
        }
    }, [phase]);

    const resetToIntro = useCallback(() => setPhase("intro"), []);

    const closeSession = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const progress = useMemo(() => {
        if (pairCount === 0) return 0;
        return (matchedLen / pairCount) * 100;
    }, [matchedLen, pairCount]);

    return {
        phase,
        setPhase,
        difficulty,
        setDifficulty,
        config,
        prepLoading,
        score,
        streak,
        maxStreak,
        wrongAttempts,
        timeLeft,
        timeUnlimited,
        livesLeft,
        livesTotal: config.lives,
        showLives: config.lives > 0,
        pairCount,
        matchedPairs: matchedLen,
        comboPopup,
        progress,
        startGame,
        onCellTap,
        resetToIntro,
        closeSession,
    };
}
