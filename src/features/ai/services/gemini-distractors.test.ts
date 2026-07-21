/**
 * @file gemini-distractors.test.ts
 * Unit tests for Match mode's decoy-tile generation (T-117e) — the network
 * call is mocked (`generateContent`), but the real semantic-filtering,
 * clamping, and fallback-padding logic all run for real. A bug here shows
 * as duplicate or nonsensical tiles on the Match board, a visible UX defect.
 */
import { describe, expect, it, vi } from "vitest";

import { generateMatchDistractors } from "./gemini-distractors";
import { generateContent } from "./gemini-transport";

vi.mock("./gemini-transport", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./gemini-transport")>();
    return { ...actual, generateContent: vi.fn() };
});

const mockedGenerateContent = vi.mocked(generateContent);

const FALLBACKS_JAPANESE = [
    "シート",
    "ツール",
    "ぬいぐるみ",
    "めがね",
    "あさ",
    "ばん",
    "みず",
    "おちゃ",
    "ほん",
    "ぺん",
    "いえ",
    "くるま",
];
const FALLBACKS_ENGLISH = [
    "Table",
    "Chair",
    "Phone",
    "Watch",
    "Tree",
    "Road",
    "Sky",
    "Cloud",
    "Apple",
    "Bread",
    "City",
    "Home",
];

describe("generateMatchDistractors", () => {
    it("clamps count to a minimum of 1", async () => {
        mockedGenerateContent.mockResolvedValue('{"distractors": []}');
        const result = await generateMatchDistractors([{ primary: "cat", meaning: "m" }], 0);
        expect(result).toHaveLength(1);
    });

    it("clamps count to a maximum of 24", async () => {
        mockedGenerateContent.mockResolvedValue('{"distractors": []}');
        const result = await generateMatchDistractors([{ primary: "cat", meaning: "m" }], 100);
        expect(result).toHaveLength(24);
    });

    it("excludes an AI-suggested distractor that collides with an input card's own primary", async () => {
        mockedGenerateContent.mockResolvedValue(
            JSON.stringify({ distractors: ["cat", "unique-decoy"] }),
        );
        const result = await generateMatchDistractors([{ primary: "cat", meaning: "feline" }], 2);
        expect(result).not.toContain("cat");
        expect(result).toContain("unique-decoy");
    });

    it("excludes a distractor that collides with an input card's alternatives or meaning", async () => {
        mockedGenerateContent.mockResolvedValue(
            JSON.stringify({ distractors: ["neko", "feline", "unique-decoy"] }),
        );
        const result = await generateMatchDistractors(
            [{ primary: "cat", alternatives: ["neko"], meaning: "feline" }],
            3,
        );
        expect(result).not.toContain("neko");
        expect(result).not.toContain("feline");
        expect(result).toContain("unique-decoy");
    });

    it("falls back to the hardcoded word lists when the AI response is unparseable", async () => {
        mockedGenerateContent.mockResolvedValue("not valid json at all");
        const result = await generateMatchDistractors([{ primary: "cat", meaning: "m" }], 3);
        expect(result).toHaveLength(3);
        result.forEach((word) => {
            expect([...FALLBACKS_ENGLISH, ...FALLBACKS_JAPANESE]).toContain(word);
        });
    });

    it("pads with 'Item N' placeholders once the AI result and every fallback word are exhausted", async () => {
        mockedGenerateContent.mockResolvedValue('{"distractors": []}');
        // Block every single fallback candidate via the input cards' meanings.
        const blockingCards = [...FALLBACKS_ENGLISH, ...FALLBACKS_JAPANESE].map((word) => ({
            primary: "x",
            meaning: word,
        }));
        const result = await generateMatchDistractors(blockingCards, 2);
        expect(result).toEqual(["Item 1", "Item 2"]);
    });

    it("never returns fewer than the requested count, even on a transport error", async () => {
        mockedGenerateContent.mockRejectedValue(new Error("network down"));
        const result = await generateMatchDistractors([{ primary: "cat", meaning: "m" }], 5);
        expect(result).toHaveLength(5);
    });
});
