import { describe, expect, it } from "vitest";

import { emitNotificationInputSchema } from "./schema";

describe("emitNotificationInputSchema", () => {
    const comment = { kind: "comment", ownerId: "o", lessonId: "l", cardId: "c", commentId: "m" };

    it("accepts a valid comment input", () => {
        expect(emitNotificationInputSchema.parse(comment)).toEqual(comment);
    });

    it("accepts a valid reply input", () => {
        const reply = { ...comment, kind: "reply" };
        expect(emitNotificationInputSchema.parse(reply)).toEqual(reply);
    });

    it("rejects an unknown kind", () => {
        expect(() => emitNotificationInputSchema.parse({ ...comment, kind: "invite" })).toThrow();
    });

    it("rejects a missing identifier", () => {
        const { cardId: _drop, ...missing } = comment;
        void _drop;
        expect(() => emitNotificationInputSchema.parse(missing)).toThrow();
    });

    it("rejects an empty identifier", () => {
        expect(() => emitNotificationInputSchema.parse({ ...comment, ownerId: "" })).toThrow();
    });

    it("STRIPS client-supplied senderId/recipientId (server derives them)", () => {
        const parsed = emitNotificationInputSchema.parse({
            ...comment,
            senderId: "forged",
            recipientId: "victim",
        });
        expect(parsed).not.toHaveProperty("senderId");
        expect(parsed).not.toHaveProperty("recipientId");
    });

    it("accepts comment_resolved / invite_accepted / deck_duplicated", () => {
        expect(() =>
            emitNotificationInputSchema.parse({ ...comment, kind: "comment_resolved" }),
        ).not.toThrow();
        expect(() =>
            emitNotificationInputSchema.parse({
                kind: "invite_accepted",
                ownerId: "o",
                lessonId: "l",
            }),
        ).not.toThrow();
        expect(() =>
            emitNotificationInputSchema.parse({
                kind: "deck_duplicated",
                ownerId: "o",
                lessonId: "l",
            }),
        ).not.toThrow();
    });

    it("role_change requires targetUserId + newRole", () => {
        expect(() =>
            emitNotificationInputSchema.parse({
                kind: "role_change",
                ownerId: "o",
                lessonId: "l",
                targetUserId: "t",
                newRole: "editor",
            }),
        ).not.toThrow();
        // missing newRole
        expect(() =>
            emitNotificationInputSchema.parse({
                kind: "role_change",
                ownerId: "o",
                lessonId: "l",
                targetUserId: "t",
            }),
        ).toThrow();
    });

    it("access_revoked requires targetUserId", () => {
        expect(() =>
            emitNotificationInputSchema.parse({
                kind: "access_revoked",
                ownerId: "o",
                lessonId: "l",
                targetUserId: "t",
            }),
        ).not.toThrow();
    });
});
