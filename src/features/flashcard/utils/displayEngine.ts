import type { FlashCard } from "../types";

export type DisplayMode = "learn" | "practice" | "challenge" | "game";
export type QuestionType = "primary_to_meaning" | "alternative_to_primary" | "meaning_to_primary";

function pickPrimaryText(card: FlashCard): string {
    return card.primary || card.alternatives[0] || "";
}

export function getAudioText(card: FlashCard): string {
    return pickPrimaryText(card);
}

function pickAlternative(card: FlashCard): string | null {
    return card.alternatives.find((value) => value && value !== card.primary) || null;
}

export function resolveDisplay(
    card: FlashCard,
    context: { mode: DisplayMode; difficulty: number },
) {
    const alt = pickAlternative(card);
    return {
        // Retrieval-first: keep primary as default target across study modes.
        question: pickPrimaryText(card),
        answer: card.meaning,
        hint: context.mode === "learn" || context.mode === "practice" ? alt || undefined : undefined,
    };
}

export function getSupportedQuestionTypes(card: FlashCard): QuestionType[] {
    const types: QuestionType[] = ["primary_to_meaning", "meaning_to_primary"];
    if (pickAlternative(card)) types.push("alternative_to_primary");
    return types;
}

export function chooseQuestionType(
    card: FlashCard,
    options: { difficulty: number; preferPrimary?: boolean },
): QuestionType {
    const types = getSupportedQuestionTypes(card);
    const hasAltToPrimary = types.includes("alternative_to_primary");
    const d = options.difficulty;
    const preferPrimary = options.preferPrimary ?? true;

    if (preferPrimary && d <= 1) return "primary_to_meaning";
    if (preferPrimary && d === 2) return Math.random() < 0.7 ? "primary_to_meaning" : "meaning_to_primary";
    if (hasAltToPrimary && d >= 3) {
        const roll = Math.random();
        if (roll < 0.55) return "primary_to_meaning";
        if (roll < 0.8) return "meaning_to_primary";
        return "alternative_to_primary";
    }
    return Math.random() < 0.6 ? "primary_to_meaning" : "meaning_to_primary";
}

export function buildQuestion(
    card: FlashCard,
    type: QuestionType,
): { prompt: string; answer: string } {
    if (type === "primary_to_meaning") {
        return { prompt: pickPrimaryText(card), answer: card.meaning };
    }
    if (type === "alternative_to_primary") {
        return {
            prompt: pickAlternative(card) || pickPrimaryText(card),
            answer: pickPrimaryText(card),
        };
    }
    return { prompt: card.meaning, answer: pickPrimaryText(card) };
}
