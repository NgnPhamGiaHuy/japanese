/**
 * Prompt for Match Mode decoy tiles — interference (similar form/meaning), not trivia.
 */

export function getMatchDistractorsPrompt(hintsBlock: string, count: number): string {
    const safeCount = Math.min(Math.max(count, 1), 8);

    return `You help design a Japanese flashcard matching game grounded in cognitive science.

Learners see ALL tiles face-up in one grid. Targets below are REAL vocabulary (already paired elsewhere). You output ONLY decoy labels that must NOT form any valid pair here.

Targets (decoys must NOT duplicate any string below, even partially overlapping in meaning when ambiguous):
${hintsBlock}

Return JSON ONLY: { "distractors": string[] }

Rules:
- Exactly ${safeCount} strings in "distractors".
- Interference (prefer 2+ of these): (1) visually similar kana/kanji e.g. シ vs ツ, ぬ vs め; (2) same English gloss family e.g. buy/sell; (3) same POS or collocate.
- Short labels only (≤24 chars each) — match how flashcard tiles look.
- Prefer Japanese script (hiragana/kanji); no romaji-only; no English unless the targets use English meanings on cards.
- Distinct from every target string AND from each other. No duplicates.
- Wrong answers by design: plausible confusions, not random unrelated words.`;
}
