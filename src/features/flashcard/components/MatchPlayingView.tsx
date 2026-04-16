/**
 * @file MatchPlayingView — Match Mode play HUD + grid.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";

import { LivesDisplay, MiniLeaderboard } from "@/features/game/components";
import { Button } from "@/shared/components/ui";
import MatchGrid from "./MatchGrid";
import { useMatchGameStore } from "../stores/useMatchGameStore";

import type { Grade } from "../services/card.service";

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
    /** The pairId currently revealed (answer tile + grade buttons visible). Requirement 7.2 */
    revealedPairId: string | null;
    /** Called when a grade button is pressed for the revealed pair. Requirement 7.3 */
    onGrade: (pairId: string, grade: Grade) => void;
    /** Round summary data shown when all pairs are matched. Requirement 7.7 */
    roundSummary?: {
        score: number;
        accuracy: number;
        gradeDistribution: Record<Grade, number>;
    } | null;
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
    revealedPairId,
    onGrade,
    roundSummary,
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
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="p-2! text-gray-400 hover:text-gray-600"
                    icon={X}
                />

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

            {/* Round summary overlay — shown when all pairs are matched (Requirement 7.7) */}
            <AnimatePresence>
                {roundSummary ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-x-4 top-1/2 z-40 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl"
                    >
                        <h2 className="mb-4 text-center text-xl font-black text-[#3c3c3c]">
                            Round Complete! 🎉
                        </h2>
                        <div className="mb-4 flex justify-around text-center">
                            <div>
                                <div className="text-2xl font-black text-[#ce82ff]">
                                    {roundSummary.score}
                                </div>
                                <div className="text-xs font-bold tracking-wide text-gray-500 uppercase">
                                    Score
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-[#58cc02]">
                                    {roundSummary.accuracy}%
                                </div>
                                <div className="text-xs font-bold tracking-wide text-gray-500 uppercase">
                                    Accuracy
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            {(
                                [
                                    { grade: "Again" as Grade, color: "text-[#ea2b2b]" },
                                    { grade: "Hard" as Grade, color: "text-[#ff9600]" },
                                    { grade: "Good" as Grade, color: "text-[#58cc02]" },
                                    { grade: "Easy" as Grade, color: "text-[#1cb0f6]" },
                                ] as const
                            ).map(({ grade, color }) => (
                                <div key={grade}>
                                    <div className={`text-lg font-black ${color}`}>
                                        {roundSummary.gradeDistribution[grade]}
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase">
                                        {grade}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <p className="mx-auto mt-2 max-w-sm shrink-0 px-4 text-center text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                Tap a tile to reveal its answer, then grade your recall
            </p>

            <MatchGrid
                cells={cells}
                selectedIds={selectedIds}
                matchedPairIds={matchedPairIds}
                shakeCellIds={shakeCellIds}
                processing={processing}
                onCellPress={onCellTap}
                revealedPairId={revealedPairId}
                onGrade={onGrade}
            />
        </div>
    );
};

export default MatchPlayingView;
