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
        <div className="bg-bg fixed inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Zap size={48} className="text-survival mb-4" strokeWidth={3} />
            <h2 className="text-text mb-2 text-2xl font-black">Need more cards</h2>
            <p className="text-muted mb-8 font-bold">
                Speed mode needs at least 4 cards to generate answer choices.
            </p>
            <Button onClick={() => router.back()} variant="secondary">
                Go Back
            </Button>
        </div>
    );
};

export default SpeedConstraintError;
