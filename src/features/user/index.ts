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
export { useActivityTracker, useBestScores, useFirebaseAuth, useUserProgress } from "./hooks";

// Shared progress subscription — mounted once at the composition root.
export { UserProgressProvider } from "./context/UserProgressContext";

// Sign-in / sign-out. Both the popup and redirect flows are public because
// the login screen falls back from one to the other.
export {
    completeGoogleRedirectSignIn,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signOut,
} from "./services";
