import { AI_SYSTEM_PROMPT } from "./shared";
import { DECK_JSON_SCHEMA } from "../schemas";

import type { JLPTLevel } from "../types";

function getLevelNote(level: JLPTLevel): string {
    switch (level) {
        case "N5":
            return "JLPT N5 — everyday beginner vocabulary (difficulty: 1)";
        case "N4":
            return "JLPT N4 — elementary vocabulary (difficulty: 2)";
        case "N3":
            return "JLPT N3 — intermediate vocabulary (difficulty: 3)";
        case "N2":
            return "JLPT N2 — upper-intermediate vocabulary (difficulty: 3)";
        default:
            return "a balanced mix of N5–N3 vocabulary (vary difficulty 1–3)";
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
            ? `\nDo NOT include these words (already in the deck):\n${existingWords
                  .slice(0, 200)
                  .map((w) => `- ${w}`)
                  .join("\n")}\n`
            : "";

    return `${AI_SYSTEM_PROMPT}

Generate exactly ${count} Japanese flashcards for the topic: "${topic}"
Level: ${getLevelNote(level)}
${exclusionBlock}
Return a JSON array of ${count} objects. Each object must match this exact structure:
${DECK_JSON_SCHEMA}

Field rules (apply to every card):

primary (REQUIRED):
  - MUST contain exactly ONE word or phrase.
  - NEVER combine multiple forms with commas, slashes, or parentheses.
  - WRONG: "食べる/飲む", "食べる (taberu)", "食べる, 飲む"
  - RIGHT: "食べる"
  - The most natural/common display form for the level and topic.
  - Can be kana, kanji, or mixed naturally.

alternatives (OPTIONAL ARRAY):
  - Include useful alternate forms only.
  - Keep entries concise and commonly used.

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
  - Example: "まいにち___ をたべる - I eat ___ every day"

Additional rules:
  - Vary word types: nouns, verbs, adjectives, expressions.
  - No duplicates within the array.
  - Return exactly ${count} objects — no more, no less.`;
};

export default buildDeckPrompt;
