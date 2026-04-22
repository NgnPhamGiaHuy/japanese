/**
 * @file Flashcard Loader Types
 *
 * @remarks
 * Defines the unified data loading abstraction for flashcard games.
 * Supports both personal decks and shared decks with a single interface.
 */

/**
 * @file Flashcard Loader Types
 *
 * @remarks
 * Defines the unified data loading abstraction for flashcard games.
 * Supports both personal decks and shared decks with a single interface.
 */
/**
 * @file Flashcard Loader Types
 *
 * @remarks
 * Defines the unified data loading abstraction for flashcard games.
 * Supports both personal decks and shared decks with a single interface.
 */
/**
 * @file Flashcard Loader Types
 *
 * @remarks
 * Defines the unified data loading abstraction for flashcard games.
 * Supports both personal decks and shared decks with a single interface.
 */
/**
 * @file Flashcard Loader Types
 *
 * @remarks
 * Defines the unified data loading abstraction for flashcard games.
 * Supports both personal decks and shared decks with a single interface.
 */
/**
 * @file Flashcard Loader Types
 *
 * @remarks
 * Defines the unified data loading abstraction for flashcard games.
 * Supports both personal decks and shared decks with a single interface.
 */
import type { Lesson } from "../types";
import type { CardWithProgress } from "../../domain/types";

/**
 * Discriminated union for flashcard data sources.
 */
export type FlashcardSource =
    | { type: "personal"; lessonId: string }
    | { type: "shared"; shareId: string };

/**
 * Unified flashcard data structure returned by loaders.
 *
 * @remarks
 * cards is CardWithProgress[] — content merged with the current user's SRS state.
 * All game modes and study sessions consume this merged type.
 *
 * For study mode, prefer consuming live cards from useCardsWithProgress directly
 * so status counts update without a full reload.
 */
export interface FlashcardData {
    /** Card collection merged with current user's progress (snapshot at load time) */
    cards: CardWithProgress[];

    /** Lesson metadata */
    lesson: Lesson;

    /** Factory function to generate game mode keys */
    gameMode: (mode: string) => string;

    /** Path to navigate to after game ends */
    returnPath: string;

    /** Source information for analytics/debugging */
    source: FlashcardSource;

    /**
     * Owner of the card content.
     * For personal decks: current user's uid.
     * For shared decks: the deck owner's uid.
     */
    ownerId: string;
}

/**
 * Loading state for flashcard data.
 */
export interface FlashcardLoaderState {
    /** Loaded data (null if not loaded or error) */
    data: FlashcardData | null;

    /** Loading indicator */
    isLoading: boolean;

    /** Ready to use (loaded and valid) */
    isReady: boolean;

    /** Not found (loaded but invalid) */
    isNotFound: boolean;

    /** Error state */
    error: Error | null;
}
