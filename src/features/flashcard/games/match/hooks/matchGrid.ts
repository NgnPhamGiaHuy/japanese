/**
 * @file matchGrid
 * Pure grid-building logic for Match Mode — split out of
 * useMatchModeSession.ts (E11-T4). No React/hooks dependency.
 */
import { shuffleArray } from "@/shared/utils";

import type { MatchItem } from "./useMatchGameStore";
import type { FlashCard } from "../../../types";

/**
 * Builds the shuffled grid of tiles from a card pool and optional AI distractors.
 *
 * @remarks
 * Each card produces two tiles: primary (-a) and meaning (-b).
 * Distractor labels are deduplicated against occupied values to prevent
 * accidental matches. A guard loop prevents infinite loops on collision.
 *
 * @param pool - Cards selected for this round.
 * @param distractorLabels - AI-generated decoy strings.
 * @returns Shuffled flat array of MatchItem tiles.
 */
export function buildGridItems(pool: FlashCard[], distractorLabels: string[]): MatchItem[] {
    const clean = (s: string) => s.split(/[/(,]/)[0].trim();
    const nl = (s: string) => s.trim().toLowerCase();
    const items: MatchItem[] = [];
    const occupied = new Set<string>();

    for (const card of pool) {
        const pairId = card.id;
        const valA = clean(card.primary);
        const valB = clean(card.meaning);
        items.push({ id: `${pairId}-a`, pairId, value: valA, isDistractor: false });
        items.push({ id: `${pairId}-b`, pairId, value: valB, isDistractor: false });
        occupied.add(nl(valA));
        occupied.add(nl(valB));
    }

    for (let i = 0; i < distractorLabels.length; i++) {
        let text = distractorLabels[i]?.trim() ?? "";
        let guard = 0;
        // Fallback to numeric label when text collides with an existing tile value.
        while (guard < 40 && (!text || occupied.has(nl(text)))) {
            text = `${i + 1}${guard ? `(${guard})` : ""}`;
            guard++;
        }
        occupied.add(nl(text));
        const id = `dist-${i}-${Math.random().toString(36).slice(2, 9)}`;
        items.push({ id, value: text, isDistractor: true });
    }

    return shuffleArray(items);
}
