/**
 * @file comment.service
 * Social orchestration layer for threaded flashcard feedback.
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
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    Timestamp,
    updateDoc,
} from "firebase/firestore";

import { APP_ID, db } from "@/lib/firebase";
import { notifyComment, notifyReply } from "@/features/notifications";

import type { CollectionReference, DocumentReference, Unsubscribe } from "firebase/firestore";
import type { Comment } from "../types/flashcard.types";

// ─── Error Handling ────────────────────────────────────────────────────────

/**
 * Specific error codes for comment operations, mapped to user-friendly UI messages.
 */
export enum CommentErrorCode {
    /** Insufficient RBAC permissions (e.g. viewer trying to delete) */
    PERMISSION_DENIED = "PERMISSION_DENIED",
    /** Failed validation rules (empty or too long) */
    INVALID_CONTENT = "INVALID_CONTENT",
    /** Target ID does not exist */
    COMMENT_NOT_FOUND = "COMMENT_NOT_FOUND",
    /** Connectivity issues */
    NETWORK_ERROR = "NETWORK_ERROR",
    /** Catch-all for unexpected failures */
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Domain-specific error class for social operations.
 * Wraps Firestore errors with semantic codes and human-readable context.
 */
export class CommentError extends Error {
    code: CommentErrorCode;
    originalError?: Error;

    constructor(code: CommentErrorCode, message: string, originalError?: Error) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = "CommentError";
    }
}

// ─── Firestore path helpers ────────────────────────────────────────────────

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

// ─── Validation and Sanitization ───────────────────────────────────────────

/**
 * Validates comment content before submission.
 * Rules: non-empty, max 2000 chars, trimmed whitespace
 */
export function validateCommentContent(content: string): { valid: boolean; error?: string } {
    const trimmed = content.trim();

    if (trimmed.length === 0) {
        return { valid: false, error: "Comment cannot be empty" };
    }

    if (trimmed.length > 2000) {
        return { valid: false, error: "Comment cannot exceed 2000 characters" };
    }

    return { valid: true };
}

/**
 * Sanitizes comment content to prevent XSS.
 * Escapes HTML entities while preserving markdown.
 */
export function sanitizeCommentContent(content: string): string {
    return content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
}

// ─── Core CRUD Operations ──────────────────────────────────────────────────

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
    notifyCtx?: {
        deckTitle?: string | null;
        cardKanji?: string | null;
        shareLink: string;
    },
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

        // Notify deck owner (fire-and-forget, skip if commenter is the owner)
        if (notifyCtx && userId !== ownerId) {
            notifyComment({
                toUserId: ownerId,
                senderId: userId,
                senderName: authorName,
                deckId: lessonId,
                deckTitle: notifyCtx.deckTitle,
                shareLink: notifyCtx.shareLink,
                cardKanji: notifyCtx.cardKanji,
            }).catch(() => {});
        }

        return commentRef.id;
    } catch (error: unknown) {
        if (error instanceof CommentError) throw error;
        const e = error as { code?: string };
        if (e.code === "permission-denied")
            throw new CommentError(
                CommentErrorCode.PERMISSION_DENIED,
                "You don't have permission to add comments",
                error as Error,
            );
        if (e.code === "unavailable")
            throw new CommentError(
                CommentErrorCode.NETWORK_ERROR,
                "Network error. Please check your connection.",
                error as Error,
            );
        throw new CommentError(
            CommentErrorCode.UNKNOWN_ERROR,
            "Failed to add comment. Please try again.",
            error as Error,
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
    notifyCtx?: {
        deckTitle?: string | null;
        shareLink: string;
    },
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

        // Notify the parent comment author (fire-and-forget)
        if (notifyCtx && parentComment.userId && parentComment.userId !== userId) {
            notifyReply({
                toUserId: parentComment.userId,
                senderId: userId,
                senderName: authorName,
                deckId: lessonId,
                deckTitle: notifyCtx.deckTitle,
                shareLink: notifyCtx.shareLink,
            }).catch(() => {});
        }
    } catch (error: unknown) {
        if (error instanceof CommentError) throw error;
        const e = error as { code?: string };
        if (e.code === "permission-denied")
            throw new CommentError(
                CommentErrorCode.PERMISSION_DENIED,
                "You don't have permission to reply to comments",
                error as Error,
            );
        if (e.code === "unavailable")
            throw new CommentError(
                CommentErrorCode.NETWORK_ERROR,
                "Network error. Please check your connection.",
                error as Error,
            );
        throw new CommentError(
            CommentErrorCode.UNKNOWN_ERROR,
            "Failed to add reply. Please try again.",
            error as Error,
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
        await updateDoc(ref, { resolved: !snap.data().resolved });
    } catch (error: unknown) {
        if (error instanceof CommentError) throw error;
        const e = error as { code?: string };
        if (e.code === "permission-denied")
            throw new CommentError(
                CommentErrorCode.PERMISSION_DENIED,
                "You don't have permission to resolve comments",
                error as Error,
            );
        if (e.code === "unavailable")
            throw new CommentError(
                CommentErrorCode.NETWORK_ERROR,
                "Network error. Please check your connection.",
                error as Error,
            );
        throw new CommentError(
            CommentErrorCode.UNKNOWN_ERROR,
            "Failed to resolve comment. Please try again.",
            error as Error,
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
        const e = error as { code?: string };
        if (e.code === "permission-denied")
            throw new CommentError(
                CommentErrorCode.PERMISSION_DENIED,
                "You don't have permission to view comments",
                error as Error,
            );
        if (e.code === "unavailable")
            throw new CommentError(
                CommentErrorCode.NETWORK_ERROR,
                "Network error. Please check your connection.",
                error as Error,
            );
        throw new CommentError(
            CommentErrorCode.UNKNOWN_ERROR,
            "Failed to fetch comments. Please try again.",
            error as Error,
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
        if (error instanceof CommentError) throw error;
        const e = error as { code?: string };
        if (e.code === "permission-denied")
            throw new CommentError(
                CommentErrorCode.PERMISSION_DENIED,
                "You don't have permission to edit this comment",
                error as Error,
            );
        if (e.code === "unavailable")
            throw new CommentError(
                CommentErrorCode.NETWORK_ERROR,
                "Network error. Please check your connection.",
                error as Error,
            );
        throw new CommentError(
            CommentErrorCode.UNKNOWN_ERROR,
            "Failed to update comment. Please try again.",
            error as Error,
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
        if (error instanceof CommentError) throw error;
        const e = error as { code?: string };
        if (e.code === "permission-denied")
            throw new CommentError(
                CommentErrorCode.PERMISSION_DENIED,
                "You don't have permission to delete this comment",
                error as Error,
            );
        if (e.code === "unavailable")
            throw new CommentError(
                CommentErrorCode.NETWORK_ERROR,
                "Network error. Please check your connection.",
                error as Error,
            );
        throw new CommentError(
            CommentErrorCode.UNKNOWN_ERROR,
            "Failed to delete comment. Please try again.",
            error as Error,
        );
    }
}

/**
 * Gets comment count for a specific card (for badge display).
 */
export async function getCommentCount(
    ownerId: string,
    lessonId: string,
    cardId: string,
): Promise<number> {
    try {
        const comments = await getComments(ownerId, lessonId, cardId);
        return comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0);
    } catch {
        return 0;
    }
}
