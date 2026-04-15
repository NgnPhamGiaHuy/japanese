import { AI_SYSTEM_PROMPT } from "./shared";
import { CARD_JSON_SCHEMA } from "../schemas";

const buildCardPrompt = (word: string): string => {
    return `${AI_SYSTEM_PROMPT}

Generate a flashcard for the Japanese word: "${word}"

Return a single JSON object matching this exact structure (use real values, not these descriptions):
${CARD_JSON_SCHEMA}

Field rules:

primary (REQUIRED):
  - The most natural/common display form for the target learner level.
  - Can be kana, kanji, or mixed depending on common usage.

alternatives (OPTIONAL ARRAY):
  - Include useful alternate forms as plain strings.
  - Keep only common, learner-relevant alternatives.

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
