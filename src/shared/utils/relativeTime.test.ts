import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "./relativeTime";

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
