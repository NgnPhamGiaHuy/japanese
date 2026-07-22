/**
 * @file lesson-duplicate
 * duplicateLesson — saves a personal copy of a shared/public deck: a fresh
 * lesson doc (no inherited sharing config, sole owner) and fresh cards (new
 * IDs, SRS state reset). Split out of SharedLessonPageClient.tsx's
 * handleDuplicate (cleanup-audit B4) — this was the app's only untested
 * write path, gated on this file's emu test existing before the move.
 */
import { emitNotification } from "@/features/notifications";
import { saveLessonWithCards } from "./lesson-save";
import { FRESH_SRS_STATE } from "../domain/types";

import type { CardWithProgress } from "../domain";
import type { FlashCard, Lesson, SharedLessonViewModel } from "../types";

export interface DuplicateLessonInput {
    sourceLesson: SharedLessonViewModel;
    sourceCards: CardWithProgress[];
    sourceLessonId: string;
    sourceUserId: string;
    newOwner: { uid: string; displayName: string | null; photoURL: string | null };
}

/**
 * @remarks
 * Notifies the source owner (`deck_duplicated`) unless they're duplicating
 * their own deck. Activity-log instrumentation for this action stays
 * client-side (it needs the caller's own fresh ID token) — see
 * SharedLessonPageClient.tsx's call site.
 */
export async function duplicateLesson({
    sourceLesson,
    sourceCards,
    sourceLessonId,
    sourceUserId,
    newOwner,
}: DuplicateLessonInput): Promise<void> {
    const newLesson: Lesson = {
        ...sourceLesson,
        id: "",
        userId: newOwner.uid,
        ownerId: newOwner.uid,
        ownerName: newOwner.displayName,
        ownerAvatar: newOwner.photoURL,
        shareId: undefined,
        allowLinkAccess: false,
        isPublic: false,
        roles: { [newOwner.uid]: "owner" },
        collaborators: [newOwner.uid],
        createdAt: Date.now(),
        sourceLessonId,
        sourceUserId,
    };

    const newCards: FlashCard[] = sourceCards.map((c) => ({
        ...c,
        id: `c_${crypto.randomUUID()}`,
        lessonId: "",
        easeFactor: FRESH_SRS_STATE.easeFactor,
        interval: FRESH_SRS_STATE.interval,
        repetitions: FRESH_SRS_STATE.repetitions,
        nextReviewAt: FRESH_SRS_STATE.nextReviewAt,
    }));

    await saveLessonWithCards(newOwner.uid, newLesson, newCards, true);

    if (sourceUserId && sourceLessonId && sourceUserId !== newOwner.uid) {
        void emitNotification({
            kind: "deck_duplicated",
            ownerId: sourceUserId,
            lessonId: sourceLessonId,
        });
    }
}
