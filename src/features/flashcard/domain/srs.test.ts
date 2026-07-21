/**
 * @file srs.test.ts
 * Direct tests for the SM-2 scheduling math (T-117a).
 *
 * @remarks
 * This is the highest-consequence untested unit in the repository per ADR-117:
 * a regression here silently corrupts every user's review schedule. Each
 * assertion is derived from the SM-2 domain rule stated in srs.ts's own
 * docblock, not from whatever the function currently returns — a test that
 * merely echoes observed output would certify a bug as a feature.
 */
import { describe, expect, it } from "vitest";

import {
    computeNextSRS,
    deriveStatus,
    getDueCards,
    getMistakeCards,
    getNewCards,
    reinsertCard,
} from "./srs";

describe("deriveStatus", () => {
    it("is 'new' when never studied, regardless of interval", () => {
        expect(deriveStatus(0, 0)).toBe("new");
        expect(deriveStatus(0, 100)).toBe("new");
    });

    it("is 'mastered' once interval reaches 21 days, taking priority over repetitions", () => {
        expect(deriveStatus(1, 21)).toBe("mastered");
        expect(deriveStatus(50, 21)).toBe("mastered");
    });

    it("is 'review' at 3+ repetitions with interval still under 21", () => {
        expect(deriveStatus(3, 20)).toBe("review");
        expect(deriveStatus(10, 1)).toBe("review");
    });

    it("is 'learning' at 1-2 repetitions with interval under 21", () => {
        expect(deriveStatus(1, 1)).toBe("learning");
        expect(deriveStatus(2, 6)).toBe("learning");
    });

    it("boundary: interval exactly 20 is not yet mastered; exactly 21 is", () => {
        expect(deriveStatus(5, 20)).toBe("review");
        expect(deriveStatus(5, 21)).toBe("mastered");
    });

    it("boundary: repetitions exactly 2 is learning; exactly 3 is review", () => {
        expect(deriveStatus(2, 10)).toBe("learning");
        expect(deriveStatus(3, 10)).toBe("review");
    });
});

describe("computeNextSRS — Again (forgot)", () => {
    it("resets repetitions to 0 and interval to 1 day regardless of prior state", () => {
        const result = computeNextSRS({ easeFactor: 2.5, interval: 30, repetitions: 8 }, "Again");
        expect(result.repetitions).toBe(0);
        expect(result.interval).toBe(1);
    });

    it("lowers ease by 0.2, floored at the minimum (1.3)", () => {
        expect(
            computeNextSRS({ easeFactor: 2.0, interval: 1, repetitions: 0 }, "Again").easeFactor,
        ).toBe(1.8);
        expect(
            computeNextSRS({ easeFactor: 1.35, interval: 1, repetitions: 0 }, "Again").easeFactor,
        ).toBe(1.3);
        expect(
            computeNextSRS({ easeFactor: 1.3, interval: 1, repetitions: 0 }, "Again").easeFactor,
        ).toBe(1.3);
    });

    it("marks the grade as a mistake and derives 'new' status", () => {
        const result = computeNextSRS({ easeFactor: 2.5, interval: 10, repetitions: 5 }, "Again");
        expect(result.isMistake).toBe(true);
        expect(result.lastResult).toBe("Again");
        expect(result.status).toBe("new");
    });
});

describe("computeNextSRS — Hard (recalled with difficulty)", () => {
    it("does not change repetitions", () => {
        const result = computeNextSRS({ easeFactor: 2.5, interval: 10, repetitions: 4 }, "Hard");
        expect(result.repetitions).toBe(4);
    });

    it("shrinks the interval to 80%, rounded, floored at 1 day", () => {
        expect(
            computeNextSRS({ easeFactor: 2.5, interval: 10, repetitions: 4 }, "Hard").interval,
        ).toBe(8);
        expect(
            computeNextSRS({ easeFactor: 2.5, interval: 1, repetitions: 4 }, "Hard").interval,
        ).toBe(1);
        // 0.8 * 1 = 0.8, floored to the 1-day minimum, not rounded to 1 by luck.
        expect(
            computeNextSRS({ easeFactor: 2.5, interval: 1, repetitions: 0 }, "Hard").interval,
        ).toBe(1);
    });

    it("lowers ease by 0.15, floored at the minimum", () => {
        expect(
            computeNextSRS({ easeFactor: 1.4, interval: 5, repetitions: 2 }, "Hard").easeFactor,
        ).toBe(1.3);
    });

    it("marks the grade as a mistake", () => {
        expect(
            computeNextSRS({ easeFactor: 2.5, interval: 5, repetitions: 2 }, "Hard").isMistake,
        ).toBe(true);
    });
});

describe("computeNextSRS — Good (recalled correctly)", () => {
    it("the first Good after never studying sets interval to 1 day", () => {
        const result = computeNextSRS({ easeFactor: 2.5, interval: 0, repetitions: 0 }, "Good");
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);
    });

    it("the second Good (repetitions === 1) jumps straight to 6 days", () => {
        const result = computeNextSRS({ easeFactor: 2.5, interval: 1, repetitions: 1 }, "Good");
        expect(result.interval).toBe(6);
        expect(result.repetitions).toBe(2);
    });

    it("the third+ Good multiplies interval by ease factor", () => {
        const result = computeNextSRS({ easeFactor: 2.0, interval: 6, repetitions: 2 }, "Good");
        expect(result.interval).toBe(12); // round(6 * 2.0)
        expect(result.repetitions).toBe(3);
    });

    it("does not change ease factor", () => {
        const result = computeNextSRS({ easeFactor: 2.1, interval: 6, repetitions: 2 }, "Good");
        expect(result.easeFactor).toBe(2.1);
    });

    it("clears the mistake flag and enters review/mastered status once qualified", () => {
        const result = computeNextSRS({ easeFactor: 2.5, interval: 6, repetitions: 2 }, "Good");
        expect(result.isMistake).toBe(false);
        expect(result.status).toBe("review"); // repetitions becomes 3
    });
});

describe("computeNextSRS — Easy (recalled instantly)", () => {
    it("the first Easy after never studying sets interval to 1 day", () => {
        const result = computeNextSRS({ easeFactor: 2.5, interval: 0, repetitions: 0 }, "Easy");
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);
    });

    it("subsequent Easy multiplies interval by ease factor and a 1.3x bonus", () => {
        const result = computeNextSRS({ easeFactor: 2.0, interval: 6, repetitions: 2 }, "Easy");
        expect(result.interval).toBe(16); // round(6 * 2.0 * 1.3) = round(15.6)
        expect(result.repetitions).toBe(3);
    });

    it("raises ease by 0.15, capped at the maximum (2.5)", () => {
        expect(
            computeNextSRS({ easeFactor: 2.0, interval: 6, repetitions: 2 }, "Easy").easeFactor,
        ).toBe(2.15);
        expect(
            computeNextSRS({ easeFactor: 2.4, interval: 6, repetitions: 2 }, "Easy").easeFactor,
        ).toBe(2.5);
        expect(
            computeNextSRS({ easeFactor: 2.5, interval: 6, repetitions: 2 }, "Easy").easeFactor,
        ).toBe(2.5);
    });

    it("clears the mistake flag", () => {
        expect(
            computeNextSRS({ easeFactor: 2.5, interval: 6, repetitions: 2 }, "Easy").isMistake,
        ).toBe(false);
    });
});

describe("computeNextSRS — nextReviewAt", () => {
    it("schedules interval days ahead of now, in milliseconds", () => {
        const before = Date.now();
        const result = computeNextSRS({ easeFactor: 2.5, interval: 6, repetitions: 2 }, "Good");
        const after = Date.now();
        // interval becomes round(6 * 2.5) = 15 days
        const expectedMin = before + 15 * 86_400_000;
        const expectedMax = after + 15 * 86_400_000;
        expect(result.nextReviewAt).toBeGreaterThanOrEqual(expectedMin);
        expect(result.nextReviewAt).toBeLessThanOrEqual(expectedMax);
    });
});

describe("computeNextSRS — discrimination (catches a real regression)", () => {
    // Regression guard: an off-by-one that used interval - 1 instead of the
    // correct round(interval * 0.8) for Hard would still "run" without this
    // assertion — it must fail on the wrong arithmetic, not just execute.
    it("Hard's 80% reduction is exact, not off by one", () => {
        const result = computeNextSRS({ easeFactor: 2.5, interval: 10, repetitions: 4 }, "Hard");
        expect(result.interval).toBe(8);
        expect(result.interval).not.toBe(9); // the off-by-one this guards against
    });

    it("Good's second-repetition interval is exactly 6, not ease-multiplied", () => {
        // A plausible bug: always multiplying by ease, even at repetitions === 1.
        const result = computeNextSRS({ easeFactor: 2.5, interval: 1, repetitions: 1 }, "Good");
        expect(result.interval).toBe(6);
        expect(result.interval).not.toBe(3); // round(1 * 2.5) — the wrong formula
    });
});

describe("getNewCards / getDueCards / getMistakeCards", () => {
    const now = Date.now();
    const cards = [
        { id: "new", repetitions: 0, nextReviewAt: 0, isMistake: false },
        { id: "due", repetitions: 3, nextReviewAt: now - 1000, isMistake: false },
        { id: "future", repetitions: 3, nextReviewAt: now + 1_000_000, isMistake: false },
        { id: "mistake", repetitions: 2, nextReviewAt: now - 1000, isMistake: true },
    ];

    it("getNewCards returns only zero-repetition cards", () => {
        expect(getNewCards(cards).map((c) => c.id)).toEqual(["new"]);
    });

    it("getDueCards returns studied cards whose review time has passed, excluding new cards", () => {
        const due = getDueCards(cards).map((c) => c.id);
        expect(due).toContain("due");
        expect(due).toContain("mistake");
        expect(due).not.toContain("new"); // repetitions === 0 excluded even though nextReviewAt <= now
        expect(due).not.toContain("future");
    });

    it("getMistakeCards returns only isMistake-flagged cards, independent of due status", () => {
        expect(getMistakeCards(cards).map((c) => c.id)).toEqual(["mistake"]);
    });
});

describe("reinsertCard", () => {
    it("returns a new array — does not mutate the input", () => {
        const queue = [1, 2, 3, 4, 5];
        const original = [...queue];
        reinsertCard(queue, 0);
        expect(queue).toEqual(original);
    });

    it("moves the card 3-5 positions ahead of its original index", () => {
        const queue = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const result = reinsertCard(queue, 0);
        const newIndex = result.indexOf(0);
        expect(newIndex).toBeGreaterThanOrEqual(3);
        expect(newIndex).toBeLessThanOrEqual(5);
        expect(result).toHaveLength(queue.length);
    });

    it("clamps the insertion point to the end of the queue when near the tail", () => {
        const queue = ["a", "b", "c"];
        const result = reinsertCard(queue, 1); // "b", offset 3-5 would overflow
        expect(result).toHaveLength(3);
        expect(result[result.length - 1]).toBe("b");
    });

    it("is a no-op for a queue of length 0 or 1", () => {
        expect(reinsertCard([], 0)).toEqual([]);
        expect(reinsertCard(["only"], 0)).toEqual(["only"]);
    });

    it("preserves every original element (no drops, no duplicates)", () => {
        const queue = ["a", "b", "c", "d", "e", "f"];
        const result = reinsertCard(queue, 2);
        expect([...result].sort()).toEqual([...queue].sort());
    });
});
