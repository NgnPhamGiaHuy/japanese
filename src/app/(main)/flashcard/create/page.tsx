/**
 * @file FlashcardCreatePage
 * Entry point for creating a new flashcard deck.
 * Uses LessonBuilder to handle the multi-step creation process.
 */

"use client";

import { useRouter } from "next/navigation";

import LessonBuilder from "@/features/flashcard/core/components/LessonBuilder";
import { useLessons } from "@/features/flashcard/core/hooks/useLessons";

/**
 * Flashcard Creation View
 *
 * @remarks
 * Orchestrates the creation of a new lesson and its associated cards.
 * On success, redirects the user back to the main dashboard.
 */
export default function FlashcardCreatePage() {
    const router = useRouter();
    const { saveFullLesson, deleteLesson } = useLessons();

    return (
        <LessonBuilder
            onSave={async (lesson, cards, isNew) => {
                await saveFullLesson(lesson, cards, isNew);
                router.back();
            }}
            onDelete={async (id) => {
                await deleteLesson(id);
                router.back();
            }}
            onClose={() => router.back()}
        />
    );
}
