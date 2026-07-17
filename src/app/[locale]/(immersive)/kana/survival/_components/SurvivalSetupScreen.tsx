"use client";

import { Clock, Flame, Sword } from "lucide-react";

import { Leaderboard } from "@/features/game/components";
import {
    TIME_ATTACK_MAX_STREAK_BONUS_SEC,
    TIME_ATTACK_WRONG_PENALTY_SEC,
    useSurvivalGame,
} from "@/features/kana/hooks";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";

import type { AlphabetMode } from "@/features/kana/types";

interface SurvivalSetupScreenProps {
    game: ReturnType<typeof useSurvivalGame>;
    bestScores: Record<string, number>;
    alphabet: AlphabetMode;
    userId?: string;
}

const SurvivalSetupScreen = ({ game, bestScores, alphabet, userId }: SurvivalSetupScreenProps) => {
    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col overflow-y-auto">
            <ScreenHeader title="Survival Mode" backHref="/kana" />
            <div className="flex flex-1 flex-col items-center justify-start px-4 py-6">
                <div className="w-full max-w-md">
                    <div className="border-survival-strong bg-survival mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border-b-8 text-4xl font-medium text-white shadow-sm">
                        <Flame size={40} />
                    </div>
                    <p className="text-muted mb-8 text-lg font-bold">How long can you last?</p>

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
                                            {mode === "infinity"
                                                ? "Infinity"
                                                : mode === "time"
                                                  ? "Time Attack"
                                                  : "Drop Mode"}
                                        </div>
                                        <div
                                            className={`text-sm font-bold ${game.challengeMode === mode ? "!text-white/70" : "!text-muted"}`}
                                        >
                                            {mode === "infinity"
                                                ? "Survive as long as possible"
                                                : mode === "time"
                                                  ? "Streaks add time — wrong answers cost seconds"
                                                  : "Type falling characters"}
                                        </div>
                                    </div>
                                    {best ? (
                                        <span className="ml-2 text-xs font-black opacity-70">
                                            Best: {best}
                                        </span>
                                    ) : null}
                                </Button>
                            );
                        })}
                    </div>

                    {game.challengeMode === "time" && (
                        <div className="mb-8 rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-5">
                            <p className="text-muted mb-3 text-sm font-black tracking-widest uppercase">
                                Timer Duration
                            </p>
                            <div className="flex gap-2">
                                {[1, 2, 5].map((m) => (
                                    <Button
                                        key={m}
                                        variant="ghost"
                                        onClick={() => game.setTimeMinutes(m)}
                                        className={`!flex-1 !rounded-xl !border-2 !border-b-4 !py-3 !font-black shadow-none transition-all hover:shadow-none active:translate-y-0 ${game.timeMinutes === m ? "!border-survival-strong !bg-survival !text-white" : "!text-text !border-gray-200 !bg-white"}`}
                                    >
                                        {m}min
                                    </Button>
                                ))}
                            </div>

                            <p className="text-muted mt-4 text-center text-xs leading-relaxed font-bold">
                                Streaks add up to{" "}
                                <span className="text-text">
                                    +{TIME_ATTACK_MAX_STREAK_BONUS_SEC}s
                                </span>{" "}
                                per correct — always less than a wrong answer (
                                <span className="text-text">−{TIME_ATTACK_WRONG_PENALTY_SEC}s</span>
                                ), so the clock eventually runs out.
                            </p>
                        </div>
                    )}

                    <div className="mb-8">
                        <p className="text-muted mb-2 text-sm font-black font-bold tracking-widest uppercase">
                            Your Name (Leaderboard)
                        </p>
                        <input
                            type="text"
                            maxLength={10}
                            className="text-text w-full rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-5 py-4 text-xl font-black transition-colors outline-none focus:border-[#ff9600]"
                            placeholder="Anonymous"
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
                        Start →
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
