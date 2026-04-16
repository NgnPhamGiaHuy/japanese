/**
 * Shared ordering utilities used across features.
 *
 * Supports both modern fractional 'order' and legacy 'sortOrder'.
 */
export interface OrderedEntity {
    id: string;
    order?: number;
    sortOrder?: number;
}

function arrayMove<T>(items: T[], fromIndex: number, toIndex: number): T[] {
    const nextItems = [...items];
    const [moved] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, moved);
    return nextItems;
}

export function sortByOrder<T extends OrderedEntity>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        const aOrder = a.order ?? a.sortOrder ?? Infinity;
        const bOrder = b.order ?? b.sortOrder ?? Infinity;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.id.localeCompare(b.id);
    });
}

export function getFractionalOrder<T extends OrderedEntity>(items: T[], index: number): number {
    const prev = items[index - 1];
    const next = items[index + 1];

    if (!prev && !next) return 1000;
    if (!prev) return (next?.order ?? next?.sortOrder ?? 1000) - 1000;
    if (!next) return (prev.order ?? prev.sortOrder ?? 0) + 1000;

    const prevVal = prev.order ?? prev.sortOrder ?? 0;
    const nextVal = next.order ?? next.sortOrder ?? 0;
    return (prevVal + nextVal) / 2;
}

export function reorderWithFractionalIndex<T extends OrderedEntity>(
    items: T[],
    fromIndex: number,
    toIndex: number,
): { nextItems: T[]; movedId: string; newOrder: number } {
    const nextItems = arrayMove(items, fromIndex, toIndex);
    const movedItem = nextItems[toIndex];
    return {
        nextItems,
        movedId: movedItem.id,
        newOrder: getFractionalOrder(nextItems, toIndex),
    };
}
