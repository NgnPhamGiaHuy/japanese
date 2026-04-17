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

import { useRouter } from "next/navigation";
import { use } from "react";

import { Zap } from "lucide-react";

import { useFlashcardLoader } from "@/features/flashcard/core";
import { SpeedGame } from "@/features/flashcard/games/speed";
import { Button, LoadingSpinner, NotFoundScreen } from "@/shared/components/ui";

export default function SharedSpeedPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const router = useRouter();
    const loader = useFlashcardLoader({ type: "shared", shareId });

    // ── Loading State ──────────────────────────────────────────────────────
    if (loader.isLoading) {
        return <LoadingSpinner color="#ff9600" />;
    }

    // ── 404 Guard ──────────────────────────────────────────────────────────
    if (loader.isNotFound || !loader.data) {
        return <NotFoundScreen title="Deck Not Found" onBack={() => router.back()} />;
    }

    // ── Constraint Guard ───────────────────────────────────────────────────
    if (loader.data.cards.length < 4) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <Zap size={48} className="mb-4 text-[#ff9600]" strokeWidth={3} />
                <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">Need more cards</h2>
                <p className="mb-8 font-bold text-[#afafaf]">
                    Speed mode needs at least 4 cards to generate answer choices.
                </p>
                <Button onClick={() => router.back()} variant="secondary">
                    Go Back
                </Button>
            </div>
        );
    }

    // ── Delegate to Feature ────────────────────────────────────────────────
    return <SpeedGame data={loader.data} />;
}
