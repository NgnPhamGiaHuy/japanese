"use client";

import { useEffect, useState } from "react";

import useAICard from "./useAICard";

interface ExplainableCard {
    id: string;
    hint?: string;
}

/**
 * Lazy-loads an AI-generated mnemonic ("Memory Tip") for a card.
 * Triggers generation only when the card is first revealed to optimize token usage.
 * Resets when the card changes so each card gets its own fresh tip.
 *
 * @param card - The target card (only `id`/`hint` are read)
 * @param audioText - Text to send to the AI when no hint already exists on the card
 * @param revealed - Reveal flag (trigger)
 */
const useAIExplanation = (
    card: ExplainableCard | undefined,
    audioText: string,
    revealed: boolean,
) => {
    const { generate, status, error } = useAICard();
    const aiLoading = status === "loading";
    const [explanation, setExplanation] = useState<string | null>(null);

    // Reset explanation whenever the card changes so the previous card's tip
    // doesn't bleed into the next card.
    useEffect(() => {
        setExplanation(null);
    }, [card?.id]);

    useEffect(() => {
        if (!revealed || !card) return;
        // Don't re-fetch if we already have a tip for this card
        if (explanation !== null) return;
        if (card.hint) {
            setExplanation(card.hint);
        } else {
            generate(audioText).then((result) => {
                if (result?.hint) setExplanation(result.hint);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revealed, card?.id]);

    return { explanation, loading: aiLoading, error };
};

export default useAIExplanation;
