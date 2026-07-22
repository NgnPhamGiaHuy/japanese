import { describe, expect, it } from "vitest";

import { buildDistractors } from "./kanaDistractors";

import type { KanaChar } from "../types";

/**
 * With hiragana + katakana combined (AlphabetMode "both"), two different
 * characters can share a romaji reading — buildDistractors must dedupe on
 * romaji so the rendered multiple-choice options are never a visible
 * duplicate (e.g. two "ko" buttons for one こ/か question).
 */
describe("buildDistractors", () => {
    it("never returns two distractors with the same romaji (primary visual/phonetic pool)", () => {
        const target: KanaChar = { char: "T", romaji: "ta", group: "test-row" };
        const dataset: KanaChar[] = [
            target,
            { char: "A1", romaji: "ki", group: "test-row" },
            { char: "A2", romaji: "ko", group: "test-row" },
            { char: "A3", romaji: "ko", group: "test-row" }, // collides with A2
            { char: "A4", romaji: "su", group: "test-row" },
            { char: "A5", romaji: "me", group: "test-row" },
        ];

        for (let i = 0; i < 50; i++) {
            const distractors = buildDistractors(target, dataset);
            const romajiValues = distractors.map((d) => d.romaji);

            expect(distractors).toHaveLength(3);
            expect(new Set(romajiValues).size).toBe(romajiValues.length);
            expect(romajiValues).not.toContain(target.romaji);
        }
    });

    it("never returns two distractors with the same romaji (fallback top-up pool)", () => {
        const target: KanaChar = { char: "T2", romaji: "ta", group: "lonely-row" };
        const dataset: KanaChar[] = [
            target,
            { char: "B1", romaji: "ki", group: "lonely-row" }, // only same-group match
            { char: "C1", romaji: "ko", group: "other-row" },
            { char: "C2", romaji: "ko", group: "other-row" }, // collides with C1
            { char: "C3", romaji: "su", group: "other-row" },
            { char: "C4", romaji: "me", group: "other-row" },
        ];

        for (let i = 0; i < 50; i++) {
            const distractors = buildDistractors(target, dataset);
            const romajiValues = distractors.map((d) => d.romaji);

            expect(distractors).toHaveLength(3);
            expect(new Set(romajiValues).size).toBe(romajiValues.length);
            expect(romajiValues).not.toContain(target.romaji);
        }
    });
});
