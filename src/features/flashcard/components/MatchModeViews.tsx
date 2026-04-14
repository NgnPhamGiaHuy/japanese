"use client";

import Confetti from "react-confetti";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock, Gamepad2, Trophy, X } from "lucide-react";

import { Leaderboard, MiniLeaderboard } from "@/features/game/components";
import { DIFFICULTY_CONFIG } from "@/features/game/modes/flashcardMatch";
import { Button } from "@/shared/components/ui";

import type { TierInfo } from "@/features/game/logic/tier";
import type { MatchDifficulty } from "@/features/game/modes/flashcardMatch";
import type { MatchModeCard } from "../hooks/useMatchModeSession";

interface MatchIntroViewProps {
    bestScore: number;
    tierInfo: TierInfo;
    difficulty: MatchDifficulty;
    cardCount: number;
    requiredPairs: number;
    onBack: () => void;
    onStart: () => void;
    onDifficultyChange: (difficulty: MatchDifficulty) => void;
}

export function MatchIntroView({
    bestScore,
    tierInfo,
    difficulty,
    cardCount,
    requiredPairs,
    onBack,
    onStart,
    onDifficultyChange,
}: MatchIntroViewProps) {
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
                className="mb-6 flex h-20 w-20 -rotate-3 items-center justify-center rounded-[1.75rem] border-b-8 border-[#b65ce8] bg-[#ce82ff] text-white shadow-sm"
            >
                <Gamepad2 size={44} strokeWidth={2.5} />
            </motion.div>

            <h1 className="mb-1 text-3xl font-black text-[#3c3c3c]">Match Mode</h1>
            <p className="mb-2 text-sm font-bold text-[#afafaf]">Match each Kanji to its meaning</p>

            {bestScore > 0 && (
                <div
                    className="mb-5 flex items-center gap-2 rounded-2xl border-2 px-4 py-2"
                    style={{ borderColor: tierInfo.border, backgroundColor: tierInfo.bg }}
                >
                    <span className="text-lg">{tierInfo.emoji}</span>
                    <span className="text-sm font-black" style={{ color: tierInfo.color }}>
                        {tierInfo.label}
                    </span>
                    <span className="text-sm font-bold text-[#afafaf]">·</span>
                    <span className="text-sm font-black text-[#3c3c3c]">Best: {bestScore}</span>
                </div>
            )}

            <div className="mb-6 w-full max-w-sm">
                <p className="mb-3 text-center text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                    Select Difficulty
                </p>
                <div className="flex flex-col gap-2">
                    {([1, 2, 3] as MatchDifficulty[]).map((level) => {
                        const config = DIFFICULTY_CONFIG[level];
                        const disabled = cardCount < config.pairs;
                        const active = difficulty === level && !disabled;
                        return (
                            <button
                                key={level}
                                disabled={disabled}
                                onClick={() => onDifficultyChange(level)}
                                className={`flex items-center justify-between rounded-2xl border-2 border-b-4 px-5 py-3.5 text-left transition-all ${
                                    disabled
                                        ? "cursor-not-allowed opacity-40"
                                        : active
                                          ? "shadow-sm"
                                          : "border-gray-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
                                }`}
                                style={
                                    active
                                        ? {
                                              backgroundColor: config.color,
                                              borderColor: `${config.color}BB`,
                                          }
                                        : {}
                                }
                            >
                                <div>
                                    <div
                                        className={`font-black ${active ? "text-white" : "text-[#3c3c3c]"}`}
                                    >
                                        {config.label}
                                    </div>
                                    <div
                                        className={`text-xs font-bold ${active ? "text-white/70" : "text-[#afafaf]"}`}
                                    >
                                        {config.sub}
                                        {disabled ? " (need more cards)" : ""}
                                    </div>
                                </div>
                                {active ? <CheckCircle2 size={20} className="text-white" /> : null}
                            </button>
                        );
                    })}
                </div>
            </div>

            <Button
                variant="primary"
                color="purple"
                onClick={onStart}
                disabled={cardCount < requiredPairs}
                className="w-full max-w-sm py-5 text-xl"
            >
                Play
            </Button>
        </div>
    );
}

interface MatchResultsViewProps {
    score: number;
    bestScore: number;
    matchedCount: number;
    totalCount: number;
    wrongAttempts: number;
    maxStreak: number;
    tierInfo: TierInfo;
    gameMode: string;
    currentUserId?: string;
    onPlayAgain: () => void;
    onCollectXP: () => void;
}

export function MatchResultsView({
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
}: MatchResultsViewProps) {
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
}

interface MatchPlayingViewProps {
    gameMode: string;
    currentUserId?: string;
    currentUserName?: string;
    score: number;
    streak: number;
    timeLeft: number;
    progress: number;
    comboPopup: { id: number; text: string; bonus: number } | null;
    leftItems: MatchModeCard[];
    rightItems: MatchModeCard[];
    matchedIds: Set<string>;
    selectedLeft: string | null;
    selectedRight: string | null;
    errorLeft: string | null;
    errorRight: string | null;
    processing: boolean;
    onBack: () => void;
    onSelectLeft: (id: string) => void;
    onSelectRight: (id: string) => void;
}

export function MatchPlayingView({
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
}: MatchPlayingViewProps) {
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
}
