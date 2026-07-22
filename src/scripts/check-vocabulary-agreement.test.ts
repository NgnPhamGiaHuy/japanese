/**
 * @file check-vocabulary-agreement.test.ts
 * Unit tests for the pure extraction/comparison logic behind
 * check-vocabulary-agreement.mjs (T-115b) — synthetic source strings, no
 * filesystem access, so these run in the plain unit suite.
 */
import { describe, expect, it } from "vitest";

import {
    diffSubset,
    parseRulesLiterals,
    parseTsLiterals,
    parseWriterLiterals,
} from "./check-vocabulary-agreement.mjs";

describe("parseTsLiterals", () => {
    it("extracts members of a union type declaration", () => {
        const source = `export type Foo = "a" | "b" | "c";\nexport type Bar = "x";`;
        expect(parseTsLiterals(source, "Foo")).toEqual(["a", "b", "c"]);
    });

    it("extracts members of an `as const` tuple declaration", () => {
        const source = `export const FOO = ["a", "b", "c"] as const;\nexport type Foo = (typeof FOO)[number];`;
        expect(parseTsLiterals(source, "FOO")).toEqual(["a", "b", "c"]);
    });

    it("throws when the named export doesn't exist", () => {
        const source = `export type Foo = "a";`;
        expect(() => parseTsLiterals(source, "Missing")).toThrow(
            /no union type or const tuple found/,
        );
    });
});

describe("parseRulesLiterals", () => {
    it("extracts every literal a rules condition compares against, deduped", () => {
        const source = `
            allow update: if resource.data.roles[request.auth.uid] == 'editor';
            allow delete: if resource.data.roles[request.auth.uid] == 'owner';
            allow read: if resource.data.roles[request.auth.uid] == 'editor';
        `;
        const pattern = /roles\[request\.auth\.uid\]\s*==\s*'([a-z]+)'/g;
        expect(parseRulesLiterals(source, pattern).sort()).toEqual(["editor", "owner"]);
    });

    it("returns an empty array when the field is never referenced", () => {
        const source = `allow read: if isSignedIn();`;
        const pattern = /roles\[request\.auth\.uid\]\s*==\s*'([a-z]+)'/g;
        expect(parseRulesLiterals(source, pattern)).toEqual([]);
    });
});

describe("parseWriterLiterals", () => {
    it("collects every literal across multiple source files, deduped", () => {
        const pattern = /\bsource:\s*"([a-z_]+)"/g;
        const sourcesByFile = {
            "a.ts": `write({ source: "client" });`,
            "b.ts": `write({ source: "server" });\nwrite({ source: "client" });`,
        };
        expect(parseWriterLiterals(sourcesByFile, pattern).sort()).toEqual(["client", "server"]);
    });
});

describe("diffSubset", () => {
    it("reports literals not present in the allowed set", () => {
        const problems = diffSubset(["a", "b", "c"], ["a", "b"], "writer literal");
        expect(problems).toEqual(['writer literal "c" is not in the TS union']);
    });

    it("reports nothing when every literal is allowed", () => {
        expect(diffSubset(["a", "b"], ["a", "b", "c"], "writer literal")).toEqual([]);
    });

    it("discriminates: a genuine mismatch is not silently swallowed", () => {
        // The exact scenario this check exists to catch — a writer literal
        // one character off from the declared union.
        const problems = diffSubset(
            ["editor"],
            ["owner", "commenter", "viewer"],
            "firestore.rules literal",
        );
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("editor");
    });
});
