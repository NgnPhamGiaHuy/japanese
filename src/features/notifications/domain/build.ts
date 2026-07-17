/**
 * @file domain/build.ts
 * Pure builders shared by the server-side Notification Service:
 * notification title/message copy, deck share links, and actor-stack merging.
 *
 * No Firebase, isomorphic (browser + node) — unit-testable and safe to import
 * from both the client facade and the server writer, which must agree on
 * outputs (e.g. the share link must match features/flashcard buildShareId).
 */

import type { NotificationKind } from "./events";
import type { NotificationActor } from "../types";

/** Alias, kept for this module's existing call sites — canonical shape lives in ../types (E11-T6). */
export type ActorRef = NotificationActor;

/** URL-safe base64 (matches flashcard buildShareId), isomorphic. */
export function base64UrlSafe(input: string): string {
    const b64 =
        typeof btoa !== "undefined" ? btoa(input) : Buffer.from(input, "utf8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Deck share link, identical to features/flashcard/services buildShareId output. */
export function shareLinkFor(ownerId: string, lessonId: string): string {
    return `/flashcard/shared/${base64UrlSafe(`${ownerId}:${lessonId}`)}`;
}

/** Title + message copy for a notification kind (server-authoritative). */
export function contentFor(
    kind: NotificationKind,
    senderName: string,
    lessonTitle: string,
    opts?: { role?: string },
): { title: string; message: string } {
    const who = senderName || "Someone";
    const deck = lessonTitle || "a deck";
    switch (kind) {
        case "comment":
            return { title: "New comment", message: `${who} commented in "${deck}"` };
        case "reply":
            return { title: "New reply", message: `${who} replied to your comment in "${deck}"` };
        case "role_change":
            return {
                title: "Access updated",
                message: `${who} changed your role${opts?.role ? ` to ${opts.role}` : ""} in "${deck}"`,
            };
        case "access_revoked":
            return { title: "Access removed", message: `${who} removed your access to "${deck}"` };
        case "invite_accepted":
            return { title: "Invite accepted", message: `${who} joined "${deck}"` };
        case "comment_resolved":
            return {
                title: "Comment resolved",
                message: `${who} resolved your comment in "${deck}"`,
            };
        case "deck_duplicated":
            return { title: "Deck saved", message: `${who} saved a copy of "${deck}"` };
        case "content_removed":
            return { title: "Content removed", message: `An administrator removed "${deck}"` };
        default:
            return { title: "Notification", message: `${who} updated "${deck}"` };
    }
}

/**
 * Merges an actor into a collapsed doc's actor list: newest first, deduped by
 * uid, capped so avatar stacks stay bounded.
 */
export function mergeActors(prev: readonly ActorRef[], actor: ActorRef, max = 5): ActorRef[] {
    const without = prev.filter((a) => a.uid !== actor.uid);
    return [actor, ...without].slice(0, max);
}
