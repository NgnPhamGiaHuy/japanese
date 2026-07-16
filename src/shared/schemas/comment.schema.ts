/**
 * @file Zod v4 schema for card-comment content — single source of truth,
 * replacing the hand-written `validateCommentContent` in comment.service.ts.
 * Rules unchanged from the original: non-empty (after trim), max 2000 chars.
 */
import { z } from "zod";

export const commentContentSchema = z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters");

export type CommentContent = z.infer<typeof commentContentSchema>;
