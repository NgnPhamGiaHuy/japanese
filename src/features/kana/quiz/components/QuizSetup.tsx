/**
 * QuizSetup — Mode selection screen
 *
 * @remarks
 * Displays three quiz mode options: Multiple Choice, Type Romaji, Smart Review.
 */

"use client";

import { useTranslations } from "next-intl";

import { Eye, Keyboard, Shuffle } from "lucide-react";

import { ScreenHeader } from "@/shared/components/layout";
import { ModeSelectionCard } from "@/shared/components/ui";

import type { QuizSetupProps } from "../types";

export function QuizSetup({ alphabet, themeColor, onStartQuiz }: QuizSetupProps) {
    const t = useTranslations("KanaQuiz");
    const tCommon = useTranslations("Common");
    const displayChar = alphabet === "both" ? "あ" : alphabet === "hiragana" ? "あ" : "ア";

    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col overflow-y-auto">
            <ScreenHeader title={tCommon("recallQuiz")} backHref="/kana" />
            <div className="flex flex-1 flex-col items-center justify-start px-4 py-6">
                <div className="w-full max-w-md">
                    <div
                        className={`h-16 w-16 md:h-20 md:w-20 ${themeColor.bg} mb-4 flex shrink-0 -rotate-6 items-center justify-center rounded-2xl border-b-4 text-3xl font-medium text-white shadow-sm md:mb-6 md:rounded-3xl md:border-b-8 md:text-4xl`}
                        style={{ borderColor: themeColor.border }}
                    >
                        {displayChar}
                    </div>
                    <p className="text-muted mb-8 text-lg font-bold">{t("subtitle")}</p>
                    <div className="space-y-3">
                        <ModeSelectionCard
                            id="quiz-mode-choice"
                            icon={Eye}
                            iconBgColor="bg-[#faeaff]"
                            iconColor="text-both"
                            title={t("modes.choice.title")}
                            description={t("modes.choice.description")}
                            onClick={() => onStartQuiz("choice")}
                        />
                        <ModeSelectionCard
                            id="quiz-mode-type"
                            icon={Keyboard}
                            iconBgColor="bg-[#e5f5ff]"
                            iconColor="text-katakana"
                            title={t("modes.type.title")}
                            description={t("modes.type.description")}
                            onClick={() => onStartQuiz("type")}
                        />
                        <ModeSelectionCard
                            id="quiz-mode-smart"
                            icon={Shuffle}
                            iconBgColor="bg-[#fff5e6]"
                            iconColor="text-survival"
                            title={t("modes.smart.title")}
                            description={t("modes.smart.description")}
                            onClick={() => onStartQuiz("smart")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
