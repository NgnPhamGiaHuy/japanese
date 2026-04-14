/**
 * @file MatchIntroView
 * Game Introduction Screen for Match Mode.
 */

"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Gamepad2, X } from "lucide-react";

import { DIFFICULTY_CONFIG } from "@/features/game/modes";
import { Button } from "@/shared/components/ui";

import type { TierInfo } from "@/features/game/logic";
import type { MatchDifficulty } from "@/features/game/modes";

interface MatchIntroViewProps {
    /** High score for the current deck/mode */
    bestScore: number;
    /** Calculated league/tier based on best score */
    tierInfo: TierInfo;
    /** Current selected difficulty level (1-3) */
    difficulty: MatchDifficulty;
    /** Total cards available in the deck */
    cardCount: number;
    /** Minimum cards required for the current difficulty */
    requiredPairs: number;
    onBack: () => void;
    onStart: () => void;
    onDifficultyChange: (difficulty: MatchDifficulty) => void;
}

/**
 * MatchIntroView — Game Introduction Screen
 *
 * @remarks
 * Allows users to review their best score and select a difficulty level.
 * It enforces deck size constraints per difficulty level.
 */
const MatchIntroView = ({
    bestScore,
    tierInfo,
    difficulty,
    cardCount,
    requiredPairs,
    onBack,
    onStart,
    onDifficultyChange,
}: MatchIntroViewProps) => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6">
            <button
                onClick={onBack}
                className="absolute top-4 left-4 rounded-xl p-2 text-gray-400 hover:bg-gray-200"
            >
                <X size={20} />
            </button>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6 flex h-20 w-20 -rotate-3 items-center justify-center rounded-[1.75rem] border-b-8 border-[#b65ce8] bg-[#ce82ff] text-white shadow-sm"
            >
                <Gamepad2 size={44} strokeWidth={2.5} />
            </motion.div>

            <h1 className="mb-1 text-3xl font-black text-[#3c3c3c]">Match Mode</h1>
            <p className="mb-2 text-sm font-bold text-[#afafaf]">Match each Kanji to its meaning</p>

            {bestScore > 0 && (
                <div
                    className="mb-5 flex items-center gap-2 rounded-2xl border-2 px-4 py-2"
                    style={{ borderColor: tierInfo.border, backgroundColor: tierInfo.bg }}
                >
                    <span className="text-lg">{tierInfo.emoji}</span>
                    <span className="text-sm font-black" style={{ color: tierInfo.color }}>
                        {tierInfo.label}
                    </span>
                    <span className="text-sm font-bold text-[#afafaf]">·</span>
                    <span className="text-sm font-black text-[#3c3c3c]">Best: {bestScore}</span>
                </div>
            )}

            <div className="mb-6 w-full max-w-sm">
                <p className="mb-3 text-center text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                    Select Difficulty
                </p>
                <div className="flex flex-col gap-2">
                    {([1, 2, 3] as MatchDifficulty[]).map((level) => {
                        const config = DIFFICULTY_CONFIG[level];
                        const disabled = cardCount < config.pairs;
                        const active = difficulty === level && !disabled;
                        return (
                            <button
                                key={level}
                                disabled={disabled}
                                onClick={() => onDifficultyChange(level)}
                                className={`flex items-center justify-between rounded-2xl border-2 border-b-4 px-5 py-3.5 text-left transition-all ${
                                    disabled
                                        ? "cursor-not-allowed opacity-40"
                                        : active
                                          ? "shadow-sm"
                                          : "border-gray-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
                                }`}
                                style={
                                    active
                                        ? {
                                              backgroundColor: config.color,
                                              borderColor: `${config.color}BB`,
                                          }
                                        : {}
                                }
                            >
                                <div>
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
                                {active ? <CheckCircle2 size={20} className="text-white" /> : null}
                            </button>
                        );
                    })}
                </div>
            </div>

            <Button
                variant="primary"
                color="purple"
                onClick={onStart}
                disabled={cardCount < requiredPairs}
                className="w-full max-w-sm py-5 text-xl"
            >
                Play
            </Button>
        </div>
    );
};

export default MatchIntroView;
