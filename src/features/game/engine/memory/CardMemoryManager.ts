/**
 * Manages spaced repetition memory state for flashcards.
 *
 * @remarks
 * Tracks performance metrics per card to enable adaptive difficulty and intelligent
 * card selection. Uses exponential moving average for response times and stability-based
 * scheduling similar to SM-2 algorithm.
 */

import type { FlashCard } from "@/features/flashcard/core/types";

const INITIAL_RESPONSE_MS = 2400;
const EMA_ALPHA = 0.25;

/**
 * Memory state for a single flashcard.
 *
 * @remarks
 * Tracks both short-term performance (streaks, recent responses) and long-term
 * retention metrics (ease, stability) for spaced repetition scheduling.
 */
export interface CardMemoryState {
    seen: number;
    correct: number;
    wrong: number;
    avgResponseMs: number;
    streakOnCard: number;
    lastSeenAtQ: number;
    nextEligibleAtQ: number;
    ease: number;
    stability: number;
    confusionWith: Record<string, number>;
}

export class CardMemoryManager {
    private memory: Record<string, CardMemoryState> = {};

    constructor(cards: FlashCard[]) {
        this.initializeMemory(cards);
    }

    /**
     * Records the outcome of answering a card.
     *
     * @remarks
     * Updates all memory metrics using exponential moving average for response time,
     * adjusts ease and stability factors, and tracks confusion patterns for smart
     * distractor generation.
     */
    recordOutcome(params: {
        cardId: string;
        questionIndex: number;
        correct: boolean;
        responseMs: number;
        mistakenChoice?: string | null;
    }): void {
        const { cardId, questionIndex, correct, responseMs, mistakenChoice } = params;
        const state = this.memory[cardId];
        if (!state) return;

        state.seen += 1;
        state.lastSeenAtQ = questionIndex;
        state.avgResponseMs = state.avgResponseMs + EMA_ALPHA * (responseMs - state.avgResponseMs);

        if (correct) {
            state.correct += 1;
            state.streakOnCard += 1;
            state.ease = Math.min(2.3, state.ease + 0.07);
            state.stability = Math.min(10, state.stability + 0.4);
            state.nextEligibleAtQ =
                questionIndex + Math.max(2, Math.round(2 + state.stability * 0.55));
        } else {
            state.wrong += 1;
            state.streakOnCard = 0;
            state.ease = Math.max(0.7, state.ease - 0.12);
            state.stability = Math.max(0.8, state.stability * 0.82);
            state.nextEligibleAtQ = questionIndex + 2;

            if (mistakenChoice) {
                state.confusionWith[mistakenChoice] =
                    (state.confusionWith[mistakenChoice] ?? 0) + 1;
            }
        }
    }

    getState(cardId?: string): Record<string, CardMemoryState> | CardMemoryState | undefined {
        return cardId ? this.memory[cardId] : this.memory;
    }

    reset(): void {
        Object.values(this.memory).forEach((state) => {
            state.seen = 0;
            state.correct = 0;
            state.wrong = 0;
            state.avgResponseMs = INITIAL_RESPONSE_MS;
            state.streakOnCard = 0;
            state.lastSeenAtQ = -Infinity;
            state.nextEligibleAtQ = 0;
            state.ease = 1.0;
            state.stability = 1.0;
            state.confusionWith = {};
        });
    }

    /**
     * Initializes memory state for all cards with default values.
     *
     * @remarks
     * Sets conservative defaults: moderate response time estimate, neutral ease,
     * low stability. These values adapt quickly based on actual performance.
     */
    private initializeMemory(cards: FlashCard[]): void {
        this.memory = Object.fromEntries(
            cards.map((card) => [
                card.id,
                {
                    seen: 0,
                    correct: 0,
                    wrong: 0,
                    avgResponseMs: INITIAL_RESPONSE_MS,
                    streakOnCard: 0,
                    lastSeenAtQ: -Infinity,
                    nextEligibleAtQ: 0,
                    ease: 1.0,
                    stability: 1.0,
                    confusionWith: {},
                },
            ]),
        );
    }
}
