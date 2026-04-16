;
/**
 * Intelligent card selection engine using weighted probability.
 *
 * @remarks
 * Selects next card based on error rate, response speed, recency, and difficulty alignment.
 * Uses weighted random selection to balance review needs with variety.
 */

/**
 * Intelligent card selection engine using weighted probability.
 *
 * @remarks
 * Selects next card based on error rate, response speed, recency, and difficulty alignment.
 * Uses weighted random selection to balance review needs with variety.
 */
/**
 * Intelligent card selection engine using weighted probability.
 *
 * @remarks
 * Selects next card based on error rate, response speed, recency, and difficulty alignment.
 * Uses weighted random selection to balance review needs with variety.
 */
import { shuffleArray } from "@/shared/utils";



import type { FlashCard } from "@/features/flashcard/types";
import type { CardMemoryManager } from "./CardMemoryManager";


const RECENT_MEMORY_WINDOW = 10;
const HARD_MIN_GAP = 3;
const EASY_MIN_GAP = 2;

/**
 * Weighted item for probabilistic selection.
 */
interface WeightedItem<T> {
    item: T;
    weight: number;
}

/**
 * Selects item using weighted random selection.
 *
 * @remarks
 * Higher weight = higher probability. Returns null if all weights are zero or negative.
 */
function weightedPick<T>(items: WeightedItem<T>[]): T | null {
    const total = items.reduce((sum, it) => sum + Math.max(0, it.weight), 0);
    if (total <= 0) return null;

    let r = Math.random() * total;
    for (const { item, weight } of items) {
        const w = Math.max(0, weight);
        if (r <= w) return item;
        r -= w;
    }

    return items[items.length - 1]?.item ?? null;
}

export class CardSelector {
    constructor(private readonly memory: CardMemoryManager) {}

    /**
     * Selects the next card to present based on memory state and constraints.
     *
     * @remarks
     * Applies multiple filters and scoring factors:
     * - Excludes recently shown cards (prevents repetition)
     * - Respects eligibility windows (spaced repetition)
     * - Prioritizes cards with high error rates
     * - Penalizes slow response times
     * - Boosts overdue cards
     * - Aligns with current difficulty level
     *
     * Falls back to a random card from the full pool when all candidates are
     * filtered out by recency/eligibility constraints, ensuring the game never stalls.
     * Returns null only when the card pool itself is empty.
     */
    selectNext(params: {
        cards: FlashCard[];
        recentIds: string[];
        level: number;
    }): FlashCard | null {
        const { cards, recentIds, level } = params;

        if (cards.length === 0) return null;

        const minGap = level >= 3 ? HARD_MIN_GAP : EASY_MIN_GAP;
        const bannedRecent = new Set(recentIds.slice(-Math.max(minGap, RECENT_MEMORY_WINDOW)));

        const memoryState = this.memory.getState() as Record<string, any>;
        const lastSeenValues = Object.values(memoryState)
            .map((s: any) => s.lastSeenAtQ as number)
            .filter((v) => Number.isFinite(v));
        const questionIndex = lastSeenValues.length > 0 ? Math.max(0, ...lastSeenValues) : 0;

        const scored = cards
            .filter((card) => !bannedRecent.has(card.id))
            .map((card) => {
                const state = memoryState[card.id];
                if (!state) return { item: card, weight: 1 };

                if (questionIndex < state.nextEligibleAtQ) {
                    return { item: card, weight: 0 };
                }

                const errorRate = state.seen === 0 ? 0.45 : state.wrong / Math.max(1, state.seen);
                const speedPenalty = Math.max(0, (state.avgResponseMs - 1700) / 1700);
                const recencyPenalty = Math.max(0, 1 - (questionIndex - state.lastSeenAtQ) / 6);
                const overdueBoost = Math.max(0, questionIndex - state.nextEligibleAtQ) * 0.05;

                const difficultyBias =
                    level === 3
                        ? card.difficulty === 3
                            ? 0.5
                            : 0.2
                        : level === 1
                          ? card.difficulty === 1
                              ? 0.4
                              : 0.15
                          : card.difficulty === 2
                            ? 0.35
                            : 0.2;

                const weight =
                    0.6 +
                    errorRate * 1.9 +
                    speedPenalty * 0.8 +
                    overdueBoost +
                    difficultyBias -
                    recencyPenalty;

                return { item: card, weight };
            });

        return weightedPick(scored) ?? shuffleArray([...cards])[0]!;
    }
}
