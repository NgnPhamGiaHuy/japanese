/**
 * @file MatchModePage
 * Immersive game mode for personal flashcard decks where users match Japanese terms with meanings.
 */

"use client";

import { notFound, useRouter } from "next/navigation";
import { use } from "react";

import {
    MatchIntroView,
    MatchPlayingView,
    MatchResultsView,
} from "@/features/flashcard/components";
import {
    useCards,
    useFlashcardGameBestScore,
    useLessons,
    useMatchModeSession,
} from "@/features/flashcard/hooks";
import { scoreToTier, TIER_INFO } from "@/features/game/logic";
import { matchGameMode } from "@/features/game/modes";
import { useUserProgress } from "@/features/user/hooks";
import { useAppStore } from "@/store";

/**
 * Match Mode Page Component
 *
 * @remarks
 * Orhcestrates the match game session. It uses `useMatchModeSession` to manage
 * game state transitions (intro, playing, results), scoring, and streaks.
 * This specific version is for private/personal decks.
 */
export default function MatchModePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { lessons, loading: lessonsLoading } = useLessons();
    const { cards, loading: cardsLoading } = useCards(id);
    const { addXP } = useUserProgress();
    const { user } = useAppStore();
    const router = useRouter();

    const lesson = lessons.find((l) => l.id === id);
    const gameMode = matchGameMode(id);
    const bestScore = useFlashcardGameBestScore(user?.uid, gameMode);

    /**
     * Managed game session state.
     * Handles complex logic: pair generation, selection validation, combo popups, and timer.
     */
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
        cards,
        gameMode,
        bestScore,
        userId: user?.uid,
        displayName: user?.displayName,
        addXP,
    });

    // ── Loading / 404 ──────────────────────────────────────────────────────
    if (lessonsLoading || cardsLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#ce82ff]" />
            </div>
        );
    }
    if (!lesson) return notFound();

    const tier = scoreToTier(bestScore);
    const tierInfo = TIER_INFO[tier];

    // Phase 1: Game Introduction (Best score, Difficulty selection)
    if (phase === "intro") {
        return (
            <MatchIntroView
                bestScore={bestScore}
                tierInfo={tierInfo}
                difficulty={difficulty}
                cardCount={cards.length}
                requiredPairs={config.pairs}
                onBack={() => router.back()}
                onStart={startGame}
                onDifficultyChange={setDifficulty}
            />
        );
    }

    // Phase 3: Results (Final score, Streak analysis, Tier display)
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
                onCollectXP={() => router.push(`/flashcard/${id}`)}
            />
        );
    }

    // Phase 2: Active Gameplay (Pair matching)
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
