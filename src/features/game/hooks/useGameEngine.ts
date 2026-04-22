"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { getAudioText } from "@/features/flashcard/core";
import { recordGameResult } from "@/features/game/services";
import { allowAudio, playAudio, playSFX } from "@/shared/utils";
import { useGameSession } from "./useGameSession";
import { GameEngine } from "../engine";

import type { FlashCard } from "@/features/flashcard/core";
import type { GameState, ModeStrategy } from "../engine/types";

interface UseGameEngineConfig {
    cards: FlashCard[];
    strategy: ModeStrategy;
    gameMode: string;
    bestScore: number;
    userId?: string;
    displayName?: string;
    addXP: (amount: number) => Promise<void>;
}

/**
 * React adapter for the GameEngine class.
 *
 * @remarks
 * Bridges the imperative GameEngine with React's declarative model.
 * Manages engine lifecycle, state polling, and session persistence.
 *
 * All users (owner or shared) write to their own userProgress namespace,
 * so no isSharedContext branching is needed here.
 */
export function useGameEngine(config: UseGameEngineConfig) {
    const engineRef = useRef<GameEngine | null>(null);
    const [state, setState] = useState<GameState | null>(null);

    // Stable refs prevent engine rebuilds on every render while keeping callbacks current.
    const addXPRef = useRef(config.addXP);
    const bestScoreRef = useRef(config.bestScore);
    const gameModeRef = useRef(config.gameMode);
    const userIdRef = useRef(config.userId);
    const displayNameRef = useRef(config.displayName);

    const { startSession, syncScore, endSession } = useGameSession({
        userId: config.userId ?? null,
        userName: config.displayName ?? "Player",
        gameMode: config.gameMode,
    });

    const syncScoreRef = useRef(syncScore);
    const endSessionRef = useRef(endSession);

    /**
     * Keeps all callback refs current after every render.
     *
     * @remarks
     * useLayoutEffect runs synchronously before paint, guaranteeing refs are
     * fresh before any subsequent effect or event handler reads them.
     */
    useLayoutEffect(() => {
        addXPRef.current = config.addXP;
        bestScoreRef.current = config.bestScore;
        gameModeRef.current = config.gameMode;
        userIdRef.current = config.userId;
        displayNameRef.current = config.displayName;
        syncScoreRef.current = syncScore;
        endSessionRef.current = endSession;
    });

    /**
     * Rebuilds the engine whenever cards or strategy change.
     *
     * @remarks
     * Cards arrive asynchronously (Firestore fetch). The engine must be
     * recreated once they are available so CardSelector has a non-empty pool.
     */
    useEffect(() => {
        // Wait for cards to load before building the engine.
        if (config.cards.length === 0) return;

        const engine = new GameEngine({
            cards: config.cards,
            strategy: config.strategy,
            userId: userIdRef.current,
            displayName: displayNameRef.current,
            onScoreSync: (score) => {
                syncScoreRef.current(score);
            },
            onSessionEnd: async (finalScore) => {
                await addXPRef.current(Math.round(finalScore / 10));
                await endSessionRef.current(finalScore);

                const uid = userIdRef.current;
                if (uid) {
                    await recordGameResult(
                        uid,
                        displayNameRef.current ?? "Player",
                        gameModeRef.current,
                        finalScore,
                    );
                }
            },
            onSFXPlay: (sfx) => playSFX(sfx),
        });

        engineRef.current = engine;
        setState(engine.getState());

        return () => {
            engine.destroy();
            engineRef.current = null;
        };
    }, [config.cards, config.strategy]);

    /**
     * Polls engine state every 100ms to drive React re-renders.
     *
     * @remarks
     * The engine mutates its own state synchronously (timer ticks, answer
     * evaluation). Polling at 100ms is fast enough for smooth UI updates
     * while staying well below the 80ms timer tick rate.
     */
    useEffect(() => {
        const interval = setInterval(() => {
            const current = engineRef.current?.getState();
            if (current) setState(current);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    /**
     * Plays audio feedback when answer status changes.
     *
     * @remarks
     * SFX fires inside the engine via onSFXPlay. This effect handles the
     * delayed pronunciation playback (250ms offset so the SFX is heard first).
     */
    useEffect(() => {
        const question = state?.currentQuestion;
        if (!question || state.feedbackStatus === "idle") return;

        const card = config.cards.find((c) => c.id === question.cardId);
        if (!card) return;

        if (allowAudio(config.strategy.name, "feedback")) {
            const t = setTimeout(() => playAudio(getAudioText(card)), 250);
            return () => clearTimeout(t);
        }
    }, [state?.feedbackStatus, state?.currentQuestion, config.cards, config.strategy.name]);

    const startGame = useCallback(async () => {
        await startSession();
        engineRef.current?.startGame();
    }, [startSession]);

    const submitAnswer = useCallback((answer: string) => {
        engineRef.current?.submitAnswer(answer);
    }, []);

    const reset = useCallback(() => {
        engineRef.current?.reset();
    }, []);

    return { state, startGame, submitAnswer, reset };
}
