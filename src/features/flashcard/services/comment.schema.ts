/**
 * @file Zod v4 schema for card-comment content — single source of truth,
 * replacing the hand-written `validateCommentContent` in comment.service.ts.
 * Rules unchanged from the original: non-empty (after trim), max 2000 chars.
 */
import { z } from "zod";

/** The one authoritative comment-length limit (T-109a) — CommentPanel/
 * CommentInput's UI counter and maxLength import this instead of
 * hand-syncing their own copy of "2000". firestore.rules cannot import a TS
 * constant, so its own copy is a structurally-unavoidable duplicate, not a
 * hand-sync lapse — keep the two in step by hand if this ever changes. */
export const COMMENT_MAX_LENGTH = 2000;

export const commentContentSchema = z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(COMMENT_MAX_LENGTH, `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters`);

export type CommentContent = z.infer<typeof commentContentSchema>;
