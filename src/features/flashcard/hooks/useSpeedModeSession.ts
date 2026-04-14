"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGameSession } from "@/features/game/hooks";
import {
    calcSpeedPoints,
    getDifficultyForQuestion,
    SPEED_DIFFICULTY_CONFIG,
    timerColor,
    TOTAL_QUESTIONS,
} from "@/features/game/modes";
import { recordGameResult } from "@/features/game/services";
import { allowAudio, playAudio, shuffleArray } from "@/shared/utils";

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
        return shuffleArray([...allCards]).slice(0, TOTAL_QUESTIONS + 5);
    }, [allCards, lessonExists]);

    const currentCard = cardQueue[questionIndex];
    const difficultyLevel = getDifficultyForQuestion(questionIndex);
    const difficultyConfig = SPEED_DIFFICULTY_CONFIG[difficultyLevel];

    const options = useMemo(() => {
        if (!currentCard || allCards.length < 4) return [];
        const distractors = allCards
            .filter((card) => card.id !== currentCard.id)
            .map((card) => card.meaning);
        return shuffleArray([currentCard.meaning, ...shuffleArray(distractors).slice(0, 3)]);
    }, [allCards, currentCard]);

    const stopTimer = useCallback(() => {
        if (!timerIntervalRef.current) return;
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }, []);

    const handleTimeout = useCallback(() => {
        stopTimer();
        setAnswerStatus("wrong");
        setStreak(0);
        setTimerFraction(0);
        setTimeout(() => {
            setAnswerStatus("idle");
            setSelectedOption(null);
            setQuestionIndex((prev) => prev + 1);
        }, 600);
    }, [stopTimer]);

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
        if (questionIndex >= TOTAL_QUESTIONS || questionIndex >= cardQueue.length) {
            stopTimer();
            return;
        }
        const limitSecs =
            SPEED_DIFFICULTY_CONFIG[getDifficultyForQuestion(questionIndex)].timeLimit;
        const raf = requestAnimationFrame(() => startQuestionTimer(limitSecs));
        return () => {
            cancelAnimationFrame(raf);
            stopTimer();
        };
    }, [cardQueue.length, phase, questionIndex, startQuestionTimer, stopTimer]);

    useEffect(() => {
        if (phase !== "playing") return;
        const done = questionIndex >= TOTAL_QUESTIONS || questionIndex >= cardQueue.length;
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

            if (selected === currentCard.meaning) {
                const newStreak = streak + 1;
                const points = calcSpeedPoints(remaining, questionLimitRef.current, newStreak);
                const nextScore = score + points;

                setAnswerStatus("correct");
                setStreak(newStreak);
                setMaxStreak((prev) => Math.max(prev, newStreak));
                setCorrectCount((prev) => prev + 1);
                setScore(nextScore);
                syncScore(nextScore);

                if (allowAudio("speed", "feedback")) playAudio(currentCard.kanji);
            } else {
                setAnswerStatus("wrong");
                setStreak(0);
            }

            setTimeout(() => {
                setAnswerStatus("idle");
                setSelectedOption(null);
                setQuestionIndex((prev) => prev + 1);
            }, 700);
        },
        [answerStatus, currentCard, score, stopTimer, streak, syncScore],
    );

    useEffect(() => () => stopTimer(), [stopTimer]);

    const resetToIntro = useCallback(() => setPhase("intro"), []);
    const closeSession = useCallback(() => stopTimer(), [stopTimer]);

    const ui = useMemo(() => {
        const multiplier = Math.floor(streak / 5) + 1;
        const secondsLeft = Math.ceil(timerFraction * difficultyConfig.timeLimit);
        return {
            questionNumber: questionIndex + 1,
            multiplier,
            secondsLeft,
            isUrgent: timerFraction < 0.35,
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
