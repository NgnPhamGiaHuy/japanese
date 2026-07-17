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
 *
 * @remarks
 * Escapes only the characters that are actually dangerous inside
 * dangerouslySetInnerHTML (`&`, `<`, `>`, `"`, `'`). Does NOT escape `/` —
 * it isn't an XSS vector on its own, and escaping it broke URL auto-linking
 * for every comment containing a link.
 */
export function sanitizeCommentContent(content: string): string {
    return content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}
