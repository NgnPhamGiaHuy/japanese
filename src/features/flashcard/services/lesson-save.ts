/**
 * @file lesson-save
 * saveLessonWithCards — diff-based, non-destructive atomic save — split out
 * of lesson.service.ts (E11-T3). Kept separate from the other, simpler
 * write operations in lesson.service.ts because this is the single most
 * complex operation in the whole lesson domain (validation, diffing against
 * existing cards, Storage image cleanup, fractional-index re-stamping, all
 * inside one WriteBatch).
 */
import { doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { generateNKeysBetween } from "fractional-indexing";

import { auth, db } from "@/lib/firebase";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import { lessonMetadataSchema } from "@/shared/schemas";
import { cardDoc, cardsCol } from "./card.service";
import { deleteCardImage } from "./image.service";
import { lessonDoc, lessonsCol } from "./lesson-paths";
import { CardValidationError, validateAtomicCard } from "../utils/card.validator";

import type { FlashCard, Lesson } from "../types";

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
    const titleCheck = lessonMetadataSchema.shape.title.safeParse(lesson.title);
    if (!titleCheck.success) {
        throw new Error(titleCheck.error.issues[0]?.message ?? "Lesson title is required");
    }
    validateCardIds(cards);

    // ── Atomic Card validation — must pass before any Firestore write ─────
    const allViolations = cards.flatMap((card) => validateAtomicCard(card).violations);
    if (allViolations.length > 0) {
        throw new CardValidationError(
            "One or more cards violate the Atomic Card principle",
            allViolations,
        );
    }

    const batch = writeBatch(db);
    let targetLessonId = lesson.id;

    if (isNew) {
        const newRef = doc(lessonsCol(userId));
        targetLessonId = newRef.id;
        batch.set(newRef, {
            ...omitUndefined({ ...lesson }),
            id: targetLessonId,
            userId,
            ownerId: userId,
            ownerName: lesson.ownerName ?? null,
            ownerAvatar: lesson.ownerAvatar ?? null,
            cardCount: cards.length,
            roles: { [userId]: "owner" },
            collaborators: [userId],
            allowLinkAccess: false,
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
                    const orphanedImagePath = existing.imagePath;
                    deleteCardImage(orphanedImagePath).catch((err) => {
                        console.error("[lesson-save] deleteCardImage (removed card) failed:", err);
                        enqueueClientLog(() => auth.currentUser!.getIdToken(), {
                            action: ActivityAction.STORAGE_CLEANUP_FAILED,
                            entityType: "card",
                            entityId: existing.id,
                            level: "error",
                            metadata: { imagePath: orphanedImagePath, error: String(err) },
                        });
                    });
                }
            }
        }

        // Detect cleared images on UPDATED cards (card kept but image removed)
        for (const card of cards) {
            if (!card.id || card.id.startsWith("c_")) continue;
            const existing = existingById.get(card.id);
            if (existing?.imagePath && !card.imagePath) {
                const clearedImagePath = existing.imagePath;
                deleteCardImage(clearedImagePath).catch((err) => {
                    console.error("[lesson-save] deleteCardImage (cleared image) failed:", err);
                    enqueueClientLog(() => auth.currentUser!.getIdToken(), {
                        action: ActivityAction.STORAGE_CLEANUP_FAILED,
                        entityType: "card",
                        entityId: existing.id,
                        level: "error",
                        metadata: { imagePath: clearedImagePath, error: String(err) },
                    });
                });
            }
        }
    }

    // ── Upsert all incoming cards with explicit sort order ────────────────
    // Every save re-stamps every card's order as a fresh fractional-indexing
    // key sequence (matching the incoming array's order) — this is also what
    // transparently migrates a still-legacy-numeric lesson's cards onto the
    // new scheme the first time it's saved after this migration shipped, no
    // separate backfill needed. `sortOrder` (the pre-fractional-indexing
    // legacy field) is no longer written — sortByOrder only ever falls back
    // to it when `order` is unset, which is never true for a saved card.
    const orderKeys = generateNKeysBetween(null, null, cards.length);
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const isTemp = !card.id || card.id.startsWith("c_");
        const ref = isTemp ? doc(cardsCol(userId)) : cardDoc(userId, card.id);

        const { id: _cardId, sortOrder: _sortOrder, ...rawData } = card as FlashCard;
        const cardData = omitUndefined({
            ...rawData,
            lessonId: targetLessonId,
            order: orderKeys[i],
        });

        batch.set(ref, cardData);
    }

    await batch.commit();
}
