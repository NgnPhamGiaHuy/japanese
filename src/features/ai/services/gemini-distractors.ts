/**
 * @file gemini-distractors
 * Match-mode decoy tile generation — split out of gemini.service.ts
 * (E11-T3). Self-contained: its own fallback word lists and semantic
 * filtering, only sharing the transport layer with the other generate*
 * functions.
 */
import { extractJSON, generateContent } from "./gemini-transport";
import { AI_CONFIG } from "../config";
import { getMatchDistractorsPrompt } from "../prompts/match.distractors";

/** Minimal card shape this service needs — avoids depending on flashcard's full FlashCard type. */
interface DistractorSourceCard {
    primary: string;
    alternatives?: string[];
    meaning: string;
}

/**
 * Decoy tiles: visually/semantically similar to pool content; deduped against targets.
 * Strictly separates Japanese and English to prevent mixed-language tiles.
 */
export const generateMatchDistractors = async (
    cards: DistractorSourceCard[],
    count: number,
): Promise<string[]> => {
    const safeCount = Math.min(Math.max(count, 1), 24);
    const clean = (s: string) => s.split(/[/(,]/)[0].trim();
    const nl = (s: string) => s.trim().toLowerCase();

    // 1. Precise board representation (match exactly what is on the grid)
    const existingTiles = Array.from(
        new Set(
            cards.flatMap((c) => [clean(c.primary), clean(c.meaning)]).filter((s) => s.length > 0),
        ),
    );

    // 2. Semantic blocklist for final validation
    const semanticBlocklist = new Set<string>();
    cards.forEach((c) => {
        [c.primary, ...(c.alternatives || []), c.meaning].forEach((val) => {
            if (!val) return;
            semanticBlocklist.add(nl(val));
            semanticBlocklist.add(nl(clean(val)));
        });
    });

    const prompt = getMatchDistractorsPrompt(existingTiles, safeCount);

    const fallbacksJapanese = [
        "シート",
        "ツール",
        "ぬいぐるみ",
        "めがね",
        "あさ",
        "ばん",
        "みず",
        "おちゃ",
        "ほん",
        "ぺん",
        "いえ",
        "くるま",
    ];
    const fallbacksEnglish = [
        "Table",
        "Chair",
        "Phone",
        "Watch",
        "Tree",
        "Road",
        "Sky",
        "Cloud",
        "Apple",
        "Bread",
        "City",
        "Home",
    ];

    let rawList: string[] = [];
    try {
        const text = await generateContent(AI_CONFIG.models.card, prompt);
        const raw = JSON.parse(extractJSON(text)) as { distractors?: unknown };
        const list = Array.isArray(raw.distractors) ? raw.distractors : [];
        rawList = list
            .filter((d): d is string => typeof d === "string" && d.length > 0)
            .map((d) => clean(d));
    } catch {
        rawList = [];
    }

    const out: string[] = [];
    const taken = new Set(semanticBlocklist);

    // 3. Post-process AI results with strict semantic filtering
    const candidatePool = [...rawList, ...fallbacksEnglish, ...fallbacksJapanese];

    for (const candidate of candidatePool) {
        if (out.length >= safeCount) break;
        const normalized = nl(candidate);

        // Strict duplication check
        let isDuplicate = taken.has(normalized);
        if (!isDuplicate) {
            // Check for partial collisions (e.g. "Sorry" vs "I'm sorry")
            for (const blocked of taken) {
                if (
                    blocked.length > 3 &&
                    (blocked.includes(normalized) || normalized.includes(blocked))
                ) {
                    isDuplicate = true;
                    break;
                }
            }
        }

        if (!isDuplicate) {
            taken.add(normalized);
            out.push(candidate);
        }
    }

    // 4. Absolute emergency fallback
    while (out.length < safeCount) {
        const fallback = `Item ${out.length + 1}`;
        out.push(fallback);
    }

    return out;
};
