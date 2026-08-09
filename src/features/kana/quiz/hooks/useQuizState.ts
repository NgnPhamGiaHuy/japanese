/**
 * useQuizState — Manages quiz phase and mode state
 *
 * @remarks
 * Orchestrates transitions between setup, playing, and done phases.
 * Handles quiz mode selection and answer processing.
 */

import { useState } from "react";

import { auth } from "@/lib/firebase";
import { logKanaQuizCompleted } from "../../actions";
import { checkTypedAnswer } from "../../utils";

import type { useKanaQuizSession } from "@/features/kana/hooks";
import type { KanaChar } from "@/features/kana/types";
import type { QuizMode, QuizPhase } from "../types";

interface UseQuizStateProps {
    dataset: KanaChar[];
    alphabet: "hiragana" | "katakana" | "both";
    userId?: string;
    displayName?: string;
    session: ReturnType<typeof useKanaQuizSession>;
}

export function useQuizState({ session, userId, alphabet }: UseQuizStateProps) {
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

    /**
     * Shared end-of-answer step for both input modes.
     *
     * A quiz run is `targetScore` QUESTIONS long, so the end condition counts
     * questions answered — not points. `finishQuiz` persists the engine's own
     * combo-weighted score (what `syncScore` streamed during play and what the
     * leaderboard ranks on); the activity log records the question tally, so
     * its `score / total` stays a meaningful accuracy figure.
     */
    const advanceAfterAnswer = (isCorrect: boolean, forcedType: "type" | "read") => {
        const questionsAnswered = session.answered + 1;
        const correct = session.correctCount + (isCorrect ? 1 : 0);

        session.processAnswer(isCorrect, () => {
            setTypedInput("");
            if (questionsAnswered >= session.targetScore) {
                session.finishQuiz();
                setPhase("done");
                if (userId) {
                    void auth.currentUser?.getIdToken().then((token) =>
                        logKanaQuizCompleted(token, userId, alphabet ?? "hiragana", {
                            score: correct,
                            total: session.targetScore,
                            mode: quizMode,
                        }),
                    );
                }
            } else {
                session.generateQuestion(forcedType);
            }
        });
    };

    const handleMCAnswer = (option: { romaji: string }) => {
        if (session.status !== "idle" || !session.question) return;
        const isCorrect = option.romaji === session.question.romaji;
        advanceAfterAnswer(isCorrect, quizMode === "type" ? "type" : "read");
    };

    const handleTypeAnswer = () => {
        if (session.status !== "idle" || !session.question) return;
        const isCorrect = checkTypedAnswer(typedInput, session.question.romaji);
        advanceAfterAnswer(isCorrect, "type");
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
