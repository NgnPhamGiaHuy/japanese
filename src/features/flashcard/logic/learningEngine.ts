/**
 * learningEngine.ts
 *
 * Single source of truth for card selection, sequencing, and SRS state
 * transitions across all study modes.
 *
 * Design principles:
 *  – Pure functions where possible; side-effects live in card.service.
 *  – Each mode returns a lean LearningSession that the player components consume.
 *  – Mistakes are accumulated in-memory per session.
 */

import { shuffleArray } from "@/shared/utils";
import { updateCardProgress } from "../services/card.service";

import type { FlashCard, StudyMode } from "../types/flashcard.types";

// ─── Session model ──────────────────────────────────────────────────────────

export interface LearningSession {
    /** Ordered queue ready for the player to walk through */
    queue: FlashCard[];
    /** Human-readable title for the HUD */
    modeLabel: string;
    /** Whether SRS progress should be written on each answer */
    updateSRS: boolean;
}

// ─── Card selectors ─────────────────────────────────────────────────────────

/** Cards the user has never studied (zero repetitions). */
export const getNewCards = (cards: FlashCard[]): FlashCard[] =>
    cards.filter((c) => c.repetitions === 0);

/** Cards whose next review is due right now. */
export const getDueCards = (cards: FlashCard[]): FlashCard[] =>
    cards.filter((c) => c.nextReviewAt <= Date.now() && c.repetitions > 0);

/** Cards that the user has flagged as mistakes in the current session. */
export const getMistakeCards = (cards: FlashCard[], mistakeIds: string[]): FlashCard[] => {
    const set = new Set(mistakeIds);
    return cards.filter((c) => set.has(c.id));
};

// ─── Session builder ─────────────────────────────────────────────────────────

export function buildSession(
    cards: FlashCard[],
    mode: StudyMode,
    mistakeIds: string[] = [],
): LearningSession {
    switch (mode) {
        case "learn": {
            // Introduce new cards in insertion order (no shuffle — want predictability).
            const queue = getNewCards(cards);
            return {
                queue,
                modeLabel: "Learn",
                updateSRS: true,
            };
        }

        case "practice": {
            // Mix new + due cards, shuffle for variety.
            const newCards = getNewCards(cards);
            const dueCards = getDueCards(cards);
            // Cap new cards at 10 so a practice session doesn't balloon.
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
                updateSRS: true, // reviewing mistakes counts toward SRS
            };
        }
    }
}

// ─── SRS processing ──────────────────────────────────────────────────────────

/**
 * Process a user's answer and persist progress.
 * Returns the calculated next interval (days) so callers can show feedback.
 */
export async function processAnswer(userId: string, card: FlashCard, knew: boolean): Promise<void> {
    await updateCardProgress(userId, card.id, card, knew);
}

// ─── Utility: next-action advisor ───────────────────────────────────────────

export interface DeckStatus {
    newCount: number;
    dueCount: number;
    totalCount: number;
}

/**
 * Tells the entry screen which action to suggest as primary CTA:
 *  - "continue"  → cards are due (pick up where you left off)
 *  - "learn"     → there are unlearned cards but nothing due
 *  - "idle"      → everything is reviewed and not yet due again
 */
export type DeckAction = "continue" | "learn" | "idle";

export function recommendedAction(status: DeckStatus): DeckAction {
    if (status.dueCount > 0) return "continue";
    if (status.newCount > 0) return "learn";
    return "idle";
}

export function getDeckStatus(cards: FlashCard[]): DeckStatus {
    return {
        newCount: getNewCards(cards).length,
        dueCount: getDueCards(cards).length,
        totalCount: cards.length,
    };
}
