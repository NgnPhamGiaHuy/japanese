import { shuffleArray } from "@/shared/utils";
import { chooseQuestionType } from "../utils/displayEngine";

import type { FlashCard } from "../types";
import type { QuestionType } from "../utils/displayEngine";

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

export interface AnswerEvent {
    cardId: string;
    correct: boolean;
    responseMs: number;
}

export type AdaptiveLevel = 1 | 2 | 3;

const INITIAL_RESPONSE_MS = 2400;
const RECENT_MEMORY_WINDOW = 10;
const HARD_MIN_GAP = 3;
const EASY_MIN_GAP = 2;
const EMA_ALPHA = 0.25;

export function initCardMemory(cards: FlashCard[]): Record<string, CardMemoryState> {
    return Object.fromEntries(
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
            } satisfies CardMemoryState,
        ]),
    );
}

export function deriveAdaptiveDifficulty(
    streak: number,
    history: AnswerEvent[],
    fallback: AdaptiveLevel = 1,
): AdaptiveLevel {
    if (history.length === 0) return fallback;
    const recent = history.slice(-8);
    const accuracy = recent.filter((h) => h.correct).length / recent.length;
    const avgMs = recent.reduce((sum, h) => sum + h.responseMs, 0) / recent.length;

    if (accuracy >= 0.85 && avgMs <= 1600 && streak >= 3) return 3;
    if (accuracy <= 0.6 || avgMs >= 3000) return 1;
    return 2;
}

function getMeaningShape(meaning: string): "verb" | "adjective" | "other" {
    const m = meaning.trim().toLowerCase();
    if (m.startsWith("to ")) return "verb";
    if (m.startsWith("a ") || m.startsWith("an ")) return "adjective";
    return "other";
}

function lexicalScore(a: string, b: string): number {
    const x = a.toLowerCase();
    const y = b.toLowerCase();
    if (!x || !y) return 0;
    if (x === y) return 0;
    let score = 0;
    if (x[0] === y[0]) score += 0.35;
    if (x.slice(0, 2) === y.slice(0, 2)) score += 0.3;
    const overlap = [...new Set(x)].filter((ch) => y.includes(ch)).length;
    score += Math.min(0.35, overlap / Math.max(x.length, y.length));
    return score;
}

function weightedPick<T>(items: Array<{ item: T; weight: number }>): T | null {
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

export function pickNextCardFromMemory(params: {
    cards: FlashCard[];
    memory: Record<string, CardMemoryState>;
    questionIndex: number;
    recentShownIds: string[];
    reservedQueueIds?: string[];
    adaptiveLevel: AdaptiveLevel;
}): FlashCard | null {
    const {
        cards,
        memory,
        questionIndex,
        recentShownIds,
        reservedQueueIds = [],
        adaptiveLevel,
    } = params;
    const minGap = adaptiveLevel >= 3 ? HARD_MIN_GAP : EASY_MIN_GAP;
    const bannedRecent = new Set(recentShownIds.slice(-Math.max(minGap, RECENT_MEMORY_WINDOW)));
    const bannedReserved = new Set(reservedQueueIds.slice(-minGap));

    const scored = cards
        .filter((card) => !bannedRecent.has(card.id) && !bannedReserved.has(card.id))
        .map((card) => {
            const state = memory[card.id];
            if (!state) return { item: card, weight: 1 };
            if (questionIndex < state.nextEligibleAtQ) return { item: card, weight: 0 };

            const errorRate = state.seen === 0 ? 0.45 : state.wrong / Math.max(1, state.seen);
            const speedPenalty = Math.max(0, (state.avgResponseMs - 1700) / 1700);
            const recencyPenalty = Math.max(0, 1 - (questionIndex - state.lastSeenAtQ) / 6);
            const overdueBoost = Math.max(0, questionIndex - state.nextEligibleAtQ) * 0.05;
            const difficultyBias =
                adaptiveLevel === 3
                    ? card.difficulty === 3
                        ? 0.5
                        : 0.2
                    : adaptiveLevel === 1
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

    return weightedPick(scored) ?? null;
}

export function chooseAdaptiveQuestionType(
    card: FlashCard,
    adaptiveLevel: AdaptiveLevel,
): QuestionType {
    return chooseQuestionType(card, {
        difficulty: adaptiveLevel,
        preferPrimary: adaptiveLevel <= 2,
    });
}

export function buildSmartDistractors(params: {
    allCards: FlashCard[];
    currentCard: FlashCard;
    answer: string;
    questionType: QuestionType;
    memory: Record<string, CardMemoryState>;
}): string[] {
    const { allCards, currentCard, answer, questionType, memory } = params;
    const useMeaning = questionType === "primary_to_meaning";
    const targetShape = useMeaning ? getMeaningShape(currentCard.meaning) : "other";
    const confusion = memory[currentCard.id]?.confusionWith ?? {};

    const candidates = allCards
        .filter((c) => c.id !== currentCard.id)
        .map((c) => {
            const value = useMeaning ? c.meaning : c.primary;
            return { card: c, value: value?.trim() ?? "" };
        })
        .filter((c) => c.value && c.value !== answer);

    const scored = candidates.map(({ card, value }) => {
        const semantic = useMeaning && getMeaningShape(value) === targetShape ? 0.45 : 0.05;
        const lexical = lexicalScore(answer, value) * 0.35;
        const confusionBoost = Math.min(0.7, (confusion[value] ?? 0) * 0.25);
        const difficultyBoost =
            card.difficulty && currentCard.difficulty && card.difficulty === currentCard.difficulty
                ? 0.15
                : 0.05;
        return { value, score: semantic + lexical + confusionBoost + difficultyBoost };
    });

    const sorted = scored.sort((a, b) => b.score - a.score).map((s) => s.value);
    const unique = Array.from(new Set(sorted));
    const chosen = unique.slice(0, 3);
    if (chosen.length < 3) {
        const fallback = shuffleArray(
            candidates.map((c) => c.value).filter((v) => !chosen.includes(v)),
        ).slice(0, 3 - chosen.length);
        chosen.push(...fallback);
    }
    return chosen.slice(0, 3);
}

export function recordMemoryOutcome(params: {
    memory: Record<string, CardMemoryState>;
    cardId: string;
    questionIndex: number;
    correct: boolean;
    responseMs: number;
    mistakenChoice?: string | null;
}): void {
    const { memory, cardId, questionIndex, correct, responseMs, mistakenChoice } = params;
    const state = memory[cardId];
    if (!state) return;

    state.seen += 1;
    state.lastSeenAtQ = questionIndex;
    state.avgResponseMs = state.avgResponseMs + EMA_ALPHA * (responseMs - state.avgResponseMs);

    if (correct) {
        state.correct += 1;
        state.streakOnCard += 1;
        state.ease = Math.min(2.3, state.ease + 0.07);
        state.stability = Math.min(10, state.stability + 0.4);
        state.nextEligibleAtQ = questionIndex + Math.max(2, Math.round(2 + state.stability * 0.55));
    } else {
        state.wrong += 1;
        state.streakOnCard = 0;
        state.ease = Math.max(0.7, state.ease - 0.12);
        state.stability = Math.max(0.8, state.stability * 0.82);
        state.nextEligibleAtQ = questionIndex + 2;
        if (mistakenChoice) {
            state.confusionWith[mistakenChoice] = (state.confusionWith[mistakenChoice] ?? 0) + 1;
        }
    }
}
