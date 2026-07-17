"use client";

import { useCallback, useMemo, useState } from "react";

import {
    logStudyProgressReset,
    logStudySessionCompleted,
} from "@/features/flashcard/actions/activity-log.actions";
import { useCardsWithProgress } from "@/features/flashcard/hooks/useCardsWithProgress";
import {
    gradeCardForUser,
    resetLessonProgressForUser,
} from "@/features/flashcard/services/progress.service";
import {
    buildSession,
    getDeckStatus,
    getMistakeCards,
    recommendedAction,
} from "@/features/flashcard/utils/learningEngine";
import { useUserProgress } from "@/features/user/hooks";
import { useRouter } from "@/i18n/navigation";
import { useAppStore } from "@/lib/app-store";

import type { CardWithProgress, Grade } from "@/features/flashcard/domain";
import type { FlashcardData } from "@/features/flashcard/loaders";
import type { StudyMode, StudyStats } from "@/features/flashcard/types";

/**
 * Owns StudySession's mode/queue state, live-card subscription, grading, and
 * completion/reset logging, so the component stays a pure phase-router.
 *
 * @remarks
 * Subscribes to live cards via useCardsWithProgress so status counts
 * (new/due/mistakes) update immediately after grading — no refresh needed.
 *
 * data.cards is only used as the initial snapshot for game modes (Match/Speed).
 * For study mode, all derived state comes from the live subscription.
 */
export function useStudySession(data: FlashcardData, initialMode: StudyMode | null) {
    const router = useRouter();
    const { user } = useAppStore();
    const { addXP, completedLesson } = useUserProgress();

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

    return {
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
    };
}
