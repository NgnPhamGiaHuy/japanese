"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, X, Keyboard, Eye, Shuffle } from "lucide-react";
import { KanaAppShell } from "@/features/kana/components";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { useQuizEngine } from "@/features/kana/hooks/useQuizEngine";
import { useAppStore } from "@/store/useAppStore";
import { AnswerFeedback } from "@/features/game/components";
import { Button } from "@/shared/components/ui";
import { PRINT_FONT, HANDWRITING_FONT } from "@/shared/constants/fonts";
import { checkTypedAnswer } from "@/shared/utils/romaji";

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
            <KanaAppShell>
                <div className="flex flex-col h-full min-h-0 items-center justify-start overflow-y-auto hide-scrollbar py-4 md:py-6 px-4 sm:px-6">
                    <div className="w-full max-w-md">
                    <Link
                        href="/kana"
                        className="flex items-center gap-2 text-[#afafaf] font-bold text-sm mb-6 md:mb-8 hover:text-[#3c3c3c]"
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} /> Back
                    </Link>
                    <div
                        className={`w-16 h-16 md:w-20 md:h-20 ${themeColor.bg} text-white rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl font-medium mb-4 md:mb-6 shadow-sm border-b-4 md:border-b-8 shrink-0 -rotate-6`}
                        style={{ borderColor: themeColor.border }}
                    >
                        {alphabet === "both"
                            ? "あ"
                            : alphabet === "hiragana"
                              ? "あ"
                              : "ア"}
                    </div>
                    <h1 className="text-3xl font-black text-[#3c3c3c] mb-2">
                        Recall Quiz
                    </h1>
                    <p className="text-[#afafaf] font-bold mb-8">
                        How well do you know your kana?
                    </p>
                    <div className="space-y-3">
                        <button
                            id="quiz-mode-choice"
                            onClick={() => startQuiz("choice")}
                            className="w-full flex items-center p-5 rounded-2xl bg-white border-2 border-b-4 border-gray-200 text-left hover:-translate-y-1 hover:shadow-md transition-all group"
                        >
                            <div className="p-3 bg-[#faeaff] rounded-xl mr-4">
                                <Eye size={24} className="text-[#ce82ff]" />
                            </div>
                            <div>
                                <div className="font-black text-[#3c3c3c] text-lg">
                                    Multiple Choice
                                </div>
                                <div className="text-[#afafaf] text-sm font-bold">
                                    Choose from 4 options
                                </div>
                            </div>
                        </button>
                        <button
                            id="quiz-mode-type"
                            onClick={() => startQuiz("type")}
                            className="w-full flex items-center p-5 rounded-2xl bg-white border-2 border-b-4 border-gray-200 text-left hover:-translate-y-1 hover:shadow-md transition-all"
                        >
                            <div className="p-3 bg-[#e5f5ff] rounded-xl mr-4">
                                <Keyboard
                                    size={24}
                                    className="text-[#1cb0f6]"
                                />
                            </div>
                            <div>
                                <div className="font-black text-[#3c3c3c] text-lg">
                                    Type the Romaji
                                </div>
                                <div className="text-[#afafaf] text-sm font-bold">
                                    Type the romanization
                                </div>
                            </div>
                        </button>
                        <button
                            id="quiz-mode-smart"
                            onClick={() => startQuiz("smart")}
                            className="w-full flex items-center p-5 rounded-2xl bg-white border-2 border-b-4 border-gray-200 text-left hover:-translate-y-1 hover:shadow-md transition-all"
                        >
                            <div className="p-3 bg-[#fff5e6] rounded-xl mr-4">
                                <Shuffle size={24} className="text-[#ff9600]" />
                            </div>
                            <div>
                                <div className="font-black text-[#3c3c3c] text-lg">
                                    Smart Review
                                </div>
                                <div className="text-[#afafaf] text-sm font-bold">
                                    Focus on your weakest characters
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
                </div>
            </KanaAppShell>
        );
    }

    const { question, options, status, score, streak } = engine;

    return (
        <KanaAppShell>
            <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
                <header className="w-full flex items-center justify-between gap-2 sm:gap-4 mb-2 md:mb-6 px-2 sm:px-4 pt-2 sm:pt-4 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => setPhase("setup")}
                        icon={quizMode === "type" ? ArrowLeft : X}
                        className="px-2 md:px-3 py-1.5 md:py-2 shrink-0"
                    />
                    <div className="flex-1 h-2.5 md:h-4 bg-gray-200 rounded-full overflow-hidden min-w-0">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${themeColor.bg}`}
                            style={{
                                width: `${Math.min((score / 20) * 100, 100)}%`,
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        {streak >= 3 && (
                            <span className="text-[#ff9600] font-black text-[10px] md:text-sm animate-bounce">
                                🔥{streak}
                            </span>
                        )}
                        <span
                            className={`font-black text-[10px] md:text-sm ${themeColor.text}`}
                        >
                            {score}/20
                        </span>
                    </div>
                </header>

                {question && (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-md mx-auto min-h-0 overflow-y-auto hide-scrollbar">
                    <div
                        className={`w-full bg-white rounded-[3rem] border-2 border-b-8 border-gray-200 shadow-sm flex flex-col items-center justify-center py-8 px-4 mb-4 h-[200px] sm:h-[240px] ${status === "wrong" ? "animate-shake" : ""}`}
                    >
                        <span
                            style={{ fontFamily: activeFont }}
                            className="text-[7rem] sm:text-[8rem] font-medium text-[#3c3c3c] leading-none select-none"
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
                                className="w-full border-2 border-b-4 border-gray-200 rounded-2xl px-6 py-4 text-2xl font-black text-[#3c3c3c] outline-none focus:border-[#1cb0f6] transition-colors bg-white"
                                placeholder="Type romaji"
                                value={typedInput}
                                onChange={(e) => setTypedInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleTypeAnswer()
                                }
                                disabled={status !== "idle"}
                            />
                            <Button
                                alphabet={alphabet}
                                onClick={handleTypeAnswer}
                                disabled={status !== "idle"}
                                className="w-full text-xl py-4"
                            >
                                Check
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 w-full">
                            {options.map((opt, i) => {
                                let state =
                                    "bg-white text-[#3c3c3c] border-gray-200 hover:bg-gray-50 hover:-translate-y-1 hover:shadow-md hover:border-gray-300";
                                if (status !== "idle") {
                                    if (opt.romaji === question.romaji)
                                        state =
                                            "bg-[#58cc02] text-white border-[#58a700] translate-y-[2px] border-b-2";
                                    else
                                        state =
                                            "bg-white border-gray-200 text-gray-300 opacity-50";
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleMCAnswer(opt)}
                                        disabled={status !== "idle"}
                                        className={`h-[72px] border-2 border-b-4 rounded-2xl transition-all duration-150 select-none font-black text-xl shadow-sm ${state}`}
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
        </KanaAppShell>
    );
}
