/**
 * @file Zod v4 schemas for lesson (deck) metadata — single source of truth
 * for the LessonBuilder title/description/category form and the share
 * privacy-mode form (both are wired to these via @hookform/resolvers).
 *
 * Covers only the user-editable surface of `Lesson` — not the
 * system-managed fields (id, createdAt, cardCount, roles, collaborators,
 * ownerId snapshots), which the app computes and never takes as form input.
 */
import { z } from "zod";

export const lessonMetadataSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(1000).default(""),
    categories: z.array(z.string().min(1)).optional(),
    type: z.string().max(40).optional(),
    themeColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "themeColor must be a 6-digit hex color")
        .optional(),
});

export type LessonMetadata = z.infer<typeof lessonMetadataSchema>;
/** Pre-default shape (e.g. `description` optional) — what react-hook-form holds before submit-time parsing fills defaults. */
export type LessonMetadataInput = z.input<typeof lessonMetadataSchema>;

// ─── Sharing / privacy ───────────────────────────────────────────────────────
//
// Mirrors ShareModal's PrivacyMode ("restricted" | "link" | "public") and the
// public-role cap (never "editor" via public link — enforced by the enum
// itself, not just convention).

export const privacyModeSchema = z.enum(["restricted", "link", "public"]);

export const publicRoleSchema = z.enum(["viewer", "commenter"]);

export const shareInviteSchema = z.object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    role: z.enum(["viewer", "commenter", "editor"]),
});

export type ShareInvite = z.infer<typeof shareInviteSchema>;
