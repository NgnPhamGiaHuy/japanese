/**
 * KanaChart — Main chart display component
 *
 * @remarks
 * Root component for kana chart feature.
 * Handles romaji toggle, alphabet switching, and learned state.
 */

"use client";

import { useState } from "react";

import { Eye, EyeOff } from "lucide-react";

import { useKanaDataset } from "@/features/kana/hooks";
import { useUserProgress } from "@/features/user/hooks";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { useKanaStore } from "@/store";
import { ChartBlockGrid } from "./ChartBlockGrid";
import { ChartSection } from "./ChartSection";
import { useChartData } from "../hooks";

export function KanaChart() {
    const [showRomaji, setShowRomaji] = useState(true);
    const { alphabet } = useKanaStore();
    const { userData } = useUserProgress();
    const { themeColor } = useKanaDataset();

    const isLearned = (char: string) => userData.learnedChars?.includes(char) ?? false;
    const { isBoth, singleBlocks, combinedSections, headingColorSingle } = useChartData(alphabet);

    return (
        <div className="min-h-dvh bg-[#F7F7F8]">
            <ScreenHeader
                title="Character Chart"
                backHref="/kana"
                rightWrapperClassName="flex items-center justify-end min-w-0 shrink-0"
                right={
                    <Button
                        variant="ghost"
                        onClick={() => setShowRomaji((v) => !v)}
                        className={`flex! items-center! gap-1.5! rounded-xl! border-2! px-3! py-1.5! text-[10px]! font-bold! shadow-none transition-all hover:shadow-none active:translate-y-0 md:text-xs! ${
                            !showRomaji
                                ? "border-[#ea2b2b]! bg-[#ffdfe0]! text-[#ea2b2b]!"
                                : `${themeColor.primaryLightBg} ${themeColor.text} ${themeColor.primaryBorder}`
                        }`}
                        icon={showRomaji ? Eye : EyeOff}
                        iconSize={14}
                    >
                        <span className="hidden sm:inline">Romaji</span>
                    </Button>
                }
            />

            <div className="animate-in fade-in mx-auto w-full max-w-2xl px-3 pt-6 pb-28 duration-300 sm:px-4">
                {isBoth && (
                    <p className="mx-auto mb-4 max-w-sm text-center text-[10px] font-bold text-[#afafaf] md:text-xs">
                        Hiragana and katakana for the same sounds are grouped by section. Extended
                        loanword katakana appears only under Katakana.
                    </p>
                )}

                <div className="flex flex-col gap-4 md:gap-6">
                    {combinedSections &&
                        combinedSections.map(({ title, hiragana, katakana }) => (
                            <ChartSection
                                key={title}
                                title={title}
                                hiragana={hiragana}
                                katakana={katakana}
                                showRomaji={showRomaji}
                                isLearned={isLearned}
                            />
                        ))}

                    {!isBoth &&
                        singleBlocks?.map((block) => (
                            <div
                                key={block.title}
                                className="rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 md:p-6"
                            >
                                <h2
                                    className={`mb-3 border-b-2 border-gray-100 pb-2.5 text-base font-black tracking-widest uppercase sm:text-lg md:text-xl ${headingColorSingle}`}
                                >
                                    {block.title}
                                </h2>
                                <ChartBlockGrid
                                    block={block}
                                    showRomaji={showRomaji}
                                    isLearned={isLearned}
                                    isHiragana={alphabet === "hiragana"}
                                    blockKeyPrefix={block.title}
                                />
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
