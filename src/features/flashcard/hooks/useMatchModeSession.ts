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
 *
 * Grid state lives in `useMatchGameStore` (Zustand) so the playing view can
 * subscribe to tile selections without prop-drilling through this hook.
 *
 * Session lifecycle mirrors the engine pattern:
 *   intro → playing → results
 */

"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { generateMatchDistractors } from "@/features/ai/services";
import { useGameSession } from "@/features/game/hooks";
import type { MatchDifficulty } from "@/features/game/modes";
import { calcMatchPoints, calcTimeBonus, comboLabel, DIFFICULTY_CONFIG, WRONG_PENALTY, } from "@/features/game/modes";
import { recordGameResult } from "@/features/game/services";
import { allowAudio, playAudio, playSFX, shuffleArray } from "@/shared/utils";
import { gradeCard } from "../services";
import type { MatchItem } from "../stores";
import { useMatchGameStore } from "../stores";
import { getAudioText } from "../utils";
import type { FlashCard } from "../types";

export type { MatchItem };

type MatchPhase = "intro" | "playing" | "results";

/** Minimum pairs required to form a playable grid. */
const MIN_PAIRS = 4;
/** Maximum pairs to prevent an unmanageably large grid. */
const MAX_PAIRS = 12;

interface UseMatchModeSessionParams {
    cards: FlashCard[];
    gameMode: string;
    bestScore: number;
    userId?: string;
    displayName?: string | null;
    addXP: (amount: number) => Promise<void>;
}

/**
 * Builds the shuffled grid of tiles from a card pool and optional AI distractors.
 *
 * @remarks
 * Each card produces two tiles: primary (-a) and meaning (-b).
 * Distractor labels are deduplicated against occupied values to prevent
 * accidental matches. A guard loop prevents infinite loops on collision.
 *
 * @param pool - Cards selected for this round.
 * @param distractorLabels - AI-generated decoy strings.
 * @returns Shuffled flat array of MatchItem tiles.
 */
function buildGridItems(pool: FlashCard[], distractorLabels: string[]): MatchItem[] {
    const clean = (s: string) => s.split(/[/(,]/)[0].trim();
    const nl = (s: string) => s.trim().toLowerCase();
    const items: MatchItem[] = [];
    const occupied = new Set<string>();

    for (const card of pool) {
        const pairId = card.id;
        const valA = clean(card.primary);
        const valB = clean(card.meaning);
        items.push({ id: `${pairId}-a`, pairId, value: valA, isDistractor: false });
        items.push({ id: `${pairId}-b`, pairId, value: valB, isDistractor: false });
        occupied.add(nl(valA));
        occupied.add(nl(valB));
    }

    for (let i = 0; i < distractorLabels.length; i++) {
        let text = distractorLabels[i]?.trim() ?? "";
        let guard = 0;
        // Fallback to numeric label when text collides with an existing tile value.
        while (guard < 40 && (!text || occupied.has(nl(text)))) {
            text = `${i + 1}${guard ? `(${guard})` : ""}`;
            guard++;
        }
        occupied.add(nl(text));
        const id = `dist-${i}-${Math.random().toString(36).slice(2, 9)}`;
        items.push({ id, value: text, isDistractor: true });
    }

    return shuffleArray(items);
}

/**
 * Match Mode session controller.
 *
 * @remarks
 * Manages the full lifecycle of a pair-matching game session:
 * - Difficulty selection and grid preparation
 * - Countdown timer with lives/timeout end conditions
 * - Pair resolution: scoring, combo popups, SRS grading, audio
 * - Session persistence via useGameSession + recordGameResult
 *
 * Grid tile state (selection, shake, matched) is owned by useMatchGameStore
 * and accessed imperatively via `.getState()` inside callbacks to avoid
 * stale closure issues without adding store state to dependency arrays.
 */
export function useMatchModeSession({
    cards,
    gameMode,
    bestScore,
    userId,
    displayName,
    addXP,
}: UseMatchModeSessionParams) {
    const [phase, setPhase] = useState<MatchPhase>("intro");
    const [difficulty, setDifficulty] = useState<MatchDifficulty>(2);
    const [prepLoading, setPrepLoading] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [timeLeft, setTimeLeft] = useState(-1);
    const [livesLeft, setLivesLeft] = useState(0);
    const [pairCount, setPairCount] = useState(0);
    const [comboPopup, setComboPopup] = useState<{
        id: number;
        text: string;
        bonus: number;
    } | null>(null);

    // Refs that must not trigger re-renders but need to be current in callbacks.
    const comboIdRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const savedRef = useRef(false);
    const finalScoreRef = useRef(0);
    const livesModeRef = useRef(false);

    // scoreRef mirrors score state so the end-game RAF reads the latest value
    // without needing score in its dependency array (which would cause re-registration).
    const scoreRef = useRef(0);

    const config = DIFFICULTY_CONFIG[difficulty];
    const gameCfg = config.game;
    const timeUnlimited = !gameCfg.timePressure;

    const { startSession, syncScore, endSession } = useGameSession({
        userId: userId ?? null,
        userName: displayName ?? "Player",
        gameMode,
        currentBest: bestScore,
    });

    // Stable refs for callbacks passed to async operations — prevents stale closures
    // without triggering engine/session rebuilds on every render.
    const addXPRef = useRef(addXP);
    const endSessionRef = useRef(endSession);
    const syncScoreRef = useRef(syncScore);
    const userIdRef = useRef(userId);
    const displayNameRef = useRef(displayName);
    const gameModeRef = useRef(gameMode);
    const bestScoreRef = useRef(bestScore);

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
        bestScoreRef.current = bestScore;
        scoreRef.current = score;
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
     * Resolves a two-tile selection against the current grid state.
     *
     * @remarks
     * Reads grid state imperatively from the Zustand store to avoid stale
     * closures — the store is the single source of truth for tile state.
     *
     * Match path: award points, update streak/combo, grade card for SRS,
     * play audio, mark pair as matched.
     *
     * Miss path: deduct points, reset streak, shake tiles, decrement lives.
     *
     * @param idA - ID of the first selected tile.
     * @param idB - ID of the second selected tile.
     */
    const resolveTwo = useCallback(
        (idA: string, idB: string) => {
            const store = useMatchGameStore.getState();
            const a = store.grid.find((c) => c.id === idA);
            const b = store.grid.find((c) => c.id === idB);

            if (!a || !b) {
                store.setProcessing(false);
                return;
            }

            const isMatch =
                !a.isDistractor && !b.isDistractor && a.pairId != null && a.pairId === b.pairId;

            if (isMatch) {
                playSFX("correct");

                setStreak((prev) => {
                    const newStreak = prev + 1;
                    const points = calcMatchPoints(newStreak);

                    setScore((s) => {
                        const next = s + points;
                        syncScoreRef.current(next);
                        return next;
                    });

                    setMaxStreak((m) => Math.max(m, newStreak));

                    const label = comboLabel(newStreak);
                    if (label) {
                        const popupId = ++comboIdRef.current;
                        setComboPopup({ id: popupId, text: label, bonus: points - 100 });
                        setTimeout(() => {
                            setComboPopup((cur) => (cur?.id === popupId ? null : cur));
                        }, 1400);
                    }

                    return newStreak;
                });

                useMatchGameStore.getState().addMatchedPairId(a.pairId!);

                // SRS grading + audio — fire-and-forget, must not block UI.
                const uid = userIdRef.current;
                if (uid && a.pairId) {
                    const card = cards.find((c) => c.id === a.pairId);
                    if (card) {
                        void gradeCard(uid, a.pairId, card, "Good").catch(() => {});

                        if (allowAudio("match", "feedback")) {
                            // Delay so the "ting" SFX is heard before pronunciation.
                            setTimeout(() => playAudio(getAudioText(card)), 300);
                        }
                    }
                }

                setTimeout(() => useMatchGameStore.getState().setProcessing(false), 400);
                return;
            }

            // Wrong match — penalise score, shake tiles, decrement lives if active.
            playSFX("wrong");
            setStreak(0);
            setWrongAttempts((prev) => prev + 1);
            setScore((prev) => {
                const next = Math.max(0, prev - WRONG_PENALTY);
                syncScoreRef.current(next);
                return next;
            });

            if (livesModeRef.current) {
                setLivesLeft((l) => Math.max(0, l - 1));
            }

            useMatchGameStore.getState().setShake([idA, idB]);
            setTimeout(() => {
                useMatchGameStore.getState().clearShake();
                useMatchGameStore.getState().setSelected([]);
                useMatchGameStore.getState().setProcessing(false);
            }, 720);
        },
        [cards],
    );

    /**
     * Handles a tile tap from the playing view.
     *
     * @remarks
     * First tap selects the tile. Second tap on a different tile triggers
     * pair resolution after a 120ms delay (allows selection animation to render).
     * Tapping the same tile twice deselects it.
     *
     * @param id - ID of the tapped tile.
     */
    const onCellTap = useCallback(
        (id: string) => {
            const current = useMatchGameStore.getState();
            if (current.processing) return;

            const tile = current.grid.find((x) => x.id === id);
            if (!tile) return;

            // Skip already-matched real pairs.
            if (
                !tile.isDistractor &&
                tile.pairId != null &&
                current.matchedPairIds.includes(tile.pairId)
            ) {
                return;
            }

            if (current.selectedIds.length === 0) {
                playSFX("click");
                current.setSelected([id]);
                return;
            }

            if (current.selectedIds.length === 1) {
                const first = current.selectedIds[0];
                if (first === id) {
                    current.setSelected([]);
                    return;
                }
                playSFX("click");
                current.setSelected([first, id]);
                current.setProcessing(true);
                setTimeout(() => resolveTwo(first, id), 120);
            }
        },
        [resolveTwo],
    );

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
            setScore(0);
            setStreak(0);
            setMaxStreak(0);
            setWrongAttempts(0);
            setComboPopup(null);
            setTimeLeft(gameCfg.timePressure ? config.timeLimit : -1);
            void startSession();
        } finally {
            setPrepLoading(false);
        }
    }, [cards, config, gameCfg.timePressure, startSession]);

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
    }, [phase, matchedLen, timeLeft, gameCfg.timePressure, livesLeft, pairCount]);

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
        void addXPRef.current(Math.round(finalScore / 10));
        void endSessionRef.current(finalScore);

        const uid = userIdRef.current;
        if (uid) {
            void recordGameResult(
                uid,
                displayNameRef.current ?? "Player",
                gameModeRef.current,
                finalScore,
                bestScoreRef.current,
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
