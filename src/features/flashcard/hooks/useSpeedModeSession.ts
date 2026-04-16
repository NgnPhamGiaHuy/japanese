"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGameSession } from "@/features/game/hooks";
import {
    calcSpeedPoints,
    getDifficultyForQuestion,
    SPEED_GAME_CONFIG,
    timerColor,
} from "@/features/game/modes";
import { recordGameResult } from "@/features/game/services";
import { allowAudio, playAudio, playSFX, shuffleArray } from "@/shared/utils";
import { buildQuestion, chooseQuestionType, getAudioText } from "../utils";

import type { FlashCard } from "../types";

const TIMER_TICK_MS = 80;
type SpeedPhase = "intro" | "playing" | "results";
type AnswerStatus = "idle" | "correct" | "wrong";

interface UseSpeedModeSessionParams {
    allCards: FlashCard[];
    lessonExists: boolean;
    gameMode: string;
    bestScore: number;
    userId?: string;
    displayName?: string | null;
    addXP: (amount: number) => Promise<void>;
}

/**
 * Controller hook for the Speed Mode (Blitz) gameplay session.
 *
 * @remarks
 * Orchestrates a high-pressure, multiple-choice flashcard session.
 *
 * **Key Logic**:
 * - **Difficulty Escalation**: Gradually shortens timers and reduces display hints.
 * - **Timer Management**: Frame-accurate timers with transition logic for the progress bar.
 * - **Combo Engine**: Multipliers that stack based on correct answer streaks.
 * - **Session Reliability**: Ensures scores are synced mid-session and persisted atomically on completion/timeout.
 */
export function useSpeedModeSession({
    allCards,
    lessonExists,
    gameMode,
    bestScore,
    userId,
    displayName,
    addXP,
}: UseSpeedModeSessionParams) {
    const [phase, setPhase] = useState<SpeedPhase>("intro");
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [answerStatus, setAnswerStatus] = useState<AnswerStatus>("idle");
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const [timerFraction, setTimerFraction] = useState(1);
    const questionStartRef = useRef(0);
    const questionLimitRef = useRef(5);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const savedRef = useRef(false);

    const { startSession, syncScore, endSession } = useGameSession({
        userId: userId ?? null,
        userName: displayName ?? "Player",
        gameMode,
        currentBest: bestScore,
    });

    const cardQueue = useMemo(() => {
        if (!lessonExists || allCards.length === 0) return [];
        return shuffleArray([...allCards]).slice(0, SPEED_GAME_CONFIG.TOTAL_QUESTIONS + 5);
    }, [allCards, lessonExists]);

    const currentCard = cardQueue[questionIndex];
    const difficultyLevel = getDifficultyForQuestion(questionIndex);
    const difficultyConfig = SPEED_GAME_CONFIG.LEVELS[difficultyLevel];

    const currentQuestion = useMemo(() => {
        if (!currentCard) return null;
        const type = chooseQuestionType(currentCard, {
            difficulty: difficultyLevel,
            preferPrimary: true,
        });
        return { ...buildQuestion(currentCard, type), type };
    }, [currentCard, difficultyLevel, questionIndex]);

    // Build 3 distractors from other cards' meanings (same language as the answer)
    const options = useMemo(() => {
        if (!currentCard || !currentQuestion) return [];
        const distractors = allCards
            .filter((card) => card.id !== currentCard.id)
            .map((card) =>
                currentQuestion.type === "primary_to_meaning" ? card.meaning : card.primary,
            )
            .filter((value): value is string => Boolean(value) && value !== currentQuestion.answer);
        const chosen = shuffleArray(distractors).slice(0, 3);
        return shuffleArray([currentQuestion.answer, ...chosen]);
    }, [allCards, currentCard, currentQuestion]);

    const stopTimer = useCallback(() => {
        if (!timerIntervalRef.current) return;
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }, []);

    const handleTimeout = useCallback(() => {
        stopTimer();
        playSFX("wrong");
        setAnswerStatus("wrong");
        setStreak(0);
        setTimerFraction(0);
        if (currentCard && allowAudio("speed", "feedback")) {
            setTimeout(() => playAudio(getAudioText(currentCard)), 250);
        }
        setTimeout(() => {
            setAnswerStatus("idle");
            setSelectedOption(null);
            setQuestionIndex((prev) => prev + 1);
        }, 1100);
    }, [currentCard, stopTimer]);

    const startQuestionTimer = useCallback(
        (limitSecs: number) => {
            stopTimer();
            questionStartRef.current = Date.now();
            questionLimitRef.current = limitSecs;
            setTimerFraction(1);

            timerIntervalRef.current = setInterval(() => {
                const elapsed = (Date.now() - questionStartRef.current) / 1000;
                const remaining = Math.max(0, limitSecs - elapsed);
                setTimerFraction(remaining / limitSecs);
                if (elapsed >= limitSecs) handleTimeout();
            }, TIMER_TICK_MS);
        },
        [handleTimeout, stopTimer],
    );

    const startGame = useCallback(() => {
        setQuestionIndex(0);
        setScore(0);
        setStreak(0);
        setMaxStreak(0);
        setCorrectCount(0);
        setAnswerStatus("idle");
        setSelectedOption(null);
        savedRef.current = false;
        setPhase("playing");
        void startSession();
    }, [startSession]);

    useEffect(() => {
        if (phase !== "playing") return;
        if (
            questionIndex >= SPEED_GAME_CONFIG.TOTAL_QUESTIONS ||
            questionIndex >= cardQueue.length
        ) {
            stopTimer();
            return;
        }
        const limitSecs =
            SPEED_GAME_CONFIG.LEVELS[getDifficultyForQuestion(questionIndex)].timeLimit;
        const raf = requestAnimationFrame(() => startQuestionTimer(limitSecs));
        return () => {
            cancelAnimationFrame(raf);
            stopTimer();
        };
    }, [cardQueue.length, phase, questionIndex, startQuestionTimer, stopTimer]);

    useEffect(() => {
        if (phase !== "playing") return;
        const done =
            questionIndex >= SPEED_GAME_CONFIG.TOTAL_QUESTIONS || questionIndex >= cardQueue.length;
        if (!done) return;

        stopTimer();
        if (!savedRef.current) {
            savedRef.current = true;
            void addXP(Math.round(score / 10));
            void endSession(score);
            if (userId) {
                void recordGameResult(userId, displayName ?? "Player", gameMode, score, bestScore);
            }
        }
        const raf = requestAnimationFrame(() => setPhase("results"));
        return () => cancelAnimationFrame(raf);
    }, [
        addXP,
        bestScore,
        cardQueue.length,
        displayName,
        endSession,
        gameMode,
        phase,
        questionIndex,
        score,
        stopTimer,
        userId,
    ]);

    const handleAnswer = useCallback(
        (selected: string) => {
            if (answerStatus !== "idle" || !currentCard) return;

            stopTimer();
            const elapsed = (Date.now() - questionStartRef.current) / 1000;
            const remaining = Math.max(0, questionLimitRef.current - elapsed);
            setSelectedOption(selected);

            if (currentQuestion && selected === currentQuestion.answer) {
                const newStreak = streak + 1;
                const points = calcSpeedPoints(remaining, questionLimitRef.current, newStreak);
                const nextScore = score + points;

                playSFX("correct");
                setAnswerStatus("correct");
                setStreak(newStreak);
                setMaxStreak((prev) => Math.max(prev, newStreak));
                setCorrectCount((prev) => prev + 1);
                setScore(nextScore);
                syncScore(nextScore);

                if (allowAudio("speed", "feedback")) {
                    setTimeout(() => playAudio(getAudioText(currentCard)), 250);
                }
            } else {
                playSFX("wrong");
                setAnswerStatus("wrong");
                setStreak(0);
                if (allowAudio("speed", "feedback")) {
                    setTimeout(() => playAudio(getAudioText(currentCard)), 250);
                }
            }

            setTimeout(() => {
                setAnswerStatus("idle");
                setSelectedOption(null);
                setQuestionIndex((prev) => prev + 1);
            }, 1100);
        },
        [answerStatus, currentCard, currentQuestion, score, stopTimer, streak, syncScore],
    );

    useEffect(() => () => stopTimer(), [stopTimer]);

    const resetToIntro = useCallback(() => setPhase("intro"), []);
    const closeSession = useCallback(() => stopTimer(), [stopTimer]);

    const ui = useMemo(() => {
        const { SCORING, UI } = SPEED_GAME_CONFIG;
        const multiplier = Math.floor(streak / SCORING.COMBO_STEP) + 1;
        const secondsLeft = Math.ceil(timerFraction * difficultyConfig.timeLimit);

        return {
            questionNumber: questionIndex + 1,
            multiplier,
            secondsLeft,
            isUrgent: timerFraction < UI.URGENT_THRESHOLD,
            timerBarColor: timerColor(timerFraction),
            timerTransitionMs: TIMER_TICK_MS,
        };
    }, [difficultyConfig.timeLimit, questionIndex, streak, timerFraction]);

    return {
        phase,
        setPhase,
        questionIndex,
        score,
        streak,
        maxStreak,
        correctCount,
        answerStatus,
        selectedOption,
        timerFraction,
        currentCard,
        currentQuestion,
        cardQueue,
        options,
        difficultyConfig,
        ui,
        startGame,
        handleAnswer,
        resetToIntro,
        closeSession,
    };
}
