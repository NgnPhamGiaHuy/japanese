/**
 * Core type definitions for the unified game engine.
 * These types are shared across all game modes and provide a single source of truth.
 */

import type { FlashCard } from "@/features/flashcard/core/types";
import type { QuestionType } from "@/features/flashcard/core/utils";

export type GamePhase = "intro" | "playing" | "feedback" | "results";
export type FeedbackStatus = "idle" | "correct" | "wrong" | "timeout";

/**
 * Core game state - immutable snapshot of current game status.
 * This is the single source of truth for all game state.
 */
export interface GameState {
    phase: GamePhase;
    feedbackStatus: FeedbackStatus;
    questionIndex: number;
    totalQuestions: number;
    score: number;
    streak: number;
    maxStreak: number;
    correctCount: number;
    wrongCount: number;
    timeRemaining: number;
    timeLimit: number;
    timerFraction: number;
    currentQuestion: Question | null;
    selectedAnswer: string | null;
    adaptiveLevel: number;
}

/**
 * Represents a single question with all necessary data for rendering and evaluation.
 */
export interface Question {
    id: string;
    cardId: string;
    type: QuestionType;
    prompt: string;
    answer: string;
    options: string[];
    metadata: QuestionMetadata;
}

export interface QuestionMetadata {
    difficulty: number;
    timeLimit: number;
    showHint: boolean;
}

/**
 * Result of evaluating a user's answer.
 */
export interface AnswerResult {
    correct: boolean;
    points: number;
    responseTimeMs: number;
    newStreak: number;
    comboMultiplier: number;
    feedbackMessage?: string;
}

/**
 * Historical record of an answer for adaptive learning.
 */
export interface AnswerEvent {
    cardId: string;
    correct: boolean;
    responseMs: number;
}

/**
 * Configuration for question generation.
 */
export interface QuestionGenerationConfig {
    distractorCount: number;
    allowedQuestionTypes: QuestionType[];
    preferPrimaryToMeaning: boolean;
    useSmartDistractors: boolean;
    difficultyBias: number;
}

/**
 * Parameters for scoring calculation.
 */
export interface ScoringParams {
    correct: boolean;
    timeRemaining: number;
    timeLimit: number;
    streak: number;
    questionIndex: number;
}

/**
 * Result of scoring calculation with breakdown.
 */
export interface ScoringResult {
    points: number;
    multiplier: number;
    speedBonus: number;
    comboBonus: number;
}

/**
 * Mode-specific strategy interface.
 * Each game mode implements this to define its unique rules and behavior.
 */
export interface ModeStrategy {
    readonly name: string;
    readonly totalQuestions: number;

    getTimeLimit(level: number, questionIndex: number): number;
    getDifficultyLevel(
        questionIndex: number,
        streak: number,
        history: readonly AnswerEvent[],
    ): number;
    calculatePoints(params: ScoringParams): number;
    getQuestionConfig(level: number): QuestionGenerationConfig;
    shouldAdvanceLevel(state: GameState): boolean;
    getComboThreshold(): number;
}

/**
 * Configuration for the game engine.
 */
export interface GameEngineConfig {
    cards: FlashCard[];
    strategy: ModeStrategy;
    userId?: string;
    displayName?: string;
    onScoreSync: (score: number) => void;
    onSessionEnd: (finalScore: number) => Promise<void>;
    onAudioPlay?: (text: string) => void;
    onSFXPlay?: (sfx: "correct" | "wrong" | "click") => void;
}

/**
 * Timer state snapshot.
 */
export interface TimerState {
    isRunning: boolean;
    elapsed: number;
    remaining: number;
    fraction: number;
}

/**
 * Phase transition events for state machine.
 */
export type PhaseTransition =
    | "START_GAME"
    | "ANSWER_SUBMITTED"
    | "FEEDBACK_COMPLETE"
    | "GAME_COMPLETE"
    | "TIMEOUT"
    | "RESET";
