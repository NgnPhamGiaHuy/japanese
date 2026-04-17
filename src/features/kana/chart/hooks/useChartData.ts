/**
 * useChartData — Manages chart data based on alphabet selection
 *
 * @remarks
 * Builds chart blocks for hiragana, katakana, or both.
 * Memoizes expensive computations for performance.
 */

import { useMemo } from "react";

import {
    buildChartBlocks,
    CHART_SECTION_TITLES,
    HIRAGANA_DATA,
    KATAKANA_DATA,
} from "@/features/kana/data";

import type { ChartBlock } from "@/features/kana/data";

export function useChartData(alphabet: "hiragana" | "katakana" | "both") {
    const isBoth = alphabet === "both";

    const hiraBlocks = useMemo(() => buildChartBlocks(HIRAGANA_DATA, false), []);
    const kataBlocks = useMemo(() => buildChartBlocks(KATAKANA_DATA, true), []);

    const singleBlocks = useMemo(() => {
        if (isBoth) return null;
        return buildChartBlocks(
            alphabet === "katakana" ? KATAKANA_DATA : HIRAGANA_DATA,
            alphabet === "katakana",
        );
    }, [alphabet, isBoth]);

    const combinedSections = useMemo(() => {
        if (!isBoth) return null;
        const out: { title: string; hiragana?: ChartBlock; katakana?: ChartBlock }[] = [];
        for (const title of CHART_SECTION_TITLES) {
            const hiragana = hiraBlocks.find((b) => b.title === title);
            const katakana = kataBlocks.find((b) => b.title === title);
            if (hiragana || katakana) out.push({ title, hiragana, katakana });
        }
        return out;
    }, [isBoth, hiraBlocks, kataBlocks]);

    return {
        isBoth,
        singleBlocks,
        combinedSections,
        headingColorSingle: alphabet === "katakana" ? "text-[#1cb0f6]" : "text-[#58cc02]",
    };
}
