/**
 * @file flashcardSpeed
 * Speed Mode — Rapid-fire recall mini-game configuration and logic.
 */

export const SPEED_GAME_MODE = "flashcard_speed";

/**
 * Centralized configuration for Speed Mode.
 * Edit these values to adjust game balance, difficulty, and scoring.
 */
export const SPEED_GAME_CONFIG = {
    /** Total number of questions per session */
    TOTAL_QUESTIONS: 20,

    /** Global scoring constants */
    SCORING: {
        BASE_POINTS: 100,
        MAX_SPEED_BONUS: 50,
        /** Streak size needed to increase the combo multiplier */
        COMBO_STEP: 5,
    },

    /** Level definitions and escalation thresholds */
    LEVELS: {
        1: {
            threshold: 0,
            timeLimit: 10,
            label: "Level 1",
            showHint: true,
            color: "#58cc02",
        },
        2: {
            threshold: 5,
            timeLimit: 8,
            label: "Level 2",
            showHint: false,
            color: "#ff9600",
        },
        3: {
            threshold: 10,
            timeLimit: 5,
            label: "Level 3",
            showHint: false,
            color: "#ea2b2b",
        },
    } as Record<number, SpeedDifficultyConfig>,

    /** Visual/UI settings */
    UI: {
        /** Threshold fraction for 'urgent' timer state (e.g., 0.3 = 30% time left) */
        URGENT_THRESHOLD: 0.35,
        /** Timer bar color transitions */
        TIMER_COLORS: {
            SAFE: "#58cc02", // Green
            WARNING: "#ff9600", // Orange
            DANGER: "#ea2b2b", // Red
        },
    },
};
/** Per-deck game mode key stored in Firestore and used for the leaderboard. */
export function speedGameMode(deckId: string): string {
    return `${SPEED_GAME_MODE}_${deckId}`;
}

export type SpeedDifficulty = 1 | 2 | 3;

export interface SpeedDifficultyConfig {
    /** The question index (0-based) where this level begins */
    threshold: number;
    /** Seconds allowed per question at this level */
    timeLimit: number;
    /** Human-readable name for the level */
    label: string;
    /** Whether to show a lightweight representation hint */
    showHint: boolean;
    /** Theme color for this difficulty level */
    color: string;
}


/** Timer bar color based on fraction of time remaining (1 = full, 0 = expired). */
export function timerColor(fraction: number): string {
    const { TIMER_COLORS } = SPEED_GAME_CONFIG.UI;
    if (fraction > 0.6) return TIMER_COLORS.SAFE;
    if (fraction > 0.3) return TIMER_COLORS.WARNING;
    return TIMER_COLORS.DANGER;
}
