import { describe, expect, it } from "vitest";

import { computeAccuracy, levelFromXp } from "./progression";

describe("levelFromXp", () => {
    it("starts at level 1 with zero XP", () => {
        expect(levelFromXp(0)).toEqual({ level: 1, xpInLevel: 0, xpToNext: 500 });
    });

    it("stays at level 1 just below the level-2 threshold", () => {
        expect(levelFromXp(499)).toEqual({ level: 1, xpInLevel: 499, xpToNext: 500 });
    });

    it("rolls over to level 2 exactly at 500 XP", () => {
        expect(levelFromXp(500)).toEqual({ level: 2, xpInLevel: 0, xpToNext: 500 });
    });

    it("rolls over to level 3 exactly at 1000 XP", () => {
        expect(levelFromXp(1000)).toEqual({ level: 3, xpInLevel: 0, xpToNext: 500 });
    });

    it("computes xpInLevel as the remainder within the current level", () => {
        expect(levelFromXp(1250)).toEqual({ level: 3, xpInLevel: 250, xpToNext: 500 });
    });
});

describe("computeAccuracy", () => {
    it("returns null when there are no tracked characters", () => {
        expect(computeAccuracy({})).toBeNull();
    });

    it("returns null when every tracked character has zero attempts", () => {
        expect(computeAccuracy({ あ: { correct: 0, attempts: 0 } })).toBeNull();
    });

    it("returns 100 when every attempt was correct", () => {
        expect(computeAccuracy({ あ: { correct: 4, attempts: 4 } })).toBe(100);
    });

    it("returns 0 when no attempt was correct", () => {
        expect(computeAccuracy({ あ: { correct: 0, attempts: 4 } })).toBe(0);
    });

    it("aggregates across characters before computing the percentage", () => {
        expect(
            computeAccuracy({
                あ: { correct: 3, attempts: 4 },
                い: { correct: 1, attempts: 4 },
            }),
        ).toBe(50);
    });

    it("rounds to the nearest whole percent", () => {
        expect(computeAccuracy({ あ: { correct: 1, attempts: 3 } })).toBe(33);
    });
});
