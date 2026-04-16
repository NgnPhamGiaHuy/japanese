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

import { doc, getDoc, increment, setDoc, updateDoc, writeBatch } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { shuffleArray } from "@/shared/utils";

import type { FlashCard, StudyMode } from "../types";

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
    queue: FlashCard[];
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
 * - `practice`: Shuffles a mix of overdue cards and a capped subset of new ones,
 *   subject to the Anti-Burnout daily review cap.
 * - `mistake-review`: Focuses precisely on cards the user struggled with in the prior loop.
 *
 * **Anti-Burnout (practice mode)**:
 * - `reviewedToday` is subtracted from the due-card budget.
 * - If `reviewedToday >= dailyReviewCap`, SRS-due cards are excluded entirely.
 * - If `overdueCnt > dailyReviewCap × 2`, Catch-Up_Mode activates: the queue is
 *   capped to `dailyReviewCap` and remaining overdue cards are redistributed across
 *   the next 3 days via a Firestore batch write.
 *
 * @param cards - Raw card list from the database.
 * @param mode - Target study intent.
 * @param mistakeIds - Contextual mistakes from parental state.
 * @param options - Anti-Burnout parameters (all optional).
 * @returns A structured session ready for UI mounting.
 */
export function buildSession(
    cards: FlashCard[],
    mode: StudyMode,
    mistakeIds: string[] = [],
    options: BuildSessionOptions = {},
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
            // ── Validate and apply dailyReviewCap ──────────────────────────
            const rawCap = options.dailyReviewCap;
            if (rawCap !== undefined) {
                if (rawCap >= 1 && rawCap <= 500) {
                    _validatedCap = rawCap;
                }
                // Values outside [1, 500] are silently rejected; _validatedCap retains its value.
            }
            const cap = _validatedCap;

            const reviewedToday = options.reviewedToday ?? 0;
            const remainingBudget = Math.max(0, cap - reviewedToday);

            const newCards = getNewCards(cards);
            const dueCards = getDueCards(cards);
            const overdueCnt = dueCards.length;

            // If the daily cap is exhausted, exclude SRS-due cards entirely.
            if (remainingBudget <= 0) {
                const capped = newCards.slice(0, 10);
                return {
                    queue: shuffleArray(capped),
                    modeLabel: "Practice",
                    updateSRS: true,
                };
            }

            // ── Catch-Up_Mode ──────────────────────────────────────────────
            if (overdueCnt > cap * 2) {
                // Sort by oldest nextReviewAt first (most overdue first).
                const sortedDue = [...dueCards].sort((a, b) => a.nextReviewAt - b.nextReviewAt);
                const sessionDue = sortedDue.slice(0, remainingBudget);
                const overflow = sortedDue.slice(remainingBudget);

                // Distribute overflow across next 3 days asynchronously.
                if (overflow.length > 0 && options.userId) {
                    void _redistributeOverflow(overflow, options.userId);
                }

                const capped = [...sessionDue, ...newCards.slice(0, 10)].slice(0, cap);
                return {
                    queue: shuffleArray(capped),
                    modeLabel: "Practice",
                    updateSRS: true,
                };
            }

            // ── Normal practice: apply remaining budget to due cards ───────
            const budgetedDue = dueCards.slice(0, remainingBudget);
            const capped = [...budgetedDue, ...newCards.slice(0, 10)];
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
 * Distributes overflow overdue cards across the next 3 days via a Firestore batch write.
 * Errors are logged and swallowed — never blocks the session.
 *
 * @internal
 */
async function _redistributeOverflow(overflow: FlashCard[], userId: string): Promise<void> {
    try {
        const batch = writeBatch(db);
        const now = Date.now();
        const dayMs = 86400000;

        overflow.forEach((card, i) => {
            // Distribute evenly across days 1, 2, 3 (round-robin).
            const dayOffset = (i % 3) + 1;
            const newNextReviewAt = now + dayOffset * dayMs;
            const ref = doc(db, "artifacts", APP_ID, "users", userId, "cards", card.id);
            batch.update(ref, { nextReviewAt: newNextReviewAt });
        });

        await batch.commit();
    } catch (err) {
        console.error("[learningEngine] Catch-Up_Mode batch write failed:", err);
    }
}

// ─── Anti-Burnout: Daily Progress ─────────────────────────────────────────

/** Firestore path helper for the daily stats document. */
function dailyStatsDoc(userId: string) {
    return doc(db, "artifacts", APP_ID, "users", userId, "studyStats", "daily");
}

/** Returns today's date as an ISO-8601 UTC date string (e.g. "2025-01-15"). */
function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Reads the daily stats document and returns current Anti-Burnout progress.
 *
 * - Creates the document with `{ date: today, reviewedCount: 0 }` if absent.
 * - Resets `reviewedCount` to 0 if the stored date is not today (UTC).
 * - Returns `catchUpActive: true` when the overdue backlog exceeds `cap × 2`.
 *   (The caller must pass the current card set to determine this; here we
 *   conservatively return `false` — Catch-Up_Mode is activated inside `buildSession`.)
 *
 * @param userId - UID of the authenticated user.
 * @returns `{ reviewedToday, cap, catchUpActive }`
 */
export async function getDailyProgress(userId: string): Promise<{
    reviewedToday: number;
    cap: number;
    catchUpActive: boolean;
}> {
    const ref = dailyStatsDoc(userId);
    const today = todayUTC();

    try {
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            // Document does not exist — create it.
            await setDoc(ref, { date: today, reviewedCount: 0 });
            return { reviewedToday: 0, cap: _validatedCap, catchUpActive: false };
        }

        const data = snap.data() as { date: string; reviewedCount: number };

        if (data.date !== today) {
            // New calendar day — reset the counter.
            await setDoc(ref, { date: today, reviewedCount: 0 });
            return { reviewedToday: 0, cap: _validatedCap, catchUpActive: false };
        }

        return {
            reviewedToday: data.reviewedCount ?? 0,
            cap: _validatedCap,
            catchUpActive: false,
        };
    } catch (err) {
        console.error("[learningEngine] getDailyProgress failed:", err);
        // Fail open — return safe defaults so the session can continue.
        return { reviewedToday: 0, cap: _validatedCap, catchUpActive: false };
    }
}

/**
 * Atomically increments `reviewedCount` in the daily stats document by 1.
 *
 * Uses Firestore `increment` to prevent race conditions across concurrent sessions.
 * Errors are logged and swallowed — this call NEVER blocks card grading.
 *
 * @remarks Only call this for `practice` mode grades, not `mistake-review`.
 *
 * @param userId - UID of the authenticated user.
 */
export async function incrementDailyReviewCount(userId: string): Promise<void> {
    try {
        await updateDoc(dailyStatsDoc(userId), { reviewedCount: increment(1) });
    } catch (err) {
        console.error("[learningEngine] incrementDailyReviewCount failed:", err);
        // Intentionally swallowed — grading must not be blocked by stats failures.
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
export function reinsertCard(queue: FlashCard[], fromIndex: number): FlashCard[] {
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
