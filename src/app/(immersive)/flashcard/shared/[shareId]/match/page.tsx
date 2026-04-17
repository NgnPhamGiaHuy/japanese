/**
 * Shared Match Mode Page — Pure Orchestrator
 *
 * @remarks
 * Responsibilities (ONLY):
 * - Extract route params
 * - Load shared flashcard data via unified loader
 * - Handle loading/404 states
 * - Render MatchGame feature root
 *
 * NO business logic, NO game state, NO direct service calls.
 */

"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { useFlashcardLoader } from "@/features/flashcard/core/hooks";
import { MatchGame } from "@/features/flashcard/games/match";
import { LoadingSpinner, NotFoundScreen } from "@/shared/components/ui";

export default function SharedMatchPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const router = useRouter();
    const loader = useFlashcardLoader({ type: "shared", shareId });

    // ── Loading State ──────────────────────────────────────────────────────
    if (loader.isLoading) {
        return <LoadingSpinner color="#ce82ff" />;
    }

    // ── 404 Guard ──────────────────────────────────────────────────────────
    if (loader.isNotFound || !loader.data) {
        return <NotFoundScreen title="Deck Not Found" onBack={() => router.back()} />;
    }

    // ── Delegate to Feature ────────────────────────────────────────────────
    return <MatchGame data={loader.data} />;
}
