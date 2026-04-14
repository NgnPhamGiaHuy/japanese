import { AI_SYSTEM_PROMPT } from "./shared";
import { CARD_JSON_SCHEMA } from "../schemas";

const buildCardPrompt = (word: string): string => {
    return `${AI_SYSTEM_PROMPT}

Task: Generate complete flashcard data for the Japanese word or phrase: "${word}".

Output JSON schema:
${CARD_JSON_SCHEMA}

Field rules:
- kanaPrimary: REQUIRED. Always the natural spoken/kana form (e.g. "たべる", "おはよう").
  This is the primary learning anchor — always prioritize natural spoken Japanese.
- kanji: OPTIONAL. The alternative form shown as a subtitle to help learners.
  Rule: if difficulty is 1 or 2 (N5/N4), use ROMAJI (e.g. "taberu", "ohayou").
  Rule: if difficulty is 3 (N3 and above), use KANJI (e.g. "食べる") if the word has one.
  Omit entirely if neither adds value.
- furigana: hiragana reading; only include when kanji field contains actual kanji characters.
- meaning: concise English meaning, 2–8 words, no trailing period.
- example: one short, natural Japanese sentence (8–25 characters) using this word, followed by " - " and its English translation.
  Format: "Japanese sentence - English translation" (e.g. "りんごをたべる - I eat an apple").
  ALWAYS write the Japanese part in kana only — do NOT use kanji in the example sentence.
  Keep the Japanese part 8–25 characters. Keep the English translation concise (3–10 words).
- distractors: exactly 3 plausible but WRONG English meanings for a multiple-choice quiz.
  Pick meanings from the same semantic domain. They must be wrong but believable.
- hint: one memorable mnemonic or memory hook in English, ≤12 words.
  Use sound-alike tricks ("ta-BEru = TABle → eat at a table"), visual imagery, or context clues.
- usageNote: one phrase describing grammar/register context. Return empty string if nothing notable.
- difficulty: integer — 1 (everyday N5), 2 (intermediate N4), 3 (advanced N3 and above).`;
};

export default buildCardPrompt;
