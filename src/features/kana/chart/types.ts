/**
 * Type definitions for Kana Chart feature
 */

import type { ChartBlock } from "@/features/kana/data";
import type { KanaChar } from "@/features/kana/types";

export interface ChartCellProps {
    item: KanaChar | null;
    showRomaji: boolean;
    learned: boolean;
    isHiragana: boolean;
    /** Translated "Play" label — passed down rather than resolved via useTranslations() so ChartCell stays callable as a plain function (see ChartCell.test.tsx). */
    playLabel: string;
}

export interface ChartBlockGridProps {
    block: ChartBlock;
    showRomaji: boolean;
    isLearned: (char: string) => boolean;
    isHiragana: boolean;
    blockKeyPrefix: string;
    playLabel: string;
}

export interface ChartSectionProps {
    title: string;
    hiragana?: ChartBlock;
    katakana?: ChartBlock;
    showRomaji: boolean;
    isLearned: (char: string) => boolean;
    playLabel: string;
}
