/**
 * @file public-routes.test.ts
 * Guards the single-source public-route allowlist (T-118a).
 *
 * @remarks
 * The headline test is `behaviour parity with the pre-consolidation proxy`:
 * it replays the exact inline logic `proxy.ts` used before this module existed
 * and asserts the module admits precisely the same set. That is what makes the
 * consolidation provably behaviour-neutral rather than merely intended to be.
 *
 * The second group guards the split itself — the allowlist governs *route
 * access*, so a wrongly-widened entry is an auth bypass and a wrongly-narrowed
 * one silently breaks a share link or an SEO asset.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { isPublicAtEdge, isPublicForRender, PUBLIC_ROUTES } from "./public-routes";

// ─── The pre-consolidation logic, verbatim from proxy.ts@a0bbbc4 ─────────────
// Kept literal on purpose: this is the baseline the consolidation must match,
// so it must not be refactored to share code with the implementation.
const OLD_PUBLIC_PATHS = ["/login", "/sitemap.xml", "/robots.txt"];
const OLD_PUBLIC_PATH_PATTERNS = [
    /^\/flashcard\/shared\/[^/]+(?:\/opengraph-image(?:-[a-z0-9]+)?)?$/,
];

function oldIsPublic(path: string): boolean {
    return (
        OLD_PUBLIC_PATHS.some((p) => path.startsWith(p)) ||
        OLD_PUBLIC_PATH_PATTERNS.some((re) => re.test(path))
    );
}

/** Locale prefixes are stripped before the allowlist is consulted. */
const SAMPLE_PATHS = [
    // public
    "/login",
    "/login/",
    "/sitemap.xml",
    "/robots.txt",
    "/flashcard/shared/abc123",
    "/flashcard/shared/abc123/opengraph-image",
    "/flashcard/shared/abc123/opengraph-image-nnv7ce",
    // protected — the sensitive near-misses
    "/flashcard/shared/abc123/study",
    "/flashcard/shared/abc123/match",
    "/flashcard/shared/abc123/speed",
    "/flashcard/shared",
    "/flashcard/shared/",
    // protected — ordinary app surface
    "/",
    "/kana",
    "/kana/quiz",
    "/flashcard",
    "/flashcard/abc123",
    "/notifications",
    "/profile",
    "/settings",
    "/admin",
    "/admin/users",
];

describe("public-routes — parity with the pre-consolidation proxy", () => {
    it.each(SAMPLE_PATHS)("admits %s exactly as the old inline logic did", (path) => {
        expect(isPublicAtEdge(path)).toBe(oldIsPublic(path));
    });

    it("agrees with the old logic on every sample path, not just individually", () => {
        const before = SAMPLE_PATHS.filter(oldIsPublic);
        const after = SAMPLE_PATHS.filter(isPublicAtEdge);
        expect(after).toEqual(before);
    });
});

describe("public-routes — edge derivation", () => {
    it("admits the sign-in screen", () => {
        expect(isPublicAtEdge("/login")).toBe(true);
    });

    it("admits crawler files", () => {
        expect(isPublicAtEdge("/sitemap.xml")).toBe(true);
        expect(isPublicAtEdge("/robots.txt")).toBe(true);
    });

    it("admits a share-link landing page and its OG image, hashed or not", () => {
        expect(isPublicAtEdge("/flashcard/shared/abc123")).toBe(true);
        expect(isPublicAtEdge("/flashcard/shared/abc123/opengraph-image")).toBe(true);
        expect(isPublicAtEdge("/flashcard/shared/abc123/opengraph-image-nnv7ce")).toBe(true);
    });

    it("does NOT admit a shared deck's study/match/speed sub-routes", () => {
        // These need a signed-in user for progress tracking; admitting them
        // would be an auth bypass, not a cosmetic widening.
        expect(isPublicAtEdge("/flashcard/shared/abc123/study")).toBe(false);
        expect(isPublicAtEdge("/flashcard/shared/abc123/match")).toBe(false);
        expect(isPublicAtEdge("/flashcard/shared/abc123/speed")).toBe(false);
    });

    it("does NOT admit the ordinary app surface", () => {
        for (const path of ["/", "/kana", "/flashcard", "/notifications", "/profile", "/admin"]) {
            expect(isPublicAtEdge(path)).toBe(false);
        }
    });
});

describe("public-routes — render derivation", () => {
    it("is the page-kind subset of the edge derivation", () => {
        const renderPublic = SAMPLE_PATHS.filter(isPublicForRender);
        const edgePublic = SAMPLE_PATHS.filter(isPublicAtEdge);
        expect(edgePublic).toEqual(expect.arrayContaining(renderPublic));
        expect(renderPublic.length).toBeLessThan(edgePublic.length);
    });

    it("renders the sign-in screen and the share landing page without the splash", () => {
        expect(isPublicForRender("/login")).toBe(true);
        expect(isPublicForRender("/flashcard/shared/abc123")).toBe(true);
    });

    it("has no opinion on assets, which never reach the React tree", () => {
        expect(isPublicForRender("/sitemap.xml")).toBe(false);
        expect(isPublicForRender("/robots.txt")).toBe(false);
        expect(isPublicForRender("/flashcard/shared/abc123/opengraph-image")).toBe(false);
    });

    it("keeps every protected route behind the splash", () => {
        for (const path of ["/", "/kana", "/flashcard/shared/abc123/study", "/admin"]) {
            expect(isPublicForRender(path)).toBe(false);
        }
    });
});

describe("public-routes — single source", () => {
    it("declares every entry with a matcher and a stated reason", () => {
        for (const route of PUBLIC_ROUTES) {
            expect(route.prefix ?? route.pattern).toBeDefined();
            expect(route.why.length).toBeGreaterThan(0);
        }
    });

    it("is the only public-path list — proxy.ts holds none of its own", () => {
        const proxySource = readFileSync(new URL("../../proxy.ts", import.meta.url), "utf8");
        expect(proxySource).toContain("public-routes");
        // The pre-consolidation literals must not survive anywhere in the file.
        expect(proxySource).not.toContain("PUBLIC_PATHS");
        expect(proxySource).not.toContain("PUBLIC_PATH_PATTERNS");
    });
});
