/**
 * @file Atomic-card validation — generic, feature-agnostic.
 *
 * @remarks
 * Shared between features/flashcard (validating user-entered/imported cards)
 * and features/ai (validating Gemini-generated cards) — neither feature owns
 * this concept, so it lives here rather than forcing one to depend on the other.
 *
 * The rule check itself now lives in shared/schemas/card.schema.ts (the zod
 * v4 single source of truth) — this module re-exports the types
 * and delegates `validateAtomicCard` to it, preserving the existing
 * `{ valid, violations }` call signature for its three call sites
 * (parser.ts, gemini.service.ts, lesson.service.ts) unchanged.
 */

import { checkAtomicPrimaryViolations } from "@/shared/schemas/card.schema";

import type { CardViolation, ViolationRule } from "@/shared/schemas/card.schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { CardViolation, ViolationRule };

export interface ValidationResult {
    valid: boolean;
    violations: CardViolation[];
}

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
export function validateAtomicCard(card: { primary: string }): ValidationResult {
    const violations = checkAtomicPrimaryViolations(card.primary);
    return {
        valid: violations.length === 0,
        violations,
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
