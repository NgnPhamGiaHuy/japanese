/**
 * @file lesson-subscriptions
 * Real-time lesson listeners (own, shared-with-me, public) — split out of
 * lesson.service.ts (E11-T3).
 */
import { collectionGroup, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { sortByOrder } from "@/shared/utils";
import { newestFirst, normalizeLesson } from "./lesson-normalize";
import { lessonsCol } from "./lesson-paths";

import type { Unsubscribe } from "firebase/firestore";
import type { Lesson } from "../types";

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
            const lessons = sortByOrder(
                snap.docs.map((d) =>
                    normalizeLesson({ ...d.data(), id: d.id, __ownerIdFallback: userId }),
                ),
                newestFirst,
            );
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
        const lessons: Lesson[] = sortByOrder(
            snap.docs
                .map((d) => {
                    const raw = d.data() as Record<string, unknown>;
                    return normalizeLesson({
                        ...raw,
                        id: d.id,
                        __ownerIdFallback: extractOwnerIdFromPath(d.ref.path),
                    });
                })
                // Exclude the viewer's own lessons — checked directly against
                // ownerId ?? userId (ADR-115's owner semantics) rather than
                // roles[userId], which normalizeLesson above already heals to
                // include the owner anyway; this avoids depending on that
                // healing behavior for correctness.
                .filter((l) => (l.ownerId ?? l.userId) !== userId),
            newestFirst,
        );
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
 * Uses a collectionGroup query on `isPublic == true`, ordered by `createdAt`
 * descending and capped at `pageSize` (ADR-114, T-114a) — an unbounded
 * version of this exact query used to stream the entire public-deck corpus
 * into an un-virtualized grid, with cost growing linearly and unboundedly
 * as more decks are published (R-2). `pageSize` grows via a resubscribe
 * (the "grow-window" mechanism ADR-112 already sanctions for the identical
 * shape of problem in `subscribeNotifications`), not a new pagination
 * mechanism. Requires the composite index defined in firestore.indexes.json
 * for collectionGroup "lessons" on (isPublic, createdAt).
 * Excludes the current user's own decks so they don't see duplicates.
 */
export function subscribePublicLessons(
    currentUserId: string | null,
    onUpdate: (lessons: Lesson[]) => void,
    onError: (err: Error) => void,
    pageSize: number,
): Unsubscribe {
    const extractOwnerIdFromPath = (docPath: string): string | undefined => {
        const parts = docPath.split("/");
        const usersIdx = parts.indexOf("users");
        if (usersIdx === -1) return undefined;
        return parts[usersIdx + 1];
    };

    const q = query(
        collectionGroup(db, "lessons"),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc"),
        limit(pageSize),
    );

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
                .sort(newestFirst);
            onUpdate(lessons);
        },
        onError,
    );
}
