import { describe, expect, it } from "vitest";

import { collapseKeyOf, NOTIFICATION_REGISTRY, policyOf } from "./registry";

import type { NotificationInput, NotificationKind } from "./events";

// The full set the platform declares — keep in sync with NotificationKind.
const ALL_KINDS: NotificationKind[] = [
    "invite",
    "invite_accepted",
    "invite_declined",
    "role_change",
    "access_revoked",
    "comment",
    "reply",
    "comment_resolved",
    "deck_updated",
    "deck_deleted",
    "deck_duplicated",
    "privacy_changed",
    "content_removed",
    "overtaken",
    "leaderboard_top3",
    "achievement",
];

describe("NOTIFICATION_REGISTRY — completeness & shape", () => {
    it("has an entry for every declared kind", () => {
        for (const kind of ALL_KINDS) {
            expect(NOTIFICATION_REGISTRY[kind], `missing registry entry for ${kind}`).toBeDefined();
        }
    });

    it("has no extra entries beyond the declared kinds", () => {
        expect(Object.keys(NOTIFICATION_REGISTRY).sort()).toEqual([...ALL_KINDS].sort());
    });

    it("uses only valid priority and category values", () => {
        for (const kind of ALL_KINDS) {
            expect(["P0", "P1", "P2"]).toContain(policyOf(kind).priority);
            expect(["collaboration", "system", "social", "achievement"]).toContain(
                policyOf(kind).category,
            );
        }
    });

    it("marks exactly the wired kinds active", () => {
        const active = ALL_KINDS.filter((k) => NOTIFICATION_REGISTRY[k].active);
        expect(active).toEqual([
            "invite",
            "invite_accepted",
            "role_change",
            "access_revoked",
            "comment",
            "reply",
            "comment_resolved",
            "deck_duplicated",
            "content_removed",
        ]);
    });

    it("leaves not-yet-wired kinds inactive", () => {
        for (const kind of [
            "invite_declined",
            "deck_updated",
            "deck_deleted",
            "privacy_changed",
            "overtaken",
            "leaderboard_top3",
            "achievement",
        ] as NotificationKind[]) {
            expect(NOTIFICATION_REGISTRY[kind].active).toBe(false);
        }
    });

    it("keeps direct-address kinds at P0 (badge-worthy)", () => {
        for (const kind of [
            "invite",
            "comment",
            "reply",
            "content_removed",
        ] as NotificationKind[]) {
            expect(policyOf(kind).priority).toBe("P0");
        }
    });
});

describe("collapseKeyOf — object-scoped grouping tokens", () => {
    const base: NotificationInput = {
        kind: "comment",
        recipientId: "owner",
        senderId: "commenter",
        lessonId: "L1",
        cardId: "C1",
    };

    it("comment collapses per (lesson, card)", () => {
        expect(collapseKeyOf(base)).toBe("comment:L1:C1");
        // A second comment on the SAME card yields the SAME token → collapses.
        expect(collapseKeyOf({ ...base, senderId: "other" })).toBe("comment:L1:C1");
    });

    it("reply collapses per parent comment", () => {
        expect(collapseKeyOf({ ...base, kind: "reply", commentId: "cm9" })).toBe("reply:cm9");
    });

    it("invite dedups per lesson (not a grouping kind)", () => {
        expect(policyOf("invite").collapses).toBe(false);
        expect(collapseKeyOf({ ...base, kind: "invite" })).toBe("invite:L1");
    });

    it("deck_updated collapses per (lesson, actor) so bursts fold per editor", () => {
        expect(collapseKeyOf({ ...base, kind: "deck_updated", senderId: "editorX" })).toBe(
            "deck_updated:L1:editorX",
        );
    });
});
