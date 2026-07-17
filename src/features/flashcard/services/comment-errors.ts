/**
 * @file comment-errors
 * Error types + the shared Firestore-error-code → CommentError mapping —
 * split out of comment.service.ts (E11-T3). Every CRUD operation in
 * comment.service.ts had its own copy of the same permission-denied /
 * unavailable / unknown three-way classification with only the message text
 * differing; mapFirestoreCommentError collapses that to one place.
 */

/** Specific error codes for comment operations, mapped to user-friendly UI messages. */
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

/**
 * Classifies a caught Firestore error into a CommentError and throws it —
 * the shared catch-block body every comment.service.ts CRUD function used
 * to duplicate. A CommentError thrown deliberately upstream (e.g. content
 * validation, not-found) passes through unchanged.
 */
export function mapFirestoreCommentError(
    error: unknown,
    permissionMessage: string,
    failureMessage: string,
): never {
    if (error instanceof CommentError) throw error;
    const e = error as { code?: string };
    if (e.code === "permission-denied") {
        throw new CommentError(
            CommentErrorCode.PERMISSION_DENIED,
            permissionMessage,
            error as Error,
        );
    }
    if (e.code === "unavailable") {
        throw new CommentError(
            CommentErrorCode.NETWORK_ERROR,
            "Network error. Please check your connection.",
            error as Error,
        );
    }
    throw new CommentError(CommentErrorCode.UNKNOWN_ERROR, failureMessage, error as Error);
}
