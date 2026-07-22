import { describe, expect, it } from "vitest";

import {
    flattenNotificationGroups,
    isCollapsed,
    overflowCount,
    resolveNotificationLink,
    visibleActors,
} from "./format";
import { makeNotification } from "../__tests__/fixtures";

import type { NotificationGroup } from "../types";

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

describe("resolveNotificationLink", () => {
    it("prefers data.shareLink when present", () => {
        const n = makeNotification({ data: { shareLink: "/flashcard/shared/xyz" } });
        expect(resolveNotificationLink(n)).toBe("/flashcard/shared/xyz");
    });

    it("falls back to the notification's own link", () => {
        const n = makeNotification({ data: undefined, link: "/flashcard/deck1" });
        expect(resolveNotificationLink(n)).toBe("/flashcard/deck1");
    });

    it("falls back to /flashcard when neither is present", () => {
        const n = makeNotification({ data: undefined, link: undefined });
        expect(resolveNotificationLink(n)).toBe("/flashcard");
    });
});

describe("flattenNotificationGroups", () => {
    it("returns nothing for an empty group list", () => {
        expect(flattenNotificationGroups([])).toEqual([]);
    });

    it("emits one header followed by its group's rows, per group", () => {
        const groups: NotificationGroup[] = [
            {
                label: "Today",
                items: [makeNotification({ id: "a" }), makeNotification({ id: "b" })],
            },
            { label: "Earlier", items: [makeNotification({ id: "c" })] },
        ];
        const flat = flattenNotificationGroups(groups);

        expect(flat.map((f) => f.kind)).toEqual(["header", "row", "row", "header", "row"]);
        expect(flat[0]).toMatchObject({ kind: "header", label: "Today" });
        expect(flat[3]).toMatchObject({ kind: "header", label: "Earlier" });
        // Row order within a group is preserved.
        expect(flat.filter((f) => f.kind === "row").map((f) => f.notification.id)).toEqual([
            "a",
            "b",
            "c",
        ]);
    });

    it("flags first/last row per group independently, not across the whole list", () => {
        const groups: NotificationGroup[] = [
            {
                label: "Today",
                items: [makeNotification({ id: "a" }), makeNotification({ id: "b" })],
            },
            { label: "Earlier", items: [makeNotification({ id: "c" })] },
        ];
        const rows = flattenNotificationGroups(groups).filter((f) => f.kind === "row");

        expect(rows[0]).toMatchObject({ isFirstInGroup: true, isLastInGroup: false }); // a
        expect(rows[1]).toMatchObject({ isFirstInGroup: false, isLastInGroup: true }); // b
        // A lone item in its group is simultaneously first and last.
        expect(rows[2]).toMatchObject({ isFirstInGroup: true, isLastInGroup: true }); // c
    });

    it("keys rows by notification id and headers by label (stable across re-flattens)", () => {
        const groups: NotificationGroup[] = [
            { label: "Today", items: [makeNotification({ id: "a" })] },
        ];
        const flat = flattenNotificationGroups(groups);
        expect(flat[0].key).toBe("header:Today");
        expect(flat[1].key).toBe("a");
    });
});
