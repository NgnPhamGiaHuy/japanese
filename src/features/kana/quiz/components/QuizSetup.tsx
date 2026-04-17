/**
 * QuizSetup — Mode selection screen
 *
 * @remarks
 * Displays three quiz mode options: Multiple Choice, Type Romaji, Smart Review.
 */

"use client";

import { Eye, Keyboard, Shuffle } from "lucide-react";

import { ScreenHeader } from "@/shared/components/layout";
import { ModeSelectionCard } from "@/shared/components/ui";

import type { QuizSetupProps } from "../types";

export function QuizSetup({ alphabet, themeColor, onStartQuiz }: QuizSetupProps) {
    const displayChar = alphabet === "both" ? "あ" : alphabet === "hiragana" ? "あ" : "ア";

    return (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]">
            <ScreenHeader title="Recall Quiz" backHref="/kana" />
            <div className="flex flex-1 flex-col items-center justify-start px-4 py-6">
                <div className="w-full max-w-md">
                    <div
                        className={`h-16 w-16 md:h-20 md:w-20 ${themeColor.bg} mb-4 flex shrink-0 -rotate-6 items-center justify-center rounded-2xl border-b-4 text-3xl font-medium text-white shadow-sm md:mb-6 md:rounded-3xl md:border-b-8 md:text-4xl`}
                        style={{ borderColor: themeColor.border }}
                    >
                        {displayChar}
                    </div>
                    <p className="mb-8 text-lg font-bold text-[#afafaf]">
                        How well do you know your kana?
                    </p>
                    <div className="space-y-3">
                        <ModeSelectionCard
                            id="quiz-mode-choice"
                            icon={Eye}
                            iconBgColor="bg-[#faeaff]"
                            iconColor="text-[#ce82ff]"
                            title="Multiple Choice"
                            description="Choose from 4 options"
                            onClick={() => onStartQuiz("choice")}
                        />
                        <ModeSelectionCard
                            id="quiz-mode-type"
                            icon={Keyboard}
                            iconBgColor="bg-[#e5f5ff]"
                            iconColor="text-[#1cb0f6]"
                            title="Type the Romaji"
                            description="Type the romanization"
                            onClick={() => onStartQuiz("type")}
                        />
                        <ModeSelectionCard
                            id="quiz-mode-smart"
                            icon={Shuffle}
                            iconBgColor="bg-[#fff5e6]"
                            iconColor="text-[#ff9600]"
                            title="Smart Review"
                            description="Focus on your weakest characters"
                            onClick={() => onStartQuiz("smart")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
