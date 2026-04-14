/**
 * @file cardDisplay.ts
 * Stage-aware display resolution for flashcards.
 *
 * Learning Stage Logic:
 *   kana  (rep 0–2):  Show kana only — build pronunciation + familiarity
 *   mixed (rep 3–6):  Show kana + altForm together — connect the two forms
 *   kanji (rep 7+):   Show altForm only — full recall, no scaffolding
 *
 * altForm: romaji for N4/N5 words, kanji for N3 and above.
 */

import type { FlashCard } from "../types";

export type LearningStage = "kana" | "mixed" | "kanji";

/** Returns the spoken/kana form — throws if missing (fail fast). */
export function getPrimary(card: FlashCard): string {
    if (!card.kanaPrimary) {
        throw new Error(`[cardDisplay] Card ${card.id} is missing required kanaPrimary field`);
    }
    return card.kanaPrimary;
}

/** Returns altForm only when it exists and differs from kanaPrimary. */
export function getAltForm(card: FlashCard): string | null {
    const alt = card.altForm || null;
    if (!alt) return null;
    return alt !== card.kanaPrimary ? alt : null;
}

/**
 * Derives the learning stage from SRS repetition count.
 * altForm is only introduced after the learner has seen the kana form multiple times.
 */
export function getLearningStage(card: FlashCard): LearningStage {
    if (!getAltForm(card)) return "kana";
    const rep = card.repetitions ?? 0;
    if (rep < 3) return "kana";
    if (rep < 7) return "mixed";
    return "kanji";
}

/** Resolves the primary display text for the front of a card. */
export function getDisplayFront(card: FlashCard, stage: LearningStage): string {
    switch (stage) {
        case "kana":
            return getPrimary(card);
        case "mixed":
        case "kanji":
            return getAltForm(card) || getPrimary(card);
    }
}

/**
 * Returns furigana to show above kanji in mixed stage only.
 * Only applies when altForm contains CJK kanji characters.
 */
export function getDisplayFurigana(card: FlashCard, stage: LearningStage): string | null {
    if (stage !== "mixed") return null;
    const alt = getAltForm(card);
    if (!alt || !card.furigana) return null;
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(alt)) return card.furigana;
    return null;
}

/**
 * Returns the kana subtitle shown below the main text in mixed stage.
 */
export function getKanaSubtitle(card: FlashCard, stage: LearningStage): string | null {
    if (stage !== "mixed") return null;
    return getPrimary(card);
}

/** Returns the audio text — always the spoken/kana form. */
export function getAudioText(card: FlashCard): string {
    return getPrimary(card);
}

/** Returns a human-readable label for the current learning stage. */
export function getStageBadge(stage: LearningStage): { label: string; color: string } {
    switch (stage) {
        case "kana":
            return { label: "Kana", color: "#1cb0f6" };
        case "mixed":
            return { label: "Mixed", color: "#ff9600" };
        case "kanji":
            return { label: "Kanji", color: "#ce82ff" };
    }
}
