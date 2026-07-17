/**
 * @file gemini-dedup
 * Pure card-deduplication helpers for deck generation — split out of
 * gemini.service.ts (E11-T3). No Gemini/network dependency, so these are
 * directly unit-testable in isolation from the AI transport.
 */
import type { GeneratedCard } from "../types";

export function normalizeToken(value: string): string {
    return value.trim().toLocaleLowerCase();
}

function cardDedupKeys(card: GeneratedCard): string[] {
    const keys = [card.primary, ...(card.alternatives || [])]
        .map((value) => normalizeToken(value ?? ""))
        .filter((value) => value.length > 0);
    return Array.from(new Set(keys));
}

export function dedupeDeckCards(cards: GeneratedCard[], existingWords: string[]): GeneratedCard[] {
    const blocked = new Set(existingWords.map((word) => normalizeToken(word)).filter(Boolean));
    const seen = new Set<string>();
    const filtered: GeneratedCard[] = [];

    for (const card of cards) {
        const keys = cardDedupKeys(card);
        const collides = keys.some((key) => blocked.has(key) || seen.has(key));
        if (collides) continue;
        keys.forEach((key) => seen.add(key));
        filtered.push(card);
    }

    return filtered;
}
