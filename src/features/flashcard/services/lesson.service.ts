/**
 * Service orchestrator for Lesson (Deck) metadata and atomic deep-saves.
 *
 * @remarks
 * High-value logic zone:
 * 1. **RT Subscription**: Syncs deck metadata.
 * 2. **Deep-Deletes**: Batch commitment to clear entire card collections plus Storage blobs.
 * 3. **Diff-based Saving**: Complex atomic upsert that normalizes IDs and garbage-collects unused assets.
 */

import {
    collection,
    collectionGroup,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { cardDoc, cardsCol } from "./card.service";
import { deleteCardImage } from "./image.service";

import type { Unsubscribe } from "firebase/firestore";
import type { FlashCard, Lesson } from "../types";

// ─── Firestore path helpers ────────────────────────────────────────────────

export function lessonsCol(userId: string) {
    return collection(db, "artifacts", APP_ID, "users", userId, "lessons");
}

export function lessonDoc(userId: string, lessonId: string) {
    return doc(db, "artifacts", APP_ID, "users", userId, "lessons", lessonId);
}

// ─── Share ID helper ───────────────────────────────────────────────────────

/**
 * Deterministically encodes `userId:lessonId` as a URL-safe Base64 token.
 * The encoded token is the shareId — it acts as both the URL slug and the
 * pointer to the lesson's owner + ID, so no extra collection is needed.
 */
export function buildShareId(userId: string, lessonId: string): string {
    const raw = btoa(`${userId}:${lessonId}`);
    return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Subscribe ────────────────────────────────────────────────────────────

/**
 * Establishes a real-time listener for a user's lesson collection.
 * Sorts results by creation timestamp in descending order.
 */
export function subscribeLessons(
    userId: string,
    onUpdate: (lessons: Lesson[]) => void,
    onError: (err: Error) => void,
): Unsubscribe {
    return onSnapshot(
        lessonsCol(userId),
        (snap) => {
            const lessons = snap.docs
                .map((d) => normalizeOwner({ ...d.data(), id: d.id } as Lesson))
                .sort((a, b) => b.createdAt - a.createdAt);

            // Backfill owner for legacy docs — the write triggers a new snapshot automatically
            snap.docs.forEach((d) => {
                const data = d.data();
                if (!data.owner && data.userId) {
                    backfillLessonOwner(data.userId, d.id).catch(() => {});
                }
            });

            onUpdate(lessons);
        },
        onError,
    );
}

// ─── Read operations ───────────────────────────────────────────────────────

export function deriveVisibilityFields(visibility: Lesson["visibility"]): {
    isIndexed: boolean;
    allowLinkAccess: boolean;
    isPublic: boolean;
} {
    switch (visibility) {
        case "public":
            return { isIndexed: true, allowLinkAccess: true, isPublic: true };
        case "unlisted":
            return { isIndexed: false, allowLinkAccess: true, isPublic: false };
        case "private":
        default:
            return { isIndexed: false, allowLinkAccess: false, isPublic: false };
    }
}

export async function updateLessonVisibility(
    userId: string,
    lessonId: string,
    visibility: Lesson["visibility"],
    publicRole: Lesson["publicRole"],
): Promise<void> {
    const shareId = buildShareId(userId, lessonId);
    const derived = deriveVisibilityFields(visibility);
    await setDoc(
        lessonDoc(userId, lessonId),
        { shareId, visibility, publicRole, ...derived },
        { merge: true },
    );
}

/**
 * Real-time listener for decks explicitly shared with the current user.
 * Queries the `lessons` collectionGroup for docs where `collaborators` contains
 * the user's UID but the user is NOT the owner.
 *
 * Requires a Firestore composite index on: collaborators (array-contains) + createdAt (desc)
 */
export function subscribeSharedWithMe(
    userId: string,
    onUpdate: (lessons: Lesson[]) => void,
    onError: (err: Error) => void,
): Unsubscribe {
    const q = query(
        collectionGroup(db, "lessons"),
        where("collaborators", "array-contains", userId),
    );
    return onSnapshot(
        q,
        (snap) => {
            const lessons = snap.docs
                .map((d) => normalizeOwner({ ...d.data(), id: d.id } as Lesson))
                // Exclude decks the user owns
                .filter((l) => l.userId !== userId)
                .sort((a, b) => b.createdAt - a.createdAt);

            // Backfill owner for legacy shared docs
            snap.docs.forEach((d) => {
                const data = d.data();
                if (!data.owner && data.userId && data.userId !== userId) {
                    backfillLessonOwner(data.userId, d.id).catch(() => {});
                }
            });

            onUpdate(lessons);
        },
        onError,
    );
}

/**
 * One-time fetch of globally public decks, ordered by cloneCount descending.
 * Used for the Discover section — no real-time listener needed.
 *
 * Requires a Firestore composite index on: isPublic (==) + cloneCount (desc)
 */
export async function fetchPublicLessons(pageLimit = 20): Promise<Lesson[]> {
    const q = query(
        collectionGroup(db, "lessons"),
        where("visibility", "==", "public"),
        where("isIndexed", "==", true),
        orderBy("cloneCount", "desc"),
        limit(pageLimit),
    );
    const snap = await getDocs(q);
    const lessons = snap.docs.map((d) => normalizeOwner({ ...d.data(), id: d.id } as Lesson));

    // Backfill owner for legacy public docs (fire-and-forget)
    snap.docs.forEach((d) => {
        const data = d.data();
        if (!data.owner && data.userId) {
            backfillLessonOwner(data.userId, d.id).catch(() => {});
        }
    });

    return lessons;
}

/**
 * Increments the cloneCount on a lesson when a user duplicates it.
 */
export async function incrementCloneCount(ownerId: string, lessonId: string): Promise<void> {
    await updateDoc(lessonDoc(ownerId, lessonId), { cloneCount: increment(1) });
}

// ─── Write operations ──────────────────────────────────────────────────────

export async function updateLesson(userId: string, lesson: Lesson): Promise<void> {
    const { id, ...data } = lesson;
    await setDoc(lessonDoc(userId, id), data, { merge: true });
}

/**
 * Updates the explicitly invited collaborators and their roles.
 * Uses updateDoc (not setDoc+merge) so removed keys are actually deleted from Firestore.
 */
export async function updateLessonRoles(
    userId: string,
    lessonId: string,
    roles: Record<string, "owner" | "editor" | "commenter" | "viewer">,
    collaborators: string[],
): Promise<void> {
    await updateDoc(lessonDoc(userId, lessonId), { roles, collaborators });
}

/**
 * Deletes a lesson AND all its cards (including Storage images) in a single
 * batch.  This replaces the old `deleteLesson` which left orphaned cards.
 */
export async function deleteLessonWithCards(userId: string, lessonId: string): Promise<void> {
    const cardsSnap = await getDocs(query(cardsCol(userId), where("lessonId", "==", lessonId)));

    const batch = writeBatch(db);
    const imagesToDelete: string[] = [];

    for (const cardSnap of cardsSnap.docs) {
        const card = { ...cardSnap.data(), id: cardSnap.id } as FlashCard;
        batch.delete(cardSnap.ref);
        if (card.imagePath) imagesToDelete.push(card.imagePath);
    }

    batch.delete(lessonDoc(userId, lessonId));
    await batch.commit();

    for (const path of imagesToDelete) {
        deleteCardImage(path).catch(() => {});
    }
}

// ─── saveLessonWithCards — diff-based, non-destructive ────────────────────

/**
 * Persists a lesson and its complete card set.
 *
 * For existing lessons the service performs a diff against the current cards
 * in Firestore:
 *   • Cards present in Firestore but missing from the incoming set → deleted
 *     (Storage images are also cleaned up).
 *   • Cards with real Firestore IDs → full document replace (preserves nothing
 *     the caller didn't provide, but the caller always passes the full card).
 *   • Cards with temp IDs (prefix "c_") → new documents are created.
 *
 * A Firestore WriteBatch is used so all mutations succeed or fail together.
 */
export async function saveLessonWithCards(
    userId: string,
    lesson: Lesson,
    cards: Omit<FlashCard, "lessonId">[],
    isNew: boolean,
): Promise<void> {
    if (!lesson.title.trim()) {
        throw new Error("Lesson title is required");
    }
    validateCardIds(cards);

    const batch = writeBatch(db);
    let targetLessonId = lesson.id;

    if (isNew) {
        const newRef = doc(lessonsCol(userId));
        targetLessonId = newRef.id;
        batch.set(newRef, {
            ...omitUndefined({ ...lesson }),
            id: targetLessonId,
            userId,
            cardCount: cards.length,
            roles: { [userId]: "owner" },
            collaborators: [userId],
            allowLinkAccess: false,
            visibility: "private",
            isIndexed: false,
        });
    } else {
        const { id: _id, ...lessonData } = lesson;
        batch.set(
            lessonDoc(userId, targetLessonId),
            { ...omitUndefined(lessonData), cardCount: cards.length },
            { merge: true },
        );

        // ── Diff: find cards that were removed ──────────────────────────────
        const existingSnap = await getDocs(
            query(cardsCol(userId), where("lessonId", "==", targetLessonId)),
        );
        const existingCards = existingSnap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as FlashCard,
        );

        const incomingIds = new Set(
            cards.filter((c) => c.id && !c.id.startsWith("c_")).map((c) => c.id),
        );

        // Build a lookup so we can detect cleared images on existing cards
        const existingById = new Map(existingCards.map((c) => [c.id, c]));

        for (const existing of existingCards) {
            if (!incomingIds.has(existing.id)) {
                // Card was removed — delete from Firestore + Storage
                batch.delete(cardDoc(userId, existing.id));
                if (existing.imagePath) {
                    deleteCardImage(existing.imagePath).catch(() => {});
                }
            }
        }

        // Detect cleared images on UPDATED cards (card kept but image removed)
        for (const card of cards) {
            if (!card.id || card.id.startsWith("c_")) continue;
            const existing = existingById.get(card.id);
            if (existing?.imagePath && !card.imagePath) {
                deleteCardImage(existing.imagePath).catch(() => {});
            }
        }
    }

    // ── Upsert all incoming cards with explicit sort order ────────────────
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const isTemp = !card.id || card.id.startsWith("c_");
        const ref = isTemp ? doc(cardsCol(userId)) : cardDoc(userId, card.id);

        const { id: _cardId, ...rawData } = card as FlashCard;
        const cardData = omitUndefined({
            ...rawData,
            lessonId: targetLessonId,
            sortOrder: i,
            easeFactor: rawData.easeFactor ?? 2.5,
            interval: rawData.interval ?? 0,
            repetitions: rawData.repetitions ?? 0,
            nextReviewAt: rawData.nextReviewAt ?? Date.now(),
        });

        batch.set(ref, cardData);
    }

    await batch.commit();
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Removes undefined values so Firestore doesn't receive them. */
function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/** Ensures every lesson has an owner field, defaulting to null values for legacy docs. */
export function normalizeOwner(lesson: Lesson): Lesson {
    return {
        ...lesson,
        owner: lesson.owner ?? { displayName: null, photoURL: null },
    };
}

/**
 * Fetches a user's public profile snapshot.
 * Written at login time to artifacts/{APP_ID}/userProfiles/{uid}.
 */
export async function getUserProfile(
    uid: string,
): Promise<{ displayName: string | null; photoURL: string | null } | null> {
    const ref = doc(db, "artifacts", APP_ID, "userProfiles", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
        displayName: data.displayName ?? null,
        photoURL: data.photoURL ?? null,
    };
}

/**
 * Backfills the `owner` field on a lesson document using the public profile.
 * Called when a lesson is fetched without an owner snapshot (legacy docs).
 * Fire-and-forget — never blocks the UI.
 */
export async function backfillLessonOwner(
    ownerId: string,
    lessonId: string,
): Promise<{ displayName: string | null; photoURL: string | null } | null> {
    const profile = await getUserProfile(ownerId);
    if (!profile) return null;
    await setDoc(lessonDoc(ownerId, lessonId), { owner: profile }, { merge: true });
    return profile;
}

/** Throws if any two cards share the same real (non-temp) ID. */
function validateCardIds(cards: Omit<FlashCard, "lessonId">[]): void {
    const realIds = cards.filter((c) => c.id && !c.id.startsWith("c_")).map((c) => c.id);
    if (new Set(realIds).size !== realIds.length) {
        throw new Error("Duplicate card IDs detected — possible data corruption");
    }
}
