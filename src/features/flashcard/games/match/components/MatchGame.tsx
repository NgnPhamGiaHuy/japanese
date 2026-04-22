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
import { useEffect, useRef } from "react";

import { useFlashcardGameBestScore } from "@/features/flashcard/core";
import { logMatchGameCompleted } from "@/features/flashcard/core/actions/activity-log.actions";
import { scoreToTier, TIER_INFO } from "@/features/game/logic";
import { useUserProgress } from "@/features/user/hooks";
import { useAppStore } from "@/store";
import MatchIntro from "./MatchIntro";
import MatchPlaying from "./MatchPlaying";
import MatchResults from "./MatchResults";
import { useMatchModeSession } from "../hooks";

import type { FlashcardData } from "@/features/flashcard/core";

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

    const game = useMatchModeSession({
        cards: data.cards,
        gameMode,
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
                void logMatchGameCompleted(token, user.uid, data.lesson.id, data.lesson.title, {
                    score: game.score,
                    timeMs: 0,
                    tier: finalTier,
                });
            } catch {
                // Non-blocking
            }
        })();
    }, [game.phase, game.score, user, data.lesson.id, data.lesson.title]);

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
                onCollectXP={() => router.back()}
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
