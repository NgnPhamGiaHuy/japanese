"use client";

import { useState } from "react";

import { ArrowLeft, Eye, Keyboard, Shuffle, X } from "lucide-react";

import {
    AnswerFeedback,
    gameQuizStreakColumnClassName,
    StreakComboBadge,
} from "@/features/game/components";
import { useKanaDataset, useKanaQuizSession } from "@/features/kana/hooks";
import { ScreenHeader, ScreenHeaderBackButton, ScreenHeaderRow } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { checkTypedAnswer } from "@/shared/utils";
import { useAppStore } from "@/store";

type QuizMode = "choice" | "type" | "smart";

const KanaQuizPage = () => {
    const { dataset, alphabet, themeColor } = useKanaDataset();
    const { user } = useAppStore();

    const [quizMode, setQuizMode] = useState<QuizMode>("choice");
    const [typedInput, setTypedInput] = useState("");
    const [phase, setPhase] = useState<"setup" | "playing" | "done">("setup");

    const session = useKanaQuizSession({
        dataset,
        gameMode: `kana_quiz_${alphabet}`,
        userId: user?.uid,
        displayName: user?.displayName,
    });

    const startQuiz = (mode: QuizMode) => {
        setQuizMode(mode);
        session.startQuiz();
        if (mode === "smart") session.buildSmartDeck(session.targetScore);
        session.generateQuestion(mode === "type" ? "type" : "read");
        setPhase("playing");
    };

    const handleMCAnswer = (option: { romaji: string }) => {
        if (session.status !== "idle" || !session.question) return;
        const isCorrect = option.romaji === session.question.romaji;
        const nextScore = session.score + (isCorrect ? 1 : 0);

        session.processAnswer(isCorrect, () => {
            setTypedInput("");
            if (nextScore >= session.targetScore) {
                session.finishQuiz(nextScore);
                setPhase("done");
            } else {
                session.generateQuestion(quizMode === "type" ? "type" : "read");
            }
        });
    };

    const handleTypeAnswer = () => {
        if (session.status !== "idle" || !session.question) return;
        const isCorrect = checkTypedAnswer(typedInput, session.question.romaji);
        const nextScore = session.score + (isCorrect ? 1 : 0);

        session.processAnswer(isCorrect, () => {
            setTypedInput("");
            if (nextScore >= session.targetScore) {
                session.finishQuiz(nextScore);
                setPhase("done");
            } else {
                session.generateQuestion("type");
            }
        });
    };

    // ---- SETUP ----
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
                            <Button
                                id="quiz-mode-choice"
                                variant="ghost"
                                onClick={() => startQuiz("choice")}
                                className="!flex !w-full !items-center !justify-start !rounded-2xl !border-2 !border-b-4 !border-gray-200 !bg-white !p-5 !text-left shadow-none transition-all hover:!-translate-y-1 hover:shadow-md hover:shadow-none active:translate-y-0"
                            >
                                <div className="mr-4 rounded-xl bg-[#faeaff] p-3">
                                    <Eye size={24} className="text-[#ce82ff]" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="text-lg font-black text-[#3c3c3c]">
                                        Multiple Choice
                                    </div>
                                    <div className="text-sm font-bold text-[#afafaf]">
                                        Choose from 4 options
                                    </div>
                                </div>
                            </Button>
                            <Button
                                id="quiz-mode-type"
                                variant="ghost"
                                onClick={() => startQuiz("type")}
                                className="!flex !w-full !items-center !justify-start !rounded-2xl !border-2 !border-b-4 !border-gray-200 !bg-white !p-5 !text-left shadow-none transition-all hover:!-translate-y-1 hover:shadow-md hover:shadow-none active:translate-y-0"
                            >
                                <div className="mr-4 rounded-xl bg-[#e5f5ff] p-3">
                                    <Keyboard size={24} className="text-[#1cb0f6]" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="text-lg font-black text-[#3c3c3c]">
                                        Type the Romaji
                                    </div>
                                    <div className="text-sm font-bold text-[#afafaf]">
                                        Type the romanization
                                    </div>
                                </div>
                            </Button>
                            <Button
                                id="quiz-mode-smart"
                                variant="ghost"
                                onClick={() => startQuiz("smart")}
                                className="!flex !w-full !items-center !justify-start !rounded-2xl !border-2 !border-b-4 !border-gray-200 !bg-white !p-5 !text-left shadow-none transition-all hover:!-translate-y-1 hover:shadow-md hover:shadow-none active:translate-y-0"
                            >
                                <div className="mr-4 rounded-xl bg-[#fff5e6] p-3">
                                    <Shuffle size={24} className="text-[#ff9600]" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="text-lg font-black text-[#3c3c3c]">
                                        Smart Review
                                    </div>
                                    <div className="text-sm font-bold text-[#afafaf]">
                                        Focus on your weakest characters
                                    </div>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---- DONE ----
    if (phase === "done") {
        const isPerfect = session.score >= session.targetScore;
        return (
            <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]">
                <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8">
                    <div
                        className={`mb-4 flex h-20 w-20 -rotate-6 items-center justify-center rounded-[1.75rem] border-b-8 text-4xl font-medium text-white shadow-sm ${themeColor.bg}`}
                        style={{ borderColor: themeColor.border }}
                    >
                        {isPerfect ? "🏆" : "✓"}
                    </div>
                    <h2 className="mb-1 text-4xl font-black text-[#3c3c3c]">
                        {isPerfect ? "Perfect!" : "Done!"}
                    </h2>
                    <p className="mb-1 text-xl font-bold text-[#afafaf]">
                        Score:{" "}
                        <span className={`mx-1 text-3xl font-black ${themeColor.text}`}>
                            {session.score}
                        </span>
                        <span className="text-base text-[#afafaf]">/ {session.targetScore}</span>
                    </p>
                    <p className="mb-6 text-sm font-bold text-[#afafaf]">
                        {isPerfect ? "You answered all questions correctly!" : "Keep practising!"}
                    </p>

                    <div className="mb-6 w-full space-y-3">
                        <Button
                            alphabet={alphabet}
                            onClick={() => startQuiz(quizMode)}
                            className="w-full py-5 text-xl"
                        >
                            Play Again
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPhase("setup")}
                            className="w-full py-4 text-lg"
                        >
                            Change Mode
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ---- PLAYING ----
    const { question, questionType, options, status, score, streak } = session;

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
                            width: `${Math.min((score / session.targetScore) * 100, 100)}%`,
                        }}
                    />
                </div>
                <div className={gameQuizStreakColumnClassName}>
                    <StreakComboBadge streak={streak} variant="compact" showMultiplier={false} />
                    <span
                        className={`text-[10px] font-black tabular-nums md:text-sm ${themeColor.text}`}
                    >
                        {score}/{session.targetScore}
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
                                        state =
                                            "bg-white border-gray-200 text-gray-300 opacity-50";
                                }
                                return (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        onClick={() => handleMCAnswer(opt)}
                                        disabled={status !== "idle"}
                                        className={`!h-[72px] !rounded-2xl !border-2 !border-b-4 !text-xl !font-black shadow-none transition-all duration-150 select-none hover:shadow-none active:translate-y-0 ${state}`}
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
};

export default KanaQuizPage;
