/**
 * @file domain/utils.ts
 * Pure, dependency-free helpers for the notification service.
 *
 * Deliberately imports NO Firebase — so these functions are unit-testable in the
 * plain `node` Vitest environment without an emulator or browser globals
 * (mirrors the pattern used by shared/audio/*).
 */

/**
 * Normalizes a Firestore `createdAt` value to epoch milliseconds.
 *
 * Handles every shape a notification doc's `createdAt` can take during the
 * schema migration:
 * - `number`            → legacy client-clock docs (returned as-is)
 * - Firestore Timestamp → `{ toMillis(): number }` (resolved serverTimestamp)
 * - `{ seconds }`       → plain-object Timestamp (e.g. from JSON/emulator)
 * - `null` / `undefined`→ an unresolved serverTimestamp on the writer's own
 *                          device (latency compensation) — fall back to "now"
 *                          purely for display ordering.
 */
export function toMillis(value: unknown): number {
    if (typeof value === "number") return value;
    if (value && typeof value === "object") {
        const v = value as { toMillis?: () => number; seconds?: number };
        if (typeof v.toMillis === "function") return v.toMillis();
        if (typeof v.seconds === "number") return v.seconds * 1000;
    }
    // Unresolved serverTimestamp (writer's local snapshot) — display as now.
    return Date.now();
}

/**
 * Splits an array into chunks of at most `size` items.
 *
 * Used to keep Firestore write batches under the 500-operation ceiling: a
 * batch that updates N docs costs N ops, and delivery (set + delete per item)
 * costs 2N ops, so callers pick `size` accordingly (≤400 for single-op
 * updates, ≤200 for the set+delete delivery batch).
 */
export function chunk<T>(items: readonly T[], size: number): T[][] {
    if (size < 1) throw new Error("chunk size must be >= 1");
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        out.push(items.slice(i, i + size));
    }
    return out;
}

// ─── Pending-delivery planning ────────────────────────────────────────────────

export interface PendingItem {
    id: string;
    data: Record<string, unknown>;
}

export interface DeliveryWrite {
    /** Destination inbox doc ID — REUSES the pending ID for idempotency. */
    destId: string;
    /** Pending doc ID to delete after the copy. */
    deleteId: string;
    /** Payload written to the inbox doc. */
    data: Record<string, unknown>;
}

/**
 * Pure planner for `deliverPendingNotifications`. Given the pending
 * items for an email, returns the write plan grouped into commit-sized batches.
 *
 * The idempotency guarantee lives here and is unit-tested without an emulator:
 * the destination inbox doc ID equals the pending doc ID, so a concurrent
 * second delivery (two devices / a token refresh mid-delivery) overwrites the
 * same doc instead of creating a duplicate.
 */
export function planDelivery(
    items: readonly PendingItem[],
    userId: string,
    size: number,
): DeliveryWrite[][] {
    const writes: DeliveryWrite[] = items.map((it) => ({
        destId: it.id,
        deleteId: it.id,
        data: { ...it.data, userId, status: "unread", isDeleted: false },
    }));
    return chunk(writes, size);
}
