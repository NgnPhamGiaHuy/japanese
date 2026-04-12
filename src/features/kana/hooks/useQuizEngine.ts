"use client";

import { useCallback, useRef, useState } from "react";

import { VISUAL_GROUPS } from "@/features/kana/data/visualGroups";
import { shuffleArray } from "@/shared/utils/array";
import { playAudio } from "@/shared/utils/audio";
import { getCharStats, recordCharStat } from "@/shared/utils/stats";

import type { KanaChar, QuestionType } from "../types/kana.types";

export type AnswerStatus = "idle" | "correct" | "wrong";

/** Unified quiz engine — used by both QuizScreen and SurvivalScreen (non-drop modes) */
export function useQuizEngine(dataset: KanaChar[]) {
    const [question, setQuestion] = useState<KanaChar | null>(null);
    const [questionType, setQuestionType] = useState<QuestionType>("read");
    const [options, setOptions] = useState<KanaChar[]>([]);
    const [status, setStatus] = useState<AnswerStatus>("idle");
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const deckRef = useRef<KanaChar[]>([]);

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

            if (selectedType === "listen") setTimeout(() => playAudio(target.char), 300);
        },
        [dataset, buildDistractors],
    );

    /** Loads a Smart Review deck sorted by weakest characters */
    const buildSmartDeck = useCallback(
        (size: number) => {
            const stats = getCharStats();
            const sorted = [...dataset].sort((a, b) => {
                const sA = stats[a.char];
                const sB = stats[b.char];
                const rA = sA?.attempts ? sA.correct / sA.attempts : sA ? 0.4 : -0.1;
                const rB = sB?.attempts ? sB.correct / sB.attempts : sB ? 0.4 : -0.1;
                return rA - rB;
            });
            deckRef.current = shuffleArray(sorted.slice(0, size));
        },
        [dataset],
    );

    const processAnswer = useCallback(
        (isCorrect: boolean, onAdvance: () => void) => {
            setStatus(isCorrect ? "correct" : "wrong");
            if (question) recordCharStat(question.char, isCorrect);

            if (isCorrect) {
                setScore((s) => s + 1);
                setStreak((s) => s + 1);
                if (question) playAudio(question.char);
            } else {
                setStreak(0);
            }

            setTimeout(onAdvance, isCorrect ? 800 : 1500);
        },
        [question],
    );

    const resetEngine = useCallback(() => {
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
