/**
 * @file SpeedIntroView
 * Game Introduction Screen for Speed Mode.
 */

"use client";

import { motion } from "framer-motion";
import { X, Zap } from "lucide-react";

import { SPEED_GAME_CONFIG } from "@/features/game/modes";
import { Button } from "@/shared/components/ui";

import type { TierInfo } from "@/features/game/logic";

interface SpeedIntroViewProps {
    bestScore: number;
    tierInfo: TierInfo;
    onBack: () => void;
    onStart: () => void;
}

/**
 * SpeedIntroView — Displays high scores and difficulty escalation rules.
 */
const SpeedIntroView = ({ bestScore, tierInfo, onBack, onStart }: SpeedIntroViewProps) => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6">
            <Button
                variant="ghost"
                onClick={onBack}
                className="absolute top-4 left-4 !p-2"
                icon={X}
            />

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6 flex h-20 w-20 -rotate-3 items-center justify-center rounded-[1.75rem] border-b-8 border-[#cc7800] bg-[#ff9600] text-white shadow-sm"
            >
                <Zap size={44} strokeWidth={2.5} />
            </motion.div>

            <h1 className="mb-1 text-3xl font-black text-[#3c3c3c]">Speed Mode</h1>
            <p className="mb-2 text-sm font-bold text-[#afafaf]">
                {SPEED_GAME_CONFIG.TOTAL_QUESTIONS} questions · answer fast for bonus points
            </p>

            {bestScore > 0 ? (
                <div
                    className="mb-6 flex items-center gap-2 rounded-2xl border-2 px-4 py-2"
                    style={{ borderColor: tierInfo.border, backgroundColor: tierInfo.bg }}
                >
                    <span className="text-lg">{tierInfo.emoji}</span>
                    <span className="text-sm font-black" style={{ color: tierInfo.color }}>
                        {tierInfo.label}
                    </span>
                    <span className="text-sm font-bold text-[#afafaf]">·</span>
                    <span className="text-sm font-black text-[#3c3c3c]">Best: {bestScore}</span>
                </div>
            ) : null}

            <div className="mb-8 w-full max-w-sm rounded-2xl border-2 border-gray-200 bg-white p-4">
                <p className="mb-3 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                    Difficulty Escalation
                </p>
                {([1, 2, 3] as const).map((level) => {
                    const config = SPEED_GAME_CONFIG.LEVELS[level];
                    const nextThreshold =
                        SPEED_GAME_CONFIG.LEVELS[level + 1]?.threshold ??
                        SPEED_GAME_CONFIG.TOTAL_QUESTIONS;
                    const range = `Q${config.threshold + 1}–${nextThreshold}`;
                    return (
                        <div key={level} className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: config.color }}
                                />
                                <span className="text-sm font-bold text-[#3c3c3c]">
                                    {config.label}
                                </span>
                                <span className="text-xs text-[#afafaf]">{range}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-[#afafaf]">
                                <span>{config.timeLimit}s per Q</span>
                                {!config.showHint ? (
                                    <span className="rounded-lg bg-[#ffdfe0] px-1.5 py-0.5 text-[#ea2b2b]">
                                        Reduced hints
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Button
                variant="primary"
                color="orange"
                onClick={onStart}
                className="w-full max-w-sm py-5 text-xl"
            >
                Start
            </Button>
        </div>
    );
};

export default SpeedIntroView;
