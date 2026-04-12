"use client";

import { useState } from "react";
import { ArrowLeft, Eye, Keyboard, Shuffle, X } from "lucide-react";

import { AnswerFeedback } from "@/features/game/components";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { useQuizEngine } from "@/features/kana/hooks/useQuizEngine";
import { ScreenHeader, ScreenHeaderBackButton, ScreenHeaderRow } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { HANDWRITING_FONT, PRINT_FONT } from "@/shared/constants/fonts";
import { checkTypedAnswer } from "@/shared/utils/romaji";
import { useAppStore } from "@/store/useAppStore";

type QuizMode = "choice" | "type" | "smart";

export default function KanaQuizPage() {
    const { dataset, alphabet, themeColor } = useKanaDataset();
    const { useHandwriting } = useAppStore();
    const activeFont = useHandwriting ? HANDWRITING_FONT : PRINT_FONT;

    const [quizMode, setQuizMode] = useState<QuizMode>("choice");
    const [typedInput, setTypedInput] = useState("");
    const [phase, setPhase] = useState<"setup" | "playing" | "done">("setup");

    const engine = useQuizEngine(dataset);

    const startQuiz = (mode: QuizMode) => {
        setQuizMode(mode);
        engine.resetEngine();
        if (mode === "smart") engine.buildSmartDeck(20);
        engine.generateQuestion(mode === "type" ? "type" : "read");
        setPhase("playing");
    };

    const handleMCAnswer = (option: { romaji: string }) => {
        if (engine.status !== "idle" || !engine.question) return;
        engine.processAnswer(option.romaji === engine.question.romaji, () => {
            setTypedInput("");
            engine.generateQuestion(quizMode === "type" ? "type" : "read");
        });
    };

    const handleTypeAnswer = () => {
        if (engine.status !== "idle" || !engine.question) return;
        const correct = checkTypedAnswer(typedInput, engine.question.romaji);
        engine.processAnswer(correct, () => {
            setTypedInput("");
            engine.generateQuestion("type");
        });
    };

    if (phase === "setup") {
        return (
            <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]">
                <ScreenHeader title="Recall Quiz" backHref="/kana" />
                <div className="flex flex-1 flex-col items-center justify-start px-4 py-6">
                    <div className="w-full max-w-md">
                        <div
                            className={`h-16 w-16 md:h-20 md:w-20 ${themeColor.bg} mb-4 flex shrink-0 -rotate-6 items-center justify-center rounded-2xl border-b-4 text-3xl font-medium text-white shadow-sm md:mb-6 md:rounded-3xl md:border-b-8 md:text-4xl`}
                            style={{ borderColor: themeColor.border }}
                        >
                            {alphabet === "both" ? "あ" : alphabet === "hiragana" ? "あ" : "ア"}
                        </div>
                        <p className="mb-8 text-lg font-bold text-[#afafaf]">
                            How well do you know your kana?
                        </p>
                        <div className="space-y-3">
                            <button
                                id="quiz-mode-choice"
                                onClick={() => startQuiz("choice")}
                                className="group flex w-full items-center rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="mr-4 rounded-xl bg-[#faeaff] p-3">
                                    <Eye size={24} className="text-[#ce82ff]" />
                                </div>
                                <div>
                                    <div className="text-lg font-black text-[#3c3c3c]">
                                        Multiple Choice
                                    </div>
                                    <div className="text-sm font-bold text-[#afafaf]">
                                        Choose from 4 options
                                    </div>
                                </div>
                            </button>
                            <button
                                id="quiz-mode-type"
                                onClick={() => startQuiz("type")}
                                className="flex w-full items-center rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="mr-4 rounded-xl bg-[#e5f5ff] p-3">
                                    <Keyboard size={24} className="text-[#1cb0f6]" />
                                </div>
                                <div>
                                    <div className="text-lg font-black text-[#3c3c3c]">
                                        Type the Romaji
                                    </div>
                                    <div className="text-sm font-bold text-[#afafaf]">
                                        Type the romanization
                                    </div>
                                </div>
                            </button>
                            <button
                                id="quiz-mode-smart"
                                onClick={() => startQuiz("smart")}
                                className="flex w-full items-center rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="mr-4 rounded-xl bg-[#fff5e6] p-3">
                                    <Shuffle size={24} className="text-[#ff9600]" />
                                </div>
                                <div>
                                    <div className="text-lg font-black text-[#3c3c3c]">
                                        Smart Review
                                    </div>
                                    <div className="text-sm font-bold text-[#afafaf]">
                                        Focus on your weakest characters
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { question, options, status, score, streak } = engine;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <ScreenHeaderRow className="shrink-0">
                <ScreenHeaderBackButton
                    onClick={() => setPhase("setup")}
                    icon={quizMode === "type" ? ArrowLeft : X}
                    aria-label={quizMode === "type" ? "Back to quiz menu" : "Exit quiz"}
                />
                <div className="mx-2 h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200 md:h-4">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${themeColor.bg}`}
                        style={{
                            width: `${Math.min((score / 20) * 100, 100)}%`,
                        }}
                    />
                </div>
                <div className="flex min-w-[4.5rem] shrink-0 items-center justify-end gap-2 md:gap-3">
                    {streak >= 3 && (
                        <span className="animate-bounce text-[10px] font-black text-[#ff9600] md:text-sm">
                            🔥{streak}
                        </span>
                    )}
                    <span className={`text-[10px] font-black md:text-sm ${themeColor.text}`}>
                        {score}/20
                    </span>
                </div>
            </ScreenHeaderRow>

            {question && (
                <div className="hide-scrollbar mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center overflow-y-auto p-4">
                    <div
                        className={`mb-4 flex h-[200px] w-full flex-col items-center justify-center rounded-[3rem] border-2 border-b-8 border-gray-200 bg-white px-4 py-8 shadow-sm sm:h-[240px] ${status === "wrong" ? "animate-shake" : ""}`}
                    >
                        <span
                            style={{ fontFamily: activeFont }}
                            className="text-[7rem] leading-none font-medium text-[#3c3c3c] select-none sm:text-[8rem]"
                        >
                            {question.char}
                        </span>
                    </div>

                    {quizMode === "type" ? (
                        <div className="w-full space-y-3">
                            <input
                                autoFocus
                                autoCapitalize="none"
                                autoComplete="off"
                                className="w-full rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-6 py-4 text-2xl font-black text-[#3c3c3c] transition-colors outline-none focus:border-[#1cb0f6]"
                                placeholder="Type romaji"
                                value={typedInput}
                                onChange={(e) => setTypedInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleTypeAnswer()}
                                disabled={status !== "idle"}
                            />
                            <Button
                                alphabet={alphabet}
                                onClick={handleTypeAnswer}
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
                                    <button
                                        key={i}
                                        onClick={() => handleMCAnswer(opt)}
                                        disabled={status !== "idle"}
                                        className={`h-[72px] rounded-2xl border-2 border-b-4 text-xl font-black shadow-sm transition-all duration-150 select-none ${state}`}
                                    >
                                        {opt.romaji}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <AnswerFeedback
                        status={status}
                        question={question}
                        primaryBg={themeColor.bg}
                        activeFont={activeFont}
                    />
                </div>
            )}
        </div>
    );
}
