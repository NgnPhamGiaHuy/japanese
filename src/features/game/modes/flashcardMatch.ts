/**
 * Match Mode — visible single-pool grid + interference (AI distractors).
 *
 * Difficulty comes from similar-looking wrong tiles, mixed representations,
 * density, and time pressure — not hidden faces.
 *
 * Scoring: base per match + combo, optional time bonus when the clock is on.
 */

export const MATCH_GAME_MODE = "flashcard_match";

/** Per-deck game mode key stored in Firestore and used for the leaderboard. */
export function matchGameMode(deckId: string): string {
    return `${MATCH_GAME_MODE}_${deckId}`;
}

export type MatchPairingMode = "fixed" | "mixed";

export interface MatchGameConfig {
    pairType: MatchPairingMode;
    timePressure: boolean;
}

export type MatchDifficulty = 1 | 2 | 3 | 4;

export interface DifficultyConfig {
    pairs: number;
    timeLimit: number;
    label: string;
    sub: string;
    color: string;
    game: MatchGameConfig;
    /** Count of lone distractor tiles fetched from AI (no matching pair) */
    distractorTiles: number;
    /** Starting lives; wrong pair or any tile involving a distractor removes one. 0 = score penalty only */
    lives: number;
}

export const DIFFICULTY_CONFIG: Record<MatchDifficulty, DifficultyConfig> = {
    1: {
        pairs: 4,
        timeLimit: 120,
        label: "Easy",
        sub: "4 pairs · visible grid · no decoys",
        color: "#58cc02",
        distractorTiles: 0,
        lives: 0,
        game: {
            pairType: "fixed",
            timePressure: false,
        },
    },
    2: {
        pairs: 6,
        timeLimit: 90,
        label: "Medium",
        sub: "6 pairs · 2 AI distractors · timer",
        color: "#1cb0f6",
        distractorTiles: 2,
        lives: 4,
        game: {
            pairType: "fixed",
            timePressure: true,
        },
    },
    3: {
        pairs: 8,
        timeLimit: 120,
        label: "Hard",
        sub: "8 pairs · 8 distractors · timer · lives",
        color: "#ff9600",
        distractorTiles: 8,
        lives: 4,
        game: {
            pairType: "fixed",
            timePressure: true,
        },
    },
    4: {
        pairs: 6,
        timeLimit: 120,
        label: "Master",
        sub: "6 pairs · 18 AI distractors · mixed prompts · timer",
        color: "#ea2b2b",
        distractorTiles: 18,
        lives: 5,
        game: {
            pairType: "mixed",
            timePressure: true,
        },
    },
};

// ─── Scoring constants ────────────────────────────────────────────────────────

export const BASE_POINTS_PER_MATCH = 100;
/** Bonus per combo level (level = Math.floor(streak / 3)). */
export const COMBO_BONUS_PER_LEVEL = 30;
/** Points deducted per wrong attempt. */
export const WRONG_PENALTY = 50;
/** Points awarded per second remaining when all pairs are matched. */
export const TIME_BONUS_PER_SECOND = 10;

/** Incremental score for a single correct match. */
export function calcMatchPoints(streak: number): number {
    const comboLevel = Math.floor(streak / 3);
    const comboBonus = comboLevel * COMBO_BONUS_PER_LEVEL;
    return BASE_POINTS_PER_MATCH + comboBonus;
}

/** Time bonus applied once when all real pairs clear before timeout. */
export function calcTimeBonus(timeRemaining: number): number {
    return timeRemaining * TIME_BONUS_PER_SECOND;
}

/** Combo description shown in the combo popup (e.g. "3× COMBO!"). */
export function comboLabel(streak: number): string {
    if (streak < 3) return "";
    const level = Math.floor(streak / 3);
    return `${level + 2}× COMBO!`;
}
