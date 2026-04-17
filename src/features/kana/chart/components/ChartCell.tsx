/**
 * ChartCell — Individual kana character cell in chart grid
 *
 * @remarks
 * Displays single kana character with optional romaji.
 * Handles learned state styling and audio playback on click.
 */

"use client";

import { motion } from "framer-motion";

import { Button } from "@/shared/components/ui";
import { playAudio } from "@/shared/utils";

import type { ChartCellProps } from "../types";

export function ChartCell({ item, showRomaji, learned, isHiragana }: ChartCellProps) {
    if (!item) {
        return <div className="aspect-square w-full rounded-xl border-2 border-transparent" />;
    }

    const isMulti = item.char.length > 1;
    const learnedText = isHiragana ? "text-[#46a302]" : "text-[#149fdf]";
    const learnedRomaji = isHiragana ? "text-[#58a700]" : "text-[#1899d6]";
    const learnedBg = isHiragana
        ? "border-[#58cc02]/30! bg-[#58cc02]/10! hover:bg-[#58cc02]/20!"
        : "border-[#1cb0f6]/30! bg-[#1cb0f6]/10! hover:bg-[#1cb0f6]/20!";

    return (
        <motion.div
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            className="aspect-square w-full"
        >
            <Button
                variant="secondary"
                onClick={() => playAudio(item.char)}
                className={`flex! h-full! w-full! flex-col! items-center! justify-center! p-0! shadow-none transition-all! duration-200 ${
                    learned ? learnedBg : "hover:bg-gray-50!"
                }`}
            >
                <span
                    style={{
                        fontSize: isMulti
                            ? "clamp(0.6rem, 3.5cqi, 1.25rem)"
                            : "clamp(0.9rem, 4.5cqi, 1.75rem)",
                        lineHeight: 1,
                    }}
                    className={`font-medium ${learned ? learnedText : "text-[#3c3c3c]"}`}
                >
                    {item.char}
                </span>

                {showRomaji && (
                    <span
                        style={{ fontSize: "clamp(0.45rem, 1.8cqi, 0.625rem)" }}
                        className={`mt-0.5 w-full truncate text-center font-bold ${
                            learned ? learnedRomaji : "text-[#afafaf]"
                        }`}
                    >
                        {item.romaji}
                    </span>
                )}
            </Button>
        </motion.div>
    );
}
