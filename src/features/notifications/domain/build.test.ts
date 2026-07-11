import { describe, expect, it } from "vitest";

import { base64UrlSafe, contentFor, mergeActors, shareLinkFor } from "./build";

describe("base64UrlSafe / shareLinkFor", () => {
    it("is URL-safe (no +, /, or = padding)", () => {
        const out = base64UrlSafe("user_123:lesson_456");
        expect(out).not.toMatch(/[+/=]/);
    });

    it("matches the flashcard buildShareId transform", () => {
        // Reference impl: btoa(`${ownerId}:${lessonId}`) with +/= → -_ stripped.
        const raw = Buffer.from("owner:lesson", "utf8").toString("base64");
        const expected = raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        expect(base64UrlSafe("owner:lesson")).toBe(expected);
    });

    it("builds the shared deck link", () => {
        expect(shareLinkFor("owner", "lesson")).toBe(
            `/flashcard/shared/${base64UrlSafe("owner:lesson")}`,
        );
    });
});

describe("contentFor", () => {
    it("builds comment copy", () => {
        expect(contentFor("comment", "Kenji", "JLPT N5")).toEqual({
            title: "New comment",
            message: 'Kenji commented in "JLPT N5"',
        });
    });

    it("builds reply copy", () => {
        expect(contentFor("reply", "Aki", "Verbs")).toEqual({
            title: "New reply",
            message: 'Aki replied to your comment in "Verbs"',
        });
    });

    it("falls back on blank sender/deck", () => {
        expect(contentFor("comment", "", "")).toEqual({
            title: "New comment",
            message: 'Someone commented in "a deck"',
        });
    });

    it("includes the new role in role_change copy", () => {
        expect(contentFor("role_change", "Owner", "Deck", { role: "editor" })).toEqual({
            title: "Access updated",
            message: 'Owner changed your role to editor in "Deck"',
        });
    });

    it("omits the role phrase when no role is supplied", () => {
        expect(contentFor("role_change", "Owner", "Deck").message).toBe(
            'Owner changed your role in "Deck"',
        );
    });

    it("builds content_removed / deck_duplicated copy", () => {
        expect(contentFor("content_removed", "", "My Deck").message).toBe(
            'An administrator removed "My Deck"',
        );
        expect(contentFor("deck_duplicated", "Aki", "My Deck").message).toBe(
            'Aki saved a copy of "My Deck"',
        );
    });
});

describe("mergeActors", () => {
    const a = { uid: "a", name: "A" };
    const b = { uid: "b", name: "B" };
    const c = { uid: "c", name: "C" };

    it("puts the newest actor first", () => {
        expect(mergeActors([a], b).map((x) => x.uid)).toEqual(["b", "a"]);
    });

    it("dedups by uid (re-commenter moves to front, no duplicate)", () => {
        expect(mergeActors([a, b], a).map((x) => x.uid)).toEqual(["a", "b"]);
    });

    it("caps the stack", () => {
        const many = [a, b, c, { uid: "d" }, { uid: "e" }];
        expect(mergeActors(many, { uid: "f" }, 5)).toHaveLength(5);
        expect(mergeActors(many, { uid: "f" }, 5)[0].uid).toBe("f");
    });
});
