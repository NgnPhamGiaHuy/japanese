"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { getAudioText } from "@/features/flashcard/utils/displayEngine";
import { useGameSession } from "@/features/game/hooks/useGameSession";
import { recordGameResult } from "@/features/game/services";
import { playSfx, sequence } from "@/shared/audio";
import { GameEngine } from "../engine/core/GameEngine";

import type { FlashCard } from "@/features/flashcard/types";
import type { GameState } from "../engine/types";

interface UseGameEngineConfig {
    cards: FlashCard[];
    gameMode: string;
    userId?: string;
    displayName?: string;
    addXP: (amount: number) => Promise<void>;
}

/**
 * React adapter for the GameEngine class.
 *
 * @remarks
 * Bridges the imperative GameEngine with React's declarative model: the engine pushes state
 * changes via `onStateChange`, and this hook owns lifecycle and session persistence.
 *
 * All users (owner or shared) write to their own userProgress namespace,
 * so no isSharedContext branching is needed here.
 */
export function useGameEngine(config: UseGameEngineConfig) {
    const tCommon = useTranslations("Common");
    const engineRef = useRef<GameEngine | null>(null);
    const [state, setState] = useState<GameState | null>(null);

    // Stable refs prevent engine rebuilds on every render while keeping callbacks current.
    const addXPRef = useRef(config.addXP);
    const gameModeRef = useRef(config.gameMode);
    const userIdRef = useRef(config.userId);
    const displayNameRef = useRef(config.displayName);

    const { startSession, syncScore, endSession } = useGameSession({
        userId: config.userId ?? null,
        userName: config.displayName ?? tCommon("player"),
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
        gameModeRef.current = config.gameMode;
        userIdRef.current = config.userId;
        displayNameRef.current = config.displayName;
        syncScoreRef.current = syncScore;
        endSessionRef.current = endSession;
    });

    /**
     * Rebuilds the engine whenever cards change.
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
                        displayNameRef.current ?? tCommon("player"),
                        gameModeRef.current,
                        finalScore,
                    );
                }
            },
            onSFXPlay: (sfx) => playSfx(sfx),
            onStateChange: () => setState(engine.getState()),
        });

        engineRef.current = engine;
        setState(engine.getState());

        return () => {
            engine.destroy();
            engineRef.current = null;
        };
    }, [config.cards]);

    /**
     * Speaks the answer once the feedback cue has rung out.
     *
     * @remarks
     * The engine plays the correct/wrong cue synchronously via `onSFXPlay`. The sequencer then
     * waits out that cue's envelope before the pronunciation starts, which is what the old
     * hard-coded 250ms delay claimed to do but never did — the `correct` cue rings for ~540ms.
     *
     * `replace` policy: answering the next question mid-pronunciation abandons the previous one,
     * because feedback belongs to the question on screen.
     */
    useEffect(() => {
        const question = state?.currentQuestion;
        const status = state?.feedbackStatus;
        if (!question || !status || status === "idle") return;

        const card = config.cards.find((c) => c.id === question.cardId);
        if (!card) return;

        const cue = status === "correct" ? "correct" : "wrong";
        void sequence(
            "speed-feedback",
            [
                { waitForTail: cue },
                {
                    speak: {
                        text: getAudioText(card),
                        options: { trigger: "auto", source: "speed" },
                    },
                },
            ],
            { policy: "replace" },
        );
    }, [state?.feedbackStatus, state?.currentQuestion, config.cards]);

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
