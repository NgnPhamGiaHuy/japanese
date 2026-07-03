/**
 * Speed Mode strategy implementation.
 * Defines rules for rapid-fire flashcard gameplay with adaptive difficulty.
 */

import { SPEED_GAME_CONFIG } from "../../config";

import type {
    AnswerEvent,
    GameState,
    ModeStrategy,
    QuestionGenerationConfig,
    ScoringParams,
} from "../types";

// Balance numbers (scoring, per-level time limits, total questions) come from the
// single source of truth in ../../config — this strategy only implements behavior.
const { BASE_POINTS, MAX_SPEED_BONUS, COMBO_STEP } = SPEED_GAME_CONFIG.SCORING;
const { LEVELS } = SPEED_GAME_CONFIG;

type AdaptiveLevel = 1 | 2 | 3;

/**
 * Derives adaptive difficulty level from recent answer history.
 *
 * @remarks
 * Evaluates the last 8 answers for accuracy and response speed.
 * Promotes to level 3 when accuracy ≥ 85% and avg response ≤ 1600ms with a streak ≥ 3.
 * Demotes to level 1 when accuracy ≤ 60% or avg response ≥ 3000ms.
 * Otherwise holds at level 2.
 */
function deriveAdaptiveLevel(
    streak: number,
    history: readonly AnswerEvent[],
    fallback: AdaptiveLevel = 1,
): AdaptiveLevel {
    if (history.length === 0) return fallback;

    const recent = history.slice(-8);
    const accuracy = recent.filter((h) => h.correct).length / recent.length;
    const avgMs = recent.reduce((sum, h) => sum + h.responseMs, 0) / recent.length;

    if (accuracy >= 0.85 && avgMs <= 1600 && streak >= 3) return 3;
    if (accuracy <= 0.6 || avgMs >= 3000) return 1;
    return 2;
}

export class SpeedModeStrategy implements ModeStrategy {
    readonly name = "speed";
    readonly totalQuestions = SPEED_GAME_CONFIG.TOTAL_QUESTIONS;

    getTimeLimit(level: number): number {
        return LEVELS[level]?.timeLimit ?? 10;
    }

    getDifficultyLevel(
        _questionIndex: number,
        streak: number,
        history: readonly AnswerEvent[],
    ): number {
        return deriveAdaptiveLevel(streak, history, 1);
    }

    calculatePoints(params: ScoringParams): number {
        if (!params.correct) return 0;

        const speedRatio = params.timeRemaining / params.timeLimit;
        const speedBonus = Math.round(speedRatio * MAX_SPEED_BONUS);
        const multiplier = Math.floor(params.streak / COMBO_STEP) + 1;

        return (BASE_POINTS + speedBonus) * multiplier;
    }

    getQuestionConfig(level: number): QuestionGenerationConfig {
        return {
            distractorCount: 3,
            allowedQuestionTypes: [
                "primary_to_meaning",
                "meaning_to_primary",
                "alternative_to_primary",
                "example_to_primary",
            ],
            preferPrimaryToMeaning: level <= 2,
            useSmartDistractors: true,
            difficultyBias: level,
        };
    }

    shouldAdvanceLevel(_state: GameState): boolean {
        return false;
    }

    getComboThreshold(): number {
        return COMBO_STEP;
    }
}
