/**
 * @file schema.ts
 * Zod contract for the client → server notification emit call.
 *
 * SECURITY BY CONSTRUCTION: the client sends only IDENTIFIERS (which deck/card/
 * comment). It never sends `senderId` (the server takes it from the verified ID
 * token) or `recipientId` (the server derives it authoritatively from the
 * lesson/comment). So a caller cannot forge a sender or spam an arbitrary
 * recipient — the two failure modes the legacy client-write path allowed.
 */

import { z } from "zod";

const id = z.string().min(1).max(400);

/** A comment notification: recipient is derived as the deck owner. */
const commentInput = z.object({
    kind: z.literal("comment"),
    ownerId: id,
    lessonId: id,
    cardId: id,
    commentId: id,
});

/** A reply notification: recipient is derived as the parent comment's author. */
const replyInput = z.object({
    kind: z.literal("reply"),
    ownerId: id,
    lessonId: id,
    cardId: id,
    commentId: id,
});

/** Comment resolved: recipient is derived as the resolved comment's author. */
const commentResolvedInput = z.object({
    kind: z.literal("comment_resolved"),
    ownerId: id,
    lessonId: id,
    cardId: id,
    commentId: id,
});

/** Invite accepted: recipient is the deck owner; sender is the new collaborator. */
const inviteAcceptedInput = z.object({
    kind: z.literal("invite_accepted"),
    ownerId: id,
    lessonId: id,
});

/** Role changed: sender must be the owner; recipient is the target collaborator. */
const roleChangeInput = z.object({
    kind: z.literal("role_change"),
    ownerId: id,
    lessonId: id,
    targetUserId: id,
    newRole: z.string().min(1).max(40),
});

/** Access revoked: sender must be the owner; recipient is the removed collaborator. */
const accessRevokedInput = z.object({
    kind: z.literal("access_revoked"),
    ownerId: id,
    lessonId: id,
    targetUserId: id,
});

/** Deck duplicated: recipient is the source deck's owner; sender is the duplicator. */
const deckDuplicatedInput = z.object({
    kind: z.literal("deck_duplicated"),
    ownerId: id,
    lessonId: id,
});

export const emitNotificationInputSchema = z.discriminatedUnion("kind", [
    commentInput,
    replyInput,
    commentResolvedInput,
    inviteAcceptedInput,
    roleChangeInput,
    accessRevokedInput,
    deckDuplicatedInput,
]);

export type EmitNotificationInput = z.infer<typeof emitNotificationInputSchema>;
