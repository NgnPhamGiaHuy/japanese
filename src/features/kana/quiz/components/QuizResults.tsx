/**
 * QuizResults — Results screen after quiz completion
 *
 * @remarks
 * Shows final score and provides options to play again or change mode.
 */

"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui";

import type { QuizResultsProps } from "../types";

export function QuizResults({
    score,
    targetScore,
    alphabet,
    themeColor,
    onPlayAgain,
    onChangeMode,
}: QuizResultsProps) {
    const t = useTranslations("KanaQuiz");
    const tGame = useTranslations("Game");
    const isPerfect = score >= targetScore;

    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col overflow-y-auto">
            <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8">
                <div
                    className={`mb-4 flex h-20 w-20 -rotate-6 items-center justify-center rounded-[1.75rem] border-b-8 text-4xl font-medium text-white shadow-sm ${themeColor.bg}`}
                    style={{ borderColor: themeColor.border }}
                >
                    {isPerfect ? "🏆" : "✓"}
                </div>
                <h2 className="text-text mb-1 text-4xl font-black">
                    {isPerfect ? t("perfect") : t("done")}
                </h2>
                <p className="text-muted mb-1 text-xl font-bold">
                    {t("score")}{" "}
                    <span className={`mx-1 text-3xl font-black ${themeColor.text}`}>{score}</span>
                    <span className="text-muted text-base">/ {targetScore}</span>
                </p>
                <p className="text-muted mb-6 text-sm font-bold">
                    {isPerfect ? t("perfectMessage") : t("keepPractising")}
                </p>

                <div className="mb-6 w-full space-y-3">
                    <Button
                        alphabet={alphabet}
                        onClick={onPlayAgain}
                        className="w-full py-5 text-xl"
                    >
                        {tGame("playAgain")}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onChangeMode}
                        className="w-full py-4 text-lg"
                    >
                        {tGame("changeMode")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
