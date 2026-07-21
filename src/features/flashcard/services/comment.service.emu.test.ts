/**
 * @file comment.service.emu.test.ts
 * Emulator-backed tests for comment.service.ts's CRUD orchestration (T-117c):
 * add/reply/resolve/get/update/delete, plus the self-notification skip.
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 *
 * Mocks `@/features/notifications` by its real specifier — not a runtime
 * coupling, per the cross-feature-import exemption for test files (see
 * eslint.config.mjs's ADR-101 boundary comment). Its real barrel re-exports
 * React components that transitively require Next's app-router runtime
 * (`next/navigation`), which doesn't resolve under plain Vitest; every test
 * here acts as its own deck owner, so the skip-self-notification branch
 * never actually calls into it regardless.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { adminDb } from "@/lib/firebase-admin";
import { RUN, signInAs, wipeCollections } from "./__tests__/emu-auth";
import { CommentError, CommentErrorCode } from "./comment-errors";
import {
    addComment,
    deleteComment,
    getComments,
    replyToComment,
    resolveComment,
    updateComment,
} from "./comment.service";

vi.mock("@/features/notifications", () => ({
    emitNotification: vi.fn().mockResolvedValue(undefined),
}));

const d = RUN ? describe : describe.skip;

const APP_ID = "kana-nihongo-master";
const OWNER = "emu_comment_service_owner";
const LESSON_ID = "emu_lesson_for_comments";
const CARD_ID = "emu_card_for_comments";

function commentsPath() {
    return `artifacts/${APP_ID}/users/${OWNER}/lessons/${LESSON_ID}/cards/${CARD_ID}/comments`;
}
function notificationsPath() {
    return `artifacts/${APP_ID}/users/${OWNER}/notifications`;
}

d("comment.service", () => {
    beforeAll(async () => {
        await signInAs(OWNER, "comment-service-owner@example.com");
    });

    afterEach(async () => {
        await wipeCollections(commentsPath(), notificationsPath());
    });

    afterAll(async () => {
        await wipeCollections(commentsPath(), notificationsPath());
    });

    it("addComment persists sanitized content with resolved:false and an empty replies array", async () => {
        const id = await addComment(
            OWNER,
            LESSON_ID,
            CARD_ID,
            "<b>nice</b> mnemonic",
            OWNER,
            "Owner",
        );

        const snap = await adminDb.doc(`${commentsPath()}/${id}`).get();
        expect(snap.data()?.content).toBe("&lt;b&gt;nice&lt;/b&gt; mnemonic");
        expect(snap.data()?.resolved).toBe(false);
        expect(snap.data()?.replies).toEqual([]);
    });

    it("addComment does not notify when the commenter is the deck owner (never self-notifies)", async () => {
        await addComment(OWNER, LESSON_ID, CARD_ID, "a comment", OWNER, "Owner");

        const notifSnap = await adminDb.collection(notificationsPath()).get();
        expect(notifSnap.docs).toHaveLength(0);
    });

    it("rejects empty content before writing anything", async () => {
        await expect(
            addComment(OWNER, LESSON_ID, CARD_ID, "   ", OWNER, "Owner"),
        ).rejects.toMatchObject({ code: CommentErrorCode.INVALID_CONTENT });

        const snap = await adminDb.collection(commentsPath()).get();
        expect(snap.docs).toHaveLength(0);
    });

    it("replyToComment appends to the replies array without disturbing the parent's other fields", async () => {
        const id = await addComment(OWNER, LESSON_ID, CARD_ID, "parent comment", OWNER, "Owner");

        await replyToComment(OWNER, LESSON_ID, CARD_ID, id, "a reply", OWNER, "Owner");

        const snap = await adminDb.doc(`${commentsPath()}/${id}`).get();
        const replies = snap.data()?.replies as Array<{ content: string }>;
        expect(replies).toHaveLength(1);
        expect(replies[0].content).toBe("a reply");
        expect(snap.data()?.content).toBe("parent comment");
    });

    it("replyToComment on a non-existent comment throws COMMENT_NOT_FOUND", async () => {
        await expect(
            replyToComment(OWNER, LESSON_ID, CARD_ID, "nonexistent", "a reply", OWNER, "Owner"),
        ).rejects.toMatchObject({ code: CommentErrorCode.COMMENT_NOT_FOUND });
    });

    it("resolveComment toggles resolved true, then false, on repeated calls", async () => {
        const id = await addComment(OWNER, LESSON_ID, CARD_ID, "needs a look", OWNER, "Owner");

        await resolveComment(OWNER, LESSON_ID, CARD_ID, id, OWNER);
        expect((await adminDb.doc(`${commentsPath()}/${id}`).get()).data()?.resolved).toBe(true);

        await resolveComment(OWNER, LESSON_ID, CARD_ID, id, OWNER);
        expect((await adminDb.doc(`${commentsPath()}/${id}`).get()).data()?.resolved).toBe(false);
    });

    it("getComments returns every comment for the card", async () => {
        await addComment(OWNER, LESSON_ID, CARD_ID, "first", OWNER, "Owner");
        await addComment(OWNER, LESSON_ID, CARD_ID, "second", OWNER, "Owner");

        const comments = await getComments(OWNER, LESSON_ID, CARD_ID);
        expect(comments.map((c) => c.content).sort()).toEqual(["first", "second"]);
    });

    it("updateComment replaces content and stamps updatedAt", async () => {
        const id = await addComment(OWNER, LESSON_ID, CARD_ID, "typo verison", OWNER, "Owner");

        await updateComment(OWNER, LESSON_ID, CARD_ID, id, "typo version", OWNER);

        const snap = await adminDb.doc(`${commentsPath()}/${id}`).get();
        expect(snap.data()?.content).toBe("typo version");
        expect(snap.data()?.updatedAt).toBeTypeOf("number");
    });

    it("updateComment on a non-existent comment throws COMMENT_NOT_FOUND, and rejects invalid content before the existence check", async () => {
        await expect(
            updateComment(OWNER, LESSON_ID, CARD_ID, "nonexistent", "fine content", OWNER),
        ).rejects.toMatchObject({ code: CommentErrorCode.COMMENT_NOT_FOUND });

        await expect(
            updateComment(OWNER, LESSON_ID, CARD_ID, "nonexistent", "", OWNER),
        ).rejects.toMatchObject({ code: CommentErrorCode.INVALID_CONTENT });
    });

    it("deleteComment removes the document", async () => {
        const id = await addComment(OWNER, LESSON_ID, CARD_ID, "to be deleted", OWNER, "Owner");

        await deleteComment(OWNER, LESSON_ID, CARD_ID, id, OWNER, true);

        const snap = await adminDb.doc(`${commentsPath()}/${id}`).get();
        expect(snap.exists).toBe(false);
    });

    it("deleteComment on a non-existent comment throws COMMENT_NOT_FOUND", async () => {
        await expect(
            deleteComment(OWNER, LESSON_ID, CARD_ID, "nonexistent", OWNER, true),
        ).rejects.toBeInstanceOf(CommentError);
    });
});
