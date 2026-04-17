/**
 * @file shared.service
 * Logic layer for public deck sharing and external session resolution.
 */

import { doc, getDoc, getDocs, limit, query, setDoc, startAfter, where } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { sortByOrder } from "@/shared/utils/reorder";
import { syncInviteToCollaborator } from "./access.service";
import { cardsCol } from "./card.service";
import { normalizeLesson } from "./lesson.service";

import type { User } from "firebase/auth";
import type { DocumentSnapshot } from "firebase/firestore";
import type { FlashCard, Lesson, SharedCardViewModel, SharedLessonViewModel } from "../types";

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

// ─── Error types ──────────────────────────────────────────────────────────────

/**
 * Typed error thrown by getSharedLesson for recoverable failure modes.
 *
 * @remarks
 * Distinguishes network/quota failures (retriable) from access-denied/not-found
 * (non-retriable). Callers use `code` to decide between retry UI and 404 screen.
 */
export class SharedLoadError extends Error {
    constructor(
        public readonly code: "network-error" | "quota-exceeded",
        message: string,
    ) {
        super(message);
        this.name = "SharedLoadError";
    }
}

// ─── View model helpers ───────────────────────────────────────────────────────

/**
 * Strips sensitive RBAC fields from a Lesson before exposing it to viewers.
 *
 * @remarks
 * Removes roles, collaborators, invitedEmails, and collaboratorMeta so that
 * shared-context callers cannot read or accidentally write access-control data.
 * The result is frozen to prevent mutation.
 */
function stripSensitiveFields(lesson: Lesson): SharedLessonViewModel {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { roles, collaborators, invitedEmails, collaboratorMeta, ...safe } = lesson;
    return Object.freeze(safe) as SharedLessonViewModel;
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
    lesson: SharedLessonViewModel;
    cards: SharedCardViewModel[];
    meta: SharedSessionMeta;
}

const CARDS_PAGE_SIZE = 200;

/**
 * Fetches all cards for a lesson, paginating when cardCount exceeds CARDS_PAGE_SIZE.
 *
 * @remarks
 * Uses startAfter cursor-based pagination to stay within Firestore's per-query
 * document limits. Concatenates all pages into a single sorted array.
 */
async function fetchAllCards(
    ownerId: string,
    lessonId: string,
    cardCount: number,
): Promise<FlashCard[]> {
    const col = cardsCol(ownerId);
    const baseQuery = query(col, where("lessonId", "==", lessonId));

    if (cardCount <= CARDS_PAGE_SIZE) {
        const snap = await getDocs(baseQuery);
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as FlashCard);
    }

    // Paginate in batches of CARDS_PAGE_SIZE using startAfter cursor.
    const all: FlashCard[] = [];
    let lastDoc: DocumentSnapshot | undefined;

    while (true) {
        const pageQuery = lastDoc
            ? query(
                  col,
                  where("lessonId", "==", lessonId),
                  limit(CARDS_PAGE_SIZE),
                  startAfter(lastDoc),
              )
            : query(col, where("lessonId", "==", lessonId), limit(CARDS_PAGE_SIZE));

        const snap = await getDocs(pageQuery);
        if (snap.empty) break;

        snap.docs.forEach((d) => all.push({ ...d.data(), id: d.id } as FlashCard));
        lastDoc = snap.docs[snap.docs.length - 1];

        if (snap.docs.length < CARDS_PAGE_SIZE) break;
    }

    return all;
}

/**
 * Resolves a shared lesson and its full card set using a guest share token.
 *
 * @remarks
 * Returns null for access-denied and not-found conditions so callers render
 * a 404 screen. Throws SharedLoadError for network/quota failures so callers
 * can surface a retry UI.
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

    try {
        const lessonSnap = await getDoc(lessonRef);
        if (!lessonSnap.exists()) return null;

        let lesson = normalizeLesson({
            ...lessonSnap.data(),
            id: lessonSnap.id,
            __ownerIdFallback: ownerId,
        });

        // Auto-convert pending email invite → collaborator before the access gate.
        if (currentUser?.email) {
            const normalizedEmail = currentUser.email.trim().toLowerCase();
            if (lesson.invitedEmails?.[normalizedEmail]) {
                await syncInviteToCollaborator(currentUser, lesson, ownerId, lessonId);
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

        // RBAC: owner → explicit role → pending invite → public link access.
        const isOwner = lesson.roles?.[currentUserId ?? ""] === "owner";
        const hasExplicitRole = !!(currentUserId && lesson.roles?.[currentUserId]);
        const hasPendingInvite = !!(
            currentUser?.email && lesson.invitedEmails?.[currentUser.email.trim().toLowerCase()]
        );
        const linkAccess = lesson.allowLinkAccess || lesson.isPublic;

        if (!isOwner && !hasExplicitRole && !hasPendingInvite && !linkAccess) {
            return null;
        }

        const cards = sortByOrder(await fetchAllCards(ownerId, lessonId, lesson.cardCount ?? 0));

        return {
            lesson: stripSensitiveFields(lesson),
            cards: cards as SharedCardViewModel[],
            meta: { sourceUserId: ownerId, sourceLessonId: lessonId, shareId, isShared: true },
        };
    } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "permission-denied") return null;
        if (code === "resource-exhausted") {
            throw new SharedLoadError(
                "quota-exceeded",
                "Service temporarily unavailable — please try again later",
            );
        }
        throw new SharedLoadError("network-error", "Network error loading shared deck");
    }
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
