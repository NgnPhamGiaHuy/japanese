"use client";

import { useMemo } from "react";

import { HIRAGANA_DATA, KATAKANA_DATA } from "@/features/kana/data";
import { useKanaStore } from "@/features/kana/store";

import type { KanaChar } from "../types";

/** Returns the active dataset and helpers based on the current alphabet selection */
export function useKanaDataset() {
    const { alphabet, setAlphabet } = useKanaStore();

    const dataset: KanaChar[] = useMemo(() => {
        if (alphabet === "both") return [...HIRAGANA_DATA, ...KATAKANA_DATA];
        return alphabet === "hiragana" ? HIRAGANA_DATA : KATAKANA_DATA;
    }, [alphabet]);

    /**
     * The one alphabet→theme-color mapping for Kana — every consumer (Learn,
     * Quiz, Chart, Practice, and the Hub via useKanaHubState) reads from this
     * single object instead of each re-deriving its own copy of the same
     * three-way alphabet switch (previously duplicated, with a second,
     * incompatible set of keys, in useKanaHubState.ts).
     */
    const themeColor = useMemo(() => {
        if (alphabet === "both")
            return {
                primary: "var(--color-both)",
                border: "var(--color-both-strong)",
                borderStrong: "border-both-strong",
                hoverBg: "hover:bg-both-strong",
                text: "text-both",
                bg: "bg-both",
                primaryLightBg: "bg-[#faeaff]",
                primaryBorder: "border-both",
            };
        if (alphabet === "hiragana")
            return {
                primary: "var(--color-hiragana)",
                border: "var(--color-hiragana-strong)",
                borderStrong: "border-hiragana-strong",
                hoverBg: "hover:bg-hiragana-hover",
                text: "text-hiragana",
                bg: "bg-hiragana",
                primaryLightBg: "bg-[#e5f7d8]",
                primaryBorder: "border-hiragana",
            };
        return {
            primary: "var(--color-katakana)",
            border: "var(--color-katakana-strong)",
            borderStrong: "border-katakana-strong",
            hoverBg: "hover:bg-katakana-hover",
            text: "text-katakana",
            bg: "bg-katakana",
            primaryLightBg: "bg-[#e5f5ff]",
            primaryBorder: "border-katakana",
        };
    }, [alphabet]);

    return { dataset, alphabet, setAlphabet, themeColor };
}
