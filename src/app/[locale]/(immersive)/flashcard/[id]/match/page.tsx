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

import { MatchGame } from "@/features/flashcard/games/match";
import { useFlashcardLoader } from "@/features/flashcard/loaders";

export default function MatchModePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const loader = useFlashcardLoader({ type: "personal", lessonId: id });

    // ── Loading State ──────────────────────────────────────────────────────
    if (loader.isLoading) {
        return (
            <div className="bg-bg fixed inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#ce82ff]" />
            </div>
        );
    }

    // ── 404 Guard ──────────────────────────────────────────────────────────
    if (loader.isNotFound || !loader.data) return notFound();

    // ── Delegate to Feature ────────────────────────────────────────────────
    return <MatchGame data={loader.data} />;
}
