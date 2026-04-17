/**
 * Type definitions for Kana Learn feature
 */

import type { KanaChar } from "@/features/kana/types";

export interface LearnCardProps {
    char: KanaChar;
    themeColor: {
        primary: string;
        text: string;
    };
}

export interface LearnControlsProps {
    alphabet: "hiragana" | "katakana" | "both";
    onPrev: () => void;
    onNext: () => void;
}

export interface LearnProgressProps {
    currentIndex: number;
    total: number;
    themeColor: {
        bg: string;
        text: string;
        primaryLightBg: string;
        primaryBorder: string;
    };
    isRandom: boolean;
    onToggleRandom: () => void;
}
