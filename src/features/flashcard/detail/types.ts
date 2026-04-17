/**
 * Type definitions for Flashcard Detail feature
 *
 * @remarks
 * Defines roles, context, and prop interfaces for the deck detail view.
 * Supports both personal and shared deck scenarios.
 */

import type { FlashCard, Lesson } from "@/features/flashcard/core/types";

/** Roles determining capabilities within a collaborative deck */
export type DeckRole = "owner" | "editor" | "commenter" | "viewer";

/**
 * Scoped data object passed to the layout to handle logic
 * variations between personal and shared decks.
 */
export interface DeckContext {
    lesson: Lesson;
    cards: FlashCard[];
    /** Firestore owner UID — used for comment paths */
    ownerId: string;
    /** Firestore lesson ID — used for comment paths */
    lessonId: string;
    /** Resolved role for the current user */
    role: DeckRole;
    /** Whether the user is the functional owner of the deck */
    isOwner: boolean;
    /** Base path for study/match/speed links, e.g. "/flashcard/shared/abc" or "/flashcard/abc" */
    basePath: string;
}

export interface FlashcardDetailLayoutProps {
    ctx: DeckContext;
    currentUserId?: string;
    currentUserName?: string | null;
    currentUserEmail?: string | null;
    /** Called when user wants to duplicate the deck */
    onDuplicate?: () => Promise<void>;
    /** Called when user wants to copy the share link */
    onCopyLink?: () => Promise<void>;
    linkCopied?: boolean;
    /** Navigate to the edit page (owner/editor only) */
    onEdit?: () => void;
    /** Called when owner wants to open share management modal */
    onManageAccess?: () => void;
    /** Visual loading state for duplication */
    saving?: boolean;
    /** Callback for O(1) single card reordering */
    onReorderCard?: (cardId: string, newOrder: number) => Promise<void>;
}

export interface DetailHeaderProps {
    ctx: DeckContext;
    onEdit?: () => void;
}

export interface DetailActionsPanelProps {
    ctx: DeckContext;
    currentUserId?: string;
    onDuplicate?: () => Promise<void>;
    onCopyLink?: () => Promise<void>;
    linkCopied?: boolean;
    onEdit?: () => void;
    onManageAccess?: () => void;
    saving?: boolean;
}

export interface DetailCardsPanelProps {
    ctx: DeckContext;
    selectedCardId: string | null;
    onSelectCard: (cardId: string) => void;
    onReorderCard?: (cardId: string, newOrder: number) => Promise<void>;
}

export interface DetailCommentsPanelProps {
    ctx: DeckContext;
    selectedCardId: string | null;
    currentUserId?: string;
    currentUserName?: string | null;
    currentUserEmail?: string | null;
}

export interface CardCommentBadgeProps {
    ownerId: string;
    lessonId: string;
    cardId: string;
}

export interface SortableCardItemProps {
    card: FlashCard;
    isSelected: boolean;
    onClick: () => void;
    themeHex: string;
    ownerId: string;
    lessonId: string;
    canReorder: boolean;
}
