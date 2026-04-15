/**
 * @file SpeedQuizPage
 * High-speed multiple-choice quiz mode for personal flashcard decks.
 * Challenges users to recall meanings under a strict time limit.
 */

"use client";

import { notFound, useRouter } from "next/navigation";
import { use } from "react";

import { Zap } from "lucide-react";

import {
    SpeedIntroView,
    SpeedPlayingView,
    SpeedResultsView,
} from "@/features/flashcard/components";
import {
    useCards,
    useFlashcardGameBestScore,
    useLessons,
    useSpeedModeSession,
} from "@/features/flashcard/hooks";
import { scoreToTier, TIER_INFO } from "@/features/game/logic";
import { speedGameMode } from "@/features/game/modes";
import { useUserProgress } from "@/features/user/hooks";
import { Button } from "@/shared/components/ui";
import { useAppStore } from "@/store";

/**
 * Speed Quiz Page Component
 *
 * @remarks
 * Manages a speed-based quiz session. Requires at least 4 cards to generate meaningful
 * multiple-choice options. Handles real-time timer synchronization and streak-based scoring.
 */
export default function SpeedQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { lessons, loading: lessonsLoading } = useLessons();
    const { cards: allCards, loading: cardsLoading } = useCards(id);
    const { addXP } = useUserProgress();
    const { user } = useAppStore();
    const router = useRouter();

    const lesson = lessons.find((l) => l.id === id);
    const gameMode = speedGameMode(id);
    const bestScore = useFlashcardGameBestScore(user?.uid, gameMode);

    /**
     * Managed game session state.
     * Orchestrates card randomization, option generation, and timer logic.
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
        currentQuestion,
        options,
        difficultyConfig,
        ui,
        startGame,
        handleAnswer,
        resetToIntro,
        closeSession,
    } = useSpeedModeSession({
        allCards,
        lessonExists: Boolean(lesson) && !cardsLoading,
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
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff9600]" />
            </div>
        );
    }
    if (!lesson) return notFound();

    /**
     * Constraint Check: Multiple choice requires at least 4 unique cards
     * to provide 1 correct answer and 3 distinct distractors.
     */
    if (allCards.length < 4) {
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

    // Phase 1: Game Introduction (Best score, Instructions)
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

    // Phase 3: Results (Final score, Metrics, Collection)
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
                onCollectXP={() => router.push(`/flashcard/${id}`)}
            />
        );
    }

    if (!currentCard) return null;

    // Phase 2: Active Gameplay (Speed Quiz)
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
            currentQuestion={currentQuestion}
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
