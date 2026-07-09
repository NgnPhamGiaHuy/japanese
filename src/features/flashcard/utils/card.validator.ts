import type { CardViolation } from "@/shared/utils/atomicCard";

// Generic atomic-card validation lives in shared/utils — it has no real
// dependency on the flashcard feature (any `{ primary: string }` shape works)
// and features/ai needs it too, so it's a neutral shared module rather than
// something ai/ depends on flashcard/ for.
export { splitAtomicPrimary, validateAtomicCard } from "@/shared/utils/atomicCard";
export type { CardViolation, ValidationResult, ViolationRule } from "@/shared/utils/atomicCard";

// ─── Error ────────────────────────────────────────────────────────────────────

/**
 * Thrown by `saveLessonWithCards` when any card fails atomic validation.
 * Carries the full violations array so the UI can highlight offending cards.
 */
export class CardValidationError extends Error {
    constructor(
        message: string,
        public readonly violations: CardViolation[],
    ) {
        super(message);
        this.name = "CardValidationError";
    }
}
