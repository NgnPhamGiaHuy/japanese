/**
 * @file SpeedResultsView
 * Game Over / Summary Screen for Speed Mode.
 */

"use client";

import { Zap } from "lucide-react";

import { GameResultsScreen } from "@/shared/components/game";

import type { TierInfo } from "@/features/game/logic";

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
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return (
        <GameResultsScreen
            title="Speed Done!"
            icon={Zap}
            iconBg="bg-[#ff9600]"
            iconBorder="#cc7800"
            score={score}
            bestScore={bestScore}
            tierInfo={tierInfo}
            stats={[
                { value: correctCount, label: "Correct", color: "#58cc02" },
                {
                    value: Math.max(0, totalQuestions - correctCount),
                    label: "Wrong",
                    color: "#ea2b2b",
                },
                { value: maxStreak, label: "Streak", color: "#ff9600" },
                { value: `${accuracy}%`, label: "Accuracy", color: "#1cb0f6" },
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
