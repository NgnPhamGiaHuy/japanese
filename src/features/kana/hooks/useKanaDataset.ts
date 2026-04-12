"use client";

import { useMemo } from "react";

import { HIRAGANA_DATA } from "@/features/kana/data/hiragana";
import { KATAKANA_DATA } from "@/features/kana/data/katakana";
import { useKanaStore } from "@/store/useKanaStore";

import type { KanaChar } from "../types/kana.types";

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
                primary: "#ce82ff",
                border: "#b65ce8",
                light: "#faeaff",
                text: "text-[#ce82ff]",
                bg: "bg-[#ce82ff]",
                primaryLightBg: "bg-[#faeaff]",
                primaryBorder: "border-[#ce82ff]",
            };
        if (alphabet === "hiragana")
            return {
                primary: "#58cc02",
                border: "#58a700",
                light: "#e5f7d8",
                text: "text-[#58cc02]",
                bg: "bg-[#58cc02]",
                primaryLightBg: "bg-[#e5f7d8]",
                primaryBorder: "border-[#58cc02]",
            };
        return {
            primary: "#1cb0f6",
            border: "#1899d6",
            light: "#e5f5ff",
            text: "text-[#1cb0f6]",
            bg: "bg-[#1cb0f6]",
            primaryLightBg: "bg-[#e5f5ff]",
            primaryBorder: "border-[#1cb0f6]",
        };
    }, [alphabet]);

    return { dataset, alphabet, setAlphabet, themeColor };
}
