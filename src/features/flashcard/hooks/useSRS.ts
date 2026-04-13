"use client";

import { useCallback } from "react";

import { useAppStore } from "@/store/useAppStore";
import * as CardService from "../services/card.service";

import type { FlashCard } from "../types/flashcard.types";

export function useSRS(cards: FlashCard[] = []) {
    const user = useAppStore((s) => s.user);

    const dueCards = cards.filter((c) => c.nextReviewAt <= Date.now());
    const newCards = cards.filter((c) => c.repetitions === 0);

    const processReview = useCallback(
        async (card: FlashCard, knew: boolean): Promise<void> => {
            if (!user) return;
            await CardService.updateCardProgress(user.uid, card.id, card, knew);
        },
        [user],
    );

    return {
        dueCards,
        newCards,
        processReview,
    };
}
