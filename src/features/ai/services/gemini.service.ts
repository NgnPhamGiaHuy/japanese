/**
 * @file gemini.service
 * Public AI generation API — orchestrates the transport (gemini-transport),
 * parsing (gemini-parsing), and dedup (gemini-dedup) modules into the
 * generateCardData/generateDeck/generateDeckFromImages functions consumers
 * import. Split from a single 416-line file (E11-T3); this file re-exports
 * everything the pre-split module exported so every existing import path
 * (`@/features/ai/services/gemini.service`) keeps working unchanged.
 */
import { splitAtomicPrimary, validateAtomicCard } from "@/shared/utils";
import { dedupeDeckCards, normalizeToken } from "./gemini-dedup";
import { AIServiceError, classifyError, parseCard, parseCardArray } from "./gemini-parsing";
import { extractJSON, generateContent, generateMultimodalContent } from "./gemini-transport";
import { getCardGenerationPrompt, getDeckGenerationPrompt } from "./prompt-builder";
import { AI_CONFIG } from "../config";

import type { GeneratedCard, JLPTLevel } from "../types";

export { AIServiceError } from "./gemini-parsing";
export { generateMatchDistractors } from "./gemini-distractors";
export type { GeneratedCard, JLPTLevel } from "../types";

const cardCache = new Map<string, GeneratedCard>();
const deckCache = new Map<string, GeneratedCard[]>();

export const generateCardData = async (word: string): Promise<GeneratedCard> => {
    const trimmed = word.trim();
    if (!trimmed) throw new AIServiceError("Word cannot be empty", "api_error");

    const cacheKey = trimmed.toLowerCase();
    const cached = cardCache.get(cacheKey);
    if (cached) return cached;

    try {
        const text = await generateContent(AI_CONFIG.models.card, getCardGenerationPrompt(trimmed));
        const card = parseCard(JSON.parse(extractJSON(text)));

        // Validate atomic card principle; if violated, split and return first atomic card
        const validation = validateAtomicCard(card);
        if (!validation.valid) {
            const atomicPrimaries = splitAtomicPrimary(card.primary);
            if (atomicPrimaries.length > 0) {
                const atomicCard: GeneratedCard = { ...card, primary: atomicPrimaries[0] };
                cardCache.set(cacheKey, atomicCard);
                return atomicCard;
            }
        }

        cardCache.set(cacheKey, card);
        return card;
    } catch (err) {
        classifyError(err);
    }
};

export const generateDeck = async (
    topic: string,
    count: number,
    level: JLPTLevel,
    existingWords: string[] = [],
): Promise<GeneratedCard[]> => {
    const trimmed = topic.trim();
    if (!trimmed) throw new AIServiceError("Topic cannot be empty", "api_error");

    const safeCnt = Math.min(
        Math.max(count, AI_CONFIG.limits.minDeckCards),
        AI_CONFIG.limits.maxDeckCards,
    );
    const normalizedExclusions = Array.from(
        new Set(existingWords.map((word) => normalizeToken(word)).filter(Boolean)),
    ).sort();
    const cacheKey = `${trimmed.toLowerCase()}::${safeCnt}::${level}::${normalizedExclusions.join("|")}`;
    const cached = deckCache.get(cacheKey);
    if (cached) return cached;

    try {
        const text = await generateContent(
            AI_CONFIG.models.deck,
            getDeckGenerationPrompt(trimmed, safeCnt, level, normalizedExclusions),
        );
        const rawCards = parseCardArray(JSON.parse(extractJSON(text)));

        // 1. Split non-atomic cards
        const splitCards: GeneratedCard[] = [];
        for (const card of rawCards) {
            const validation = validateAtomicCard(card);
            if (!validation.valid) {
                const atomicPrimaries = splitAtomicPrimary(card.primary);
                splitCards.push(
                    ...(atomicPrimaries.length > 0
                        ? atomicPrimaries.map((p) => ({ ...card, primary: p }))
                        : [card]),
                );
            } else splitCards.push(card);
        }

        // 2. Deduplicate against existing and within the new set
        const atomicCards = dedupeDeckCards(splitCards, normalizedExclusions);

        deckCache.set(cacheKey, atomicCards);
        return atomicCards;
    } catch (err) {
        classifyError(err);
    }
};

export const generateDeckFromImages = async (
    files: File[],
    context?: { userLevel?: string },
    existingWords: string[] = [],
): Promise<{ title: string; description: string; cards: GeneratedCard[] }> => {
    if (files.length === 0) throw new AIServiceError("No images provided", "api_error");

    const { getDeckFromImagesPrompt } = await import("./prompt-builder");
    const prompt = getDeckFromImagesPrompt(context);

    try {
        const text = await generateMultimodalContent(AI_CONFIG.models.deck, prompt, files);
        const data = JSON.parse(extractJSON(text));

        const title = data.title || "Image Discovery Deck";
        const description = data.description || "Generated from uploaded images";
        const rawCards = parseCardArray(data.cards || []);

        const normalizedExclusions = Array.from(
            new Set(existingWords.map((word) => normalizeToken(word)).filter(Boolean)),
        );

        // 1. Split non-atomic cards
        const splitCards: GeneratedCard[] = [];
        for (const card of rawCards) {
            const validation = validateAtomicCard(card);
            if (!validation.valid) {
                const atomicPrimaries = splitAtomicPrimary(card.primary);
                splitCards.push(
                    ...(atomicPrimaries.length > 0
                        ? atomicPrimaries.map((p) => ({ ...card, primary: p }))
                        : [card]),
                );
            } else splitCards.push(card);
        }

        // 2. Deduplicate
        const atomicCards = dedupeDeckCards(splitCards, normalizedExclusions);

        return { title, description, cards: atomicCards };
    } catch (err) {
        classifyError(err);
    }
};
