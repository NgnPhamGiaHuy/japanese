"use client";

import { useEffect, useRef } from "react";

import { motion, useAnimation } from "framer-motion";

import { comboMultiplier } from "@/features/game/logic";

import type { ReactNode } from "react";

/** Flat survival orange — no gradient or shadow. */
const STREAK_PILL = "rounded-xl bg-[#ff9600]";

export type StreakHudVariant = "compact" | "default";

/** Right HUD: timer → streak → score. Stable widths, items vertically centered. */
const HUD_RIGHT_CLASS =
    "flex shrink-0 flex-row flex-nowrap items-center justify-end gap-8 md:gap-10";

/** Recall quiz: streak + score column (unchanged width). */
export const gameQuizStreakColumnClassName =
    "flex w-[5.5rem] shrink-0 flex-col items-end justify-center gap-1.5 md:w-32";

const TIMER_CELL = "flex h-12 w-16 shrink-0 items-center justify-end md:w-[4.5rem]";
const STREAK_SLOT = "flex h-12 w-[5.5rem] shrink-0 items-center justify-center md:w-[5.75rem]";
const SCORE_CELL =
    "flex min-h-12 min-w-[3rem] flex-col items-end justify-center gap-0.5 md:min-w-[3.25rem]";
const BONUS_LINE = "flex h-5 w-full min-h-5 items-center justify-end";

interface StreakComboBadgeProps {
    streak: number;
    variant?: StreakHudVariant;
    showMultiplier?: boolean;
}

/**
 * Streak pill is always mounted (fixed slot). Opacity / motion for states — no mount/unmount.
 */
const StreakComboBadge = ({
    streak,
    variant = "default",
    showMultiplier = true,
}: StreakComboBadgeProps) => {
    const controls = useAnimation();
    const prevStreak = useRef(streak);

    useEffect(() => {
        if (streak > prevStreak.current && streak > 0) {
            void controls.start({
                scale: [1, 1.1, 1],
                transition: { duration: 0.34, ease: [0.34, 1.45, 0.64, 1] },
            });
        }
        prevStreak.current = streak;
    }, [streak, controls]);

    const mult =
        showMultiplier && streak > 0 && comboMultiplier(streak) > 1
            ? comboMultiplier(streak)
            : null;

    if (variant === "compact") {
        return (
            <div className="flex min-h-[36px] w-full items-center justify-end">
                <motion.div
                    animate={controls}
                    className={`inline-flex min-w-19 items-center justify-center gap-1 px-2.5 py-1.5 ${STREAK_PILL} transition-opacity duration-200 ${
                        streak === 0 ? "opacity-30" : "opacity-100"
                    }`}
                >
                    <span className="text-base leading-none md:text-lg" aria-hidden>
                        🔥
                    </span>
                    <span className="text-base font-black text-white tabular-nums md:text-lg">
                        {streak}
                    </span>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={STREAK_SLOT}>
            <motion.div
                animate={controls}
                className={`inline-flex w-21 max-w-full items-center justify-center gap-1 px-2.5 py-2 md:w-22 md:px-3 ${STREAK_PILL} ${
                    streak === 0 ? "opacity-30" : "opacity-100"
                } transition-opacity duration-200`}
            >
                <span className="text-lg leading-none md:text-xl" aria-hidden>
                    🔥
                </span>
                <span className="text-lg font-black text-white tabular-nums md:text-xl">
                    {streak}
                </span>
                <span
                    className={`inline-flex min-w-8 justify-center rounded-md bg-white/20 px-1 py-0.5 text-xs font-black text-white tabular-nums md:min-w-9 md:text-sm ${
                        mult != null ? "" : "pointer-events-none invisible text-transparent"
                    }`}
                    aria-hidden={mult == null}
                >
                    {mult != null ? `${mult}×` : "2×"}
                </span>
            </motion.div>
        </div>
    );
};

interface GameStreakScoreStackProps {
    streak: number;
    score: number;
    variant?: StreakHudVariant;
    showComboMultiplier?: boolean;
    lastPoints?: number;
    pointsAnimKey?: number;
    scoreClassName?: string;
    startSlot?: ReactNode;
}

const DEFAULT_SCORE_CLASS =
    "text-4xl font-black tabular-nums leading-none tracking-tight text-[#ff9600] md:text-5xl";

/**
 * Top bar right group: [ Timer | Streak | Score ]. Fixed slots; bonus line always reserves height.
 */
const GameStreakScoreStack = ({
    streak,
    score,
    variant = "default",
    showComboMultiplier = true,
    lastPoints,
    pointsAnimKey,
    scoreClassName = DEFAULT_SCORE_CLASS,
    startSlot,
}: GameStreakScoreStackProps) => {
    const showBonus = lastPoints != null && lastPoints > 1;

    return (
        <div className={HUD_RIGHT_CLASS}>
            <div className={TIMER_CELL}>
                {startSlot != null ? (
                    startSlot
                ) : (
                    <span
                        className="invisible block w-full text-right text-lg font-semibold tabular-nums select-none md:text-xl"
                        aria-hidden
                    >
                        0:00
                    </span>
                )}
            </div>
            <StreakComboBadge
                streak={streak}
                variant={variant}
                showMultiplier={showComboMultiplier}
            />
            <div className={SCORE_CELL}>
                <div className={BONUS_LINE}>
                    <span
                        key={showBonus ? pointsAnimKey : "bonus-reserved"}
                        className={`text-sm font-bold tabular-nums md:text-base ${
                            showBonus
                                ? "text-[#34c759]"
                                : "pointer-events-none invisible select-none"
                        }`}
                        aria-hidden={!showBonus}
                    >
                        +{showBonus ? lastPoints : 88}
                    </span>
                </div>
                <span className={scoreClassName}>{score}</span>
            </div>
        </div>
    );
};

export { StreakComboBadge, GameStreakScoreStack };
export default GameStreakScoreStack;
