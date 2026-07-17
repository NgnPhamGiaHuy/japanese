"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Trophy } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { useLeaderboard } from "@/features/game/hooks";

interface MiniLeaderboardProps {
    gameMode: string | null;
    currentUserId?: string;
    currentUserName?: string;
    currentScore?: number;
}

const MiniLeaderboard = ({
    gameMode,
    currentUserId,
    currentUserName,
    currentScore = 0,
}: MiniLeaderboardProps) => {
    const t = useTranslations("Common");
    const tGame = useTranslations("Game");
    const { entries, userRank } = useLeaderboard(
        gameMode,
        5,
        currentUserId
            ? { userId: currentUserId, displayName: currentUserName || t("you") }
            : undefined,
        currentScore,
    );

    const [prevRank, setPrevRank] = useState<number | null>(userRank);
    const [rankAnim, setRankAnim] = useState<"up" | "down" | null>(null);

    // Adjusted during render (not an effect): userRank changing IS the signal,
    // so deriving rankAnim here reacts in the same render instead of a
    // schedule-then-rerun round trip.
    if (userRank !== prevRank) {
        if (prevRank !== null && userRank !== null) {
            if (userRank < prevRank) {
                setRankAnim("up");
            } else if (userRank > prevRank) {
                setRankAnim("down");
            }
        }
        setPrevRank(userRank);
    }

    // The auto-clear timer is a genuine external-system subscription, so it
    // stays in an effect — scoped to rankAnim so it only schedules once an
    // animation actually starts, not on every unrelated rank sync.
    useEffect(() => {
        if (rankAnim === null) return;
        const timeout = setTimeout(() => setRankAnim(null), 2000);
        return () => clearTimeout(timeout);
    }, [rankAnim]);

    if (!gameMode || entries.length === 0) return null;

    const topN = entries.slice(0, 3);
    const userInTopN = topN.some((entry) => entry.isCurrentUser);
    const currentUserEntry = entries.find((entry) => entry.isCurrentUser);

    const displayEntries = userInTopN
        ? topN
        : [...topN, ...(currentUserEntry ? [currentUserEntry] : [])];

    return (
        <div className="fixed top-32 right-4 z-40 hidden w-48 flex-col gap-1 rounded-xl border border-gray-100 bg-white/90 p-3 shadow-md backdrop-blur-sm md:flex">
            <div className="mb-1 flex items-center gap-2 border-b border-gray-100 pb-1">
                <Trophy size={14} className="text-survival" />
                <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                    {tGame("liveRank")}
                </span>
            </div>

            <AnimatePresence mode="popLayout">
                {displayEntries.map((entry) => (
                    <m.div
                        layout
                        key={entry.userId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`flex items-center justify-between rounded px-1 py-0.5 text-sm ${
                            entry.isCurrentUser
                                ? "bg-survival/10 text-survival-strong font-black"
                                : "font-medium text-gray-600"
                        }`}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <span className="w-4 shrink-0 text-center text-xs opacity-70">
                                {entry.rank}
                            </span>
                            <span className="max-w-[80px] truncate">
                                {entry.isCurrentUser ? t("you") : entry.displayName}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                            {entry.score}
                            {entry.isCurrentUser && rankAnim === "up" && (
                                <m.span
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-xs text-green-500"
                                >
                                    +1
                                </m.span>
                            )}
                        </div>
                    </m.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default MiniLeaderboard;
