/**
 * useKanaHubState — Kana hub state orchestration
 *
 * @remarks
 * Manages settings menu state, progress calculation, and theme colors.
 */

import { useState } from "react";

import { useKanaDataset } from "@/features/kana/hooks";
import { useBestScores, useUserProgress } from "@/features/user/hooks";
import { useAppStore } from "@/store";

export function useKanaHubState() {
    const { dataset, alphabet, setAlphabet } = useKanaDataset();
    const { userData, resetProgress } = useUserProgress();
    const { bestScores } = useBestScores();
    const { useHandwriting, globalAutoPlay, toggleHandwriting, toggleAutoPlay } = useAppStore();

    const [showSettings, setShowSettings] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const learnedChars = userData.learnedChars || [];
    const learnedCount = learnedChars.filter((c) => dataset.some((d) => d.char === c)).length;
    const totalChars = dataset.length;
    const progressPct = Math.min(Math.round((learnedCount / totalChars) * 100), 100);
    const isBeginner = progressPct < 80;

    const isH = alphabet === "hiragana";
    const isBoth = alphabet === "both";

    const themeColors = {
        primaryBg: isBoth ? "bg-[#ce82ff]" : isH ? "bg-[#58cc02]" : "bg-[#1cb0f6]",
        primaryBorderB: isBoth ? "border-[#b65ce8]" : isH ? "border-[#58a700]" : "border-[#1899d6]",
        primaryHover: isBoth
            ? "hover:bg-[#b65ce8]"
            : isH
              ? "hover:bg-[#46a302]"
              : "hover:bg-[#149fdf]",
        primaryText: isBoth ? "text-[#ce82ff]" : isH ? "text-[#58cc02]" : "text-[#1cb0f6]",
        primaryBgLight: isBoth ? "bg-[#ce82ff]/10" : isH ? "bg-[#58cc02]/10" : "bg-[#1cb0f6]/10",
    };

    const bestInfinity = bestScores[`infinity_${alphabet}`] ?? 0;

    const handleResetProgress = () => {
        resetProgress();
        setShowSettings(false);
        setShowConfirmReset(false);
    };

    return {
        alphabet,
        setAlphabet,
        showSettings,
        setShowSettings,
        showConfirmReset,
        setShowConfirmReset,
        useHandwriting,
        globalAutoPlay,
        toggleHandwriting,
        toggleAutoPlay,
        progressPct,
        learnedCount,
        totalChars,
        isBeginner,
        isBoth,
        themeColors,
        bestInfinity,
        handleResetProgress,
    };
}
