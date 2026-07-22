/**
 * Flashcard Feature — Public API
 *
 * @remarks
 * The largest feature by a wide margin, spanning six sub-domains (ADR-104):
 * dashboard, detail, games (match/speed/study — study/SRS is `games/study/`,
 * not a flashcard-root sibling: it was already a partial seam nested there,
 * match/speed/study share `games/hooks/` and an identical phase-router
 * shape, and pulling it out would be pure churn with no functional gain —
 * see `games/study/`'s own barrel), sharing + comments (`./sharing`), and
 * import/AI (`./builder`, named for its most prominent component rather
 * than the ADR's own phrase — see `builder/index.ts`). It stays one feature
 * with internal sub-module boundaries rather than being split — so this
 * barrel is the outer contract, and the sub-domains keep their own inner
 * ones. The flat `components/` directory this feature once had no longer
 * exists — every component now lives in the sub-module that owns it.
 *
 * Cross-sub-module infrastructure — `domain/` (SRS math, `CardWithProgress`),
 * `services/` (Firestore I/O), `types/`, `utils/`, `actions/`, `context/`,
 * `loaders/` — stays at the feature root rather than moving into any one
 * sub-module: `progress.service.ts` and `domain/` are consumed by study
 * (heaviest), match (`gradeCard` on every pair), `shared.service.ts`, and
 * externally by `features/home` (read-only, via `useDeckProgressStatus`) —
 * genuinely shared, not study-exclusive. This is the "boundary calls at the
 * contested seams" decision T-104a's acceptance criteria calls for
 * documenting explicitly, not leaving implicit.
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

export { LessonBuilder } from "./builder";
export { ShareModal } from "./sharing";

// ─── Study modes ─────────────────────────────────────────────────────────────
export { StudySession } from "./games/study";
export { MatchGame, matchGameMode } from "./games/match";
export { SpeedConstraintError, SpeedGame, speedGameMode } from "./games/speed";

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
export { buildShareId, duplicateLesson } from "./services";
export { declineInviteAction } from "./actions/access.actions";
export { logDeckCreated } from "./actions/activity-log.actions";

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
export { canEdit } from "./utils/rbac";
export { DEFAULT_DECK_THEME_COLOR } from "./types";
export type { FlashCard, Lesson } from "./types";
