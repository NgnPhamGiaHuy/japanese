/**
 * @file SpeedPlayingView
 * Active Gameplay Screen for Speed Mode.
 */

"use client";

import { useTranslations } from "next-intl";

import { X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { SPEED_GAME_CONFIG } from "@/features/flashcard/games/speed/config";
import { MiniLeaderboard } from "@/features/game/components";
import { ScreenHeaderBackButton, ScreenHeaderRow } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";

import type { FlashCard } from "../../../types";
import type { QuestionType } from "../../../utils";

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
    currentQuestion: {
        prompt: string;
        answer: string;
        type: QuestionType;
    } | null;
    difficultyConfig: {
        level: number;
        color: string;
    };
    ui: {
        questionNumber: number;
        totalQuestions: number;
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
    currentQuestion,
    difficultyConfig,
    ui,
    onBack,
    onAnswer,
}: SpeedPlayingViewProps) => {
    const t = useTranslations("SpeedGame");
    const tGame = useTranslations("Game");
    const tCommon = useTranslations("Common");

    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col">
            <ScreenHeaderRow className="shrink-0" symmetricSidebars>
                <ScreenHeaderBackButton
                    onClick={onBack}
                    icon={X}
                    aria-label={tGame("backToLesson")}
                    className="text-gray-400 hover:text-gray-600"
                />

                <div className="flex flex-col items-center">
                    <span className="text-text text-sm font-black">
                        Q{ui.questionNumber} / {ui.totalQuestions}
                    </span>
                    <span className="text-xs font-black" style={{ color: difficultyConfig.color }}>
                        {t(`level.${difficultyConfig.level}`)}
                    </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span className="text-text text-2xl font-black tabular-nums md:text-3xl">
                        {score}
                    </span>
                    {ui.multiplier > 1 ? (
                        <span className="text-survival text-xs font-black whitespace-nowrap">
                            🔥 {tGame("comboMultiplier", { multiplier: ui.multiplier })}
                        </span>
                    ) : (
                        <span className="invisible text-xs font-black select-none" aria-hidden>
                            🔥 {tGame("comboMultiplier", { multiplier: 0 })}
                        </span>
                    )}
                </div>
            </ScreenHeaderRow>

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
                    className={`text-xs font-black tabular-nums ${ui.isUrgent ? "text-danger" : "text-muted"}`}
                >
                    {ui.secondsLeft}s
                </span>
            </div>

            <MiniLeaderboard
                gameMode={gameMode}
                currentUserId={currentUserId}
                currentUserName={currentUserName ?? tCommon("you")}
                currentScore={score}
            />

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pt-6">
                <m.div
                    key={questionIndex}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`mb-8 w-full text-center ${answerStatus === "wrong" ? "animate-shake" : ""}`}
                >
                    {(() => {
                        const text = currentQuestion?.prompt ?? currentCard.primary;
                        const len = text.length;
                        const sizeClass =
                            len <= 4
                                ? "text-[5rem] sm:text-[6rem]"
                                : len <= 8
                                  ? "text-[3.25rem] sm:text-[4.25rem]"
                                  : "text-[2.25rem] sm:text-[3rem]";

                        return (
                            <h1
                                className={`${sizeClass} text-text leading-[1.1] font-black tracking-tight drop-shadow-sm transition-all duration-300`}
                            >
                                {text}
                            </h1>
                        );
                    })()}

                    <AnimatePresence>
                        {questionIndex === SPEED_GAME_CONFIG.LEVELS[2].threshold &&
                        answerStatus === "idle" ? (
                            <m.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-survival mt-2 text-xs font-black"
                            >
                                ⚠ {t("hintsReducedFromHere")}
                            </m.p>
                        ) : null}
                        {questionIndex === SPEED_GAME_CONFIG.LEVELS[3].threshold &&
                        answerStatus === "idle" ? (
                            <m.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-danger mt-2 text-xs font-black"
                            >
                                ⚡{" "}
                                {t("speedIncreases", {
                                    seconds: SPEED_GAME_CONFIG.LEVELS[3].timeLimit,
                                })}
                            </m.p>
                        ) : null}
                    </AnimatePresence>
                </m.div>

                <div className="grid w-full gap-3">
                    {options.map((option, index) => {
                        const isCorrect = option === (currentQuestion?.answer ?? "");
                        let className =
                            "min-h-[72px] rounded-2xl border-2 border-b-4 px-5 py-4 text-left text-base font-bold shadow-sm transition-all duration-150 select-none";

                        if (answerStatus === "idle") {
                            className +=
                                " border-gray-200 bg-white text-text hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md";
                        } else if (isCorrect) {
                            className +=
                                " z-10 translate-y-[2px] border-b-2 border-hiragana-strong bg-hiragana text-white";
                        } else if (option === selectedOption && answerStatus === "wrong") {
                            className +=
                                " translate-y-[2px] border-b-2 border-danger bg-danger-bg text-danger";
                        } else {
                            className += " border-gray-200 bg-white text-gray-300 opacity-50";
                        }

                        return (
                            <Button
                                key={index}
                                variant="ghost"
                                disabled={answerStatus !== "idle"}
                                onClick={() => onAnswer(option)}
                                className={`min-h-[72px]! rounded-2xl! border-2! border-b-4! px-5! py-4! text-left! text-base! font-bold! shadow-none select-none hover:shadow-none active:translate-y-0 ${className}`}
                            >
                                {option}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Back_Face reveal: show card meaning after wrong answer or timer expiry */}
            {/* Fixed height container prevents layout jumping in the main game area above */}
            <div className="mx-auto flex h-[110px] w-full max-w-md items-center px-6">
                <AnimatePresence>
                    {answerStatus !== "idle" && currentCard.meaning ? (
                        <m.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 text-center"
                        >
                            <p className="text-muted text-xs font-black tracking-widest uppercase">
                                {t("meaningLabel")}
                            </p>
                            <p className="text-text mt-1 text-base font-bold">
                                {currentCard.meaning}
                            </p>
                        </m.div>
                    ) : null}
                </AnimatePresence>
            </div>

            <div className="flex justify-center gap-1 pb-6">
                {Array.from({ length: ui.totalQuestions }).map((_, index) => (
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
