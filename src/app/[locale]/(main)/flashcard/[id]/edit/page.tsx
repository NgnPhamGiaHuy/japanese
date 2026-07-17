/**
 * @file FlashcardEditPage
 * Logic orchestrator for editing personal or shared flashcard decks.
 * Integrates with LessonBuilder for the UI.
 */

"use client";

import { useSearchParams } from "next/navigation";
import { use } from "react";

import { useCollectionQuery, useDocumentQuery } from "@tanstack-query-firebase/react/firestore";
import { query, where } from "firebase/firestore";

import LessonBuilder from "@/features/flashcard/components/LessonBuilder";
import { useCards } from "@/features/flashcard/hooks";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { lessonDoc, normalizeLesson } from "@/features/flashcard/services";
import { cardsCol } from "@/features/flashcard/services/card.service";
import { useRouter } from "@/i18n/navigation";
import { useAppStore } from "@/lib/app-store";
import { useAlert } from "@/shared/providers";
import { sortByOrder } from "@/shared/utils";

import type { FlashCard } from "@/features/flashcard/types";

/**
 * Flashcard Edit View
 *
 * @remarks
 * This page handles two distinct flows:
 * 1. **Personal Edit**: Simple CRUD on the user's own deck.
 * 2. **Shared Edit (Collaboration)**: Editing a deck owned by another user
 *    (requires `ownerId` in search params). Fetches data from the owner's
 *    Firestore namespace using `isSharedEdit` logic.
 */
export default function FlashcardEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { showAlert } = useAlert();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAppStore();

    /**
     * ownerId param is set when editing a shared lesson (editor role).
     * If present and different from current user, we switch to collaborative mode.
     */
    const ownerId = searchParams.get("ownerId");
    const returnTo = searchParams.get("returnTo");
    const isSharedEdit = !!ownerId && ownerId !== user?.uid;

    const { lessons, saveFullLesson, deleteLesson } = useLessons();
    const { cards: ownCards } = useCards(id);

    /**
     * Returns to the `returnTo` param when present (e.g. shared-edit mode,
     * which links in from a specific share page rather than plain history),
     * otherwise falls back to browser history.
     */
    const handleBack = () => {
        if (returnTo) {
            router.push(returnTo);
            return;
        }
        router.back();
    };

    /**
     * Cross-User Data Fetching (bridged via @tanstack-query-firebase/react)
     * Fetches the original lesson and cards from the owner's Firestore paths —
     * a genuine one-shot read never covered by an onSnapshot listener (the
     * app's realtime hooks only ever watch the *current* user's own lessons/
     * cards), so this is exactly the case the query bridge exists for: cached
     * for the app's default staleTime and deduped across remounts of this
     * route, instead of refetched unconditionally on every mount.
     *
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
            ? normalizeLesson({
                  ...sharedLessonSnap.data(),
                  id: sharedLessonSnap.id,
                  __ownerIdFallback: ownerId,
              })
            : null;
    const sharedCards = sortByOrder(
        (sharedCardsQuery.data?.docs ?? []).map((d) => ({ ...d.data(), id: d.id }) as FlashCard),
    );
    const loadingShared =
        isSharedEdit && (sharedLessonQuery.isLoading || sharedCardsQuery.isLoading);

    const lesson = isSharedEdit ? sharedLesson : lessons.find((l) => l.id === id);
    const cards = isSharedEdit ? sharedCards : ownCards;
    const loading = isSharedEdit ? loadingShared : !lesson;

    if (loading) {
        return (
            <div className="bg-bg fixed inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="bg-bg fixed inset-0 flex items-center justify-center">
                <p className="font-bold text-gray-400">Deck not found.</p>
            </div>
        );
    }

    return (
        <LessonBuilder
            editingLesson={{
                ...lesson,
                ownerId: ownerId ?? lesson.ownerId ?? lesson.userId,
                userId: ownerId ?? lesson.userId,
            }}
            initialCards={cards}
            onSave={async (updatedLesson, updatedCards, isNew) => {
                try {
                    await saveFullLesson(updatedLesson, updatedCards, isNew);
                    showAlert("success", isNew ? "Deck created!" : "Changes saved");
                    handleBack();
                } catch (err) {
                    console.error("[EditPage] Save failed:", err);
                    showAlert("error", "Failed to save changes");
                }
            }}
            onDelete={async () => {
                if (!isSharedEdit) {
                    try {
                        await deleteLesson(id);
                        showAlert("success", "Deck deleted");
                        handleBack();
                    } catch (err) {
                        console.error("[EditPage] Delete failed:", err);
                        showAlert("error", "Failed to delete deck");
                    }
                } else {
                    showAlert("error", "Only the owner can delete this deck.");
                }
            }}
            onClose={handleBack}
        />
    );
}
