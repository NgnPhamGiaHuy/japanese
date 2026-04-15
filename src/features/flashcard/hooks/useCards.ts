"use client";

import { useCallback, useEffect, useReducer } from "react";

import { useAppStore } from "@/store";
import * as CardService from "../services/card.service";

import type { FlashCard } from "../types";

interface CardsState {
    cards: FlashCard[];
    loading: boolean;
    error: string | null;
}

type Action =
    | { type: "RESET" }
    | { type: "SET"; cards: FlashCard[] }
    | { type: "ERROR"; error: string };

function reducer(state: CardsState, action: Action): CardsState {
    switch (action.type) {
        case "RESET":
            return { cards: [], loading: true, error: null };
        case "SET":
            return { cards: action.cards, loading: false, error: null };
        case "ERROR":
            return { ...state, loading: false, error: action.error };
        default:
            return state;
    }
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

    const [state, dispatch] = useReducer(reducer, {
        cards: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        dispatch({ type: "RESET" });

        if (!user) return;

        const targetUserId = ownerId || user.uid;

        const unsubscribe = CardService.subscribeCards(
            targetUserId,
            (cards) => dispatch({ type: "SET", cards }),
            (err) => {
                console.error("[useCards] Firestore error:", err);
                dispatch({
                    type: "ERROR",
                    error: "Could not load cards. Please check your connection and try again.",
                });
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
        resetCard,
        resetLesson,
    };
}
