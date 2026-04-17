/**
 * QuizResults — Results screen after quiz completion
 *
 * @remarks
 * Shows final score and provides options to play again or change mode.
 */

"use client";

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
    const isPerfect = score >= targetScore;

    return (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]">
            <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8">
                <div
                    className={`mb-4 flex h-20 w-20 -rotate-6 items-center justify-center rounded-[1.75rem] border-b-8 text-4xl font-medium text-white shadow-sm ${themeColor.bg}`}
                    style={{ borderColor: themeColor.border }}
                >
                    {isPerfect ? "🏆" : "✓"}
                </div>
                <h2 className="mb-1 text-4xl font-black text-[#3c3c3c]">
                    {isPerfect ? "Perfect!" : "Done!"}
                </h2>
                <p className="mb-1 text-xl font-bold text-[#afafaf]">
                    Score:{" "}
                    <span className={`mx-1 text-3xl font-black ${themeColor.text}`}>{score}</span>
                    <span className="text-base text-[#afafaf]">/ {targetScore}</span>
                </p>
                <p className="mb-6 text-sm font-bold text-[#afafaf]">
                    {isPerfect ? "You answered all questions correctly!" : "Keep practising!"}
                </p>

                <div className="mb-6 w-full space-y-3">
                    <Button
                        alphabet={alphabet}
                        onClick={onPlayAgain}
                        className="w-full py-5 text-xl"
                    >
                        Play Again
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onChangeMode}
                        className="w-full py-4 text-lg"
                    >
                        Change Mode
                    </Button>
                </div>
            </div>
        </div>
    );
}
