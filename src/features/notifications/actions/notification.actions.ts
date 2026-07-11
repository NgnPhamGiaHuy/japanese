"use server";

/**
 * @file actions/notification.actions.ts
 * Server-side Notification Service (Epic 5). The single authorized writer for
 * cross-user notifications, using the Admin SDK (which bypasses Firestore rules,
 * so Epic 3 Stage 2 can flip client `create` to owner-self-only).
 *
 * Guarantees per emit:
 *  1. Sender identity comes from the verified ID token — never the client.
 *  2. Sender is AUTHORIZED: must own or hold a role on the referenced lesson.
 *  3. Recipient is DERIVED server-side (deck owner for comment; parent-comment
 *     author for reply) — the client cannot target an arbitrary inbox.
 *  4. The write is IDEMPOTENT/COLLAPSING: a deterministic doc ID (collapseId)
 *     means retries overwrite and burst events fold into one doc with a running
 *     `count` + `actors` stack, inside a transaction that preserves createdAt.
 *
 * @see NOTIFICATION_SYSTEM_IMPLEMENTATION_PLAN.md — Epic 5, Epic 8
 */
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { contentFor, mergeActors, shareLinkFor } from "../domain/build";
import { collapseId } from "../domain/id";
import { collapseKeyOf, policyOf } from "../domain/registry";
import { emitNotificationInputSchema } from "../schema";

import type { ActorRef } from "../domain/build";
import type { NotificationInput } from "../domain/events";

const APP_ID = process.env.NEXT_PUBLIC_APP_ID ?? "kana-nihongo-master";
const ROLES_WITH_ACCESS = ["owner", "editor", "commenter", "viewer"];

export interface EmitResult {
    ok: boolean;
    error?: string;
}

function lessonPath(ownerId: string, lessonId: string): string {
    return `artifacts/${APP_ID}/users/${ownerId}/lessons/${lessonId}`;
}

function commentPath(ownerId: string, lessonId: string, cardId: string, commentId: string): string {
    return `${lessonPath(ownerId, lessonId)}/cards/${cardId}/comments/${commentId}`;
}

function notificationPath(recipientId: string, notiId: string): string {
    return `artifacts/${APP_ID}/users/${recipientId}/notifications/${notiId}`;
}

/**
 * Emit a notification. `idToken` authenticates the caller; `rawInput` carries
 * only identifiers (see schema.ts). Never throws across the boundary — returns
 * `{ ok, error }`.
 */
type EmitInput = ReturnType<typeof emitNotificationInputSchema.parse>;

export async function emitNotificationAction(
    idToken: string,
    rawInput: unknown,
): Promise<EmitResult> {
    try {
        const input = emitNotificationInputSchema.parse(rawInput);

        // 1. Authenticate the sender from the token (not the client).
        const decoded = await adminAuth.verifyIdToken(idToken);
        const senderId = decoded.uid;
        const senderName = decoded.name ?? decoded.email ?? "Someone";

        // 2. Load the referenced lesson (all kinds reference one).
        const lessonSnap = await adminDb.doc(lessonPath(input.ownerId, input.lessonId)).get();
        if (!lessonSnap.exists) return { ok: false, error: "lesson-not-found" };
        const lesson = lessonSnap.data() ?? {};

        // 3. Authorize the sender + derive the recipient, per kind.
        const resolved = await authorizeAndResolve(input, senderId, lesson);
        if (!resolved.ok) return { ok: false, error: resolved.error };
        const recipientId = resolved.recipientId;
        if (!recipientId || recipientId === senderId) return { ok: true }; // self / none → no-op

        // 4. Write (idempotent + collapsing).
        const niInput: NotificationInput = {
            kind: input.kind,
            recipientId,
            senderId,
            senderName,
            lessonId: input.lessonId,
            shareLink: shareLinkFor(input.ownerId, input.lessonId),
            cardId: "cardId" in input ? input.cardId : undefined,
            commentId: "commentId" in input ? input.commentId : undefined,
            role: input.kind === "role_change" ? input.newRole : undefined,
        };
        await writeNotification(niInput, (lesson.title as string | undefined) ?? "a deck");
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "unknown" };
    }
}

type Resolved = { ok: true; recipientId: string | null } | { ok: false; error: string };

/**
 * Per-kind authorization + recipient derivation. The client never supplies a
 * recipient — it is computed here from the lesson/comment, gated by what the
 * sender is allowed to do.
 */
async function authorizeAndResolve(
    input: EmitInput,
    senderId: string,
    lesson: Record<string, unknown>,
): Promise<Resolved> {
    const roles = (lesson.roles as Record<string, string> | undefined) ?? {};
    const senderIsOwner = input.ownerId === senderId;
    const senderHasAccess = senderIsOwner || ROLES_WITH_ACCESS.includes(roles[senderId] ?? "");
    const lessonIsPublic = lesson.isPublic === true || lesson.allowLinkAccess === true;

    switch (input.kind) {
        case "comment":
            if (!senderHasAccess) return { ok: false, error: "forbidden" };
            return { ok: true, recipientId: input.ownerId };
        case "reply":
        case "comment_resolved": {
            if (!senderHasAccess) return { ok: false, error: "forbidden" };
            const snap = await adminDb
                .doc(commentPath(input.ownerId, input.lessonId, input.cardId, input.commentId))
                .get();
            if (!snap.exists) return { ok: false, error: "comment-not-found" };
            return { ok: true, recipientId: (snap.data()?.userId as string | undefined) ?? null };
        }
        case "invite_accepted":
            // The accepting user now holds a role; notify the owner.
            if (!senderHasAccess) return { ok: false, error: "forbidden" };
            return { ok: true, recipientId: input.ownerId };
        case "role_change":
        case "access_revoked":
            // Only the owner may change/revoke; recipient is the target user.
            if (!senderIsOwner) return { ok: false, error: "forbidden" };
            return { ok: true, recipientId: input.targetUserId };
        case "deck_duplicated":
            // The duplicator must have had access to the source deck.
            if (!senderHasAccess && !lessonIsPublic) return { ok: false, error: "forbidden" };
            return { ok: true, recipientId: input.ownerId };
        default:
            return { ok: false, error: "unsupported-kind" };
    }
}

/**
 * Server-to-server notification (no client token) for system events like an
 * admin removing content. The caller MUST already be authorized (e.g. inside an
 * admin Server Action). Never throws — system notifications must not break the
 * primary action.
 */
export async function notifySystemEvent(params: {
    kind: "content_removed";
    recipientId: string;
    lessonId: string;
    lessonTitle?: string | null;
}): Promise<void> {
    try {
        if (!params.recipientId) return;
        const niInput: NotificationInput = {
            kind: params.kind,
            recipientId: params.recipientId,
            senderId: "system",
            senderName: "An administrator",
            lessonId: params.lessonId,
        };
        await writeNotification(niInput, params.lessonTitle ?? "a deck");
    } catch {
        // Swallow — see above.
    }
}

/**
 * Transactional write to the deterministic collapse doc: create with a
 * server `createdAt` the first time, otherwise fold the new actor in and (for
 * collapsing kinds) bump `count` — re-surfacing the doc as unread.
 */
async function writeNotification(input: NotificationInput, lessonTitle: string): Promise<void> {
    const notiId = collapseId(input);
    const policy = policyOf(input.kind);
    const { title, message } = contentFor(input.kind, input.senderName ?? "Someone", lessonTitle, {
        role: input.role,
    });
    const ref = adminDb.doc(notificationPath(input.recipientId, notiId));
    const actor: ActorRef = { uid: input.senderId, name: input.senderName ?? null };

    await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const shared = {
            userId: input.recipientId,
            type: input.kind,
            title,
            message,
            senderId: input.senderId,
            senderName: input.senderName ?? null,
            data: {
                lessonId: input.lessonId,
                shareLink: input.shareLink,
                commentId: input.commentId ?? null,
            },
            link: input.shareLink,
            priority: policy.priority,
            category: policy.category,
            collapseKey: collapseKeyOf(input),
            status: "unread",
            read: false,
            isDeleted: false,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (!snap.exists) {
            tx.set(ref, {
                ...shared,
                createdAt: FieldValue.serverTimestamp(),
                count: 1,
                actors: [actor],
            });
            return;
        }

        const prev = snap.data() ?? {};
        const prevActors = (prev.actors as ActorRef[] | undefined) ?? [];
        tx.set(
            ref,
            {
                ...shared,
                // Preserve original createdAt; collapse re-surfaces as unread.
                count: policy.collapses ? ((prev.count as number | undefined) ?? 1) + 1 : 1,
                actors: policy.collapses ? mergeActors(prevActors, actor) : [actor],
            },
            { merge: true },
        );
    });
}
