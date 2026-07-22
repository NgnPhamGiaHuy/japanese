/**
 * Kana Survival Feature — Public API
 */

export { KanaSurvival } from "./components/KanaSurvival";
export {
    TIME_ATTACK_MAX_STREAK_BONUS_SEC,
    TIME_ATTACK_WRONG_PENALTY_SEC,
    useSurvivalGame,
} from "./hooks";
export type { ChallengeMode, DropWord, SurvivalPhase } from "./types";
