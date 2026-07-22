/**
 * @file Progression — Pure Domain Logic
 *
 * @remarks
 * Level and accuracy rules for the profile screen. Pure — no side effects,
 * no Firestore, no React.
 */
import type { CharStat } from "../types";

const XP_PER_LEVEL = 500;

export interface LevelProgress {
    level: number;
    xpInLevel: number;
    xpToNext: number;
}

/** Every level costs a flat 500 XP — `level` is 1-indexed. */
export function levelFromXp(xp: number): LevelProgress {
    return {
        level: Math.floor(xp / XP_PER_LEVEL) + 1,
        xpInLevel: xp % XP_PER_LEVEL,
        xpToNext: XP_PER_LEVEL,
    };
}

/** Overall correct-answer rate across every tracked character, as a rounded percentage. `null` with zero attempts. */
export function computeAccuracy(charStats: Record<string, CharStat>): number | null {
    const totalAttempts = Object.values(charStats).reduce((acc, s) => acc + s.attempts, 0);
    const totalCorrect = Object.values(charStats).reduce((acc, s) => acc + s.correct, 0);
    return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;
}
