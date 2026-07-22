import { describe, expect, it } from "vitest";

import { commentContentSchema } from "./comment.schema";

describe("commentContentSchema", () => {
    it("accepts normal content", () => {
        expect(commentContentSchema.safeParse("Great mnemonic!").success).toBe(true);
    });

    it("trims surrounding whitespace", () => {
        const result = commentContentSchema.safeParse("  hello  ");
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toBe("hello");
    });

    it("rejects empty content", () => {
        expect(commentContentSchema.safeParse("").success).toBe(false);
    });

    it("rejects whitespace-only content", () => {
        expect(commentContentSchema.safeParse("   ").success).toBe(false);
    });

    it("accepts content at exactly the 2000-char limit", () => {
        expect(commentContentSchema.safeParse("a".repeat(2000)).success).toBe(true);
    });

    it("rejects content over the 2000-char limit", () => {
        expect(commentContentSchema.safeParse("a".repeat(2001)).success).toBe(false);
    });
});
