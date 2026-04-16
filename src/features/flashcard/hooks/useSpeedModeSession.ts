"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGameSession } from "@/features/game/hooks";
import { calcSpeedPoints, SPEED_GAME_CONFIG, timerColor } from "@/features/game/modes";
import { recordGameResult } from "@/features/game/services";
import { allowAudio, playAudio, playSFX, shuffleArray } from "@/shared/utils";
import {
    buildSmartDistractors,
    chooseAdaptiveQuestionType,
    deriveAdaptiveDifficulty,
    initCardMemory,
    pickNextCardFromMemory,
    recordMemoryOutcome,
} from "../logic/speedIntelligence";
import { buildQuestion, getAudioText } from "../utils";

import type { AdaptiveLevel, AnswerEvent } from "../logic/speedIntelligence";
import type { FlashCard } from "../types";
import type { QuestionType } from "../utils";

const TIMER_TICK_MS = 80;
const QUEUE_BUFFER = 4;
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
    const [adaptiveLevel, setAdaptiveLevel] = useState<AdaptiveLevel>(1);
    const [cardQueue, setCardQueue] = useState<FlashCard[]>([]);

    const [timerFraction, setTimerFraction] = useState(1);
    const questionStartRef = useRef(0);
    const questionLimitRef = useRef(5);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const savedRef = useRef(false);
    const recentShownRef = useRef<string[]>([]);
    const answerHistoryRef = useRef<AnswerEvent[]>([]);
    const memoryRef = useRef(initCardMemory(allCards));

    const { startSession, syncScore, endSession } = useGameSession({
        userId: userId ?? null,
        userName: displayName ?? "Player",
        gameMode,
        currentBest: bestScore,
    });

    const currentCard = cardQueue[questionIndex];
    const difficultyConfig = SPEED_GAME_CONFIG.LEVELS[adaptiveLevel];

    const refillQueue = useCallback(
        (queue: FlashCard[], targetLength: number, level: AdaptiveLevel): FlashCard[] => {
            if (!lessonExists || allCards.length === 0) return [];
            const nextQueue = [...queue];
            const startLength = nextQueue.length;
            while (
                nextQueue.length < targetLength &&
                nextQueue.length < SPEED_GAME_CONFIG.TOTAL_QUESTIONS
            ) {
                const nextCard =
                    pickNextCardFromMemory({
                        cards: allCards,
                        memory: memoryRef.current,
                        questionIndex: nextQueue.length,
                        recentShownIds: recentShownRef.current,
                        reservedQueueIds: nextQueue.map((c) => c.id),
                        adaptiveLevel: level,
                    }) ?? shuffleArray(allCards)[0];
                if (!nextCard) break;
                nextQueue.push(nextCard);
            }
            return nextQueue.length === startLength ? queue : nextQueue;
        },
        [allCards, lessonExists],
    );

    const currentQuestion = useMemo(() => {
        if (!currentCard) return null;
        const type = chooseAdaptiveQuestionType(currentCard, adaptiveLevel);
        return { ...buildQuestion(currentCard, type), type };
    }, [adaptiveLevel, currentCard]);

    const options = useMemo(() => {
        if (!currentCard || !currentQuestion) return [];
        const chosen = buildSmartDistractors({
            allCards,
            currentCard,
            answer: currentQuestion.answer,
            questionType: currentQuestion.type as QuestionType,
            // Keep option order stable during answer feedback.
            memory: {},
        });
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
        if (currentCard) {
            recordMemoryOutcome({
                memory: memoryRef.current,
                cardId: currentCard.id,
                questionIndex,
                correct: false,
                responseMs: questionLimitRef.current * 1000,
            });
            answerHistoryRef.current.push({
                cardId: currentCard.id,
                correct: false,
                responseMs: questionLimitRef.current * 1000,
            });
            setAdaptiveLevel(deriveAdaptiveDifficulty(0, answerHistoryRef.current, adaptiveLevel));
        }
        if (currentCard && allowAudio("speed", "feedback")) {
            setTimeout(() => playAudio(getAudioText(currentCard)), 250);
        }
        setTimeout(() => {
            setAnswerStatus("idle");
            setSelectedOption(null);
            if (currentCard) {
                recentShownRef.current = [...recentShownRef.current, currentCard.id].slice(-10);
            }
            const nextIndex = questionIndex + 1;
            setCardQueue((prev) =>
                refillQueue(
                    prev,
                    Math.min(SPEED_GAME_CONFIG.TOTAL_QUESTIONS, nextIndex + QUEUE_BUFFER),
                    adaptiveLevel,
                ),
            );
            setQuestionIndex(nextIndex);
        }, 1100);
    }, [adaptiveLevel, currentCard, questionIndex, refillQueue, stopTimer]);

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
        setAdaptiveLevel(1);
        savedRef.current = false;
        recentShownRef.current = [];
        answerHistoryRef.current = [];
        memoryRef.current = initCardMemory(allCards);
        setCardQueue(refillQueue([], Math.min(SPEED_GAME_CONFIG.TOTAL_QUESTIONS, QUEUE_BUFFER), 1));
        setPhase("playing");
        void startSession();
    }, [allCards, refillQueue, startSession]);

    useEffect(() => {
        if (phase !== "playing") return;
        if (questionIndex >= SPEED_GAME_CONFIG.TOTAL_QUESTIONS) {
            stopTimer();
            return;
        }
        if (!currentCard) return;
        const limitSecs = SPEED_GAME_CONFIG.LEVELS[adaptiveLevel].timeLimit;
        const raf = requestAnimationFrame(() => startQuestionTimer(limitSecs));
        return () => {
            cancelAnimationFrame(raf);
            stopTimer();
        };
    }, [adaptiveLevel, currentCard, phase, questionIndex, startQuestionTimer, stopTimer]);

    useEffect(() => {
        if (phase !== "playing") return;
        const done = questionIndex >= SPEED_GAME_CONFIG.TOTAL_QUESTIONS;
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
            const responseMs = Math.max(0, Date.now() - questionStartRef.current);
            const isCorrect = Boolean(currentQuestion && selected === currentQuestion.answer);

            recordMemoryOutcome({
                memory: memoryRef.current,
                cardId: currentCard.id,
                questionIndex,
                correct: isCorrect,
                responseMs,
                mistakenChoice: isCorrect ? null : selected,
            });
            answerHistoryRef.current.push({
                cardId: currentCard.id,
                correct: isCorrect,
                responseMs,
            });

            if (isCorrect && currentQuestion) {
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
            setAdaptiveLevel(
                deriveAdaptiveDifficulty(
                    isCorrect ? streak + 1 : 0,
                    answerHistoryRef.current,
                    adaptiveLevel,
                ),
            );

            setTimeout(() => {
                setAnswerStatus("idle");
                setSelectedOption(null);
                recentShownRef.current = [...recentShownRef.current, currentCard.id].slice(-10);
                const nextIndex = questionIndex + 1;
                setCardQueue((prev) =>
                    refillQueue(
                        prev,
                        Math.min(SPEED_GAME_CONFIG.TOTAL_QUESTIONS, nextIndex + QUEUE_BUFFER),
                        adaptiveLevel,
                    ),
                );
                setQuestionIndex(nextIndex);
            }, 1100);
        },
        [
            adaptiveLevel,
            answerStatus,
            currentCard,
            currentQuestion,
            questionIndex,
            refillQueue,
            score,
            stopTimer,
            streak,
            syncScore,
        ],
    );

    useEffect(() => () => stopTimer(), [stopTimer]);

    const resetToIntro = useCallback(() => setPhase("intro"), []);
    const closeSession = useCallback(() => stopTimer(), [stopTimer]);

    const ui = useMemo(() => {
        const { SCORING, UI } = SPEED_GAME_CONFIG;
        const multiplier = Math.floor(streak / SCORING.COMBO_STEP) + 1;
        const secondsLeft = Math.ceil(timerFraction * difficultyConfig.timeLimit);
        const totalQuestions = SPEED_GAME_CONFIG.TOTAL_QUESTIONS;

        return {
            questionNumber: questionIndex + 1,
            totalQuestions,
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
