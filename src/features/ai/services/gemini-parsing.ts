/**
 * @file gemini-parsing
 * Parses and validates raw (untrusted) Gemini output, and classifies
 * transport/parse failures into AIServiceError — split out of
 * gemini.service.ts (E11-T3).
 */
import { generatedCardArraySchema, generatedCardSchema } from "../schemas/generated-card.schema";

import type { GeneratedCard } from "../types";

export class AIServiceError extends Error {
    constructor(
        message: string,
        public readonly code: "parse_error" | "api_error" | "quota_error" | "invalid_response",
    ) {
        super(message);
        this.name = "AIServiceError";
    }
}

/** Parses raw (untrusted) Gemini JSON into a GeneratedCard — see schemas/generated-card.schema.ts. */
export function parseCard(raw: unknown): GeneratedCard {
    const result = generatedCardSchema.safeParse(raw);
    if (!result.success) {
        const message = result.error.issues[0]?.message ?? "AI returned an unexpected shape";
        throw new AIServiceError(message, "invalid_response");
    }
    return result.data;
}

export function parseCardArray(raw: unknown): GeneratedCard[] {
    if (!Array.isArray(raw)) {
        throw new AIServiceError("AI response is not an array", "invalid_response");
    }
    const result = generatedCardArraySchema.safeParse(raw);
    if (!result.success) {
        const issue = result.error.issues[0];
        const index = issue?.path[0];
        throw new AIServiceError(
            typeof index === "number"
                ? `Card at index ${index} has invalid shape`
                : "AI response contains an invalid card",
            "invalid_response",
        );
    }
    return result.data;
}

export function classifyError(err: unknown): never {
    if (err instanceof AIServiceError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("quota") || msg.includes("429")) {
        throw new AIServiceError("AI quota exceeded — please try again later", "quota_error");
    }
    if (msg.includes("JSON") || msg.includes("parse")) {
        throw new AIServiceError("AI returned malformed data — try rephrasing", "parse_error");
    }
    throw new AIServiceError(`AI request failed: ${msg}`, "api_error");
}
