import { AI_SYSTEM_PROMPT } from "./shared";
import { CARD_JSON_SCHEMA } from "../schemas";

const buildCardPrompt = (word: string): string => {
    return `${AI_SYSTEM_PROMPT}

Generate a flashcard for the Japanese word: "${word}"

Return a single JSON object matching this exact structure (use real values, not these descriptions):
${CARD_JSON_SCHEMA}

Field rules:

primary (REQUIRED):
  - MUST contain exactly ONE word or phrase.
  - NEVER combine multiple forms with commas, slashes, or parentheses.
  - WRONG: "食べる/飲む", "食べる (taberu)", "食べる, 飲む"
  - RIGHT: "食べる"
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
  - 1 = N5 (everyday beginner), 2 = N4 (elementary), 3 = N3 and above (intermediate+)

mnemonic:
  - A memorable story or image that links the Japanese sound to the English meaning. Max 120 characters.
  - MUST follow this structure: [sound hook] → [vivid scene that IS the meaning].
  - The scene must directly encode the meaning — not just share a sound with a random object.
  - WRONG: "yoku sounds like 'yolk' — you often eat eggs with yolk"  (yolk has nothing to do with "often")
  - WRONG: "neko sounds like 'neck-o' — imagine a neck"  (no meaning encoded)
  - RIGHT: "yoku = YOke an OX — you do it OFTEN to make it work hard"  (often → repeated action)
  - RIGHT: "taberu = TABle RUle — at the table, the rule is: EAT"  (eat → the meaning)
  - RIGHT: "muzukashii = MOO-zoo-CASH — paying cash at a zoo is DIFFICULT"  (difficult → the meaning)
  - Use any technique: sound-alike story, visual pun, acronym, or absurd scene — as long as the meaning is baked in.

clozeTemplate:
  - A natural sentence with the target word replaced by exactly one ___ token.
  - The ___ must appear exactly once in the sentence.
  - Format: "kana sentence with ___ - English translation with ___"
  - Example: "まいにち___ をたべる - I eat ___ every day"`;
};

export default buildCardPrompt;
