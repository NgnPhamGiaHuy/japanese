/**
 * useKanaHubState — Kana hub state orchestration
 *
 * @remarks
 * Manages settings menu state, progress calculation, and theme colors.
 */

import { useState } from "react";

import { useKanaDataset } from "@/features/kana/hooks";
import { useBestScores, useUserProgress } from "@/features/user/hooks";
import { useAppStore } from "@/lib/app-store";

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
        primaryBg: isBoth ? "bg-both" : isH ? "bg-hiragana" : "bg-katakana",
        primaryBorderB: isBoth
            ? "border-both-strong"
            : isH
              ? "border-hiragana-strong"
              : "border-katakana-strong",
        primaryHover: isBoth
            ? "hover:bg-both-strong"
            : isH
              ? "hover:bg-hiragana-hover"
              : "hover:bg-katakana-hover",
        primaryText: isBoth ? "text-both" : isH ? "text-hiragana" : "text-katakana",
        primaryBgLight: isBoth ? "bg-both/10" : isH ? "bg-hiragana/10" : "bg-katakana/10",
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
