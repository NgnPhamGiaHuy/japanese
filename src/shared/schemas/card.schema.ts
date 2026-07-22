/**
 * @file Zod v4 schemas for flashcard content.
 *
 * @remarks
 * `cardContentSchema` has zero real consumers today (LessonBuilder's card
 * array is plain useState, not wired to a resolver; no server action or
 * write-boundary function imports it; AI/import output validates through
 * the separate `generatedCardSchema` in ai-output.schema.ts instead). Its
 * disposition — wire it into a real write path, or delete it — is
 * gated on Q-12 (author intent: was adoption planned but unfinished, or is
 * this an overtaken artifact?), tracked as `LDG-03` in
 * docs/migrations-ledger.md. Do not treat this file as already the
 * enforced source of truth until that gate resolves.
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

// ─── Cloze deletion marker ──────────────────────────────────────────────────
//
// Study mode's displayEngine.ts renders `clozeTemplate` verbatim wherever
// `cardType === "cloze"` — the blank is the literal `___` substring, not
// parsed/replaced, so a card missing or mis-counting the token doesn't error,
// it just silently renders as a plain sentence with no visible blank. Kept as
// a plain function (not only inline in the schema below) so the real write
// boundary (lesson-save.ts) can enforce it independent of cardContentSchema's
// own gated disposition (Q-12, T-109b) — this one invariant doesn't need that
// gate resolved to be guarded at write time.

export function hasValidClozeToken(clozeTemplate: string): boolean {
    return (clozeTemplate.match(/___/g) ?? []).length === 1;
}

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
    clozeTemplate: z
        .string()
        .refine(hasValidClozeToken, { message: "clozeTemplate must contain exactly one ___ token" })
        .optional(),
    cardType: z.enum(["standard", "cloze"]).optional(),
});

export type CardContent = z.infer<typeof cardContentSchema>;
