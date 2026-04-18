/**
 * Board-aware distractor generator
 * Prevent duplicates + semantic collisions
 */

export function getMatchDistractorsPrompt(existingTiles: string[], count: number): string {
    const safeCount = Math.min(Math.max(count, 1), 24);
    const japCount = Math.ceil(safeCount * 0.9);
    const engCount = safeCount - japCount;

    return `You are a Japanese pedagogy expert and game designer.
  
TASK:
Generate exactly ${safeCount} unique decoy tiles (distractors) for a Japanese matching game.

THE BOARD (DO NOT REPEAT OR USE SYNONYMS OF THESE):
${JSON.stringify(existingTiles)}

---

STRICT QUOTA:
- Generate exactly ${japCount} Japanese words (Hiragana/Katakana/Kanji).
- Generate exactly ${engCount} English meanings (Actual translations).

RULES:
1. NO DUPLICATES: Check the board above carefully. Do not repeat any word or variation of it.
2. NO SYNONYMS: If "Good morning" is on board, do NOT generate "Morning" or "Hello".
3. NO ROMAJI: Japanese tiles must be in Japanese script. English tiles must be English.
4. ATOMIC: Each string is exactly ONE tile. No slashes or commas.
5. NO CROSS-MATCHES: Your distractors must NOT form a valid pair with any board tile.

STRATEGY:
- Use visual interference for Japanese (e.g., matching radical patterns).
- Use semantic category interference for English (e.g., if board has "Red", generate "Blue").

RETURN JSON ONLY: { "distractors": string[] }`;
}
