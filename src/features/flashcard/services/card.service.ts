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

import type { Unsubscribe } from "firebase/firestore";
import type { FlashCard } from "../types/flashcard.types";

// ─── Firestore path helpers ────────────────────────────────────────────────

export function cardsCol(userId: string) {
    return collection(db, "artifacts", APP_ID, "users", userId, "cards");
}

export function cardDoc(userId: string, cardId: string) {
    return doc(db, "artifacts", APP_ID, "users", userId, "cards", cardId);
}

// ─── Subscribe ────────────────────────────────────────────────────────────

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

// SRS Processing
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
        easeFactor = easeFactor + 0.1; // simplified increase
    } else {
        repetitions = 0;
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2); // minimum ease 1.3
    }

    const nextReviewAt = Date.now() + interval * 24 * 60 * 60 * 1000;

    await updateDoc(cardDoc(userId, cardId), {
        interval,
        repetitions,
        easeFactor,
        nextReviewAt,
    });
}
