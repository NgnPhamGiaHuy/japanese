"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { comboMultiplier } from "@/features/game";
import { useUserProgress } from "@/features/user";
import { allowAudio, playAudio, playSFX, shuffleArray } from "@/shared/utils";
import { VISUAL_GROUPS } from "../data";

import type { KanaChar, QuestionType } from "../types";

export type AnswerStatus = "idle" | "correct" | "wrong";

export interface QuizEngineOptions {
    /** When true, each correct answer adds `comboMultiplier(streak)` points instead of 1. */
    comboScoring?: boolean;
    /** Fires after a correct answer with points actually added and new streak count. */
    onCorrectCombo?: (info: { points: number; streak: number }) => void;
}

/**
 * Unified quiz engine — used by Quiz and Survival (non-drop modes).
 *
 * Wrong-answer reinforcement: a missed character is re-inserted near the back
 * of the deck so the learner encounters it again before the session ends, without
 * seeing it immediately.
 */
export function useQuizEngine(dataset: KanaChar[], opts?: QuizEngineOptions) {
    const comboScoring = opts?.comboScoring ?? false;
    const onCorrectComboRef = useRef(opts?.onCorrectCombo);
    useEffect(() => {
        onCorrectComboRef.current = opts?.onCorrectCombo;
    }, [opts?.onCorrectCombo]);

    const { userData, recordCharStat } = useUserProgress();

    const [question, setQuestion] = useState<KanaChar | null>(null);
    const [questionType, setQuestionType] = useState<QuestionType>("read");
    const [options, setOptions] = useState<KanaChar[]>([]);
    const [status, setStatus] = useState<AnswerStatus>("idle");
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const deckRef = useRef<KanaChar[]>([]);
    /** Mirrors `streak` for synchronous combo math inside `processAnswer`. */
    const streakRef = useRef(0);

    const buildDistractors = useCallback(
        (target: KanaChar): KanaChar[] => {
            const visualMatch = VISUAL_GROUPS.find((g) => g.includes(target.char)) ?? [];
            const phoneticMatch = dataset
                .filter((i) => i.group === target.group)
                .map((i) => i.char);

            let pool = dataset.filter(
                (i) =>
                    i.char !== target.char &&
                    i.romaji !== target.romaji &&
                    (visualMatch.includes(i.char) || phoneticMatch.includes(i.char)),
            );

            if (pool.length < 3) {
                const remaining = dataset.filter(
                    (i) =>
                        i.char !== target.char &&
                        i.romaji !== target.romaji &&
                        !pool.some((p) => p.char === i.char),
                );
                pool = [...pool, ...shuffleArray(remaining)];
            }

            return shuffleArray(pool).slice(0, 3);
        },
        [dataset],
    );

    const generateQuestion = useCallback(
        (forceType?: QuestionType, isSmartMode = false) => {
            if (deckRef.current.length === 0) deckRef.current = shuffleArray([...dataset]);
            const target = deckRef.current.pop()!;

            const distractors = buildDistractors(target);
            const allOptions = shuffleArray([...distractors, target]);

            let selectedType: QuestionType;
            if (forceType) {
                selectedType = forceType;
            } else if (isSmartMode) {
                selectedType = "type";
            } else {
                const types: QuestionType[] = ["read", "reverse", "listen", "type"];
                selectedType = types[Math.floor(Math.random() * types.length)];
            }

            setQuestion(target);
            setQuestionType(selectedType);
            setOptions(allOptions);
            setStatus("idle");
        },
        [dataset, buildDistractors],
    );

    /** Loads a Smart Review deck sorted by weakest characters */
    const buildSmartDeck = useCallback(
        (size: number) => {
            const stats = userData.charStats || {};
            const sorted = [...dataset].sort((a, b) => {
                const sA = stats[a.char];
                const sB = stats[b.char];
                const rA = sA?.attempts ? sA.correct / sA.attempts : sA ? 0.4 : -0.1;
                const rB = sB?.attempts ? sB.correct / sB.attempts : sB ? 0.4 : -0.1;
                return rA - rB;
            });
            deckRef.current = shuffleArray(sorted.slice(0, size));
        },
        [dataset, userData.charStats],
    );

    const processAnswer = useCallback(
        (isCorrect: boolean, onAdvance: () => void) => {
            setStatus(isCorrect ? "correct" : "wrong");
            if (question) recordCharStat(question.char, isCorrect);

            if (isCorrect) {
                const nextStreak = streakRef.current + 1;
                streakRef.current = nextStreak;
                setStreak(nextStreak);
                const pts = comboScoring ? comboMultiplier(nextStreak) : 1;
                setScore((s) => s + pts);
                playSFX("correct");
                onCorrectComboRef.current?.({ points: pts, streak: nextStreak });
            } else {
                playSFX("wrong");
                streakRef.current = 0;
                setStreak(0);
                if (question) {
                    const deck = deckRef.current;
                    const insertAt = Math.max(0, deck.length - 4);
                    deck.splice(insertAt, 0, question);
                }
            }

            if (question && allowAudio(questionType, "feedback")) {
                playAudio(question.char);
            }

            setTimeout(onAdvance, isCorrect ? 800 : 1500);
        },
        [question, questionType, comboScoring],
    );

    const resetEngine = useCallback(() => {
        streakRef.current = 0;
        setScore(0);
        setStreak(0);
        setStatus("idle");
        deckRef.current = [];
    }, []);

    return {
        question,
        questionType,
        options,
        status,
        score,
        streak,
        generateQuestion,
        processAnswer,
        buildSmartDeck,
        resetEngine,
        deckRef,
        setStatus,
    };
}
