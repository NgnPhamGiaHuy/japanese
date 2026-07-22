import { describe, expect, it } from "vitest";

import { collapseKeyOf, NOTIFICATION_REGISTRY, policyOf } from "./registry";

import type { NotificationInput, NotificationKind } from "./events";

// The full set the platform declares — keep in sync with NotificationKind.
const ALL_KINDS: NotificationKind[] = [
    "invite",
    "invite_accepted",
    "role_change",
    "access_revoked",
    "comment",
    "reply",
    "comment_resolved",
    "deck_duplicated",
    "content_removed",
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

    it("marks every declared kind active (T-119a: the 7 dormant kinds are gone, not just unwired)", () => {
        for (const kind of ALL_KINDS) {
            expect(NOTIFICATION_REGISTRY[kind].active, `${kind} should be active`).toBe(true);
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
});
