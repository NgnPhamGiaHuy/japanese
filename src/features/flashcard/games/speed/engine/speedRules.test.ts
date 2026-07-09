import { describe, expect, it } from "vitest";

import {
    calculateSpeedPoints,
    getSpeedComboThreshold,
    getSpeedTimeLimit,
    SPEED_TOTAL_QUESTIONS,
} from "./speedRules";

import type { ScoringParams } from "./types";

/**
 * Locks Speed-mode balance values after the M8 config merge: speedRules
 * derives scoring/level values from SPEED_GAME_CONFIG (single source) instead of a
 * duplicate local table. These assertions are the pre-merge values — the test fails
 * if the merge changed observable behavior.
 */
describe("speedRules", () => {
    it("exposes 20 total questions and a combo step of 5", () => {
        expect(SPEED_TOTAL_QUESTIONS).toBe(20);
        expect(getSpeedComboThreshold()).toBe(5);
    });

    it("maps levels 1/2/3 to time limits 10/8/5, with a 10s out-of-range fallback", () => {
        expect(getSpeedTimeLimit(1)).toBe(10);
        expect(getSpeedTimeLimit(2)).toBe(8);
        expect(getSpeedTimeLimit(3)).toBe(5);
        expect(getSpeedTimeLimit(99)).toBe(10);
    });

    it("scores (base + speedBonus) × combo multiplier, and 0 for wrong answers", () => {
        const params = (p: Partial<ScoringParams>): ScoringParams => ({
            correct: true,
            timeRemaining: 10,
            timeLimit: 10,
            streak: 0,
            questionIndex: 0,
            ...p,
        });

        // Full time remaining → speedBonus 50, multiplier 1 → (100 + 50) × 1.
        expect(calculateSpeedPoints(params({}))).toBe(150);
        // No time left, streak 5 → speedBonus 0, multiplier 2 → (100 + 0) × 2.
        expect(calculateSpeedPoints(params({ timeRemaining: 0, streak: 5 }))).toBe(200);
        // Wrong answer scores nothing.
        expect(calculateSpeedPoints(params({ correct: false }))).toBe(0);
    });
});
