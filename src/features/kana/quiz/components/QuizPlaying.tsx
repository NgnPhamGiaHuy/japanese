/**
 * QuizPlaying — Active quiz gameplay screen
 *
 * @remarks
 * Handles both multiple choice and typing modes.
 * Shows progress, streak, and answer feedback.
 */

"use client";

import { useEffect, useRef } from "react";

import { ArrowLeft, X } from "lucide-react";

import {
    AnswerFeedback,
    gameQuizStreakColumnClassName,
    StreakComboBadge,
} from "@/features/game/components";
import { ScreenHeaderBackButton, ScreenHeaderRow } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";

import type { KanaChar, QuestionType } from "@/features/kana/types";
import type { QuizMode } from "../types";

interface QuizPlayingProps {
    quizMode: QuizMode;
    question: KanaChar | null;
    questionType: QuestionType;
    options: KanaChar[];
    status: "idle" | "correct" | "wrong";
    score: number;
    targetScore: number;
    streak: number;
    themeColor: {
        bg: string;
        text: string;
    };
    typedInput: string;
    onTypedInputChange: (value: string) => void;
    onTypeAnswer: () => void;
    onMCAnswer: (option: KanaChar) => void;
    onBack: () => void;
}

export function QuizPlaying({
    quizMode,
    question,
    questionType,
    options,
    status,
    score,
    targetScore,
    streak,
    themeColor,
    typedInput,
    onTypedInputChange,
    onTypeAnswer,
    onMCAnswer,
    onBack,
}: QuizPlayingProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when question changes or status becomes idle
    useEffect(() => {
        if (quizMode === "type" && status === "idle" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [question, status, quizMode]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <ScreenHeaderRow className="shrink-0">
                <ScreenHeaderBackButton
                    onClick={onBack}
                    icon={quizMode === "type" ? ArrowLeft : X}
                    aria-label={quizMode === "type" ? "Back to quiz menu" : "Exit quiz"}
                />
                <div className="mx-2 h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200 md:h-4">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${themeColor.bg}`}
                        style={{
                            width: `${Math.min((score / targetScore) * 100, 100)}%`,
                        }}
                    />
                </div>
                <div className={gameQuizStreakColumnClassName}>
                    <StreakComboBadge streak={streak} variant="compact" showMultiplier={false} />
                    <span
                        className={`text-[10px] font-black tabular-nums md:text-sm ${themeColor.text}`}
                    >
                        {score}/{targetScore}
                    </span>
                </div>
            </ScreenHeaderRow>

            {question && (
                <div className="hide-scrollbar mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center overflow-y-auto p-4">
                    <div
                        className={`mb-4 flex h-[200px] w-full flex-col items-center justify-center rounded-[3rem] border-2 border-b-8 border-gray-200 bg-white px-4 py-8 shadow-sm sm:h-[240px] ${status === "wrong" ? "animate-shake" : ""}`}
                    >
                        <span className="text-[7rem] leading-none font-medium text-[#3c3c3c] select-none sm:text-[8rem]">
                            {question.char}
                        </span>
                    </div>

                    {quizMode === "type" ? (
                        <div className="w-full space-y-3">
                            <input
                                ref={inputRef}
                                autoCapitalize="none"
                                autoComplete="off"
                                className="w-full rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-6 py-4 text-2xl font-black text-[#3c3c3c] transition-colors outline-none focus:border-[#1cb0f6]"
                                placeholder="Type romaji"
                                value={typedInput}
                                onChange={(e) => onTypedInputChange(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && onTypeAnswer()}
                                disabled={status !== "idle"}
                            />
                            <Button
                                alphabet="katakana"
                                onClick={onTypeAnswer}
                                disabled={status !== "idle"}
                                className="w-full py-4 text-xl"
                            >
                                Check
                            </Button>
                        </div>
                    ) : (
                        <div className="grid w-full grid-cols-2 gap-3">
                            {options.map((opt, i) => {
                                let state =
                                    "bg-white text-[#3c3c3c] border-gray-200 hover:bg-gray-50 hover:-translate-y-1 hover:shadow-md hover:border-gray-300";
                                if (status !== "idle") {
                                    if (opt.romaji === question.romaji)
                                        state =
                                            "bg-[#58cc02] text-white border-[#58a700] translate-y-[2px] border-b-2";
                                    else
                                        state = "bg-white border-gray-200 text-gray-300 opacity-50";
                                }
                                return (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        onClick={() => onMCAnswer(opt)}
                                        disabled={status !== "idle"}
                                        className={`h-[72px]! rounded-2xl! border-2! border-b-4! text-xl! font-black! shadow-none transition-all duration-150 select-none hover:shadow-none active:translate-y-0 ${state}`}
                                    >
                                        {opt.romaji}
                                    </Button>
                                );
                            })}
                        </div>
                    )}

                    <AnswerFeedback
                        status={status}
                        question={question}
                        questionType={questionType}
                        primaryBg={themeColor.bg}
                    />
                </div>
            )}
        </div>
    );
}
