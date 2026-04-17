/**
 * Type definitions for Kana Practice feature
 */

import type { KanaChar } from "@/features/kana/types";

export type PracticeMode = 1 | 2 | 3;

export interface PracticeModeConfig {
    mode: PracticeMode;
    label: string;
    instruction: string;
    showReference: boolean;
    showRomaji: boolean;
}

export interface PracticeHeaderProps {
    mode: PracticeMode;
    char: KanaChar;
    isRandom: boolean;
    themeColor: {
        primaryLightBg: string;
        primaryBorder: string;
        text: string;
    };
    onModeChange: () => void;
    onRandomToggle: () => void;
}

export interface PracticeCanvasAreaProps {
    char: KanaChar;
    mode: PracticeMode;
    themeColor: {
        primary: string;
        text: string;
    };
}

export interface PracticeControlsProps {
    alphabet: "hiragana" | "katakana" | "both";
    onPrev: () => void;
    onNext: () => void;
}
