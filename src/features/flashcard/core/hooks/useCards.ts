"use client";

import { useCallback, useEffect, useState } from "react";

import { useAppStore } from "@/store";
import * as CardService from "../services/card.service";

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

    useEffect(() => {
        if (!user) {
            setState({ cards: [], loading: false, error: null });
            return;
        }

        const targetUserId = ownerId || user.uid;

        setState((prev) => ({ ...prev, loading: true, error: null }));

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
    }, [user, lessonId, ownerId]);

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

    const reorderCard = useCallback(
        async (cardId: string, newOrder: number): Promise<void> => {
            if (!user) return;
            await CardService.reorderCard(user.uid, cardId, newOrder);
        },
        [user],
    );

    const resetCard = useCallback(
        async (cardId: string): Promise<void> => {
            if (!user) return;
            await CardService.resetCardProgress(user.uid, cardId);
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
        reorderCard,
        resetCard,
        resetLesson,
    };
}
