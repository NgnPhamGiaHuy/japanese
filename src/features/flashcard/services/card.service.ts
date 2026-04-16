import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";

import type { Unsubscribe } from "firebase/firestore";
import type { FlashCard } from "../types";

// ─── Firestore path helpers ────────────────────────────────────────────────

export function cardsCol(userId: string) {
    return collection(db, "artifacts", APP_ID, "users", userId, "cards");
}

export function cardDoc(userId: string, cardId: string) {
    return doc(db, "artifacts", APP_ID, "users", userId, "cards", cardId);
}

/**
 * Service for managing individual flashcard documents.
 * Includes SRS (Spaced Repetition System) logic and progress management.
 *
 * @remarks
 * Orchestration responsibility:
 * 1. **RT Sync**: Management of deck-scoped subscriptions.
 * 2. **SRS Engine**: Pure logic for interval and ease-factor calculation.
 * 3. **Lifecycle**: CRUD and atomic resets for entire decks.
 */

// ─── Subscribe ────────────────────────────────────────────────────────────

/**
 * Real-time subscription to cards for a specific user.
 *
 * @param userId - Owner of the cards.
 * @param onUpdate - Callback for snapshot changes.
 * @param onError - Error handler for permission or network issues.
 * @param lessonId - Optional filter to scope cards to a specific deck.
 */
export function subscribeCards(
    userId: string,
    onUpdate: (cards: FlashCard[]) => void,
    onError: (err: Error) => void,
    lessonId?: string,
): Unsubscribe {
    const q = lessonId
        ? query(cardsCol(userId), where("lessonId", "==", lessonId))
        : cardsCol(userId);
    return onSnapshot(
        q,
        (snap) => {
            const cards = snap.docs
                .map((d) => assertCardSchema(userId, { ...d.data(), id: d.id } as FlashCard))
                // Sort by explicit sortOrder first, then by document ID as tiebreaker
                .sort((a, b) => {
                    const aOrder = a.sortOrder ?? Infinity;
                    const bOrder = b.sortOrder ?? Infinity;
                    if (aOrder !== bOrder) return aOrder - bOrder;
                    return a.id.localeCompare(b.id);
                });
            onUpdate(cards);
        },
        onError,
    );
}

function assertCardSchema(userId: string, card: FlashCard): FlashCard {
    if (!card.primary || !card.primary.trim()) {
        throw new Error(`[card.service] Invalid card ${card.id}: primary is required`);
    }
    if (card.alternatives === undefined) {
        // Legacy docs may not have alternatives yet; normalize and heal once.
        card.alternatives = [];
        void updateDoc(cardDoc(userId, card.id), { alternatives: [] }).catch(() => {});
    }
    if (!Array.isArray(card.alternatives)) {
        throw new Error(`[card.service] Invalid card ${card.id}: alternatives must be an array`);
    }
    return card;
}

// ─── Write operations ─────────────────────────────────────────────────────

/**
 * Creates a new card with initialized SRS metadata.
 *
 * @returns The newly generated Firestore document ID.
 */
export async function createCard(userId: string, card: Omit<FlashCard, "id">): Promise<string> {
    const initCard = {
        ...card,
        easeFactor: card.easeFactor ?? 2.5,
        interval: card.interval ?? 0,
        repetitions: card.repetitions ?? 0,
        nextReviewAt: card.nextReviewAt ?? Date.now(),
    };
    const ref = await addDoc(cardsCol(userId), initCard);
    return ref.id;
}

export async function updateCard(userId: string, card: FlashCard): Promise<void> {
    const { id, ...data } = card;
    await setDoc(cardDoc(userId, id), data, { merge: true });
}

export async function deleteCard(userId: string, cardId: string): Promise<void> {
    await deleteDoc(cardDoc(userId, cardId));
}

// ─── SRS Processing ───────────────────────────────────────────────────────

const SRS_EASE_MIN = 1.3;
const SRS_EASE_MAX = 2.5;
const SRS_EASE_DEFAULT = 2.5;

/**
 * Four-button SM-2 grade values.
 *
 * - `Again` (0): Forgot — reset card to beginning.
 * - `Hard`  (1): Recalled with significant difficulty.
 * - `Good`  (2): Recalled correctly with some effort.
 * - `Easy`  (3): Recalled instantly and effortlessly.
 */
export type Grade = "Again" | "Hard" | "Good" | "Easy";

/**
 * Applies SM-2 four-button grading to a card and persists the updated SRS fields.
 *
 * Grade → SM-2 mapping:
 *   Again (0): reset repetitions to 0, interval to 1, easeFactor -= 0.20 (min 1.3)
 *   Hard  (1): keep repetitions, interval = max(1, round(prev × 0.8)), easeFactor -= 0.15 (min 1.3)
 *   Good  (2): increment repetitions, interval = round(prev × easeFactor × 1.0), easeFactor unchanged
 *   Easy  (3): increment repetitions, interval = round(prev × easeFactor × 1.3), easeFactor += 0.15 (max 2.5)
 *
 * First-repetition bootstrapping (repetitions === 0 before grading):
 *   Good/Easy: interval → 1 (first exposure, not formula)
 *   After first Good (repetitions becomes 1): next Good → interval 6
 *   Subsequent (repetitions ≥ 2): standard SM-2 formula applies
 *
 * @param userId - UID of the card owner.
 * @param cardId - Target card ID.
 * @param currentCard - Prior state for differential calculation.
 * @param grade - The user's four-button recall quality rating.
 */
export async function gradeCard(
    userId: string,
    cardId: string,
    currentCard: FlashCard,
    grade: Grade,
): Promise<void> {
    let { easeFactor, interval, repetitions } = currentCard;

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
            // easeFactor unchanged
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

    await updateDoc(cardDoc(userId, cardId), {
        interval,
        repetitions,
        easeFactor,
        nextReviewAt,
    });
}

/**
 * Core SRS Algorithm (SM2-inspired) — backward-compatible wrapper around `gradeCard`.
 *
 * @remarks
 * Maps the binary `knew` flag to a `Grade`:
 * - `knew = true`  → `"Good"`
 * - `knew = false` → `"Again"`
 *
 * @param userId - UID of the card owner.
 * @param cardId - Target card ID.
 * @param currentCard - Prior state for differential calculation.
 * @param knew - The user's self-reported recall status.
 *
 * @deprecated Prefer `gradeCard` with an explicit `Grade` for full SM-2 precision.
 */
export async function updateCardProgress(
    userId: string,
    cardId: string,
    currentCard: FlashCard,
    knew: boolean,
): Promise<void> {
    return gradeCard(userId, cardId, currentCard, knew ? "Good" : "Again");
}

// ─── Reset Progress ───────────────────────────────────────────────────────

const FRESH_SRS_STATE = {
    repetitions: 0,
    interval: 0,
    easeFactor: SRS_EASE_DEFAULT,
    nextReviewAt: 0,
};

/** Resets a single card's SRS progress to factory state. */
export async function resetCardProgress(userId: string, cardId: string): Promise<void> {
    await updateDoc(cardDoc(userId, cardId), {
        ...FRESH_SRS_STATE,
        nextReviewAt: Date.now(),
    });
}

/**
 * Atomically resets ALL cards in a lesson via a Firestore WriteBatch.
 * Either all cards are reset or none — no partial state.
 *
 * @param userId - Owner UID.
 * @param lessonId - Deck to reset.
 */
export async function resetLessonProgress(userId: string, lessonId: string): Promise<void> {
    const snap = await getDocs(query(cardsCol(userId), where("lessonId", "==", lessonId)));

    if (snap.empty) return;

    const batch = writeBatch(db);
    const resetPayload = { ...FRESH_SRS_STATE, nextReviewAt: Date.now() };

    for (const docSnap of snap.docs) {
        batch.update(docSnap.ref, resetPayload);
    }

    await batch.commit();
}
