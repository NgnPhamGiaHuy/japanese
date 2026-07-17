/**
 * Scoring engine — score calculation, combo tracking, and bonus computation.
 */

import { comboMultiplier } from "@/features/game/domain";
import { calculateSpeedPoints, getSpeedComboThreshold } from "../speedRules";

import type { ScoringParams, ScoringResult } from "../types";

export class ScoringEngine {
    /**
     * Calculates points for an answer using Speed Mode's rules.
     */
    calculate(params: ScoringParams): ScoringResult {
        const points = calculateSpeedPoints(params);
        const multiplier = comboMultiplier(params.streak, getSpeedComboThreshold());

        return {
            points,
            multiplier,
        };
    }
}
