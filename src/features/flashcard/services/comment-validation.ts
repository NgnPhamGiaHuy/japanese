/**
 * @file comment-validation
 * Content validation + XSS sanitization for comment text — split out of
 * comment.service.ts (E11-T3).
 */
import { commentContentSchema } from "@/shared/schemas";

/**
 * Validates comment content before submission — delegates to the shared
 * zod schema (single source of truth); see shared/schemas/comment.schema.ts.
 */
export function validateCommentContent(content: string): { valid: boolean; error?: string } {
    const result = commentContentSchema.safeParse(content);
    return result.success
        ? { valid: true }
        : { valid: false, error: result.error.issues[0]?.message };
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
