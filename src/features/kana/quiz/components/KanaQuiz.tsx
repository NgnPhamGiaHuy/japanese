/**
 * KanaQuiz — Main quiz component
 *
 * @remarks
 * Root component for kana quiz feature.
 * Manages three phases: setup, playing, done.
 */

"use client";

import { useKanaDataset, useKanaQuizSession } from "@/features/kana/hooks";
import { useAppStore } from "@/store";
import { QuizPlaying } from "./QuizPlaying";
import { QuizResults } from "./QuizResults";
import { QuizSetup } from "./QuizSetup";
import { useQuizState } from "../hooks";

export function KanaQuiz() {
    const { dataset, alphabet, themeColor } = useKanaDataset();
    const { user } = useAppStore();

    const session = useKanaQuizSession({
        dataset,
        gameMode: `kana_quiz_${alphabet}`,
        userId: user?.uid,
        displayName: user?.displayName,
    });

    const {
        quizMode,
        typedInput,
        phase,
        setTypedInput,
        setPhase,
        startQuiz,
        handleMCAnswer,
        handleTypeAnswer,
    } = useQuizState({
        dataset,
        alphabet,
        userId: user?.uid,
        displayName: user?.displayName ?? undefined,
        session,
    });

    if (phase === "setup") {
        return <QuizSetup alphabet={alphabet} themeColor={themeColor} onStartQuiz={startQuiz} />;
    }

    if (phase === "done") {
        return (
            <QuizResults
                score={session.score}
                targetScore={session.targetScore}
                alphabet={alphabet}
                themeColor={themeColor}
                onPlayAgain={() => startQuiz(quizMode)}
                onChangeMode={() => setPhase("setup")}
            />
        );
    }

    return (
        <QuizPlaying
            quizMode={quizMode}
            question={session.question}
            questionType={session.questionType}
            options={session.options}
            status={session.status}
            score={session.score}
            targetScore={session.targetScore}
            streak={session.streak}
            themeColor={themeColor}
            typedInput={typedInput}
            onTypedInputChange={setTypedInput}
            onTypeAnswer={handleTypeAnswer}
            onMCAnswer={handleMCAnswer}
            onBack={() => setPhase("setup")}
        />
    );
}
