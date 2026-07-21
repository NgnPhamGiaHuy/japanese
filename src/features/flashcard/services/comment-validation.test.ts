/**
 * @file comment-validation.test.ts
 * Unit tests for comment-validation.ts (T-117c) — pure logic, no Firestore
 * dependency, so it runs in the unit tier rather than the emulator tier (the
 * explicit split ADR-117 calls for). `commentContentSchema`'s own boundary
 * conditions already have dedicated coverage in comment.schema.test.ts; these
 * tests cover what's specific to this file: the {valid, error} wrapper shape
 * and the XSS-escaping behavior.
 */
import { describe, expect, it } from "vitest";

import { sanitizeCommentContent, validateCommentContent } from "./comment-validation";

describe("validateCommentContent", () => {
    it("returns {valid: true} with no error for acceptable content", () => {
        expect(validateCommentContent("A helpful comment")).toEqual({ valid: true });
    });

    it("returns {valid: false, error} for content the schema rejects", () => {
        const result = validateCommentContent("");
        expect(result.valid).toBe(false);
        expect(result.error).toBeTruthy();
    });
});

describe("sanitizeCommentContent", () => {
    it("escapes the five HTML-significant characters", () => {
        expect(sanitizeCommentContent(`<script>alert("x")</script> & 'quote'`)).toBe(
            "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#x27;quote&#x27;",
        );
    });

    it("does NOT escape forward slashes — deliberate, so URL auto-linking still works", () => {
        expect(sanitizeCommentContent("see https://example.com/path")).toBe(
            "see https://example.com/path",
        );
    });

    it("leaves plain text without special characters unchanged", () => {
        expect(sanitizeCommentContent("a perfectly normal comment")).toBe(
            "a perfectly normal comment",
        );
    });
});
