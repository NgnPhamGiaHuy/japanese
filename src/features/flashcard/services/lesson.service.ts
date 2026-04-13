import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { cardDoc, cardsCol } from "./card.service";
import { deleteCardImage } from "./image.service";

import type { Unsubscribe } from "firebase/firestore";
import type { FlashCard, Lesson } from "../types/flashcard.types";

// ─── Firestore path helpers ────────────────────────────────────────────────

export function lessonsCol(userId: string) {
    return collection(db, "artifacts", APP_ID, "users", userId, "lessons");
}

export function lessonDoc(userId: string, lessonId: string) {
    return doc(db, "artifacts", APP_ID, "users", userId, "lessons", lessonId);
}

// ─── Share ID helper ───────────────────────────────────────────────────────

/**
 * Deterministically encodes `userId:lessonId` as a URL-safe Base64 token.
 * The encoded token is the shareId — it acts as both the URL slug and the
 * pointer to the lesson's owner + ID, so no extra collection is needed.
 */
export function buildShareId(userId: string, lessonId: string): string {
    const raw = btoa(`${userId}:${lessonId}`);
    return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Subscribe ────────────────────────────────────────────────────────────

export function subscribeLessons(
    userId: string,
    onUpdate: (lessons: Lesson[]) => void,
    onError: (err: Error) => void,
): Unsubscribe {
    return onSnapshot(
        lessonsCol(userId),
        (snap) => {
            const lessons = snap.docs
                .map((d) => ({ ...d.data(), id: d.id }) as Lesson)
                .sort((a, b) => b.createdAt - a.createdAt);
            onUpdate(lessons);
        },
        onError,
    );
}

// ─── Read operations ───────────────────────────────────────────────────────

/**
 * Fetches a shared lesson by its shareId token.
 *
 * The token is a URL-safe Base64 encoding of `userId:lessonId`, so no
 * cross-user or collectionGroup query is needed — we know exactly where to
 * look.  The `isPublic` flag is checked before returning anything.
 */
export async function getSharedLesson(
    shareId: string,
): Promise<{ lesson: Lesson; cards: FlashCard[] } | null> {
    try {
        let base64 = decodeURIComponent(shareId).replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";

        const decoded = atob(base64);
        const [userId, lessonId] = decoded.split(":");
        if (!userId || !lessonId) return null;

        const snap = await getDoc(lessonDoc(userId, lessonId));
        if (!snap.exists()) return null;

        const lesson = { ...snap.data(), id: snap.id } as Lesson;
        if (!lesson.isPublic) return null;

        const cardsSnap = await getDocs(query(cardsCol(userId), where("lessonId", "==", lessonId)));
        const cards = cardsSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as FlashCard);

        return { lesson, cards };
    } catch (err) {
        console.error("[getSharedLesson] Failed:", err);
        return null;
    }
}

// ─── Write operations ──────────────────────────────────────────────────────

export async function updateLesson(userId: string, lesson: Lesson): Promise<void> {
    const { id, ...data } = lesson;
    await setDoc(lessonDoc(userId, id), data, { merge: true });
}

/**
 * Updates share settings for a lesson: generates a stable shareId, sets
 * `isPublic` and `publicRole`.  Calling this with `isPublic: false` revokes
 * public access without destroying the shareId so the link can be re-enabled.
 */
export async function shareLessonSettings(
    userId: string,
    lessonId: string,
    isPublic: boolean,
    publicRole: Lesson["publicRole"],
): Promise<void> {
    const shareId = buildShareId(userId, lessonId);
    await setDoc(lessonDoc(userId, lessonId), { shareId, isPublic, publicRole }, { merge: true });
}

/**
 * Deletes a lesson AND all its cards (including Storage images) in a single
 * batch.  This replaces the old `deleteLesson` which left orphaned cards.
 */
export async function deleteLessonWithCards(userId: string, lessonId: string): Promise<void> {
    const cardsSnap = await getDocs(query(cardsCol(userId), where("lessonId", "==", lessonId)));

    const batch = writeBatch(db);
    const imagesToDelete: string[] = [];

    for (const cardSnap of cardsSnap.docs) {
        const card = { ...cardSnap.data(), id: cardSnap.id } as FlashCard;
        batch.delete(cardSnap.ref);
        if (card.imagePath) imagesToDelete.push(card.imagePath);
    }

    batch.delete(lessonDoc(userId, lessonId));
    await batch.commit();

    for (const path of imagesToDelete) {
        deleteCardImage(path).catch(() => {});
    }
}

// ─── saveLessonWithCards — diff-based, non-destructive ────────────────────

/**
 * Persists a lesson and its complete card set.
 *
 * For existing lessons the service performs a diff against the current cards
 * in Firestore:
 *   • Cards present in Firestore but missing from the incoming set → deleted
 *     (Storage images are also cleaned up).
 *   • Cards with real Firestore IDs → full document replace (preserves nothing
 *     the caller didn't provide, but the caller always passes the full card).
 *   • Cards with temp IDs (prefix "c_") → new documents are created.
 *
 * A Firestore WriteBatch is used so all mutations succeed or fail together.
 */
export async function saveLessonWithCards(
    userId: string,
    lesson: Lesson,
    cards: Omit<FlashCard, "lessonId">[],
    isNew: boolean,
): Promise<void> {
    if (!lesson.title.trim()) {
        throw new Error("Lesson title is required");
    }
    validateCardIds(cards);

    const batch = writeBatch(db);
    let targetLessonId = lesson.id;

    if (isNew) {
        const newRef = doc(lessonsCol(userId));
        targetLessonId = newRef.id;
        batch.set(newRef, {
            ...omitUndefined({ ...lesson }),
            id: targetLessonId,
            userId,
            cardCount: cards.length,
        });
    } else {
        const { id: _id, ...lessonData } = lesson;
        batch.set(
            lessonDoc(userId, targetLessonId),
            { ...omitUndefined(lessonData), cardCount: cards.length },
            { merge: true },
        );

        // ── Diff: find cards that were removed ──────────────────────────────
        const existingSnap = await getDocs(
            query(cardsCol(userId), where("lessonId", "==", targetLessonId)),
        );
        const existingCards = existingSnap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as FlashCard,
        );

        const incomingIds = new Set(
            cards.filter((c) => c.id && !c.id.startsWith("c_")).map((c) => c.id),
        );

        // Build a lookup so we can detect cleared images on existing cards
        const existingById = new Map(existingCards.map((c) => [c.id, c]));

        for (const existing of existingCards) {
            if (!incomingIds.has(existing.id)) {
                // Card was removed — delete from Firestore + Storage
                batch.delete(cardDoc(userId, existing.id));
                if (existing.imagePath) {
                    deleteCardImage(existing.imagePath).catch(() => {});
                }
            }
        }

        // Detect cleared images on UPDATED cards (card kept but image removed)
        for (const card of cards) {
            if (!card.id || card.id.startsWith("c_")) continue;
            const existing = existingById.get(card.id);
            if (existing?.imagePath && !card.imagePath) {
                deleteCardImage(existing.imagePath).catch(() => {});
            }
        }
    }

    // ── Upsert all incoming cards ──────────────────────────────────────────
    for (const card of cards) {
        const isTemp = !card.id || card.id.startsWith("c_");
        const ref = isTemp ? doc(cardsCol(userId)) : cardDoc(userId, card.id);

        const { id: _cardId, ...rawData } = card as FlashCard;
        const cardData = omitUndefined({
            ...rawData,
            lessonId: targetLessonId,
            easeFactor: rawData.easeFactor ?? 2.5,
            interval: rawData.interval ?? 0,
            repetitions: rawData.repetitions ?? 0,
            nextReviewAt: rawData.nextReviewAt ?? Date.now(),
        });

        // Full document replace for both new and existing cards.
        // For existing cards this correctly removes any fields (e.g. imagePath)
        // that the caller no longer includes, without needing merge semantics.
        batch.set(ref, cardData);
    }

    await batch.commit();
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Removes undefined values so Firestore doesn't receive them. */
function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/** Throws if any two cards share the same real (non-temp) ID. */
function validateCardIds(cards: Omit<FlashCard, "lessonId">[]): void {
    const realIds = cards.filter((c) => c.id && !c.id.startsWith("c_")).map((c) => c.id);
    if (new Set(realIds).size !== realIds.length) {
        throw new Error("Duplicate card IDs detected — possible data corruption");
    }
}
