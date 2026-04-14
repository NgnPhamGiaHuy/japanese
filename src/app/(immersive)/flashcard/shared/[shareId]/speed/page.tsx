/**
 * @file SharedSpeedPage
 * High-speed multiple-choice quiz mode for SHARED flashcard decks.
 */

"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { Zap } from "lucide-react";

import {
    SpeedIntroView,
    SpeedPlayingView,
    SpeedResultsView,
} from "@/features/flashcard/components";
import {
    useFlashcardGameBestScore,
    useSharedLesson,
    useSpeedModeSession,
} from "@/features/flashcard/hooks";
import { sharedSpeedGameMode } from "@/features/flashcard/services";
import { scoreToTier, TIER_INFO } from "@/features/game/logic";
import { useUserProgress } from "@/features/user/hooks";
import { Button } from "@/shared/components/ui";
import { useAppStore } from "@/store";

/**
 * Shared Speed Mode Page
 *
 * @remarks
 * Manages a speed quiz session for a publicly shared deck.
 * Requires at least 4 cards. Scoring is tracked against a deck-specific 'shareId' mode
 * to allow global ranking among users who access the same link.
 */
export default function SharedSpeedPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const router = useRouter();
    const { user } = useAppStore();
    const { addXP } = useUserProgress();

    // Fetches lesson data using the share token
    const { result, status } = useSharedLesson(shareId);

    const gameMode = sharedSpeedGameMode(shareId);
    const bestScore = useFlashcardGameBestScore(user?.uid, gameMode);

    /**
     * Managed game session state.
     * Handles timer-based multiple choice logic on transient shared cards.
     */
    const {
        phase,
        questionIndex,
        score,
        streak,
        maxStreak,
        correctCount,
        answerStatus,
        selectedOption,
        timerFraction,
        currentCard,
        options,
        difficultyConfig,
        ui,
        startGame,
        handleAnswer,
        resetToIntro,
        closeSession,
    } = useSpeedModeSession({
        allCards: result?.cards ?? [],
        lessonExists: status === "ready",
        gameMode,
        bestScore,
        userId: user?.uid,
        displayName: user?.displayName,
        addXP,
    });

    if (status === "loading") {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff9600]" />
            </div>
        );
    }

    if (status !== "ready" || !result) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <h1 className="mb-4 text-2xl font-black text-[#3c3c3c]">Deck Not Found</h1>
                <button onClick={() => router.back()} className="font-bold text-[#1cb0f6]">
                    Go Back
                </button>
            </div>
        );
    }

    const { cards } = result;

    /**
     * Shared deck validation:
     * Ensure the shared deck has enough content for the speed mode generation.
     */
    if (cards.length < 4) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <Zap size={48} className="mb-4 text-[#ff9600]" strokeWidth={3} />
                <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">Need more cards</h2>
                <p className="mb-8 font-bold text-[#afafaf]">
                    Speed mode needs at least 4 cards to generate answer choices.
                </p>
                <Button onClick={() => router.back()} variant="secondary">
                    Go Back
                </Button>
            </div>
        );
    }

    const tier = scoreToTier(bestScore);
    const tierInfo = TIER_INFO[tier];

    // Phase 1: Intro
    if (phase === "intro") {
        return (
            <SpeedIntroView
                bestScore={bestScore}
                tierInfo={tierInfo}
                onBack={() => router.back()}
                onStart={startGame}
            />
        );
    }

    // Phase 3: Results
    if (phase === "results") {
        const finalTierInfo = TIER_INFO[scoreToTier(score)];
        return (
            <SpeedResultsView
                score={score}
                bestScore={bestScore}
                correctCount={correctCount}
                maxStreak={maxStreak}
                tierInfo={finalTierInfo}
                gameMode={gameMode}
                currentUserId={user?.uid}
                onPlayAgain={resetToIntro}
                onCollectXP={() => router.push(`/flashcard/shared/${shareId}`)}
            />
        );
    }

    if (!currentCard) return null;

    // Phase 2: Play
    return (
        <SpeedPlayingView
            gameMode={gameMode}
            currentUserId={user?.uid}
            currentUserName={user?.displayName ?? "You"}
            score={score}
            questionIndex={questionIndex}
            timerFraction={timerFraction}
            answerStatus={answerStatus}
            selectedOption={selectedOption}
            currentCard={currentCard}
            options={options}
            difficultyConfig={difficultyConfig}
            ui={ui}
            onBack={() => {
                closeSession();
                router.back();
            }}
            onAnswer={handleAnswer}
        />
    );
}
