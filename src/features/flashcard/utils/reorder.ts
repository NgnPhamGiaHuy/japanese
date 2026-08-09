/**
 * Shared ordering utilities used across features.
 *
 * Order values are fractional-indexing base-62 string keys (via the
 * `fractional-indexing` package) — lexicographically sortable with no
 * floating-point precision ceiling, unlike the previous hand-rolled
 * midpoint-averaging scheme (repeated insertions at the same slot could
 * eventually exhaust a double's precision).
 *
 * Numeric `order`/`sortOrder` values are still supported for reading/display
 * (`sortByOrder`). This is NOT dead compatibility code: the majority of stored
 * cards still carry a numeric order, so removing the numeric branch would
 * scramble their display order. A reorder or save
 * always renormalizes the whole touched set to fresh string keys — there's
 * no ongoing support for computing a new fractional position relative to a
 * legacy numeric neighbor, since fractional-indexing's own key format isn't
 * compatible with arbitrary numeric strings.
 */
import { generateNKeysBetween } from "fractional-indexing";

export interface OrderedEntity {
    id: string;
    order?: number | string;
    sortOrder?: number;
}

export interface OrderChange {
    id: string;
    order: string;
}

function arrayMove<T>(items: T[], fromIndex: number, toIndex: number): T[] {
    const nextItems = [...items];
    const [moved] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, moved);
    return nextItems;
}

/**
 * Legacy numeric values always sort before fractional-indexing string keys —
 * a deterministic, stable rule for the transitional period, not a claim that
 * numbers and strings share one true fractional position. In practice a
 * given set (one lesson's cards, one user's lessons) is never actually mixed
 * for long: any reorder or save renormalizes the whole set atomically, so
 * this mainly guards against a set caught mid-transition.
 */
function compareOrderValues(
    a: number | string | undefined,
    b: number | string | undefined,
): number {
    if (a === undefined) return b === undefined ? 0 : 1;
    if (b === undefined) return -1;
    const aIsString = typeof a === "string";
    const bIsString = typeof b === "string";
    if (aIsString !== bIsString) return aIsString ? 1 : -1;
    if (aIsString) return a < b ? -1 : a > b ? 1 : 0;
    return (a as number) - (b as number);
}

/**
 * Sorts by explicit order (`order`, falling back to legacy `sortOrder`),
 * then by `tiebreak` for items with no order value or an equal one — e.g.
 * dashboard lessons default to newest-first so brand-new, never-reordered
 * decks appear at the top instead of in arbitrary id order.
 */
export function sortByOrder<T extends OrderedEntity>(
    items: T[],
    tiebreak: (a: T, b: T) => number = (a, b) => a.id.localeCompare(b.id),
): T[] {
    return [...items].sort((a, b) => {
        const cmp = compareOrderValues(a.order ?? a.sortOrder, b.order ?? b.sortOrder);
        return cmp !== 0 ? cmp : tiebreak(a, b);
    });
}

/**
 * Moves an item and renormalizes the WHOLE set to fresh fractional-indexing
 * keys in the resulting order. Every call regenerates every item's key, not
 * just the moved one — this keeps the operation correct regardless of
 * whether the set is still on legacy numeric orders, already migrated, or a
 * mix of both, with no dual-path branching on the data's era. At this app's
 * scale (tens of items per set, not thousands) a full-set batch write on
 * every reorder is cheap; the complexity of preserving a strict single-item
 * write isn't worth it for what it would buy.
 *
 * `changes` is every item's new order value — callers persist all of them in
 * one Firestore batch.
 */
export function reorderWithFractionalIndex<T extends OrderedEntity>(
    items: T[],
    fromIndex: number,
    toIndex: number,
): { nextItems: T[]; changes: OrderChange[] } {
    const moved = arrayMove(items, fromIndex, toIndex);
    const keys = generateNKeysBetween(null, null, moved.length);
    const changes = moved.map((item, i) => ({ id: item.id, order: keys[i] }));
    const nextItems = moved.map((item, i) => ({ ...item, order: keys[i] }));
    return { nextItems, changes };
}
