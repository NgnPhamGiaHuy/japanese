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

import { gameQuizStreakColumnClassName, StreakComboBadge } from "@/features/game/components";
import { AnswerFeedback, KanaAudioButton } from "@/features/kana/components";
import { speak } from "@/shared/audio";
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
        <div className="bg-bg fixed inset-0 z-50 flex flex-col">
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
                        className={`text-xs font-black tabular-nums md:text-sm ${themeColor.text}`}
                    >
                        {score}/{targetScore}
                    </span>
                </div>
            </ScreenHeaderRow>

            {question && (
                <div className="hide-scrollbar mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center overflow-y-auto p-4">
                    <div
                        className={`rounded-6xl relative mb-4 flex h-[200px] w-full flex-col items-center justify-center border-2 border-b-8 border-gray-200 bg-white px-4 py-8 shadow-sm sm:h-[240px] ${status === "wrong" ? "animate-shake" : ""}`}
                    >
                        <KanaAudioButton
                            char={question.char}
                            onPlay={() =>
                                speak(question.char, { trigger: "user", source: "kana-quiz" })
                            }
                            iconColorClassName={themeColor.text}
                            className="absolute top-4 right-4 bg-gray-50! hover:bg-gray-100!"
                        />
                        <span className="text-text text-[7rem] leading-none font-medium select-none sm:text-9xl">
                            {question.char}
                        </span>
                    </div>

                    {quizMode === "type" ? (
                        <div className="w-full space-y-3">
                            <input
                                ref={inputRef}
                                autoCapitalize="none"
                                autoComplete="off"
                                className="text-text w-full rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-6 py-4 text-2xl font-black transition-colors outline-none focus:border-[#1cb0f6]"
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
                                    "bg-white text-text border-gray-200 hover:bg-gray-50 hover:-translate-y-1 hover:shadow-md hover:border-gray-300";
                                if (status !== "idle") {
                                    if (opt.romaji === question.romaji)
                                        state =
                                            "bg-hiragana text-white border-hiragana-strong translate-y-[2px] border-b-2";
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
                        onReplayAudio={() =>
                            speak(question.char, { trigger: "user", source: "kana-quiz" })
                        }
                    />
                </div>
            )}
        </div>
    );
}
