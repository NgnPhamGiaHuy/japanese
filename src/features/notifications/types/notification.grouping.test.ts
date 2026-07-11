import { describe, expect, it } from "vitest";

import { groupNotificationsByTime, isUnread } from "./index";
import {
    makeAncientNotification,
    makeLegacyReadNotification,
    makeNotification,
    resetFixtureSeq,
} from "../__tests__/fixtures";

describe("isUnread — handles all three doc shapes", () => {
    it("v2 docs: reads `status`", () => {
        expect(isUnread(makeNotification({ status: "unread" }))).toBe(true);
        expect(isUnread(makeNotification({ status: "read" }))).toBe(false);
    });

    it("legacy docs: falls back to `read` boolean", () => {
        expect(isUnread(makeLegacyReadNotification(false))).toBe(true);
        expect(isUnread(makeLegacyReadNotification(true))).toBe(false);
    });

    it("ancient docs (neither field): treated as read", () => {
        expect(isUnread(makeAncientNotification())).toBe(false);
    });
});

describe("groupNotificationsByTime — calendar-aware buckets", () => {
    it("buckets Today / Yesterday / Earlier against an injected reference", () => {
        resetFixtureSeq();
        // Reference: 2025-03-15 12:00 local.
        const reference = new Date(2025, 2, 15, 12, 0, 0);
        const today = makeNotification({ createdAt: new Date(2025, 2, 15, 8, 0, 0).getTime() });
        const yesterday = makeNotification({
            createdAt: new Date(2025, 2, 14, 23, 0, 0).getTime(),
        });
        const earlier = makeNotification({ createdAt: new Date(2025, 2, 10, 12, 0, 0).getTime() });

        const groups = groupNotificationsByTime([today, yesterday, earlier], reference);
        const byLabel = Object.fromEntries(groups.map((g) => [g.label, g.items.length]));

        expect(byLabel.Today).toBe(1);
        expect(byLabel.Yesterday).toBe(1);
        expect(byLabel.Earlier).toBe(1);
    });

    it("omits empty buckets", () => {
        const reference = new Date(2025, 2, 15, 12, 0, 0);
        const today = makeNotification({ createdAt: new Date(2025, 2, 15, 8, 0, 0).getTime() });
        const groups = groupNotificationsByTime([today], reference);
        expect(groups.map((g) => g.label)).toEqual(["Today"]);
    });

    it("puts a notification from just after local midnight into Today, not Yesterday", () => {
        // Regression for the old fixed `todayMs - 86_400_000` math: an item at
        // 00:30 today must be Today regardless of DST.
        const reference = new Date(2025, 2, 15, 0, 45, 0);
        const justAfterMidnight = makeNotification({
            createdAt: new Date(2025, 2, 15, 0, 30, 0).getTime(),
        });
        const groups = groupNotificationsByTime([justAfterMidnight], reference);
        expect(groups).toHaveLength(1);
        expect(groups[0].label).toBe("Today");
    });
});
