import { shuffleArray } from "@/shared/utils";
import { VISUAL_GROUPS } from "../data";

import type { KanaChar } from "../types";

/**
 * Builds visually and phonetically similar distractors for a target character.
 *
 * @remarks
 * Prioritises characters from the same visual group and phonetic group.
 * Falls back to random dataset characters when the pool is too small.
 *
 * `pool` is deduped against the target by character and romaji, but not
 * against itself — with hiragana/katakana combined (AlphabetMode "both"),
 * two different characters can share a romaji (e.g. こ/コ both "ko"), so the
 * final selection dedupes on romaji to keep every rendered option unique.
 *
 * Kept dependency-free (no React, no Firestore-backed hooks) so it can be
 * unit tested directly — see speedRules.ts for the same pattern.
 */
export function buildDistractors(target: KanaChar, dataset: KanaChar[]): KanaChar[] {
    const visualMatch = VISUAL_GROUPS.find((g) => g.includes(target.char)) ?? [];
    const phoneticMatch = dataset.filter((i) => i.group === target.group).map((i) => i.char);

    let pool = dataset.filter(
        (i) =>
            i.char !== target.char &&
            i.romaji !== target.romaji &&
            (visualMatch.includes(i.char) || phoneticMatch.includes(i.char)),
    );

    if (pool.length < 3) {
        const remaining = dataset.filter(
            (i) =>
                i.char !== target.char &&
                i.romaji !== target.romaji &&
                !pool.some((p) => p.char === i.char),
        );
        pool = [...pool, ...shuffleArray(remaining)];
    }

    const usedRomaji = new Set<string>([target.romaji]);
    const distractors: KanaChar[] = [];
    for (const candidate of shuffleArray(pool)) {
        if (distractors.length === 3) break;
        if (usedRomaji.has(candidate.romaji)) continue;
        usedRomaji.add(candidate.romaji);
        distractors.push(candidate);
    }

    return distractors;
}
