"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { buildQuestion, chooseQuestionType, getAudioText } from "../utils/displayEngine";

import type { MatchDifficulty } from "@/features/game/modes";
import type { FlashCard } from "../types";

type MatchPhase = "intro" | "playing" | "results";

interface MatchCard {
    cardId: string;
    left: string;
    right: string;
}
export type MatchModeCard = MatchCard;

interface UseMatchModeSessionParams {
    cards: FlashCard[];
    gameMode: string;
    bestScore: number;
    userId?: string;
    displayName?: string | null;
    addXP: (amount: number) => Promise<void>;
}

/**
 * Logic orchestration hook for the Match Mode game.
 *
 * @remarks
 * Features:
 * 1. **Phase Management**: Orchestrates the transition from config (intro) to active gameplay (playing) and final summary (results).
 * 2. **Game Mechanics**: Handles 2-column selection, error shake triggers, match validation, and streak-based scoring.
 * 3. **Session Interfacing**: Leverages `useGameSession` for real-time leaderboard participation and XP distribution.
 * 4. **Adaptive Difficulty**: Enforces time limits and pair counts based on the `DIFFICULTY_CONFIG`.
 *
 * @param cards - Pool of flashcards available for the game.
 * @param gameMode - Unique identifier for the leaderboard/tracking.
 * @param bestScore - User's current personal best for the target deck/mode.
 * @param addXP - Callback to persist experience gains.
 * @returns Comprehensive state and handlers for the Match Mode UI.
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

    const [leftItems, setLeftItems] = useState<MatchCard[]>([]);
    const [rightItems, setRightItems] = useState<MatchCard[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [selectedRight, setSelectedRight] = useState<string | null>(null);
    const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
    const [errorLeft, setErrorLeft] = useState<string | null>(null);
    const [errorRight, setErrorRight] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);

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

    const config = DIFFICULTY_CONFIG[difficulty];

    const { startSession, syncScore, endSession } = useGameSession({
        userId: userId ?? null,
        userName: displayName ?? "Player",
        gameMode,
        currentBest: bestScore,
    });

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    useEffect(() => {
        if (phase !== "playing") return;
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase]);

    const startGame = useCallback(() => {
        const pool = shuffleArray(cards).slice(0, config.pairs);
        const matchCards: MatchCard[] = pool.map((card) => ({
            cardId: card.id,
            ...(() => {
                const type = chooseQuestionType(card, {
                    difficulty,
                    preferPrimary: true,
                });
                const pair = buildQuestion(card, type);
                return { left: pair.prompt, right: pair.answer };
            })(),
        }));

        setLeftItems(shuffleArray(matchCards));
        setRightItems(shuffleArray(matchCards));
        setSelectedLeft(null);
        setSelectedRight(null);
        setMatchedIds(new Set());
        setErrorLeft(null);
        setErrorRight(null);
        setProcessing(false);
        setScore(0);
        setStreak(0);
        setMaxStreak(0);
        setWrongAttempts(0);
        setTimeLeft(config.timeLimit);
        setComboPopup(null);
        savedRef.current = false;
        finalScoreRef.current = 0;
        setPhase("playing");
        void startSession();
    }, [cards, config.pairs, config.timeLimit, difficulty, startSession]);

    const resolveMatch = useCallback(
        (leftId: string, rightId: string) => {
            if (processing) return;
            setProcessing(true);

            if (leftId === rightId) {
                const newStreak = streak + 1;
                const points = calcMatchPoints(newStreak);

                setStreak(newStreak);
                setMaxStreak((prev) => Math.max(prev, newStreak));
                setScore((prev) => {
                    const next = prev + points;
                    syncScore(next);
                    return next;
                });
                setMatchedIds((prev) => new Set([...prev, leftId]));

                const label = comboLabel(newStreak);
                if (label) {
                    const popupId = ++comboIdRef.current;
                    setComboPopup({ id: popupId, text: label, bonus: points - 100 });
                    setTimeout(() => {
                        setComboPopup((current) => (current?.id === popupId ? null : current));
                    }, 1400);
                }

                if (allowAudio("match", "feedback")) {
                    const card = leftItems.find((item) => item.cardId === leftId);
                    if (card) {
                        const source = cards.find((c) => c.id === card.cardId);
                        if (source) playAudio(getAudioText(source));
                    }
                }

                setTimeout(() => {
                    setSelectedLeft(null);
                    setSelectedRight(null);
                    setProcessing(false);
                }, 200);
                return;
            }

            setStreak(0);
            setWrongAttempts((prev) => prev + 1);
            setScore((prev) => Math.max(0, prev - WRONG_PENALTY));
            setErrorLeft(leftId);
            setErrorRight(rightId);

            if (allowAudio("match", "feedback")) {
                const card = leftItems.find((item) => item.cardId === leftId);
                if (card) {
                    const source = cards.find((c) => c.id === card.cardId);
                    if (source) playAudio(getAudioText(source));
                }
            }
            setTimeout(() => {
                setErrorLeft(null);
                setErrorRight(null);
                setSelectedLeft(null);
                setSelectedRight(null);
                setProcessing(false);
            }, 700);
        },
        [cards, leftItems, processing, streak, syncScore],
    );

    const selectLeft = useCallback(
        (leftId: string) => {
            if (selectedRight) {
                resolveMatch(leftId, selectedRight);
                return;
            }
            setSelectedLeft((prev) => (prev === leftId ? null : leftId));
        },
        [resolveMatch, selectedRight],
    );

    const selectRight = useCallback(
        (rightId: string) => {
            if (selectedLeft) {
                resolveMatch(selectedLeft, rightId);
                return;
            }
            setSelectedRight((prev) => (prev === rightId ? null : rightId));
        },
        [resolveMatch, selectedLeft],
    );

    useEffect(() => {
        if (phase !== "playing") return;
        const allMatched = matchedIds.size === leftItems.length && leftItems.length > 0;
        const timedOut = timeLeft === 0;
        if (!allMatched && !timedOut) return;

        if (timerRef.current) clearInterval(timerRef.current);
        const timeBonus = allMatched ? calcTimeBonus(timeLeft) : 0;
        const raf = requestAnimationFrame(() => {
            const finalScore = scoreRef.current + timeBonus;
            finalScoreRef.current = finalScore;
            setScore(finalScore);
            setPhase("results");
        });
        return () => cancelAnimationFrame(raf);
    }, [leftItems.length, matchedIds, phase, timeLeft]);

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
    }, []);

    const closeSession = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const progress = useMemo(() => {
        if (config.pairs === 0) return 0;
        return (matchedIds.size / config.pairs) * 100;
    }, [config.pairs, matchedIds.size]);

    return {
        phase,
        setPhase,
        difficulty,
        setDifficulty,
        config,
        leftItems,
        rightItems,
        selectedLeft,
        selectedRight,
        matchedIds,
        errorLeft,
        errorRight,
        processing,
        score,
        streak,
        maxStreak,
        wrongAttempts,
        timeLeft,
        comboPopup,
        progress,
        startGame,
        selectLeft,
        selectRight,
        resetToIntro,
        closeSession,
    };
}
