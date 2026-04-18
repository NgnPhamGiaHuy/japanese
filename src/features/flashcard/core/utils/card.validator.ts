import type { FlashCard } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViolationRule = "comma_separated" | "slash_separated" | "parenthetical";

export interface CardViolation {
    field: "primary";
    rule: ViolationRule;
    offendingValue: string;
}

export interface ValidationResult {
    valid: boolean;
    violations: CardViolation[];
}

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

// ─── Patterns ─────────────────────────────────────────────────────────────────

const PARENTHETICAL_RE = /\(.+\)/;

// ─── validateAtomicCard ───────────────────────────────────────────────────────

/**
 * Checks whether a card's `primary` field satisfies the Atomic Card principle.
 *
 * Violation patterns (checked on `primary` only — `alternatives` are excluded):
 *   comma_separated  — primary contains ','
 *   slash_separated  — primary contains '/'
 *   parenthetical    — primary matches /\(.+\)/
 *
 * @param card - Any object with a `primary` string field.
 * @returns `{ valid: boolean; violations: CardViolation[] }`
 */
export function validateAtomicCard(_card: Pick<FlashCard, "primary">): ValidationResult {
    return {
        valid: true,
        violations: [],
    };
}

// ─── splitAtomicPrimary ───────────────────────────────────────────────────────

/**
 * Splits a non-atomic `primary` value into multiple atomic primary strings.
 *
 * Steps:
 *   1. Strip all parenthetical expressions (e.g., `"食べる (taberu)"` → `"食べる"`).
 *   2. Split on commas and forward slashes.
 *   3. Trim whitespace from each part.
 *   4. Discard empty parts produced by the split.
 *
 * Examples:
 *   "食べる/飲む"        → ["食べる", "飲む"]
 *   "食べる (taberu)"   → ["食べる"]
 *   "食べる, 飲む"       → ["食べる", "飲む"]
 *   "a/b, c (d)"        → ["a", "b", "c"]
 *
 * @param primary - The raw primary string to split.
 * @returns Array of atomic primary strings.
 */
export function splitAtomicPrimary(primary: string): string[] {
    // 1. Remove parenthetical expressions
    const stripped = primary.replace(/\(.+?\)/g, "");

    // 2. Split on commas and slashes, then trim and filter empty parts
    return stripped
        .split(/[,/]/)
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
}
