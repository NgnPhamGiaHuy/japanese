/**
 * @file KanaStrokeAnimation.test.ts
 * MSW-backed network tests for fetchKanaSvg — the app's one remaining plain
 * `fetch()` call to an external HTTP endpoint (KanjiVG stroke-order SVGs).
 * Intercepts at the network layer (MSW) rather than mocking `fetch` itself,
 * so the test exercises the real request URL, status handling, and parse
 * logic end-to-end.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { fetchKanaSvg } from "./KanaStrokeAnimation";

const KANJIVG_URL = "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/*";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("fetchKanaSvg", () => {
    it("returns null when the endpoint responds 404 (no stroke data for this character)", async () => {
        server.use(http.get(KANJIVG_URL, () => new HttpResponse(null, { status: 404 })));

        const result = await fetchKanaSvg("あ");
        expect(result).toBeNull();
    });

    it("returns null when the request fails at the network level", async () => {
        server.use(http.get(KANJIVG_URL, () => HttpResponse.error()));

        const result = await fetchKanaSvg("あ");
        expect(result).toBeNull();
    });

    it("parses a valid SVG response into paths and texts", async () => {
        const svg =
            '<svg><g><path d="M10 10 L20 20"/><path d="M30 30 L40 40"/></g>' +
            '<text transform="translate(5,5)">1</text></svg>';
        server.use(http.get(KANJIVG_URL, () => new HttpResponse(svg, { status: 200 })));

        // fetchKanaSvg uses the browser DOMParser, unavailable in this project's
        // node test environment — stub the minimal surface it needs rather than
        // pulling in jsdom for one test. This still exercises the real fetch +
        // status-check + extraction logic MSW is meant to prove.
        const fakeDoc = {
            querySelectorAll: (selector: string) =>
                selector === "path"
                    ? [
                          { getAttribute: () => "M10 10 L20 20" },
                          { getAttribute: () => "M30 30 L40 40" },
                      ]
                    : [{ textContent: "1", getAttribute: () => "translate(5,5)" }],
        };
        vi.stubGlobal(
            "DOMParser",
            class {
                parseFromString() {
                    return fakeDoc as unknown as Document;
                }
            },
        );

        const result = await fetchKanaSvg("あ");
        expect(result).toEqual({
            paths: ["M10 10 L20 20", "M30 30 L40 40"],
            texts: [{ text: "1", transform: "translate(5,5)" }],
        });

        vi.unstubAllGlobals();
    });
});
