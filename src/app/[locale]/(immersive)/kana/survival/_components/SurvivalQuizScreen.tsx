"use client";

import { useTranslations } from "next-intl";

import { X } from "lucide-react";

import { GameStreakScoreStack, LivesDisplay, MiniLeaderboard } from "@/features/game/components";
import { AnswerFeedback, KanaMCOptionsGrid } from "@/features/kana/components";
import { useSurvivalGame } from "@/features/kana/hooks";
import { ScreenHeaderBackButton, ScreenHeaderRow } from "@/shared/components/layout";
import { formatTime } from "@/shared/utils";

interface SurvivalQuizScreenProps {
    game: ReturnType<typeof useSurvivalGame>;
    userId?: string;
}

/** Playing screen for the Infinity and Time Attack challenge modes (multiple-choice romaji). */
const SurvivalQuizScreen = ({ game, userId }: SurvivalQuizScreenProps) => {
    const t = useTranslations("Survival");
    const { question, questionType, options, status } = game.engine;

    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col">
            <MiniLeaderboard
                gameMode={game.activeModeKey}
                currentUserId={userId}
                currentUserName={game.localName}
                currentScore={game.engine.score}
            />
            <ScreenHeaderRow className="shrink-0" symmetricSidebars>
                <ScreenHeaderBackButton
                    onClick={() => game.setPhase("setup")}
                    icon={X}
                    aria-label={t("backToMenu")}
                />
                {game.challengeMode === "time" ? (
                    <div className="flex w-full max-w-[min(100%,16rem)] flex-col items-center gap-1.5 md:max-w-xs">
                        <div
                            className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200/90"
                            role="progressbar"
                            aria-valuenow={game.timeLeft}
                            aria-valuemin={0}
                            aria-valuemax={Math.max(game.timeAttackPeak, 1)}
                            aria-label={t("timeRemaining")}
                        >
                            <div
                                className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${game.timeLeft <= 10 ? "bg-danger" : "bg-survival"}`}
                                style={{
                                    width: `${Math.min(100, (game.timeLeft / Math.max(game.timeAttackPeak, 1)) * 100)}%`,
                                }}
                            />
                        </div>
                        <p className="text-muted text-xs font-bold tracking-wide uppercase md:text-xs">
                            {t("streakAddsTime")}
                        </p>
                    </div>
                ) : (
                    <LivesDisplay lives={game.lives} />
                )}
                <GameStreakScoreStack
                    startSlot={
                        game.challengeMode === "time" ? (
                            <span
                                className={`block w-full text-right text-sm font-semibold tracking-tight tabular-nums md:text-lg lg:text-xl ${game.timeLeft <= 5 ? "text-danger animate-pulse" : "text-survival"}`}
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
                            className={`rounded-6xl mb-4 flex h-[180px] w-full items-center justify-center border-2 border-b-8 border-gray-200 bg-white shadow-sm sm:h-[220px] ${status === "wrong" ? "animate-shake" : ""}`}
                        >
                            <span className="text-text text-[7rem] leading-none font-medium select-none sm:text-9xl">
                                {question.char}
                            </span>
                        </div>
                        <KanaMCOptionsGrid
                            options={options}
                            correctRomaji={question.romaji}
                            status={status}
                            onSelect={(opt) => game.handleAnswer(opt.romaji === question.romaji)}
                        />
                        <AnswerFeedback
                            status={status}
                            question={question}
                            questionType={questionType}
                            primaryBg="bg-survival"
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default SurvivalQuizScreen;
