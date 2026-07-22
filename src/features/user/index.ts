/**
 * User Feature — Public API
 *
 * @remarks
 * The only surface other features and the app layer may import from.
 * Everything not listed here is internal and may change without notice.
 * Curated deliberately: a blanket `export *` would make every internal
 * helper part of the contract by accident.
 */

// Auth session + progress state
export {
    useActivityTracker,
    useBestScores,
    useFirebaseAuth,
    useLoginFlow,
    useUserProgress,
} from "./hooks";

// Shared progress subscription — mounted once at the composition root.
export { UserProgressProvider } from "./context/UserProgressContext";

// Progression math — level/accuracy rules for the profile screen.
export { computeAccuracy, levelFromXp } from "./domain";
export type { LevelProgress } from "./domain";

// Sign-out. Sign-in is internal to useLoginFlow — the login screen is its
// only caller, so the popup/redirect functions themselves don't need to be
// public.
export { signOut } from "./services";
