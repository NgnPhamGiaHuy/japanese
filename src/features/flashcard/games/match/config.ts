/**
 * Match Mode — visible single-pool grid + interference (AI distractors).
 *
 * Difficulty comes from similar-looking wrong tiles, mixed representations,
 * density, and time pressure — not hidden faces.
 *
 * Scoring: base per match + combo, optional time bonus when the clock is on.
 */

import { comboBonusAdditive } from "@/features/game/domain";

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

/**
 * No `label`/`sub` fields — MatchIntroView resolves those via
 * useTranslations("MatchGame") keyed by difficulty number, since a plain
 * config module can't call useTranslations() itself.
 */
export interface DifficultyConfig {
    pairs: number;
    timeLimit: number;
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
/** Every COMBO_STEP-streak match adds one more COMBO_BONUS_PER_LEVEL (additive — see game/domain/combo.ts). */
export const COMBO_STEP = 3;
export const COMBO_BONUS_PER_LEVEL = 30;
/** Points deducted per wrong attempt. */
export const WRONG_PENALTY = 50;
/** Points awarded per second remaining when all pairs are matched. */
export const TIME_BONUS_PER_SECOND = 10;

/** Incremental score for a single correct match. */
export function calcMatchPoints(streak: number): number {
    return BASE_POINTS_PER_MATCH + comboBonusAdditive(streak, COMBO_STEP, COMBO_BONUS_PER_LEVEL);
}

/** Time bonus applied once when all real pairs clear before timeout. */
export function calcTimeBonus(timeRemaining: number): number {
    return timeRemaining * TIME_BONUS_PER_SECOND;
}

/**
 * Combo level shown in the combo popup, or null below the streak threshold.
 * Returns a bare number rather than a formatted label — this is a plain
 * function and can't call useTranslations(); useMatchScoring (a hook) formats
 * it via MatchGame.comboLevel.
 */
export function comboLevel(streak: number): number | null {
    if (streak < COMBO_STEP) return null;
    return Math.floor(streak / COMBO_STEP) + 2;
}
