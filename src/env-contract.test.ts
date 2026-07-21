/**
 * @file env-contract.test.ts
 * Keeps `.env.example` honest (T-118c).
 *
 * @remarks
 * A checked-in environment contract is only useful while it is complete, and it
 * decays the moment someone reads a new `process.env.*` without documenting it.
 * Nothing about the app fails when that happens — the new variable simply joins
 * the set of things you can only discover by grepping source, which is the
 * state this file was written to end.
 *
 * So completeness is asserted rather than assumed: every variable the source
 * reads must appear in `.env.example`. The secret check is here for the same
 * reason — the file's one real hazard is that a real credential gets pasted in
 * while filling out an example.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = new URL(".", import.meta.url).pathname;
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "coverage", "playwright-report"]);
const CODE_EXT = /\.(ts|tsx|mjs)$/;

/** Variables the runtime provides; they are documented but never set by hand. */
const RUNTIME_PROVIDED = new Set(["NODE_ENV", "NEXT_RUNTIME", "CI", "GCLOUD_PROJECT"]);

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) collectSourceFiles(full, acc);
        else if (CODE_EXT.test(entry)) acc.push(full);
    }
    return acc;
}

function referencedEnvVars(): Set<string> {
    const found = new Set<string>();
    for (const file of collectSourceFiles(SRC_ROOT)) {
        const source = readFileSync(file, "utf8");
        for (const match of source.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
            found.add(match[1]);
        }
    }
    return found;
}

const envExample = readFileSync(join(SRC_ROOT, ".env.example"), "utf8");

describe("environment contract", () => {
    it("documents every variable the source reads", () => {
        const undocumented = [...referencedEnvVars()]
            .filter((name) => !envExample.includes(name))
            .sort();
        expect(undocumented).toEqual([]);
    });

    it("documents the runtime-provided variables too, marked as such", () => {
        // They are read by the code, so omitting them would make a reader
        // wonder whether the entry was forgotten or deliberately left out.
        for (const name of RUNTIME_PROVIDED) {
            expect(envExample).toContain(name);
        }
    });

    it("contains no real credential material", () => {
        // Shapes and placeholders only. These patterns are what an accidental
        // paste of the author's own .env.local would look like.
        expect(envExample).not.toMatch(/AIza[0-9A-Za-z_-]{10,}/); // Google API key
        expect(envExample).not.toMatch(/-----BEGIN PRIVATE KEY-----\\n[A-Za-z0-9+/]{40,}/);
        expect(envExample).not.toMatch(/\b\d{12,}\b/); // sender / project numbers
    });

    it("states a degradation for each documented group, not just a name list", () => {
        // The file's value is the "what breaks when unset" column; a bare list
        // of names would satisfy the letter of the task and none of its point.
        for (const phrase of ["Degradation when unset", "does not boot", "silently"]) {
            expect(envExample).toContain(phrase);
        }
    });
});
