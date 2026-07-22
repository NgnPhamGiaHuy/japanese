import { describe, expect, it } from "vitest";

import { aiGenerateInputSchema } from "./ai-generate-input.schema";

describe("aiGenerateInputSchema", () => {
    const valid = {
        mode: "guided" as const,
        topic: "food",
        count: 12 as const,
        level: "N5" as const,
    };

    it("accepts a fully-populated valid input", () => {
        expect(aiGenerateInputSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects an empty topic", () => {
        expect(aiGenerateInputSchema.safeParse({ ...valid, topic: "" }).success).toBe(false);
    });

    it("rejects a topic over 80 chars", () => {
        expect(aiGenerateInputSchema.safeParse({ ...valid, topic: "a".repeat(81) }).success).toBe(
            false,
        );
    });

    it("rejects a count outside the sanctioned set", () => {
        expect(aiGenerateInputSchema.safeParse({ ...valid, count: 10 }).success).toBe(false);
    });

    it("rejects a level outside the JLPT vocabulary", () => {
        expect(aiGenerateInputSchema.safeParse({ ...valid, level: "N1" }).success).toBe(false);
    });

    it("rejects a mode outside quick/guided", () => {
        expect(aiGenerateInputSchema.safeParse({ ...valid, mode: "custom" }).success).toBe(false);
    });
});
