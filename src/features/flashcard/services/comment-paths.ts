/**
 * @file comment-paths
 * Firestore path helpers for the comments subcollection — split out of
 * comment.service.ts (E11-T3).
 */
import { collection, doc } from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";

import type { CollectionReference, DocumentReference } from "firebase/firestore";

/**
 * Returns a reference to the comments subcollection for a specific card.
 * Path: artifacts/{APP_ID}/users/{ownerId}/lessons/{lessonId}/cards/{cardId}/comments
 */
export function commentsCol(
    ownerId: string,
    lessonId: string,
    cardId: string,
): CollectionReference {
    return collection(
        db,
        "artifacts",
        APP_ID,
        "users",
        ownerId,
        "lessons",
        lessonId,
        "cards",
        cardId,
        "comments",
    );
}

/**
 * Returns a reference to a specific comment document.
 * Path: artifacts/{APP_ID}/users/{ownerId}/lessons/{lessonId}/cards/{cardId}/comments/{commentId}
 */
export function commentDoc(
    ownerId: string,
    lessonId: string,
    cardId: string,
    commentId: string,
): DocumentReference {
    return doc(
        db,
        "artifacts",
        APP_ID,
        "users",
        ownerId,
        "lessons",
        lessonId,
        "cards",
        cardId,
        "comments",
        commentId,
    );
}
