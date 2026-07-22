/**
 * @file shareToken
 * Pure encode/decode helpers for public deck share tokens.
 *
 * @remarks
 * Deliberately dependency-free (no Firebase imports) so it's safe to import
 * from both client code and server-only modules (e.g. an RSC's Admin SDK
 * preview fetch) without pulling the client Firebase SDK's module-scope
 * initialization into a server bundle.
 */

export interface ShareIdPayload {
    ownerId: string;
    lessonId: string;
}

/**
 * Deterministically encodes `ownerId:lessonId` as a URL-safe Base64 token.
 * The encoded token is the shareId — it acts as both the URL slug and the
 * pointer to the lesson's owner + ID, so no extra collection is needed.
 */
export function encodeShareId(ownerId: string, lessonId: string): string {
    const raw = btoa(`${ownerId}:${lessonId}`);
    return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decodes a URL-safe Base64 shareId back to { ownerId, lessonId }.
 *
 * @remarks
 * Uses a deterministic token format `ownerId:lessonId`.
 *
 * @param shareId - The token from the URL.
 * @returns Resolved payload or null if the token is invalid/tampered.
 */
export function decodeShareId(shareId: string): ShareIdPayload | null {
    try {
        let base64 = decodeURIComponent(shareId).replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const decoded = atob(base64);
        const [ownerId, lessonId] = decoded.split(":");
        if (!ownerId || !lessonId) return null;
        return { ownerId, lessonId };
    } catch {
        return null;
    }
}
