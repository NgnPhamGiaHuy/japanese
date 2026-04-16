/**
 * Speed Mode session hook using unified game engine.
 * 
 * @remarks
 * Orchestrates high-pressure multiple-choice flashcard gameplay using the centralized
 * GameEngine architecture. Maintains backward compatibility with original interface
 * while leveraging cleaner separation of concerns.
 * 
 * Key features:
 * - Adaptive difficulty (10s → 8s → 5s time limits)
 * - Smart card selection via SRS algorithm
 * - Combo multipliers on streak milestones
 * - Real-time Firestore score sync
 * - Audio feedback integration
 * 
 * Architecture:
 * - GameEngine handles pure game logic
 * - This hook manages React lifecycle and side effects
 * - SpeedModeStrategy defines mode-specific rules
 */

"use client";

import { useCallback, useMemo } from "react";

import { useGameEngine } from "@/features/game/hooks";
import { SpeedModeStrategy } from "@/features/game/engine/strategies";
import { SPEED_GAME_CONFIG, timerColor } from "@/features/game/modes";

import type { FlashCard } from "../types";

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
 * Speed Mode session controller.
 * 
 * @remarks
 * Wraps GameEngine with React-specific concerns while maintaining exact interface
 * compatibility with components. Engine handles game logic, hook handles:
 * - React state synchronization
 * - Phase mapping (engine uses 4 phases, UI uses 3)
 * - Lesson existence guards
 * - Type conversions for backward compatibility
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
    const strategy = useMemo(() => new SpeedModeStrategy(), []);

    const { state, startGame: engineStartGame, submitAnswer, reset } = useGameEngine({
        cards: allCards,
        strategy,
        gameMode,
        bestScore,
        userId,
        displayName: displayName ?? undefined,
        addXP,
    });

    /**
     * Maps engine's 4-phase model to UI's 3-phase model.
     * 
     * @remarks
     * Engine: intro → playing → feedback → results
     * UI: intro → playing (includes feedback) → results
     * 
     * Computed directly from state to avoid setState in effect.
     */
    const localPhase: SpeedPhase = useMemo(() => {
        if (!state) return "intro";
        if (state.phase === "intro") return "intro";
        if (state.phase === "playing" || state.phase === "feedback") return "playing";
        return "results";
    }, [state]);

    /**
     * Starts game with lesson existence guard.
     * 
     * @remarks
     * Original hook only started if lesson exists and cards available.
     * Preserves this guard for backward compatibility.
     */
    const startGame = useCallback(() => {
        if (!lessonExists || allCards.length === 0) return;
        void engineStartGame();
    }, [lessonExists, allCards.length, engineStartGame]);

    /**
     * Maps engine feedback status to legacy answer status enum.
     * 
     * @remarks
     * Engine timeout is treated as wrong answer for UI consistency.
     */
    const answerStatus: AnswerStatus = useMemo(() => {
        if (!state) return "idle";
        if (state.feedbackStatus === "timeout") return "wrong";
        if (state.feedbackStatus === "correct") return "correct";
        if (state.feedbackStatus === "wrong") return "wrong";
        return "idle";
    }, [state]);

    /**
     * Resolves current card from engine's cardId reference.
     * 
     * @remarks
     * Engine stores cardId for efficiency, components expect full FlashCard object.
     * Dep is the cardId string, not the question object, so memoization is stable.
     */
    const currentCardId = state?.currentQuestion?.cardId ?? null;
    const currentCard = useMemo(() => {
        if (!currentCardId) return null;
        return allCards.find((c) => c.id === currentCardId) ?? null;
    }, [currentCardId, allCards]);

    /**
     * Reconstructs difficulty config for UI display.
     * 
     * @remarks
     * Original hook exposed full config object. Rebuild from engine's adaptive level.
     */
    const difficultyConfig = useMemo(() => {
        if (!state) return SPEED_GAME_CONFIG.LEVELS[1];
        return SPEED_GAME_CONFIG.LEVELS[state.adaptiveLevel as 1 | 2 | 3];
    }, [state]);

    /**
     * Builds UI helper object with computed display values.
     * 
     * @remarks
     * Provides convenience properties for components:
     * - Question numbering (1-indexed)
     * - Combo multiplier calculation
     * - Timer urgency state
     * - Color coding for progress bar
     */
    const ui = useMemo(() => {
        if (!state) {
            return {
                questionNumber: 1,
                totalQuestions: SPEED_GAME_CONFIG.TOTAL_QUESTIONS,
                multiplier: 1,
                secondsLeft: 0,
                isUrgent: false,
                timerBarColor: "#58cc02",
                timerTransitionMs: 80,
            };
        }

        const { SCORING, UI } = SPEED_GAME_CONFIG;
        const multiplier = Math.floor(state.streak / SCORING.COMBO_STEP) + 1;
        const secondsLeft = Math.ceil(state.timeRemaining);

        return {
            questionNumber: state.questionIndex + 1,
            totalQuestions: SPEED_GAME_CONFIG.TOTAL_QUESTIONS,
            multiplier,
            secondsLeft,
            isUrgent: state.timerFraction < UI.URGENT_THRESHOLD,
            timerBarColor: timerColor(state.timerFraction),
            timerTransitionMs: 80,
        };
    }, [state]);

    const resetToIntro = useCallback(() => {
        reset();
    }, [reset]);

    const closeSession = useCallback(() => {
        // Engine cleanup handled automatically in useEffect
    }, []);

    /**
     * Dummy setPhase for backward compatibility.
     * 
     * @remarks
     * Original hook exposed setPhase but it's not used by components.
     * Engine manages phase internally, this is a no-op for compatibility.
     */
    const setPhase = useCallback(() => {
        // Phase managed by engine, no-op for compatibility
    }, []);

    /**
     * Returns interface matching original hook exactly.
     * 
     * @remarks
     * All properties maintain same names and types for drop-in compatibility.
     * Components require no changes to work with new engine.
     */
    return {
        phase: localPhase,
        setPhase,
        questionIndex: state?.questionIndex ?? 0,
        score: state?.score ?? 0,
        streak: state?.streak ?? 0,
        maxStreak: state?.maxStreak ?? 0,
        correctCount: state?.correctCount ?? 0,
        answerStatus,
        selectedOption: state?.selectedAnswer ?? null,
        timerFraction: state?.timerFraction ?? 1,
        currentCard,
        currentQuestion: state?.currentQuestion ?? null,
        cardQueue: [],
        options: state?.currentQuestion?.options ?? [],
        difficultyConfig,
        ui,
        startGame,
        handleAnswer: submitAnswer,
        resetToIntro,
        closeSession,
    };
}
