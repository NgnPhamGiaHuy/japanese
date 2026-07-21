/**
 * @file combo.test.ts
 * Unit tests for the combo-scoring formulas (T-117e) — the shared engine
 * kana (quiz/survival), Speed, and Match all score streaks through.
 */
import { describe, expect, it } from "vitest";

import { comboBonusAdditive, comboMultiplier } from "./combo";

describe("comboMultiplier (kana, Speed — multiplicative)", () => {
    it("is 1 (no bonus) for a zero or negative streak", () => {
        expect(comboMultiplier(0)).toBe(1);
        expect(comboMultiplier(-3)).toBe(1);
    });

    it("stays at 1 until the streak reaches comboStep", () => {
        expect(comboMultiplier(1, 5)).toBe(1);
        expect(comboMultiplier(4, 5)).toBe(1);
    });

    it("steps up to 2 exactly at comboStep, and again at each further multiple", () => {
        expect(comboMultiplier(5, 5)).toBe(2);
        expect(comboMultiplier(9, 5)).toBe(2);
        expect(comboMultiplier(10, 5)).toBe(3);
    });

    it("respects a custom comboStep", () => {
        expect(comboMultiplier(3, 3)).toBe(2);
        expect(comboMultiplier(2, 3)).toBe(1);
    });
});

describe("comboBonusAdditive (Match — additive)", () => {
    it("is 0 (no bonus) for a zero or negative streak", () => {
        expect(comboBonusAdditive(0, 5, 10)).toBe(0);
        expect(comboBonusAdditive(-1, 5, 10)).toBe(0);
    });

    it("adds bonusPerLevel once per comboStep completed streaks, never multiplying the base", () => {
        expect(comboBonusAdditive(4, 5, 10)).toBe(0);
        expect(comboBonusAdditive(5, 5, 10)).toBe(10);
        expect(comboBonusAdditive(9, 5, 10)).toBe(10);
        expect(comboBonusAdditive(10, 5, 10)).toBe(20);
    });

    it("discrimination: additive bonus is not the same shape as the multiplier — it must not multiply a base score", () => {
        // A plausible bug: applying comboMultiplier's formula (floor(streak/step)+1)
        // instead of the additive one (floor(streak/step)*bonus) would return 2
        // at streak=5,step=5 instead of the correct flat bonus of 10.
        const result = comboBonusAdditive(5, 5, 10);
        expect(result).toBe(10);
        expect(result).not.toBe(2);
    });
});
