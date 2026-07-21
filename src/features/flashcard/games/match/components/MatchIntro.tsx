/**
 * @file MatchIntro
 * Game Introduction Screen for Match Mode.
 */

"use client";

import { useTranslations } from "next-intl";

import { CheckCircle2, Gamepad2 } from "lucide-react";

import { DIFFICULTY_CONFIG } from "@/features/flashcard/games/match/config";
import { GameIntroScreen } from "@/features/game";
import { Button } from "@/shared/components/ui";

import type { MatchDifficulty } from "@/features/flashcard/games/match/config";
import type { TierInfo } from "@/features/game";

interface MatchIntroProps {
    bestScore: number;
    tierInfo: TierInfo;
    difficulty: MatchDifficulty;
    cardCount: number;
    requiredPairs: number;
    prepLoading?: boolean;
    onBack: () => void;
    onStart: () => void | Promise<void>;
    onDifficultyChange: (difficulty: MatchDifficulty) => void;
}

const MatchIntro = ({
    bestScore,
    tierInfo,
    difficulty,
    cardCount,
    requiredPairs,
    prepLoading = false,
    onBack,
    onStart,
    onDifficultyChange,
}: MatchIntroProps) => {
    const t = useTranslations("MatchGame");
    const tGame = useTranslations("Game");

    return (
        <GameIntroScreen
            title={t("title")}
            description={t("description")}
            icon={Gamepad2}
            iconBg="bg-both"
            iconBorder="var(--color-both-strong)"
            bestScore={bestScore}
            tierInfo={tierInfo}
            startButtonText={prepLoading ? t("preparing") : tGame("play")}
            startButtonColor="purple"
            startDisabled={cardCount < requiredPairs || prepLoading}
            loading={prepLoading}
            onBack={onBack}
            onStart={onStart}
        >
            <div className="mb-6 w-full max-w-sm">
                <p className="text-muted mb-3 text-center text-xs font-black tracking-widest uppercase">
                    {t("selectDifficulty")}
                </p>
                <div className="flex flex-col gap-2">
                    {([1, 2, 3, 4] as MatchDifficulty[]).map((level) => {
                        const config = DIFFICULTY_CONFIG[level];
                        const disabled = cardCount < config.pairs;
                        const active = difficulty === level && !disabled;

                        const levelColorMap: Record<number, "green" | "blue" | "orange" | "red"> = {
                            1: "green",
                            2: "blue",
                            3: "orange",
                            4: "red",
                        };

                        return (
                            <Button
                                key={level}
                                disabled={disabled}
                                onClick={() => onDifficultyChange(level)}
                                variant={active ? "primary" : "secondary"}
                                color={levelColorMap[level]}
                                className={`flex items-center justify-between px-5! py-3.5! text-left! transition-all ${
                                    disabled ? "opacity-40" : ""
                                }`}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <div className="text-left">
                                        <div
                                            className={`font-black ${active ? "text-white" : "text-text"}`}
                                        >
                                            {t(`difficulty.${level}.label`)}
                                        </div>
                                        <div
                                            className={`text-xs font-bold ${active ? "text-white/70" : "text-muted"}`}
                                        >
                                            {t(`difficulty.${level}.sub`)}
                                            {disabled ? ` ${t("needMoreCardsSuffix")}` : ""}
                                        </div>
                                    </div>
                                    {active && (
                                        <CheckCircle2 size={20} className="shrink-0 text-white" />
                                    )}
                                </div>
                            </Button>
                        );
                    })}
                </div>
            </div>
        </GameIntroScreen>
    );
};

export default MatchIntro;
