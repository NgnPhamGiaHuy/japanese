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

export default function SharedMatchPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const router = useRouter();
    const { user } = useAppStore();
    const { addXP } = useUserProgress();

    const { result, status } = useSharedLesson(shareId);

    // The game mode key is scoped to this shareId — no collision with personal decks
    const gameMode = sharedMatchGameMode(shareId);
    const bestScore = useFlashcardGameBestScore(user?.uid, gameMode);

    const {
        phase,
        difficulty,
        setDifficulty,
        config,
        leftItems,
        rightItems,
        selectedLeft,
        selectedRight,
        matchedIds,
        errorLeft,
        errorRight,
        processing,
        score,
        streak,
        maxStreak,
        wrongAttempts,
        timeLeft,
        comboPopup,
        progress,
        startGame,
        selectLeft,
        selectRight,
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

    if (phase === "intro") {
        return (
            <MatchIntroView
                bestScore={bestScore}
                tierInfo={tierInfo}
                difficulty={difficulty}
                cardCount={result.cards.length}
                requiredPairs={config.pairs}
                onBack={() => router.back()}
                onStart={startGame}
                onDifficultyChange={setDifficulty}
            />
        );
    }

    if (phase === "results") {
        const finalTierInfo = TIER_INFO[scoreToTier(score)];
        return (
            <MatchResultsView
                score={score}
                bestScore={bestScore}
                matchedCount={matchedIds.size}
                totalCount={leftItems.length}
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

    return (
        <MatchPlayingView
            gameMode={gameMode}
            currentUserId={user?.uid}
            currentUserName={user?.displayName ?? "You"}
            score={score}
            streak={streak}
            timeLeft={timeLeft}
            progress={progress}
            comboPopup={comboPopup}
            leftItems={leftItems}
            rightItems={rightItems}
            matchedIds={matchedIds}
            selectedLeft={selectedLeft}
            selectedRight={selectedRight}
            errorLeft={errorLeft}
            errorRight={errorRight}
            processing={processing}
            onBack={() => {
                closeSession();
                router.back();
            }}
            onSelectLeft={selectLeft}
            onSelectRight={selectRight}
        />
    );
}
