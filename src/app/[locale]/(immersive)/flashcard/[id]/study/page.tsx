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

import { StudySession, useFlashcardLoader } from "@/features/flashcard";
import { LoadingSpinner } from "@/shared/components/ui";

export default function FlashcardStudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const loader = useFlashcardLoader({ type: "personal", lessonId: id });

    if (loader.isLoading) {
        return <LoadingSpinner />;
    }

    if (loader.isNotFound || !loader.data) return notFound();

    return <StudySession data={loader.data} />;
}
