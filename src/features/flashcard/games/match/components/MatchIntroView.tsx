/**
 * @file MatchIntroView
 * Game Introduction Screen for Match Mode.
 */

"use client";

import { CheckCircle2, Gamepad2 } from "lucide-react";

import { DIFFICULTY_CONFIG } from "@/features/game/modes";
import { GameIntroScreen } from "@/shared/components/game";
import { Button } from "@/shared/components/ui";

import type { TierInfo } from "@/features/game/logic";
import type { MatchDifficulty } from "@/features/game/modes";

interface MatchIntroViewProps {
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

const MatchIntroView = ({
    bestScore,
    tierInfo,
    difficulty,
    cardCount,
    requiredPairs,
    prepLoading = false,
    onBack,
    onStart,
    onDifficultyChange,
}: MatchIntroViewProps) => {
    return (
        <GameIntroScreen
            title="Match Mode"
            description="One visible grid: match real pairs; AI distractors on higher tiers add interference — timers, mixed prompts, and lives on harder settings."
            icon={Gamepad2}
            iconBg="bg-[#ce82ff]"
            iconBorder="#b65ce8"
            bestScore={bestScore}
            tierInfo={tierInfo}
            startButtonText={prepLoading ? "Preparing…" : "Play"}
            startButtonColor="purple"
            startDisabled={cardCount < requiredPairs || prepLoading}
            onBack={onBack}
            onStart={onStart}
        >
            <div className="mb-6 w-full max-w-sm">
                <p className="mb-3 text-center text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                    Select Difficulty
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
                                            className={`font-black ${active ? "text-white" : "text-[#3c3c3c]"}`}
                                        >
                                            {config.label}
                                        </div>
                                        <div
                                            className={`text-xs font-bold ${active ? "text-white/70" : "text-[#afafaf]"}`}
                                        >
                                            {config.sub}
                                            {disabled ? " (need more cards)" : ""}
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

export default MatchIntroView;
