"use server";

/**
 * @file actions/access.actions.ts
 * Server-side access-control actions that require the Admin SDK (Task 2.9).
 *
 * Declining an invite must REVOKE the pending invite, not just dismiss the
 * notification — otherwise the invitee's `invitedEmails` entry survives and
 * `syncInviteToCollaborator` silently re-grants access the next time they open
 * the share link. The invitee has no write access to the owner's lesson, so the
 * revoke must happen server-side via the Admin SDK.
 *
 * @see NOTIFICATION_SYSTEM_IMPLEMENTATION_PLAN.md — Task 2.9
 */
import { FieldPath, FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

const APP_ID = process.env.NEXT_PUBLIC_APP_ID ?? "kana-nihongo-master";

export interface DeclineResult {
    ok: boolean;
    error?: string;
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
