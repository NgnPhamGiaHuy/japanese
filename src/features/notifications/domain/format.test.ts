import { describe, expect, it } from "vitest";

import { formatRelativeTime, isCollapsed, overflowCount, visibleActors } from "./format";

const NOW = 1_700_000_000_000;

describe("formatRelativeTime", () => {
    it('reads "just now" under a minute', () => {
        expect(formatRelativeTime(NOW - 30_000, NOW)).toBe("just now");
    });

    it("counts minutes and hours", () => {
        expect(formatRelativeTime(NOW - 5 * 60_000, NOW)).toBe("5m ago");
        expect(formatRelativeTime(NOW - 3 * 3_600_000, NOW)).toBe("3h ago");
    });

    it("counts days under a week", () => {
        expect(formatRelativeTime(NOW - 2 * 86_400_000, NOW)).toBe("2d ago");
    });

    it("falls back to an absolute date beyond a week (no 'ago')", () => {
        const out = formatRelativeTime(NOW - 30 * 86_400_000, NOW);
        expect(out).not.toContain("ago");
        expect(out.length).toBeGreaterThan(0);
    });

    it("ticks: the same ts formats differently as now advances", () => {
        const ts = NOW;
        expect(formatRelativeTime(ts, NOW + 30_000)).toBe("just now");
        expect(formatRelativeTime(ts, NOW + 5 * 60_000)).toBe("5m ago");
    });
});

describe("collapsed-notification display", () => {
    const actors = [{ uid: "a" }, { uid: "b" }, { uid: "c" }, { uid: "d" }];

    it("shows up to `max` avatars", () => {
        expect(visibleActors(actors, 3).map((a) => a.uid)).toEqual(["a", "b", "c"]);
        expect(visibleActors(undefined)).toEqual([]);
    });

    it("computes the +N overflow from count when present", () => {
        // 10 total events, 4 distinct actors, showing 3 → +7
        expect(overflowCount(10, actors, 3)).toBe(7);
    });

    it("falls back to actor count when count is absent", () => {
        expect(overflowCount(undefined, actors, 3)).toBe(1); // 4 actors, show 3 → +1
    });

    it("never goes negative", () => {
        expect(overflowCount(1, [{ uid: "a" }], 3)).toBe(0);
    });

    it("isCollapsed reflects count > 1", () => {
        expect(isCollapsed(1)).toBe(false);
        expect(isCollapsed(undefined)).toBe(false);
        expect(isCollapsed(3)).toBe(true);
    });
});
