/**
 * RBAC Engine — deterministic permission resolution for flashcard decks.
 *
 * @remarks
 * This is the single source of truth for all permission decisions.
 * Every component, hook, service, and server action that needs to know
 * "what can this user do?" must go through this module.
 *
 * ## Permission Matrix
 *
 * | Action                  | owner | editor | commenter | viewer | none |
 * |-------------------------|-------|--------|-----------|--------|------|
 * | View cards              |  ✅   |   ✅   |    ✅     |   ✅   |  ❌  |
 * | Play games / study      |  ✅   |   ✅   |    ✅     |   ✅   |  ❌  |
 * | Post comments           |  ✅   |   ✅   |    ✅     |   ❌   |  ❌  |
 * | Edit cards              |  ✅   |   ✅   |    ❌     |   ❌   |  ❌  |
 * | Reorder cards           |  ✅   |   ✅   |    ❌     |   ❌   |  ❌  |
 * | Delete cards            |  ✅   |   ❌   |    ❌     |   ❌   |  ❌  |
 * | Manage sharing          |  ✅   |   ❌   |    ❌     |   ❌   |  ❌  |
 * | Invite collaborators    |  ✅   |   ❌   |    ❌     |   ❌   |  ❌  |
 * | Delete deck             |  ✅   |   ❌   |    ❌     |   ❌   |  ❌  |
 *
 * ## Role Resolution Priority
 *
 * 1. Owner — UID matches ownerId (or legacy userId)
 * 2. Explicit role — UID present in lesson.roles map (invited collaborator)
 * 3. Pending email invite — email in lesson.invitedEmails (pre-login)
 * 4. Public link access — allowLinkAccess or isPublic, capped at "commenter"
 * 5. None — no access path matched
 *
 * ## Public Access Cap
 *
 * "editor" can NEVER be granted via public link or publicRole.
 * Editing requires an explicit invitation. This is enforced at:
 * - Type level: Lesson.publicRole is "viewer" | "commenter" only
 * - Runtime: resolveRole caps public access at "commenter"
 * - Write time: sanitizePublicRole strips "editor" before Firestore writes
 */

import { Edit2, Eye, MessageSquare, ShieldCheck } from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { DeckAccessRole, Lesson } from "../types";

// ─── Role configuration (SSoT for UI) ──────────────────────────────────────────

export interface RoleConfig {
    label: string;
    icon: LucideIcon;
    color: string;
}

export const ROLE_CONFIG: Record<DeckAccessRole, RoleConfig> = {
    owner: { label: "Owner", icon: ShieldCheck, color: "#1cb0f6" },
    editor: { label: "Editor", icon: Edit2, color: "#ce82ff" },
    commenter: { label: "Commenter", icon: MessageSquare, color: "#ff9600" },
    viewer: { label: "Viewer", icon: Eye, color: "#afafaf" },
    none: { label: "Viewer", icon: Eye, color: "#afafaf" },
};

// ─── Role ordering ────────────────────────────────────────────────────────────

/** Roles ordered highest → lowest privilege. */
const ROLE_ORDER: readonly DeckAccessRole[] = [
    "owner",
    "editor",
    "commenter",
    "viewer",
    "none",
] as const;

// ─── Role resolution ──────────────────────────────────────────────────────────

type LessonRoleFields = Pick<
    Lesson,
    "ownerId" | "userId" | "roles" | "allowLinkAccess" | "isPublic" | "publicRole" | "invitedEmails"
>;

interface ResolveRoleParams {
    lesson: LessonRoleFields;
    /** Firebase Auth UID of the current user. Null/undefined = anonymous. */
    userId?: string | null;
    /** Firebase Auth email of the current user (for pending invite check). */
    userEmail?: string | null;
}

/**
 * Resolves the effective role for a user on a given lesson.
 *
 * This is the canonical entry point. All other role-resolution helpers
 * delegate here. Never inline role logic in components or pages.
 */
export function resolveRole(params: ResolveRoleParams): DeckAccessRole {
    const { lesson, userId, userEmail } = params;

    // 1. Owner — ownerId is the source of truth; userId is the legacy fallback.
    const ownerId = lesson.ownerId ?? lesson.userId;
    if (userId && ownerId && userId === ownerId) {
        return "owner";
    }

    // 2. Explicit UID-based role (direct assignment or converted invite).
    if (userId && lesson.roles?.[userId]) {
        const explicit = lesson.roles[userId] as DeckAccessRole;
        if (ROLE_ORDER.includes(explicit)) return explicit;
    }

    // 3. Pending email invite (not yet converted to a UID-based role).
    if (userEmail) {
        const normalizedEmail = userEmail.trim().toLowerCase();
        const pending = lesson.invitedEmails?.[normalizedEmail];
        if (pending?.role) {
            const pendingRole = pending.role as DeckAccessRole;
            if (ROLE_ORDER.includes(pendingRole)) return pendingRole;
        }
    }

    // 4. Public link access — hard cap at "commenter".
    if (lesson.allowLinkAccess || lesson.isPublic) {
        const pr = lesson.publicRole;
        // publicRole is typed as "viewer" | "commenter" — but guard against
        // legacy Firestore documents that may still have "editor" stored.
        if (pr === "commenter") return "commenter";
        return "viewer";
    }

    // 5. No access path matched.
    return "none";
}

// ─── Permission predicates ────────────────────────────────────────────────────

/** Can view cards and play games. */
export function canView(role: DeckAccessRole): boolean {
    return role !== "none";
}

/** Can post and reply to comments. */
export function canComment(role: DeckAccessRole): boolean {
    return role === "owner" || role === "editor" || role === "commenter";
}

/** Can edit card content and reorder cards. */
export function canEdit(role: DeckAccessRole): boolean {
    return role === "owner" || role === "editor";
}

// ─── Write-time sanitization ──────────────────────────────────────────────────

/**
 * Sanitises a publicRole value before persisting to Firestore.
 * Ensures "editor" can never be stored as a publicRole — enforces the cap
 * at the write boundary so legacy data cannot re-introduce the vulnerability.
 */
export function sanitizePublicRole(role: string | undefined | null): "viewer" | "commenter" {
    if (role === "commenter") return "commenter";
    return "viewer";
}
