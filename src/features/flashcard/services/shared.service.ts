/**
 * @file shared.service
 * Logic layer for public deck sharing and external session resolution.
 */

import { doc, getDoc, getDocs, limit, query, startAfter, where } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { sortByOrder } from "@/shared/utils/reorder";
import { decodeShareId } from "@/shared/utils/shareToken";
import { syncInviteToCollaborator } from "./access.service";
import { cardsCol } from "./card.service";
import { normalizeLesson } from "./lesson.service";
import { getUserLessonProgress } from "./progress.service";
import { FRESH_SRS_STATE } from "../domain/types";
import { resolveRole } from "../utils/rbac";

import type { User } from "firebase/auth";
import type { DocumentSnapshot } from "firebase/firestore";
import type { CardWithProgress, UserCardProgress } from "../domain";
import type { DeckAccessRole, FlashCard, Lesson, SharedLessonViewModel } from "../types";

export { decodeShareId };
export type { ShareIdPayload } from "@/shared/utils/shareToken";

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
    viewerRole: DeckAccessRole;
}

// ─── Fetch shared lesson ──────────────────────────────────────────────────────

export interface SharedLessonResult {
    lesson: SharedLessonViewModel;
    cards: CardWithProgress[];
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
 * **Phase 3 Update:**
 * - Loads card content from owner's collection
 * - Loads viewer's progress from userProgress
 * - Merges content + progress → CardWithProgress[]
 *
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

        // Auto-convert pending email invite → collaborator before the access gate
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

        // RBAC gate — resolved once via the canonical engine (ADR-115) and
        // reused below as viewerRole, rather than a separately re-derived
        // isOwner/hasExplicitRole/hasPendingInvite/linkAccess check. That
        // duplicate's isOwner read `roles[uid] === "owner"` directly, which
        // in principle disagrees with the engine's `ownerId ?? userId` — in
        // practice `lesson` here is always normalizeLesson's output, which
        // already back-fills the owner's roles entry, so the two checks
        // happened to agree at this call site. Converging on one predicate
        // removes that incidental (and easily broken) coupling.
        const viewerRole = resolveRole({
            lesson,
            userId: currentUserId,
            userEmail: currentUser?.email ?? null,
        });

        if (viewerRole === "none") {
            return null;
        }

        // Load card content from owner
        const contentCards = sortByOrder(
            await fetchAllCards(ownerId, lessonId, lesson.cardCount ?? 0),
        );

        // Load viewer's progress (if authenticated)
        let progressMap = new Map<string, UserCardProgress>();
        if (currentUserId) {
            progressMap = await getUserLessonProgress(currentUserId, lessonId);
        }

        // Merge content + viewer's progress
        const cardsWithProgress: CardWithProgress[] = contentCards.map((card) => {
            const progress = progressMap.get(card.id);
            if (progress) {
                return { ...card, ...progress } as CardWithProgress;
            } else {
                // Never studied — use fresh SRS state
                return {
                    ...card,
                    cardId: card.id,
                    lessonId: card.lessonId,
                    sourceOwnerId: ownerId,
                    ...FRESH_SRS_STATE,
                    createdAt: Date.now(),
                    lastReviewedAt: null,
                } as CardWithProgress;
            }
        });

        return {
            lesson: stripSensitiveFields(lesson),
            cards: cardsWithProgress,
            meta: {
                sourceUserId: ownerId,
                sourceLessonId: lessonId,
                shareId,
                isShared: true,
                viewerRole,
            },
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
