/**
 * @file MatchResults
 * Game Over / Summary Screen for Match Mode.
 */

"use client";

import { useTranslations } from "next-intl";

import { Trophy } from "lucide-react";

import { GameResultsScreen } from "@/features/game/components";

import type { TierInfo } from "@/features/game/domain";

interface MatchResultsProps {
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

const MatchResults = ({
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
}: MatchResultsProps) => {
    const t = useTranslations("MatchGame");
    const tGame = useTranslations("Game");
    const accuracy = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

    return (
        <GameResultsScreen
            title={matchedCount === totalCount ? t("perfectMatch") : t("timesUp")}
            icon={Trophy}
            iconBg="bg-both"
            iconBorder="var(--color-both-strong)"
            score={score}
            bestScore={bestScore}
            tierInfo={tierInfo}
            stats={[
                { value: matchedCount, label: t("matched"), color: "var(--color-hiragana)" },
                { value: wrongAttempts, label: tGame("wrong"), color: "var(--color-danger)" },
                { value: maxStreak, label: tGame("streak"), color: "var(--color-survival)" },
                { value: `${accuracy}%`, label: tGame("accuracy"), color: "var(--color-katakana)" },
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

export default MatchResults;
