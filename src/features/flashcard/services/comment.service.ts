/**
 * @file comment.service
 * Social orchestration layer for threaded flashcard feedback — the CRUD
 * operations (add/reply/resolve/get/subscribe/update/delete). Split from a
 * single 489-line file (E11-T3): errors → comment-errors.ts, path helpers →
 * comment-paths.ts, validation/sanitization → comment-validation.ts. This
 * file re-exports all of them, so every existing import path
 * (`../services/comment.service`, and the `export * from "./comment.service"`
 * in services/index.ts) keeps working unchanged.
 *
 * @remarks
 * Design Architecture:
 * 1. **Data Model**: 2-level nesting limit. Top-level comments are documents;
 *    replies are stored in an array within the parent document (optimizing read performance).
 * 2. **RBAC**: CRUD permissions are resolved based on the deck's `roles` metadata.
 * 3. **Sanitization**: Manual entity escaping to prevent XSS while maintaining Markdown compatibility.
 */

import {
    addDoc,
    deleteDoc,
    getDoc,
    getDocs,
    onSnapshot,
    Timestamp,
    updateDoc,
} from "firebase/firestore";

import { emitNotification } from "@/features/notifications/services";
import { CommentError, CommentErrorCode, mapFirestoreCommentError } from "./comment-errors";
import { commentDoc, commentsCol } from "./comment-paths";
import { sanitizeCommentContent, validateCommentContent } from "./comment-validation";

import type { Unsubscribe } from "firebase/firestore";
import type { Comment } from "../types/flashcard.types";

export { CommentError, CommentErrorCode } from "./comment-errors";
export { commentDoc, commentsCol } from "./comment-paths";
export { sanitizeCommentContent, validateCommentContent } from "./comment-validation";

/**
 * Adds a new comment to a flashcard.
 * Requires: user has commenter, editor, or owner role
 */
export async function addComment(
    ownerId: string,
    lessonId: string,
    cardId: string,
    content: string,
    userId: string,
    authorName?: string | null,
    authorEmail?: string | null,
): Promise<string> {
    try {
        const validation = validateCommentContent(content);
        if (!validation.valid) {
            throw new CommentError(
                CommentErrorCode.INVALID_CONTENT,
                validation.error || "Invalid comment content",
            );
        }
        const sanitized = sanitizeCommentContent(content.trim());
        const commentRef = await addDoc(commentsCol(ownerId, lessonId, cardId), {
            cardId,
            userId,
            authorName: authorName || null,
            authorEmail: authorEmail || null,
            content: sanitized,
            createdAt: Timestamp.now().toMillis(),
            resolved: false,
            replies: [],
        });

        // Notify the deck owner via the authorized server-side writer
        // (fire-and-forget; skip self). The writer verifies the sender and
        // derives the recipient — the client only supplies identifiers.
        if (userId !== ownerId) {
            void emitNotification({
                kind: "comment",
                ownerId,
                lessonId,
                cardId,
                commentId: commentRef.id,
            });
        }

        return commentRef.id;
    } catch (error: unknown) {
        mapFirestoreCommentError(
            error,
            "You don't have permission to add comments",
            "Failed to add comment. Please try again.",
        );
    }
}

/**
 * Adds a reply to an existing comment thread.
 */
export async function replyToComment(
    ownerId: string,
    lessonId: string,
    cardId: string,
    commentId: string,
    content: string,
    userId: string,
    authorName?: string | null,
    authorEmail?: string | null,
): Promise<void> {
    try {
        const validation = validateCommentContent(content);
        if (!validation.valid)
            throw new CommentError(
                CommentErrorCode.INVALID_CONTENT,
                validation.error || "Invalid reply content",
            );
        const sanitized = sanitizeCommentContent(content.trim());
        const ref = commentDoc(ownerId, lessonId, cardId, commentId);
        const snap = await getDoc(ref);
        if (!snap.exists())
            throw new CommentError(CommentErrorCode.COMMENT_NOT_FOUND, "Comment not found");
        const parentComment = snap.data();
        const replies = parentComment.replies || [];
        await updateDoc(ref, {
            replies: [
                ...replies,
                {
                    id: crypto.randomUUID(),
                    userId,
                    authorName: authorName || null,
                    authorEmail: authorEmail || null,
                    content: sanitized,
                    createdAt: Date.now(),
                },
            ],
        });

        // Notify the parent comment author via the authorized server-side
        // writer (fire-and-forget; skip self).
        if (parentComment.userId && parentComment.userId !== userId) {
            void emitNotification({
                kind: "reply",
                ownerId,
                lessonId,
                cardId,
                commentId,
            });
        }
    } catch (error: unknown) {
        mapFirestoreCommentError(
            error,
            "You don't have permission to reply to comments",
            "Failed to add reply. Please try again.",
        );
    }
}

/**
 * Toggles the resolved status of a comment thread.
 */
export async function resolveComment(
    ownerId: string,
    lessonId: string,
    cardId: string,
    commentId: string,
    _userId: string,
): Promise<void> {
    try {
        const ref = commentDoc(ownerId, lessonId, cardId, commentId);
        const snap = await getDoc(ref);
        if (!snap.exists())
            throw new CommentError(CommentErrorCode.COMMENT_NOT_FOUND, "Comment not found");
        const nowResolved = !snap.data().resolved;
        await updateDoc(ref, { resolved: nowResolved });

        // Notify the comment author when their thread is resolved (not on
        // unresolve; server derives the recipient and skips self).
        if (nowResolved) {
            void emitNotification({
                kind: "comment_resolved",
                ownerId,
                lessonId,
                cardId,
                commentId,
            });
        }
    } catch (error: unknown) {
        mapFirestoreCommentError(
            error,
            "You don't have permission to resolve comments",
            "Failed to resolve comment. Please try again.",
        );
    }
}

/**
 * Fetches all comments for a specific card (one-time read).
 */
export async function getComments(
    ownerId: string,
    lessonId: string,
    cardId: string,
): Promise<Comment[]> {
    try {
        const snapshot = await getDocs(commentsCol(ownerId, lessonId, cardId));
        return snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as Comment[];
    } catch (error: unknown) {
        mapFirestoreCommentError(
            error,
            "You don't have permission to view comments",
            "Failed to fetch comments. Please try again.",
        );
    }
}

/**
 * Subscribes to real-time comment updates for a card.
 * Returns unsubscribe function to prevent memory leaks.
 */
export function subscribeToComments(
    ownerId: string,
    lessonId: string,
    cardId: string,
    onUpdate: (comments: Comment[]) => void,
    onError: (err: Error) => void,
): Unsubscribe {
    return onSnapshot(
        commentsCol(ownerId, lessonId, cardId),
        (snapshot) => {
            onUpdate(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as Comment[]);
        },
        (error) => {
            console.error("[CommentService] Snapshot error:", error);
            onError(
                new CommentError(
                    CommentErrorCode.NETWORK_ERROR,
                    "Lost connection to comments. Retrying...",
                    error,
                ),
            );
        },
    );
}

/**
 * Updates comment content (edit functionality).
 */
export async function updateComment(
    ownerId: string,
    lessonId: string,
    cardId: string,
    commentId: string,
    content: string,
    _userId: string,
): Promise<void> {
    try {
        const validation = validateCommentContent(content);
        if (!validation.valid)
            throw new CommentError(
                CommentErrorCode.INVALID_CONTENT,
                validation.error || "Invalid comment content",
            );
        const sanitized = sanitizeCommentContent(content.trim());
        const ref = commentDoc(ownerId, lessonId, cardId, commentId);
        const snap = await getDoc(ref);
        if (!snap.exists())
            throw new CommentError(CommentErrorCode.COMMENT_NOT_FOUND, "Comment not found");
        await updateDoc(ref, { content: sanitized, updatedAt: Date.now() });
    } catch (error: unknown) {
        mapFirestoreCommentError(
            error,
            "You don't have permission to edit this comment",
            "Failed to update comment. Please try again.",
        );
    }
}

/**
 * Deletes a comment and all its replies.
 */
export async function deleteComment(
    ownerId: string,
    lessonId: string,
    cardId: string,
    commentId: string,
    _userId: string,
    _isOwner: boolean,
): Promise<void> {
    try {
        const ref = commentDoc(ownerId, lessonId, cardId, commentId);
        const snap = await getDoc(ref);
        if (!snap.exists())
            throw new CommentError(CommentErrorCode.COMMENT_NOT_FOUND, "Comment not found");
        await deleteDoc(ref);
    } catch (error: unknown) {
        mapFirestoreCommentError(
            error,
            "You don't have permission to delete this comment",
            "Failed to delete comment. Please try again.",
        );
    }
}
