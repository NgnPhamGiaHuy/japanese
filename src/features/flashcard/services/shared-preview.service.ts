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

import { cache } from "react";

import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard/types";
import { APP_ID } from "@/lib/app-id";
import { adminDb } from "@/lib/firebase-admin";
import { decodeShareId, encodeShareId } from "@/shared/utils/shareToken";
import { isPubliclyAccessible } from "../utils/rbac";

// Sitemaps are an explicit "please index/list this" signal — capped well
// under the 50k-URL-per-sitemap protocol limit; a sitemap INDEX (multiple
// files) would only be worth the added complexity past this scale.
const SITEMAP_DECK_LIMIT = 1000;

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
 *
 * Wrapped in React's `cache()` so the page body, generateMetadata, and
 * opengraph-image — which all need this same data for the same request —
 * share one Firestore read instead of three.
 */
export const getPublicSharedLessonPreview = cache(async function getPublicSharedLessonPreview(
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
        if (!isPubliclyAccessible(data)) return null;

        return {
            title: typeof data.title === "string" ? data.title : "",
            description: typeof data.description === "string" ? data.description : "",
            themeColor:
                typeof data.themeColor === "string" ? data.themeColor : DEFAULT_DECK_THEME_COLOR,
            categories: Array.isArray(data.categories) ? data.categories : [],
            cardCount: typeof data.cardCount === "number" ? data.cardCount : 0,
            ownerName: typeof data.ownerName === "string" ? data.ownerName : null,
        };
    } catch (err) {
        console.error("[getPublicSharedLessonPreview] error:", err);
        return null;
    }
});

export interface PublicSharedLessonUrl {
    shareId: string;
    lastModified: Date;
}

/**
 * Lists shareIds for the sitemap.
 *
 * @remarks
 * Deliberately scoped to `isPublic === true` only — NOT `allowLinkAccess`.
 * "Anyone with the link" is an unlisted-sharing tier (the link still
 * unfurls fine when pasted anywhere, via getPublicSharedLessonPreview
 * above); a sitemap is an explicit "please index and list this" signal,
 * which only the "Public" tier's owner actually opted into.
 */
export async function listPublicSharedLessonUrls(): Promise<PublicSharedLessonUrl[]> {
    try {
        const snap = await adminDb
            .collectionGroup("lessons")
            .where("isPublic", "==", true)
            .limit(SITEMAP_DECK_LIMIT)
            .get();

        return snap.docs.flatMap((doc) => {
            const ownerId = doc.ref.parent.parent?.id;
            if (!ownerId) return [];

            const data = doc.data();
            const lastModifiedMs =
                typeof data.lastSharedAt === "number"
                    ? data.lastSharedAt
                    : typeof data.createdAt === "number"
                      ? data.createdAt
                      : Date.now();

            return [
                {
                    shareId: encodeShareId(ownerId, doc.id),
                    lastModified: new Date(lastModifiedMs),
                },
            ];
        });
    } catch (err) {
        console.error("[listPublicSharedLessonUrls] error:", err);
        return [];
    }
}
