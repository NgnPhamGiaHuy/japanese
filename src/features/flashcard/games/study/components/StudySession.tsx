/**
 * StudySession — Feature Root Component
 *
 * @remarks
 * Orchestrates SRS-based study sessions with mode selection.
 * Handles Learn, Practice, and Mistake Review modes.
 * Supports both personal and shared decks via FlashcardData abstraction.
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FlashcardLearn, FlashcardMistakeReview, FlashcardPractice } from "@/features/flashcard";
import { useCards } from "@/features/flashcard/core/hooks";
import { gradeCard } from "@/features/flashcard/core/services/card.service";
import { buildSession, getDeckStatus, recommendedAction } from "@/features/flashcard/core/utils";
import { useUserProgress } from "@/features/user/hooks";
import { useAppStore } from "@/store";
import StudyModeSelector from "./StudyModeSelector";

import type { FlashcardData } from "@/features/flashcard/core/loaders";
import type { Grade } from "@/features/flashcard/core/services/card.service";
import type { FlashCard, StudyMode, StudyStats } from "@/features/flashcard/core/types";

interface StudySessionProps {
    data: FlashcardData;
}

/**
 * Study Session Feature Root
 *
 * @remarks
 * Manages mode selection and session lifecycle.
 * Delegates rendering to mode-specific components.
 * Works with both personal and shared decks via unified FlashcardData.
 */
const StudySession = ({ data }: StudySessionProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAppStore();
    const { addXP, completedLesson } = useUserProgress();

    // Only personal decks can reset (shared decks are read-only)
    const { resetLesson } = useCards(data.source.type === "personal" ? data.source.lessonId : "");

    const initialMode = searchParams.get("mode") as StudyMode | null;
    const [mode, setMode] = useState<StudyMode | null>(initialMode);
    const [mistakeIds, setMistakeIds] = useState<string[]>([]);

    const session = useMemo(() => {
        if (!mode) return null;
        return buildSession(data.cards, mode, mistakeIds);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const status = getDeckStatus(data.cards);
    const action = recommendedAction(status);

    const handleClose = () => router.push(data.returnPath);

    const handleAnswer = async (card: FlashCard, grade: Grade) => {
        if (!user || !mode) return;
        // Only grade cards for personal decks (shared decks are read-only)
        if (data.source.type === "personal") {
            await gradeCard(user.uid, card.id, card, grade);
        }
    };

    const handleComplete = async (stats: StudyStats, overrideXp?: number) => {
        const xp = overrideXp ?? stats.correct * 2;
        addXP(xp);
        completedLesson();

        if (stats.mistakeCardIds.length > 0) {
            setMistakeIds(stats.mistakeCardIds);
            setMode(null);
        } else {
            router.push("/flashcard");
        }
    };

    const handleReset = async () => {
        if (!user || data.source.type !== "personal") return;
        await resetLesson(data.source.lessonId);
        setMistakeIds([]);
        setMode(null);
    };

    if (!mode || !session) {
        return (
            <StudyModeSelector
                lesson={data.lesson}
                status={status}
                action={action}
                mistakeCount={mistakeIds.length}
                onSelectMode={setMode}
                onClose={handleClose}
                onReset={data.source.type === "personal" ? handleReset : undefined}
            />
        );
    }

    if (mode === "learn") {
        return (
            <FlashcardLearn
                lesson={data.lesson}
                userId={user?.uid ?? ""}
                cards={session.queue}
                onClose={handleClose}
                onAnswer={handleAnswer}
                onComplete={(stats) => void handleComplete(stats)}
            />
        );
    }

    if (mode === "practice") {
        return (
            <FlashcardPractice
                lesson={data.lesson}
                userId={user?.uid ?? ""}
                cards={session.queue}
                onClose={handleClose}
                onAnswer={handleAnswer}
                onComplete={(stats) => void handleComplete(stats)}
            />
        );
    }

    if (mode === "mistake-review") {
        return (
            <FlashcardMistakeReview
                lesson={data.lesson}
                userId={user?.uid ?? ""}
                cards={session.queue}
                onClose={handleClose}
                onAnswer={handleAnswer}
                onComplete={(stats) => void handleComplete(stats)}
            />
        );
    }

    return null;
};

export default StudySession;
