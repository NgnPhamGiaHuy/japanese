/**
 * @file MatchPlayingView
 * Active Gameplay Screen for Match Mode.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";

import { MiniLeaderboard } from "@/features/game/components";

import type { MatchModeCard } from "../hooks";

interface MatchPlayingViewProps {
    gameMode: string;
    currentUserId?: string;
    currentUserName?: string;
    score: number;
    streak: number;
    timeLeft: number;
    progress: number;
    /** Content for the combo/bonus toast notification */
    comboPopup: { id: number; text: string; bonus: number } | null;
    /** Shuffled list of Kanji (left column) */
    leftItems: MatchModeCard[];
    /** Shuffled list of Meanings (right column) */
    rightItems: MatchModeCard[];
    /** Set of card IDs that have been successfully paired */
    matchedIds: Set<string>;
    /** ID of the currently selected Kanji */
    selectedLeft: string | null;
    /** ID of the currently selected Meaning */
    selectedRight: string | null;
    /** ID of the Kanji that triggered an error animation */
    errorLeft: string | null;
    /** ID of the Meaning that triggered an error animation */
    errorRight: string | null;
    /** Prevents input while animations/validations are running */
    processing: boolean;
    onBack: () => void;
    onSelectLeft: (id: string) => void;
    onSelectRight: (id: string) => void;
}

/**
 * MatchPlayingView — Functional gameplay screen with 2-column grid.
 */
const MatchPlayingView = ({
    gameMode,
    currentUserId,
    currentUserName,
    score,
    streak,
    timeLeft,
    progress,
    comboPopup,
    leftItems,
    rightItems,
    matchedIds,
    selectedLeft,
    selectedRight,
    errorLeft,
    errorRight,
    processing,
    onBack,
    onSelectLeft,
    onSelectRight,
}: MatchPlayingViewProps) => {
    const isUrgent = timeLeft <= 10 && timeLeft > 0;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <header className="flex items-center justify-between p-4">
                <button onClick={onBack} className="rounded-xl p-2 text-gray-400 hover:bg-gray-200">
                    <X size={20} />
                </button>

                <div
                    className={`flex items-center gap-1.5 text-xl font-black transition-colors ${
                        isUrgent ? "animate-pulse text-[#ea2b2b]" : "text-[#3c3c3c]"
                    }`}
                >
                    <Clock size={20} strokeWidth={3} />
                    <span>
                        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-[#3c3c3c]">{score}</span>
                    {streak >= 3 ? (
                        <span className="text-[10px] font-black text-[#ff9600]">🔥 {streak}×</span>
                    ) : null}
                </div>
            </header>

            <div className="mx-4 h-2.5 overflow-hidden rounded-full bg-gray-200">
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
                        className="pointer-events-none fixed top-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-[#ff9600] px-6 py-3 text-center shadow-xl"
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

            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2.5">
                        <div className="mb-0.5 text-center text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Japanese
                        </div>
                        {leftItems.map((item) => {
                            const isMatched = matchedIds.has(item.cardId);
                            const isSelected = selectedLeft === item.cardId && !isMatched;
                            const isError = errorLeft === item.cardId;

                            let className =
                                "flex min-h-[72px] cursor-pointer items-center justify-center rounded-2xl border-2 border-b-4 p-3 text-center font-black transition-all duration-150 select-none";
                            let style: Record<string, string | number> = {};

                            if (isMatched) {
                                className +=
                                    " scale-95 pointer-events-none translate-y-0.5 border-b-2 opacity-30";
                                style = {
                                    backgroundColor: "#f2fbf0",
                                    borderColor: "#58cc02",
                                    color: "#58cc02",
                                };
                            } else if (isError) {
                                className += " animate-shake translate-y-0.5 border-b-2";
                                style = {
                                    backgroundColor: "#ffdfe0",
                                    borderColor: "#ea2b2b",
                                    color: "#ea2b2b",
                                };
                            } else if (isSelected) {
                                className += " -translate-y-1 shadow-md border-b-2";
                                style = {
                                    backgroundColor: "#f8f0ff",
                                    borderColor: "#ce82ff",
                                    color: "#ce82ff",
                                };
                            } else {
                                className +=
                                    " bg-white border-gray-200 text-[#3c3c3c] hover:-translate-y-1 hover:shadow-md";
                            }

                            return (
                                <button
                                    key={`${item.cardId}-left`}
                                    disabled={isMatched || processing}
                                    onClick={() => onSelectLeft(item.cardId)}
                                    className={className}
                                    style={style}
                                >
                                    <span className="text-xl leading-tight">{item.kanji}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <div className="mb-0.5 text-center text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Meaning
                        </div>
                        {rightItems.map((item) => {
                            const isMatched = matchedIds.has(item.cardId);
                            const isSelected = selectedRight === item.cardId && !isMatched;
                            const isError = errorRight === item.cardId;

                            let className =
                                "flex min-h-[72px] cursor-pointer items-center justify-center rounded-2xl border-2 border-b-4 p-3 text-center text-sm font-bold transition-all duration-150 select-none";
                            let style: Record<string, string | number> = {};

                            if (isMatched) {
                                className +=
                                    " scale-95 pointer-events-none translate-y-0.5 border-b-2 opacity-30";
                                style = {
                                    backgroundColor: "#f2fbf0",
                                    borderColor: "#58cc02",
                                    color: "#58cc02",
                                };
                            } else if (isError) {
                                className += " animate-shake translate-y-0.5 border-b-2";
                                style = {
                                    backgroundColor: "#ffdfe0",
                                    borderColor: "#ea2b2b",
                                    color: "#ea2b2b",
                                };
                            } else if (isSelected) {
                                className += " -translate-y-1 shadow-md border-b-2";
                                style = {
                                    backgroundColor: "#fff8e8",
                                    borderColor: "#ff9600",
                                    color: "#ff9600",
                                };
                            } else {
                                className +=
                                    " bg-white border-gray-200 text-[#3c3c3c] hover:-translate-y-1 hover:shadow-md";
                            }

                            return (
                                <button
                                    key={`${item.cardId}-right`}
                                    disabled={isMatched || processing}
                                    onClick={() => onSelectRight(item.cardId)}
                                    className={className}
                                    style={style}
                                >
                                    {item.meaning}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchPlayingView;
