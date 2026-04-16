"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { generateMatchDistractors } from "@/features/ai/services";
import { useGameSession } from "@/features/game/hooks";
import type { MatchDifficulty } from "@/features/game/modes";
import { calcMatchPoints, calcTimeBonus, comboLabel, DIFFICULTY_CONFIG, WRONG_PENALTY, } from "@/features/game/modes";
import { recordGameResult } from "@/features/game/services";
import { allowAudio, playAudio, playSFX, shuffleArray } from "@/shared/utils";
import { gradeCard } from "../services";
import type { MatchItem } from "../stores/useMatchGameStore";
import { useMatchGameStore } from "../stores/useMatchGameStore";
import { getAudioText } from "../utils";
import type { FlashCard } from "../types";

type MatchPhase = "intro" | "playing" | "results";

export type { MatchItem };

const MIN_PAIRS = 4;
const MAX_PAIRS = 12;

/**
 * Builds the shuffled grid of tiles.
 * Each card produces two tiles: one showing the Japanese primary (-a),
 * one showing the English meaning (-b). Both are visible in the grid.
 */
function buildGridItems(pool: FlashCard[], distractorLabels: string[]): MatchItem[] {
    const clean = (s: string) => s.split(/[/(,]/)[0].trim();
    const nl = (s: string) => s.trim().toLowerCase();
    const items: MatchItem[] = [];
    const occupied = new Set<string>();

    for (const card of pool) {
        const pairId = card.id;
        const valA = clean(card.primary);
        const valB = clean(card.meaning);
        items.push({ id: `${pairId}-a`, pairId, value: valA, isDistractor: false });
        items.push({ id: `${pairId}-b`, pairId, value: valB, isDistractor: false });
        occupied.add(nl(valA));
        occupied.add(nl(valB));
    }

    for (let i = 0; i < distractorLabels.length; i++) {
        let text = distractorLabels[i]?.trim() ?? "";
        let guard = 0;
        while (guard < 40 && (!text || occupied.has(nl(text)))) {
            text = `${i + 1}${guard ? `(${guard})` : ""}`;
            guard++;
        }
        occupied.add(nl(text));
        const id = `dist-${i}-${Math.random().toString(36).slice(2, 9)}`;
        items.push({ id, value: text, isDistractor: true });
    }

    return shuffleArray(items);
}

interface UseMatchModeSessionParams {
    cards: FlashCard[];
    gameMode: string;
    bestScore: number;
    userId?: string;
    displayName?: string | null;
    addXP: (amount: number) => Promise<void>;
}

export function useMatchModeSession({
    cards,
    gameMode,
    bestScore,
    userId,
    displayName,
    addXP,
}: UseMatchModeSessionParams) {
    const [phase, setPhase] = useState<MatchPhase>("intro");
    const [difficulty, setDifficulty] = useState<MatchDifficulty>(2);
    const [prepLoading, setPrepLoading] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [timeLeft, setTimeLeft] = useState(-1);
    const [livesLeft, setLivesLeft] = useState(0);
    const [pairCount, setPairCount] = useState(0);

    const [comboPopup, setComboPopup] = useState<{
        id: number;
        text: string;
        bonus: number;
    } | null>(null);

    const comboIdRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const savedRef = useRef(false);
    const scoreRef = useRef(0);
    const finalScoreRef = useRef(0);
    const livesModeRef = useRef(false);

    const config = DIFFICULTY_CONFIG[difficulty];
    const gameCfg = config.game;

    const { startSession, syncScore, endSession } = useGameSession({
        userId: userId ?? null,
        userName: displayName ?? "Player",
        gameMode,
        currentBest: bestScore,
    });

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    const timeUnlimited = !gameCfg.timePressure;

    useEffect(() => {
        if (phase !== "playing" || timeUnlimited) return;
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase, timeUnlimited]);

    /**
     * Resolves a two-tile selection.
     * If both tiles belong to the same pair → match: award points, call gradeCard("Good"), mark matched.
     * If not → wrong: deduct points, shake tiles.
     */
    const resolveTwo = useCallback(
        (idA: string, idB: string) => {
            const { grid } = useMatchGameStore.getState();
            const a = grid.find((c) => c.id === idA);
            const b = grid.find((c) => c.id === idB);
            if (!a || !b) {
                useMatchGameStore.getState().setProcessing(false);
                return;
            }

            const isMatch =
                !a.isDistractor && !b.isDistractor && a.pairId != null && a.pairId === b.pairId;

            if (isMatch) {
                playSFX("correct");
                setStreak((prev) => {
                    const newStreak = prev + 1;
                    const points = calcMatchPoints(newStreak);
                    setScore((s) => {
                        const next = s + points;
                        syncScore(next);
                        return next;
                    });
                    setMaxStreak((m) => Math.max(m, newStreak));

                    const label = comboLabel(newStreak);
                    if (label) {
                        const popupId = ++comboIdRef.current;
                        setComboPopup({ id: popupId, text: label, bonus: points - 100 });
                        setTimeout(() => {
                            setComboPopup((cur) => (cur?.id === popupId ? null : cur));
                        }, 1400);
                    }
                    return newStreak;
                });

                useMatchGameStore.getState().addMatchedPairId(a.pairId!);

                // Play pronunciation with a slight delay so SFX "ting" is heard first
                if (userId && a.pairId) {
                    const card = cards.find((c) => c.id === a.pairId);
                    if (card) {
                        void gradeCard(userId, a.pairId, card, "Good").catch(() => {});

                        if (allowAudio("match", "feedback")) {
                            setTimeout(() => {
                                playAudio(getAudioText(card));
                            }, 300);
                        }
                    }
                }

                setTimeout(() => {
                    useMatchGameStore.getState().setProcessing(false);
                }, 400);
                return;
            }

            // Wrong match
            playSFX("wrong");
            setStreak(0);
            setWrongAttempts((prev) => prev + 1);
            setScore((prev) => {
                const next = Math.max(0, prev - WRONG_PENALTY);
                syncScore(next);
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
        [cards, syncScore, userId],
    );

    const onCellTap = useCallback(
        (id: string) => {
            const current = useMatchGameStore.getState();
            if (current.processing) return;

            const c = current.grid.find((x) => x.id === id);
            if (!c) return;
            if (!c.isDistractor && c.pairId != null && current.matchedPairIds.includes(c.pairId)) {
                return;
            }

            if (current.selectedIds.length === 0) {
                playSFX("click");
                current.setSelected([id]);
                return;
            }

            if (current.selectedIds.length === 1) {
                const first = current.selectedIds[0];
                if (first === id) {
                    current.setSelected([]);
                    return;
                }
                playSFX("click");
                current.setSelected([first, id]);
                current.setProcessing(true);
                setTimeout(() => resolveTwo(first, id), 120);
            }
        },
        [resolveTwo],
    );

    const startGame = useCallback(async () => {
        const clampedPairs = Math.min(
            Math.max(Math.min(config.pairs, cards.length), MIN_PAIRS),
            MAX_PAIRS,
        );
        if (clampedPairs < 1) return;

        setPrepLoading(true);
        savedRef.current = false;
        finalScoreRef.current = 0;

        try {
            const pool = shuffleArray(cards).slice(0, clampedPairs);
            setPairCount(pool.length);
            livesModeRef.current = config.lives > 0;
            setLivesLeft(livesModeRef.current ? config.lives : 0);

            let distractorLabels: string[] = [];
            if (config.distractorTiles > 0) {
                try {
                    distractorLabels = await generateMatchDistractors(pool, config.distractorTiles);
                } catch {
                    console.warn("[MatchMode] Distractor generation failed, using fallback.");
                }
            }

            const items = buildGridItems(pool, distractorLabels);
            useMatchGameStore.getState().initGrid(items);

            setPhase("playing");
            setScore(0);
            setStreak(0);
            setMaxStreak(0);
            setWrongAttempts(0);
            setComboPopup(null);
            setTimeLeft(gameCfg.timePressure ? config.timeLimit : -1);
            void startSession();
        } finally {
            setPrepLoading(false);
        }
    }, [cards, config, gameCfg.timePressure, startSession]);

    const matchedLen = useMatchGameStore((s) => s.matchedPairIds.length);

    useEffect(() => {
        if (phase !== "playing") return;

        const cleared = pairCount > 0 && matchedLen >= pairCount;
        const timedOut = gameCfg.timePressure && timeLeft === 0;
        const dead = livesModeRef.current && livesLeft <= 0;

        if (!cleared && !timedOut && !dead) return;

        if (timerRef.current) clearInterval(timerRef.current);
        const bonus = cleared && gameCfg.timePressure ? calcTimeBonus(Math.max(0, timeLeft)) : 0;

        const raf = requestAnimationFrame(() => {
            const finalScore = scoreRef.current + bonus;
            finalScoreRef.current = finalScore;
            setScore(finalScore);
            setPhase("results");
        });
        return () => cancelAnimationFrame(raf);
    }, [phase, matchedLen, timeLeft, gameCfg.timePressure, livesLeft, pairCount]);

    useEffect(() => {
        if (phase !== "results" || savedRef.current) return;
        savedRef.current = true;

        const finalScore = finalScoreRef.current;
        void addXP(Math.round(finalScore / 10));
        void endSession(finalScore);
        if (userId) {
            void recordGameResult(userId, displayName ?? "Player", gameMode, finalScore, bestScore);
        }
    }, [addXP, bestScore, displayName, endSession, gameMode, phase, userId]);

    const resetToIntro = useCallback(() => setPhase("intro"), []);

    const closeSession = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const progress = useMemo(() => {
        if (pairCount === 0) return 0;
        return (matchedLen / pairCount) * 100;
    }, [matchedLen, pairCount]);

    return {
        phase,
        setPhase,
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
        livesTotal: config.lives,
        showLives: config.lives > 0,
        pairCount,
        matchedPairs: matchedLen,
        comboPopup,
        progress,
        startGame,
        onCellTap,
        resetToIntro,
        closeSession,
    };
}
