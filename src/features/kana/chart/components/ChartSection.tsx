/**
 * ChartSection — Combined hiragana/katakana section or single alphabet section
 *
 * @remarks
 * Displays a titled section with one or both alphabets.
 * Used for "both" mode to show hiragana and katakana side by side.
 */

"use client";

import { ChartBlockGrid } from "./ChartBlockGrid";

import type { ChartSectionProps } from "../types";

export function ChartSection({
    title,
    hiragana,
    katakana,
    showRomaji,
    isLearned,
}: ChartSectionProps) {
    return (
        <div className="rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 md:p-6">
            <h2 className="mb-3 border-b-2 border-gray-100 pb-2.5 text-base font-black tracking-widest text-[#ce82ff] uppercase sm:text-lg md:text-xl">
                {title}
            </h2>
            <div className="flex flex-col gap-4 md:gap-6">
                {hiragana && (
                    <div>
                        <h3 className="mb-2 text-[10px] font-black tracking-widest text-[#58cc02] uppercase md:text-xs">
                            Hiragana
                        </h3>
                        <ChartBlockGrid
                            block={hiragana}
                            showRomaji={showRomaji}
                            isLearned={isLearned}
                            isHiragana
                            blockKeyPrefix={`${title}-h`}
                        />
                    </div>
                )}
                {katakana && (
                    <div>
                        <h3 className="mb-2 text-[10px] font-black tracking-widest text-[#1cb0f6] uppercase md:text-xs">
                            Katakana
                        </h3>
                        <ChartBlockGrid
                            block={katakana}
                            showRomaji={showRomaji}
                            isLearned={isLearned}
                            isHiragana={false}
                            blockKeyPrefix={`${title}-k`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
