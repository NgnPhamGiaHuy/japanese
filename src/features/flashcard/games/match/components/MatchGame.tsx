/**
 * @file MatchGame — Feature Root Component
 *
 * @remarks
 * Responsibilities:
 * - Orchestrate match game lifecycle
 * - Compose phase-specific views
 * - Connect hooks to UI
 * - Handle navigation
 *
 * Supports both personal and shared decks via FlashcardData abstraction.
 * NO game logic, NO calculations, NO direct service calls.
 */

"use client";

import { useRouter } from "next/navigation";

import { useFlashcardGameBestScore } from "@/features/flashcard/core/hooks";
import { scoreToTier, TIER_INFO } from "@/features/game/logic";
import { useUserProgress } from "@/features/user/hooks";
import { useAppStore } from "@/store";
import MatchIntro from "./MatchIntro";
import MatchPlaying from "./MatchPlaying";
import MatchResults from "./MatchResults";
import { useMatchModeSession } from "../hooks";

import type { FlashcardData } from "@/features/flashcard/core/loaders";

interface MatchGameProps {
    data: FlashcardData;
}

/**
 * Match Game Feature Root
 *
 * @remarks
 * Pure composition — delegates all logic to hooks and child components.
 * Works with both personal and shared decks via unified FlashcardData.
 */
const MatchGame = ({ data }: MatchGameProps) => {
    const router = useRouter();
    const { user } = useAppStore();
    const { addXP } = useUserProgress();

    const gameMode = data.gameMode("match");
    const bestScore = useFlashcardGameBestScore(user?.uid, gameMode);

    const isSharedContext = data.source.type === "shared";
    const shareId = isSharedContext
        ? (data.source as { type: "shared"; shareId: string }).shareId
        : undefined;
    const sourceUserId = isSharedContext ? (data.lesson.ownerId ?? undefined) : undefined;
    const sourceLessonId = isSharedContext ? data.lesson.id : undefined;

    const game = useMatchModeSession({
        cards: data.cards,
        gameMode,
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

    // ── Phase: Intro ───────────────────────────────────────────────────────
    if (game.phase === "intro") {
        return (
            <MatchIntro
                bestScore={bestScore}
                tierInfo={tierInfo}
                difficulty={game.difficulty}
                cardCount={data.cards.length}
                requiredPairs={game.config.pairs}
                prepLoading={game.prepLoading}
                onBack={() => router.back()}
                onStart={game.startGame}
                onDifficultyChange={game.setDifficulty}
            />
        );
    }

    // ── Phase: Results ─────────────────────────────────────────────────────
    if (game.phase === "results") {
        const finalTierInfo = TIER_INFO[scoreToTier(game.score)];

        return (
            <MatchResults
                score={game.score}
                bestScore={bestScore}
                matchedCount={game.matchedPairs}
                totalCount={game.pairCount}
                wrongAttempts={game.wrongAttempts}
                maxStreak={game.maxStreak}
                tierInfo={finalTierInfo}
                gameMode={gameMode}
                currentUserId={user?.uid}
                onPlayAgain={game.resetToIntro}
                onCollectXP={() => router.push(data.returnPath)}
            />
        );
    }

    // ── Phase: Playing ─────────────────────────────────────────────────────
    return (
        <MatchPlaying
            gameMode={gameMode}
            currentUserId={user?.uid}
            currentUserName={user?.displayName ?? "You"}
            score={game.score}
            streak={game.streak}
            timeLeft={game.timeLeft}
            timeUnlimited={game.timeUnlimited}
            progress={game.progress}
            comboPopup={game.comboPopup}
            showLives={game.showLives}
            livesLeft={game.livesLeft}
            livesTotal={game.livesTotal}
            onBack={() => {
                game.closeSession();
                router.back();
            }}
            onCellTap={game.onCellTap}
        />
    );
};

export default MatchGame;
