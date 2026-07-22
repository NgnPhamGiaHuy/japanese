"use client";

import { useTranslations } from "next-intl";

import { Clock, Flame, Sword } from "lucide-react";

import { Leaderboard } from "@/features/game";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import {
    TIME_ATTACK_MAX_STREAK_BONUS_SEC,
    TIME_ATTACK_WRONG_PENALTY_SEC,
    useSurvivalGame,
} from "../hooks";

import type { AlphabetMode } from "@/features/kana/types";

interface SurvivalSetupScreenProps {
    game: ReturnType<typeof useSurvivalGame>;
    bestScores: Record<string, number>;
    alphabet: AlphabetMode;
    userId?: string;
}

const SurvivalSetupScreen = ({ game, bestScores, alphabet, userId }: SurvivalSetupScreenProps) => {
    const t = useTranslations("Survival");
    const tGame = useTranslations("Game");

    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col overflow-y-auto">
            <ScreenHeader title={t("title")} backHref="/kana" />
            <div className="flex flex-1 flex-col items-center justify-start px-4 py-6">
                <div className="w-full max-w-md">
                    <div className="border-survival-strong bg-survival mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border-b-8 text-4xl font-medium text-white shadow-sm">
                        <Flame size={40} />
                    </div>
                    <p className="text-muted mb-8 text-lg font-bold">{t("subtitle")}</p>

                    <div className="mb-8 space-y-3">
                        {(["infinity", "time", "drop"] as const).map((mode) => {
                            const icons = {
                                infinity: Sword,
                                time: Clock,
                                drop: Flame,
                            };
                            const Icon = icons[mode];
                            const best = bestScores[`${mode}_${alphabet}`];
                            return (
                                <Button
                                    key={mode}
                                    variant="ghost"
                                    onClick={() => game.setChallengeMode(mode)}
                                    className={`!flex !w-full !items-center !rounded-2xl !border-2 !border-b-4 !p-5 !text-left shadow-none transition-all hover:!-translate-y-0.5 hover:shadow-md hover:shadow-none active:translate-y-0 ${game.challengeMode === mode ? "!border-survival-strong !bg-survival !text-white" : "!text-text !border-gray-200 !bg-white"}`}
                                >
                                    <Icon size={28} className="mr-4 shrink-0" />
                                    <div className="flex-1">
                                        <div className="text-lg font-black capitalize">
                                            {t(`modes.${mode}.title`)}
                                        </div>
                                        <div
                                            className={`text-sm font-bold ${game.challengeMode === mode ? "!text-white/70" : "!text-muted"}`}
                                        >
                                            {t(`modes.${mode}.description`)}
                                        </div>
                                    </div>
                                    {best ? (
                                        <span className="ml-2 text-xs font-black opacity-70">
                                            {tGame("best", { score: best })}
                                        </span>
                                    ) : null}
                                </Button>
                            );
                        })}
                    </div>

                    {game.challengeMode === "time" && (
                        <div className="mb-8 rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-5">
                            <p className="text-muted mb-3 text-sm font-black tracking-widest uppercase">
                                {t("timerDuration")}
                            </p>
                            <div className="flex gap-2">
                                {[1, 2, 5].map((m) => (
                                    <Button
                                        key={m}
                                        variant="ghost"
                                        onClick={() => game.setTimeMinutes(m)}
                                        className={`!flex-1 !rounded-xl !border-2 !border-b-4 !py-3 !font-black shadow-none transition-all hover:shadow-none active:translate-y-0 ${game.timeMinutes === m ? "!border-survival-strong !bg-survival !text-white" : "!text-text !border-gray-200 !bg-white"}`}
                                    >
                                        {t("minutesShort", { minutes: m })}
                                    </Button>
                                ))}
                            </div>

                            <p className="text-muted mt-4 text-center text-xs leading-relaxed font-bold">
                                {t.rich("timerNote", {
                                    bonusSec: TIME_ATTACK_MAX_STREAK_BONUS_SEC,
                                    penaltySec: TIME_ATTACK_WRONG_PENALTY_SEC,
                                    bonus: (chunks) => <span className="text-text">{chunks}</span>,
                                    penalty: (chunks) => (
                                        <span className="text-text">{chunks}</span>
                                    ),
                                })}
                            </p>
                        </div>
                    )}

                    <div className="mb-8">
                        <p className="text-muted mb-2 text-sm font-black tracking-widest uppercase">
                            {t("yourNameLeaderboard")}
                        </p>
                        <input
                            type="text"
                            maxLength={10}
                            className="text-text w-full rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-5 py-4 text-xl font-black transition-colors outline-none focus:border-[#ff9600]"
                            placeholder={t("anonymous")}
                            value={game.localName}
                            onChange={(e) => game.setLocalName(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="primary"
                        color="orange"
                        onClick={game.startGame}
                        className="w-full py-5 text-2xl"
                    >
                        {t("start")}
                    </Button>

                    <div className="mt-8">
                        <Leaderboard
                            gameMode={game.activeModeKey}
                            currentUserId={userId}
                            accentColor="#ff9600"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SurvivalSetupScreen;
