"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Clock, Flame, Sword, Trophy, X } from "lucide-react";

import {
    AnswerFeedback,
    GameStreakScoreStack,
    Leaderboard,
    LivesDisplay,
    MiniLeaderboard,
} from "@/features/game/components";
import {
    TIME_ATTACK_MAX_STREAK_BONUS_SEC,
    TIME_ATTACK_WRONG_PENALTY_SEC,
    useKanaDataset,
    useSurvivalGame,
} from "@/features/kana/hooks";
import { useBestScores } from "@/features/user/hooks";
import { ScreenHeader, ScreenHeaderBackButton, ScreenHeaderRow } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { formatTime } from "@/shared/utils";
import { useAppStore } from "@/store";

const KanaSurvivalPage = () => {
    const { dataset, alphabet } = useKanaDataset();
    const { user } = useAppStore();
    const { bestScores, saveScore } = useBestScores();

    const game = useSurvivalGame({
        dataset,
        alphabet,
        userId: user?.uid ?? null,
        userName: user?.displayName ?? "",
        onSaveScore: saveScore,
    });

    const inputRef = useRef<HTMLDivElement>(null);

    // Pre-fill leaderboard name from Google profile on first load
    useEffect(() => {
        if (user?.displayName && !game.localName) {
            game.setLocalName(user.displayName.substring(0, 10));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.displayName]);

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
                                    <Button
                                        key={mode}
                                        variant="ghost"
                                        onClick={() => game.setChallengeMode(mode)}
                                        className={`!flex !w-full !items-center !rounded-2xl !border-2 !border-b-4 !p-5 !text-left shadow-none transition-all hover:!-translate-y-0.5 hover:shadow-md hover:shadow-none active:translate-y-0 ${game.challengeMode === mode ? "!border-[#cc7800] !bg-[#ff9600] !text-white" : "!border-gray-200 !bg-white !text-[#3c3c3c]"}`}
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
                                                className={`text-sm font-bold ${game.challengeMode === mode ? "!text-white/70" : "!text-[#afafaf]"}`}
                                            >
                                                {mode === "infinity"
                                                    ? "Survive as long as possible"
                                                    : mode === "time"
                                                      ? "Streaks add time — wrong answers cost seconds"
                                                      : "Type falling characters"}
                                            </div>
                                        </div>
                                        {best ? (
                                            <span className="ml-2 text-xs font-black opacity-70">
                                                Best: {best}
                                            </span>
                                        ) : null}
                                    </Button>
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
                                        <Button
                                            key={m}
                                            variant="ghost"
                                            onClick={() => game.setTimeMinutes(m)}
                                            className={`!flex-1 !rounded-xl !border-2 !border-b-4 !py-3 !font-black shadow-none transition-all hover:shadow-none active:translate-y-0 ${game.timeMinutes === m ? "!border-[#cc7800] !bg-[#ff9600] !text-white" : "!border-gray-200 !bg-white !text-[#3c3c3c]"}`}
                                        >
                                            {m}min
                                        </Button>
                                    ))}
                                </div>

                                <p className="mt-4 text-center text-xs leading-relaxed font-bold text-[#afafaf]">
                                    Streaks add up to{" "}
                                    <span className="text-[#3c3c3c]">
                                        +{TIME_ATTACK_MAX_STREAK_BONUS_SEC}s
                                    </span>{" "}
                                    per correct — always less than a wrong answer (
                                    <span className="text-[#3c3c3c]">
                                        −{TIME_ATTACK_WRONG_PENALTY_SEC}s
                                    </span>
                                    ), so the clock eventually runs out.
                                </p>
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

                        <div className="mt-8">
                            <Leaderboard
                                gameMode={game.activeModeKey}
                                currentUserId={user?.uid}
                                accentColor="#ff9600"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---- GAME OVER ----
    if (game.phase === "gameover") {
        const finalScore =
            game.challengeMode === "drop" ? game.dropScore.current : game.engine.score;
        return (
            <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]">
                <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8">
                    <div className="mb-4 flex h-20 w-20 -rotate-6 items-center justify-center rounded-[1.75rem] border-b-8 border-[#cc7800] bg-[#ff9600] text-white shadow-sm">
                        <Trophy size={48} strokeWidth={3} />
                    </div>
                    <h2 className="mb-1 text-4xl font-black text-[#3c3c3c]">Game Over!</h2>
                    <p className="mb-1 text-xl font-bold text-[#afafaf]">
                        Final Score:{" "}
                        <span className="mx-1 text-3xl font-black text-[#ff9600]">
                            {finalScore}
                        </span>
                    </p>
                    <p className="mb-6 text-sm font-bold text-[#afafaf]">
                        Best: {bestScores[game.activeModeKey] ?? 0}
                    </p>

                    <div className="mb-6 w-full space-y-3">
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

                    <Leaderboard
                        gameMode={game.activeModeKey}
                        currentUserId={user?.uid}
                        accentColor="#ff9600"
                    />
                </div>
            </div>
        );
    }

    // ---- PLAYING — INFINITY / TIME ----
    if (game.challengeMode !== "drop") {
        const { question, questionType, options, status } = game.engine;
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
                <MiniLeaderboard
                    gameMode={game.activeModeKey}
                    currentUserId={user?.uid}
                    currentUserName={game.localName}
                    currentScore={game.engine.score}
                />
                <ScreenHeaderRow className="shrink-0" symmetricSidebars>
                    <ScreenHeaderBackButton
                        onClick={() => game.setPhase("setup")}
                        icon={X}
                        aria-label="Back to survival menu"
                    />
                    {game.challengeMode === "time" ? (
                        <div className="flex w-full max-w-[min(100%,16rem)] flex-col items-center gap-1.5 md:max-w-xs">
                            <div
                                className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200/90"
                                role="progressbar"
                                aria-valuenow={game.timeLeft}
                                aria-valuemin={0}
                                aria-valuemax={Math.max(game.timeAttackPeak, 1)}
                                aria-label="Time remaining"
                            >
                                <div
                                    className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${game.timeLeft <= 10 ? "bg-[#ea2b2b]" : "bg-[#ff9600]"}`}
                                    style={{
                                        width: `${Math.min(100, (game.timeLeft / Math.max(game.timeAttackPeak, 1)) * 100)}%`,
                                    }}
                                />
                            </div>
                            <p className="text-[10px] font-bold tracking-wide text-[#afafaf] uppercase md:text-xs">
                                Streak adds time
                            </p>
                        </div>
                    ) : (
                        <LivesDisplay lives={game.lives} />
                    )}
                    <GameStreakScoreStack
                        startSlot={
                            game.challengeMode === "time" ? (
                                <span
                                    className={`block w-full text-right text-sm font-semibold tracking-tight tabular-nums md:text-lg lg:text-xl ${game.timeLeft <= 5 ? "animate-pulse text-[#ea2b2b]" : "text-[#ff9600]"}`}
                                >
                                    {formatTime(game.timeLeft)}
                                </span>
                            ) : undefined
                        }
                        streak={game.engine.streak}
                        score={game.engine.score}
                        lastPoints={game.lastPoints}
                        pointsAnimKey={game.pointsAnimKey}
                    />
                </ScreenHeaderRow>

                <div className="hide-scrollbar mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center overflow-y-auto p-4">
                    {question && (
                        <>
                            <div
                                className={`mb-4 flex h-[180px] w-full items-center justify-center rounded-[3rem] border-2 border-b-8 border-gray-200 bg-white shadow-sm sm:h-[220px] ${status === "wrong" ? "animate-shake" : ""}`}
                            >
                                <span className="text-[7rem] leading-none font-medium text-[#3c3c3c] select-none sm:text-[8rem]">
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
                                        <Button
                                            key={i}
                                            variant="ghost"
                                            disabled={status !== "idle"}
                                            onClick={() =>
                                                game.handleAnswer(opt.romaji === question.romaji)
                                            }
                                            className={`!h-[72px] !rounded-2xl !border-2 !border-b-4 !text-xl !font-black shadow-none transition-all duration-150 select-none hover:shadow-none active:translate-y-0 ${state}`}
                                        >
                                            {opt.romaji}
                                        </Button>
                                    );
                                })}
                            </div>
                            <AnswerFeedback
                                status={status}
                                question={question}
                                questionType={questionType}
                                primaryBg="bg-[#ff9600]"
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
            className={`fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#F7F7F8] outline-none ${game.errorFlash ? "ring-2 ring-red-500/50 ring-inset" : ""}`}
            onKeyDown={(e) => game.handleDropTyping(e.key.toLowerCase())}
            tabIndex={0}
            ref={inputRef}
        >
            <MiniLeaderboard
                gameMode={game.activeModeKey}
                currentUserId={user?.uid}
                currentUserName={game.localName}
                currentScore={game.dropScore.current}
            />
            <ScreenHeaderRow className="z-10 shrink-0" symmetricSidebars>
                <ScreenHeaderBackButton
                    onClick={() => game.setPhase("setup")}
                    icon={X}
                    aria-label="Back to survival menu"
                    className="text-[#afafaf] hover:bg-gray-100 hover:text-[#3c3c3c]"
                />
                <LivesDisplay lives={game.lives} />
                <GameStreakScoreStack
                    streak={game.dropStreak.current}
                    score={game.dropScore.current}
                    lastPoints={game.lastPoints}
                    pointsAnimKey={game.pointsAnimKey}
                    scoreClassName="text-2xl font-black tabular-nums leading-none tracking-tight text-[#ffb347] md:text-4xl lg:text-5xl"
                />
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
                                className={`text-4xl font-medium drop-shadow-sm ${isActive ? "text-[#ff9600]" : "text-[#3c3c3c]"}`}
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
            <div className="z-10 p-4 text-center text-sm font-bold text-[#afafaf]">
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
};

export default KanaSurvivalPage;
