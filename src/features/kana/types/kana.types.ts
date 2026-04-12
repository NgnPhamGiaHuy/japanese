export type AlphabetMode = "hiragana" | "katakana" | "both";
export type QuestionType = "read" | "reverse" | "listen" | "type";
export type QuizPhase = "setup" | "playing" | "finished";
export type SurvivalPhase = "setup" | "playing" | "gameover" | "leaderboard";
export type ChallengeMode = "infinity" | "time" | "drop";
export type PracticeMode = 1 | 2 | 3;

export interface KanaChar {
    char: string;
    romaji: string;
    group: string;
}

export interface LeaderboardEntry {
    id: string;
    userId: string;
    deviceId: string;
    name: string;
    score: number;
    timestamp: string;
}

export interface DropWord {
    id: string;
    char: string;
    validOptions: string[];
    typed: string;
    x: number;
    y: number;
}
