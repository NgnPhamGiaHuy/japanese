/**
 * Service orchestrator for Lesson (Deck) metadata and atomic deep-saves.
 *
 * @remarks
 * High-value logic zone:
 * 1. **RT Subscription**: Syncs deck metadata.
 * 2. **Deep-Deletes**: Batch commitment to clear entire card collections plus Storage blobs.
 * 3. **Diff-based Saving**: Complex atomic upsert that normalizes IDs and garbage-collects unused assets.
 */

/**
 * Service orchestrator for Lesson (Deck) metadata and atomic deep-saves.
 *
 * @remarks
 * High-value logic zone:
 * 1. **RT Subscription**: Syncs deck metadata.
 * 2. **Deep-Deletes**: Batch commitment to clear entire card collections plus Storage blobs.
 * 3. **Diff-based Saving**: Complex atomic upsert that normalizes IDs and garbage-collects unused assets.
 */
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
    getDocs,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { cardDoc, cardsCol } from "./card.service";
import { deleteCardImage } from "./image.service";
import { CardValidationError, validateAtomicCard } from "../utils";

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

// ─── Schema normalization (safe read-healing) ──────────────────────────────

type NormalizeLessonInput = Lesson & {
    /**
     * Internal, non-persisted hint.
     * Used when the snapshot doesn't include an owner field (legacy docs).
     */
    __ownerIdFallback?: string;
    /**
     * Legacy share fields (not referenced by the app code directly anymore).
     * We keep mapping for backward compatibility.
     */
    sharedBy?: string;
    sharedByName?: string | null;
    sharedAt?: number;
};

/**
 * Normalizes a Lesson snapshot so that:
 * - `ownerId` and legacy `userId` are both present (compat)
 * - `roles` always includes the owner role (roles are source-of-truth)
 * - `ownerName` has a best-effort fallback (zero-join)
 * - legacy share fields are mapped into `lastSharedBy*`
 *
 * Never deletes legacy fields immediately.
 */
export function normalizeLesson(raw: unknown): Lesson {
    const input = raw as NormalizeLessonInput;
    const { __ownerIdFallback, sharedBy, sharedByName, sharedAt, ...doc } =
        input ?? ({} as NormalizeLessonInput);

    const ownerId = (doc.ownerId ?? doc.userId ?? __ownerIdFallback) as string | undefined;

    const rolesFromDoc = doc.roles as NonNullable<Lesson["roles"]> | undefined;
    const normalizedRoles: NonNullable<Lesson["roles"]> | undefined = ownerId
        ? {
              ...(rolesFromDoc ?? {}),
              ...(rolesFromDoc?.[ownerId] ? {} : { [ownerId]: "owner" }),
          }
        : rolesFromDoc;

    const collaborators =
        doc.collaborators ?? (normalizedRoles ? Object.keys(normalizedRoles) : undefined);

    const lastSharedBy = (doc.lastSharedBy ?? sharedBy) as string | undefined;
    const lastSharedByName =
        doc.lastSharedByName ??
        sharedByName ??
        (lastSharedBy ? (doc.collaboratorMeta?.[lastSharedBy]?.displayName ?? null) : null);

    const createdAt = typeof doc.createdAt === "number" ? doc.createdAt : Date.now();

    const title = String(doc.title ?? "");
    const description = String(doc.description ?? "");
    const tags = Array.isArray(doc.tags) ? doc.tags : [];
    const cardCount = typeof doc.cardCount === "number" ? doc.cardCount : 0;

    const ownerNameFromMeta = ownerId ? doc.collaboratorMeta?.[ownerId]?.displayName : undefined;
    const ownerNameRaw = (doc.ownerName ?? ownerNameFromMeta ?? "Unknown") as unknown;
    const ownerName =
        typeof ownerNameRaw === "string" && ownerNameRaw.trim().length > 0
            ? ownerNameRaw
            : "Unknown";

    const ownerAvatarRaw = (doc.ownerAvatar ?? null) as unknown;
    const ownerAvatar =
        typeof ownerAvatarRaw === "string" && ownerAvatarRaw.trim().length > 0
            ? ownerAvatarRaw
            : null;

    const lastSharedByNameRaw = lastSharedByName as unknown;
    const lastSharedByNameFinal =
        typeof lastSharedByNameRaw === "string" && lastSharedByNameRaw.trim().length > 0
            ? lastSharedByNameRaw
            : null;

    const lastSharedByAvatarRaw = (doc.lastSharedByAvatar ?? null) as unknown;
    const lastSharedByAvatar =
        typeof lastSharedByAvatarRaw === "string" && lastSharedByAvatarRaw.trim().length > 0
            ? lastSharedByAvatarRaw
            : null;

    return {
        // Preserve anything else for forward compatibility first.
        ...(doc as Record<string, unknown>),

        // Identity + required fields
        id: String(doc.id ?? ""),
        title,
        description,
        tags,
        createdAt,
        cardCount,

        // Core identity + legacy compatibility
        ownerId,
        ownerName,
        ownerAvatar,
        userId: (doc.userId ?? ownerId) as string | undefined,

        // Access control (roles is source of truth)
        roles: normalizedRoles,
        collaborators,

        // Existing flags + metadata
        allowLinkAccess: doc.allowLinkAccess,
        publicRole: doc.publicRole,
        invitedEmails: doc.invitedEmails,
        collaboratorMeta: doc.collaboratorMeta,
        isPublic: doc.isPublic,
        shareId: doc.shareId,
        themeColor: doc.themeColor,

        // UI metadata
        lastSharedBy,
        lastSharedByName: lastSharedByNameFinal,
        lastSharedByAvatar,
        lastSharedAt: doc.lastSharedAt ?? sharedAt,
    } as Lesson;
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
                .map((d) => normalizeLesson({ ...d.data(), id: d.id, __ownerIdFallback: userId }))
                .sort((a, b) => {
                    const aOrder = a.order ?? Infinity;
                    const bOrder = b.order ?? Infinity;
                    if (aOrder !== bOrder) return aOrder - bOrder;
                    return b.createdAt - a.createdAt;
                });
            onUpdate(lessons);
        },
        onError,
    );
}

/**
 * Subscribes to lessons where the user is a collaborator but NOT the owner.
 * Uses a collection group query on 'lessons' — requires a Firestore index.
 */
export function subscribeSharedLessons(
    userId: string,
    onUpdate: (lessons: Lesson[]) => void,
    onError: (err: Error) => void,
): Unsubscribe {
    const extractOwnerIdFromPath = (docPath: string): string | undefined => {
        // Expected: .../users/{ownerId}/lessons/{lessonId}
        const parts = docPath.split("/");
        const usersIdx = parts.indexOf("users");
        if (usersIdx === -1) return undefined;
        return parts[usersIdx + 1];
    };

    type SnapshotLike = {
        docs: Array<{
            id: string;
            ref: { path: string };
            data: () => unknown;
        }>;
    };

    const mapLessonsFromSnapshot = (snap: SnapshotLike) => {
        const lessons: Lesson[] = snap.docs
            .map((d) => {
                const raw = d.data() as Record<string, unknown>;
                return normalizeLesson({
                    ...raw,
                    id: d.id,
                    __ownerIdFallback: extractOwnerIdFromPath(d.ref.path),
                });
            })
            .filter((l) => l.roles?.[userId] !== "owner")
            .sort((a: Lesson, b: Lesson) => {
                const aOrder = a.order ?? Infinity;
                const bOrder = b.order ?? Infinity;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return b.createdAt - a.createdAt;
            });
        onUpdate(lessons);
    };

    // Legacy fallback (works with existing docs that still have `collaborators`)
    const qCollaborators = query(
        collectionGroup(db, "lessons"),
        where("collaborators", "array-contains", userId),
    );

    // Preferred query: roles map is the source-of-truth
    const qRoles = query(
        collectionGroup(db, "lessons"),
        where(`roles.${userId}`, "in", ["owner", "editor", "commenter", "viewer"]),
    );

    let currentUnsub: Unsubscribe = () => {};

    const startCollaborators = () => {
        currentUnsub = onSnapshot(qCollaborators, mapLessonsFromSnapshot, onError);
    };

    const startRoles = () => {
        currentUnsub = onSnapshot(qRoles, mapLessonsFromSnapshot, (err) => {
            console.warn("[subscribeSharedLessons] roles query failed, falling back:", err);
            // Tear down roles listener and retry with the legacy collaborators query.
            currentUnsub();
            startCollaborators();
        });
    };

    startRoles();
    return () => currentUnsub();
}

/**
 * Real-time subscription to all publicly discoverable lessons across all users.
 *
 * @remarks
 * Uses a collectionGroup query on `isPublic == true`. Requires the Firestore
 * index defined in firestore.indexes.json for collectionGroup "lessons" on isPublic.
 * Results are sorted by creation date descending (newest first).
 * Excludes the current user's own decks so they don't see duplicates.
 */
export function subscribePublicLessons(
    currentUserId: string | null,
    onUpdate: (lessons: Lesson[]) => void,
    onError: (err: Error) => void,
): Unsubscribe {
    const extractOwnerIdFromPath = (docPath: string): string | undefined => {
        const parts = docPath.split("/");
        const usersIdx = parts.indexOf("users");
        if (usersIdx === -1) return undefined;
        return parts[usersIdx + 1];
    };

    const q = query(collectionGroup(db, "lessons"), where("isPublic", "==", true));

    return onSnapshot(
        q,
        (snap) => {
            const lessons: Lesson[] = snap.docs
                .map((d) => {
                    const ownerId = extractOwnerIdFromPath(d.ref.path);
                    return normalizeLesson({ ...d.data(), id: d.id, __ownerIdFallback: ownerId });
                })
                // Exclude the viewer's own decks — they already appear in "My Decks".
                .filter((l) => !currentUserId || l.ownerId !== currentUserId)
                .sort((a, b) => b.createdAt - a.createdAt);
            onUpdate(lessons);
        },
        onError,
    );
}

// ─── Write operations ──────────────────────────────────────────────────────

export async function updateLesson(userId: string, lesson: Lesson): Promise<void> {
    const { id, ...data } = lesson;
    await setDoc(lessonDoc(userId, id), data, { merge: true });
}

/**
 * Updates the order of a single lesson (O(1) write).
 */
export async function reorderLesson(
    userId: string,
    lessonId: string,
    newOrder: number,
): Promise<void> {
    await updateDoc(lessonDoc(userId, lessonId), { order: newOrder });
}

/**
 * Updates link-based share settings for a lesson.
 *
 * @param isPublic - When true, the deck is fully public and discoverable without a link.
 *                   When false with allowLinkAccess true, the deck is link-only (not discoverable).
 */
export async function shareLessonSettings(
    userId: string,
    lessonId: string,
    allowLinkAccess: boolean,
    publicRole: Lesson["publicRole"],
    sharedById: string,
    sharedByName?: string | null,
    sharedByAvatar?: string | null,
    isPublic?: boolean,
): Promise<void> {
    const shareId = buildShareId(userId, lessonId);
    await setDoc(
        lessonDoc(userId, lessonId),
        {
            shareId,
            allowLinkAccess,
            publicRole,
            isPublic: isPublic ?? allowLinkAccess,
            lastSharedBy: sharedById,
            lastSharedByName: sharedByName ?? null,
            lastSharedByAvatar: sharedByAvatar ?? null,
            lastSharedAt: Date.now(),
        },
        { merge: true },
    );
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
    sharedById: string,
    sharedByName?: string | null,
    sharedByAvatar?: string | null,
): Promise<void> {
    await updateDoc(lessonDoc(userId, lessonId), {
        roles,
        collaborators,
        lastSharedBy: sharedById,
        lastSharedByName: sharedByName ?? null,
        lastSharedByAvatar: sharedByAvatar ?? null,
        lastSharedAt: Date.now(),
    });
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

    // ── Atomic Card validation — must pass before any Firestore write ─────
    const allViolations = cards.flatMap((card) => validateAtomicCard(card).violations);
    if (allViolations.length > 0) {
        throw new CardValidationError(
            "One or more cards violate the Atomic Card principle",
            allViolations,
        );
    }

    const batch = writeBatch(db);
    let targetLessonId = lesson.id;

    if (isNew) {
        const newRef = doc(lessonsCol(userId));
        targetLessonId = newRef.id;
        batch.set(newRef, {
            ...omitUndefined({ ...lesson }),
            id: targetLessonId,
            userId,
            ownerId: userId,
            ownerName: lesson.ownerName ?? null,
            ownerAvatar: lesson.ownerAvatar ?? null,
            cardCount: cards.length,
            roles: { [userId]: "owner" },
            collaborators: [userId],
            allowLinkAccess: false,
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
            order: i * 1000,
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

/** Throws if any two cards share the same real (non-temp) ID. */
function validateCardIds(cards: Omit<FlashCard, "lessonId">[]): void {
    const realIds = cards.filter((c) => c.id && !c.id.startsWith("c_")).map((c) => c.id);
    if (new Set(realIds).size !== realIds.length) {
        throw new Error("Duplicate card IDs detected — possible data corruption");
    }
}
