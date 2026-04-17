/**
 * @file access.service
 * Central access control layer for the flashcard sharing system.
 *
 * Responsibilities:
 * - Resolve a user's effective role for a given lesson
 * - Convert pending email invites to permanent collaborator entries on login
 * - Invite users by email (stored as pending until they log in)
 */

import { deleteField, setDoc } from "firebase/firestore";

import { notifyInvite } from "@/features/notifications";
import { buildShareId, lessonDoc } from "./lesson.service";
import { resolveRole } from "../utils/rbac";

import type { User } from "firebase/auth";
import type { DeckAccessRole, Lesson } from "../types";

// Re-export for callers that import DeckAccessRole from access.service
export type { DeckAccessRole };

// ─── Core access resolver ─────────────────────────────────────────────────────

/**
 * Resolves the effective role for a user on a given lesson.
 * Delegates to the canonical RBAC engine in `rbac.ts`.
 *
 * @deprecated Prefer `resolveRole` from `rbac.ts` for new code.
 */
export function resolveUserAccess(user: User | null, lesson: Lesson): DeckAccessRole {
    return resolveRole({
        lesson,
        userId: user?.uid ?? null,
        userEmail: user?.email ?? null,
    });
}

// ─── Permission helpers — delegate to rbac.ts ─────────────────────────────────

export { canEdit, canComment, canView as canStudy } from "../utils/rbac";

// ─── Invite → Collaborator conversion ────────────────────────────────────────

/**
 * Checks if the logged-in user has a pending email invite for this lesson.
 * If so, promotes them to a permanent collaborator and removes the pending invite.
 *
 * Call this on every shared page load after the user is authenticated.
 *
 * @returns The role that was granted, or null if no invite was found.
 */
export async function syncInviteToCollaborator(
    user: User,
    lesson: Lesson,
    ownerId: string,
    lessonId: string,
): Promise<DeckAccessRole | null> {
    if (!user.email) return null;

    const normalizedEmail = user.email.trim().toLowerCase();
    const pendingInvite = lesson.invitedEmails?.[normalizedEmail];

    if (!pendingInvite) return null;

    const existingRole = lesson.roles?.[user.uid];
    const roleToGrant = existingRole ?? pendingInvite.role;

    const updatedRoles: Record<string, string> = {
        ...(lesson.roles ?? {}),
        [user.uid]: roleToGrant,
    };

    const updatedCollaborators = Array.from(new Set([...(lesson.collaborators ?? []), user.uid]));

    const updatedInvitedEmails = { ...(lesson.invitedEmails ?? {}) };
    delete updatedInvitedEmails[normalizedEmail];

    await setDoc(
        lessonDoc(ownerId, lessonId),
        {
            roles: updatedRoles,
            collaborators: updatedCollaborators,
            invitedEmails: updatedInvitedEmails,
            lastSharedBy: user.uid,
            lastSharedByName: user.displayName ?? null,
            lastSharedByAvatar: user.photoURL ?? null,
            lastSharedAt: Date.now(),
            collaboratorMeta: {
                [user.uid]: {
                    displayName: user.displayName ?? null,
                    email: user.email ?? null,
                },
            },
        },
        { merge: true },
    );

    // Notify the user that they now have access
    const shareId = buildShareId(ownerId, lessonId);
    notifyInvite({
        toUserId: user.uid,
        senderId: ownerId,
        deckId: lessonId,
        deckTitle: lesson.title,
        shareLink: `/flashcard/shared/${shareId}`,
        role: roleToGrant,
    }).catch(() => {}); // Fire-and-forget — don't block access on notification failure

    return roleToGrant as DeckAccessRole;
}

// ─── Email invite ─────────────────────────────────────────────────────────────

/**
 * Adds a pending email invite to the lesson document.
 * The invite is converted to a permanent collaborator when the user logs in.
 *
 * @param ownerId - The lesson owner's UID (for the Firestore path)
 * @param lessonId - The lesson document ID
 * @param email - The invitee's email address (will be normalized)
 * @param role - The role to grant on acceptance
 */
export async function inviteByEmail(
    ownerId: string,
    lessonId: string,
    email: string,
    role: "viewer" | "commenter" | "editor",
    senderName?: string | null,
    senderAvatar?: string | null,
    deckTitle?: string | null,
): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    await setDoc(
        lessonDoc(ownerId, lessonId),
        {
            invitedEmails: {
                [normalizedEmail]: {
                    role,
                    invitedAt: Date.now(),
                },
            },
            // Stamp last sharer metadata for fast "Shared by" UI.
            lastSharedBy: ownerId,
            lastSharedByName: senderName ?? null,
            lastSharedByAvatar: senderAvatar ?? null,
            lastSharedAt: Date.now(),
        },
        { merge: true },
    );

    // Send notification immediately — stored as pending until the user logs in
    const shareId = buildShareId(ownerId, lessonId);
    notifyInvite({
        toEmail: normalizedEmail,
        senderId: ownerId,
        senderName,
        deckId: lessonId,
        deckTitle,
        shareLink: `/flashcard/shared/${shareId}`,
        role,
    }).catch(() => {});
}

/**
 * Removes a pending email invite.
 * Uses deleteField() to atomically remove the key from the invitedEmails map.
 */
export async function revokeEmailInvite(
    ownerId: string,
    lessonId: string,
    email: string,
): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    // deleteField() atomically removes the key — setDoc merge cannot delete nested keys
    await setDoc(
        lessonDoc(ownerId, lessonId),
        {
            invitedEmails: {
                [normalizedEmail]: deleteField(),
            },
        },
        { merge: true },
    );
}
