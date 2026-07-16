import { describe, expect, it } from "vitest";

import { chunk, planDelivery, toMillis } from "./utils";

describe("toMillis", () => {
    it("returns numbers unchanged (legacy client-clock docs)", () => {
        expect(toMillis(1_700_000_000_000)).toBe(1_700_000_000_000);
        expect(toMillis(0)).toBe(0);
    });

    it("unwraps a Firestore Timestamp via toMillis()", () => {
        const ts = { toMillis: () => 1_699_999_999_000 };
        expect(toMillis(ts)).toBe(1_699_999_999_000);
    });

    it("unwraps a plain-object Timestamp via seconds", () => {
        expect(toMillis({ seconds: 1_700_000 })).toBe(1_700_000_000);
    });

    it("falls back to a number for an unresolved serverTimestamp (null/undefined)", () => {
        expect(typeof toMillis(null)).toBe("number");
        expect(typeof toMillis(undefined)).toBe("number");
    });
});

describe("chunk", () => {
    it("splits into groups of at most `size`", () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("returns a single chunk when smaller than size", () => {
        expect(chunk([1, 2], 400)).toEqual([[1, 2]]);
    });

    it("returns [] for an empty array", () => {
        expect(chunk([], 10)).toEqual([]);
    });

    it("chunks exactly at the boundary (delivery 2-op sizing)", () => {
        const items = Array.from({ length: 500 }, (_, i) => i);
        const chunks = chunk(items, 200);
        expect(chunks.map((c) => c.length)).toEqual([200, 200, 100]);
    });

    it("throws on a non-positive size", () => {
        expect(() => chunk([1], 0)).toThrow();
    });
});

describe("planDelivery — idempotent pending delivery", () => {
    const items = [
        { id: "p1", data: { type: "invite", createdAt: 1, senderId: "s" } },
        { id: "p2", data: { type: "invite", createdAt: 2, senderId: "s" } },
    ];

    it("reuses the pending doc ID as the destination ID (idempotency backbone)", () => {
        const [group] = planDelivery(items, "user_b", 200);
        expect(group.map((w) => w.destId)).toEqual(["p1", "p2"]);
        expect(group.map((w) => w.deleteId)).toEqual(["p1", "p2"]);
    });

    it("is deterministic — two concurrent plans target the same destination docs", () => {
        const a = planDelivery(items, "user_b", 200).flat();
        const b = planDelivery(items, "user_b", 200).flat();
        expect(a.map((w) => w.destId)).toEqual(b.map((w) => w.destId));
    });

    it("stamps recipient + canonical lifecycle fields, preserving createdAt", () => {
        const [[w]] = planDelivery([items[0]], "user_b", 200);
        expect(w.data).toMatchObject({
            userId: "user_b",
            status: "unread",
            isDeleted: false,
            createdAt: 1,
        });
    });

    it("chunks at the delivery batch size (set+delete = 2 ops → 200 items/batch)", () => {
        const many = Array.from({ length: 250 }, (_, i) => ({ id: `p${i}`, data: {} }));
        const groups = planDelivery(many, "user_b", 200);
        expect(groups.map((g) => g.length)).toEqual([200, 50]);
    });
});
