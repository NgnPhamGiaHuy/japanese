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
import { lessonDoc } from "@/features/flashcard/services/lesson.service";
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
                    setSharedLesson({ ...lessonSnap.data(), id: lessonSnap.id } as Lesson);
                }
                setSharedCards(cardsSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as FlashCard));
                setLoadingShared(false);
            })
            .catch(() => setLoadingShared(false));
    }, [isSharedEdit, ownerId, id]);

    const lesson = isSharedEdit ? sharedLesson : lessons.find((l) => l.id === id);
    const cards = isSharedEdit ? sharedCards : ownCards;
    const loading = isSharedEdit ? loadingShared : !lesson;

    const backPath = returnTo ?? (isSharedEdit ? `/flashcard/${id}` : `/flashcard/${id}`);

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
            editingLesson={{ ...lesson, userId: ownerId ?? lesson.userId }}
            initialCards={cards}
            onSave={async (updatedLesson, updatedCards, isNew) => {
                await saveFullLesson(updatedLesson, updatedCards, isNew);
                router.push(backPath);
            }}
            onDelete={async () => {
                /** Constraint: Editors cannot delete shared decks */
                if (!isSharedEdit) {
                    await deleteLesson(id);
                    router.push("/flashcard");
                } else {
                    alert("Only the owner can delete this deck.");
                }
            }}
            onClose={() => router.push(backPath)}
        />
    );
}
