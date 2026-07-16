/**
 * @file domain/id.ts
 * Deterministic notification document IDs — the backbone of both
 * idempotency and grouping.
 *
 * `collapseId(input)` hashes (kind + recipient + object-scoped collapse key) to
 * a stable, compact ID. Writing to that ID with `set(..., {merge:true})` means:
 *   - a duplicate producer (retry, double-fire) OVERWRITES the same doc → no
 *     duplicate inbox entries (idempotency);
 *   - a collapsing kind (comment burst) TARGETS the same doc so the writer can
 *     increment `count` / append `actors` instead of appending rows.
 *
 * Pure and isomorphic (browser + node) — no crypto import, no Firebase — so it
 * is unit-testable and usable from both the client facade and the server
 * writer, which must agree on the ID.
 */

import { collapseKeyOf } from "./registry";

import type { NotificationInput } from "./events";

/**
 * cyrb53 — a fast, well-distributed 53-bit string hash (public-domain). 53 bits
 * keeps per-user collision probability negligible at realistic inbox sizes
 * while producing a short, URL/ID-safe base36 string.
 */
export function cyrb53(str: string, seed = 0): number {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * Deterministic inbox doc ID for a notification input. Same (kind, recipient,
 * collapse key) → same ID on every device and on the server.
 */
export function collapseId(input: NotificationInput): string {
    const material = `${input.kind}|${input.recipientId}|${collapseKeyOf(input)}`;
    return `n_${cyrb53(material).toString(36)}`;
}
