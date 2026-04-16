"use client";

import { Button } from "@/shared/components/ui";

import type { AlphabetMode } from "../types";

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
                const isActive = value === mode;
                return (
                    <Button
                        key={mode}
                        type="button"
                        onClick={() => onChange(mode)}
                        alphabet={mode}
                        variant="ghost"
                        className={`!flex-1 !rounded-xl !py-2 !text-sm !font-black shadow-none !transition-all duration-300 hover:shadow-none active:translate-y-0 md:!rounded-2xl md:!py-2.5 md:!text-base ${
                            isActive
                                ? "!bg-white shadow-sm"
                                : "!text-gray-400 hover:!bg-transparent hover:!text-gray-500"
                        }`}
                        style={!isActive ? { color: "#afafaf" } : undefined}
                    >
                        {labels[mode]}
                    </Button>
                );
            })}
        </div>
    );
};

export default AlphabetSwitcher;
