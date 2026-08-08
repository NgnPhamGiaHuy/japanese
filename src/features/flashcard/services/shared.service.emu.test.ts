/**
 * @file shared.service.emu.test.ts
 * Emulator-backed tests for `getSharedLesson` (T-117c) — the guest/shared
 * deck access gate: share-token decode, the owner/public-link access paths,
 * sensitive-field stripping, and deny-by-default for a stranger on a
 * private lesson.
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 *
 * Mocks `@/features/notifications` by its real specifier (see
 * comment.service.emu.test.ts for the same rationale) — getSharedLesson
 * transitively imports access.service.ts, which imports the notifications
 * barrel.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { adminDb } from "@/lib/firebase-admin";
import { RUN, signInAs, wipeCollections } from "./__tests__/emu-auth";
import { getSharedLesson } from "./shared.service";
import { encodeShareId } from "../utils/shareToken";

vi.mock("@/features/notifications", () => ({
    emitNotification: vi.fn().mockResolvedValue(undefined),
    notifyInvite: vi.fn().mockResolvedValue(undefined),
}));

const d = RUN ? describe : describe.skip;

const APP_ID = "kana-nihongo-master";
const OWNER = "emu_shared_service_owner";
const STRANGER = "emu_shared_service_stranger";
const INVITEE = "emu_shared_service_invitee";
const LESSON_ID = "emu_lesson_for_shared";
const INVITEE_EMAIL = "shared-invitee@example.com";

function lessonPath() {
    return `artifacts/${APP_ID}/users/${OWNER}/lessons/${LESSON_ID}`;
}
function cardsPath() {
    return `artifacts/${APP_ID}/users/${OWNER}/cards`;
}

async function seedLesson(overrides: Record<string, unknown> = {}) {
    await adminDb.doc(lessonPath()).set({
        title: "Shared Service Test Deck",
        description: "d",
        createdAt: 0,
        cardCount: 1,
        ownerId: OWNER,
        roles: { [OWNER]: "owner" },
        ...overrides,
    });
}

async function seedCard() {
    await adminDb.doc(`${cardsPath()}/card1`).set({
        lessonId: LESSON_ID,
        primary: "cat",
        alternatives: [],
        meaning: "a feline",
        example: "ex",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewAt: 0,
    });
}

d("getSharedLesson", () => {
    beforeAll(async () => {
        await signInAs(OWNER, "shared-service-owner@example.com");
    });

    afterEach(async () => {
        await wipeCollections(`artifacts/${APP_ID}/users/${OWNER}/lessons`, cardsPath());
    });

    afterAll(async () => {
        await wipeCollections(`artifacts/${APP_ID}/users/${OWNER}/lessons`, cardsPath());
    });

    it("returns null for an undecodable share token, without touching Firestore", async () => {
        const result = await getSharedLesson("not-a-valid-token!!!");
        expect(result).toBeNull();
    });

    it("returns null when the encoded lesson doesn't exist", async () => {
        const shareId = encodeShareId(OWNER, "no-such-lesson");
        const result = await getSharedLesson(shareId);
        expect(result).toBeNull();
    });

    it("grants the owner access, resolving viewerRole 'owner' and returning cards", async () => {
        await seedLesson();
        await seedCard();
        const shareId = encodeShareId(OWNER, LESSON_ID);
        await signInAs(OWNER, "shared-service-owner@example.com");

        const result = await getSharedLesson(shareId, OWNER);

        expect(result).not.toBeNull();
        expect(result!.meta.viewerRole).toBe("owner");
        expect(result!.cards).toHaveLength(1);
        expect(result!.cards[0].primary).toBe("cat");
    });

    it("grants the owner access when the stored roles map has no self-entry — normalizeLesson heals it before the gate runs", async () => {
        // OP-5 named shared.service.ts's old roles[uid]==="owner" gate as
        // divergent from the engine's ownerId ?? userId check. Empirically
        // (verified by temporarily reverting the T-115a fix and re-running
        // this exact scenario), that divergence is NOT reachable through
        // getSharedLesson specifically: normalizeLesson (lesson-normalize.ts)
        // already back-fills {[ownerId]: "owner"} into the roles map at
        // read time, before either the old or new gate ever sees it. The
        // resolveRole() convergence here is defense-in-depth and ADR-115
        // hygiene (one predicate, not a hand-rolled duplicate that could
        // drift if normalizeLesson's healing is ever changed) — not a fix
        // for a live bug in this specific caller.
        await seedLesson({ roles: {} });
        await seedCard();
        const shareId = encodeShareId(OWNER, LESSON_ID);
        await signInAs(OWNER, "shared-service-owner@example.com");

        const result = await getSharedLesson(shareId, OWNER);

        expect(result).not.toBeNull();
        expect(result!.meta.viewerRole).toBe("owner");
        expect(result!.cards).toHaveLength(1);
    });

    it("strips roles/collaborators/invitedEmails/collaboratorMeta from the returned lesson view model", async () => {
        await seedLesson({
            invitedEmails: { "someone@example.com": { role: "viewer", invitedAt: 0 } },
        });
        const shareId = encodeShareId(OWNER, LESSON_ID);
        await signInAs(OWNER, "shared-service-owner@example.com");

        const result = await getSharedLesson(shareId, OWNER);

        expect(result!.lesson).not.toHaveProperty("roles");
        expect(result!.lesson).not.toHaveProperty("collaborators");
        expect(result!.lesson).not.toHaveProperty("invitedEmails");
        expect(result!.lesson).not.toHaveProperty("collaboratorMeta");
        expect(result!.lesson.title).toBe("Shared Service Test Deck");
    });

    it("grants a stranger 'commenter' access to a publicRole:'commenter' link-shared lesson", async () => {
        await seedLesson({ allowLinkAccess: true, publicRole: "commenter" });
        const shareId = encodeShareId(OWNER, LESSON_ID);
        await signInAs(STRANGER, "stranger@example.com");

        const result = await getSharedLesson(shareId, STRANGER);

        expect(result!.meta.viewerRole).toBe("commenter");
    });

    it("denies a stranger on a private (non-public, no role) lesson", async () => {
        await seedLesson();
        const shareId = encodeShareId(OWNER, LESSON_ID);
        await signInAs(STRANGER, "stranger@example.com");

        const result = await getSharedLesson(shareId, STRANGER);

        expect(result).toBeNull();
    });

    it("[discovered gap] a pending invitee with no link access gets a plain null — indistinguishable from 'deck not found'", async () => {
        // Empirical, not theoretical. getSharedLesson wraps its whole body in
        // one try/catch that maps ANY permission-denied to `null` — whether
        // that comes from the initial lesson read (private lesson, no
        // UID-based role yet) or from syncInviteToCollaborator's own write
        // (already shown separately, in access.service.emu.test.ts, to be
        // rejected by firestore.rules for a first-time invitee). Either way,
        // a pending invitee following their invite link before it has
        // link-sharing enabled sees the same 404 experience as a stranger,
        // with no signal that a real pending invite exists for them.
        await seedLesson({
            invitedEmails: { [INVITEE_EMAIL]: { role: "commenter", invitedAt: 0 } },
        });
        const shareId = encodeShareId(OWNER, LESSON_ID);
        await signInAs(INVITEE, INVITEE_EMAIL);

        const result = await getSharedLesson(shareId, INVITEE, {
            email: INVITEE_EMAIL,
        } as Parameters<typeof getSharedLesson>[2]);

        expect(result).toBeNull();
    });
});
