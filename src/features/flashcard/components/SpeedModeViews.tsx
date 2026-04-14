"use client";

import Confetti from "react-confetti";

import { AnimatePresence, motion } from "framer-motion";
import { X, Zap } from "lucide-react";

import { Leaderboard, MiniLeaderboard } from "@/features/game/components";
import { SPEED_DIFFICULTY_CONFIG, TOTAL_QUESTIONS } from "@/features/game/modes";
import { Button } from "@/shared/components/ui";

import type { TierInfo } from "@/features/game/logic";
import type { FlashCard } from "../types";

interface SpeedIntroViewProps {
    bestScore: number;
    tierInfo: TierInfo;
    onBack: () => void;
    onStart: () => void;
}

export function SpeedIntroView({ bestScore, tierInfo, onBack, onStart }: SpeedIntroViewProps) {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6">
            <button
                onClick={onBack}
                className="absolute top-4 left-4 rounded-xl p-2 text-gray-400 hover:bg-gray-200"
            >
                <X size={20} />
            </button>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6 flex h-20 w-20 -rotate-3 items-center justify-center rounded-[1.75rem] border-b-8 border-[#cc7800] bg-[#ff9600] text-white shadow-sm"
            >
                <Zap size={44} strokeWidth={2.5} />
            </motion.div>

            <h1 className="mb-1 text-3xl font-black text-[#3c3c3c]">Speed Mode</h1>
            <p className="mb-2 text-sm font-bold text-[#afafaf]">
                {TOTAL_QUESTIONS} questions · answer fast for bonus points
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
                    const config = SPEED_DIFFICULTY_CONFIG[level];
                    const range = level === 1 ? "Q1–5" : level === 2 ? "Q6–10" : "Q11–20";
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
                                {!config.showFurigana ? (
                                    <span className="rounded-lg bg-[#ffdfe0] px-1.5 py-0.5 text-[#ea2b2b]">
                                        No furigana
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
}

interface SpeedResultsViewProps {
    score: number;
    bestScore: number;
    correctCount: number;
    maxStreak: number;
    tierInfo: TierInfo;
    gameMode: string;
    currentUserId?: string;
    onPlayAgain: () => void;
    onCollectXP: () => void;
}

export function SpeedResultsView({
    score,
    bestScore,
    correctCount,
    maxStreak,
    tierInfo,
    gameMode,
    currentUserId,
    onPlayAgain,
    onCollectXP,
}: SpeedResultsViewProps) {
    const isNewBest = score > bestScore;
    const accuracy = TOTAL_QUESTIONS > 0 ? Math.round((correctCount / TOTAL_QUESTIONS) * 100) : 0;
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
                    numberOfPieces={200}
                    gravity={0.2}
                    colors={["#ff9600", "#1cb0f6", "#58cc02", "#ce82ff"]}
                />
            ) : null}
            <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-10">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 14 }}
                    className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border-b-8 border-[#cc7800] bg-[#ff9600] text-white shadow-sm"
                >
                    <Zap size={44} className="animate-pulse" strokeWidth={2.5} />
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

                <h2 className="mb-1 text-4xl font-black text-[#3c3c3c]">Speed Done!</h2>

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
                        { value: correctCount, label: "Correct", color: "#58cc02" },
                        { value: TOTAL_QUESTIONS - correctCount, label: "Wrong", color: "#ea2b2b" },
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
                        color="orange"
                        onClick={onPlayAgain}
                        className="flex-1 py-4"
                    >
                        Play Again
                    </Button>
                    <Button
                        variant="primary"
                        color="orange"
                        onClick={onCollectXP}
                        className="flex-1 py-4"
                    >
                        +{xpEarned} XP
                    </Button>
                </div>

                <Leaderboard
                    gameMode={gameMode}
                    currentUserId={currentUserId}
                    accentColor="#ff9600"
                />
            </div>
        </div>
    );
}

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

export function SpeedPlayingView({
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
}: SpeedPlayingViewProps) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <header className="flex items-center justify-between p-4">
                <button onClick={onBack} className="rounded-xl p-2 text-gray-400 hover:bg-gray-200">
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-[#3c3c3c]">
                        Q{ui.questionNumber} / {TOTAL_QUESTIONS}
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
                    {difficultyConfig.showFurigana && currentCard.furigana ? (
                        <p className="mb-2 text-xl font-bold tracking-widest text-[#afafaf]">
                            {currentCard.furigana}
                        </p>
                    ) : null}

                    <h1 className="text-[5rem] leading-none font-black text-[#3c3c3c] drop-shadow-sm sm:text-[6rem]">
                        {currentCard.kanji}
                    </h1>

                    <AnimatePresence>
                        {questionIndex === 5 && answerStatus === "idle" ? (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-2 text-xs font-black text-[#ff9600]"
                            >
                                ⚠ Furigana removed from here
                            </motion.p>
                        ) : null}
                        {questionIndex === 10 && answerStatus === "idle" ? (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-2 text-xs font-black text-[#ea2b2b]"
                            >
                                ⚡ Speed increases — 3 s per question!
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
                {Array.from({ length: TOTAL_QUESTIONS }).map((_, index) => (
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
}
