/**
 * @file gridBuilder — Pure Grid Construction Logic
 *
 * @remarks
 * Responsibilities:
 * - Build shuffled grid from cards and distractors
 * - Prepare match session data
 * - Pure functions only — NO side effects
 *
 * NO state, NO hooks, NO services.
 */

import { generateMatchDistractors } from "@/features/ai";
import { shuffleArray } from "@/shared/utils";

import type { MatchItem } from "@/features/flashcard/core/hooks";
import type { FlashCard } from "@/features/flashcard/core/types";
import type { DifficultyConfig } from "@/features/game/modes";

const MIN_PAIRS = 4;
const MAX_PAIRS = 12;

/**
 * Clean and normalize text for deduplication
 */
function clean(s: string): string {
    return s.split(/[/(,]/)[0].trim();
}

/**
 * Normalize for case-insensitive comparison
 */
function normalize(s: string): string {
    return s.trim().toLowerCase();
}

/**
 * Build grid items from card pool and distractors
 *
 * @remarks
 * Pure function — deterministic output for given inputs.
 * Handles distractor deduplication to prevent accidental matches.
 */
export function buildGridItems(pool: FlashCard[], distractorLabels: string[]): MatchItem[] {
    const items: MatchItem[] = [];
    const occupied = new Set<string>();

    // Add real pairs
    for (const card of pool) {
        const pairId = card.id;
        const valA = clean(card.primary);
        const valB = clean(card.meaning);

        items.push({ id: `${pairId}-a`, pairId, value: valA, isDistractor: false });
        items.push({ id: `${pairId}-b`, pairId, value: valB, isDistractor: false });

        occupied.add(normalize(valA));
        occupied.add(normalize(valB));
    }

    // Add distractors with collision avoidance
    for (let i = 0; i < distractorLabels.length; i++) {
        let text = distractorLabels[i]?.trim() ?? "";
        let guard = 0;

        // Fallback to numeric label on collision
        while (guard < 40 && (!text || occupied.has(normalize(text)))) {
            text = `${i + 1}${guard ? `(${guard})` : ""}`;
            guard++;
        }

        occupied.add(normalize(text));
        const id = `dist-${i}-${Math.random().toString(36).slice(2, 9)}`;
        items.push({ id, value: text, isDistractor: true });
    }

    return shuffleArray(items);
}

/**
 * Prepare complete match session
 *
 * @remarks
 * Async function that coordinates card selection, AI distractor generation,
 * and grid building. Returns all data needed to start a match session.
 */
export async function prepareMatchSession(
    cards: FlashCard[],
    config: DifficultyConfig,
): Promise<{
    pairCount: number;
    gridItems: MatchItem[];
}> {
    // Clamp pair count to valid range
    const clampedPairs = Math.min(
        Math.max(Math.min(config.pairs, cards.length), MIN_PAIRS),
        MAX_PAIRS,
    );

    if (clampedPairs < 1) {
        throw new Error("Insufficient cards for match game");
    }

    // Select random card pool
    const pool = shuffleArray([...cards]).slice(0, clampedPairs);

    // Generate AI distractors if configured
    let distractorLabels: string[] = [];
    if (config.distractorTiles > 0) {
        try {
            distractorLabels = await generateMatchDistractors(pool, config.distractorTiles);
        } catch (err) {
            console.warn("[MatchEngine] Distractor generation failed, using fallback:", err);
            // Continue without distractors — game is still playable
        }
    }

    // Build final grid
    const gridItems = buildGridItems(pool, distractorLabels);

    return {
        pairCount: pool.length,
        gridItems,
    };
}
