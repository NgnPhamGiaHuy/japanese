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
export { default as DeckCard } from "./dashboard/components/DeckCard";
export { useDashboardModals } from "./dashboard/hooks";
export { FlashcardDetailLayout } from "./detail";
export type { DeckContext } from "./detail";

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
// The public preview path is Admin-SDK-backed and deliberately bypasses rules,
// so it is exported for the server-rendered share route only.
export { buildShareId } from "./services";
export {
    getPublicSharedLessonPreview,
    listPublicSharedLessonUrls,
} from "./services/shared-preview.service";
export type { PublicSharedLessonPreview } from "./services/shared-preview.service";
export { declineInviteAction } from "./actions/access.actions";

// ─── Domain ──────────────────────────────────────────────────────────────────
export { recommendedAction } from "./utils/learningEngine";
export { DEFAULT_DECK_THEME_COLOR } from "./types";
export type { FlashCard } from "./types";
