/**
 * Game Feature — Public API
 *
 * @remarks
 * The shared game platform: session lifecycle, scoring/tier domain, leaderboard
 * persistence, and the presentational pieces that keep Kana and Flashcard games
 * looking like one product. It imports no other feature — the dependency runs
 * one way, from the game surfaces into here.
 */

// Presentational shell shared by every game surface.
export {
    GameIntroScreen,
    GameResultsScreen,
    GameStreakScoreStack,
    gameQuizStreakColumnClassName,
    Leaderboard,
    LivesDisplay,
    MiniLeaderboard,
    StatGrid,
    StreakComboBadge,
    TierBadge,
} from "./components";
export type { StatItem } from "./components";

// Scoring domain — one combo/tier model for all modes.
export { comboBonusAdditive, comboMultiplier, scoreToTier, TIER_INFO } from "./domain";
export type { TierInfo } from "./domain";

// Session lifecycle: start, score, persist, finish.
export { useGameSession } from "./hooks";

export {
    recordGameResult,
    submitScore,
    subscribeGameStats,
    subscribePersonalBests,
} from "./services";
export type { GameStatEntry } from "./services";
