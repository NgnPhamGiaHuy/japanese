/**
 * Shared Speed Mode Page — Pure Orchestrator
 *
 * @remarks
 * Responsibilities (ONLY):
 * - Extract route params
 * - Load shared flashcard data via unified loader
 * - Handle loading/404/constraint states
 * - Render SpeedGame feature root
 *
 * NO business logic, NO game state, NO direct service calls.
 */

"use client";

import { useTranslations } from "next-intl";
import { use } from "react";

import { SpeedConstraintError, SpeedGame } from "@/features/flashcard/games/speed";
import { useFlashcardLoader } from "@/features/flashcard/loaders";
import { useRouter } from "@/i18n/navigation";
import { LoadingSpinner, NotFoundScreen } from "@/shared/components/ui";

export default function SharedSpeedPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const t = useTranslations("Common");
    const router = useRouter();
    const loader = useFlashcardLoader({ type: "shared", shareId });

    // ── Loading State ──────────────────────────────────────────────────────
    if (loader.isLoading) {
        return <LoadingSpinner color="#ff9600" />;
    }

    // ── 404 Guard ──────────────────────────────────────────────────────────
    if (loader.isNotFound || !loader.data) {
        return <NotFoundScreen title={t("deckNotFound")} onBack={() => router.back()} />;
    }

    // ── Constraint Guard ───────────────────────────────────────────────────
    if (loader.data.cards.length < 4) {
        return <SpeedConstraintError />;
    }

    // ── Delegate to Feature ────────────────────────────────────────────────
    return <SpeedGame data={loader.data} />;
}
