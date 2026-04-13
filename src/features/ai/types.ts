export interface GeneratedCard {
    kanji: string;
    furigana: string;
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
