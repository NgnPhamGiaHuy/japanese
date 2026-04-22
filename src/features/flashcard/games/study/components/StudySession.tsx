"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
    buildSession,
    FlashcardLearn,
    FlashcardMistakeReview,
    FlashcardPractice,
    getDeckStatus,
    getMistakeCards,
    gradeCardForUser,
    recommendedAction,
    resetLessonProgressForUser,
    useCardsWithProgress,
} from "@/features/flashcard/core";
import {
    logStudyProgressReset,
    logStudySessionCompleted,
} from "@/features/flashcard/core/actions/activity-log.actions";
import { useUserProgress } from "@/features/user/hooks";
import { ConfirmModal } from "@/shared/components/ui";
import { useAppStore } from "@/store";
import { StudyModeSelector } from "./index";

import type { FlashcardData, StudyMode, StudyStats } from "@/features/flashcard/core";
import type { CardWithProgress, Grade } from "@/features/flashcard/domain";

interface StudySessionProps {
    data: FlashcardData;
}

/**
 * StudySession — Feature Root Component
 *
 * @remarks
 * Subscribes to live cards via useCardsWithProgress so status counts
 * (new/due/mistakes) update immediately after grading — no refresh needed.
 *
 * data.cards is only used as the initial snapshot for game modes (Match/Speed).
 * For study mode, all derived state comes from the live subscription.
 */
const StudySession = ({ data }: StudySessionProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAppStore();
    const { addXP, completedLesson } = useUserProgress();

    const initialMode = searchParams.get("mode") as StudyMode | null;
    const [mode, setMode] = useState<StudyMode | null>(initialMode);
    const [showExitModal, setShowExitModal] = useState(false);

    // Live subscription — updates immediately after every grade.
    // ownerId comes from data so shared decks load from the correct owner.
    const lessonId =
        data.source.type === "personal"
            ? data.source.lessonId
            : data.source.type === "shared"
              ? data.lesson.id
              : "";

    const { cards: liveCards } = useCardsWithProgress(lessonId, data.ownerId);

    // Use live cards when available, fall back to snapshot during initial load
    const cards = liveCards.length > 0 ? liveCards : data.cards;

    // Session queue is built once per mode selection from the live cards at that moment.
    // Rebuilding on every card update would reset the queue mid-session.
    const session = useMemo(() => {
        if (!mode) return null;
        return buildSession(cards, mode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    // Status always derived from live cards — updates after grading without refresh
    const status = useMemo(() => getDeckStatus(cards), [cards]);
    const action = recommendedAction(status);

    const handleClose = useCallback(() => {
        if (mode) {
            setShowExitModal(true);
        } else {
            router.back();
        }
    }, [mode, router]);

    const handleConfirmExit = useCallback(() => {
        setShowExitModal(false);
        router.back();
    }, [router]);

    const handleCancelExit = useCallback(() => {
        setShowExitModal(false);
    }, []);

    const handleAnswer = useCallback(
        async (card: CardWithProgress, grade: Grade) => {
            if (!user || !mode) return;
            await gradeCardForUser(
                user.uid,
                card.lessonId,
                card.id,
                card.sourceOwnerId,
                card,
                grade,
            );
        },
        [user, mode],
    );

    const handleComplete = useCallback(
        async (stats: StudyStats, overrideXp?: number) => {
            addXP(overrideXp ?? stats.correct * 2);
            completedLesson();

            // Log the completed session (non-blocking)
            if (user && mode) {
                try {
                    const token = await user.getIdToken();
                    void logStudySessionCompleted(token, user.uid, lessonId, data.lesson.title, {
                        correct: stats.correct,
                        total: stats.total ?? cards.length,
                        mode,
                    });
                } catch {
                    // Non-blocking
                }
            }

            const hasMistakes = getMistakeCards(cards).length > 0;
            if (hasMistakes) {
                setMode("mistake-review");
            } else {
                router.back();
            }
        },
        [addXP, completedLesson, cards, router, user, mode, lessonId, data.lesson.title],
    );

    const handleReset = useCallback(async () => {
        if (!user) return;
        await resetLessonProgressForUser(user.uid, lessonId);
        // Log the reset (non-blocking)
        try {
            const token = await user.getIdToken();
            void logStudyProgressReset(token, user.uid, lessonId, data.lesson.title);
        } catch {
            // Non-blocking
        }
        setMode(null);
    }, [user, lessonId, data.lesson.title]);

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
                    userId={user?.uid ?? ""}
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
                    userId={user?.uid ?? ""}
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
