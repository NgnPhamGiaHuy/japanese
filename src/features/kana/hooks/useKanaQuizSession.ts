/**
 * Kana Quiz session hook.
 *
 * @remarks
 * Manages a fixed-length kana quiz session (default 20 questions) with three modes:
 * - Multiple Choice: 4-option MCQ, kana → romaji
 * - Type Romaji: Free-text input, kana → romaji
 * - Smart Review: Prioritises weakest characters from user history
 *
 * Uses the engine's session infrastructure (useGameSession) for Firestore sync
 * while keeping Kana-specific question logic intact. KanaChar is not compatible
 * with FlashCard, so GameEngine's QuestionEngine is not used here.
 *
 * Wrong-answer reinforcement: missed characters are re-inserted near the back
 * of the deck so the learner encounters them again before the session ends.
 */

"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { comboMultiplier } from "@/features/game";
import { useGameSession } from "@/features/game/hooks";
import { useUserProgress } from "@/features/user";
import { allowAudio, playAudio, playSFX, shuffleArray } from "@/shared/utils";
import { VISUAL_GROUPS } from "../data";

import type { KanaChar, QuestionType } from "../types";

export type KanaAnswerStatus = "idle" | "correct" | "wrong";

const TARGET_SCORE = 20;

interface UseKanaQuizSessionParams {
    dataset: KanaChar[];
    gameMode: string;
    bestScore?: number;
    userId?: string | null;
    displayName?: string | null;
    /** Optional callback fired after each correct answer with points and new streak. */
    onCorrectCombo?: (info: { points: number; streak: number }) => void;
}

/**
 * Builds visually and phonetically similar distractors for a target character.
 *
 * @remarks
 * Prioritises characters from the same visual group and phonetic group.
 * Falls back to random dataset characters when the pool is too small.
 */
function buildDistractors(target: KanaChar, dataset: KanaChar[]): KanaChar[] {
    const visualMatch = VISUAL_GROUPS.find((g) => g.includes(target.char)) ?? [];
    const phoneticMatch = dataset.filter((i) => i.group === target.group).map((i) => i.char);

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
}

/**
 * Kana Quiz session controller.
 *
 * @remarks
 * Exposes a minimal interface for the quiz page:
 * - question / options / status for rendering
 * - score / streak for HUD
 * - generateQuestion / processAnswer for game loop
 * - startSession / endSession wired to Firestore via useGameSession
 *
 * Session lifecycle:
 *   setup → playing (score reaches TARGET_SCORE) → done
 */
export function useKanaQuizSession({
    dataset,
    gameMode,
    bestScore = 0,
    userId,
    displayName,
    onCorrectCombo,
}: UseKanaQuizSessionParams) {
    const { userData, recordCharStat } = useUserProgress();

    const [question, setQuestion] = useState<KanaChar | null>(null);
    const [questionType, setQuestionType] = useState<QuestionType>("read");
    const [options, setOptions] = useState<KanaChar[]>([]);
    const [status, setStatus] = useState<KanaAnswerStatus>("idle");
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);

    const deckRef = useRef<KanaChar[]>([]);
    const streakRef = useRef(0);
    const savedRef = useRef(false);
    const onCorrectComboRef = useRef(onCorrectCombo);

    useLayoutEffect(() => {
        onCorrectComboRef.current = onCorrectCombo;
    });

    const { startSession, syncScore, endSession } = useGameSession({
        userId: userId ?? null,
        userName: displayName ?? "Player",
        gameMode,
        currentBest: bestScore,
    });

    // Stable refs so callbacks never hold stale closures.
    const syncScoreRef = useRef(syncScore);
    const endSessionRef = useRef(endSession);

    useLayoutEffect(() => {
        syncScoreRef.current = syncScore;
        endSessionRef.current = endSession;
    });

    /**
     * Generates the next question from the deck.
     *
     * @remarks
     * Refills the deck when empty (shuffled full dataset).
     * Accepts an optional forced question type; otherwise picks randomly.
     */
    const generateQuestion = useCallback(
        (forceType?: QuestionType, isSmartMode = false) => {
            if (deckRef.current.length === 0) {
                deckRef.current = shuffleArray([...dataset]);
            }

            const target = deckRef.current.pop()!;
            const distractors = buildDistractors(target, dataset);
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
        [dataset],
    );

    /**
     * Builds a Smart Review deck sorted by weakest characters.
     *
     * @remarks
     * Characters with no history are treated as slightly below average (0.4 accuracy)
     * so they appear before well-known characters but after confirmed weak ones.
     */
    const buildSmartDeck = useCallback(
        (size: number) => {
            const stats = userData.charStats ?? {};
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

    /**
     * Evaluates an answer, updates state, and advances to the next question.
     *
     * @remarks
     * Correct: increments streak, awards combo points, plays SFX, records stat.
     * Wrong: resets streak, re-inserts character near end of deck for reinforcement.
     * Audio plays after feedback delay when allowed by user settings.
     *
     * @param isCorrect - Whether the submitted answer was correct.
     * @param onAdvance - Callback to advance the game loop (generate next question or end).
     */
    const processAnswer = useCallback(
        (isCorrect: boolean, onAdvance: () => void) => {
            setStatus(isCorrect ? "correct" : "wrong");

            if (question) recordCharStat(question.char, isCorrect);

            if (isCorrect) {
                const nextStreak = streakRef.current + 1;
                streakRef.current = nextStreak;
                setStreak(nextStreak);

                const pts = comboMultiplier(nextStreak);
                setScore((s) => {
                    const next = s + pts;
                    syncScoreRef.current(next);
                    return next;
                });

                playSFX("correct");
                onCorrectComboRef.current?.({ points: pts, streak: nextStreak });
            } else {
                playSFX("wrong");
                streakRef.current = 0;
                setStreak(0);

                // Re-insert missed character near end of deck for reinforcement.
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
        [question, questionType, recordCharStat],
    );

    /**
     * Starts a new quiz session.
     *
     * @remarks
     * Resets all state and creates a Firestore session document.
     */
    const startQuiz = useCallback(() => {
        streakRef.current = 0;
        savedRef.current = false;
        setScore(0);
        setStreak(0);
        setStatus("idle");
        deckRef.current = [];
        void startSession();
    }, [startSession]);

    /**
     * Persists the final score when the quiz completes.
     *
     * @remarks
     * Guard prevents double-firing if called multiple times.
     */
    const finishQuiz = useCallback((finalScore: number) => {
        if (savedRef.current) return;
        savedRef.current = true;
        void endSessionRef.current(finalScore);
    }, []);

    /**
     * Resets all quiz state for a new session.
     */
    const resetEngine = useCallback(() => {
        streakRef.current = 0;
        savedRef.current = false;
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
        targetScore: TARGET_SCORE,
        generateQuestion,
        buildSmartDeck,
        processAnswer,
        startQuiz,
        finishQuiz,
        setStatus,
        resetEngine,
        deckRef,
    };
}
