/**
 * Core Flashcard domain model.
 *
 * @remarks
 * Represents the fundamental unit of study. This structure combines static content
 * (scripts, definitions) with dynamic SRS state (intervals, repetitions) and
 * enrichment metadata (mnemonics, distraction sets) used by game modes.
 */
export interface FlashCard {
    /** Unique identifier for the card document */
    id: string;
    /** Reference to the parent lesson/deck */
    lessonId: string;

    /** Canonical concept display used as the default representation. */
    primary: string;
    /** Alternative surface forms (kana, kanji, romaji, or mixed). */
    alternatives: string[];

    /** The definition or translation (Answer) */
    meaning: string;
    /** Contextual usage of the card in a sentence */
    example: string;

    // Media
    /** Publicly accessible URL for the associated image */
    imageUrl?: string;
    /** Internal storage reference path (e.g., 'users/{uid}/cards/{id}.jpg') */
    imagePath?: string;

    // SRS Fields
    /** Multiplier used to calculate the next interval (lower = harder) */
    easeFactor: number;
    /** Delay in days until the next review */
    interval: number;
    /** Count of consecutive successful recall attempts */
    repetitions: number;
    /** Unix timestamp (ms) of the earliest time the card can be reviewed again */
    nextReviewAt: number;
    /** Multi-skill progress scores for Japanese learning dimensions. */
    progress?: {
        kanaReading?: number;
        kanjiRecognition?: number;
        meaningRecall?: number;
    };

    /** Explicit sort order within the lesson (Fractional Indexing) */
    order?: number;
    /** Legacy sort order field (deprecated) */
    sortOrder?: number;

    // AI-enriched fields
    /** Semantic distractors used for multiple-choice generation in Speed mode */
    distractors?: string[];
    /** Mnemonic or contextual nudge for the user */
    hint?: string;
    /** Nuanced explanation of word usage/connotation */
    usageNote?: string;
    /** AI-assigned complexity level (1=Beginner, 3=Advanced) */
    difficulty?: 1 | 2 | 3;

    /** AI-generated or user-authored memory aid (max 120 chars) */
    mnemonic?: string;
    /** Sentence with the target word replaced by ___ for cloze card rendering */
    clozeTemplate?: string;
    /** Card rendering mode; defaults to 'standard' when absent */
    cardType?: "standard" | "cloze";
}

/** Extended FlashCard type for managing temporary local file state during editing */
export type EditorCard = FlashCard & { imageFile?: File; previewUrl?: string };

/**
 * Deck container for flashcards, including visibility and collaborative metadata.
 *
 * @remarks
 * Lessons serve as the primary unit of shared knowledge. They manage ownership,
 * Role-Based Access Control (RBAC), and sharing identifiers while acting as
 * a registry for a set of related FlashCard documents.
 */
export interface Lesson {
    /** Unique document ID for the deck */
    id: string;
    /** UID of the primary deck owner */
    userId?: string;
    /** Standardized owner UID (source of truth for ownership identity) */
    ownerId?: string;
    /** Standardized owner display name (snapshot) */
    ownerName?: string | null;
    /** Standardized owner avatar URL snapshot */
    ownerAvatar?: string | null;
    /** Human-readable title of the lesson */
    title: string;
    /** Short summary of deck contents */
    description: string;
    /** Categorical labels for search and filtering */
    tags: string[];
    /** Creation epoch for sorting */
    createdAt: number;
    /** Total number of cards in the deck (denormalized for list views) */
    cardCount: number;

    /**
     * Role-Based Access Control (RBAC) map.
     * Key: User UID, Value: Semantic permission level.
     */
    roles?: Record<string, "owner" | "editor" | "commenter" | "viewer">;
    /** List of explicit UIDs with access to this deck */
    collaborators?: string[];
    /** Flag allowing anyone with the shareId to view/comment based on global policy */
    allowLinkAccess?: boolean;
    /**
     * Permission level granted to guest/link viewers.
     * Intentionally capped at "commenter" — "editor" is never granted via public link.
     */
    publicRole?: "viewer" | "commenter";

    /**
     * Pending email invites — converted to collaborators on first login.
     * Key: normalized email (lowercase), Value: invite metadata.
     */
    invitedEmails?: Record<
        string,
        {
            role: "viewer" | "commenter" | "editor";
            invitedAt: number;
        }
    >;

    /**
     * Display metadata for collaborators — populated when an invite is accepted.
     * Key: User UID, Value: snapshot of name/email at time of acceptance.
     * Used purely for UI display; never used for permission checks.
     */
    collaboratorMeta?: Record<
        string,
        {
            displayName?: string | null;
            email?: string | null;
        }
    >;

    /** Legacy or computed public status flag */
    isPublic?: boolean;
    /** URL-safe token representing the {ownerId}:{lessonId} pair */
    shareId?: string;

    /** Optional UI metadata: who last changed/share-imported this deck (snapshot) */
    lastSharedBy?: string;
    lastSharedByName?: string | null;
    /** Standardized sharer avatar URL snapshot */
    lastSharedByAvatar?: string | null;
    lastSharedAt?: number;

    /** Brand color used for the deck's card components and UI highlights */
    themeColor?: string;

    /** Explicit sort order on dashboard (Fractional Indexing) */
    order?: number;

    /** If this lesson was imported from a shared source, the original lesson doc ID */
    sourceLessonId?: string;
    /** If this lesson was imported from a shared source, the original owner's UID */
    sourceUserId?: string;
}

/**
 * Snapshot of performance during a single learning/practice session.
 *
 * @remarks
 * Used purely for transient session reporting and progress feedback.
 * These stats are typically aggregated into the global UserProgress service
 * upon session completion.
 */
export interface StudyStats {
    /** Count of cards successfully recalled */
    correct: number;
    /** Count of cards marked as 'wrong' */
    incorrect: number;
    /** List of card IDs the user struggled with (used for Mistake Review loop) */
    mistakeCardIds: string[];
}

/**
 * Canonical study intent identifiers.
 * - `learn`: Introduction of new, unstudied cards.
 * - `practice`: Mixture of review debt and light introduction.
 * - `mistake-review`: Targeted remediation loop.
 */
export type StudyMode = "learn" | "practice" | "mistake-review";

// Comment System Types

/**
 * High-level threaded feedback document attached to a specific card.
 *
 * @remarks
 * Implements a hybrid storage strategy: parents are top-level documents in
 * the Firestore collection, while replies are nested arrays to optimize
 * read performance for threaded views.
 */
export interface Comment {
    /** Firestore document ID */
    id: string;
    /** Target card being discussed */
    cardId: string;
    /** UID of the author */
    userId: string;
    /** Snapshot of the author's display name at time of posting */
    authorName?: string | null;
    /** Snapshot of author's email for notification/lookup purposes */
    authorEmail?: string | null;
    /** Sanitized markdown/text content */
    content: string;
    /** Creation timestamp (ms) */
    createdAt: number;
    /** Last edit timestamp if applicable */
    updatedAt?: number;
    /** True if the resolution authorized user marking this clarified */
    resolved: boolean;
    /** List of nested reply objects */
    replies: Reply[];
}

/**
 * Child response within a comment thread.
 * Managed as a lightweight object within the parent's `replies` array.
 */
export interface Reply {
    /** Client-generated unique identifier (UUID) */
    id: string;
    /** UID of the replier */
    userId: string;
    /** Snapshot of author's name */
    authorName?: string | null;
    /** Snapshot of author's email */
    authorEmail?: string | null;
    /** Sanitized response text */
    content: string;
    /** Creation timestamp (ms) */
    createdAt: number;
    /** Update timestamp if edited */
    updatedAt?: number;
}

/**
 * Deep-readonly projection of Lesson for shared contexts.
 * Sensitive RBAC fields are omitted — callers cannot read or write them.
 */
export type SharedLessonViewModel = Readonly<
    Omit<Lesson, "roles" | "collaborators" | "invitedEmails" | "collaboratorMeta">
>;

/**
 * Deep-readonly projection of FlashCard for shared contexts.
 * SRS fields are present as read-only snapshots; no writes are permitted.
 */
export type SharedCardViewModel = Readonly<FlashCard>;

/**
 * Canonical role type for deck access control.
 * Single source of truth — import from here, not from individual utility files.
 *
 * Priority (highest → lowest): owner > editor > commenter > viewer > none
 * - owner:     Full control — edit, delete, manage sharing, manage roles
 * - editor:    Edit cards and content (explicit invite only, never via public link)
 * - commenter: Comment on cards, play games, study
 * - viewer:    Read-only — play games, study, no comments
 * - none:      No access — deck is private and user has no invite
 */
export type DeckAccessRole = "owner" | "editor" | "commenter" | "viewer" | "none";
