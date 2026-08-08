/**
 * @file access.service.emu.test.ts
 * Emulator-backed tests for access.service.ts (T-117c): email-invite
 * lifecycle (invite → revoke) and the invite → collaborator conversion.
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 *
 * Mocks `@/features/notifications` by its real specifier — not a runtime
 * coupling, per the cross-feature-import exemption for test files (see
 * eslint.config.mjs's ADR-101 boundary comment). Its real barrel re-exports
 * React components that transitively require Next's app-router runtime
 * (`next/navigation`), which doesn't resolve under plain Vitest.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { adminDb } from "@/lib/firebase-admin";
import { RUN, signInAs, wipeCollections } from "./__tests__/emu-auth";
import { inviteByEmail, revokeEmailInvite, syncInviteToCollaborator } from "./access.service";

import type { Lesson } from "../types";

vi.mock("@/features/notifications", () => ({
    emitNotification: vi.fn().mockResolvedValue(undefined),
    notifyInvite: vi.fn().mockResolvedValue(undefined),
}));

const d = RUN ? describe : describe.skip;

const APP_ID = "kana-nihongo-master";
const OWNER = "emu_access_service_owner";
const INVITEE = "emu_access_service_invitee";
const LESSON_ID = "emu_lesson_for_access";
const INVITEE_EMAIL = "invitee@example.com";

function lessonPath() {
    return `artifacts/${APP_ID}/users/${OWNER}/lessons/${LESSON_ID}`;
}

async function seedLesson(overrides: Record<string, unknown> = {}) {
    await adminDb.doc(lessonPath()).set({
        id: LESSON_ID,
        title: "Access Service Test Deck",
        description: "d",
        createdAt: 0,
        cardCount: 0,
        ownerId: OWNER,
        roles: { [OWNER]: "owner" },
        ...overrides,
    });
}

d("access.service", () => {
    beforeAll(async () => {
        await signInAs(OWNER, "access-service-owner@example.com");
    });

    afterEach(async () => {
        await wipeCollections(`artifacts/${APP_ID}/users/${OWNER}/lessons`);
    });

    afterAll(async () => {
        await wipeCollections(`artifacts/${APP_ID}/users/${OWNER}/lessons`);
    });

    it("inviteByEmail writes a normalized, role-tagged pending invite", async () => {
        await seedLesson();

        await inviteByEmail(OWNER, LESSON_ID, "  Invitee@Example.COM  ", "editor", "Owner");

        const snap = await adminDb.doc(lessonPath()).get();
        const invitedEmails = snap.data()?.invitedEmails as Record<string, { role: string }>;
        expect(invitedEmails[INVITEE_EMAIL].role).toBe("editor");
        expect(invitedEmails["  Invitee@Example.COM  "]).toBeUndefined();
    });

    it("revokeEmailInvite removes only the targeted email, leaving other pending invites intact", async () => {
        await seedLesson();
        await inviteByEmail(OWNER, LESSON_ID, INVITEE_EMAIL, "viewer", "Owner");
        await inviteByEmail(OWNER, LESSON_ID, "other@example.com", "viewer", "Owner");

        await revokeEmailInvite(OWNER, LESSON_ID, INVITEE_EMAIL);

        const snap = await adminDb.doc(lessonPath()).get();
        const invitedEmails = snap.data()?.invitedEmails as Record<string, unknown>;
        expect(invitedEmails[INVITEE_EMAIL]).toBeUndefined();
        expect(invitedEmails["other@example.com"]).toBeDefined();
    });

    it("syncInviteToCollaborator grants the invited role and clears the pending invite when the invitee's own client SDK call is authorized (owner performing it on their behalf)", async () => {
        // syncInviteToCollaborator is meant to run as the INVITEE accepting
        // their own invite, but firestore.rules' lesson `update` rule only
        // allows the owner or an EXISTING editor to write lesson docs
        // (`isOwner(userId) || roles[request.auth.uid] == 'editor'`) — a
        // first-time invitee has neither. Signing in as the deck OWNER here
        // isolates and pins the function's data-transformation logic
        // (role precedence, invite removal, collaborator/meta bookkeeping)
        // independent of that separate, already-flagged permission question
        // (see the dedicated "as the invitee" test below for the empirical
        // proof of the gap itself).
        await seedLesson({
            invitedEmails: { [INVITEE_EMAIL]: { role: "commenter", invitedAt: 0 } },
        });
        const lessonSnap = await adminDb.doc(lessonPath()).get();
        const lesson = lessonSnap.data() as Lesson;
        const fakeInviteeAsOwnerSession = {
            uid: INVITEE,
            email: INVITEE_EMAIL,
            displayName: "Invitee Name",
            photoURL: null,
        } as Parameters<typeof syncInviteToCollaborator>[0];

        const granted = await syncInviteToCollaborator(
            fakeInviteeAsOwnerSession,
            lesson,
            OWNER,
            LESSON_ID,
        );

        expect(granted).toBe("commenter");
        const snap = await adminDb.doc(lessonPath()).get();
        expect(snap.data()?.roles[INVITEE]).toBe("commenter");
        expect(snap.data()?.invitedEmails[INVITEE_EMAIL]).toBeUndefined();
        expect(snap.data()?.collaboratorMeta[INVITEE].displayName).toBe("Invitee Name");
    });

    it("syncInviteToCollaborator prefers an existing UID-based role over the pending invite's role", async () => {
        await seedLesson({
            roles: { [OWNER]: "owner", [INVITEE]: "editor" },
            invitedEmails: { [INVITEE_EMAIL]: { role: "viewer", invitedAt: 0 } },
        });
        const lesson = (await adminDb.doc(lessonPath()).get()).data() as Lesson;
        const fakeInviteeAsOwnerSession = {
            uid: INVITEE,
            email: INVITEE_EMAIL,
            displayName: null,
            photoURL: null,
        } as Parameters<typeof syncInviteToCollaborator>[0];

        const granted = await syncInviteToCollaborator(
            fakeInviteeAsOwnerSession,
            lesson,
            OWNER,
            LESSON_ID,
        );

        expect(granted).toBe("editor"); // existingRole ?? pendingInvite.role — existing wins
    });

    it("syncInviteToCollaborator returns null and writes nothing when there is no pending invite for the user's email", async () => {
        await seedLesson();
        const lesson = (await adminDb.doc(lessonPath()).get()).data() as Lesson;
        const fakeSession = {
            uid: INVITEE,
            email: "nobody-invited-this-address@example.com",
            displayName: null,
            photoURL: null,
        } as Parameters<typeof syncInviteToCollaborator>[0];

        const granted = await syncInviteToCollaborator(fakeSession, lesson, OWNER, LESSON_ID);

        expect(granted).toBeNull();
        const snap = await adminDb.doc(lessonPath()).get();
        expect(snap.data()?.roles[INVITEE]).toBeUndefined();
    });

    it("[discovered gap] the invitee's OWN client-SDK call is rejected by firestore.rules — first-time invite acceptance cannot succeed as currently written", async () => {
        // Empirical proof, not speculation: sign in as the actual invitee (no
        // pre-existing role) and call syncInviteToCollaborator exactly as the
        // real shared-lesson flow does. lessons/{lessonId}'s `update` rule only
        // allows isOwner(userId) or an existing 'editor' role — a first-time
        // invitee (any granted role: viewer/commenter/editor) satisfies neither,
        // so the write is denied regardless of which role was invited.
        await seedLesson({
            invitedEmails: { [INVITEE_EMAIL]: { role: "viewer", invitedAt: 0 } },
        });
        const lesson = (await adminDb.doc(lessonPath()).get()).data() as Lesson;
        // Establishes the ambient session (request.auth.uid === INVITEE) —
        // the custom-token sign-in itself doesn't populate `.email` on the
        // returned User in this SDK/emulator combination (see emu-auth.ts),
        // so the `user` argument below is built explicitly instead.
        await signInAs(INVITEE, INVITEE_EMAIL, "Invitee Name");
        const invitee = {
            uid: INVITEE,
            email: INVITEE_EMAIL,
            displayName: "Invitee Name",
            photoURL: null,
        } as Parameters<typeof syncInviteToCollaborator>[0];

        await expect(
            syncInviteToCollaborator(invitee, lesson, OWNER, LESSON_ID),
        ).rejects.toMatchObject({
            code: "permission-denied",
        });

        // Restore the ambient session to the owner for afterEach/afterAll cleanup semantics.
        await signInAs(OWNER, "access-service-owner@example.com");
    });
});
