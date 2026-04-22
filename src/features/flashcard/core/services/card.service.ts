import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import {
    gradeCardForUser,
    resetCardProgressForUser,
    resetLessonProgressForUser,
} from "./progress.service";

import type { Unsubscribe } from "firebase/firestore";
import type { FlashCard } from "../types";
import type { Grade } from "../../domain";

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
                // Sort by explicit order (fractional indexing) first, then by document ID as tiebreaker
                .sort((a, b) => {
                    const aOrder = a.order ?? a.sortOrder ?? Infinity;
                    const bOrder = b.order ?? b.sortOrder ?? Infinity;
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
 * Creates a new card document with content fields only.
 *
 * @remarks
 * SRS state is no longer stored on card documents — it lives in
 * userProgress/{userId}/lessons/{lessonId}/cards/{cardId}.
 *
 * @returns The newly generated Firestore document ID.
 */
export async function createCard(userId: string, card: Omit<FlashCard, "id">): Promise<string> {
    const ref = await addDoc(cardsCol(userId), card);
    return ref.id;
}

export async function updateCard(userId: string, card: FlashCard): Promise<void> {
    const { id, ...data } = card;
    await setDoc(cardDoc(userId, id), data, { merge: true });
}

export async function deleteCard(userId: string, cardId: string): Promise<void> {
    await deleteDoc(cardDoc(userId, cardId));
}

/**
 * Updates the order of a single card for O(1) performance.
 */
export async function reorderCard(userId: string, cardId: string, newOrder: number): Promise<void> {
    await updateDoc(cardDoc(userId, cardId), { order: newOrder });
}

// ─── SRS Processing ───────────────────────────────────────────────────────

/**
 * Grades a card and persists the result to the user's progress namespace.
 *
 * @remarks
 * Delegates entirely to progress.service — no writes to card documents.
 * Works for both deck owners and shared users without branching.
 *
 * @param userId - UID of the learner
 * @param cardId - Target card ID
 * @param currentCard - Current card state (for SRS calculation)
 * @param grade - Four-button recall quality rating
 * @param lessonId - Lesson containing the card
 * @param ownerId - UID of the card content owner
 */
export async function gradeCard(
    userId: string,
    cardId: string,
    currentCard: FlashCard,
    grade: Grade,
    lessonId?: string,
    ownerId?: string,
): Promise<void> {
    // Resolve ownerId — falls back to userId for personal decks
    const resolvedOwner = ownerId ?? userId;
    const resolvedLesson = lessonId ?? currentCard.lessonId;

    await gradeCardForUser(userId, resolvedLesson, cardId, resolvedOwner, currentCard, grade);
}

// ─── Reset Progress ───────────────────────────────────────────────────────

/**
 * Resets a single card's SRS progress for the given user.
 *
 * @param userId - Learner UID
 * @param cardId - Card to reset
 * @param lessonId - Lesson containing the card
 */
export async function resetCardProgress(
    userId: string,
    cardId: string,
    lessonId: string,
): Promise<void> {
    await resetCardProgressForUser(userId, lessonId, cardId);
}

/**
 * Resets all card progress for a lesson for the given user.
 *
 * @param userId - Learner UID
 * @param lessonId - Deck to reset
 */
export async function resetLessonProgress(userId: string, lessonId: string): Promise<void> {
    await resetLessonProgressForUser(userId, lessonId);
}
