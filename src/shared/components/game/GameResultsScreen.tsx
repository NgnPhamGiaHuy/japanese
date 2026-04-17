/**
 * GameResultsScreen — Reusable game results/summary screen
 *
 * @remarks
 * Used for game over screens with confetti, score display, tier badge, stats, and actions.
 * Supports customization for different game modes.
 */

"use client";

import Confetti from "react-confetti";

import { motion } from "framer-motion";

import { Leaderboard } from "@/features/game/components";
import { Button } from "@/shared/components/ui";
import { StatGrid } from "./StatGrid";

import type { LucideIcon } from "lucide-react";
import type { TierInfo } from "@/features/game/logic";
import type { StatItem } from "./StatGrid";

export interface GameResultsScreenProps {
    /** Game mode title for heading */
    title: string;
    /** Icon component to display */
    icon: LucideIcon;
    /** Icon background color */
    iconBg: string;
    /** Icon border color */
    iconBorder: string;
    /** Final score */
    score: number;
    /** Previous best score */
    bestScore: number;
    /** Tier information */
    tierInfo: TierInfo;
    /** Statistics to display in grid */
    stats: StatItem[];
    /** Game mode identifier for leaderboard */
    gameMode: string;
    /** Current user ID for leaderboard highlighting */
    currentUserId?: string;
    /** Leaderboard accent color */
    accentColor: string;
    /** Primary button color */
    primaryColor?: "purple" | "orange" | "blue" | "green" | "red";
    /** XP earned (calculated from score) */
    xpEarned?: number;
    onPlayAgain: () => void;
    onCollectXP: () => void;
}

export function GameResultsScreen({
    title,
    icon: Icon,
    iconBg,
    iconBorder,
    score,
    bestScore,
    tierInfo,
    stats,
    gameMode,
    currentUserId,
    accentColor,
    primaryColor = "purple",
    xpEarned,
    onPlayAgain,
    onCollectXP,
}: GameResultsScreenProps) {
    const isNewBest = score > bestScore;
    const calculatedXP = xpEarned ?? Math.round(score / 10);

    const { innerWidth: width, innerHeight: height } =
        typeof window !== "undefined" ? window : { innerWidth: 500, innerHeight: 900 };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-[#F7F7F8]">
            {isNewBest && (
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={220}
                    gravity={0.18}
                    colors={["#ce82ff", "#1cb0f6", "#58cc02", "#ff9600"]}
                />
            )}
            <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-10">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 14 }}
                    className={`mb-4 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border-b-8 text-white shadow-sm ${iconBg}`}
                    style={{ borderColor: iconBorder }}
                >
                    <Icon size={44} strokeWidth={2.5} />
                </motion.div>

                {isNewBest && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-3 rounded-xl bg-[#fff8e8] px-4 py-1.5 text-xs font-black tracking-wide text-[#ff9600] uppercase"
                    >
                        🎉 New Best Score!
                    </motion.div>
                )}

                <h2 className="mb-1 text-4xl font-black text-[#3c3c3c]">{title}</h2>

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
                        {tierInfo.nextThreshold && (
                            <span className="text-xs font-bold text-[#afafaf]">
                                · {tierInfo.nextThreshold - score} to next
                            </span>
                        )}
                    </div>
                </div>

                <div className="mb-8 w-full">
                    <StatGrid stats={stats} />
                </div>

                <div className="mb-8 flex w-full gap-3">
                    <Button
                        variant="secondary"
                        color={primaryColor}
                        onClick={onPlayAgain}
                        className="flex-1 py-4"
                    >
                        Play Again
                    </Button>
                    <Button
                        variant="primary"
                        color={primaryColor}
                        onClick={onCollectXP}
                        className="flex-1 py-4"
                    >
                        +{calculatedXP} XP
                    </Button>
                </div>

                <Leaderboard
                    gameMode={gameMode}
                    currentUserId={currentUserId}
                    accentColor={accentColor}
                />
            </div>
        </div>
    );
}
