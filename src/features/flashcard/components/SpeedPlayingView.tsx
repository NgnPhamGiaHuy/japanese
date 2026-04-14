/**
 * @file SpeedPlayingView
 * Active Gameplay Screen for Speed Mode.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { MiniLeaderboard } from "@/features/game/components";
import { SPEED_GAME_CONFIG } from "@/features/game/modes";
import { getAltForm, getPrimary } from "../utils/cardDisplay";

import type { FlashCard } from "../types";

interface SpeedPlayingViewProps {
    gameMode: string;
    currentUserId?: string;
    currentUserName?: string;
    score: number;
    questionIndex: number;
    timerFraction: number;
    answerStatus: "idle" | "correct" | "wrong";
    selectedOption: string | null;
    currentCard: FlashCard;
    options: string[];
    difficultyConfig: {
        label: string;
        color: string;
        showFurigana: boolean;
    };
    ui: {
        questionNumber: number;
        multiplier: number;
        secondsLeft: number;
        isUrgent: boolean;
        timerBarColor: string;
        timerTransitionMs: number;
    };
    onBack: () => void;
    onAnswer: (value: string) => void;
}

/**
 * SpeedPlayingView — Implements fast-paced multiple choice gameplay.
 */
const SpeedPlayingView = ({
    gameMode,
    currentUserId,
    currentUserName,
    score,
    questionIndex,
    timerFraction,
    answerStatus,
    selectedOption,
    currentCard,
    options,
    difficultyConfig,
    ui,
    onBack,
    onAnswer,
}: SpeedPlayingViewProps) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <header className="flex items-center justify-between p-4">
                <button onClick={onBack} className="rounded-xl p-2 text-gray-400 hover:bg-gray-200">
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-[#3c3c3c]">
                        Q{ui.questionNumber} / {SPEED_GAME_CONFIG.TOTAL_QUESTIONS}
                    </span>
                    <span
                        className="text-[10px] font-black"
                        style={{ color: difficultyConfig.color }}
                    >
                        {difficultyConfig.label}
                    </span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-[#3c3c3c]">{score}</span>
                    {ui.multiplier > 1 ? (
                        <span className="text-[10px] font-black text-[#ff9600]">
                            🔥 {ui.multiplier}× combo
                        </span>
                    ) : null}
                </div>
            </header>

            <div className="mx-4 h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                    className={`h-full rounded-full transition-none ${ui.isUrgent ? "animate-pulse" : ""}`}
                    style={{
                        width: `${timerFraction * 100}%`,
                        backgroundColor: ui.timerBarColor,
                        transition: `width ${ui.timerTransitionMs}ms linear`,
                    }}
                />
            </div>

            <div className="mx-4 mt-1 text-right">
                <span
                    className={`text-xs font-black tabular-nums ${ui.isUrgent ? "text-[#ea2b2b]" : "text-[#afafaf]"}`}
                >
                    {ui.secondsLeft}s
                </span>
            </div>

            <MiniLeaderboard
                gameMode={gameMode}
                currentUserId={currentUserId}
                currentUserName={currentUserName ?? "You"}
                currentScore={score}
            />

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-6">
                <motion.div
                    key={questionIndex}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`mb-8 w-full text-center ${answerStatus === "wrong" ? "animate-shake" : ""}`}
                >
                    {/* Level 1 only: altForm (romaji/kanji) shown ABOVE kana as context */}
                    {difficultyConfig.showFurigana && getAltForm(currentCard) ? (
                        <p className="mb-2 text-lg font-bold tracking-widest text-[#afafaf]">
                            {getAltForm(currentCard)}
                        </p>
                    ) : null}

                    <h1 className="text-[5rem] leading-none font-black text-[#3c3c3c] drop-shadow-sm sm:text-[6rem]">
                        {/* All levels: show kana (spoken form) as the main question */}
                        {getPrimary(currentCard)}
                    </h1>

                    <AnimatePresence>
                        {questionIndex === SPEED_GAME_CONFIG.LEVELS[2].threshold &&
                        answerStatus === "idle" ? (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-2 text-xs font-black text-[#ff9600]"
                            >
                                ⚠ Alt form hidden from here
                            </motion.p>
                        ) : null}
                        {questionIndex === SPEED_GAME_CONFIG.LEVELS[3].threshold &&
                        answerStatus === "idle" ? (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-2 text-xs font-black text-[#ea2b2b]"
                            >
                                ⚡ Speed increases — {SPEED_GAME_CONFIG.LEVELS[3].timeLimit} s per
                                question!
                            </motion.p>
                        ) : null}
                    </AnimatePresence>
                </motion.div>

                <div className="grid w-full gap-3">
                    {options.map((option, index) => {
                        const isCorrect = option === currentCard.meaning;
                        let className =
                            "min-h-[72px] rounded-2xl border-2 border-b-4 px-5 py-4 text-left text-base font-bold shadow-sm transition-all duration-150 select-none";

                        if (answerStatus === "idle") {
                            className +=
                                " border-gray-200 bg-white text-[#3c3c3c] hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md";
                        } else if (isCorrect) {
                            className +=
                                " z-10 translate-y-[2px] border-b-2 border-[#58a700] bg-[#58cc02] text-white";
                        } else if (option === selectedOption && answerStatus === "wrong") {
                            className +=
                                " translate-y-[2px] border-b-2 border-[#ea2b2b] bg-[#ffdfe0] text-[#ea2b2b]";
                        } else {
                            className += " border-gray-200 bg-white text-gray-300 opacity-50";
                        }

                        return (
                            <button
                                key={index}
                                disabled={answerStatus !== "idle"}
                                onClick={() => onAnswer(option)}
                                className={className}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-center gap-1 pb-6">
                {Array.from({ length: SPEED_GAME_CONFIG.TOTAL_QUESTIONS }).map((_, index) => (
                    <div
                        key={index}
                        className="h-1.5 w-1.5 rounded-full transition-colors"
                        style={{
                            backgroundColor:
                                index < questionIndex
                                    ? "#58cc02"
                                    : index === questionIndex
                                      ? "#ff9600"
                                      : "#e5e7eb",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default SpeedPlayingView;
