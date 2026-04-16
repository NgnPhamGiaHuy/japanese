/**
 * Generates intelligent distractors for multiple-choice questions.
 * 
 * @remarks
 * Uses semantic similarity, lexical overlap, and confusion history to create
 * plausible wrong answers that test genuine understanding rather than random guessing.
 */

import { shuffleArray } from "@/shared/utils";

import type { FlashCard } from "@/features/flashcard/types";
import type { QuestionType } from "@/features/flashcard/utils";
import type { CardMemoryState } from "../memory/CardMemoryManager";

/**
 * Classifies English meanings by grammatical shape.
 * 
 * @remarks
 * Used to generate semantically similar distractors (e.g., other verbs for verb questions).
 */
function getMeaningShape(meaning: string): "verb" | "adjective" | "other" {
    const m = meaning.trim().toLowerCase();
    if (m.startsWith("to ")) return "verb";
    if (m.startsWith("a ") || m.startsWith("an ")) return "adjective";
    return "other";
}

/**
 * Calculates lexical similarity between two strings.
 * 
 * @remarks
 * Combines prefix matching and character overlap to score visual/phonetic similarity.
 * Higher scores indicate more confusable pairs.
 */
function lexicalScore(a: string, b: string): number {
    const x = a.toLowerCase();
    const y = b.toLowerCase();
    if (!x || !y) return 0;
    if (x === y) return 0;

    let score = 0;
    if (x[0] === y[0]) score += 0.35;
    if (x.slice(0, 2) === y.slice(0, 2)) score += 0.3;

    const overlap = [...new Set(x)].filter((ch) => y.includes(ch)).length;
    score += Math.min(0.35, overlap / Math.max(x.length, y.length));

    return score;
}

export class DistractorBuilder {
    /**
     * Builds smart distractors using semantic and confusion-based scoring.
     * 
     * @remarks
     * Scoring factors:
     * - Semantic similarity (same grammatical category)
     * - Lexical similarity (visual/phonetic overlap)
     * - Historical confusion (previously mistaken choices)
     * - Difficulty alignment (similar difficulty level)
     * 
     * Selects top-scoring candidates to maximize question difficulty while
     * maintaining fairness.
     */
    buildSmart(params: {
        allCards: FlashCard[];
        currentCard: FlashCard;
        answer: string;
        questionType: QuestionType;
        memory: Record<string, CardMemoryState>;
    }): string[] {
        const { allCards, currentCard, answer, questionType, memory } = params;
        const useMeaning = questionType === "primary_to_meaning";
        const targetShape = useMeaning ? getMeaningShape(currentCard.meaning) : "other";
        const confusion = memory[currentCard.id]?.confusionWith ?? {};

        const candidates = allCards
            .filter((c) => c.id !== currentCard.id)
            .map((c) => {
                const value = useMeaning ? c.meaning : c.primary;
                return { card: c, value: value?.trim() ?? "" };
            })
            .filter((c) => c.value && c.value !== answer);

        const scored = candidates.map(({ card, value }) => {
            const semantic = useMeaning && getMeaningShape(value) === targetShape ? 0.45 : 0.05;
            const lexical = lexicalScore(answer, value) * 0.35;
            const confusionBoost = Math.min(0.7, (confusion[value] ?? 0) * 0.25);
            const difficultyBoost =
                card.difficulty &&
                currentCard.difficulty &&
                card.difficulty === currentCard.difficulty
                    ? 0.15
                    : 0.05;

            return { value, score: semantic + lexical + confusionBoost + difficultyBoost };
        });

        const sorted = scored.sort((a, b) => b.score - a.score).map((s) => s.value);
        const unique = Array.from(new Set(sorted));
        const chosen = unique.slice(0, 3);

        if (chosen.length < 3) {
            const fallback = shuffleArray(
                candidates.map((c) => c.value).filter((v) => !chosen.includes(v)),
            ).slice(0, 3 - chosen.length);
            chosen.push(...fallback);
        }

        return chosen.slice(0, 3);
    }

    /**
     * Builds random distractors as fallback.
     * 
     * @remarks
     * Used when smart distractor generation is disabled or fails.
     * Simply selects random cards excluding the correct answer.
     */
    buildRandom(
        allCards: FlashCard[],
        currentCard: FlashCard,
        answer: string,
        count: number,
    ): string[] {
        const candidates = allCards
            .filter((c) => c.id !== currentCard.id)
            .map((c) => c.meaning)
            .filter((m) => m !== answer);

        return shuffleArray(candidates).slice(0, count);
    }
}
