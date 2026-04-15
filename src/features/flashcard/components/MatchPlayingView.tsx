/**
 * @file MatchPlayingView — Match Mode play HUD + grid.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";

import { LivesDisplay, MiniLeaderboard } from "@/features/game/components";
import MatchGrid from "./MatchGrid";
import { useMatchGameStore } from "../stores/useMatchGameStore";

interface MatchPlayingViewProps {
    gameMode: string;
    currentUserId?: string;
    currentUserName?: string;
    score: number;
    streak: number;
    timeLeft: number;
    timeUnlimited: boolean;
    progress: number;
    comboPopup: { id: number; text: string; bonus: number } | null;
    showLives: boolean;
    livesLeft: number;
    livesTotal: number;
    onBack: () => void;
    onCellTap: (cellId: string) => void;
}

const MatchPlayingView = ({
    gameMode,
    currentUserId,
    currentUserName,
    score,
    streak,
    timeLeft,
    timeUnlimited,
    progress,
    comboPopup,
    showLives,
    livesLeft,
    livesTotal,
    onBack,
    onCellTap,
}: MatchPlayingViewProps) => {
    const isUrgent = !timeUnlimited && timeLeft <= 10 && timeLeft > 0;
    const minutes = Math.floor(Math.max(0, timeLeft) / 60);
    const seconds = Math.max(0, timeLeft) % 60;

    const cells = useMatchGameStore((s) => s.grid);
    const selectedIds = useMatchGameStore((s) => s.selectedIds);
    const matchedPairIds = useMatchGameStore((s) => s.matchedPairIds);
    const processing = useMatchGameStore((s) => s.processing);
    const shakeCellIds = useMatchGameStore((s) => s.shakeCellIds);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <header className="flex shrink-0 items-center justify-between p-4">
                <button
                    onClick={onBack}
                    type="button"
                    className="rounded-xl p-2 text-gray-400 hover:bg-gray-200"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center gap-1">
                    {showLives ? <LivesDisplay lives={livesLeft} total={livesTotal} /> : null}
                    <div
                        className={`flex items-center gap-1.5 text-xl font-black transition-colors ${
                            isUrgent ? "animate-pulse text-[#ea2b2b]" : "text-[#3c3c3c]"
                        }`}
                    >
                        <Clock size={20} strokeWidth={3} />
                        {timeUnlimited ? (
                            <span>∞</span>
                        ) : (
                            <span>
                                {String(minutes).padStart(2, "0")}:
                                {String(seconds).padStart(2, "0")}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-[#3c3c3c]">{score}</span>
                    {streak >= 3 ? (
                        <span className="text-[10px] font-black text-[#ff9600]">🔥 {streak}×</span>
                    ) : null}
                </div>
            </header>

            <div className="mx-4 h-2.5 shrink-0 overflow-hidden rounded-full bg-gray-200">
                <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: "#ce82ff" }}
                />
            </div>

            <AnimatePresence>
                {comboPopup ? (
                    <motion.div
                        key={comboPopup.id}
                        initial={{ opacity: 0, y: 20, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -24, scale: 1.1 }}
                        transition={{ duration: 0.25 }}
                        className="pointer-events-none fixed top-28 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-[#ff9600] px-6 py-3 text-center shadow-xl"
                    >
                        <div className="text-base font-black text-white">{comboPopup.text}</div>
                        {comboPopup.bonus > 0 ? (
                            <div className="text-xs font-bold text-white/80">
                                +{comboPopup.bonus} bonus pts
                            </div>
                        ) : null}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <MiniLeaderboard
                gameMode={gameMode}
                currentUserId={currentUserId}
                currentUserName={currentUserName ?? "You"}
                currentScore={score}
            />

            <p className="mx-auto mt-2 max-w-sm shrink-0 px-4 text-center text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                Tap two tiles that belong together — distractors never pair
            </p>

            <MatchGrid
                cells={cells}
                selectedIds={selectedIds}
                matchedPairIds={matchedPairIds}
                shakeCellIds={shakeCellIds}
                processing={processing}
                onCellPress={onCellTap}
            />
        </div>
    );
};

export default MatchPlayingView;
