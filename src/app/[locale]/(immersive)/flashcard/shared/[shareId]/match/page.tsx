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

import { useTranslations } from "next-intl";
import { use } from "react";

import { MatchGame, useFlashcardLoader } from "@/features/flashcard";
import { useRouter } from "@/i18n/navigation";
import { LoadingSpinner, NotFoundScreen } from "@/shared/components/ui";

export default function SharedMatchPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const t = useTranslations("Common");
    const router = useRouter();
    const loader = useFlashcardLoader({ type: "shared", shareId });

    // ── Loading State ──────────────────────────────────────────────────────
    if (loader.isLoading) {
        return <LoadingSpinner color="#ce82ff" />;
    }

    // ── 404 Guard ──────────────────────────────────────────────────────────
    if (loader.isNotFound || !loader.data) {
        return <NotFoundScreen title={t("deckNotFound")} onBack={() => router.back()} />;
    }

    // ── Delegate to Feature ────────────────────────────────────────────────
    return <MatchGame data={loader.data} />;
}
