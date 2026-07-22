"use client";

import { useTranslations } from "next-intl";

import { Trophy } from "lucide-react";

import { Leaderboard } from "@/features/game";
import { Button } from "@/shared/components/ui";
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
        <div className="bg-bg fixed inset-0 z-50 flex flex-col overflow-y-auto">
            <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8">
                <div className="border-survival-strong bg-survival mb-4 flex h-20 w-20 -rotate-6 items-center justify-center rounded-[1.75rem] border-b-8 text-white shadow-sm">
                    <Trophy size={48} strokeWidth={3} />
                </div>
                <h2 className="text-text mb-1 text-4xl font-black">{t("gameOver")}</h2>
                <p className="text-muted mb-1 text-xl font-bold">
                    {t("finalScore")}{" "}
                    <span className="text-survival mx-1 text-3xl font-black">{finalScore}</span>
                </p>
                <p className="text-muted mb-6 text-sm font-bold">
                    {tGame("best", { score: bestScores[game.activeModeKey] ?? 0 })}
                </p>

                <div className="mb-6 w-full space-y-3">
                    <Button
                        variant="primary"
                        color="orange"
                        onClick={game.startGame}
                        className="w-full py-5 text-xl"
                    >
                        {tGame("playAgain")}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => game.setPhase("setup")}
                        className="w-full py-4 text-lg"
                    >
                        {tGame("changeMode")}
                    </Button>
                    <Button variant="ghost" className="w-full py-4 text-lg" onClick={onBack}>
                        {t("backToKana")}
                    </Button>
                </div>

                <Leaderboard
                    gameMode={game.activeModeKey}
                    currentUserId={userId}
                    accentColor="#ff9600"
                />
            </div>
        </div>
    );
};

export default SurvivalGameOverScreen;
