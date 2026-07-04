/**
 * SpeedConstraintError — Minimum Card Requirement Screen
 *
 * @remarks
 * Displays when deck has fewer than 4 cards (minimum for multiple choice).
 * Provides clear feedback and navigation back to deck.
 */

"use client";

import { useRouter } from "next/navigation";

import { Zap } from "lucide-react";

import { Button } from "@/shared/components/ui";

/**
 * Constraint violation screen for Speed mode
 *
 * @remarks
 * Speed mode requires minimum 4 cards to generate:
 * - 1 correct answer
 * - 3 distinct distractors
 */
const SpeedConstraintError = () => {
    const router = useRouter();

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg p-6 text-center">
            <Zap size={48} className="mb-4 text-survival" strokeWidth={3} />
            <h2 className="mb-2 text-2xl font-black text-text">Need more cards</h2>
            <p className="mb-8 font-bold text-muted">
                Speed mode needs at least 4 cards to generate answer choices.
            </p>
            <Button onClick={() => router.back()} variant="secondary">
                Go Back
            </Button>
        </div>
    );
};

export default SpeedConstraintError;
