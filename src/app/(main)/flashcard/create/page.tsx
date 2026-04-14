/**
 * @file FlashcardCreatePage
 * Entry point for creating a new flashcard deck.
 * Uses LessonBuilder to handle the multi-step creation process.
 */

"use client";

import { useRouter } from "next/navigation";

import { LessonBuilder, useLessons } from "@/features/flashcard";

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
                router.push("/flashcard");
            }}
            onDelete={async (id) => {
                await deleteLesson(id);
                router.push("/flashcard");
            }}
            onClose={() => router.push("/flashcard")}
        />
    );
}
