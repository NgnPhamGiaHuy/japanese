/**
 * Selects appropriate question type based on card content and difficulty.
 *
 * @remarks
 * Adapts question format to match learning goals: easier levels focus on recognition
 * (primary → meaning), harder levels test recall (meaning → primary, alternatives, examples).
 */

import { chooseQuestionType, getSupportedQuestionTypes } from "@/features/flashcard/core/utils";

import type { FlashCard } from "@/features/flashcard/core/types";
import type { QuestionType } from "@/features/flashcard/core/utils";

export class QuestionTypeSelector {
    /**
     * Chooses question type based on card capabilities and difficulty settings.
     *
     * @remarks
     * Selection strategy:
     * - Level 1: Primary → Meaning (recognition, easiest)
     * - Level 2: Mix of Primary → Meaning and Meaning → Primary
     * - Level 3: All types including alternatives and examples (recall, hardest)
     *
     * Falls back gracefully if card lacks required fields (e.g., no alternatives).
     */
    choose(
        card: FlashCard,
        options: {
            allowedTypes: QuestionType[];
            preferPrimary: boolean;
            difficulty: number;
        },
    ): QuestionType {
        const supported = getSupportedQuestionTypes(card);
        const allowed = options.allowedTypes.filter((t) => supported.includes(t));

        if (allowed.length === 0) {
            return "primary_to_meaning";
        }

        return chooseQuestionType(card, {
            difficulty: options.difficulty,
            preferPrimary: options.preferPrimary,
        });
    }
}
