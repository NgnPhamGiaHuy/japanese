/**
 * LearnProgress — Progress indicator and mode toggle
 *
 * @remarks
 * Shows current position in dataset and allows switching between sequential/random modes.
 * Displays progress bar on both mobile and desktop.
 */

"use client";

import { Shuffle } from "lucide-react";

import { Button } from "@/shared/components/ui";

import type { LearnProgressProps } from "../types";

export function LearnProgress({
    currentIndex,
    total,
    themeColor,
    isRandom,
    onToggleRandom,
}: LearnProgressProps) {
    const progressPercent = ((currentIndex + 1) / total) * 100;

    return (
        <>
            <div className="mb-4 flex w-full items-center justify-between gap-2 pt-2 sm:gap-4">
                <div className="hidden w-10 shrink-0 sm:block" aria-hidden />
                <div className="hidden h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200 sm:block">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${themeColor.bg}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0 md:gap-3">
                    <span
                        className={`flex shrink-0 items-center gap-1 text-[10px] font-black md:text-sm ${themeColor.text}`}
                    >
                        {currentIndex + 1} / {total}
                    </span>
                    <Button
                        variant="ghost"
                        onClick={onToggleRandom}
                        className={`flex! shrink-0! items-center! gap-1! rounded-lg! border-2! px-2! py-1.5! text-[10px]! font-bold! shadow-none transition-all hover:shadow-none active:translate-y-0 md:rounded-xl! md:px-3! md:py-2! md:text-xs! ${
                            isRandom
                                ? `${themeColor.primaryLightBg} ${themeColor.primaryBorder} ${themeColor.text} shadow-sm`
                                : "border-gray-200! bg-white! text-gray-500! hover:bg-gray-50!"
                        }`}
                        icon={Shuffle}
                        iconSize={14}
                        iconClassName={isRandom ? "stroke-[3px]" : "stroke-[2px]"}
                    >
                        <span className="hidden sm:inline">
                            {isRandom ? "Random" : "Sequential"}
                        </span>
                    </Button>
                </div>
            </div>

            {/* Mobile progress */}
            <div className="mb-4 w-full sm:hidden">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${themeColor.bg}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </>
    );
}
