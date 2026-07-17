/**
 * @file SpeedResultsView
 * Game Over / Summary Screen for Speed Mode.
 */

"use client";

import { useTranslations } from "next-intl";

import { Zap } from "lucide-react";

import { GameResultsScreen } from "@/features/game/components";

import type { TierInfo } from "@/features/game/domain";

interface SpeedResultsViewProps {
    score: number;
    bestScore: number;
    correctCount: number;
    totalQuestions: number;
    maxStreak: number;
    tierInfo: TierInfo;
    gameMode: string;
    currentUserId?: string;
    onPlayAgain: () => void;
    onCollectXP: () => void;
}

const SpeedResultsView = ({
    score,
    bestScore,
    correctCount,
    totalQuestions,
    maxStreak,
    tierInfo,
    gameMode,
    currentUserId,
    onPlayAgain,
    onCollectXP,
}: SpeedResultsViewProps) => {
    const t = useTranslations("SpeedGame");
    const tGame = useTranslations("Game");
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return (
        <GameResultsScreen
            title={t("resultsTitle")}
            icon={Zap}
            iconBg="bg-survival"
            iconBorder="var(--color-survival-strong)"
            score={score}
            bestScore={bestScore}
            tierInfo={tierInfo}
            stats={[
                { value: correctCount, label: tGame("correct"), color: "var(--color-hiragana)" },
                {
                    value: Math.max(0, totalQuestions - correctCount),
                    label: tGame("wrong"),
                    color: "var(--color-danger)",
                },
                { value: maxStreak, label: tGame("streak"), color: "var(--color-survival)" },
                {
                    value: `${accuracy}%`,
                    label: tGame("accuracy"),
                    color: "var(--color-katakana)",
                },
            ]}
            gameMode={gameMode}
            currentUserId={currentUserId}
            accentColor="#ff9600"
            primaryColor="orange"
            onPlayAgain={onPlayAgain}
            onCollectXP={onCollectXP}
        />
    );
};

export default SpeedResultsView;
