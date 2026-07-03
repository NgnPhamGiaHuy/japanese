/**
 * Score multiplier after a correct answer.
 * `streakAfterCorrect` is the running streak including the answer just submitted
 * (1 = first correct in a row, 5 = fifth in a row → multiplier steps up).
 */
export function comboMultiplier(streakAfterCorrect: number): number {
    if (streakAfterCorrect <= 0) return 1;
    return Math.floor(streakAfterCorrect / 5) + 1;
}
