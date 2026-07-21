/**
 * @file tier.test.ts
 * Unit tests for the shared Match/Speed tier engine (T-117e).
 */
import { describe, expect, it } from "vitest";

import { scoreToTier, TIER_INFO } from "./tier";

describe("scoreToTier", () => {
    it("is 'bronze' for a score of 0 or just below the next threshold", () => {
        expect(scoreToTier(0)).toBe("bronze");
        expect(scoreToTier(499)).toBe("bronze");
    });

    it("boundary: exactly at a threshold is the HIGHER tier, one below is not", () => {
        expect(scoreToTier(500)).toBe("silver");
        expect(scoreToTier(499)).toBe("bronze");
        expect(scoreToTier(1000)).toBe("gold");
        expect(scoreToTier(999)).toBe("silver");
        expect(scoreToTier(2000)).toBe("platinum");
        expect(scoreToTier(1999)).toBe("gold");
        expect(scoreToTier(4000)).toBe("diamond");
        expect(scoreToTier(3999)).toBe("platinum");
    });

    it("is 'diamond' for any score at or beyond the top threshold, with no ceiling", () => {
        expect(scoreToTier(4000)).toBe("diamond");
        expect(scoreToTier(1_000_000)).toBe("diamond");
    });

    it("negative scores fall back to 'bronze', the floor tier", () => {
        expect(scoreToTier(-100)).toBe("bronze");
    });
});

describe("TIER_INFO", () => {
    it("every tier's nextThreshold matches the score that scoreToTier promotes at, except diamond", () => {
        // Cross-checks the two data structures agree with each other — if
        // THRESHOLDS in scoreToTier and TIER_INFO's nextThreshold values ever
        // drift apart, a tier progress bar would show the wrong "points to go".
        expect(TIER_INFO.bronze.nextThreshold).toBe(500);
        expect(scoreToTier(TIER_INFO.bronze.nextThreshold!)).toBe("silver");

        expect(TIER_INFO.silver.nextThreshold).toBe(1000);
        expect(scoreToTier(TIER_INFO.silver.nextThreshold!)).toBe("gold");

        expect(TIER_INFO.gold.nextThreshold).toBe(2000);
        expect(scoreToTier(TIER_INFO.gold.nextThreshold!)).toBe("platinum");

        expect(TIER_INFO.platinum.nextThreshold).toBe(4000);
        expect(scoreToTier(TIER_INFO.platinum.nextThreshold!)).toBe("diamond");
    });

    it("diamond has no next threshold — it's the top tier", () => {
        expect(TIER_INFO.diamond.nextThreshold).toBeNull();
    });

    it("every TIER_INFO entry's id matches its own key", () => {
        for (const [key, info] of Object.entries(TIER_INFO)) {
            expect(info.id).toBe(key);
        }
    });
});
