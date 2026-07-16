/**
 * @file Zod v4 schemas for flashcard content — the single validation source
 * of truth shared by client forms (LessonBuilder, via @hookform/resolvers),
 * server actions, and runtime parsing of AI/import output.
 */
import { z } from "zod";

// ─── Atomic Card principle ──────────────────────────────────────────────────
//
// A card's `primary` field must represent exactly one concept — not a
// comma/slash-separated list, and not a parenthetical aside. This was
// previously `validateAtomicCard`'s job in src/shared/utils/atomicCard.ts,
// which was a no-op stub (always returned `{valid: true, violations: []}`)
// despite three real call sites branching on it. This is the real
// implementation; atomicCard.ts now delegates here.

export type ViolationRule = "comma_separated" | "slash_separated" | "parenthetical";

export interface CardViolation {
    field: "primary";
    rule: ViolationRule;
    offendingValue: string;
}

/** The actual rule check, kept as a plain testable function rather than
 * extracted from zod's issue objects — simpler to reason about and reuse
 * from the legacy `validateAtomicCard` call sites unchanged. */
export function checkAtomicPrimaryViolations(primary: string): CardViolation[] {
    const violations: CardViolation[] = [];
    if (primary.includes(",")) {
        violations.push({ field: "primary", rule: "comma_separated", offendingValue: primary });
    }
    if (primary.includes("/")) {
        violations.push({ field: "primary", rule: "slash_separated", offendingValue: primary });
    }
    if (/\(.+\)/.test(primary)) {
        violations.push({ field: "primary", rule: "parenthetical", offendingValue: primary });
    }
    return violations;
}

/** A `primary` value that satisfies the Atomic Card principle. */
export const atomicPrimarySchema = z
    .string()
    .min(1, "Primary is required")
    .superRefine((value, ctx) => {
        for (const violation of checkAtomicPrimaryViolations(value)) {
            ctx.addIssue({
                code: "custom",
                message: `"${violation.offendingValue}" is not atomic (${violation.rule})`,
                ...violation,
            });
        }
    });

// ─── Card content ────────────────────────────────────────────────────────────
//
// Covers the user/AI-editable content fields (what LessonBuilder's form
// edits) — not the SRS/system-managed fields (easeFactor, interval,
// repetitions, nextReviewAt, id, lessonId), which the app computes and never
// takes as free-form input.

export const cardContentSchema = z.object({
    primary: atomicPrimarySchema,
    alternatives: z.array(z.string().min(1)).default([]),
    meaning: z.string().min(1, "Meaning is required").max(500),
    example: z.string().max(500).default(""),
    hint: z.string().max(120).optional(),
    usageNote: z.string().max(120).optional(),
    mnemonic: z.string().max(120).optional(),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    // Must contain exactly one ___ token when present (cloze deletion marker).
    clozeTemplate: z
        .string()
        .refine((v) => (v.match(/___/g) ?? []).length === 1, {
            message: "clozeTemplate must contain exactly one ___ token",
        })
        .optional(),
    cardType: z.enum(["standard", "cloze"]).optional(),
});

export type CardContent = z.infer<typeof cardContentSchema>;
