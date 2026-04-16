"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { generateMatchDistractors } from "@/features/ai/services/gemini.service";
import { useGameSession } from "@/features/game/hooks";
import {
    calcMatchPoints,
    calcTimeBonus,
    comboLabel,
    DIFFICULTY_CONFIG,
    WRONG_PENALTY,
} from "@/features/game/modes";
import { recordGameResult } from "@/features/game/services";
import { allowAudio, playAudio, shuffleArray } from "@/shared/utils";
import { gradeCard } from "../services/card.service";
import { useMatchGameStore } from "../stores/useMatchGameStore";
import {
    buildQuestionFallback,
    chooseMatchQuestionTypeForCard,
    getAudioText,
    pickFixedRoundQuestionType,
} from "../utils";

import type { MatchDifficulty } from "@/features/game/modes";
import type { Grade } from "../services/card.service";
import type { MatchItem } from "../stores/useMatchGameStore";
import type { FlashCard } from "../types";
import type { QuestionType } from "../utils";

type MatchPhase = "intro" | "playing" | "results";

export type { MatchItem };

/** Minimum and maximum card pairs per round (Requirement 7.6) */
const MIN_PAIRS = 4;
const MAX_PAIRS = 12;

function buildGridItems(
    pool: FlashCard[],
    difficulty: MatchDifficulty,
    fixedRoundType: QuestionType,
    distractorLabels: string[],
): MatchItem[] {
    const nl = (s: string) => s.trim().toLowerCase();
    const gameCfg = DIFFICULTY_CONFIG[difficulty].game;
    const items: MatchItem[] = [];
    const occupied = new Set<string>();

    for (const card of pool) {
        const qType = chooseMatchQuestionTypeForCard(
            card,
            gameCfg.pairType,
            fixedRoundType,
            difficulty,
            true,
        );
        const pair = buildQuestionFallback(card, qType);
        const pairId = card.id;
        const a = `${pairId}-a`;
        const b = `${pairId}-b`;
        // Stimulus tile shows prompt (primary), answer tile shows answer (meaning)
        items.push({ id: a, pairId, value: pair.prompt, isDistractor: false });
        items.push({ id: b, pairId, value: pair.answer, isDistractor: false });
        occupied.add(nl(pair.prompt));
        occupied.add(nl(pair.answer));
    }

    for (let i = 0; i < distractorLabels.length; i++) {
        let text = distractorLabels[i]?.trim() ?? "";
        let guard = 0;
        while (guard < 40 && (!text || occupied.has(nl(text)))) {
            text = `·${i + 1}${guard ? `(${guard})` : ""}`;
            guard++;
        }
        occupied.add(nl(text));
        const id = `dist-${i}-${Math.random().toString(36).slice(2, 9)}`;
        items.push({ id, value: text, isDistractor: true });
    }

    return shuffleArray(items);
}

interface UseMatchModeSessionParams {
    cards: FlashCard[];
    gameMode: string;
    bestScore: number;
    userId?: string;
    displayName?: string | null;
    addXP: (amount: number) => Promise<void>;
}

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

    // ── Stimulus-first reveal state (Requirement 7.1, 7.2) ──────────────────
    /** The pairId currently revealed (answer tile visible + grade buttons shown) */
    const [revealedPairId, setRevealedPairId] = useState<string | null>(null);
    /** Cards that were marked as mistakes and re-queued within the session */
    const [mistakeCardIds, setMistakeCardIds] = useState<string[]>([]);
    /** Grade distribution for round summary (Requirement 7.7) */
    const [gradeDistribution, setGradeDistribution] = useState<Record<Grade, number>>({
        Again: 0,
        Hard: 0,
        Good: 0,
        Easy: 0,
    });

    const [comboPopup, setComboPopup] = useState<{
        id: number;
        text: string;
        bonus: number;
    } | null>(null);

    const comboIdRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const savedRef = useRef(false);
    const scoreRef = useRef(0);
    const finalScoreRef = useRef(0);
    /** Wrong attempt costs a life when config.lives > 0 */
    const livesModeRef = useRef(false);

    const config = DIFFICULTY_CONFIG[difficulty];
    const gameCfg = config.game;

    const { startSession, syncScore, endSession } = useGameSession({
        userId: userId ?? null,
        userName: displayName ?? "Player",
        gameMode,
        currentBest: bestScore,
    });

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    const timeUnlimited = !gameCfg.timePressure;

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
     * Called when the user taps a stimulus tile (the `-a` cell).
     * Reveals the corresponding answer tile and grade buttons (Requirement 7.2).
     */
    const handleStimTap = useCallback((pairId: string) => {
        const { matchedPairIds } = useMatchGameStore.getState();
        // Ignore taps on already-matched pairs
        if (matchedPairIds.includes(pairId)) return;
        setRevealedPairId(pairId);
    }, []);

    /**
     * Called when the user selects a grade for the currently revealed pair.
     * Calls gradeCard, marks the pair complete, and clears revealedPairId (Requirement 7.3).
     */
    const handleGrade = useCallback(
        async (pairId: string, grade: Grade) => {
            // Find the card for this pair
            const card = cards.find((c) => c.id === pairId);

            // Call gradeCard if we have a userId and card
            if (userId && card) {
                try {
                    await gradeCard(userId, pairId, card, grade);
                } catch (e) {
                    console.warn("[MatchMode] gradeCard failed", e);
                }
            }

            // Track grade distribution for round summary
            setGradeDistribution((prev) => ({
                ...prev,
                [grade]: prev[grade] + 1,
            }));

            if (grade === "Again") {
                // "Wrong" tap: record mistake and re-queue (Requirement 7.5)
                setMistakeCardIds((prev) => (prev.includes(pairId) ? prev : [...prev, pairId]));
                setWrongAttempts((prev) => prev + 1);
                setScore((prev) => {
                    const next = Math.max(0, prev - WRONG_PENALTY);
                    syncScore(next);
                    return next;
                });
                setStreak(0);
                // Shake the answer tile to signal wrong
                const bId = `${pairId}-b`;
                useMatchGameStore.getState().setShake([bId]);
                setTimeout(() => {
                    useMatchGameStore.getState().clearShake();
                    setRevealedPairId(null);
                }, 720);
                return;
            }

            // Correct grade (Hard / Good / Easy): award points and mark pair matched
            setStreak((prev) => {
                const newStreak = prev + 1;
                const points = calcMatchPoints(newStreak);
                setScore((s) => {
                    const next = s + points;
                    syncScore(next);
                    return next;
                });
                setMaxStreak((m) => Math.max(m, newStreak));

                const label = comboLabel(newStreak);
                if (label) {
                    const popupId = ++comboIdRef.current;
                    setComboPopup({ id: popupId, text: label, bonus: points - 100 });
                    setTimeout(() => {
                        setComboPopup((current) => (current?.id === popupId ? null : current));
                    }, 1400);
                }

                return newStreak;
            });

            useMatchGameStore.getState().addMatchedPairId(pairId);

            if (allowAudio("match", "feedback")) {
                const source = cards.find((c) => c.id === pairId);
                if (source) playAudio(getAudioText(source));
            }

            setRevealedPairId(null);
        },
        [cards, syncScore, userId],
    );

    /**
     * Legacy tap handler for the old game-style matching (kept for backward compat).
     * In the new stimulus-first flow, stimulus taps go through handleStimTap.
     */
    const onCellTap = useCallback(
        (id: string) => {
            const current = useMatchGameStore.getState();
            if (current.processing) return;

            const c = current.grid.find((x) => x.id === id);
            if (!c) return;
            if (!c.isDistractor && c.pairId != null && current.matchedPairIds.includes(c.pairId)) {
                return;
            }

            // Stimulus tile (ends with -a): trigger stimulus-first reveal
            if (c.pairId && id.endsWith("-a")) {
                handleStimTap(c.pairId);
                return;
            }

            // Distractor or answer tile tapped directly — ignore in stimulus-first mode
        },
        [handleStimTap],
    );

    const startGame = useCallback(async () => {
        // Enforce min 4 / max 12 pairs (Requirement 7.6)
        const safePairs = Math.min(
            Math.max(Math.min(config.pairs, cards.length), MIN_PAIRS),
            MAX_PAIRS,
        );
        if (safePairs < MIN_PAIRS && cards.length < MIN_PAIRS) return;

        const actualPairs = Math.min(Math.max(cards.length, MIN_PAIRS), MAX_PAIRS);
        const clampedPairs = Math.min(actualPairs, cards.length);
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
                } catch (e) {
                    console.warn("[MatchMode] Distractor generation failed, using fallback.", e);
                }
            }

            const fixedRoundType = pickFixedRoundQuestionType(pool, difficulty);
            const items = buildGridItems(pool, difficulty, fixedRoundType, distractorLabels);
            useMatchGameStore.getState().initGrid(items);

            setPhase("playing");
            setScore(0);
            setStreak(0);
            setMaxStreak(0);
            setWrongAttempts(0);
            setComboPopup(null);
            setRevealedPairId(null);
            setMistakeCardIds([]);
            setGradeDistribution({ Again: 0, Hard: 0, Good: 0, Easy: 0 });
            setTimeLeft(gameCfg.timePressure ? config.timeLimit : -1);
            void startSession();
        } finally {
            setPrepLoading(false);
        }
    }, [cards, config, difficulty, gameCfg.timePressure, startSession]);

    const matchedLen = useMatchGameStore((s) => s.matchedPairIds.length);

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

    useEffect(() => {
        if (phase !== "results" || savedRef.current) return;
        savedRef.current = true;

        const finalScore = finalScoreRef.current;
        void addXP(Math.round(finalScore / 10));
        void endSession(finalScore);
        if (userId) {
            void recordGameResult(userId, displayName ?? "Player", gameMode, finalScore, bestScore);
        }
    }, [addXP, bestScore, displayName, endSession, gameMode, phase, userId]);

    const resetToIntro = useCallback(() => {
        setPhase("intro");
        setRevealedPairId(null);
        setMistakeCardIds([]);
        setGradeDistribution({ Again: 0, Hard: 0, Good: 0, Easy: 0 });
    }, []);

    const closeSession = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const progress = useMemo(() => {
        if (pairCount === 0) return 0;
        return (matchedLen / pairCount) * 100;
    }, [matchedLen, pairCount]);

    const showLives = config.lives > 0;

    // Accuracy: (total graded - Again count) / total graded
    const totalGraded =
        gradeDistribution.Again +
        gradeDistribution.Hard +
        gradeDistribution.Good +
        gradeDistribution.Easy;
    const accuracy =
        totalGraded > 0
            ? Math.round(((totalGraded - gradeDistribution.Again) / totalGraded) * 100)
            : 0;

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
        showLives,
        pairCount,
        matchedPairs: matchedLen,
        comboPopup,
        progress,
        // Stimulus-first reveal
        revealedPairId,
        handleStimTap,
        handleGrade,
        mistakeCardIds,
        gradeDistribution,
        accuracy,
        startGame,
        onCellTap,
        resetToIntro,
        closeSession,
    };
}
