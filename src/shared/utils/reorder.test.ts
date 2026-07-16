import { describe, expect, it } from "vitest";

import { reorderWithFractionalIndex, sortByOrder } from "./reorder";

import type { OrderedEntity } from "./reorder";

function item(id: string, order?: number | string, sortOrder?: number): OrderedEntity {
    return { id, order, sortOrder };
}

describe("sortByOrder", () => {
    it("sorts pure-numeric (legacy) items ascending", () => {
        const items = [item("c", 2000), item("a", 0), item("b", 1000)];
        expect(sortByOrder(items).map((i) => i.id)).toEqual(["a", "b", "c"]);
    });

    it("sorts pure-string (migrated) items lexicographically", () => {
        const items = [item("b", "b0"), item("a", "a0"), item("c", "c0")];
        expect(sortByOrder(items).map((i) => i.id)).toEqual(["a", "b", "c"]);
    });

    it("sorts legacy numeric items before migrated string items", () => {
        const items = [item("migrated", "a0"), item("legacy", 500)];
        expect(sortByOrder(items).map((i) => i.id)).toEqual(["legacy", "migrated"]);
    });

    it("falls back to legacy sortOrder when order is unset", () => {
        const items = [item("b", undefined, 2), item("a", undefined, 1)];
        expect(sortByOrder(items).map((i) => i.id)).toEqual(["a", "b"]);
    });

    it("items with no order value at all sort last, tiebroken by id", () => {
        const items = [item("z"), item("a", 100), item("m")];
        expect(sortByOrder(items).map((i) => i.id)).toEqual(["a", "m", "z"]);
    });

    it("uses id as the default tiebreak for equal order values", () => {
        const items = [item("b", 100), item("a", 100)];
        expect(sortByOrder(items).map((i) => i.id)).toEqual(["a", "b"]);
    });

    it("respects a custom tiebreak for equal/unset order values", () => {
        const withCreatedAt = (id: string, createdAt: number) => ({ ...item(id), createdAt });
        const items = [withCreatedAt("old", 1), withCreatedAt("new", 2)];
        const newestFirst = (a: (typeof items)[number], b: (typeof items)[number]) =>
            b.createdAt - a.createdAt;
        expect(sortByOrder(items, newestFirst).map((i) => i.id)).toEqual(["new", "old"]);
    });
});

describe("reorderWithFractionalIndex", () => {
    it("moves the item to the target index in nextItems", () => {
        const items = [item("a", "a0"), item("b", "b0"), item("c", "c0")];
        const { nextItems } = reorderWithFractionalIndex(items, 0, 2);
        expect(nextItems.map((i) => i.id)).toEqual(["b", "c", "a"]);
    });

    it("returns a change for every item, not just the moved one", () => {
        const items = [item("a", "a0"), item("b", "b0"), item("c", "c0")];
        const { changes } = reorderWithFractionalIndex(items, 0, 2);
        expect(changes.map((c) => c.id).sort()).toEqual(["a", "b", "c"]);
    });

    it("generated keys are all distinct strings", () => {
        const items = Array.from({ length: 10 }, (_, i) => item(`id-${i}`, i * 1000));
        const { changes } = reorderWithFractionalIndex(items, 2, 7);
        const keys = changes.map((c) => c.order);
        expect(new Set(keys).size).toBe(keys.length);
        for (const k of keys) expect(typeof k).toBe("string");
    });

    it("re-sorting by the new order values reproduces nextItems' sequence", () => {
        const items = [item("a", "a0"), item("b", "b0"), item("c", "c0"), item("d", "d0")];
        const { nextItems, changes } = reorderWithFractionalIndex(items, 3, 1);
        const orderById = new Map(changes.map((c) => [c.id, c.order]));
        const stamped = nextItems.map((i) => ({ ...i, order: orderById.get(i.id) }));
        expect(sortByOrder(stamped).map((i) => i.id)).toEqual(nextItems.map((i) => i.id));
    });

    it("renormalizes a fully legacy-numeric set onto fresh string keys", () => {
        const items = [item("a", 0), item("b", 1000), item("c", 2000)];
        const { nextItems, changes } = reorderWithFractionalIndex(items, 2, 0);
        expect(nextItems.map((i) => i.id)).toEqual(["c", "a", "b"]);
        for (const c of changes) expect(typeof c.order).toBe("string");
        // The freshly-stamped set sorts correctly on its own new string keys.
        const orderById = new Map(changes.map((c) => [c.id, c.order]));
        const stamped = nextItems.map((i) => ({ ...i, order: orderById.get(i.id) }));
        expect(sortByOrder(stamped).map((i) => i.id)).toEqual(["c", "a", "b"]);
    });

    it("handles a two-item list", () => {
        const items = [item("a", "a0"), item("b", "b0")];
        const { nextItems } = reorderWithFractionalIndex(items, 0, 1);
        expect(nextItems.map((i) => i.id)).toEqual(["b", "a"]);
    });
});
