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
- kanaPrimary: REQUIRED. Always the natural spoken/kana form (e.g. "たべる", "おはよう").
  Prioritize natural spoken Japanese — this is the primary learning anchor.
- kanji: OPTIONAL. The alternative form shown as a subtitle to help learners.
  Rule: if difficulty is 1 or 2 (N5/N4), use ROMAJI (e.g. "taberu", "ohayou").
  Rule: if difficulty is 3 (N3 and above), use KANJI (e.g. "食べる") if the word has one.
  Omit if neither adds value.
- furigana: hiragana reading; only include when kanji field contains actual kanji characters.
- meaning: concise English meaning, 2–8 words, no trailing period.
- example: one short, natural Japanese sentence (8–25 characters) using the target word, followed by " - " and its English translation.
  Format: "Japanese sentence - English translation" (e.g. "りんごをたべる - I eat an apple").
  ALWAYS write the Japanese part in kana only — do NOT use kanji in the example sentence.
  Keep the Japanese part 8–25 characters. Keep the English translation concise (3–10 words).
- distractors: exactly 3 plausible but WRONG English meanings for a multiple-choice quiz.
  Same semantic domain as the correct meaning — confusable but clearly incorrect.
- hint: one memorable mnemonic or memory hook in English, ≤12 words.
- usageNote: brief usage/grammar note or empty string.
- difficulty: 1 (common N5), 2 (intermediate N4), 3 (advanced N3 and above).
- Vary word types across the deck: nouns, verbs, adjectives, expressions.
- No duplicates; return exactly ${count} objects in the array.`;
};

export default buildDeckPrompt;
