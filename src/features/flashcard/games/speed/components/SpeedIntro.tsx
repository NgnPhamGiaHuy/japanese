/**
 * @file SpeedIntro
 * Game Introduction Screen for Speed Mode.
 */

"use client";

import { useTranslations } from "next-intl";

import { Zap } from "lucide-react";

import { SPEED_GAME_CONFIG } from "@/features/flashcard/games/speed/config";
import { GameIntroScreen } from "@/features/game/components";

import type { TierInfo } from "@/features/game/domain";

interface SpeedIntroProps {
    bestScore: number;
    tierInfo: TierInfo;
    onBack: () => void;
    onStart: () => void;
}

const SpeedIntro = ({ bestScore, tierInfo, onBack, onStart }: SpeedIntroProps) => {
    const t = useTranslations("SpeedGame");

    return (
        <GameIntroScreen
            title={t("title")}
            description={t("description", { count: SPEED_GAME_CONFIG.TOTAL_QUESTIONS })}
            icon={Zap}
            iconBg="bg-survival"
            iconBorder="var(--color-survival-strong)"
            bestScore={bestScore}
            tierInfo={tierInfo}
            startButtonText={t("start")}
            startButtonColor="orange"
            onBack={onBack}
            onStart={onStart}
        >
            <div className="mb-8 w-full max-w-sm rounded-2xl border-2 border-gray-200 bg-white p-4">
                <p className="text-muted mb-3 text-xs font-black tracking-widest uppercase">
                    {t("difficultyEscalation")}
                </p>
                {([1, 2, 3] as const).map((level) => {
                    const config = SPEED_GAME_CONFIG.LEVELS[level];
                    const nextThreshold =
                        SPEED_GAME_CONFIG.LEVELS[level + 1]?.threshold ??
                        SPEED_GAME_CONFIG.TOTAL_QUESTIONS;
                    const range = t("questionRange", {
                        from: config.threshold + 1,
                        to: nextThreshold,
                    });
                    return (
                        <div key={level} className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: config.color }}
                                />
                                <span className="text-text text-sm font-bold">
                                    {t(`level.${level}`)}
                                </span>
                                <span className="text-muted text-xs">{range}</span>
                            </div>
                            <div className="text-muted flex items-center gap-3 text-xs font-bold">
                                <span>
                                    {t("secondsPerQuestion", { seconds: config.timeLimit })}
                                </span>
                                {!config.showHint && (
                                    <span className="bg-danger-bg text-danger rounded-lg px-1.5 py-0.5">
                                        {t("reducedHints")}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </GameIntroScreen>
    );
};

export default SpeedIntro;
