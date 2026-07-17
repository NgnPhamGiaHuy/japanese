/**
 * @file shared-preview.service
 * Server-only, Admin SDK preview fetch for the public shared-deck page.
 *
 * @remarks
 * Deliberately separate from shared.service.ts (which uses the client SDK
 * and is imported by client hooks) — this file must never leak the client
 * Firebase SDK's module-scope init into a server bundle, and its own Admin
 * SDK usage must never leak into a client bundle either.
 *
 * Only ever returns data for decks that are genuinely public/link-accessible;
 * private or invite-only shares resolve to null here so no private record is
 * ever rendered to an unauthenticated server request. The full, viewer-aware
 * resolution (role, per-user progress) still happens client-side via
 * useSharedLesson — this is purely a first-paint/SEO preview.
 */

import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import { decodeShareId } from "@/shared/utils/shareToken";

const APP_ID = process.env.NEXT_PUBLIC_APP_ID ?? "kana-nihongo-master";

export interface PublicSharedLessonPreview {
    title: string;
    description: string;
    themeColor: string;
    categories: string[];
    cardCount: number;
    ownerName: string | null;
}

/**
 * Resolves a public preview of a shared deck for server rendering.
 *
 * @remarks
 * Returns null for: an invalid/tampered shareId, a deck that doesn't exist,
 * or a deck that isn't publicly link-accessible (`allowLinkAccess`/`isPublic`
 * both falsy) — the last case covers invite-only shares, which only resolve
 * for the specific invited viewer and must never render for an anonymous
 * server request.
 */
export async function getPublicSharedLessonPreview(
    shareId: string,
): Promise<PublicSharedLessonPreview | null> {
    const payload = decodeShareId(shareId);
    if (!payload) return null;

    const { ownerId, lessonId } = payload;

    try {
        const snap = await adminDb
            .collection("artifacts")
            .doc(APP_ID)
            .collection("users")
            .doc(ownerId)
            .collection("lessons")
            .doc(lessonId)
            .get();

        if (!snap.exists) return null;

        const data = snap.data() ?? {};
        if (!data.allowLinkAccess && !data.isPublic) return null;

        return {
            title: typeof data.title === "string" ? data.title : "",
            description: typeof data.description === "string" ? data.description : "",
            themeColor: typeof data.themeColor === "string" ? data.themeColor : "#1cb0f6",
            categories: Array.isArray(data.categories) ? data.categories : [],
            cardCount: typeof data.cardCount === "number" ? data.cardCount : 0,
            ownerName: typeof data.ownerName === "string" ? data.ownerName : null,
        };
    } catch (err) {
        console.error("[getPublicSharedLessonPreview] error:", err);
        return null;
    }
}
