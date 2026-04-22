/**
 * @file Domain Types — Pure Data Structures
 *
 * @remarks
 * Strict separation of concerns:
 * - Content: Immutable card data (owned by deck creator)
 * - Progress: Mutable learning state (owned by individual learner)
 *
 * This separation enables:
 * - Multi-tenant learning (N users × 1 deck)
 * - Clean security rules (content vs progress ownership)
 * - Scalable caching (content stable, progress volatile)
 */

/**
 * Pure card content — immutable, shared across all learners.
 *
 * @remarks
 * This is what the deck owner creates and maintains.
 * No SRS fields — those belong to UserCardProgress.
 */
export interface FlashCardContent {
    /** Unique identifier for the card document */
    id: string;
    /** Reference to the parent lesson/deck */
    lessonId: string;

    /** Canonical concept display */
    primary: string;
    /** Alternative surface forms */
    alternatives: string[];
    /** Definition or translation */
    meaning: string;
    /** Contextual usage sentence */
    example: string;

    // Media
    imageUrl?: string;
    imagePath?: string;

    // Explicit sort order
    order?: number;
    sortOrder?: number;

    // AI-enriched fields
    distractors?: string[];
    hint?: string;
    usageNote?: string;
    difficulty?: 1 | 2 | 3;
    mnemonic?: string;
    clozeTemplate?: string;
    cardType?: "standard" | "cloze";
}

/**
 * Per-user learning state for a single card.
 *
 * @remarks
 * Stored at: userProgress/{userId}/lessons/{lessonId}/cards/{cardId}
 *
 * This is the user's private SRS state. Multiple users studying the same
 * deck will each have their own independent UserCardProgress documents.
 */
export interface UserCardProgress {
    /** Reference to the card content */
    cardId: string;
    /** Reference to the lesson (for queries) */
    lessonId: string;
    /** Reference to content owner (for joins) */
    sourceOwnerId: string;

    // SM-2 SRS fields
    /** Multiplier for interval calculation (1.3-2.5) */
    easeFactor: number;
    /** Days until next review */
    interval: number;
    /** Consecutive successful recalls */
    repetitions: number;
    /** Unix ms — earliest review time */
    nextReviewAt: number;

    /**
     * Derived learning status — persisted so it survives refresh.
     * - new: never studied (repetitions === 0)
     * - learning: in active acquisition (repetitions 1-2)
     * - review: scheduled for spaced review (repetitions >= 3)
     * - mastered: long interval, high ease (interval >= 21)
     */
    status: "new" | "learning" | "review" | "mastered";

    /** Last grade the user gave this card — persisted for cross-session mistake tracking */
    lastResult: "Again" | "Hard" | "Good" | "Easy" | null;

    /**
     * True when the last answer was "Again" or "Hard".
     * Persisted to Firestore so Mistake Review survives refresh.
     */
    isMistake: boolean;

    // Audit trail
    /** Unix ms — last time this card was graded */
    lastReviewedAt: number | null;
    /** Unix ms — when progress was created */
    createdAt: number;
    /** Unix ms — last reset (if any) */
    lastResetAt?: number;

    // Multi-skill tracking (Japanese-specific)
    progress?: {
        kanaReading?: number;
        kanjiRecognition?: number;
        meaningRecall?: number;
    };
}

/**
 * Runtime merged type — content + user's own progress.
 *
 * @remarks
 * This is what game modes and study sessions consume.
 * Built by merging FlashCardContent + UserCardProgress at load time.
 */
export type CardWithProgress = FlashCardContent & UserCardProgress;

/**
 * Fresh SRS state for new cards or after reset.
 */
export const FRESH_SRS_STATE: Omit<
    UserCardProgress,
    "cardId" | "lessonId" | "sourceOwnerId" | "createdAt"
> = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewAt: 0,
    status: "new",
    lastResult: null,
    isMistake: false,
    lastReviewedAt: null,
};

/**
 * Daily study statistics per user.
 *
 * @remarks
 * Moved from users/{uid}/studyStats/daily to userProgress/{uid}/studyStats/daily
 * for consistency — all user learning data lives under userProgress.
 */
export interface DailyStudyStats {
    /** ISO date string (YYYY-MM-DD) */
    date: string;
    /** Cards reviewed today */
    reviewedCount: number;
    /** Unix ms — last update */
    lastUpdatedAt: number;
}
