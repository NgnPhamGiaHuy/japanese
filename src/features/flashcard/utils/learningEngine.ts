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
import { getDueCards, getMistakeCards, getNewCards, reinsertCard } from "../domain/srs";
import { redistributeOverdueCards } from "../services/progress.service";

import type { CardWithProgress } from "../domain";
import type { StudyMode } from "../types";

// Re-exported so existing call sites that import these from learningEngine
// keep working — the implementations now live in domain/srs.ts.
export { getDueCards, getMistakeCards, getNewCards, reinsertCard };

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
