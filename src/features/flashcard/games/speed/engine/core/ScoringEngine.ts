/**
 * Scoring engine — score calculation, combo tracking, and bonus computation.
 */

import { calculateSpeedPoints, getSpeedComboThreshold } from "../speedRules";

import type { ScoringParams, ScoringResult } from "../types";

export class ScoringEngine {
    /**
     * Calculates points for an answer using Speed Mode's rules.
     */
    calculate(params: ScoringParams): ScoringResult {
        const points = calculateSpeedPoints(params);
        const comboThreshold = getSpeedComboThreshold();
        const multiplier = Math.floor(params.streak / comboThreshold) + 1;

        return {
            points,
            multiplier,
            speedBonus: 0,
            comboBonus: 0,
        };
    }
}
