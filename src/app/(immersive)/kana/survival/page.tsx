"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Clock, Flame, Sword, Trophy, X } from "lucide-react";

import { AnswerFeedback, LivesDisplay } from "@/features/game/components";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { useSurvivalGame } from "@/features/kana/hooks/useSurvivalGame";
import { useBestScores } from "@/features/user/hooks/useBestScores";
import { ScreenHeader, ScreenHeaderBackButton, ScreenHeaderRow } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { HANDWRITING_FONT, PRINT_FONT } from "@/shared/constants/fonts";
import { formatTime } from "@/shared/utils/time";
import { useAppStore } from "@/store/useAppStore";

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
        if (game.phase === "playing" && game.challengeMode === "drop") inputRef.current?.focus();
    }, [game.phase, game.challengeMode]);

    // ---- SETUP SCREEN ----
    if (game.phase === "setup") {
        return (
            <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]">
                <ScreenHeader title="Survival Mode" backHref="/kana" />
                <div className="flex flex-1 flex-col items-center justify-start px-4 py-6">
                    <div className="w-full max-w-md">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border-b-8 border-[#cc7800] bg-[#ff9600] text-4xl font-medium text-white shadow-sm">
                            <Flame size={40} />
                        </div>
                        <p className="mb-8 text-lg font-bold text-[#afafaf]">
                            How long can you last?
                        </p>

                        <div className="mb-8 space-y-3">
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
                                        className={`flex w-full items-center rounded-2xl border-2 border-b-4 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${game.challengeMode === mode ? "border-[#cc7800] bg-[#ff9600] text-white" : "border-gray-200 bg-white text-[#3c3c3c]"}`}
                                    >
                                        <Icon size={28} className="mr-4 shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-lg font-black capitalize">
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
                                            <span className="ml-2 text-xs font-black opacity-70">
                                                Best: {best}
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>

                        {game.challengeMode === "time" && (
                            <div className="mb-8 rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-5">
                                <p className="mb-3 text-sm font-black tracking-widest text-[#afafaf] uppercase">
                                    Timer Duration
                                </p>
                                <div className="flex gap-2">
                                    {[1, 2, 5].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => game.setTimeMinutes(m)}
                                            className={`flex-1 rounded-xl border-2 border-b-4 py-3 font-black transition-all ${game.timeMinutes === m ? "border-[#cc7800] bg-[#ff9600] text-white" : "border-gray-200 bg-white text-[#3c3c3c]"}`}
                                        >
                                            {m}min
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-8">
                            <p className="mb-2 text-sm font-black font-bold tracking-widest text-[#afafaf] uppercase">
                                Your Name (Leaderboard)
                            </p>
                            <input
                                type="text"
                                maxLength={10}
                                className="w-full rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-5 py-4 text-xl font-black text-[#3c3c3c] transition-colors outline-none focus:border-[#ff9600]"
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
            </div>
        );
    }

    // ---- GAME OVER ----
    if (game.phase === "gameover") {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-[#F7F7F8] p-6">
                <div className="mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-[2rem] border-b-8 border-[#cc7800] bg-[#ff9600] text-white shadow-sm">
                    <Trophy size={56} strokeWidth={3} />
                </div>
                <h2 className="mb-2 text-4xl font-black text-[#3c3c3c]">Game Over!</h2>
                <p className="mb-2 text-xl font-bold text-[#afafaf]">
                    Final Score:{" "}
                    <span className="mx-1 text-3xl font-black text-[#ff9600]">
                        {game.engine.score}
                    </span>
                </p>
                <p className="mb-10 text-sm font-bold text-[#afafaf]">
                    Best: {bestScores[game.activeModeKey] ?? 0}
                </p>
                <div className="w-full max-w-xs space-y-3">
                    <Button
                        variant="primary"
                        color="orange"
                        onClick={game.startGame}
                        className="w-full py-5 text-xl"
                    >
                        Play Again
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => game.setPhase("setup")}
                        className="w-full py-4 text-lg"
                    >
                        Change Mode
                    </Button>
                    <Link href="/kana">
                        <Button variant="ghost" className="w-full py-4 text-lg">
                            Back to Kana
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // ---- PLAYING — INFINITY / TIME ----
    if (game.challengeMode !== "drop") {
        const { question, options, status } = game.engine;
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
                <ScreenHeaderRow className="shrink-0">
                    <ScreenHeaderBackButton
                        onClick={() => game.setPhase("setup")}
                        icon={X}
                        aria-label="Back to survival menu"
                    />
                    <div className="flex min-w-0 flex-1 justify-center px-2">
                        <LivesDisplay lives={game.challengeMode === "infinity" ? game.lives : 3} />
                    </div>
                    <div className="flex min-w-[5rem] shrink-0 items-center justify-end gap-3">
                        {game.challengeMode === "time" && (
                            <span
                                className={`text-2xl font-black ${game.timeLeft <= 5 ? "animate-pulse text-[#ea2b2b]" : "text-[#ff9600]"}`}
                            >
                                {formatTime(game.timeLeft)}
                            </span>
                        )}
                        <span className="text-2xl font-black text-[#ff9600]">
                            {game.engine.score}
                        </span>
                    </div>
                </ScreenHeaderRow>

                <div className="hide-scrollbar mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center overflow-y-auto p-4">
                    {question && (
                        <>
                            <div
                                className={`mb-4 flex h-[180px] w-full items-center justify-center rounded-[3rem] border-2 border-b-8 border-gray-200 bg-white shadow-sm sm:h-[220px] ${status === "wrong" ? "animate-shake" : ""}`}
                            >
                                <span
                                    style={{ fontFamily: activeFont }}
                                    className="text-[7rem] leading-none font-medium text-[#3c3c3c] select-none sm:text-[8rem]"
                                >
                                    {question.char}
                                </span>
                            </div>
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
                                        <button
                                            key={i}
                                            disabled={status !== "idle"}
                                            onClick={() =>
                                                game.handleAnswer(opt.romaji === question.romaji)
                                            }
                                            className={`h-[72px] rounded-2xl border-2 border-b-4 text-xl font-black shadow-sm transition-all duration-150 select-none ${state}`}
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
        );
    }

    // ---- PLAYING — DROP MODE ----

    const state = game.dropState.current;
    const activeWord = state.words.find((w) => w.id === state.activeId);

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#0a0a1a] outline-none ${game.errorFlash ? "ring-2 ring-red-500/50 ring-inset" : ""}`}
            onKeyDown={(e) => game.handleDropTyping(e.key.toLowerCase())}
            tabIndex={0}
            ref={inputRef}
        >
            <ScreenHeaderRow variant="dark" className="z-10 shrink-0">
                <ScreenHeaderBackButton
                    onClick={() => game.setPhase("setup")}
                    icon={X}
                    aria-label="Back to survival menu"
                    className="text-white/80 hover:bg-white/10 hover:text-white"
                />
                <div className="flex min-w-0 flex-1 justify-center">
                    <LivesDisplay lives={game.lives} />
                </div>
                <div className="flex min-w-[3rem] shrink-0 items-center justify-end">
                    <span className="text-2xl font-black text-[#ff9600]">{game.engine.score}</span>
                </div>
            </ScreenHeaderRow>
            <div className="relative flex-1">
                {state.words.map((word) => {
                    const isActive = word.id === state.activeId;
                    return (
                        <div
                            key={word.id}
                            className={`absolute -translate-x-1/2 transform text-center transition-none`}
                            style={{ left: `${word.x}%`, top: `${word.y}%` }}
                        >
                            <div
                                className={`text-4xl font-medium drop-shadow-lg ${isActive ? "text-[#ff9600]" : "text-white"}`}
                                style={{ fontFamily: activeFont }}
                            >
                                {word.char}
                            </div>
                            {isActive && (
                                <div className="text-sm font-bold tracking-wider text-[#ff9600]">
                                    {word.typed}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="z-10 p-4 text-center text-sm font-bold text-white/30">
                {activeWord ? (
                    <>
                        Typing:{" "}
                        <span className="font-black text-[#ff9600]">{activeWord.typed}</span>
                    </>
                ) : (
                    "Start typing to match falling characters"
                )}
            </div>
        </div>
    );
}
