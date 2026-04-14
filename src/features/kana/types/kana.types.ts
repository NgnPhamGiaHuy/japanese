export type AlphabetMode = "hiragana" | "katakana" | "both";
export type QuestionType = "read" | "reverse" | "listen" | "type";
export type SurvivalPhase = "setup" | "playing" | "gameover" | "leaderboard";
export type ChallengeMode = "infinity" | "time" | "drop";

export interface KanaChar {
    char: string;
    romaji: string;
    group: string;
}

export interface DropWord {
    id: string;
    char: string;
    validOptions: string[];
    typed: string;
    x: number;
    y: number;
}
