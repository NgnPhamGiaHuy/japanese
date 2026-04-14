import { AI_SYSTEM_PROMPT } from "./shared";
import { CARD_JSON_SCHEMA } from "../schemas";

const buildCardPrompt = (word: string): string => {
    return `${AI_SYSTEM_PROMPT}

Generate a flashcard for the Japanese word: "${word}"

Return a single JSON object matching this exact structure (use real values, not these descriptions):
${CARD_JSON_SCHEMA}

Field rules:

kanaPrimary (REQUIRED):
  - BEGINNER RULE (N5/N4): MUST be Hiragana only. Do not use Katakana unless the word is a loanword.
  - SCRIPT: Hiragana or Katakana ONLY. 
  - ABSOLUTE BAN: NEVER use Kanji (e.g., "一") in this field. NEVER use Romaji.
  - This field is for pure Japanese script. For "one", use "いち", not "一".
  - If input is Kanji, you MUST convert it to Hiragana for this field for beginners.

altForm (OPTIONAL):
  - For difficulty 1–2 (N5/N4): write the ROMAJI reading. Example: "taberu", "ohayou"
  - For difficulty 3 (N3+): write the KANJI form if one exists. Example: "食べる"
  - Omit (empty string) if the word is kana-only with no useful kanji form.
  - NEVER put romaji in kanaPrimary. Romaji goes here only.

furigana (OPTIONAL):
  - Include ONLY when altForm contains kanji characters.
  - Write the hiragana reading of the kanji. Example: "たべもの" for "食べ物"
  - Leave empty string if altForm is romaji or empty.

meaning:
  - Concise English, 2–8 words, no trailing period.

example:
  - Format: "kana sentence - English translation"
  - Japanese part: kana only (no kanji), 8–25 characters, natural sentence using the word.
  - English part: 3–10 words.
  - Example: "りんごをたべる - I eat an apple"

distractors:
  - Exactly 3 wrong English meanings from the same semantic domain.
  - Plausible but clearly incorrect.

hint:
  - One English mnemonic, ≤12 words.
  - Use sound-alike tricks: "ta-BEru = TABle → eat at a table"

usageNote:
  - One short grammar/register note, or empty string.

difficulty:
  - 1 = N5 (everyday beginner), 2 = N4 (elementary), 3 = N3 and above (intermediate+)`;
};

export default buildCardPrompt;
