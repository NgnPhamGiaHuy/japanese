/**
 * LearnCard — Main learning card displaying kana character
 *
 * @remarks
 * Shows character with stroke animation (for single chars) or static display (for multi-char).
 * Includes audio playback button and romaji display.
 */

"use client";

import { Volume2 } from "lucide-react";

import { KanaStrokeAnimation } from "@/features/kana";
import { Button } from "@/shared/components/ui";
import { playAudio } from "@/shared/utils";

import type { LearnCardProps } from "../types";

export function LearnCard({ char, themeColor }: LearnCardProps) {
    const isMulti = char.char.length > 1;

    return (
        <div className="relative flex w-full flex-col items-center rounded-4xl border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm md:rounded-[3rem] md:p-10">
            <span className="absolute top-4 left-4 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                {char.group}
            </span>
            <Button
                variant="ghost"
                onClick={() => playAudio(char.char)}
                className={`absolute top-4 right-4 rounded-full! border-2! border-gray-100! bg-gray-50! p-2! shadow-none transition-transform hover:bg-gray-100! hover:shadow-none active:translate-y-0 ${themeColor.text}`}
                icon={Volume2}
                iconSize={20}
            />

            <div className="mt-10 mb-6 flex min-h-[140px] w-full items-center justify-center md:min-h-[220px]">
                {isMulti ? (
                    <span className="text-[5rem] leading-none font-medium text-[#3c3c3c] drop-shadow-sm select-none md:text-[8rem]">
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
                <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#afafaf] uppercase">
                    Romaji
                </p>
                <p className="text-4xl font-black tracking-wider text-[#3c3c3c] uppercase md:text-6xl">
                    {char.romaji}
                </p>
            </div>
        </div>
    );
}
