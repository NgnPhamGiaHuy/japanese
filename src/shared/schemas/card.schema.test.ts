import { describe, expect, it } from "vitest";

import {
    atomicPrimarySchema,
    cardContentSchema,
    checkAtomicPrimaryViolations,
} from "./card.schema";

describe("checkAtomicPrimaryViolations", () => {
    it("returns no violations for an atomic primary", () => {
        expect(checkAtomicPrimaryViolations("食べる")).toEqual([]);
    });

    it("flags a comma-separated primary", () => {
        const violations = checkAtomicPrimaryViolations("食べる, 飲む");
        expect(violations).toEqual([
            { field: "primary", rule: "comma_separated", offendingValue: "食べる, 飲む" },
        ]);
    });

    it("flags a slash-separated primary", () => {
        const violations = checkAtomicPrimaryViolations("金曜日 / 金");
        expect(violations).toEqual([
            { field: "primary", rule: "slash_separated", offendingValue: "金曜日 / 金" },
        ]);
    });

    it("flags a parenthetical primary", () => {
        const violations = checkAtomicPrimaryViolations("食べる (taberu)");
        expect(violations).toEqual([
            { field: "primary", rule: "parenthetical", offendingValue: "食べる (taberu)" },
        ]);
    });

    it("flags all matching rules at once", () => {
        const violations = checkAtomicPrimaryViolations("a/b, c (d)");
        expect(violations.map((v) => v.rule).sort()).toEqual(
            ["comma_separated", "parenthetical", "slash_separated"].sort(),
        );
    });
});

describe("atomicPrimarySchema", () => {
    it("accepts an atomic primary", () => {
        expect(atomicPrimarySchema.safeParse("食べる").success).toBe(true);
    });

    it("rejects an empty primary", () => {
        expect(atomicPrimarySchema.safeParse("").success).toBe(false);
    });

    it("rejects a non-atomic primary and reports the violation", () => {
        const result = atomicPrimarySchema.safeParse("食べる, 飲む");
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain("comma_separated");
        }
    });
});

describe("cardContentSchema", () => {
    const valid = {
        primary: "食べる",
        alternatives: ["たべる", "taberu"],
        meaning: "to eat",
        example: "まいにちごはんをたべる - I eat rice every day",
        hint: "ta-BEru = TABle",
        difficulty: 1 as const,
    };

    it("accepts a fully-populated valid card", () => {
        expect(cardContentSchema.safeParse(valid).success).toBe(true);
    });

    it("accepts the minimal required shape, defaulting the rest", () => {
        const result = cardContentSchema.safeParse({ primary: "食べる", meaning: "to eat" });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.alternatives).toEqual([]);
            expect(result.data.example).toBe("");
        }
    });

    it("rejects a missing meaning", () => {
        expect(cardContentSchema.safeParse({ primary: "食べる" }).success).toBe(false);
    });

    it("rejects a non-atomic primary", () => {
        expect(cardContentSchema.safeParse({ ...valid, primary: "食べる, 飲む" }).success).toBe(
            false,
        );
    });

    it("rejects a clozeTemplate without exactly one ___ token", () => {
        expect(
            cardContentSchema.safeParse({ ...valid, clozeTemplate: "no token here" }).success,
        ).toBe(false);
        expect(
            cardContentSchema.safeParse({ ...valid, clozeTemplate: "___ and ___" }).success,
        ).toBe(false);
    });

    it("accepts a clozeTemplate with exactly one ___ token", () => {
        expect(
            cardContentSchema.safeParse({ ...valid, clozeTemplate: "まいにち___をたべる" }).success,
        ).toBe(true);
    });

    it("rejects an out-of-range difficulty", () => {
        expect(cardContentSchema.safeParse({ ...valid, difficulty: 5 }).success).toBe(false);
    });
});
