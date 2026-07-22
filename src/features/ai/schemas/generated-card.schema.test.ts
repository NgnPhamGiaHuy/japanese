import { describe, expect, it } from "vitest";

import { generatedCardArraySchema, generatedCardSchema } from "./generated-card.schema";

describe("generatedCardSchema", () => {
    it("accepts a fully-populated valid card", () => {
        const raw = {
            primary: "食べる",
            alternatives: ["たべる", "taberu"],
            meaning: "to eat",
            example: "まいにちごはんをたべる - I eat rice every day",
            distractors: ["to drink", "to cook", "to buy"],
            hint: "ta-BEru = TABle",
            usageNote: "godan verb, used with を particle",
            difficulty: 1,
            mnemonic: "taberu = TABle RUle",
            clozeTemplate: "まいにち___ をたべる",
        };
        const result = generatedCardSchema.safeParse(raw);
        expect(result.success).toBe(true);
    });

    it("rejects a missing primary", () => {
        expect(generatedCardSchema.safeParse({ meaning: "to eat" }).success).toBe(false);
    });

    it("rejects a blank primary", () => {
        expect(generatedCardSchema.safeParse({ primary: "   ", meaning: "to eat" }).success).toBe(
            false,
        );
    });

    it("rejects a missing meaning", () => {
        expect(generatedCardSchema.safeParse({ primary: "食べる" }).success).toBe(false);
    });

    it("coerces a non-string primary/meaning to string rather than rejecting", () => {
        const result = generatedCardSchema.safeParse({ primary: 123, meaning: 456, example: "" });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.primary).toBe("123");
            expect(result.data.meaning).toBe("456");
        }
    });

    it("defaults a missing/non-array alternatives to an empty array rather than rejecting", () => {
        const result = generatedCardSchema.safeParse({ primary: "食べる", meaning: "to eat" });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.alternatives).toEqual([]);
    });

    it("filters blank/non-string entries out of alternatives", () => {
        const result = generatedCardSchema.safeParse({
            primary: "食べる",
            meaning: "to eat",
            alternatives: ["たべる", "", "  ", 42, null, "taberu"],
        });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.alternatives).toEqual(["たべる", "taberu"]);
    });

    it("slices distractors to the first 3 rather than rejecting", () => {
        const result = generatedCardSchema.safeParse({
            primary: "食べる",
            meaning: "to eat",
            distractors: ["a", "b", "c", "d", "e"],
        });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.distractors).toEqual(["a", "b", "c"]);
    });

    it("truncates hint/usageNote/mnemonic to 120 chars rather than rejecting", () => {
        const long = "x".repeat(200);
        const result = generatedCardSchema.safeParse({
            primary: "食べる",
            meaning: "to eat",
            hint: long,
            usageNote: long,
            mnemonic: long,
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.hint).toHaveLength(120);
            expect(result.data.usageNote).toHaveLength(120);
            expect(result.data.mnemonic).toHaveLength(120);
        }
    });

    it("drops an out-of-range difficulty to undefined rather than rejecting", () => {
        const result = generatedCardSchema.safeParse({
            primary: "食べる",
            meaning: "to eat",
            difficulty: 7,
        });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.difficulty).toBeUndefined();
    });

    it("drops a malformed clozeTemplate (zero or multiple ___ tokens) to undefined rather than rejecting", () => {
        const noToken = generatedCardSchema.safeParse({
            primary: "食べる",
            meaning: "to eat",
            clozeTemplate: "no token here",
        });
        expect(noToken.success).toBe(true);
        if (noToken.success) expect(noToken.data.clozeTemplate).toBeUndefined();

        const twoTokens = generatedCardSchema.safeParse({
            primary: "食べる",
            meaning: "to eat",
            clozeTemplate: "___ and ___",
        });
        expect(twoTokens.success).toBe(true);
        if (twoTokens.success) expect(twoTokens.data.clozeTemplate).toBeUndefined();
    });

    it("keeps a clozeTemplate with exactly one ___ token", () => {
        const result = generatedCardSchema.safeParse({
            primary: "食べる",
            meaning: "to eat",
            clozeTemplate: "まいにち___をたべる",
        });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.clozeTemplate).toBe("まいにち___をたべる");
    });
});

describe("generatedCardArraySchema", () => {
    it("parses an array of cards", () => {
        const result = generatedCardArraySchema.safeParse([
            { primary: "食べる", meaning: "to eat" },
            { primary: "飲む", meaning: "to drink" },
        ]);
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toHaveLength(2);
    });

    it("rejects a non-array payload", () => {
        expect(
            generatedCardArraySchema.safeParse({ primary: "食べる", meaning: "to eat" }).success,
        ).toBe(false);
    });

    it("fails if any single item is invalid", () => {
        const result = generatedCardArraySchema.safeParse([
            { primary: "食べる", meaning: "to eat" },
            { meaning: "missing primary" },
        ]);
        expect(result.success).toBe(false);
    });
});
