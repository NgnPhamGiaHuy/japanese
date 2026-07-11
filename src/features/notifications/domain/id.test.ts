import { describe, expect, it } from "vitest";

import { collapseId, cyrb53 } from "./id";

import type { NotificationInput } from "./events";

const comment = (over: Partial<NotificationInput> = {}): NotificationInput => ({
    kind: "comment",
    recipientId: "owner",
    senderId: "commenter",
    lessonId: "L1",
    cardId: "C1",
    ...over,
});

describe("cyrb53", () => {
    it("is deterministic", () => {
        expect(cyrb53("hello")).toBe(cyrb53("hello"));
    });

    it("varies with input and seed", () => {
        expect(cyrb53("hello")).not.toBe(cyrb53("world"));
        expect(cyrb53("hello", 1)).not.toBe(cyrb53("hello", 2));
    });
});

describe("collapseId — deterministic, collapsing doc IDs", () => {
    it("is stable for the same logical notification (idempotency backbone)", () => {
        expect(collapseId(comment())).toBe(collapseId(comment()));
    });

    it("collapses different actors on the same object to the SAME doc", () => {
        // Two people commenting on the same card → one collapsed inbox doc.
        expect(collapseId(comment({ senderId: "a" }))).toBe(collapseId(comment({ senderId: "b" })));
    });

    it("separates different recipients (no shared collapse doc across users)", () => {
        expect(collapseId(comment({ recipientId: "u1" }))).not.toBe(
            collapseId(comment({ recipientId: "u2" })),
        );
    });

    it("separates different objects (card C1 vs C2)", () => {
        expect(collapseId(comment({ cardId: "C1" }))).not.toBe(
            collapseId(comment({ cardId: "C2" })),
        );
    });

    it("separates different kinds on the same object", () => {
        expect(collapseId(comment({ kind: "comment" }))).not.toBe(
            collapseId(comment({ kind: "deck_updated" })),
        );
    });

    it("produces a Firestore-safe id (n_ prefix, no slashes)", () => {
        const id = collapseId(comment());
        expect(id).toMatch(/^n_[0-9a-z]+$/);
        expect(id).not.toContain("/");
    });

    it("has no collisions across a large synthetic recipient set", () => {
        const ids = new Set<string>();
        for (let i = 0; i < 5000; i++) ids.add(collapseId(comment({ recipientId: `u${i}` })));
        expect(ids.size).toBe(5000);
    });
});
