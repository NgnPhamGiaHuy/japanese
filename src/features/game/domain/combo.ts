/**
 * Combo-scoring formulas — the single source of truth kana (quiz +
 * survival), Speed, and Match all import from (E11-T5). Two distinct
 * formulas live here rather than one, because they do genuinely different
 * things:
 *
 * - `comboMultiplier` (kana, Speed): a whole-number MULTIPLIER applied to a
 *   base score — `basePoints * comboMultiplier(streak)`.
 * - `comboBonusAdditive` (Match ONLY): a flat bonus ADDED to a base score —
 *   `basePoints + comboBonusAdditive(streak, ...)`. This is Match's
 *   deliberately different scoring feel and is kept as its own function
 *   rather than forced into comboMultiplier's shape — multiplying and
 *   adding are different operations, and a single parameterized formula
 *   trying to cover both would obscure that difference instead of
 *   documenting it. It's co-located here (not in match/config.ts) so this
 *   file stays the one place "how does a combo streak affect score" is
 *   answered for every mode.
 */

/**
 * Multiplicative combo scoring — kana quiz/survival and Speed mode: a whole
 * multiplier steps up every `comboStep` correct answers in a row.
 * `streakAfterCorrect` is the running streak including the answer just
 * submitted (1 = first correct in a row, 5 = fifth in a row with the
 * default comboStep → multiplier steps up).
 */
export function comboMultiplier(streakAfterCorrect: number, comboStep = 5): number {
    if (streakAfterCorrect <= 0) return 1;
    return Math.floor(streakAfterCorrect / comboStep) + 1;
}

/**
 * Additive combo scoring — Match mode. Every `comboStep` correct matches in
 * a row adds one more `bonusPerLevel` on top of the base score, instead of
 * multiplying it. See this file's header for why it isn't unified with
 * comboMultiplier.
 */
export function comboBonusAdditive(
    streakAfterCorrect: number,
    comboStep: number,
    bonusPerLevel: number,
): number {
    if (streakAfterCorrect <= 0) return 0;
    return Math.floor(streakAfterCorrect / comboStep) * bonusPerLevel;
}
