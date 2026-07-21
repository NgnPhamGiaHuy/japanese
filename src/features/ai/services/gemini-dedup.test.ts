/**
 * @file gemini-dedup.test.ts
 * Unit tests for the pure deck-generation dedup helpers (T-117e). No network
 * dependency — a bug here silently produces duplicate flashcards in a
 * generated deck, which is exactly the risk ADR-117 wants pinned.
 */
import { describe, expect, it } from "vitest";

import { dedupeDeckCards, normalizeToken } from "./gemini-dedup";

import type { GeneratedCard } from "../types";

function card(primary: string, alternatives: string[] = []): GeneratedCard {
    return { primary, alternatives, meaning: `meaning of ${primary}`, example: "e" };
}

describe("normalizeToken", () => {
    it("trims whitespace and lowercases", () => {
        expect(normalizeToken("  Neko  ")).toBe("neko");
    });

    it("is locale-aware casing (not just ASCII toLowerCase)", () => {
        expect(normalizeToken("İstanbul")).toBe("İstanbul".toLocaleLowerCase());
    });
});

describe("dedupeDeckCards", () => {
    it("keeps cards with no collision against existing words or each other", () => {
        const result = dedupeDeckCards([card("cat"), card("dog")], ["bird"]);
        expect(result.map((c) => c.primary)).toEqual(["cat", "dog"]);
    });

    it("drops a card whose primary collides with an existing word (case/whitespace-insensitive)", () => {
        const result = dedupeDeckCards([card("Cat"), card("dog")], ["  cat  "]);
        expect(result.map((c) => c.primary)).toEqual(["dog"]);
    });

    it("drops a card whose ALTERNATIVE (not primary) collides with an existing word", () => {
        const result = dedupeDeckCards([card("neko", ["cat"])], ["cat"]);
        expect(result).toEqual([]);
    });

    it("drops a later duplicate within the same incoming batch, keeping the first occurrence", () => {
        const result = dedupeDeckCards([card("cat"), card("Cat")], []);
        expect(result.map((c) => c.primary)).toEqual(["cat"]);
    });

    it("a card's own alternatives colliding with an EARLIER card's primary in the same batch are also dropped", () => {
        const result = dedupeDeckCards([card("cat"), card("neko", ["cat"])], []);
        expect(result.map((c) => c.primary)).toEqual(["cat"]);
    });

    it("tolerates missing/empty alternatives and blank existing words without throwing", () => {
        const result = dedupeDeckCards([card("cat")], ["", "  "]);
        expect(result.map((c) => c.primary)).toEqual(["cat"]);
    });

    it("returns an empty array when every card collides", () => {
        expect(dedupeDeckCards([card("cat")], ["cat"])).toEqual([]);
    });
});
