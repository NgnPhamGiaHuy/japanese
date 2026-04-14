export interface GeneratedCard {
    /** Kana/spoken form — always the primary learning anchor (hiragana/katakana only) */
    kanaPrimary: string;
    /** Alt form: romaji for N5/N4, kanji for N3+ — maps to FlashCard.altForm */
    kanji?: string;
    /** Furigana reading — only when kanji field contains kanji characters */
    furigana?: string;
    meaning: string;
    example: string;
    distractors?: string[];
    hint?: string;
    usageNote?: string;
    difficulty?: 1 | 2 | 3;
}

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "General";

export type AIGenerateMode = "quick" | "guided";

export type AIStatus = "idle" | "loading" | "success" | "error";
