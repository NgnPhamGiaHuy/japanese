/**
 * @file learningEngine.ts
 * Single source of truth for card selection, sequencing, and SRS state
 * transitions across all study modes.
 *
 * @remarks
 * Design Principles:
 * 1. **Purity**: Functions are pure where possible; persistence side-effects are isolated.
 * 2. **Sequence Orchestration**: Deterministic ordering for learning (insertion-based)
 *    vs adaptive mix for practice (shuffled).
 * 3. **Mistake Recovery**: Per-session memory management for immediate feedback loops.
 */

import { shuffleArray } from "@/shared/utils";
import { updateCardProgress } from "../services";

import type { FlashCard, StudyMode } from "../types";

/**
 * Model representing a study session's configuration and initial state.
 * Consumed by player components to initialize their internal queue.
 */
export interface LearningSession {
    /** Ordered queue of cards ready for the player to iterate through */
    queue: FlashCard[];
    /** Human-readable label for HUD and progress tracking (e.g., 'Practice') */
    modeLabel: string;
    /** Whether progress on these cards should persist to the SRS database on answer */
    updateSRS: boolean;
}

/**
 * Filters for cards the user has never studied (zero repetitions found).
 *
 * @param cards - Full deck collection.
 * @returns Array of pristine cards.
 */
export const getNewCards = (cards: FlashCard[]): FlashCard[] =>
    cards.filter((c) => c.repetitions === 0);

/**
 * Filters for cards whose calculated review epoch has passed.
 *
 * @param cards - Full deck collection.
 * @returns Array of cards that require immediate active recall.
 */
export const getDueCards = (cards: FlashCard[]): FlashCard[] =>
    cards.filter((c) => c.nextReviewAt <= Date.now() && c.repetitions > 0);

/**
 * Resolves a subset of cards based on a session's current mistake tracking.
 *
 * @param cards - Full deck collection.
 * @param mistakeIds - Array of specific card IDs flagged during current session.
 * @returns Filtered cards for a specialized "Mistake Review" loop.
 */
export const getMistakeCards = (cards: FlashCard[], mistakeIds: string[]): FlashCard[] => {
    const set = new Set(mistakeIds);
    return cards.filter((c) => set.has(c.id));
};

/**
 * Core factory for generating a study segment based on mode and state.
 *
 * @remarks
 * **Mode Strategies**:
 * - `learn`: Presents new cards in their creation order (predictability aids initial links).
 * - `practice`: Shuffles a mix of overdue cards and a capped subset of new ones.
 * - `mistake-review`: Focuses precisely on cards the user struggled with in the prior loop.
 *
 * @param cards - Raw card list from the database.
 * @param mode - Target study intent.
 * @param mistakeIds - Contextual mistakes from parental state.
 * @returns A structured session ready for UI mounting.
 */
export function buildSession(
    cards: FlashCard[],
    mode: StudyMode,
    mistakeIds: string[] = [],
): LearningSession {
    switch (mode) {
        case "learn": {
            const queue = getNewCards(cards);
            return {
                queue,
                modeLabel: "Learn",
                updateSRS: true,
            };
        }

        case "practice": {
            const newCards = getNewCards(cards);
            const dueCards = getDueCards(cards);
            // Capping new cards prevents sessions from becoming overwhelming
            const capped = [...dueCards, ...newCards.slice(0, 10)];
            return {
                queue: shuffleArray(capped),
                modeLabel: "Practice",
                updateSRS: true,
            };
        }

        case "mistake-review": {
            const queue = getMistakeCards(cards, mistakeIds);
            return {
                queue: shuffleArray(queue),
                modeLabel: "Mistake Review",
                updateSRS: true,
            };
        }
    }
}

/**
 * Logical entry point for updating card metadata after an answer.
 *
 * @remarks
 * While this delegates to the service layer for the actual write,
 * it acts as the semantic handler for the player orchestration.
 *
 * @param userId - Context user UID.
 * @param card - The specific card being answered.
 * @param knew - Whether the user successfully recalled the card.
 */
export async function processAnswer(userId: string, card: FlashCard, knew: boolean): Promise<void> {
    await updateCardProgress(userId, card.id, card, knew);
}

/**
 * Statistical summary of a deck's current learning status.
 */
export interface DeckStatus {
    /** Cards not yet introduced */
    newCount: number;
    /** Cards that require review according to the SM2 algorithm */
    dueCount: number;
    /** Total size of the deck */
    totalCount: number;
}

/**
 * Recommended primary action for a deck based on its current status.
 * - `continue`: Prioritizes clearing review debt.
 * - `learn`: Encourages introducing new vocabulary.
 * - `idle`: Occurs when all current goals are met for the day.
 */
export type DeckAction = "continue" | "learn" | "idle";

/**
 * Evaluates deck metrics to suggest the most valuable next step for the user.
 *
 * @param status - Pre-calculated deck status.
 * @returns A primary call-to-action identifier.
 */
export function recommendedAction(status: DeckStatus): DeckAction {
    if (status.dueCount > 0) return "continue";
    if (status.newCount > 0) return "learn";
    return "idle";
}

/**
 * Generates a full status report for a deck.
 */
export function getDeckStatus(cards: FlashCard[]): DeckStatus {
    return {
        newCount: getNewCards(cards).length,
        dueCount: getDueCards(cards).length,
        totalCount: cards.length,
    };
}
