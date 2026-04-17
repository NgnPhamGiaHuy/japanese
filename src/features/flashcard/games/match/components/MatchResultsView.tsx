/**
 * @file MatchResultsView
 * Game Over / Summary Screen for Match Mode.
 */

"use client";

import { Trophy } from "lucide-react";

import { GameResultsScreen } from "@/shared/components/game";

import type { TierInfo } from "@/features/game/logic";

interface MatchResultsViewProps {
    score: number;
    bestScore: number;
    matchedCount: number;
    totalCount: number;
    wrongAttempts: number;
    maxStreak: number;
    tierInfo: TierInfo;
    gameMode: string;
    currentUserId?: string;
    onPlayAgain: () => void;
    onCollectXP: () => void;
}

const MatchResultsView = ({
    score,
    bestScore,
    matchedCount,
    totalCount,
    wrongAttempts,
    maxStreak,
    tierInfo,
    gameMode,
    currentUserId,
    onPlayAgain,
    onCollectXP,
}: MatchResultsViewProps) => {
    const accuracy = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

    return (
        <GameResultsScreen
            title={matchedCount === totalCount ? "Perfect Match!" : "Time's Up!"}
            icon={Trophy}
            iconBg="bg-[#ce82ff]"
            iconBorder="#b65ce8"
            score={score}
            bestScore={bestScore}
            tierInfo={tierInfo}
            stats={[
                { value: matchedCount, label: "Matched", color: "#58cc02" },
                { value: wrongAttempts, label: "Wrong", color: "#ea2b2b" },
                { value: maxStreak, label: "Streak", color: "#ff9600" },
                { value: `${accuracy}%`, label: "Accuracy", color: "#1cb0f6" },
            ]}
            gameMode={gameMode}
            currentUserId={currentUserId}
            accentColor="#ce82ff"
            primaryColor="purple"
            onPlayAgain={onPlayAgain}
            onCollectXP={onCollectXP}
        />
    );
};

export default MatchResultsView;
