/**
 * Centralized scoring engine that delegates to mode-specific strategies.
 * Handles score calculation, combo tracking, and bonus computation.
 */

import type { ModeStrategy, ScoringParams, ScoringResult } from "../types";

export class ScoringEngine {
    constructor(private readonly strategy: ModeStrategy) {}

    /**
     * Calculates points for an answer using the mode's strategy.
     */
    calculate(params: ScoringParams): ScoringResult {
        const points = this.strategy.calculatePoints(params);
        const comboThreshold = this.strategy.getComboThreshold();
        const multiplier = Math.floor(params.streak / comboThreshold) + 1;

        return {
            points,
            multiplier,
            speedBonus: 0,
            comboBonus: 0,
        };
    }
}
