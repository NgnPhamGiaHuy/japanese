/**
 * @file SRS Algorithm — Pure Domain Logic
 *
 * @remarks
 * SM-2 (SuperMemo 2) implementation with four-button grading.
 *
 * This module is PURE — no side effects, no Firestore calls, no React.
 * All functions are deterministic and testable.
 *
 * Grade mapping:
 * - Again (0): Forgot — reset to beginning
 * - Hard  (1): Recalled with difficulty
 * - Good  (2): Recalled correctly
 * - Easy  (3): Recalled instantly
 */

import type { UserCardProgress } from "./types";

const SRS_EASE_MIN = 1.3;
const SRS_EASE_MAX = 2.5;

/**
 * Four-button SM-2 grade values.
 */
export type Grade = "Again" | "Hard" | "Good" | "Easy";

/**
 * Derives the learning status from SRS fields.
 *
 * @remarks
 * Pure function — called after every grade so status is always persisted.
 *
 * - new:      repetitions === 0 (never studied)
 * - learning: repetitions 1-2 (short-term acquisition)
 * - review:   repetitions >= 3 (entered spaced review)
 * - mastered: interval >= 21 days (3-week+ retention demonstrated)
 */
export function deriveStatus(repetitions: number, interval: number): UserCardProgress["status"] {
    if (repetitions === 0) return "new";
    if (interval >= 21) return "mastered";
    if (repetitions >= 3) return "review";
    return "learning";
}

/**
 * Computes the next SRS state after grading a card.
 *
 * @remarks
 * Pure function — no side effects.
 * Returns all fields needed to update UserCardProgress in one write.
 *
 * @param current - Current SRS state
 * @param grade - User's recall quality rating
 * @returns New SRS state including status, lastResult, isMistake
 */
export function computeNextSRS(
    current: Pick<UserCardProgress, "easeFactor" | "interval" | "repetitions">,
    grade: Grade,
): Pick<
    UserCardProgress,
    | "easeFactor"
    | "interval"
    | "repetitions"
    | "nextReviewAt"
    | "status"
    | "lastResult"
    | "isMistake"
> {
    let { easeFactor, interval, repetitions } = current;

    switch (grade) {
        case "Again":
            repetitions = 0;
            interval = 1;
            easeFactor = Math.max(SRS_EASE_MIN, easeFactor - 0.2);
            break;

        case "Hard":
            // repetitions unchanged
            interval = Math.max(1, Math.round(interval * 0.8));
            easeFactor = Math.max(SRS_EASE_MIN, easeFactor - 0.15);
            break;

        case "Good":
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor * 1.0);
            }
            repetitions += 1;
            break;

        case "Easy":
            if (repetitions === 0) {
                interval = 1;
            } else {
                interval = Math.round(interval * easeFactor * 1.3);
            }
            repetitions += 1;
            easeFactor = Math.min(SRS_EASE_MAX, easeFactor + 0.15);
            break;
    }

    const nextReviewAt = Date.now() + interval * 86400000;

    return {
        easeFactor,
        interval,
        repetitions,
        nextReviewAt,
        status: deriveStatus(repetitions, interval),
        lastResult: grade,
        // isMistake clears on Good/Easy, sets on Again/Hard
        isMistake: grade === "Again" || grade === "Hard",
    };
}

/**
 * Filters cards that have never been studied (zero repetitions).
 */
export function getNewCards<T extends { repetitions: number }>(cards: T[]): T[] {
    return cards.filter((c) => c.repetitions === 0);
}

/**
 * Filters cards whose review time has passed.
 */
export function getDueCards<T extends { nextReviewAt: number; repetitions: number }>(
    cards: T[],
): T[] {
    const now = Date.now();
    return cards.filter((c) => c.nextReviewAt <= now && c.repetitions > 0);
}

/**
 * Filters cards that are flagged as mistakes (persisted isMistake field).
 *
 * @remarks
 * This replaces the old in-memory mistakeIds pattern.
 * isMistake is persisted to Firestore so it survives refresh.
 */
export function getMistakeCards<T extends { isMistake: boolean }>(cards: T[]): T[] {
    return cards.filter((c) => c.isMistake);
}

/**
 * Re-inserts a card 3-5 positions ahead in the queue (for "Again" grades).
 *
 * @remarks
 * Pure function — returns a new array, does not mutate input.
 */
export function reinsertCard<T>(queue: T[], fromIndex: number): T[] {
    if (queue.length <= 1) {
        return [...queue];
    }

    const newQueue = [...queue];
    const [card] = newQueue.splice(fromIndex, 1);

    // Random offset in [3, 5]
    const offset = 3 + Math.floor(Math.random() * 3);
    const insertAt = Math.min(fromIndex + offset, newQueue.length);

    newQueue.splice(insertAt, 0, card);
    return newQueue;
}
