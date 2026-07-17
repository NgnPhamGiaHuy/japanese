/**
 * @file useMatchScoring
 * Pair-resolution, scoring, combo, and tap-handling — split out of
 * useMatchModeSession.ts (E11-T4). Owns the state a resolved pair affects
 * (score/streak/maxStreak/wrongAttempts/comboPopup); lives/session/phase
 * stay in the parent hook since resolveTwo only ever WRITES lives (via the
 * setter passed in), never reads it.
 */
"use client";

import { useTranslations } from "next-intl";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import {
    calcMatchPoints,
    comboLevel,
    WRONG_PENALTY,
} from "@/features/flashcard/games/match/config";
import { playSfx, sequence } from "@/shared/audio";
import { useMatchGameStore } from "../../../hooks";
import { gradeCard } from "../../../services/card.service";
import { getAudioText } from "../../../utils/displayEngine";

import type { FlashCard } from "../../../types";

interface UseMatchScoringParams {
    cards: FlashCard[];
    userIdRef: React.RefObject<string | undefined>;
    syncScoreRef: React.RefObject<(score: number) => void>;
    livesModeRef: React.RefObject<boolean>;
    setLivesLeft: React.Dispatch<React.SetStateAction<number>>;
}

export function useMatchScoring({
    cards,
    userIdRef,
    syncScoreRef,
    livesModeRef,
    setLivesLeft,
}: UseMatchScoringParams) {
    const t = useTranslations("MatchGame");
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [comboPopup, setComboPopup] = useState<{
        id: number;
        text: string;
        bonus: number;
    } | null>(null);

    const comboIdRef = useRef(0);
    // scoreRef mirrors score state so the end-game RAF (in the parent hook)
    // reads the latest value without needing score in its dependency array.
    const scoreRef = useRef(0);
    useLayoutEffect(() => {
        scoreRef.current = score;
    });

    const resetScoring = useCallback(() => {
        setScore(0);
        setStreak(0);
        setMaxStreak(0);
        setWrongAttempts(0);
        setComboPopup(null);
    }, []);

    /**
     * Resolves a two-tile selection against the current grid state.
     *
     * @remarks
     * Reads grid state imperatively from the Zustand store to avoid stale
     * closures — the store is the single source of truth for tile state.
     *
     * Match path: award points, update streak/combo, grade card for SRS,
     * play audio, mark pair as matched.
     *
     * Miss path: deduct points, reset streak, shake tiles, decrement lives.
     *
     * @param idA - ID of the first selected tile.
     * @param idB - ID of the second selected tile.
     */
    const resolveTwo = useCallback(
        (idA: string, idB: string) => {
            const store = useMatchGameStore.getState();
            const a = store.grid.find((c) => c.id === idA);
            const b = store.grid.find((c) => c.id === idB);

            if (!a || !b) {
                store.setProcessing(false);
                return;
            }

            const isMatch =
                !a.isDistractor && !b.isDistractor && a.pairId != null && a.pairId === b.pairId;

            if (isMatch) {
                playSfx("correct");

                setStreak((prev) => {
                    const newStreak = prev + 1;
                    const points = calcMatchPoints(newStreak);

                    setScore((s) => {
                        const next = s + points;
                        syncScoreRef.current(next);
                        return next;
                    });

                    setMaxStreak((m) => Math.max(m, newStreak));

                    const level = comboLevel(newStreak);
                    if (level !== null) {
                        const popupId = ++comboIdRef.current;
                        setComboPopup({
                            id: popupId,
                            text: t("comboLevel", { level }),
                            bonus: points - 100,
                        });
                        setTimeout(() => {
                            setComboPopup((cur) => (cur?.id === popupId ? null : cur));
                        }, 1400);
                    }

                    return newStreak;
                });

                useMatchGameStore.getState().addMatchedPairId(a.pairId!);

                // SRS grading + audio — fire-and-forget, must not block UI.
                const uid = userIdRef.current;
                if (uid && a.pairId) {
                    const card = cards.find((c) => c.id === a.pairId);
                    if (card) {
                        // Write to userProgress — works for both owner and shared users.
                        void gradeCard(uid, a.pairId, card, "Good", card.lessonId, uid).catch(
                            () => {},
                        );

                        // The cue already fired; wait out its tail, then speak. Consecutive matches
                        // QUEUE rather than replace, so a fast player hears each matched word in
                        // full instead of a string of clipped first syllables. Input is not gated
                        // on the audio — the queue absorbs the pace, and overflows are dropped.
                        void sequence(
                            "match-feedback",
                            [
                                { waitForTail: "correct" },
                                {
                                    speak: {
                                        text: getAudioText(card),
                                        options: { trigger: "auto", source: "match" },
                                    },
                                },
                            ],
                            { policy: "queue", queueDepth: 2 },
                        );
                    }
                }

                setTimeout(() => useMatchGameStore.getState().setProcessing(false), 400);
                return;
            }

            // Wrong match — penalise score, shake tiles, decrement lives if active.
            playSfx("wrong");
            setStreak(0);
            setWrongAttempts((prev) => prev + 1);
            setScore((prev) => {
                const next = Math.max(0, prev - WRONG_PENALTY);
                syncScoreRef.current(next);
                return next;
            });

            if (livesModeRef.current) {
                setLivesLeft((l) => Math.max(0, l - 1));
            }

            useMatchGameStore.getState().setShake([idA, idB]);
            setTimeout(() => {
                useMatchGameStore.getState().clearShake();
                useMatchGameStore.getState().setSelected([]);
                useMatchGameStore.getState().setProcessing(false);
            }, 720);
        },
        [cards, userIdRef, syncScoreRef, livesModeRef, setLivesLeft],
    );

    /**
     * Handles a tile tap from the playing view.
     *
     * @remarks
     * First tap selects the tile. Second tap on a different tile triggers
     * pair resolution after a 120ms delay (allows selection animation to render).
     * Tapping the same tile twice deselects it.
     *
     * @param id - ID of the tapped tile.
     */
    const onCellTap = useCallback(
        (id: string) => {
            const current = useMatchGameStore.getState();
            if (current.processing) return;

            const tile = current.grid.find((x) => x.id === id);
            if (!tile) return;

            // Skip already-matched real pairs.
            if (
                !tile.isDistractor &&
                tile.pairId != null &&
                current.matchedPairIds.includes(tile.pairId)
            ) {
                return;
            }

            if (current.selectedIds.length === 0) {
                playSfx("click");
                current.setSelected([id]);
                return;
            }

            if (current.selectedIds.length === 1) {
                const first = current.selectedIds[0];
                if (first === id) {
                    current.setSelected([]);
                    return;
                }
                playSfx("click");
                current.setSelected([first, id]);
                current.setProcessing(true);
                setTimeout(() => resolveTwo(first, id), 120);
            }
        },
        [resolveTwo],
    );

    return {
        score,
        setScore,
        streak,
        maxStreak,
        wrongAttempts,
        comboPopup,
        scoreRef,
        resetScoring,
        onCellTap,
    };
}
