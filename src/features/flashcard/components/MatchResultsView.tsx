/**
 * @file MatchResultsView
 * Game Over / Summary Screen for Match Mode.
 */

"use client";

import Confetti from "react-confetti";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

import { Leaderboard } from "@/features/game/components";
import { Button } from "@/shared/components/ui";

import type { TierInfo } from "@/features/game/logic";

interface MatchResultsViewProps {
    /** Points accumulated during the session */
    score: number;
    /** User's all-time high for this mode */
    bestScore: number;
    /** Number of pairs correctly identified */
    matchedCount: number;
    /** Total number of pairs that were presented */
    totalCount: number;
    /** Number of incorrect selection attempts */
    wrongAttempts: number;
    /** Highest combo streak achieved */
    maxStreak: number;
    /** Visual tier information (Gold, Diamond, etc.) */
    tierInfo: TierInfo;
    /** Game mode identifier for leaderboard lookup */
    gameMode: string;
    /** Current user's UID for ranking highlighting */
    currentUserId?: string;
    onPlayAgain: () => void;
    onCollectXP: () => void;
}

/**
 * MatchResultsView — Summary screen with performance metrics.
 */
const MatchResultsView = ({
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
}: MatchResultsViewProps) => {
    const isNewBest = score > bestScore;
    const accuracy = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;
    const xpEarned = Math.round(score / 10);

    const { innerWidth: width, innerHeight: height } =
        typeof window !== "undefined" ? window : { innerWidth: 500, innerHeight: 900 };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-[#F7F7F8]">
            {isNewBest ? (
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={220}
                    gravity={0.18}
                    colors={["#ce82ff", "#1cb0f6", "#58cc02", "#ff9600"]}
                />
            ) : null}
            <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-10">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 14 }}
                    className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border-b-8 border-[#b65ce8] bg-[#ce82ff] text-white shadow-sm"
                >
                    <Trophy size={44} strokeWidth={2.5} />
                </motion.div>

                {isNewBest ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-3 rounded-xl bg-[#fff8e8] px-4 py-1.5 text-xs font-black tracking-wide text-[#ff9600] uppercase"
                    >
                        🎉 New Best Score!
                    </motion.div>
                ) : null}

                <h2 className="mb-1 text-4xl font-black text-[#3c3c3c]">
                    {matchedCount === totalCount ? "Perfect Match!" : "Time's Up!"}
                </h2>

                <div className="mt-4 mb-6 flex flex-col items-center gap-2">
                    <div className="text-6xl font-black text-[#3c3c3c]">{score}</div>
                    <div
                        className="flex items-center gap-2 rounded-2xl border-2 px-4 py-1.5"
                        style={{
                            borderColor: tierInfo.border,
                            backgroundColor: tierInfo.bg,
                        }}
                    >
                        <span className="text-base">{tierInfo.emoji}</span>
                        <span className="text-sm font-black" style={{ color: tierInfo.color }}>
                            {tierInfo.label}
                        </span>
                        {tierInfo.nextThreshold ? (
                            <span className="text-xs font-bold text-[#afafaf]">
                                · {tierInfo.nextThreshold - score} to next
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="mb-8 grid w-full grid-cols-4 gap-3">
                    {[
                        { value: matchedCount, label: "Matched", color: "#58cc02" },
                        { value: wrongAttempts, label: "Wrong", color: "#ea2b2b" },
                        { value: maxStreak, label: "Streak", color: "#ff9600" },
                        { value: `${accuracy}%`, label: "Accuracy", color: "#1cb0f6" },
                    ].map(({ value, label, color }) => (
                        <div
                            key={label}
                            className="rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-3 text-center shadow-sm"
                        >
                            <div className="text-2xl font-black" style={{ color }}>
                                {value}
                            </div>
                            <div className="mt-1 text-[9px] font-black tracking-widest text-[#afafaf] uppercase">
                                {label}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mb-8 flex w-full gap-3">
                    <Button
                        variant="secondary"
                        color="purple"
                        onClick={onPlayAgain}
                        className="flex-1 py-4"
                    >
                        Play Again
                    </Button>
                    <Button
                        variant="primary"
                        color="purple"
                        onClick={onCollectXP}
                        className="flex-1 py-4"
                    >
                        +{xpEarned} XP
                    </Button>
                </div>

                <Leaderboard
                    gameMode={gameMode}
                    currentUserId={currentUserId}
                    accentColor="#ce82ff"
                />
            </div>
        </div>
    );
};

export default MatchResultsView;
