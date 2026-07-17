/**
 * @file firestore-rules.test.ts
 * Security-rules tests for the notification paths, plus the per-card SRS
 * progress path (artifacts/{appId}/userProgress/{userId}/...).
 *
 * GATED: requires the Firestore emulator + @firebase/rules-unit-testing. Runs
 * via `npm run test:emu` (vitest.emu.config.ts), never in the default unit run.
 * Skips itself when the emulator env is absent so a stray invocation is a no-op
 * rather than a hang.
 *
 * Asserts the Stage-2 hardening in firestore.rules:
 *   - clients may create notifications ONLY in their own inbox; every cross-user
 *     notification is written server-side via the Admin SDK
 *   - immutable fields (senderId/type/createdAt/userId) are frozen on update
 *   - notifications cannot be hard-deleted (soft-delete via isDeleted only)
 *   - pending-notification creates are sender-bound; reads are email-scoped
 *
 * Also asserts userProgress/{userId}/... (SRS grading state, written by
 * progress.service.ts) is readable/writable only by its owner, and rejected
 * for everyone else — this collection had NO rule at all until this pass,
 * so every real user's card grading was silently denied by Firestore's
 * default-deny (discovered while live-testing E17-T1 against seeded data).
 */

import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import {
    authedDb,
    clearData,
    teardown,
    unauthedDb,
    withAdmin,
} from "./features/notifications/__tests__/harness";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const APP = "kana-nihongo-master";
const OWNER = "user_owner";
const OTHER = "user_other";

function inboxPath(uid: string, id: string) {
    return ["artifacts", APP, "users", uid, "notifications", id] as const;
}

function validCross(senderUid: string, recipientUid: string) {
    return {
        userId: recipientUid,
        type: "comment",
        title: "New comment",
        message: "X commented on your deck",
        senderId: senderUid,
        status: "unread",
        isDeleted: false,
        createdAt: 1_700_000_000_000,
    };
}

d("notification create rules (Stage 2 — owner-self only)", () => {
    afterEach(() => clearData());
    afterAll(() => teardown());

    it("lets the inbox owner write into their own inbox (pending delivery)", async () => {
        // senderId is the original sender, but userId == the writer (delivery).
        const db = await authedDb(OWNER);
        await assertSucceeds(
            setDoc(doc(db, ...inboxPath(OWNER, "n1")), validCross("original_sender", OWNER)),
        );
    });

    it("rejects ANY cross-user create — even a truthful one (server-only via Admin SDK)", async () => {
        const db = await authedDb(OTHER);
        await assertFails(setDoc(doc(db, ...inboxPath(OWNER, "n2")), validCross(OTHER, OWNER)));
    });

    it("rejects a forged cross-user create", async () => {
        const db = await authedDb(OTHER);
        await assertFails(
            setDoc(doc(db, ...inboxPath(OWNER, "n3")), validCross("someone_else", OWNER)),
        );
    });
});

d("notification read / update / delete rules (Stage 2)", () => {
    afterEach(() => clearData());
    afterAll(() => teardown());

    async function seed(id: string) {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...inboxPath(OWNER, id)), validCross(OTHER, OWNER));
        });
    }

    it("owner can read own notifications; others cannot", async () => {
        await seed("r1");
        const owner = await authedDb(OWNER);
        const other = await authedDb(OTHER);
        await assertSucceeds(getDoc(doc(owner, ...inboxPath(OWNER, "r1"))));
        await assertFails(getDoc(doc(other, ...inboxPath(OWNER, "r1"))));
    });

    it("owner can mark read (status/read/readAt) — immutable fields unchanged", async () => {
        await seed("r2");
        const owner = await authedDb(OWNER);
        await assertSucceeds(
            updateDoc(doc(owner, ...inboxPath(OWNER, "r2")), {
                status: "read",
                read: true,
                readAt: 1_700_000_001_000,
            }),
        );
    });

    it("owner cannot mutate an immutable field (senderId)", async () => {
        await seed("r3");
        const owner = await authedDb(OWNER);
        await assertFails(
            updateDoc(doc(owner, ...inboxPath(OWNER, "r3")), { senderId: "tampered" }),
        );
    });

    it("owner can soft-delete (isDeleted:true) but cannot hard-delete", async () => {
        await seed("r4");
        const owner = await authedDb(OWNER);
        await assertSucceeds(updateDoc(doc(owner, ...inboxPath(OWNER, "r4")), { isDeleted: true }));
        await assertFails(deleteDoc(doc(owner, ...inboxPath(OWNER, "r4"))));
    });
});

d("pending-notification rules", () => {
    afterEach(() => clearData());
    afterAll(() => teardown());

    function pendingPath(email: string, id: string) {
        return ["artifacts", APP, "pendingNotifications", email, "items", id] as const;
    }

    it("caller can enqueue a truthful pending invite (senderId == caller)", async () => {
        const db = await authedDb(OWNER, "owner@example.com");
        await assertSucceeds(
            setDoc(doc(db, ...pendingPath("invitee@example.com", "p1")), {
                type: "invite",
                title: "You've been invited",
                message: "owner invited you",
                senderId: OWNER,
                status: "unread",
                isDeleted: false,
                createdAt: 1_700_000_000_000,
            }),
        );
    });

    it("reads are scoped to the token email (no cross-email disclosure)", async () => {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...pendingPath("invitee@example.com", "p2")), {
                type: "invite",
                senderId: OWNER,
                title: "t",
                message: "m",
            });
        });
        const invitee = await authedDb("user_invitee", "invitee@example.com");
        const stranger = await authedDb("user_stranger", "stranger@example.com");
        await assertSucceeds(getDoc(doc(invitee, ...pendingPath("invitee@example.com", "p2"))));
        await assertFails(getDoc(doc(stranger, ...pendingPath("invitee@example.com", "p2"))));
    });
});

d("userProgress rules (per-card SRS state)", () => {
    afterEach(() => clearData());
    afterAll(() => teardown());

    function progressCardPath(uid: string, lessonId: string, cardId: string) {
        return [
            "artifacts",
            APP,
            "userProgress",
            uid,
            "lessons",
            lessonId,
            "cards",
            cardId,
        ] as const;
    }

    function statsPath(uid: string) {
        return ["artifacts", APP, "userProgress", uid, "studyStats", "daily"] as const;
    }

    const progress = {
        cardId: "card1",
        lessonId: "lessonA",
        sourceOwnerId: OWNER,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewAt: 0,
        status: "new",
        lastResult: null,
        isMistake: false,
        lastReviewedAt: null,
        createdAt: 1_700_000_000_000,
    };

    it("owner can write and read their own card progress", async () => {
        const db = await authedDb(OWNER);
        await assertSucceeds(
            setDoc(doc(db, ...progressCardPath(OWNER, "lessonA", "card1")), progress),
        );
        await assertSucceeds(getDoc(doc(db, ...progressCardPath(OWNER, "lessonA", "card1"))));
    });

    it("another signed-in user cannot read or write someone else's card progress", async () => {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...progressCardPath(OWNER, "lessonA", "card1")), progress);
        });
        const other = await authedDb(OTHER);
        await assertFails(getDoc(doc(other, ...progressCardPath(OWNER, "lessonA", "card1"))));
        await assertFails(
            setDoc(doc(other, ...progressCardPath(OWNER, "lessonA", "card1")), {
                ...progress,
                isMistake: true,
            }),
        );
    });

    it("an unauthenticated visitor cannot read card progress, even for a public deck's owner", async () => {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...progressCardPath(OWNER, "lessonA", "card1")), progress);
        });
        const anon = await unauthedDb();
        await assertFails(getDoc(doc(anon, ...progressCardPath(OWNER, "lessonA", "card1"))));
    });

    it("owner can write and read their own daily study stats", async () => {
        const db = await authedDb(OWNER);
        await assertSucceeds(
            setDoc(doc(db, ...statsPath(OWNER)), {
                date: "2026-07-18",
                reviewedCount: 3,
                lastUpdatedAt: 1_700_000_000_000,
            }),
        );
        await assertSucceeds(getDoc(doc(db, ...statsPath(OWNER))));
    });

    it("another signed-in user cannot read someone else's daily study stats", async () => {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...statsPath(OWNER)), {
                date: "2026-07-18",
                reviewedCount: 3,
                lastUpdatedAt: 1_700_000_000_000,
            });
        });
        const other = await authedDb(OTHER);
        await assertFails(getDoc(doc(other, ...statsPath(OWNER))));
    });
});

// Keep the linter happy when the whole suite is skipped (RUN === false).
if (!RUN) {
    it.skip("firestore rules tests require FIRESTORE_EMULATOR_HOST", () => {
        expect(true).toBe(true);
    });
}
