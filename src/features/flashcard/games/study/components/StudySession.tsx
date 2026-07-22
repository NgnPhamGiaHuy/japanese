"use client";

import { useSearchParams } from "next/navigation";

import { useAppStore } from "@/lib/app-store";
import { ConfirmModal } from "@/shared/components/ui";
import FlashcardLearn from "./FlashcardLearn";
import FlashcardMistakeReview from "./FlashcardMistakeReview";
import FlashcardPractice from "./FlashcardPractice";
import StudyModeSelector from "./StudyModeSelector";
import { useStudySession } from "../hooks";

import type { FlashcardData } from "@/features/flashcard/loaders";
import type { StudyMode } from "@/features/flashcard/types";

interface StudySessionProps {
    data: FlashcardData;
}

/**
 * StudySession — Feature Root Component
 *
 * @remarks
 * Pure phase-router — delegates all session state, grading, and completion
 * logging to useStudySession.
 */
const StudySession = ({ data }: StudySessionProps) => {
    const { user } = useAppStore();
    const searchParams = useSearchParams();
    const initialMode = searchParams.get("mode") as StudyMode | null;

    const {
        mode,
        setMode,
        showExitModal,
        session,
        status,
        action,
        handleClose,
        handleConfirmExit,
        handleCancelExit,
        handleAnswer,
        handleComplete,
        handleReset,
    } = useStudySession(data, initialMode);

    if (!mode || !session) {
        return (
            <StudyModeSelector
                lesson={data.lesson}
                status={status}
                action={action}
                mistakeCount={status.mistakeCount}
                onSelectMode={setMode}
                onClose={handleClose}
                onReset={handleReset}
            />
        );
    }

    return (
        <>
            <ConfirmModal
                isOpen={showExitModal}
                title="Wait, don't go!"
                message="You've made great progress in this session! If you exit now, your current XP and session history won't be saved."
                variant="warning"
                confirmText="End Session"
                cancelText="Keep Studying"
                onConfirm={handleConfirmExit}
                onClose={handleCancelExit}
            />

            {mode === "learn" && (
                <FlashcardLearn
                    lesson={data.lesson}
                    cards={session.queue}
                    onClose={handleClose}
                    onAnswer={handleAnswer}
                    onComplete={(stats) => void handleComplete(stats)}
                />
            )}

            {mode === "practice" && (
                <FlashcardPractice
                    lesson={data.lesson}
                    userId={user?.uid ?? ""}
                    cards={session.queue}
                    onClose={handleClose}
                    onAnswer={handleAnswer}
                    onComplete={(stats) => void handleComplete(stats)}
                />
            )}

            {mode === "mistake-review" && (
                <FlashcardMistakeReview
                    lesson={data.lesson}
                    cards={session.queue}
                    onClose={handleClose}
                    onAnswer={handleAnswer}
                    onComplete={(stats) => void handleComplete(stats)}
                />
            )}
        </>
    );
};

export default StudySession;
