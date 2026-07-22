/**
 * @file Zod v4 schema for parsing raw (untrusted) Gemini JSON output into a
 * `GeneratedCard` — single source of truth, replacing the hand-written
 * `parseCard`/`parseCardArray` in features/ai/services/gemini.service.ts.
 *
 * Deliberately lenient to match the prior hand-rolled behavior exactly:
 * optional fields with bad values are dropped/truncated rather than
 * rejecting the whole card (only `primary`/`meaning` being empty is fatal —
 * the AI got the shape right but the content wrong, worth a full retry).
 */
import { z } from "zod";

/** Coerces to string, trims, empty string becomes undefined. */
const optionalTrimmed = (maxLength?: number) =>
    z.preprocess((val) => {
        if (typeof val !== "string") return undefined;
        const trimmed = val.trim();
        if (!trimmed) return undefined;
        return maxLength ? trimmed.slice(0, maxLength) : trimmed;
    }, z.string().optional());

const stringArray = z.preprocess((val) => {
    if (!Array.isArray(val)) return [];
    return val
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .map((v) => v.trim());
}, z.array(z.string()));

export const generatedCardSchema = z.object({
    primary: z.preprocess(
        (val) => String(val ?? "").trim(),
        z.string().min(1, "AI response missing required field: primary"),
    ),
    meaning: z.preprocess(
        (val) => String(val ?? "").trim(),
        z.string().min(1, "AI response missing required field: meaning"),
    ),
    example: z.preprocess((val) => String(val ?? "").trim(), z.string()),
    alternatives: stringArray,
    distractors: z.preprocess((val) => {
        if (!Array.isArray(val)) return undefined;
        const cleaned = val
            .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
            .map((v) => v.trim())
            .slice(0, 3);
        return cleaned.length > 0 ? cleaned : undefined;
    }, z.array(z.string()).optional()),
    hint: optionalTrimmed(120),
    usageNote: optionalTrimmed(120),
    mnemonic: optionalTrimmed(120),
    difficulty: z.preprocess(
        (val) => {
            const n = Number(val);
            return [1, 2, 3].includes(n) ? n : undefined;
        },
        z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    ),
    // Must contain exactly one ___ token — otherwise silently dropped (the AI
    // asked for a cloze but didn't format it correctly; not worth failing over).
    clozeTemplate: z.preprocess((val) => {
        if (typeof val !== "string") return undefined;
        const trimmed = val.trim();
        if (!trimmed) return undefined;
        const tokenCount = (trimmed.match(/___/g) ?? []).length;
        return tokenCount === 1 ? trimmed : undefined;
    }, z.string().optional()),
});

export type GeneratedCardParsed = z.infer<typeof generatedCardSchema>;

export const generatedCardArraySchema = z.array(generatedCardSchema);
