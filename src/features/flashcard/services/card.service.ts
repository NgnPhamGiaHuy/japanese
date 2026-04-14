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
            const cards = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as FlashCard);
            onUpdate(cards);
        },
        onError,
    );
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
 * Core SRS Algorithm (SM2-inspired)
 *
 * @remarks
 * Logic orchestration:
 * 1. **Success (Knew)**: Increments repetitions and scales interval by the current `easeFactor`.
 *    Interval steps: 0 -> 1 -> 6 -> round(old_interval * ease).
 * 2. **Failure (Forgot)**: Resets repetitions and interval, but preserves a slightly
 *    lower `easeFactor` to account for difficulty.
 *
 * @param userId - UID of the card owner.
 * @param cardId - Target card ID.
 * @param currentCard - Prior state for differential calculation.
 * @param knew - The user's self-reported recall status.
 */
export async function updateCardProgress(
    userId: string,
    cardId: string,
    currentCard: FlashCard,
    knew: boolean,
): Promise<void> {
    let { easeFactor, interval, repetitions } = currentCard;

    if (knew) {
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(interval * easeFactor);

        repetitions += 1;
        easeFactor = Math.min(SRS_EASE_MAX, easeFactor + 0.1);
    } else {
        repetitions = 0;
        interval = 1;
        easeFactor = Math.max(SRS_EASE_MIN, easeFactor - 0.2);
    }

    const nextReviewAt = Date.now() + interval * 24 * 60 * 60 * 1000;

    await updateDoc(cardDoc(userId, cardId), {
        interval,
        repetitions,
        easeFactor,
        nextReviewAt,
    });
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
