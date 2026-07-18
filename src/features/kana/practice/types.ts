/**
 * Type definitions for Kana Practice feature
 */

import type { KanaChar } from "@/features/kana/types";

export type PracticeMode = "trace" | "copy" | "recall";

/**
 * Canonical mode order — the single source of truth `cycleMode` derives
 * "next mode" from, instead of hardcoded numeric arithmetic. Adding a 4th
 * mode means adding it here and to the union above; every `Record<PracticeMode, _>`
 * (modeIcons, getModeConfig's configs) then fails to compile until it's
 * covered too.
 */
export const PRACTICE_MODES: readonly PracticeMode[] = ["trace", "copy", "recall"];

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
    onPlay: () => void;
}
