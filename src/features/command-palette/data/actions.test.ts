/**
 * @file actions.test.ts
 * Unit tests for the command-palette's action registry (T-117e). This
 * feature has no bespoke fuzzy-search logic of its own (cmdk handles
 * matching) — its actual "domain logic" is this static data's own
 * consistency, since `id` doubles as the React key and the i18n message
 * lookup key (`actions.${action.id}.label`) that ActionItem resolves.
 */
import { describe, expect, it } from "vitest";

import { ADMIN_ACTIONS, MAIN_ACTIONS } from "./actions";

describe("MAIN_ACTIONS / ADMIN_ACTIONS", () => {
    it("every id is unique within its own list", () => {
        expect(new Set(MAIN_ACTIONS.map((a) => a.id)).size).toBe(MAIN_ACTIONS.length);
        expect(new Set(ADMIN_ACTIONS.map((a) => a.id)).size).toBe(ADMIN_ACTIONS.length);
    });

    it("no id collides between MAIN_ACTIONS and ADMIN_ACTIONS", () => {
        // A collision would be ambiguous both as a React key across the two
        // rendered groups and as an i18n lookup key resolved by id alone.
        const mainIds = new Set(MAIN_ACTIONS.map((a) => a.id));
        const overlap = ADMIN_ACTIONS.filter((a) => mainIds.has(a.id));
        expect(overlap).toEqual([]);
    });

    it("every ADMIN_ACTIONS href is scoped under /admin", () => {
        for (const action of ADMIN_ACTIONS) {
            expect(action.href.startsWith("/admin")).toBe(true);
        }
    });

    it("every href is an absolute app path", () => {
        for (const action of [...MAIN_ACTIONS, ...ADMIN_ACTIONS]) {
            expect(action.href.startsWith("/")).toBe(true);
        }
    });

    it("every action has an icon component", () => {
        for (const action of [...MAIN_ACTIONS, ...ADMIN_ACTIONS]) {
            expect(action.icon).toBeDefined();
        }
    });
});
