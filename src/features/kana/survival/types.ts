/**
 * Type definitions for Kana Survival feature
 */

export type SurvivalPhase = "setup" | "playing" | "gameover" | "leaderboard";
export type ChallengeMode = "infinity" | "time" | "drop";

export interface DropWord {
    id: string;
    char: string;
    validOptions: string[];
    typed: string;
    x: number;
    y: number;
}
