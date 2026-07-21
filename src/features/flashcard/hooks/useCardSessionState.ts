"use client";

import { useState } from "react";

import { auth } from "@/lib/firebase";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import { playSfx } from "@/shared/audio";
import { reinsertCard } from "../utils";

import type { CardWithProgress, Grade } from "../domain";
import type { StudyStats } from "../types";

export interface UseCardSessionStateResult {
    /** Working queue — starts as a copy of `cards`, grows when a card is re-inserted after "Again". */
    queue: CardWithProgress[];
    /** The card currently on screen, or `undefined` once the queue is exhausted. */
    card: CardWithProgress | undefined;
    currentIndex: number;
    /** 0-100, `currentIndex / queue.length`. */
    progress: number;
    stats: StudyStats;
    showSummary: boolean;
    /**
     * Records a grade for the current card: updates stats, advances to the next
     * card (or re-queues it on "Again", or shows the summary on the last card),
     * and fires `onAnswer` — persistence is fire-and-forget, matching every
     * study mode's existing behavior of advancing the UI without waiting on it.
     *
     * @param options.playCue - Pass `false` when the caller already played its
     *   own sfx (e.g. multiple-choice selection, which cues immediately on tap
     *   rather than waiting for this call).
     */
    submitGrade: (grade: Grade, options?: { playCue?: boolean }) => void;
}

/**
 * Shared session state + grading logic for the three study-mode players
 * (FlashcardPractice, FlashcardLearn, FlashcardMistakeReview) — previously
 * each component hand-rolled its own copy of this queue/stats/summary state
 * machine. Each player still owns its own transient UI state (flip/reveal
 * flags, MC selection, hint visibility) and resets it itself before calling
 * `submitGrade`, since that state is genuinely per-mode.
 */
export function useCardSessionState(
    cards: CardWithProgress[],
    onAnswer: (card: CardWithProgress, grade: Grade) => Promise<void>,
): UseCardSessionStateResult {
    const [queue, setQueue] = useState<CardWithProgress[]>(() => [...cards]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [stats, setStats] = useState<StudyStats>({
        correct: 0,
        incorrect: 0,
        mistakeCardIds: [],
    });
    const [showSummary, setShowSummary] = useState(false);

    const card = queue[currentIndex];
    const progress = (currentIndex / queue.length) * 100;

    const submitGrade: UseCardSessionStateResult["submitGrade"] = (grade, options = {}) => {
        const { playCue = true } = options;
        if (!card) return;

        const knew = grade === "Good" || grade === "Easy";
        const nextMistakes = knew ? stats.mistakeCardIds : [...stats.mistakeCardIds, card.id];
        setStats({
            correct: stats.correct + (knew ? 1 : 0),
            incorrect: stats.incorrect + (!knew ? 1 : 0),
            mistakeCardIds: nextMistakes,
        });
        if (playCue) playSfx(knew ? "correct" : "wrong");

        // Advance UI immediately — writes are fire-and-forget.
        if (grade === "Again") {
            setQueue(reinsertCard(queue, currentIndex));
        } else if (currentIndex < queue.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setShowSummary(true);
        }

        void onAnswer(card, grade).catch((err) => {
            console.error("[useCardSessionState] onAnswer failed:", err);
            enqueueClientLog(() => auth.currentUser!.getIdToken(), {
                action: ActivityAction.SRS_WRITE_FAILED,
                entityType: "study",
                entityId: card.id,
                level: "error",
                metadata: { reason: "useCardSessionState.onAnswer", error: String(err) },
            });
        });
    };

    return { queue, card, currentIndex, progress, stats, showSummary, submitGrade };
}
