/**
 * useQuizState — Manages quiz phase and mode state
 *
 * @remarks
 * Orchestrates transitions between setup, playing, and done phases.
 * Handles quiz mode selection and answer processing.
 */

import { useState } from "react";

import { checkTypedAnswer } from "@/shared/utils";

import type { KanaChar } from "@/features/kana/types";
import type { QuizMode, QuizPhase } from "../types";

interface UseQuizStateProps {
    dataset: KanaChar[];
    alphabet: "hiragana" | "katakana" | "both";
    userId?: string;
    displayName?: string;
    session: any; // KanaQuizSession type
}

export function useQuizState({ session }: UseQuizStateProps) {
    const [quizMode, setQuizMode] = useState<QuizMode>("choice");
    const [typedInput, setTypedInput] = useState("");
    const [phase, setPhase] = useState<QuizPhase>("setup");

    const startQuiz = (mode: QuizMode) => {
        setQuizMode(mode);
        session.startQuiz();
        if (mode === "smart") session.buildSmartDeck(session.targetScore);
        session.generateQuestion(mode === "type" ? "type" : "read");
        setPhase("playing");
    };

    const handleMCAnswer = (option: { romaji: string }) => {
        if (session.status !== "idle" || !session.question) return;
        const isCorrect = option.romaji === session.question.romaji;
        const nextScore = session.score + (isCorrect ? 1 : 0);

        session.processAnswer(isCorrect, () => {
            setTypedInput("");
            if (nextScore >= session.targetScore) {
                session.finishQuiz(nextScore);
                setPhase("done");
            } else {
                session.generateQuestion(quizMode === "type" ? "type" : "read");
            }
        });
    };

    const handleTypeAnswer = () => {
        if (session.status !== "idle" || !session.question) return;
        const isCorrect = checkTypedAnswer(typedInput, session.question.romaji);
        const nextScore = session.score + (isCorrect ? 1 : 0);

        session.processAnswer(isCorrect, () => {
            setTypedInput("");
            if (nextScore >= session.targetScore) {
                session.finishQuiz(nextScore);
                setPhase("done");
            } else {
                session.generateQuestion("type");
            }
        });
    };

    return {
        quizMode,
        typedInput,
        phase,
        setTypedInput,
        setPhase,
        startQuiz,
        handleMCAnswer,
        handleTypeAnswer,
    };
}
