/**
 * SpeedConstraintError — Minimum Card Requirement Screen
 *
 * @remarks
 * Displays when deck has fewer than 4 cards (minimum for multiple choice).
 * Provides clear feedback and navigation back to deck.
 */

"use client";

import { useTranslations } from "next-intl";

import { Zap } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
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
    const t = useTranslations("SpeedGame");
    const tCommon = useTranslations("Common");
    const router = useRouter();

    return (
        <div className="bg-bg fixed inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Zap size={48} className="text-survival mb-4" strokeWidth={3} />
            <h2 className="text-text mb-2 text-2xl font-black">{t("needMoreCards")}</h2>
            <p className="text-muted mb-8 font-bold">{t("needMoreCardsMessage")}</p>
            <Button onClick={() => router.back()} variant="secondary">
                {tCommon("goBack")}
            </Button>
        </div>
    );
};

export default SpeedConstraintError;
