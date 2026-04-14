"use client";

import { useCallback, useEffect, useState } from "react";

import { useAppStore } from "@/store";
import * as CardService from "../services/card.service";

import type { FlashCard } from "../types";

interface CardsState {
    cards: FlashCard[];
    loading: boolean;
    error: string | null;
}

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
