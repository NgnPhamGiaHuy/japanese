"use server";

/**
 * @file actions/access.actions.ts
 * Server-side access-control actions that require the Admin SDK.
 *
 * BOTH sides of an invite response run here, for the same reason: **the invitee
 * has no write access to the owner's lesson.** `firestore.rules` admits an
 * update only from the owner or an existing `editor`, and admits a read only
 * for a public/link-shared deck, the owner, or a uid already present in
 * `roles` — an invitee named solely in `invitedEmails` matches none of those.
 *
 * - Declining must REVOKE the pending invite, not just dismiss the
 *   notification — otherwise the `invitedEmails` entry survives and
 *   `syncInviteToCollaborator` silently re-grants access on the next share-link
 *   visit.
 * - Accepting must GRANT the role server-side. The client-side conversion in
 *   `services/shared.service.ts` cannot do it: the invitee can neither read the
 *   lesson that records their invite nor write their own `roles` entry, so the
 *   accept deadlocked and the deck rendered "Deck Not Found".
 */
import { FieldPath, FieldValue } from "firebase-admin/firestore";

import { APP_ID } from "@/lib/app-id";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

import type { DeckAccessRole } from "../types";

export interface DeclineResult {
    ok: boolean;
    error?: string;
}

export interface AcceptResult {
    ok: boolean;
    /** The role actually granted, for the caller to route on. */
    role?: DeckAccessRole;
    error?: string;
}

/** Roles an email invite may confer. A link never grants `owner`. */
const INVITABLE_ROLES: readonly string[] = ["viewer", "commenter", "editor"];

/**
 * Converts the caller's own pending email invite into a permanent role.
 *
 * Authenticated by the caller's ID token, and the email matched against
 * `invitedEmails` is the token's own — so a caller can only accept an invite
 * addressed to them, and can never choose their own role.
 *
 * Idempotent in both directions: if the caller already holds a role, that role
 * is kept (an existing grant is never downgraded to the invited one) and the
 * pending entry is cleared; a missing deck or a missing invite is a no-op.
 */
export async function acceptInviteAction(
    idToken: string,
    ownerId: string,
    lessonId: string,
): Promise<AcceptResult> {
    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const email = decoded.email?.trim().toLowerCase();
        if (!email) return { ok: false, error: "no-email" };
        if (!ownerId || !lessonId) return { ok: false, error: "bad-args" };

        const ref = adminDb.doc(`artifacts/${APP_ID}/users/${ownerId}/lessons/${lessonId}`);
        const snap = await ref.get();
        if (!snap.exists) return { ok: false, error: "not-found" };

        const data = snap.data() ?? {};
        const roles = (data.roles as Record<string, string> | undefined) ?? {};
        const existingRole = roles[decoded.uid];
        const invited = (data.invitedEmails as Record<string, { role?: string }> | undefined) ?? {};
        const invitedRole = invited[email]?.role;

        if (!existingRole && !invitedRole) return { ok: false, error: "not-invited" };

        // An already-granted role wins: re-accepting a stale notification must
        // not silently demote an editor back to the viewer they were invited as.
        const role = (existingRole ??
            (INVITABLE_ROLES.includes(invitedRole!) ? invitedRole : "viewer")) as DeckAccessRole;

        // `update({})` is an error in the Admin SDK, so only write when the
        // grant actually changes — re-accepting an already-granted invite just
        // clears the pending entry below.
        if (existingRole !== role) {
            await ref.update(new FieldPath("roles", decoded.uid), role);
        }

        // Clear the pending entry only after the grant lands, so a failure
        // here leaves the invite re-acceptable rather than lost. FieldPath
        // keeps the email (which contains "." and "@") a literal key.
        if (invitedRole !== undefined) {
            await ref.update(new FieldPath("invitedEmails", email), FieldValue.delete());
        }

        return { ok: true, role };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "unknown" };
    }
}

/**
 * Removes the caller's pending email invite from a lesson. Authenticated by the
 * caller's ID token (the email to revoke is the token's email — a caller can
 * only decline their OWN invite). Idempotent: a missing deck or a
 * non-existent invite is a successful no-op.
 */
export async function declineInviteAction(
    idToken: string,
    ownerId: string,
    lessonId: string,
): Promise<DeclineResult> {
    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const email = decoded.email?.trim().toLowerCase();
        if (!email) return { ok: false, error: "no-email" };
        if (!ownerId || !lessonId) return { ok: false, error: "bad-args" };

        const ref = adminDb.doc(`artifacts/${APP_ID}/users/${ownerId}/lessons/${lessonId}`);
        const snap = await ref.get();
        if (!snap.exists) return { ok: true }; // deck gone — nothing to revoke

        const invited = (snap.data()?.invitedEmails as Record<string, unknown> | undefined) ?? {};
        if (!(email in invited)) return { ok: true }; // not (or no longer) invited

        // FieldPath keeps the email (which contains "." and "@") a literal key.
        await ref.update(new FieldPath("invitedEmails", email), FieldValue.delete());
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "unknown" };
    }
}
