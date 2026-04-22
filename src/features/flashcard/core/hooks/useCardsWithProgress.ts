/**
 * @file useCardsWithProgress Hook — Content + Progress Merger
 *
 * @remarks
 * Primary hook for all study/game modes.
 *
 * Both content and progress are subscribed in real-time so the merged
 * CardWithProgress[] always reflects the current DB state — no stale
 * progress after grading, no lost state on refresh.
 *
 * Flow:
 * 1. Subscribe to card content (users/{ownerId}/cards) — real-time
 * 2. Subscribe to user progress (userProgress/{uid}/lessons/{lessonId}/cards) — real-time
 * 3. Merge on every update from either stream
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { onSnapshot } from "firebase/firestore";

import { useAppStore } from "@/store";
import { subscribeCards } from "../services/card.service";
import { userProgressLessonCol } from "../services/progress.service";
import { FRESH_SRS_STATE } from "../../domain/types";

import type { CardWithProgress, FlashCardContent, UserCardProgress } from "../../domain/types";

interface UseCardsWithProgressState {
    /** Merged cards (content + user's progress) — always reflects DB state */
    cards: CardWithProgress[];
    loading: boolean;
    error: string | null;
}

/**
 * Subscribes to card content AND user progress in real-time, merging them.
 *
 * @remarks
 * Both streams are independent Firestore listeners. When either fires:
 * - Latest content snapshot is merged with latest progress snapshot
 * - Result is a fresh CardWithProgress[] derived entirely from DB state
 *
 * This means:
 * - Grading a card → progress listener fires → merged cards update immediately
 * - Refresh → both listeners re-hydrate from DB → no state lost
 * - Multi-tab → progress listener fires on all tabs simultaneously
 *
 * @param lessonId - Lesson to load (empty string = skip, used for dashboard)
 * @param ownerId - Owner of the card content (may differ from current user)
 */
export function useCardsWithProgress(lessonId: string, ownerId: string): UseCardsWithProgressState {
    const { user } = useAppStore();

    const [state, setState] = useState<UseCardsWithProgressState>({
        cards: [],
        loading: true,
        error: null,
    });

    // Refs hold the latest snapshot from each stream so either listener
    // can trigger a re-merge without waiting for the other.
    const contentRef = useRef<FlashCardContent[]>([]);
    const progressRef = useRef<Map<string, UserCardProgress>>(new Map());

    useEffect(() => {
        if (!user || !ownerId || !lessonId) {
            setState({ cards: [], loading: false, error: null });
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        let contentReady = false;
        let progressReady = false;

        const merge = () => {
            // Only emit once both streams have delivered their first snapshot
            if (!contentReady || !progressReady) return;

            const merged: CardWithProgress[] = contentRef.current.map((card) => {
                const progress = progressRef.current.get(card.id);
                if (progress) {
                    return { ...card, ...progress } as CardWithProgress;
                }
                // Card never studied — synthesise fresh state (not persisted until first grade)
                return {
                    ...card,
                    cardId: card.id,
                    lessonId: card.lessonId,
                    sourceOwnerId: ownerId,
                    ...FRESH_SRS_STATE,
                    createdAt: Date.now(),
                } as CardWithProgress;
            });

            setState({ cards: merged, loading: false, error: null });
        };

        // Stream 1: card content (real-time)
        const unsubContent = subscribeCards(
            ownerId,
            (cards) => {
                contentRef.current = cards as FlashCardContent[];
                contentReady = true;
                merge();
            },
            (err) => {
                console.error("[useCardsWithProgress] content error:", err);
                setState({ cards: [], loading: false, error: "Failed to load cards." });
            },
            lessonId,
        );

        // Stream 2: user progress (real-time)
        const unsubProgress = onSnapshot(
            userProgressLessonCol(user.uid, lessonId),
            (snap) => {
                const map = new Map<string, UserCardProgress>();
                snap.docs.forEach((d) => map.set(d.id, d.data() as UserCardProgress));
                progressRef.current = map;
                progressReady = true;
                merge();
            },
            (err) => {
                // Progress read failure is non-fatal — fall back to fresh state
                console.error("[useCardsWithProgress] progress error:", err);
                progressReady = true;
                merge();
            },
        );

        return () => {
            unsubContent();
            unsubProgress();
        };
    }, [user?.uid, ownerId, lessonId]);

    return state;
}

/**
 * Content-only hook for deck editing — no SRS state needed.
 */
export function useCardContent(
    lessonId: string,
    ownerId: string,
): { cards: FlashCardContent[]; loading: boolean; error: string | null } {
    const [state, setState] = useState<{
        cards: FlashCardContent[];
        loading: boolean;
        error: string | null;
    }>({ cards: [], loading: true, error: null });

    useEffect(() => {
        if (!ownerId || !lessonId) {
            setState({ cards: [], loading: false, error: null });
            return;
        }

        return subscribeCards(
            ownerId,
            (cards) =>
                setState({ cards: cards as FlashCardContent[], loading: false, error: null }),
            (err) => {
                console.error("[useCardContent] error:", err);
                setState({ cards: [], loading: false, error: "Failed to load cards." });
            },
            lessonId,
        );
    }, [ownerId, lessonId]);

    return state;
}
