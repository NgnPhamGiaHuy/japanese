/**
 * SpeedGame — Feature Root Component
 *
 * @remarks
 * Orchestrates speed quiz lifecycle using GameEngine architecture.
 * Composes phase-specific views and connects hooks to UI.
 * Supports both personal and shared decks via FlashcardData abstraction.
 */

"use client";

import { useRouter } from "next/navigation";

import { useFlashcardGameBestScore } from "@/features/flashcard/core/hooks";
import { scoreToTier, TIER_INFO } from "@/features/game/logic";
import { useUserProgress } from "@/features/user/hooks";
import { useAppStore } from "@/store";
import SpeedIntro from "./SpeedIntro";
import SpeedPlaying from "./SpeedPlaying";
import SpeedResults from "./SpeedResults";
import { useSpeedModeSession } from "../hooks";

import type { FlashcardData } from "@/features/flashcard/core/loaders";

interface SpeedGameProps {
    data: FlashcardData;
}

/**
 * Speed Quiz Feature Root
 *
 * @remarks
 * Pure composition — delegates all logic to hooks and child components.
 * Uses existing useSpeedModeSession which already wraps GameEngine.
 * Works with both personal and shared decks via unified FlashcardData.
 */
const SpeedGame = ({ data }: SpeedGameProps) => {
    const router = useRouter();
    const { user } = useAppStore();
    const { addXP } = useUserProgress();

    const gameMode = data.gameMode("speed");
    const bestScore = useFlashcardGameBestScore(user?.uid, gameMode);

    const isSharedContext = data.source.type === "shared";
    const shareId = isSharedContext
        ? (data.source as { type: "shared"; shareId: string }).shareId
        : undefined;
    const sourceUserId = isSharedContext ? (data.lesson.ownerId ?? undefined) : undefined;
    const sourceLessonId = isSharedContext ? data.lesson.id : undefined;

    const game = useSpeedModeSession({
        allCards: data.cards,
        lessonExists: true,
        gameMode,
        bestScore,
        userId: user?.uid,
        displayName: user?.displayName,
        addXP,
        isSharedContext,
        shareId,
        sourceUserId,
        sourceLessonId,
    });

    const tier = scoreToTier(bestScore);
    const tierInfo = TIER_INFO[tier];

    if (game.phase === "intro") {
        return (
            <SpeedIntro
                bestScore={bestScore}
                tierInfo={tierInfo}
                onBack={() => router.back()}
                onStart={game.startGame}
            />
        );
    }

    if (game.phase === "results") {
        const finalTierInfo = TIER_INFO[scoreToTier(game.score)];

        return (
            <SpeedResults
                score={game.score}
                bestScore={bestScore}
                correctCount={game.correctCount}
                totalQuestions={game.ui.totalQuestions}
                maxStreak={game.maxStreak}
                tierInfo={finalTierInfo}
                gameMode={gameMode}
                currentUserId={user?.uid}
                onPlayAgain={game.resetToIntro}
                onCollectXP={() => router.push(data.returnPath)}
            />
        );
    }

    if (!game.currentCard) return null;

    return (
        <SpeedPlaying
            gameMode={gameMode}
            currentUserId={user?.uid}
            currentUserName={user?.displayName ?? "You"}
            score={game.score}
            questionIndex={game.questionIndex}
            timerFraction={game.timerFraction}
            answerStatus={game.answerStatus}
            selectedOption={game.selectedOption}
            currentCard={game.currentCard}
            currentQuestion={game.currentQuestion}
            options={game.options}
            difficultyConfig={game.difficultyConfig}
            ui={game.ui}
            onBack={() => {
                game.closeSession();
                router.back();
            }}
            onAnswer={game.handleAnswer}
        />
    );
};

export default SpeedGame;
