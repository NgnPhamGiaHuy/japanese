"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ArrowLeft, Eye, Keyboard, Shuffle, X } from "lucide-react";

import {
    AnswerFeedback,
    gameQuizStreakColumnClassName,
    Leaderboard,
    MiniLeaderboard,
    StreakComboBadge,
} from "@/features/game/components";
import { useGameSession } from "@/features/game/hooks";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { useQuizEngine } from "@/features/kana/hooks/useQuizEngine";
import { ScreenHeader, ScreenHeaderBackButton, ScreenHeaderRow } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { HANDWRITING_FONT, PRINT_FONT } from "@/shared/constants/fonts";
import { checkTypedAnswer } from "@/shared/utils/romaji";
import { useAppStore } from "@/store/useAppStore";

type QuizMode = "choice" | "type" | "smart";

const TARGET_SCORE = 20;

const KanaQuizPage = () => {
    const { dataset, alphabet, themeColor } = useKanaDataset();
    const { useHandwriting, user } = useAppStore();
    const activeFont = useHandwriting ? HANDWRITING_FONT : PRINT_FONT;

    const [quizMode, setQuizMode] = useState<QuizMode>("choice");
    const [typedInput, setTypedInput] = useState("");
    const [phase, setPhase] = useState<"setup" | "playing" | "done">("setup");
    const [lbMode, setLbMode] = useState<QuizMode>("choice");

    const engine = useQuizEngine(dataset);

    // Prevent double-saving if somehow the effect fires twice
    const savedRef = useRef(false);

    const gameModeKey = `quiz_${quizMode}_${alphabet}`;

    const { startSession, syncScore, endSession } = useGameSession({
        userId: user?.uid ?? null,
        userName: user?.displayName ?? "Player",
        gameMode: gameModeKey,
        currentBest: 0,
    });

    const saveQuizScore = useCallback(
        (finalScore: number) => {
            if (!user || savedRef.current || finalScore <= 0) return;
            savedRef.current = true;
            endSession(finalScore);
        },
        [user, endSession],
    );

    // Sync live score to Firebase while playing
    useEffect(() => {
        if (phase === "playing") {
            syncScore(engine.score);
        }
    }, [engine.score, phase, syncScore]);

    const startQuiz = (mode: QuizMode) => {
        setQuizMode(mode);
        savedRef.current = false;
        engine.resetEngine();
        if (mode === "smart") engine.buildSmartDeck(TARGET_SCORE);
        engine.generateQuestion(mode === "type" ? "type" : "read");
        setPhase("playing");
        startSession();
    };

    const handleMCAnswer = (option: { romaji: string }) => {
        if (engine.status !== "idle" || !engine.question) return;
        const isCorrect = option.romaji === engine.question.romaji;
        const nextScore = engine.score + (isCorrect ? 1 : 0);

        engine.processAnswer(isCorrect, () => {
            setTypedInput("");
            if (nextScore >= TARGET_SCORE) {
                setPhase("done");
                saveQuizScore(nextScore);
            } else {
                engine.generateQuestion(quizMode === "type" ? "type" : "read");
            }
        });
    };

    const handleTypeAnswer = () => {
        if (engine.status !== "idle" || !engine.question) return;
        const isCorrect = checkTypedAnswer(typedInput, engine.question.romaji);
        const nextScore = engine.score + (isCorrect ? 1 : 0);

        engine.processAnswer(isCorrect, () => {
            setTypedInput("");
            if (nextScore >= TARGET_SCORE) {
                setPhase("done");
                saveQuizScore(nextScore);
            } else {
                engine.generateQuestion("type");
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

                        <div className="mt-8">
                            <div className="mb-4 flex rounded-xl bg-gray-200/70 p-1">
                                {(["choice", "type", "smart"] as const).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setLbMode(m)}
                                        className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                                            lbMode === m
                                                ? "bg-white text-[#3c3c3c] shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {m === "choice"
                                            ? "Multiple Choice"
                                            : m === "type"
                                              ? "Type"
                                              : "Smart"}
                                    </button>
                                ))}
                            </div>
                            <Leaderboard
                                gameMode={`quiz_${lbMode}_${alphabet}`}
                                currentUserId={user?.uid}
                                accentColor={themeColor.primary}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---- DONE ----
    if (phase === "done") {
        const isPerfect = engine.score >= TARGET_SCORE;
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
                            {engine.score}
                        </span>
                        <span className="text-base text-[#afafaf]">/ {TARGET_SCORE}</span>
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

                    <Leaderboard
                        gameMode={gameModeKey}
                        currentUserId={user?.uid}
                        accentColor={themeColor.primary}
                    />
                </div>
            </div>
        );
    }

    // ---- PLAYING ----
    const { question, questionType, options, status, score, streak } = engine;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <MiniLeaderboard
                gameMode={gameModeKey}
                currentUserId={user?.uid}
                currentUserName={user?.displayName || "Player"}
                currentScore={score}
            />
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
                            width: `${Math.min((score / TARGET_SCORE) * 100, 100)}%`,
                        }}
                    />
                </div>
                <div className={gameQuizStreakColumnClassName}>
                    <StreakComboBadge streak={streak} variant="compact" showMultiplier={false} />
                    <span
                        className={`text-[10px] font-black tabular-nums md:text-sm ${themeColor.text}`}
                    >
                        {score}/{TARGET_SCORE}
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
                        questionType={questionType}
                        primaryBg={themeColor.bg}
                        activeFont={activeFont}
                    />
                </div>
            )}
        </div>
    );
};

export default KanaQuizPage;
