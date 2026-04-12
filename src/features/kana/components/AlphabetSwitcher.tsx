"use client";

import type { AlphabetMode } from "../types/kana.types";

interface AlphabetSwitcherProps {
    value: AlphabetMode;
    onChange: (mode: AlphabetMode) => void;
}

const AlphabetSwitcher = ({ value, onChange }: AlphabetSwitcherProps) => {
    const labels: Record<AlphabetMode, string> = {
        hiragana: "Hiragana",
        katakana: "Katakana",
        both: "Kana",
    };

    return (
        <div className="mx-auto mb-6 flex w-full max-w-md rounded-2xl bg-gray-200/70 p-1.5 shadow-inner md:rounded-3xl md:p-2">
            {(["hiragana", "katakana", "both"] as AlphabetMode[]).map((mode) => {
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
                        aria-label={mode === "both" ? "Hiragana and katakana together" : undefined}
                        className={`flex-1 rounded-xl py-2 text-sm font-black transition-all duration-300 md:rounded-2xl md:py-2.5 md:text-base ${
                            value === mode
                                ? `bg-white ${colorMap[mode]} shadow-sm`
                                : "text-gray-400 hover:text-gray-500"
                        }`}
                    >
                        {labels[mode]}
                    </button>
                );
            })}
        </div>
    );
};

export default AlphabetSwitcher;
