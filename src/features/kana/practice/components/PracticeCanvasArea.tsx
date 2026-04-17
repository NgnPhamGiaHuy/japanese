/**
 * PracticeCanvasArea — Main practice area with reference and canvas
 *
 * @remarks
 * Shows character reference (or ??? in recall mode) and drawing canvas.
 * Includes audio playback button.
 */

"use client";

import { Volume2 } from "lucide-react";

import { DrawingCanvas, KanaStrokeAnimation } from "@/features/kana/components";
import { Button } from "@/shared/components/ui";
import { playAudio } from "@/shared/utils";
import { getModeConfig } from "../utils/getModeConfig";

import type { PracticeCanvasAreaProps } from "../types";

export function PracticeCanvasArea({ char, mode, themeColor }: PracticeCanvasAreaProps) {
    const config = getModeConfig(mode);

    return (
        <div className="my-auto flex w-full flex-1 flex-col items-center justify-center px-2">
            <div className="flex w-full max-w-sm shrink-0 flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-b-8 border-gray-200 bg-white p-3 shadow-sm md:max-w-3xl md:flex-row md:gap-8 md:rounded-[2.5rem] md:p-8">
                {/* Reference Panel */}
                <div className="relative flex w-full shrink-0 flex-row items-center gap-3 rounded-xl bg-gray-50 p-2 md:h-[260px] md:w-auto md:flex-col md:justify-center md:rounded-[1.5rem] md:p-4">
                    <span className="hidden text-xs font-bold text-[#afafaf] md:block">
                        Reference
                    </span>
                    {config.showReference ? (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-gray-100 bg-white shadow-sm md:h-32 md:w-32 md:rounded-2xl">
                            <KanaStrokeAnimation
                                charStr={char.char}
                                svgClassName="w-[80%] h-[80%]"
                                strokeColor={themeColor.primary}
                            />
                        </div>
                    ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-gray-100 bg-white text-gray-300 shadow-sm md:h-32 md:w-32 md:rounded-2xl">
                            <span className="text-3xl font-black md:text-5xl">?</span>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        onClick={() => playAudio(char.char)}
                        className="ml-auto! rounded-full! border-2! border-gray-100! bg-white! p-2! shadow-none transition-transform hover:scale-105 hover:bg-gray-50! hover:shadow-none active:translate-y-0 active:scale-95 md:ml-0! md:p-3!"
                        icon={Volume2}
                        iconSize={18}
                        iconClassName={themeColor.text}
                    />
                </div>

                {/* Canvas Panel */}
                <div className="flex w-full flex-col items-center md:w-auto">
                    <span className="mb-2 text-xs font-bold text-gray-500 md:text-sm">
                        {config.instruction}
                    </span>
                    <DrawingCanvas
                        char={char.char}
                        showGuide={mode === 1}
                        stepKey={mode}
                        strokeColor={themeColor.primary}
                    />
                </div>
            </div>
        </div>
    );
}
