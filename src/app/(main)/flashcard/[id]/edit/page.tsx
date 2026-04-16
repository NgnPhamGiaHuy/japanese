/**
 * @file FlashcardEditPage
 * Logic orchestrator for editing personal or shared flashcard decks.
 * Integrates with LessonBuilder for the UI.
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";

import { getDoc } from "firebase/firestore";

import { LessonBuilder, useLessons } from "@/features/flashcard";
import { useCards } from "@/features/flashcard/hooks";
import { lessonDoc, normalizeLesson } from "@/features/flashcard/services";
import { useAlert } from "@/shared/providers";
import { sortByOrder } from "@/shared/utils";
import { useAppStore } from "@/store";

import type { FlashCard, Lesson } from "@/features/flashcard/types";

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

    /** State for collaborative edits (fetched ad-hoc) */
    const [sharedLesson, setSharedLesson] = useState<Lesson | null>(null);
    const [sharedCards, setSharedCards] = useState<FlashCard[]>([]);
    const [loadingShared, setLoadingShared] = useState(isSharedEdit);

    /**
     * 🔙 Pure history-based navigation
     */
    const handleBack = () => {
        router.back();
    };

    /**
     * Cross-User Data Fetching
     * Fetches the original lesson and cards from the owner's Firestore paths.
     */
    useEffect(() => {
        if (!isSharedEdit || !ownerId) return;

        Promise.all([
            getDoc(lessonDoc(ownerId, id)),
            import("@/features/flashcard/services/card.service").then(({ cardsCol }) =>
                import("firebase/firestore").then(({ getDocs, query, where }) =>
                    getDocs(query(cardsCol(ownerId), where("lessonId", "==", id))),
                ),
            ),
        ])
            .then(([lessonSnap, cardsSnap]) => {
                if (lessonSnap.exists()) {
                    setSharedLesson(
                        normalizeLesson({
                            ...lessonSnap.data(),
                            id: lessonSnap.id,
                            __ownerIdFallback: ownerId,
                        }),
                    );
                }
                setSharedCards(
                    sortByOrder(
                        cardsSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as FlashCard),
                    ),
                );
                setLoadingShared(false);
            })
            .catch(() => setLoadingShared(false));
    }, [isSharedEdit, ownerId, id]);

    const lesson = isSharedEdit ? sharedLesson : lessons.find((l) => l.id === id);
    const cards = isSharedEdit ? sharedCards : ownCards;
    const loading = isSharedEdit ? loadingShared : !lesson;

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
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
