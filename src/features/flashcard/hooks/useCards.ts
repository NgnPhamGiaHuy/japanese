"use client";

import { useCallback, useEffect, useState } from "react";

import { useAppStore } from "@/lib/app-store";
import * as CardService from "../services/card.service";

import type { OrderChange } from "@/shared/utils";
import type { FlashCard } from "../types";

/**
 * State representing the card collection and its loading/error status.
 */
interface CardsState {
    /** The synchronized list of flashcards */
    cards: FlashCard[];
    /** Whether the initial fetch or a dynamic update is pending */
    loading: boolean;
    /** Error message caught from the Firestore listener or underlying service */
    error: string | null;
}

/**
 * Real-time hook for managing flashcards within a specific context.
 *
 * Supports both internal study (current user's cards) and external preview
 * (shared cards from another user via ownerId).
 *
 * @param lessonId - Optional filter to only fetch cards for a specific lesson/deck.
 * @param ownerId - Optional UID to fetch another user's cards (for shared previews).
 * @returns State and CRUD operations for the targeted card set.
 */
export function useCards(lessonId?: string, ownerId?: string) {
    const user = useAppStore((s) => s.user);

    const [state, setState] = useState<CardsState>({
        cards: [],
        loading: true,
        error: null,
    });

    // Render-time reset: whenever the target user/lesson identity changes,
    // sync loading/empty state immediately instead of a synchronous
    // setState at the top of the effect below.
    const targetUserId = user ? ownerId || user.uid : null;
    const paramsKey = targetUserId ? `${targetUserId}:${lessonId ?? ""}` : null;
    const [prevParamsKey, setPrevParamsKey] = useState(paramsKey);
    if (paramsKey !== prevParamsKey) {
        setPrevParamsKey(paramsKey);
        setState({ cards: [], loading: Boolean(targetUserId), error: null });
    }

    useEffect(() => {
        if (!user || !targetUserId) {
            return;
        }

        const unsubscribe = CardService.subscribeCards(
            targetUserId,
            (cards) => setState({ cards, loading: false, error: null }),
            (err) => {
                console.error("[useCards] Firestore error:", err);
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: "Could not load cards. Please check your connection and try again.",
                }));
            },
            lessonId,
        );

        return unsubscribe;
    }, [user, lessonId, ownerId, targetUserId]);

    const createCard = useCallback(
        async (card: Omit<FlashCard, "id">): Promise<string | undefined> => {
            if (!user) return;
            return await CardService.createCard(user.uid, card);
        },
        [user],
    );

    const updateCard = useCallback(
        async (card: FlashCard): Promise<void> => {
            if (!user) return;
            await CardService.updateCard(user.uid, card);
        },
        [user],
    );

    const deleteCard = useCallback(
        async (id: string): Promise<void> => {
            if (!user) return;
            await CardService.deleteCard(user.uid, id);
        },
        [user],
    );

    const reorderCards = useCallback(
        async (changes: OrderChange[]): Promise<void> => {
            if (!user) return;
            await CardService.reorderCards(user.uid, changes);
        },
        [user],
    );

    const resetCard = useCallback(
        async (cardId: string, lessonId: string): Promise<void> => {
            if (!user) return;
            await CardService.resetCardProgress(user.uid, cardId, lessonId);
        },
        [user],
    );

    const resetLesson = useCallback(
        async (lessonId: string): Promise<void> => {
            if (!user) return;
            await CardService.resetLessonProgress(user.uid, lessonId);
        },
        [user],
    );

    return {
        ...state,
        createCard,
        updateCard,
        deleteCard,
        reorderCards,
        resetCard,
        resetLesson,
    };
}
