/**
 * Kana Feature — Public API
 *
 * @remarks
 * Five learning modes over one dataset. Each mode exposes only its screen root;
 * the hooks, engines and components behind them stay internal. Survival was
 * relocated feature-side (from the route layer) in T-105a, reaching sibling
 * parity with the other four.
 */

// Mode screen roots — mounted by the /kana route segments.
export { KanaChart } from "./chart";
export { default as KanaHub } from "./hub";
export { KanaLearn } from "./learn";
export { KanaPractice } from "./practice";
export { KanaQuiz } from "./quiz";
export { KanaSurvival } from "./survival";

// The character datasets themselves.
export { HIRAGANA_DATA, KATAKANA_DATA } from "./data";
