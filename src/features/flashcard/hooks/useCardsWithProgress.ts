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

import { useAppStore } from "@/lib/app-store";
import { FRESH_SRS_STATE } from "../domain/types";
import { subscribeCards } from "../services/card.service";
import { subscribeLessonProgress } from "../services/progress.service";

import type { CardWithProgress, FlashCardContent, UserCardProgress } from "../domain/types";

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
    const hasParams = Boolean(user && ownerId && lessonId);
    const paramsKey = hasParams ? `${user!.uid}:${ownerId}:${lessonId}` : null;

    const [state, setState] = useState<UseCardsWithProgressState>({
        cards: [],
        loading: true,
        error: null,
    });

    // Render-time reset: whenever the (user, owner, lesson) identity
    // changes, mark loading immediately instead of a synchronous setState
    // at the top of the effect below.
    const [prevParamsKey, setPrevParamsKey] = useState(paramsKey);
    if (paramsKey !== prevParamsKey) {
        setPrevParamsKey(paramsKey);
        setState({ cards: [], loading: hasParams, error: null });
    }

    // Refs hold the latest snapshot from each stream so either listener
    // can trigger a re-merge without waiting for the other.
    const contentRef = useRef<FlashCardContent[]>([]);
    const progressRef = useRef<Map<string, UserCardProgress>>(new Map());

    useEffect(() => {
        if (!user || !ownerId || !lessonId) {
            return;
        }

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
        const unsubProgress = subscribeLessonProgress(
            user.uid,
            lessonId,
            (map) => {
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

    if (!hasParams) {
        return { cards: [], loading: false, error: null };
    }
    return state;
}
