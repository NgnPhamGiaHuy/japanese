/**
 * Flashcard Study Page — Pure Orchestrator
 *
 * @remarks
 * Responsibilities (ONLY):
 * - Extract route params
 * - Load flashcard data via unified loader
 * - Handle loading/404 states
 * - Render StudySession feature root
 */

"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { useFlashcardLoader } from "@/features/flashcard/core/hooks";
import { StudySession } from "@/features/flashcard/games/study";

export default function FlashcardStudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const loader = useFlashcardLoader({ type: "personal", lessonId: id });

    if (loader.isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    if (loader.isNotFound || !loader.data) return notFound();

    return <StudySession data={loader.data} />;
}
