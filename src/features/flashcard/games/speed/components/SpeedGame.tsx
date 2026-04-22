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
import { useEffect, useRef } from "react";

import { logSpeedGameCompleted } from "@/features/flashcard/core/actions/activity-log.actions";
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

    const game = useSpeedModeSession({
        allCards: data.cards,
        lessonExists: true,
        gameMode,
        bestScore,
        userId: user?.uid,
        displayName: user?.displayName,
        addXP,
    });

    const tier = scoreToTier(bestScore);
    const tierInfo = TIER_INFO[tier];

    // Log when the game reaches the results phase (once per session)
    const loggedRef = useRef(false);
    useEffect(() => {
        if (game.phase !== "results" || loggedRef.current || !user) return;
        loggedRef.current = true;
        void (async () => {
            try {
                const token = await user.getIdToken();
                const finalTier = scoreToTier(game.score);
                void logSpeedGameCompleted(token, user.uid, data.lesson.id, data.lesson.title, {
                    score: game.score,
                    timeMs: 0,
                    tier: finalTier,
                });
            } catch {
                // Non-blocking
            }
        })();
    }, [game.phase, game.score, user, data.lesson.id, data.lesson.title]);

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
                onCollectXP={() => router.back()}
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
