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

    /**
     * Generates a combo label for UI display.
     * Returns empty string if no combo is active.
     */
    getComboLabel(streak: number): string {
        const threshold = this.strategy.getComboThreshold();
        if (streak < threshold) return "";

        const level = Math.floor(streak / threshold);
        return `${level + 2}× COMBO!`;
    }

    /**
     * Checks if the current streak qualifies for a combo.
     */
    hasCombo(streak: number): boolean {
        const threshold = this.strategy.getComboThreshold();
        return streak >= threshold;
    }

    /**
     * Returns the current combo multiplier based on streak.
     */
    getMultiplier(streak: number): number {
        const threshold = this.strategy.getComboThreshold();
        return Math.floor(streak / threshold) + 1;
    }
}
