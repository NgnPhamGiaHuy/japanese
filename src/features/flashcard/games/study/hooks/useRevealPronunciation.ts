"use client";

import { useEffect, useRef } from "react";

import { sequence } from "@/shared/audio";
import { getAudioText } from "../../../utils/displayEngine";

import type { FlashCard } from "../../../types";

/**
 * Speaks the card once, on the transition into the revealed state.
 *
 * @remarks
 * All three flashcard players had their own copy of this effect, each with its own edge-detector
 * ref. The edge detection matters: without it, any re-render that changes the card's identity —
 * a live Firestore patch, a queue re-insertion — would re-speak a card the learner is still
 * looking at.
 *
 * The 250ms delay lands the voice at the midpoint of the 500ms flip, so the word is spoken as its
 * text becomes legible rather than while the card is still edge-on.
 */
const FLIP_MIDPOINT_MS = 250;

export function useRevealPronunciation(
    revealed: boolean,
    card: FlashCard | undefined,
    source: string,
): void {
    const wasRevealedRef = useRef(false);

    useEffect(() => {
        const justRevealed = revealed && !wasRevealedRef.current;
        if (justRevealed && card) {
            void sequence(
                "flashcard-reveal",
                [
                    { waitMs: FLIP_MIDPOINT_MS },
                    { speak: { text: getAudioText(card), options: { trigger: "auto", source } } },
                ],
                { policy: "replace" },
            );
        }
        wasRevealedRef.current = revealed;
    }, [revealed, card, source]);
}
