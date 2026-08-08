/**
 * useEditableLesson — Resolves the lesson + cards being edited.
 *
 * @remarks
 * Handles two distinct flows:
 * 1. **Personal edit**: the current user's own deck (realtime, via
 *    useLessons/useCards).
 * 2. **Shared edit (collaboration)**: a deck owned by another user
 *    (`ownerId` differs from the current user). Fetched one-shot from the
 *    owner's Firestore namespace via the tanstack-query-firebase bridge —
 *    a genuine one-shot read never covered by an onSnapshot listener (the
 *    app's realtime hooks only ever watch the *current* user's own
 *    lessons/cards), cached for the app's default staleTime and deduped
 *    across remounts instead of refetched unconditionally on every mount.
 */
"use client";

import { useCollectionQuery, useDocumentQuery } from "@tanstack-query-firebase/react/firestore";
import { query, where } from "firebase/firestore";

import { lessonDoc, normalizeLesson } from "@/features/flashcard/services";
import { cardsCol } from "@/features/flashcard/services/card.service";
import { sortByOrder } from "@/features/flashcard/utils";
import { useAppStore } from "@/lib/app-store";
import { useCards } from "./useCards";
import { useLessons } from "./useLessons";

import type { FlashCard } from "../types";

export function useEditableLesson(id: string, ownerId: string | null) {
    const { user } = useAppStore();
    const isSharedEdit = !!ownerId && ownerId !== user?.uid;

    const { lessons, saveFullLesson, deleteLesson } = useLessons();
    const { cards: ownCards } = useCards(id);

    /**
     * `enabled` gates both queries off entirely outside shared-edit mode; the
     * `|| "_disabled_"` fallback keeps the ref/query construction itself
     * valid (a real DocumentReference/Query object is still required even
     * when disabled) without ever letting a disabled query actually run.
     */
    const sharedLessonQuery = useDocumentQuery(lessonDoc(ownerId || "_disabled_", id), {
        queryKey: ["shared-edit-lesson", ownerId, id],
        enabled: isSharedEdit && !!ownerId,
    });
    const sharedCardsQuery = useCollectionQuery(
        query(cardsCol(ownerId || "_disabled_"), where("lessonId", "==", id)),
        { queryKey: ["shared-edit-cards", ownerId, id], enabled: isSharedEdit && !!ownerId },
    );

    const sharedLessonSnap = sharedLessonQuery.data;
    const sharedLesson =
        sharedLessonSnap && sharedLessonSnap.exists()
            ? normalizeLesson({ ...sharedLessonSnap.data(), id: sharedLessonSnap.id })
            : null;
    const sharedCards = sortByOrder(
        (sharedCardsQuery.data?.docs ?? []).map((d) => ({ ...d.data(), id: d.id }) as FlashCard),
    );
    const loadingShared =
        isSharedEdit && (sharedLessonQuery.isLoading || sharedCardsQuery.isLoading);

    const lesson = isSharedEdit ? sharedLesson : lessons.find((l) => l.id === id);
    const cards = isSharedEdit ? sharedCards : ownCards;
    const loading = isSharedEdit ? loadingShared : !lesson;

    return { lesson, cards, loading, isSharedEdit, saveFullLesson, deleteLesson };
}
