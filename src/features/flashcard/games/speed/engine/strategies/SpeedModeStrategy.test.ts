import { describe, expect, it } from "vitest";

import { SpeedModeStrategy } from "./SpeedModeStrategy";

import type { ScoringParams } from "../types";

/**
 * Locks Speed-mode balance values after the M8 config merge: SpeedModeStrategy now
 * derives scoring/level values from SPEED_GAME_CONFIG (single source) instead of a
 * duplicate local table. These assertions are the pre-merge values — the test fails
 * if the merge changed observable behavior.
 */
describe("SpeedModeStrategy", () => {
    const strategy = new SpeedModeStrategy();

    it("exposes 20 total questions and a combo step of 5", () => {
        expect(strategy.totalQuestions).toBe(20);
        expect(strategy.getComboThreshold()).toBe(5);
    });

    it("maps levels 1/2/3 to time limits 10/8/5, with a 10s out-of-range fallback", () => {
        expect(strategy.getTimeLimit(1)).toBe(10);
        expect(strategy.getTimeLimit(2)).toBe(8);
        expect(strategy.getTimeLimit(3)).toBe(5);
        expect(strategy.getTimeLimit(99)).toBe(10);
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
        expect(strategy.calculatePoints(params({}))).toBe(150);
        // No time left, streak 5 → speedBonus 0, multiplier 2 → (100 + 0) × 2.
        expect(strategy.calculatePoints(params({ timeRemaining: 0, streak: 5 }))).toBe(200);
        // Wrong answer scores nothing.
        expect(strategy.calculatePoints(params({ correct: false }))).toBe(0);
    });
});
