/**
 * Kana Feature — Public API
 *
 * @remarks
 * Five learning modes over one dataset. Each mode exposes only its screen root;
 * the hooks, engines and components behind them stay internal.
 *
 * Note: the Survival mode screens currently live in the route layer
 * (`app/[locale]/(immersive)/kana/survival/_components/`) rather than here,
 * unlike its four siblings. Relocating them is T-105a; until then Survival has
 * no entry in this barrel and its shared hook is exported below.
 */

// Mode screen roots — mounted by the /kana route segments.
export { KanaChart } from "./chart";
export { default as KanaHub } from "./hub";
export { KanaLearn } from "./learn";
export { KanaPractice } from "./practice";
export { KanaQuiz } from "./quiz";

// Shared across modes and reused by the Survival screens in the route layer.
export { AnswerFeedback, KanaMCOptionsGrid } from "./components";
export {
    TIME_ATTACK_MAX_STREAK_BONUS_SEC,
    TIME_ATTACK_WRONG_PENALTY_SEC,
    useKanaDataset,
    useSurvivalGame,
} from "./hooks";

// The character datasets themselves.
export { HIRAGANA_DATA, KATAKANA_DATA } from "./data";

export type { AlphabetMode } from "./types";
