/**
 * Speed Mode — Rapid-fire recall mini-game.
 *
 * Gameplay: 20 questions, each with its own countdown timer.
 * The timer shrinks as difficulty escalates every 5 questions.
 * Furigana is hidden after Q5. Wrong or timed-out answers reset the combo.
 *
 * Scoring formula per correct answer:
 *   (BASE_POINTS + speed_bonus) × combo_multiplier
 *
 *   speed_bonus   = proportional to time remaining on the question timer
 *   combo_mult    = 1× at streak 0–4, 2× at 5–9, 3× at 10–14, …
 */

export const SPEED_GAME_MODE = "flashcard_speed";

/** Per-deck game mode key stored in Firestore and used for the leaderboard. */
export function speedGameMode(deckId: string): string {
    return `${SPEED_GAME_MODE}_${deckId}`;
}

export const TOTAL_QUESTIONS = 20;

export type SpeedDifficulty = 1 | 2 | 3;

export interface SpeedDifficultyConfig {
    timeLimit: number; // seconds per question
    label: string;
    showFurigana: boolean;
    color: string;
}

export const SPEED_DIFFICULTY_CONFIG: Record<SpeedDifficulty, SpeedDifficultyConfig> = {
    1: { timeLimit: 5, label: "Level 1", showFurigana: true, color: "#58cc02" },
    2: { timeLimit: 4, label: "Level 2", showFurigana: false, color: "#ff9600" },
    3: { timeLimit: 3, label: "Level 3", showFurigana: false, color: "#ea2b2b" },
};

/** Maps question index (0-based) to a difficulty level. */
export function getDifficultyForQuestion(questionIndex: number): SpeedDifficulty {
    if (questionIndex < 5) return 1;
    if (questionIndex < 10) return 2;
    return 3;
}

// ─── Scoring constants ────────────────────────────────────────────────────────

export const BASE_POINTS_PER_CORRECT = 100;
/** Maximum speed bonus (awarded for near-instant answers). */
export const MAX_SPEED_BONUS = 50;
/** Streak size needed to step the combo multiplier up by 1. */
export const COMBO_STEP = 5;

// ─── Score helpers ────────────────────────────────────────────────────────────

/**
 * Score for a single correct answer.
 *
 * @param timeRemaining  Seconds left on the question timer.
 * @param timeLimit      Total seconds allowed for this question.
 * @param streak         Consecutive correct streak INCLUDING this answer.
 */
export function calcSpeedPoints(timeRemaining: number, timeLimit: number, streak: number): number {
    const speedRatio = Math.max(0, timeRemaining / timeLimit);
    const speedBonus = Math.round(speedRatio * MAX_SPEED_BONUS);
    const multiplier = Math.floor(streak / COMBO_STEP) + 1;
    return (BASE_POINTS_PER_CORRECT + speedBonus) * multiplier;
}

/** Timer bar color based on fraction of time remaining (1 = full, 0 = expired). */
export function timerColor(fraction: number): string {
    if (fraction > 0.6) return "#58cc02"; // green
    if (fraction > 0.3) return "#ff9600"; // orange
    return "#ea2b2b"; // red
}
