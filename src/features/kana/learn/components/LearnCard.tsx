/**
 * LearnCard — Main learning card displaying kana character
 *
 * @remarks
 * Shows character with stroke animation (for single chars) or static display (for multi-char).
 * Includes audio playback button and romaji display.
 */

"use client";

import { useTranslations } from "next-intl";

import { KanaAudioButton, KanaStrokeAnimation } from "@/features/kana/components";

import type { LearnCardProps } from "../types";

export function LearnCard({ char, themeColor, onPlay }: LearnCardProps) {
    const t = useTranslations("Common");
    const isMulti = char.char.length > 1;

    return (
        <div className="md:rounded-6xl relative flex w-full flex-col items-center rounded-4xl border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm md:p-10">
            <span className="absolute top-4 left-4 text-xs font-black tracking-widest text-gray-400 uppercase">
                {char.group}
            </span>
            <KanaAudioButton
                char={char.char}
                onPlay={onPlay}
                iconSize={20}
                iconColorClassName={themeColor.text}
                className="absolute top-4 right-4 bg-gray-50! hover:bg-gray-100!"
            />

            <div className="mt-10 mb-6 flex min-h-[140px] w-full items-center justify-center md:min-h-[220px]">
                {isMulti ? (
                    <span className="text-text text-[5rem] leading-none font-medium drop-shadow-sm select-none md:text-9xl">
                        {char.char}
                    </span>
                ) : (
                    <div className="h-32 w-32 md:h-48 md:w-48">
                        <KanaStrokeAnimation
                            charStr={char.char}
                            svgClassName="w-full h-full"
                            strokeColor={themeColor.primary}
                        />
                    </div>
                )}
            </div>
            <div className="w-full border-t-2 border-gray-100 pt-4 text-center">
                <p className="text-muted mb-1 text-xs font-bold tracking-widest uppercase">
                    {t("romaji")}
                </p>
                <p className="text-text text-4xl font-black tracking-wider uppercase md:text-6xl">
                    {char.romaji}
                </p>
            </div>
        </div>
    );
}
