import { AI_SYSTEM_PROMPT } from "./shared";
import { DECK_JSON_SCHEMA } from "../schemas";

import type { JLPTLevel } from "../types";

function getLevelNote(level: JLPTLevel): string {
    return level === "General"
        ? "a balanced mix of JLPT N5–N3 vocabulary"
        : `JLPT ${level} vocabulary`;
}

const buildDeckPrompt = (
    topic: string,
    count: number,
    level: JLPTLevel,
    existingWords: string[] = [],
): string => {
    const exclusionBlock =
        existingWords.length > 0
            ? `

Already in current deck (DO NOT generate these exact words again):
${existingWords
    .slice(0, 200)
    .map((word) => `- ${word}`)
    .join("\n")}
`
            : "";

    return `${AI_SYSTEM_PROMPT}

Task: Generate exactly ${count} unique Japanese flashcards for topic "${topic}".
Target level: ${getLevelNote(level)}.
${exclusionBlock}

Output JSON schema:
${DECK_JSON_SCHEMA}

Field rules:
- kanji: most common written form.
- furigana: hiragana/katakana only; empty string if the word is already all kana.
- meaning: concise English meaning, 2–8 words, no trailing period.
- example: short natural Japanese sentence (8–25 characters) using the target word.
- distractors: exactly 3 plausible but WRONG English meanings for a multiple-choice quiz.
  Same semantic domain as the correct meaning — confusable but clearly incorrect.
- hint: one memorable mnemonic or memory hook in English, ≤12 words.
- usageNote: brief usage/grammar note or empty string.
- difficulty: 1 (common N5), 2 (intermediate N4–N3), 3 (advanced N2+).
- Vary word types across the deck: nouns, verbs, adjectives, expressions.
- No duplicates; return exactly ${count} objects in the array.`;
};

export default buildDeckPrompt;
