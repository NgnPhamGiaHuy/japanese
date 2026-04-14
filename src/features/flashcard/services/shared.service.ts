import { doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { cardsCol } from "./card.service";

import type { FlashCard, Lesson } from "../types";

// ─── Decode helper ─────────────────────────────────────────────────────────────

export interface ShareIdPayload {
    ownerId: string;
    lessonId: string;
}

/**
 * Decodes a URL-safe Base64 shareId back to { ownerId, lessonId }.
 * Returns null if the token is malformed.
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
 * Fetches a shared lesson and its cards using the shareId.
 *
 * Security:
 *  - Checks if user is explicitly in roles map
 *  - Fallback to allowLinkAccess / isPublic
 *  - NEVER touches the owner's SRS data or writes anything.
 */
export async function getSharedLesson(
    shareId: string,
    currentUserId?: string,
): Promise<SharedLessonResult | null> {
    const payload = decodeShareId(shareId);
    if (!payload) return null;

    const { ownerId, lessonId } = payload;

    const lessonRef = doc(db, "artifacts", APP_ID, "users", ownerId, "lessons", lessonId);
    const lessonSnap = await getDoc(lessonRef);
    if (!lessonSnap.exists()) return null;

    const lesson = { ...lessonSnap.data(), id: lessonSnap.id } as Lesson;

    // RBAC Resolution
    let roleAccess = false;
    if (currentUserId && lesson.roles && lesson.roles[currentUserId]) {
        roleAccess = true;
    }

    const linkAccess = lesson.allowLinkAccess || lesson.isPublic;

    if (!roleAccess && !linkAccess) {
        return null; // Deny access
    }

    const cardsSnap = await getDocs(query(cardsCol(ownerId), where("lessonId", "==", lessonId)));
    const cards = cardsSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as FlashCard);

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
