/**
 * @file MatchResultsView
 * Game Over / Summary Screen for Match Mode.
 */

"use client";

import { Trophy } from "lucide-react";

import { GameResultsScreen } from "@/features/game/components";

import type { TierInfo } from "@/features/game/domain";

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
            iconBg="bg-both"
            iconBorder="var(--color-both-strong)"
            score={score}
            bestScore={bestScore}
            tierInfo={tierInfo}
            stats={[
                { value: matchedCount, label: "Matched", color: "var(--color-hiragana)" },
                { value: wrongAttempts, label: "Wrong", color: "var(--color-danger)" },
                { value: maxStreak, label: "Streak", color: "var(--color-survival)" },
                { value: `${accuracy}%`, label: "Accuracy", color: "var(--color-katakana)" },
            ]}
            gameMode={gameMode}
            currentUserId={currentUserId}
            accentColor="#ce82ff"
            primaryColor="purple"
            onPlayAgain={onPlayAgain}
            onCollectXP={onCollectXP}
            xpEarned={score}
        />
    );
};

export default MatchResultsView;
