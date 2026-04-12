"use client";

import type { AlphabetMode } from "../types/kana.types";

interface AlphabetSwitcherProps {
    value: AlphabetMode;
    onChange: (mode: AlphabetMode) => void;
}

export default function AlphabetSwitcher({
    value,
    onChange,
}: AlphabetSwitcherProps) {
    const labels: Record<AlphabetMode, string> = {
        hiragana: "Hiragana",
        katakana: "Katakana",
        /** Both scripts together — clearer than “Both” for learners */
        both: "Kana",
    };

    return (
        <div className="w-full flex bg-gray-200/70 p-1.5 md:p-2 rounded-2xl md:rounded-3xl mb-6 shadow-inner max-w-md mx-auto">
            {(["hiragana", "katakana", "both"] as AlphabetMode[]).map(
                (mode) => {
                    const colorMap: Record<AlphabetMode, string> = {
                        hiragana: "text-[#58cc02]",
                        katakana: "text-[#1cb0f6]",
                        both: "text-[#ce82ff]",
                    };
                    return (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => onChange(mode)}
                            aria-pressed={value === mode}
                            aria-label={
                                mode === "both"
                                    ? "Hiragana and katakana together"
                                    : undefined
                            }
                            className={`flex-1 py-2 md:py-2.5 rounded-xl md:rounded-2xl font-black text-sm md:text-base transition-all duration-300 ${
                                value === mode
                                    ? `bg-white ${colorMap[mode]} shadow-sm`
                                    : "text-gray-400 hover:text-gray-500"
                            }`}
                        >
                            {labels[mode]}
                        </button>
                    );
                }
            )}
        </div>
    );
}
