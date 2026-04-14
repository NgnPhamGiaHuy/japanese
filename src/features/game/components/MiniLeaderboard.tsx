"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";

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
    const { entries, userRank } = useLeaderboard(
        gameMode,
        5,
        currentUserId
            ? { userId: currentUserId, displayName: currentUserName || "You" }
            : undefined,
        currentScore,
    );

    const [prevRank, setPrevRank] = useState<number | null>(userRank);
    const [rankAnim, setRankAnim] = useState<"up" | "down" | null>(null);

    useEffect(() => {
        if (prevRank !== null && userRank !== null) {
            if (userRank < prevRank) {
                setRankAnim("up");
            } else if (userRank > prevRank) {
                setRankAnim("down");
            }
        }
        setPrevRank(userRank);

        const timeout = setTimeout(() => setRankAnim(null), 2000);
        return () => clearTimeout(timeout);
    }, [userRank, prevRank]);

    if (!gameMode || entries.length === 0) return null;

    const topN = entries.slice(0, 3);
    const userInTopN = topN.some((e) => e.isCurrentUser);

    const displayEntries = userInTopN
        ? topN
        : [
              ...topN,
              ...(entries.find((e) => e.isCurrentUser)
                  ? [entries.find((e) => e.isCurrentUser)!]
                  : []),
          ];

    return (
        <div className="fixed top-4 right-4 z-40 hidden w-48 flex-col gap-1 rounded-xl border border-gray-100 bg-white/90 p-3 shadow-md backdrop-blur-sm md:flex">
            <div className="mb-1 flex items-center gap-2 border-b border-gray-100 pb-1">
                <Trophy size={14} className="text-[#ff9600]" />
                <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Live Rank
                </span>
            </div>

            <AnimatePresence mode="popLayout">
                {displayEntries.map((entry) => (
                    <motion.div
                        layout
                        key={entry.userId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`flex items-center justify-between rounded px-1 py-0.5 text-sm ${
                            entry.isCurrentUser
                                ? "bg-[#ff9600]/10 font-black text-[#cc7800]"
                                : "font-medium text-gray-600"
                        }`}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <span className="w-4 shrink-0 text-center text-xs opacity-70">
                                {entry.rank}
                            </span>
                            <span className="max-w-[80px] truncate">
                                {entry.isCurrentUser ? "You" : entry.displayName}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                            {entry.score}
                            {entry.isCurrentUser && rankAnim === "up" && (
                                <motion.span
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-[10px] text-green-500"
                                >
                                    +1
                                </motion.span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default MiniLeaderboard;
