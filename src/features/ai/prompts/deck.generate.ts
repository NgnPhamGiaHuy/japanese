import { AI_SYSTEM_PROMPT } from "./shared";
import { DECK_JSON_SCHEMA } from "../schemas";

import type { JLPTLevel } from "../types";

function getLevelNote(level: JLPTLevel): string {
    switch (level) {
        case "N5": return "JLPT N5 — everyday beginner vocabulary (difficulty: 1)";
        case "N4": return "JLPT N4 — elementary vocabulary (difficulty: 2)";
        case "N3": return "JLPT N3 — intermediate vocabulary (difficulty: 3)";
        case "N2": return "JLPT N2 — upper-intermediate vocabulary (difficulty: 3)";
        default:   return "a balanced mix of N5–N3 vocabulary (vary difficulty 1–3)";
    }
}

const buildDeckPrompt = (
    topic: string,
    count: number,
    level: JLPTLevel,
    existingWords: string[] = [],
): string => {
    const exclusionBlock =
        existingWords.length > 0
            ? `\nDo NOT include these words (already in the deck):\n${existingWords.slice(0, 200).map((w) => `- ${w}`).join("\n")}\n`
            : "";

    return `${AI_SYSTEM_PROMPT}

Generate exactly ${count} Japanese flashcards for the topic: "${topic}"
Level: ${getLevelNote(level)}
${exclusionBlock}
Return a JSON array of ${count} objects. Each object must match this exact structure:
${DECK_JSON_SCHEMA}

Field rules (apply to every card):

kanaPrimary (REQUIRED):
  - BEGINNER RULE (N5/N4): MUST be Hiragana only. Do not use Katakana unless the word is a loanword.
  - SCRIPT: Hiragana or Katakana ONLY. 
  - ABSOLUTE BAN: NEVER use Kanji (e.g., "一") in this field. NEVER use Romaji.
  - This field is for pure Japanese script. For "one", use "いち", not "一".
  - If input is Kanji, you MUST convert it to Hiragana for this field for beginners.

altForm (OPTIONAL):
  - difficulty 1–2 (N5/N4): ROMAJI reading. Example: "taberu", "ohayou"
  - difficulty 3 (N3+): KANJI form if one exists. Example: "食べる"
  - Empty string if the word is kana-only with no useful kanji.
  - NEVER put romaji in kanaPrimary.

furigana (OPTIONAL):
  - Include ONLY when altForm contains kanji characters.
  - Hiragana reading of the kanji. Empty string otherwise.

meaning:
  - Concise English, 2–8 words, no trailing period.

example:
  - Format: "kana sentence - English translation"
  - Japanese: kana only (no kanji), 8–25 characters, natural sentence.
  - English: 3–10 words.

distractors:
  - Exactly 3 wrong English meanings, same semantic domain, plausible but incorrect.

hint:
  - One English mnemonic ≤12 words. Sound-alike tricks preferred.

usageNote:
  - Short grammar/register note, or empty string.

difficulty:
  - 1 = N5, 2 = N4, 3 = N3+

Additional rules:
  - Vary word types: nouns, verbs, adjectives, expressions.
  - No duplicates within the array.
  - Return exactly ${count} objects — no more, no less.`;
};

export default buildDeckPrompt;
