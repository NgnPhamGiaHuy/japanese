import type { FlashCard } from "../types";

export type DisplayMode = "learn" | "practice" | "challenge" | "game";
export type QuestionType =
    | "primary_to_meaning"
    | "alternative_to_primary"
    | "meaning_to_primary"
    | "example_to_primary";

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
        hint:
            context.mode === "learn" || context.mode === "practice" ? alt || undefined : undefined,
    };
}

export function getSupportedQuestionTypes(card: FlashCard): QuestionType[] {
    const types: QuestionType[] = ["primary_to_meaning", "meaning_to_primary"];
    if (pickAlternative(card)) types.push("alternative_to_primary");
    if (card.example?.trim()) types.push("example_to_primary");
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
    if (preferPrimary && d === 2)
        return Math.random() < 0.7 ? "primary_to_meaning" : "meaning_to_primary";
    if (hasAltToPrimary && d >= 3) {
        const hasExample = Boolean(card.example?.trim());
        const roll = Math.random();
        if (roll < 0.45) return "primary_to_meaning";
        if (roll < 0.72) return "meaning_to_primary";
        if (roll < 0.88 && hasExample) return "example_to_primary";
        if (hasAltToPrimary) return "alternative_to_primary";
        return "meaning_to_primary";
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
    if (type === "example_to_primary") {
        const ex = card.example.trim();
        const snippet = ex.length > 72 ? `${ex.slice(0, 69)}…` : ex;
        return { prompt: snippet, answer: pickPrimaryText(card) };
    }
    return { prompt: card.meaning, answer: pickPrimaryText(card) };
}

export type MatchDifficultyTier = 1 | 2 | 3 | 4;

/** One question-type for the whole round when pairType is `fixed` (no per-card mixing). */
export function pickFixedRoundQuestionType(
    cards: FlashCard[],
    difficultyTier: MatchDifficultyTier,
): QuestionType {
    const base = cards[0];
    if (!base) return "primary_to_meaning";
    const supported = getSupportedQuestionTypes(base);
    if (difficultyTier <= 2) {
        return supported.includes("primary_to_meaning") ? "primary_to_meaning" : supported[0];
    }
    if (difficultyTier === 3 && supported.includes("meaning_to_primary") && Math.random() < 0.35) {
        return "meaning_to_primary";
    }
    return "primary_to_meaning";
}

export function buildQuestionFallback(
    card: FlashCard,
    type: QuestionType,
): { prompt: string; answer: string } {
    if (type === "example_to_primary" && !card.example?.trim()) {
        return buildQuestion(card, "primary_to_meaning");
    }
    if (type === "alternative_to_primary" && !pickAlternative(card)) {
        return buildQuestion(card, "primary_to_meaning");
    }
    return buildQuestion(card, type);
}

/**
 * Picks a representation mapping per card (mixed Master uses interleaving).
 * When `pairType` is fixed, pass `fixedRoundType` from `pickFixedRoundQuestionType`.
 */
export function chooseMatchQuestionTypeForCard(
    card: FlashCard,
    pairType: "fixed" | "mixed",
    fixedRoundType: QuestionType,
    difficulty: MatchDifficultyTier,
    preferPrimary: boolean,
): QuestionType {
    if (pairType === "mixed") {
        return chooseQuestionType(card, { difficulty: Math.min(3, difficulty), preferPrimary });
    }
    return fixedRoundType;
}
