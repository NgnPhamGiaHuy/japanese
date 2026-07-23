"use client";

import { useTranslations } from "next-intl";

import { Trophy } from "lucide-react";

import { GameResultsScreen } from "@/features/game";
import { useSurvivalGame } from "../hooks";

interface SurvivalGameOverScreenProps {
    game: ReturnType<typeof useSurvivalGame>;
    bestScores: Record<string, number>;
    userId?: string;
    onBack: () => void;
}

const SurvivalGameOverScreen = ({
    game,
    bestScores,
    userId,
    onBack,
}: SurvivalGameOverScreenProps) => {
    const t = useTranslations("Survival");
    const tGame = useTranslations("Game");
    const finalScore = game.challengeMode === "drop" ? game.dropScore : game.engine.score;

    return (
        <GameResultsScreen
            title={t("gameOver")}
            icon={Trophy}
            iconBg="bg-survival"
            iconBorder="var(--color-survival-strong)"
            score={finalScore}
            bestScore={bestScores[game.activeModeKey] ?? 0}
            gameMode={game.activeModeKey}
            currentUserId={userId}
            accentColor="#ff9600"
            primaryColor="orange"
            onPlayAgain={game.startGame}
            secondaryAction={{ label: tGame("changeMode"), onClick: () => game.setPhase("setup") }}
            tertiaryAction={{ label: t("backToKana"), onClick: onBack }}
        />
    );
};

export default SurvivalGameOverScreen;
