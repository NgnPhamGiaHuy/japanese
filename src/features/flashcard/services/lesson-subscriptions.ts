/**
 * @file lesson-subscriptions
 * Real-time lesson listeners (own, shared-with-me, public) — split out of
 * lesson.service.ts (E11-T3).
 */
import { collectionGroup, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { sortByOrder } from "@/features/flashcard/utils";
import { db } from "@/lib/firebase";
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
                snap.docs.map((d) => normalizeLesson({ ...d.data(), id: d.id })),
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
 *
 * LDG-22 (2026-08-04): the legacy `collaborators`-array fallback query was
 * removed — every write path has always kept `roles` and `collaborators` in
 * lockstep, so the roles query alone was already a strict superset; the
 * matching `firestore.rules` collection-group branch was updated in the same
 * change.
 */
export function subscribeSharedLessons(
    userId: string,
    onUpdate: (lessons: Lesson[]) => void,
    onError: (err: Error) => void,
): Unsubscribe {
    type SnapshotLike = {
        docs: Array<{
            id: string;
            data: () => unknown;
        }>;
    };

    const mapLessonsFromSnapshot = (snap: SnapshotLike) => {
        const lessons: Lesson[] = sortByOrder(
            snap.docs
                .map((d) => normalizeLesson({ ...(d.data() as Record<string, unknown>), id: d.id }))
                // Exclude the viewer's own lessons.
                .filter((l) => l.ownerId !== userId),
            newestFirst,
        );
        onUpdate(lessons);
    };

    const qRoles = query(
        collectionGroup(db, "lessons"),
        where(`roles.${userId}`, "in", ["owner", "editor", "commenter", "viewer"]),
    );

    return onSnapshot(qRoles, mapLessonsFromSnapshot, onError);
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
                .map((d) => normalizeLesson({ ...d.data(), id: d.id }))
                // Exclude the viewer's own decks — they already appear in "My Decks".
                .filter((l) => !currentUserId || l.ownerId !== currentUserId)
                .sort(newestFirst);
            onUpdate(lessons);
        },
        onError,
    );
}
