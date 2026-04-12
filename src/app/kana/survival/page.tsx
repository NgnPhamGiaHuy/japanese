"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Flame, Sword, Clock, X, Trophy } from "lucide-react";
import { KanaAppShell } from "@/features/kana/components";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { useSurvivalGame } from "@/features/kana/hooks/useSurvivalGame";
import { useBestScores } from "@/features/user/hooks/useBestScores";
import { useAppStore } from "@/store/useAppStore";
import { AnswerFeedback, LivesDisplay } from "@/features/game/components";
import { Button } from "@/shared/components/ui";
import { PRINT_FONT, HANDWRITING_FONT } from "@/shared/constants/fonts";
import { formatTime } from "@/shared/utils/time";

export default function KanaSurvivalPage() {
    const { dataset, alphabet } = useKanaDataset();
    const { useHandwriting } = useAppStore();
    const activeFont = useHandwriting ? HANDWRITING_FONT : PRINT_FONT;
    const { bestScores, saveScore } = useBestScores();

    const game = useSurvivalGame({
        dataset,
        alphabet,
        onSaveScore: saveScore,
    });

    const inputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (game.phase === "playing" && game.challengeMode === "drop")
            inputRef.current?.focus();
    }, [game.phase, game.challengeMode]);

    // ---- SETUP SCREEN ----
    if (game.phase === "setup") {
        return (
            <KanaAppShell>
                <div className="flex flex-col h-full min-h-0 items-center justify-start overflow-y-auto hide-scrollbar py-4 md:py-6 px-4 sm:px-6">
                    <div className="w-full max-w-md">
                    <Link
                        href="/kana"
                        className="flex items-center gap-2 text-[#afafaf] font-bold text-sm mb-8 hover:text-[#3c3c3c]"
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} /> Back
                    </Link>
                    <div className="w-20 h-20 bg-[#ff9600] text-white rounded-[1.5rem] flex items-center justify-center text-4xl font-medium mb-6 shadow-sm border-b-8 border-[#cc7800]">
                        <Flame size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-[#3c3c3c] mb-2">
                        Survival Mode
                    </h1>
                    <p className="text-[#afafaf] font-bold mb-8">
                        How long can you last?
                    </p>

                    <div className="space-y-3 mb-8">
                        {(["infinity", "time", "drop"] as const).map((mode) => {
                            const icons = {
                                infinity: Sword,
                                time: Clock,
                                drop: Flame,
                            };
                            const Icon = icons[mode];
                            const best = bestScores[`${mode}_${alphabet}`];
                            return (
                                <button
                                    key={mode}
                                    onClick={() => game.setChallengeMode(mode)}
                                    className={`w-full flex items-center p-5 rounded-2xl border-2 border-b-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${game.challengeMode === mode ? "bg-[#ff9600] border-[#cc7800] text-white" : "bg-white border-gray-200 text-[#3c3c3c]"}`}
                                >
                                    <Icon size={28} className="mr-4 shrink-0" />
                                    <div className="flex-1">
                                        <div className="font-black text-lg capitalize">
                                            {mode === "infinity"
                                                ? "Infinity"
                                                : mode === "time"
                                                  ? "Time Attack"
                                                  : "Drop Mode"}
                                        </div>
                                        <div
                                            className={`text-sm font-bold ${game.challengeMode === mode ? "text-white/70" : "text-[#afafaf]"}`}
                                        >
                                            {mode === "infinity"
                                                ? "Survive as long as possible"
                                                : mode === "time"
                                                  ? "Score as much as possible in time"
                                                  : "Type falling characters"}
                                        </div>
                                    </div>
                                    {best ? (
                                        <span className="text-xs font-black opacity-70 ml-2">
                                            Best: {best}
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>

                    {game.challengeMode === "time" && (
                        <div className="mb-8 bg-white p-5 rounded-2xl border-2 border-b-4 border-gray-200">
                            <p className="text-sm font-black text-[#afafaf] uppercase tracking-widest mb-3">
                                Timer Duration
                            </p>
                            <div className="flex gap-2">
                                {[1, 2, 5].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => game.setTimeMinutes(m)}
                                        className={`flex-1 py-3 rounded-xl font-black border-2 border-b-4 transition-all ${game.timeMinutes === m ? "bg-[#ff9600] border-[#cc7800] text-white" : "bg-white border-gray-200 text-[#3c3c3c]"}`}
                                    >
                                        {m}min
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-8">
                        <p className="text-sm font-black font-bold text-[#afafaf] mb-2 uppercase tracking-widest">
                            Your Name (Leaderboard)
                        </p>
                        <input
                            type="text"
                            maxLength={10}
                            className="w-full border-2 border-b-4 border-gray-200 focus:border-[#ff9600] transition-colors rounded-2xl py-4 px-5 text-xl font-black text-[#3c3c3c] outline-none bg-white"
                            placeholder="Anonymous"
                            value={game.localName}
                            onChange={(e) => game.setLocalName(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="primary"
                        color="orange"
                        onClick={game.startGame}
                        className="w-full py-5 text-2xl"
                    >
                        Start →
                    </Button>
                    </div>
                </div>
            </KanaAppShell>
        );
    }

    // ---- GAME OVER ----
    if (game.phase === "gameover") {
        return (
            <KanaAppShell>
                <div className="flex flex-col h-full min-h-0 items-center justify-center p-6 overflow-y-auto hide-scrollbar">
                <div className="w-24 h-24 bg-[#ff9600] text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border-b-8 border-[#cc7800] -rotate-6">
                    <Trophy size={56} strokeWidth={3} />
                </div>
                <h2 className="text-4xl font-black text-[#3c3c3c] mb-2">
                    Game Over!
                </h2>
                <p className="text-[#afafaf] font-bold text-xl mb-2">
                    Final Score:{" "}
                    <span className="text-[#ff9600] font-black text-3xl mx-1">
                        {game.engine.score}
                    </span>
                </p>
                <p className="text-[#afafaf] font-bold mb-10 text-sm">
                    Best: {bestScores[game.activeModeKey] ?? 0}
                </p>
                <div className="w-full max-w-xs space-y-3">
                    <Button
                        variant="primary"
                        color="orange"
                        onClick={game.startGame}
                        className="w-full text-xl py-5"
                    >
                        Play Again
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => game.setPhase("setup")}
                        className="w-full text-lg py-4"
                    >
                        Change Mode
                    </Button>
                    <Link href="/kana">
                        <Button variant="ghost" className="w-full text-lg py-4">
                            Back to Kana
                        </Button>
                    </Link>
                </div>
                </div>
            </KanaAppShell>
        );
    }

    // ---- PLAYING — INFINITY / TIME ----
    if (game.challengeMode !== "drop") {
        const { question, options, status } = game.engine;
        return (
            <KanaAppShell>
                <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
                    <header className="w-full flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 pt-2 sm:pt-4 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => game.setPhase("setup")}
                        icon={X}
                        className="px-2 md:px-3 py-1.5 md:py-2 shrink-0"
                    />
                    <div className="flex-1 flex justify-center min-w-0">
                        <LivesDisplay
                            lives={
                                game.challengeMode === "infinity"
                                    ? game.lives
                                    : 3
                            }
                        />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {game.challengeMode === "time" && (
                            <span
                                className={`font-black text-2xl ${game.timeLeft <= 5 ? "text-[#ea2b2b] animate-pulse" : "text-[#ff9600]"}`}
                            >
                                {formatTime(game.timeLeft)}
                            </span>
                        )}
                        <span className="text-[#ff9600] font-black text-2xl">
                            {game.engine.score}
                        </span>
                    </div>
                </header>

                    <div className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-md mx-auto min-h-0 overflow-y-auto hide-scrollbar">
                    {question && (
                        <>
                            <div
                                className={`w-full bg-white rounded-[3rem] border-2 border-b-8 border-gray-200 shadow-sm flex items-center justify-center h-[180px] sm:h-[220px] mb-4 ${status === "wrong" ? "animate-shake" : ""}`}
                            >
                                <span
                                    style={{ fontFamily: activeFont }}
                                    className="text-[7rem] sm:text-[8rem] font-medium text-[#3c3c3c] leading-none select-none"
                                >
                                    {question.char}
                                </span>
                            </div>
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
                                            disabled={status !== "idle"}
                                            onClick={() =>
                                                game.handleAnswer(
                                                    opt.romaji ===
                                                        question.romaji
                                                )
                                            }
                                            className={`h-[72px] border-2 border-b-4 rounded-2xl transition-all duration-150 select-none font-black text-xl shadow-sm ${state}`}
                                        >
                                            {opt.romaji}
                                        </button>
                                    );
                                })}
                            </div>
                            <AnswerFeedback
                                status={status}
                                question={question}
                                primaryBg="bg-[#ff9600]"
                                activeFont={activeFont}
                            />
                        </>
                    )}
                    </div>
                </div>
            </KanaAppShell>
        );
    }

    // ---- PLAYING — DROP MODE ----
    const state = game.dropState.current;
    const activeWord = state.words.find((w) => w.id === state.activeId);

    return (
        <KanaAppShell>
            <div
                className={`flex flex-col h-full min-h-0 flex-1 bg-[#0a0a1a] overflow-hidden outline-none ${game.errorFlash ? "ring-2 ring-red-500/50 ring-inset" : ""}`}
                onKeyDown={(e) => game.handleDropTyping(e.key.toLowerCase())}
                tabIndex={0}
                ref={inputRef}
            >
            <header className="flex items-center justify-between p-4 shrink-0 z-10">
                <Button
                    variant="ghost"
                    onClick={() => game.setPhase("setup")}
                    icon={X}
                    className="px-3 py-2 text-white hover:bg-white/10"
                />
                <LivesDisplay lives={game.lives} />
                <span className="text-[#ff9600] font-black text-2xl">
                    {game.engine.score}
                </span>
            </header>
            <div className="flex-1 relative">
                {state.words.map((word) => {
                    const isActive = word.id === state.activeId;
                    return (
                        <div
                            key={word.id}
                            className={`absolute transform -translate-x-1/2 text-center transition-none`}
                            style={{ left: `${word.x}%`, top: `${word.y}%` }}
                        >
                            <div
                                className={`text-4xl font-medium drop-shadow-lg ${isActive ? "text-[#ff9600]" : "text-white"}`}
                                style={{ fontFamily: activeFont }}
                            >
                                {word.char}
                            </div>
                            {isActive && (
                                <div className="text-[#ff9600] text-sm font-bold tracking-wider">
                                    {word.typed}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="p-4 z-10 text-center text-white/30 text-sm font-bold">
                {activeWord ? (
                    <>
                        Typing:{" "}
                        <span className="text-[#ff9600] font-black">
                            {activeWord.typed}
                        </span>
                    </>
                ) : (
                    "Start typing to match falling characters"
                )}
            </div>
            </div>
        </KanaAppShell>
    );
}
