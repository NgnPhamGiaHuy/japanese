/**
 * Core Flashcard domain model.
 *
 * Learning Stage Architecture:
 * - kana:  Beginner — show kana only, build pronunciation + familiarity
 * - mixed: Intermediate — show kana + altForm together
 * - kanji: Advanced — show altForm only, full recall expected
 */
export interface FlashCard {
    /** Unique identifier for the card document */
    id: string;
    /** Reference to the parent lesson/deck */
    lessonId: string;

    /**
     * Primary spoken/kana form — ALWAYS required.
     * This is the canonical learning anchor (e.g. "たべる", "おはよう").
     * For kana-only words this equals kanji. For kanji words this is the reading.
     */
    kanaPrimary: string;

    /**
     * Alternative written form — OPTIONAL.
     * N4/N5 words: romaji (e.g. "taberu").
     * N3 and above: kanji (e.g. "食べる").
     * Shown as a subtitle ABOVE the kana in level 1, hidden in level 2+.
     */
    altForm?: string;

    /**
     * Furigana reading — only meaningful when altForm contains kanji characters.
     */
    furigana?: string;

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

    /** Explicit sort order within the lesson — determines display sequence */
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
}

/**
 * Deck container for flashcards, including visibility and collaborative metadata.
 */
export interface Lesson {
    /** Unique document ID for the deck */
    id: string;
    /** UID of the primary deck owner */
    userId?: string;
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
    /** Permission level granted to guest/link viewers */
    publicRole?: "viewer" | "commenter" | "editor";

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

    /** Brand color used for the deck's card components and UI highlights */
    themeColor?: string;

    /** If this lesson was imported from a shared source, the original lesson doc ID */
    sourceLessonId?: string;
    /** If this lesson was imported from a shared source, the original owner's UID */
    sourceUserId?: string;
}

/**
 * Snapshot of performance during a single learning/practice session.
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
 * High-level threaded feedback document.
 *
 * @remarks
 * For optimization, we use a 2-level nesting limit.
 * Parent comments are distinct documents; nested replies are stored in a
 * denormalized array inside the parent.
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
 * Contextual author metadata used for UI resolution (badges, permissions).
 */
export interface CommentAuthorInfo {
    /** Foreign key to Auth system */
    userId: string;
    /** Resolved display name */
    displayName?: string;
    /** Fallback contact string */
    email?: string;
    /** Current calculated role for the current deck scope */
    role: "owner" | "editor" | "commenter" | "viewer";
    /** Avatar URL reference */
    photoURL?: string;
}

/**
 * Aggregate social metrics for a specific card.
 */
export interface CardCommentMeta {
    /** Reference card */
    cardId: string;
    /** Total engagement count (Parents + Replies) */
    totalComments: number;
    /** Count of active threads requiring attention */
    unresolvedCount: number;
}
