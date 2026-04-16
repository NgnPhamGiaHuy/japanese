/**
 * Prompt for Match Mode decoy tiles — interference (similar form/meaning), not trivia.
 */

export function getMatchDistractorsPrompt(
    targetJapanese: string,
    targetEnglish: string,
    count: number,
): string {
    const safeCount = Math.min(Math.max(count, 1), 12);

    return `You help design a Japanese flashcard matching game.

Learners see ALL tiles face-up in one grid. The grid contains two types of tiles:
1. PURE Japanese labels (hiragana/kanji)
2. PURE English meanings

You output ONLY decoy labels (distractors) that MUST match one of these two types.

Target Japanese (from the current deck): ${targetJapanese}
Target English (from the current deck): ${targetEnglish}

Return JSON ONLY: { "distractors": string[] }

STRICT RULES for distractors:
- Exactly ${safeCount} strings.
- ATOMIC TILES: Each string must be EITHER pure Japanese OR pure English. 
- NO MIXED CONTENT: Never combine Japanese and English in one string. 
- NO SEPARATORS: Never use slashes (/), parentheses (), or commas (,) to combine multiple forms.
- VISUAL INTERFERENCE: For Japanese decoys, use visually similar kana/kanji (e.g., シ vs ツ, は vs ほ).
- SEMANTIC INTERFERENCE: For English decoys, use words from the same semantic domain (e.g., if "buy" is a target, use "sell" as a decoy).
- WRONG ANSWERS: Every decoy must be a plausible confusion, but must NOT form a valid pair with any target.
- Length limit: ≤20 characters per string.`;
}
