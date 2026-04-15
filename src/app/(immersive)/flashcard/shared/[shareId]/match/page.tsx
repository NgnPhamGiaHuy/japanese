/**
 * @file SharedMatchPage
 * Game mode for SHARED flashcard decks.
 * Allows users to play the Match game on decks shared by others without importing them.
 */

"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import {
    MatchIntroView,
    MatchPlayingView,
    MatchResultsView,
} from "@/features/flashcard/components";
import {
    useFlashcardGameBestScore,
    useMatchModeSession,
    useSharedLesson,
} from "@/features/flashcard/hooks";
import { sharedMatchGameMode } from "@/features/flashcard/services";
import { scoreToTier, TIER_INFO } from "@/features/game/logic";
import { useUserProgress } from "@/features/user/hooks";
import { useAppStore } from "@/store";

/**
 * Shared Match Mode Page
 *
 * @remarks
 * Orchestrates a match session for a publicly shared deck.
 * Uses `sharedMatchGameMode` to ensure leaderboard and best score keys are unique
 * to the shared instance, preventing overlap with the user's personal decks.
 */
export default function SharedMatchPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const router = useRouter();
    const { user } = useAppStore();
    const { addXP } = useUserProgress();

    // Fetches lesson data using the share token instead of a permanent deck ID
    const { result, status } = useSharedLesson(shareId);

    /**
     * The game mode key is scoped to this shareId — no collision with personal decks.
     * This is critical for maintaining accurate per-deck leaderboards.
     */
    const gameMode = sharedMatchGameMode(shareId);
    const bestScore = useFlashcardGameBestScore(user?.uid, gameMode);

    /**
     * Managed game session state.
     * Operates on the transient 'result' cards from the shared lesson service.
     */
    const {
        phase,
        difficulty,
        setDifficulty,
        config,
        prepLoading,
        score,
        streak,
        maxStreak,
        wrongAttempts,
        timeLeft,
        timeUnlimited,
        livesLeft,
        livesTotal,
        showLives,
        pairCount,
        matchedPairs,
        comboPopup,
        progress,
        startGame,
        onCellTap,
        resetToIntro,
        closeSession,
    } = useMatchModeSession({
        cards: result?.cards ?? [],
        gameMode,
        bestScore,
        userId: user?.uid,
        displayName: user?.displayName,
        addXP,
    });

    if (status === "loading") {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#ce82ff]" />
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

    const tier = scoreToTier(bestScore);
    const tierInfo = TIER_INFO[tier];

    // Phase 1: Intro (Shared Deck Context)
    if (phase === "intro") {
        return (
            <MatchIntroView
                bestScore={bestScore}
                tierInfo={tierInfo}
                difficulty={difficulty}
                cardCount={result.cards.length}
                requiredPairs={config.pairs}
                prepLoading={prepLoading}
                onBack={() => router.back()}
                onStart={startGame}
                onDifficultyChange={setDifficulty}
            />
        );
    }

    // Phase 3: Results (Shared Leaderboard Submission)
    if (phase === "results") {
        const finalTierInfo = TIER_INFO[scoreToTier(score)];
        return (
            <MatchResultsView
                score={score}
                bestScore={bestScore}
                matchedCount={matchedPairs}
                totalCount={pairCount}
                wrongAttempts={wrongAttempts}
                maxStreak={maxStreak}
                tierInfo={finalTierInfo}
                gameMode={gameMode}
                currentUserId={user?.uid}
                onPlayAgain={resetToIntro}
                onCollectXP={() => router.push(`/flashcard/shared/${shareId}`)}
            />
        );
    }

    // Phase 2: Active Gameplay
    return (
        <MatchPlayingView
            gameMode={gameMode}
            currentUserId={user?.uid}
            currentUserName={user?.displayName ?? "You"}
            score={score}
            streak={streak}
            timeLeft={timeLeft}
            timeUnlimited={timeUnlimited}
            progress={progress}
            comboPopup={comboPopup}
            showLives={showLives}
            livesLeft={livesLeft}
            livesTotal={livesTotal}
            onBack={() => {
                closeSession();
                router.back();
            }}
            onCellTap={onCellTap}
        />
    );
}
