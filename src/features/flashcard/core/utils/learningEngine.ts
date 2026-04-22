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
import { redistributeOverdueCards } from "../services";

import type { StudyMode } from "../types";
import type { CardWithProgress } from "../../domain";

// ─── Anti-Burnout: validated cap state ────────────────────────────────────

/**
 * Module-level validated daily review cap.
 * Defaults to 50; only updated when a value in [1, 500] is provided.
 */
let _validatedCap = 50;

/**
 * Model representing a study session's configuration and initial state.
 * Consumed by player components to initialize their internal queue.
 */
export interface LearningSession {
    /** Ordered queue of cards ready for the player to iterate through */
    queue: CardWithProgress[];
    /** Human-readable label for HUD and progress tracking (e.g., 'Practice') */
    modeLabel: string;
    /** Whether progress on these cards should persist to the SRS database on answer */
    updateSRS: boolean;
}

/**
 * Anti-Burnout configuration for `buildSession`.
 *
 * All fields are optional — existing 3-argument call sites continue to work.
 */
export interface BuildSessionOptions {
    /** Maximum SRS-due cards to present per calendar day (default: 50). */
    dailyReviewCap?: number;
    /** Cards already reviewed today, from `getDailyProgress`. */
    reviewedToday?: number;
    /** Whether Catch-Up_Mode is currently active, from `getDailyProgress`. */
    catchUpActive?: boolean;
    /** User ID required for Catch-Up_Mode Firestore batch write. */
    userId?: string;
    /** Lesson ID required for Catch-Up_Mode Firestore batch write. */
    lessonId?: string;
}

/**
 * Filters for cards the user has never studied (zero repetitions found).
 */
export const getNewCards = (cards: CardWithProgress[]): CardWithProgress[] =>
    cards.filter((c) => c.repetitions === 0);

/**
 * Filters for cards whose calculated review epoch has passed.
 */
export const getDueCards = (cards: CardWithProgress[]): CardWithProgress[] =>
    cards.filter((c) => c.nextReviewAt <= Date.now() && c.repetitions > 0);

/**
 * Filters for cards flagged as mistakes via the persisted isMistake field.
 *
 * @remarks
 * isMistake is written to Firestore on every grade, so this survives refresh.
 * It is set true on Again/Hard, cleared on Good/Easy.
 */
export const getMistakeCards = (cards: CardWithProgress[]): CardWithProgress[] =>
    cards.filter((c) => c.isMistake);

/**
 * Core factory for generating a study segment based on mode and state.
 *
 * @remarks
 * mistake-review mode now derives its queue from the persisted isMistake field
 * on each card — no in-memory mistakeIds needed.
 */
export function buildSession(
    cards: CardWithProgress[],
    mode: StudyMode,
    options: BuildSessionOptions = {},
): LearningSession {
    switch (mode) {
        case "learn": {
            const queue = getNewCards(cards);
            return { queue, modeLabel: "Learn", updateSRS: true };
        }

        case "practice": {
            const rawCap = options.dailyReviewCap;
            if (rawCap !== undefined && rawCap >= 1 && rawCap <= 500) {
                _validatedCap = rawCap;
            }
            const cap = _validatedCap;
            const reviewedToday = options.reviewedToday ?? 0;
            const remainingBudget = Math.max(0, cap - reviewedToday);

            const newCards = getNewCards(cards);
            const dueCards = getDueCards(cards);
            const overdueCnt = dueCards.length;

            if (remainingBudget <= 0) {
                return {
                    queue: shuffleArray(newCards.slice(0, 10)),
                    modeLabel: "Practice",
                    updateSRS: true,
                };
            }

            if (overdueCnt > cap * 2) {
                const sortedDue = [...dueCards].sort((a, b) => a.nextReviewAt - b.nextReviewAt);
                const sessionDue = sortedDue.slice(0, remainingBudget);
                const overflow = sortedDue.slice(remainingBudget);

                if (overflow.length > 0 && options.userId && options.lessonId) {
                    void _redistributeOverflow(overflow, options.userId, options.lessonId);
                }

                return {
                    queue: shuffleArray([...sessionDue, ...newCards.slice(0, 10)].slice(0, cap)),
                    modeLabel: "Practice",
                    updateSRS: true,
                };
            }

            return {
                queue: shuffleArray([
                    ...dueCards.slice(0, remainingBudget),
                    ...newCards.slice(0, 10),
                ]),
                modeLabel: "Practice",
                updateSRS: true,
            };
        }

        case "mistake-review": {
            // Derived from persisted isMistake field — survives refresh
            const queue = getMistakeCards(cards);
            return { queue: shuffleArray(queue), modeLabel: "Mistake Review", updateSRS: true };
        }
    }
}

/**
 * Distributes overflow overdue cards across the next 3 days via a Firestore batch write.
 * Errors are logged and swallowed — never blocks the session.
 *
 * @internal
 */
async function _redistributeOverflow(
    overflow: CardWithProgress[],
    userId: string,
    lessonId: string,
): Promise<void> {
    try {
        const overdueCards = overflow.map((card) => ({
            cardId: card.id,
            interval: card.interval,
        }));
        await redistributeOverdueCards(userId, lessonId, overdueCards);
    } catch (err) {
        console.error("[learningEngine] Catch-Up_Mode batch write failed:", err);
    }
}

// ─── Again Re-insertion ────────────────────────────────────────────────────

/**
 * Pure function — returns a new queue with the card at `fromIndex` re-inserted
 * at `fromIndex + offset` where `offset ∈ [3, 5]` (random), clamped to the
 * last valid index.
 *
 * @remarks
 * Edge cases:
 * - Queue of length 1: re-inserts at index 0 (same position).
 * - Short queues (length < 4): insertion index is clamped to `queue.length - 1`.
 *
 * @param queue - Current session card queue.
 * @param fromIndex - Index of the card to re-insert (the card that received `Again`).
 * @returns A new array with the card repositioned.
 */
export function reinsertCard(queue: CardWithProgress[], fromIndex: number): CardWithProgress[] {
    if (queue.length <= 1) {
        // Nothing to reorder — return a shallow copy.
        return [...queue];
    }

    // Remove the card from its current position.
    const newQueue = [...queue];
    const [card] = newQueue.splice(fromIndex, 1);

    // Random offset in [3, 5].
    const offset = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5

    // Insertion index relative to the post-removal array, clamped to last valid index.
    const insertAt = Math.min(fromIndex + offset, newQueue.length);

    newQueue.splice(insertAt, 0, card);
    return newQueue;
}

export interface DeckStatus {
    newCount: number;
    dueCount: number;
    /** Cards with isMistake === true (persisted, survives refresh) */
    mistakeCount: number;
    totalCount: number;
}

export type DeckAction = "continue" | "learn" | "idle";

export function recommendedAction(status: DeckStatus): DeckAction {
    if (status.dueCount > 0) return "continue";
    if (status.newCount > 0) return "learn";
    return "idle";
}

export function getDeckStatus(cards: CardWithProgress[]): DeckStatus {
    return {
        newCount: getNewCards(cards).length,
        dueCount: getDueCards(cards).length,
        mistakeCount: getMistakeCards(cards).length,
        totalCount: cards.length,
    };
}
