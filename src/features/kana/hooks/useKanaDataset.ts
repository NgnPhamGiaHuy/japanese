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

    const themeColor = useMemo(() => {
        if (alphabet === "both")
            return {
                primary: "var(--color-both)",
                border: "var(--color-both-strong)",
                text: "text-both",
                bg: "bg-both",
                primaryLightBg: "bg-[#faeaff]",
                primaryBorder: "border-both",
            };
        if (alphabet === "hiragana")
            return {
                primary: "var(--color-hiragana)",
                border: "var(--color-hiragana-strong)",
                text: "text-hiragana",
                bg: "bg-hiragana",
                primaryLightBg: "bg-[#e5f7d8]",
                primaryBorder: "border-hiragana",
            };
        return {
            primary: "var(--color-katakana)",
            border: "var(--color-katakana-strong)",
            text: "text-katakana",
            bg: "bg-katakana",
            primaryLightBg: "bg-[#e5f5ff]",
            primaryBorder: "border-katakana",
        };
    }, [alphabet]);

    return { dataset, alphabet, setAlphabet, themeColor };
}
