/**
 * Speed Quiz Page — Pure Orchestrator
 *
 * @remarks
 * Responsibilities (ONLY):
 * - Extract route params
 * - Load flashcard data via unified loader
 * - Handle loading/404/constraint states
 * - Render SpeedGame feature root
 */

"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { SpeedConstraintError, SpeedGame, useFlashcardLoader } from "@/features/flashcard";
import { LoadingSpinner } from "@/shared/components/ui";

export default function SpeedQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const loader = useFlashcardLoader({ type: "personal", lessonId: id });

    if (loader.isLoading) {
        return <LoadingSpinner color="#ff9600" />;
    }

    if (loader.isNotFound || !loader.data) return notFound();

    if (loader.data.cards.length < 4) {
        return <SpeedConstraintError />;
    }

    return <SpeedGame data={loader.data} />;
}
