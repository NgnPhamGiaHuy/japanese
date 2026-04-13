import { AI_SYSTEM_PROMPT } from "./shared";
import { CARD_JSON_SCHEMA } from "../schemas";

const buildCardPrompt = (word: string): string => {
    return `${AI_SYSTEM_PROMPT}

Task: Generate complete flashcard data for the Japanese word or phrase: "${word}".

Output JSON schema:
${CARD_JSON_SCHEMA}

Field rules:
- kanji: most common written form; if input is already correct, keep it.
- furigana: hiragana/katakana reading only; omit (empty string) if the word is already all kana.
- meaning: concise English meaning, 2–8 words, no trailing period.
- example: one short, natural Japanese sentence (8–25 characters) using this word.
- distractors: exactly 3 plausible but WRONG English meanings for a multiple-choice quiz.
  Pick meanings from the same semantic domain (e.g. if the word is a food verb, use other food verbs).
  They must be wrong but believable — good for testing.
- hint: one memorable mnemonic or memory hook in English, ≤12 words.
  Use sound-alike tricks ("ta-BEru = TABle → eat at a table"), visual imagery, or context clues.
- usageNote: one phrase describing grammar/register context (e.g. "casual speech", "used with に particle",
  "counter for flat objects"). Return empty string if nothing notable.
- difficulty: integer — 1 (everyday N5 word), 2 (intermediate N4–N3), 3 (advanced N2+).`;
};

export default buildCardPrompt;
