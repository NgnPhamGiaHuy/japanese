/**
 * Service orchestrator for Lesson (Deck) metadata and atomic deep-saves.
 *
 * @remarks
 * High-value logic zone:
 * 1. **RT Subscription**: Syncs deck metadata.
 * 2. **Deep-Deletes**: Batch commitment to clear entire card collections plus Storage blobs.
 * 3. **Diff-based Saving**: Complex atomic upsert that normalizes IDs and garbage-collects unused assets.
 *
 * Split from a single 550-line file (E11-T3): path helpers → lesson-paths.ts,
 * normalizeLesson → lesson-normalize.ts, the 3 subscribe* listeners →
 * lesson-subscriptions.ts, saveLessonWithCards → lesson-save.ts. This file
 * keeps the remaining simple write operations and re-exports everything
 * else, so every existing import path (`./lesson.service`, and the
 * `export * from "./lesson.service"` in services/index.ts) keeps working
 * unchanged.
 */
import { getDocs, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import { cardsCol } from "./card.service";
import { deleteCardImage } from "./image.service";
import { buildShareId, lessonDoc } from "./lesson-paths";

import type { OrderChange } from "@/shared/utils";
import type { DeckAccessRole, FlashCard, Lesson } from "../types";

export { buildShareId, lessonDoc, lessonsCol } from "./lesson-paths";
export { newestFirst, normalizeLesson } from "./lesson-normalize";
export {
    subscribeLessons,
    subscribePublicLessons,
    subscribeSharedLessons,
} from "./lesson-subscriptions";
export { saveLessonWithCards } from "./lesson-save";

// ─── Write operations ──────────────────────────────────────────────────────

export async function updateLesson(userId: string, lesson: Lesson): Promise<void> {
    const { id, ...data } = lesson;
    await setDoc(lessonDoc(userId, id), data, { merge: true });
}

/**
 * Applies a batch of fractional-index order changes (see
 * `reorderWithFractionalIndex`, which always renormalizes the whole
 * reordered set) in a single atomic write.
 */
export async function reorderLessons(userId: string, changes: OrderChange[]): Promise<void> {
    const batch = writeBatch(db);
    for (const { id, order } of changes) {
        batch.update(lessonDoc(userId, id), { order });
    }
    await batch.commit();
}

/**
 * Updates link-based share settings for a lesson.
 *
 * @param isPublic - When true, the deck is fully public and discoverable without a link.
 *                   When false with allowLinkAccess true, the deck is link-only (not discoverable).
 */
export async function shareLessonSettings(
    userId: string,
    lessonId: string,
    allowLinkAccess: boolean,
    publicRole: Lesson["publicRole"],
    sharedById: string,
    sharedByName?: string | null,
    sharedByAvatar?: string | null,
    isPublic?: boolean,
): Promise<void> {
    const shareId = buildShareId(userId, lessonId);
    await setDoc(
        lessonDoc(userId, lessonId),
        {
            shareId,
            allowLinkAccess,
            publicRole,
            isPublic: isPublic ?? allowLinkAccess,
            lastSharedBy: sharedById,
            lastSharedByName: sharedByName ?? null,
            lastSharedByAvatar: sharedByAvatar ?? null,
            lastSharedAt: Date.now(),
        },
        { merge: true },
    );
}

/**
 * Updates the explicitly invited collaborators and their roles.
 * Uses updateDoc (not setDoc+merge) so removed keys are actually deleted from Firestore.
 */
export async function updateLessonRoles(
    userId: string,
    lessonId: string,
    roles: Record<string, DeckAccessRole>,
    collaborators: string[],
    sharedById: string,
    sharedByName?: string | null,
    sharedByAvatar?: string | null,
): Promise<void> {
    await updateDoc(lessonDoc(userId, lessonId), {
        roles,
        collaborators,
        lastSharedBy: sharedById,
        lastSharedByName: sharedByName ?? null,
        lastSharedByAvatar: sharedByAvatar ?? null,
        lastSharedAt: Date.now(),
    });
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
        deleteCardImage(path).catch((err) => {
            console.error("[lesson.service] deleteCardImage failed:", err);
            enqueueClientLog(() => auth.currentUser!.getIdToken(), {
                action: ActivityAction.STORAGE_CLEANUP_FAILED,
                entityType: "deck",
                entityId: lessonId,
                level: "error",
                metadata: { imagePath: path, error: String(err) },
            });
        });
    }
}
