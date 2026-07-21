/**
 * Shared Study Mode Page — Pure Orchestrator
 *
 * @remarks
 * Responsibilities (ONLY):
 * - Extract route params
 * - Load shared flashcard data via unified loader
 * - Handle loading/404 states
 * - Render StudySession feature root
 *
 * NO business logic, NO state management, NO direct service calls.
 */

"use client";

import { useTranslations } from "next-intl";
import { use } from "react";

import { StudySession, useFlashcardLoader } from "@/features/flashcard";
import { useRouter } from "@/i18n/navigation";
import { LoadingSpinner, NotFoundScreen } from "@/shared/components/ui";

export default function SharedStudyPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const t = useTranslations("Common");
    const router = useRouter();
    const loader = useFlashcardLoader({ type: "shared", shareId });

    // ── Loading State ──────────────────────────────────────────────────────
    if (loader.isLoading) {
        return <LoadingSpinner color="#1cb0f6" />;
    }

    // ── 404 Guard ──────────────────────────────────────────────────────────
    if (loader.isNotFound || !loader.data) {
        return <NotFoundScreen title={t("deckNotFound")} onBack={() => router.back()} />;
    }

    // ── Delegate to Feature ────────────────────────────────────────────────
    return <StudySession data={loader.data} />;
}
