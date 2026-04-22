/**
 * @file User Progress Service — Per-User SRS State Management
 *
 * @remarks
 * This is the NEW progress layer that replaces SRS fields in card documents.
 *
 * Firestore structure:
 * ```
 * userProgress/{userId}/
 *   lessons/{lessonId}/
 *     cards/{cardId}        ← UserCardProgress document
 *   studyStats/
 *     daily                 ← DailyStudyStats document
 * ```
 *
 * Security:
 * - Only {userId} can read/write their own userProgress
 * - Card content remains in users/{ownerId}/cards (read-only for learners)
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { computeNextSRS } from "../../domain/srs";
import { FRESH_SRS_STATE } from "../../domain/types";

import type { CollectionReference, DocumentReference } from "firebase/firestore";
import type { Grade } from "../../domain/srs";
import type { DailyStudyStats, UserCardProgress } from "../../domain/types";

// ─── Firestore Path Helpers ────────────────────────────────────────────────

export function userProgressRoot(userId: string): CollectionReference {
    return collection(db, "artifacts", APP_ID, "userProgress", userId, "lessons");
}

export function userProgressLessonCol(userId: string, lessonId: string): CollectionReference {
    return collection(
        db,
        "artifacts",
        APP_ID,
        "userProgress",
        userId,
        "lessons",
        lessonId,
        "cards",
    );
}

export function userProgressCardDoc(
    userId: string,
    lessonId: string,
    cardId: string,
): DocumentReference {
    return doc(
        db,
        "artifacts",
        APP_ID,
        "userProgress",
        userId,
        "lessons",
        lessonId,
        "cards",
        cardId,
    );
}

export function dailyStatsDoc(userId: string): DocumentReference {
    return doc(db, "artifacts", APP_ID, "userProgress", userId, "studyStats", "daily");
}

// ─── Read Operations ────────────────────────────────────────────────────────

/**
 * Fetches a single card's progress for a user.
 *
 * @returns Progress state, or FRESH_SRS_STATE if never studied.
 */
export async function getUserCardProgress(
    userId: string,
    lessonId: string,
    cardId: string,
): Promise<UserCardProgress> {
    const snap = await getDoc(userProgressCardDoc(userId, lessonId, cardId));

    if (!snap.exists()) {
        // Card never studied — return fresh state
        return {
            cardId,
            lessonId,
            sourceOwnerId: "", // Will be set on first grade
            ...FRESH_SRS_STATE,
            createdAt: Date.now(),
        };
    }

    return snap.data() as UserCardProgress;
}

/**
 * Fetches all card progress for a lesson.
 *
 * @remarks
 * Returns a Map for O(1) lookup when merging with card content.
 * Cards that have never been studied will NOT be in the map.
 *
 * @returns Map<cardId, UserCardProgress>
 */
export async function getUserLessonProgress(
    userId: string,
    lessonId: string,
): Promise<Map<string, UserCardProgress>> {
    const snap = await getDocs(userProgressLessonCol(userId, lessonId));
    const map = new Map<string, UserCardProgress>();

    snap.docs.forEach((d) => {
        const data = d.data() as UserCardProgress;
        map.set(d.id, data);
    });

    return map;
}

/**
 * Fetches progress for multiple lessons (for dashboard stats).
 *
 * @remarks
 * Uses a collection group query — requires Firestore index.
 */
export async function getUserProgressAcrossLessons(
    userId: string,
    lessonIds: string[],
): Promise<Map<string, UserCardProgress[]>> {
    if (lessonIds.length === 0) return new Map();

    const q = query(
        collection(db, "artifacts", APP_ID, "userProgress", userId, "lessons"),
        where("lessonId", "in", lessonIds.slice(0, 10)), // Firestore 'in' limit
    );

    const snap = await getDocs(q);
    const map = new Map<string, UserCardProgress[]>();

    snap.docs.forEach((d) => {
        const data = d.data() as UserCardProgress;
        const existing = map.get(data.lessonId) ?? [];
        existing.push(data);
        map.set(data.lessonId, existing);
    });

    return map;
}

// ─── Write Operations ───────────────────────────────────────────────────────

/**
 * Grades a card and updates the user's progress.
 *
 * @remarks
 * This is the PRIMARY write operation for SRS.
 *
 * Flow:
 * 1. Compute next SRS state (pure function)
 * 2. Write to userProgress/{userId}/lessons/{lessonId}/cards/{cardId}
 * 3. Increment daily review count
 *
 * @param userId - The learner (NOT the card owner)
 * @param lessonId - Lesson containing the card
 * @param cardId - Card being graded
 * @param sourceOwnerId - Owner of the card content (for denormalization)
 * @param currentProgress - Current SRS state
 * @param grade - User's recall quality rating
 */
export async function gradeCardForUser(
    userId: string,
    lessonId: string,
    cardId: string,
    sourceOwnerId: string,
    currentProgress: Pick<UserCardProgress, "easeFactor" | "interval" | "repetitions">,
    grade: Grade,
): Promise<void> {
    const nextSRS = computeNextSRS(currentProgress, grade);

    const progressDoc: Partial<UserCardProgress> = {
        cardId,
        lessonId,
        sourceOwnerId,
        ...nextSRS,
        lastReviewedAt: Date.now(),
    };

    // Create or update progress document
    const ref = userProgressCardDoc(userId, lessonId, cardId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        // First time studying this card
        await setDoc(ref, {
            ...progressDoc,
            createdAt: Date.now(),
        });
    } else {
        // Update existing progress
        await updateDoc(ref, progressDoc);
    }

    // Increment daily review count (fire-and-forget)
    void incrementDailyReviewCount(userId).catch(() => {});
}

/**
 * Resets a single card's progress to factory state.
 *
 * @remarks
 * Soft reset — preserves the document for audit trail.
 */
export async function resetCardProgressForUser(
    userId: string,
    lessonId: string,
    cardId: string,
): Promise<void> {
    const ref = userProgressCardDoc(userId, lessonId, cardId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        // Nothing to reset
        return;
    }

    const current = snap.data() as UserCardProgress;

    await setDoc(
        ref,
        {
            ...FRESH_SRS_STATE,
            nextReviewAt: Date.now(),
            lastResetAt: Date.now(),
            cardId: current.cardId,
            lessonId: current.lessonId,
            sourceOwnerId: current.sourceOwnerId,
            createdAt: current.createdAt,
        },
        { merge: true },
    );
}

/**
 * Resets ALL cards in a lesson for a user.
 *
 * @remarks
 * Atomic batch operation — all cards reset or none.
 */
export async function resetLessonProgressForUser(userId: string, lessonId: string): Promise<void> {
    const snap = await getDocs(userProgressLessonCol(userId, lessonId));

    if (snap.empty) {
        // No progress to reset
        return;
    }

    const batch = writeBatch(db);
    const resetPayload = {
        ...FRESH_SRS_STATE,
        nextReviewAt: Date.now(),
        lastResetAt: Date.now(),
    };

    snap.docs.forEach((d) => {
        batch.update(d.ref, resetPayload);
    });

    await batch.commit();
}

/**
 * Deletes all progress for a lesson (hard delete).
 *
 * @remarks
 * Use this when a user wants to completely remove their learning history.
 * Prefer resetLessonProgressForUser for "start over" functionality.
 */
export async function deleteLessonProgressForUser(userId: string, lessonId: string): Promise<void> {
    const snap = await getDocs(userProgressLessonCol(userId, lessonId));

    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
}

// ─── Daily Stats (Anti-Burnout) ─────────────────────────────────────────────

/**
 * Returns today's date as ISO-8601 UTC string (YYYY-MM-DD).
 */
function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Fetches daily study stats for anti-burnout tracking.
 *
 * @remarks
 * Creates the document if it doesn't exist.
 * Resets count to 0 if the stored date is not today.
 *
 * @returns Current review count and daily cap
 */
export async function getDailyProgress(
    userId: string,
): Promise<{ reviewedToday: number; date: string }> {
    const ref = dailyStatsDoc(userId);
    const today = todayUTC();

    try {
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            // Create fresh stats document
            await setDoc(ref, {
                date: today,
                reviewedCount: 0,
                lastUpdatedAt: Date.now(),
            });
            return { reviewedToday: 0, date: today };
        }

        const data = snap.data() as DailyStudyStats;

        if (data.date !== today) {
            // New day — reset counter
            await setDoc(ref, {
                date: today,
                reviewedCount: 0,
                lastUpdatedAt: Date.now(),
            });
            return { reviewedToday: 0, date: today };
        }

        return { reviewedToday: data.reviewedCount ?? 0, date: data.date };
    } catch (err) {
        console.error("[progress.service] getDailyProgress failed:", err);
        // Fail open — return safe defaults
        return { reviewedToday: 0, date: today };
    }
}

/**
 * Atomically increments the daily review count.
 *
 * @remarks
 * Uses Firestore `increment` to prevent race conditions.
 * Errors are logged and swallowed — never blocks grading.
 */
export async function incrementDailyReviewCount(userId: string): Promise<void> {
    try {
        await updateDoc(dailyStatsDoc(userId), {
            reviewedCount: increment(1),
            lastUpdatedAt: Date.now(),
        });
    } catch (err) {
        console.error("[progress.service] incrementDailyReviewCount failed:", err);
        // Intentionally swallowed — grading must not be blocked by stats failures
    }
}

// ─── Batch Operations (for Catch-Up Mode) ──────────────────────────────────

/**
 * Redistributes overdue cards across the next 3 days.
 *
 * @remarks
 * Used by Catch-Up Mode in learningEngine when overdue count exceeds cap × 2.
 * Writes to userProgress (not card docs).
 */
export async function redistributeOverdueCards(
    userId: string,
    lessonId: string,
    overdueCards: Array<{ cardId: string; interval: number }>,
): Promise<void> {
    if (overdueCards.length === 0) return;

    try {
        const batch = writeBatch(db);
        const now = Date.now();
        const dayMs = 86400000;

        overdueCards.forEach((card, i) => {
            // Distribute evenly across days 1, 2, 3 (round-robin)
            const dayOffset = (i % 3) + 1;
            const newNextReviewAt = now + dayOffset * dayMs;

            const ref = userProgressCardDoc(userId, lessonId, card.cardId);
            batch.update(ref, { nextReviewAt: newNextReviewAt });
        });

        await batch.commit();
    } catch (err) {
        console.error("[progress.service] redistributeOverdueCards failed:", err);
        // Swallow error — Catch-Up Mode is a best-effort optimization
    }
}
