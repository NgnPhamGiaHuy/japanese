"use client";

import { useTranslations } from "next-intl";

import { X } from "lucide-react";

import { GameStreakScoreStack, LivesDisplay, MiniLeaderboard } from "@/features/game/components";
import { useSurvivalGame } from "@/features/kana/hooks";
import { ScreenHeaderBackButton, ScreenHeaderRow } from "@/shared/components/layout";

interface SurvivalDropScreenProps {
    game: ReturnType<typeof useSurvivalGame>;
    userId?: string;
    inputRef: React.RefObject<HTMLDivElement | null>;
}

/** Playing screen for the Drop challenge mode (typing falling characters). */
const SurvivalDropScreen = ({ game, userId, inputRef }: SurvivalDropScreenProps) => {
    const t = useTranslations("Survival");
    const state = game.dropState.current;
    const activeWord = state.words.find((w) => w.id === state.activeId);

    return (
        <div
            className={`bg-bg fixed inset-0 z-50 flex flex-col overflow-hidden outline-none ${game.errorFlash ? "ring-2 ring-red-500/50 ring-inset" : ""}`}
            onKeyDown={(e) => game.handleDropTyping(e.key.toLowerCase())}
            tabIndex={0}
            ref={inputRef}
        >
            <MiniLeaderboard
                gameMode={game.activeModeKey}
                currentUserId={userId}
                currentUserName={game.localName}
                currentScore={game.dropScore}
            />
            <ScreenHeaderRow className="z-10 shrink-0" symmetricSidebars>
                <ScreenHeaderBackButton
                    onClick={() => game.setPhase("setup")}
                    icon={X}
                    aria-label={t("backToMenu")}
                    className="text-muted hover:text-text hover:bg-gray-100"
                />
                <LivesDisplay lives={game.lives} />
                <GameStreakScoreStack
                    streak={game.dropStreak}
                    score={game.dropScore}
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
                                className={`text-4xl font-medium drop-shadow-sm ${isActive ? "text-survival" : "text-text"}`}
                            >
                                {word.char}
                            </div>
                            {isActive && (
                                <div className="text-survival text-sm font-bold tracking-wider">
                                    {word.typed}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="text-muted z-10 p-4 text-center text-sm font-bold">
                {activeWord ? (
                    <>
                        {t("typingPrefix")}{" "}
                        <span className="text-survival font-black">{activeWord.typed}</span>
                    </>
                ) : (
                    t("startTypingPrompt")
                )}
            </div>
        </div>
    );
};

export default SurvivalDropScreen;
