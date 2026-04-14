/**
 * Match Mode — Competitive pair-matching mini-game.
 *
 * Gameplay: Two columns — Japanese (left) vs Meaning (right).
 * Select one card from each side; correct pairs disappear with a score burst.
 * Wrong attempts drain score and reset the combo streak.
 *
 * Scoring formula per correct match:
 *   base_points + combo_bonus
 *   + time_remaining_bonus (awarded once at game end for all remaining seconds)
 */

export const MATCH_GAME_MODE = "flashcard_match";

/** Per-deck game mode key stored in Firestore and used for the leaderboard. */
export function matchGameMode(deckId: string): string {
    return `${MATCH_GAME_MODE}_${deckId}`;
}

export type MatchDifficulty = 1 | 2 | 3;

export interface DifficultyConfig {
    pairs: number;
    timeLimit: number; // seconds
    label: string;
    sub: string;
    color: string;
}

export const DIFFICULTY_CONFIG: Record<MatchDifficulty, DifficultyConfig> = {
    1: { pairs: 4, timeLimit: 45, label: "Starter", sub: "4 pairs · 45 s", color: "#58cc02" },
    2: { pairs: 6, timeLimit: 60, label: "Standard", sub: "6 pairs · 60 s", color: "#ff9600" },
    3: { pairs: 8, timeLimit: 90, label: "Master", sub: "8 pairs · 90 s", color: "#ea2b2b" },
};

// ─── Scoring constants ────────────────────────────────────────────────────────

export const BASE_POINTS_PER_MATCH = 100;
/** Bonus per combo level (level = Math.floor(streak / 3)). */
export const COMBO_BONUS_PER_LEVEL = 30;
/** Points deducted per wrong attempt. */
export const WRONG_PENALTY = 50;
/** Points awarded per second remaining when all pairs are matched. */
export const TIME_BONUS_PER_SECOND = 10;

// ─── Score helpers ────────────────────────────────────────────────────────────

/**
 * Incremental score for a single correct match.
 * `streak` is the running consecutive-correct count AFTER this match.
 */
export function calcMatchPoints(streak: number): number {
    const comboLevel = Math.floor(streak / 3);
    const comboBonus = comboLevel * COMBO_BONUS_PER_LEVEL;
    return BASE_POINTS_PER_MATCH + comboBonus;
}

/** Time bonus applied once when all pairs are cleared before the clock hits 0. */
export function calcTimeBonus(timeRemaining: number): number {
    return timeRemaining * TIME_BONUS_PER_SECOND;
}

/** Combo description shown in the combo popup (e.g. "3× COMBO!"). */
export function comboLabel(streak: number): string {
    if (streak < 3) return "";
    const level = Math.floor(streak / 3);
    return `${level + 2}× COMBO!`;
}
