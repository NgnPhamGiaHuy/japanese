/**
 * @file Flashcard Loader Types
 *
 * @remarks
 * Defines the unified data loading abstraction for flashcard games.
 * Supports both personal decks and shared decks with a single interface.
 */

import type { FlashCard, Lesson } from "../types";

/**
 * Discriminated union for flashcard data sources.
 */
export type FlashcardSource =
    | { type: "personal"; lessonId: string }
    | { type: "shared"; shareId: string };

/**
 * Unified flashcard data structure returned by loaders.
 */
export interface FlashcardData {
    /** Card collection for the game */
    cards: FlashCard[];

    /** Lesson metadata */
    lesson: Lesson;

    /** Factory function to generate game mode keys */
    gameMode: (mode: string) => string;

    /** Path to navigate to after game ends */
    returnPath: string;

    /** Source information for analytics/debugging */
    source: FlashcardSource;
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
