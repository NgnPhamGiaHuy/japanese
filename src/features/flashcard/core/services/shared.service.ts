/**
 * @file shared.service
 * Logic layer for public deck sharing and external session resolution.
 */

import { doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { sortByOrder } from "@/shared/utils/reorder";
import { syncInviteToCollaborator } from "./access.service";
import { cardsCol } from "./card.service";
import { normalizeLesson } from "./lesson.service";

import type { User } from "firebase/auth";
import type { FlashCard, Lesson } from "../types";

// ─── Decode helper ─────────────────────────────────────────────────────────────

export interface ShareIdPayload {
    ownerId: string;
    lessonId: string;
}

/**
 * Decodes a URL-safe Base64 shareId back to { ownerId, lessonId }.
 *
 * @remarks
 * Uses a deterministic token format `ownerId:lessonId`.
 * Encoded with a URL-safe Base64 implementation to prevent issues in routing.
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

// ─── Shared session metadata ──────────────────────────────────────────────────

export interface SharedSessionMeta {
    sourceUserId: string;
    sourceLessonId: string;
    shareId: string;
    isShared: true;
}

// ─── Fetch shared lesson ──────────────────────────────────────────────────────

export interface SharedLessonResult {
    lesson: Lesson;
    cards: FlashCard[];
    meta: SharedSessionMeta;
}

/**
 * Resolves a shared lesson and its full card set using a guest share token.
 *
 * On access, if the authenticated user has a pending email invite, it is
 * automatically converted to a permanent collaborator entry.
 */
export async function getSharedLesson(
    shareId: string,
    currentUserId?: string,
    currentUser?: User | null,
): Promise<SharedLessonResult | null> {
    const payload = decodeShareId(shareId);
    if (!payload) return null;

    const { ownerId, lessonId } = payload;

    const lessonRef = doc(db, "artifacts", APP_ID, "users", ownerId, "lessons", lessonId);
    const lessonSnap = await getDoc(lessonRef);
    if (!lessonSnap.exists()) return null;

    let lesson = normalizeLesson({
        ...lessonSnap.data(),
        id: lessonSnap.id,
        __ownerIdFallback: ownerId,
    });

    // ── Auto-convert pending email invite → collaborator ──────────────────
    // Must happen BEFORE the access gate so restricted decks grant access
    // to invited users on their first visit.
    if (currentUser?.email) {
        const normalizedEmail = currentUser.email.trim().toLowerCase();
        if (lesson.invitedEmails?.[normalizedEmail]) {
            await syncInviteToCollaborator(currentUser, lesson, ownerId, lessonId);
            // Re-fetch so the updated roles are used in the access check below
            const refreshed = await getDoc(lessonRef);
            if (refreshed.exists()) {
                lesson = normalizeLesson({
                    ...refreshed.data(),
                    id: refreshed.id,
                    __ownerIdFallback: ownerId,
                });
            }
        }
    }

    // ── RBAC Resolution ───────────────────────────────────────────────────
    // Priority: owner → explicit role (includes just-converted invite) → pending email invite → public link
    const isOwner = lesson.roles?.[currentUserId ?? ""] === "owner";
    const hasExplicitRole = !!(currentUserId && lesson.roles?.[currentUserId]);

    // Safety net: if the user has a pending invite that wasn't converted
    // (e.g. email mismatch casing edge case), still grant access
    const hasPendingInvite = !!(
        currentUser?.email && lesson.invitedEmails?.[currentUser.email.trim().toLowerCase()]
    );

    const linkAccess = lesson.allowLinkAccess || lesson.isPublic;

    if (!isOwner && !hasExplicitRole && !hasPendingInvite && !linkAccess) {
        return null; // Deny access
    }

    const cardsSnap = await getDocs(query(cardsCol(ownerId), where("lessonId", "==", lessonId)));
    const cards = sortByOrder(cardsSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as FlashCard));

    return {
        lesson,
        cards,
        meta: { sourceUserId: ownerId, sourceLessonId: lessonId, shareId, isShared: true },
    };
}

// ─── Viewer progress tracking (separate namespace) ───────────────────────────

/** Path: users/{viewerId}/sharedProgress/{shareId} */
const viewerProgressDoc = (viewerId: string, shareId: string) =>
    doc(db, "artifacts", APP_ID, "users", viewerId, "sharedProgress", shareId);

/**
 * Saves lightweight study progress for a shared deck viewer.
 * NEVER touches the owner's data.
 */
export async function saveSharedStudyProgress(
    viewerId: string,
    shareId: string,
    sourceUserId: string,
    sourceLessonId: string,
    cardsStudied: number,
): Promise<void> {
    await setDoc(
        viewerProgressDoc(viewerId, shareId),
        {
            shareId,
            sourceUserId,
            sourceLessonId,
            cardsStudied,
            lastStudiedAt: new Date().toISOString(),
        },
        { merge: true },
    );
}

// ─── Game mode key builder for shared decks ───────────────────────────────────

/**
 * Builds a unique game mode key for shared deck sessions.
 * Uses "shared_" prefix to prevent collision with personal deck stats.
 */
export const sharedMatchGameMode = (shareId: string) => `shared_match_${shareId}`;
export const sharedSpeedGameMode = (shareId: string) => `shared_speed_${shareId}`;
