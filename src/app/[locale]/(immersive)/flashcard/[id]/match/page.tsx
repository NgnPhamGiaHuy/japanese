/**
 * @file Match Mode Page — Pure Orchestrator
 *
 * @remarks
 * Responsibilities (ONLY):
 * - Extract route params
 * - Load flashcard data via unified loader
 * - Handle loading/404 states
 * - Render MatchGame feature root
 *
 * NO business logic, NO game state, NO direct service calls.
 */

"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { MatchGame, useFlashcardLoader } from "@/features/flashcard";
import { LoadingSpinner } from "@/shared/components/ui";

export default function MatchModePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const loader = useFlashcardLoader({ type: "personal", lessonId: id });

    // ── Loading State ──────────────────────────────────────────────────────
    if (loader.isLoading) {
        return <LoadingSpinner color="#ce82ff" />;
    }

    // ── 404 Guard ──────────────────────────────────────────────────────────
    if (loader.isNotFound || !loader.data) return notFound();

    // ── Delegate to Feature ────────────────────────────────────────────────
    return <MatchGame data={loader.data} />;
}
