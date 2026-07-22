/**
 * Flashcard Feature — Public API
 *
 * @remarks
 * The largest feature by a wide margin, spanning six sub-domains: dashboard,
 * detail, study/SRS, the Match and Speed games, sharing, and comments. It stays
 * one feature (ADR-104) with internal sub-module boundaries rather than being
 * split — so this barrel is the outer contract, and the sub-domains keep their
 * own inner ones.
 *
 * Curation matters most here: an `export *` over a 146-file feature would make
 * "everything is public" the contract and defeat the boundary entirely. Only
 * screen roots, cross-boundary hooks, and the sharing surface are listed.
 */

// ─── Screen roots — mounted by the /flashcard route segments ─────────────────
export { FlashcardDashboard } from "./dashboard";
// Shared lessons subscription — mounted once at the composition root.
export { LessonsProvider } from "./context/LessonsContext";
export { default as DeckCard } from "./dashboard/components/DeckCard";
export { useDashboardModals } from "./dashboard/hooks";
export { FlashcardDetailLayout } from "./detail";
export type { DeckContext, DeckRole } from "./detail";

export { default as LessonBuilder } from "./components/LessonBuilder";
export { default as ShareModal } from "./components/ShareModal";

// ─── Study modes ─────────────────────────────────────────────────────────────
export { StudySession } from "./games/study";
export { MatchGame } from "./games/match";
export { matchGameMode } from "./games/match/config";
export { SpeedConstraintError, SpeedGame } from "./games/speed";
export { speedGameMode } from "./games/speed/config";

// ─── Data access ─────────────────────────────────────────────────────────────
export {
    useCards,
    useDeckProgressStatus,
    useEditableLesson,
    useLessons,
    useSharedLesson,
} from "./hooks";
export { useFlashcardLoader } from "./loaders";

// ─── Sharing ─────────────────────────────────────────────────────────────────
export { buildShareId } from "./services";
export { declineInviteAction } from "./actions/access.actions";

// Called once by the composition root to register this feature's handlers on
// notifications' act-side seam (ADR-102). Public because the composition root
// is its only legitimate caller.
export { registerFlashcardNotificationActions } from "./notifications";

// The Admin-SDK preview functions live in `./server` (ADR-101 Amendment 1):
// `shared-preview.service` carries `import "server-only"`, and re-exporting its
// VALUES here would pull firebase-admin into every client bundle that imports
// this barrel. The TYPE is safe — type-only exports are erased and create no
// runtime edge — so client components can still describe the preview shape.
export type { PublicSharedLessonPreview } from "./services/shared-preview.service";

// ─── Domain ──────────────────────────────────────────────────────────────────
export { recommendedAction } from "./utils/learningEngine";
export { DEFAULT_DECK_THEME_COLOR } from "./types";
export type { FlashCard, Lesson } from "./types";
