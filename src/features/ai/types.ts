export interface GeneratedCard {
    /** Most natural default display form for this vocabulary concept. */
    primary: string;
    /** Alternate forms without fixed representation semantics. */
    alternatives?: string[];
    meaning: string;
    example: string;
    distractors?: string[];
    hint?: string;
    usageNote?: string;
    difficulty?: 1 | 2 | 3;
    /** AI-generated memory aid, max 120 characters. */
    mnemonic?: string;
    /** Sentence with target word replaced by ___ for cloze card rendering. Must contain exactly one ___ token. */
    clozeTemplate?: string;
}

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "General";

export type AIGenerateMode = "quick" | "guided";

export type AIStatus = "idle" | "loading" | "success" | "error";
