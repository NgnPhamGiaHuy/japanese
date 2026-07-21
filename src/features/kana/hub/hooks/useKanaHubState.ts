/**
 * useKanaHubState — Kana hub state orchestration
 *
 * @remarks
 * Manages settings menu state, progress calculation, and theme colors.
 */

import { useState } from "react";

import { useKanaDataset } from "@/features/kana/hooks";
import { useBestScores, useUserProgress } from "@/features/user";
import { useAppStore } from "@/lib/app-store";

export function useKanaHubState() {
    const { dataset, alphabet, setAlphabet, themeColor } = useKanaDataset();
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

    const isBoth = alphabet === "both";

    /** ActionCard's own prop-naming contract, mapped from useKanaDataset's single canonical theme-color source. */
    const themeColors = {
        primaryBg: themeColor.bg,
        primaryBorderB: themeColor.borderStrong,
        primaryHover: themeColor.hoverBg,
        primaryText: themeColor.text,
        primaryBgLight: themeColor.primaryLightBg,
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
