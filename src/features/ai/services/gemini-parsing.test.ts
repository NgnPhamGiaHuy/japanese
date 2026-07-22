/**
 * @file gemini-parsing.test.ts
 * Unit tests for Gemini output parsing + error classification (T-117e).
 * Field-level schema rules (min lengths, trimming, etc.) already have
 * dedicated coverage in features/ai/schemas/generated-card.schema.test.ts — these tests
 * cover what's specific to this file: parseCard/parseCardArray's error
 * wrapping, and classifyError's failure-mode classification.
 */
import { describe, expect, it } from "vitest";

import { AIServiceError, classifyError, parseCard, parseCardArray } from "./gemini-parsing";

describe("parseCard", () => {
    it("returns the parsed card on valid input", () => {
        const result = parseCard({ primary: "cat", meaning: "a feline", example: "e" });
        expect(result.primary).toBe("cat");
    });

    it("throws AIServiceError with code 'invalid_response' on invalid input", () => {
        try {
            parseCard({ meaning: "missing primary" });
            expect.unreachable("should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(AIServiceError);
            expect((err as AIServiceError).code).toBe("invalid_response");
        }
    });
});

describe("parseCardArray", () => {
    it("returns the parsed array on valid input", () => {
        const result = parseCardArray([{ primary: "cat", meaning: "m", example: "e" }]);
        expect(result).toHaveLength(1);
    });

    it("throws AIServiceError immediately (not a schema error) when the raw value isn't an array", () => {
        try {
            parseCardArray({ not: "an array" });
            expect.unreachable("should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(AIServiceError);
            expect((err as AIServiceError).message).toBe("AI response is not an array");
        }
    });

    it("names the offending index when one card in the array is invalid", () => {
        try {
            parseCardArray([
                { primary: "cat", meaning: "m", example: "e" },
                { meaning: "missing primary at index 1" },
            ]);
            expect.unreachable("should have thrown");
        } catch (err) {
            expect((err as AIServiceError).message).toContain("index 1");
        }
    });
});

describe("classifyError", () => {
    it("passes an existing AIServiceError through unchanged", () => {
        const original = new AIServiceError("original", "parse_error");
        try {
            classifyError(original);
            expect.unreachable("should have thrown");
        } catch (err) {
            expect(err).toBe(original);
        }
    });

    it("classifies a quota-flavored message as 'quota_error'", () => {
        try {
            classifyError(new Error("Resource exhausted: 429 quota exceeded"));
            expect.unreachable("should have thrown");
        } catch (err) {
            expect((err as AIServiceError).code).toBe("quota_error");
        }
    });

    it("classifies a JSON/parse-flavored message as 'parse_error'", () => {
        try {
            classifyError(new Error("Unexpected token in JSON at position 4"));
            expect.unreachable("should have thrown");
        } catch (err) {
            expect((err as AIServiceError).code).toBe("parse_error");
        }
    });

    it("falls back to 'api_error' for anything else, including non-Error values", () => {
        try {
            classifyError("a plain string failure");
            expect.unreachable("should have thrown");
        } catch (err) {
            expect((err as AIServiceError).code).toBe("api_error");
            expect((err as AIServiceError).message).toContain("a plain string failure");
        }
    });
});
