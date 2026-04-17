/**
 * @file pairResolver — Pure Pair Resolution Logic
 *
 * @remarks
 * Responsibilities:
 * - Determine if two tiles form a valid pair
 * - Calculate points and combo bonuses
 * - Trigger SRS grading and audio
 * - Return resolution result
 *
 * NO state mutations, NO direct store access.
 */

import { gradeCard } from "@/features/flashcard/core/services";
import { getAudioText } from "@/features/flashcard/core/utils";
import { calcMatchPoints, comboLabel, WRONG_PENALTY } from "@/features/game/modes";
import { allowAudio, playAudio, playSFX } from "@/shared/utils";

import type { MatchItem } from "@/features/flashcard/core/hooks";
import type { FlashCard } from "@/features/flashcard/core/types";

export interface PairResolutionResult {
    isMatch: boolean;
    points: number;
    penalty: number;
    newStreak: number;
    pairId?: string;
    comboLabel?: string;
}

/**
 * Resolve a pair of selected tiles
 *
 * @remarks
 * Pure logic with controlled side effects (audio, SRS).
 * Returns result object for parent to handle state updates.
 */
export function resolvePair(
    idA: string,
    idB: string,
    grid: MatchItem[],
    cards: FlashCard[],
    userId: string | undefined,
    currentStreak: number,
): PairResolutionResult {
    const a = grid.find((c) => c.id === idA);
    const b = grid.find((c) => c.id === idB);

    if (!a || !b) {
        return {
            isMatch: false,
            points: 0,
            penalty: 0,
            newStreak: 0,
        };
    }

    const isMatch = !a.isDistractor && !b.isDistractor && a.pairId != null && a.pairId === b.pairId;

    if (isMatch) {
        // ── Match Path ─────────────────────────────────────────────────────
        playSFX("correct");

        const newStreak = currentStreak + 1;
        const points = calcMatchPoints(newStreak);
        const label = comboLabel(newStreak);

        // SRS grading (fire-and-forget)
        if (userId && a.pairId) {
            const card = cards.find((c) => c.id === a.pairId);
            if (card) {
                void gradeCard(userId, a.pairId, card, "Good").catch(() => {});

                // Audio pronunciation
                if (allowAudio("match", "feedback")) {
                    setTimeout(() => playAudio(getAudioText(card)), 300);
                }
            }
        }

        return {
            isMatch: true,
            points,
            penalty: 0,
            newStreak,
            pairId: a.pairId,
            comboLabel: label || undefined,
        };
    } else {
        // ── Miss Path ──────────────────────────────────────────────────────
        playSFX("wrong");

        return {
            isMatch: false,
            points: 0,
            penalty: WRONG_PENALTY,
            newStreak: 0,
        };
    }
}
