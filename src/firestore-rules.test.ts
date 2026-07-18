/**
 * @file firestore-rules.test.ts
 * Security-rules tests for the notification paths, plus the per-card SRS
 * progress path (artifacts/{appId}/userProgress/{userId}/...) and the game
 * session/leaderboard/stats paths session.service.ts/leaderboard.service.ts/
 * stats.service.ts write to.
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
 *
 * Also asserts game_sessions/leaderboard_{mode}/users/{uid}/stats — three
 * more paths discovered completely unruled (same default-deny class of bug
 * as userProgress above) while Chrome-verifying E17-T6: sessions and stats
 * are owner-only, leaderboard entries are publicly readable but writable
 * only by the entry's own owner (doc id == uid).
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

d("game session rules (E17-T6 follow-up: was completely unruled)", () => {
    afterEach(() => clearData());
    afterAll(() => teardown());

    function sessionPath(sessionId: string) {
        return ["artifacts", APP, "public", "data", "game_sessions", sessionId] as const;
    }

    const session = {
        userId: OWNER,
        userName: "Owner",
        gameMode: "flashcard_speed_deckA",
        score: 0,
        status: "playing",
    };

    it("owner can create their own session", async () => {
        const db = await authedDb(OWNER);
        await assertSucceeds(setDoc(doc(db, ...sessionPath("s1")), session));
    });

    it("cannot create a session forging someone else's userId", async () => {
        const other = await authedDb(OTHER);
        await assertFails(setDoc(doc(other, ...sessionPath("s2")), session));
    });

    it("owner can update their own session; another user cannot", async () => {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...sessionPath("s3")), session);
        });
        const owner = await authedDb(OWNER);
        const other = await authedDb(OTHER);
        await assertSucceeds(updateDoc(doc(owner, ...sessionPath("s3")), { score: 120 }));
        await assertFails(updateDoc(doc(other, ...sessionPath("s3")), { score: 999 }));
    });

    it("owner can read their own session; another user cannot", async () => {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...sessionPath("s4")), session);
        });
        const owner = await authedDb(OWNER);
        const other = await authedDb(OTHER);
        await assertSucceeds(getDoc(doc(owner, ...sessionPath("s4"))));
        await assertFails(getDoc(doc(other, ...sessionPath("s4"))));
    });

    it("nobody can delete a session, not even the owner", async () => {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...sessionPath("s5")), session);
        });
        const owner = await authedDb(OWNER);
        await assertFails(deleteDoc(doc(owner, ...sessionPath("s5"))));
    });
});

d("leaderboard rules (E17-T6 follow-up: was completely unruled)", () => {
    afterEach(() => clearData());
    afterAll(() => teardown());

    function lbPath(gameMode: string, uid: string) {
        return ["artifacts", APP, "public", "data", `leaderboard_${gameMode}`, uid] as const;
    }

    const entry = {
        userId: OWNER,
        displayName: "Owner",
        score: 500,
        gameMode: "flashcard_speed_deckA",
        timestamp: "2026-07-18T00:00:00.000Z",
    };

    it("anyone signed in can read a leaderboard entry", async () => {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...lbPath("flashcard_speed_deckA", OWNER)), entry);
        });
        const other = await authedDb(OTHER);
        await assertSucceeds(getDoc(doc(other, ...lbPath("flashcard_speed_deckA", OWNER))));
    });

    it("an unauthenticated visitor can also read the public leaderboard", async () => {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...lbPath("flashcard_speed_deckA", OWNER)), entry);
        });
        const anon = await unauthedDb();
        await assertSucceeds(getDoc(doc(anon, ...lbPath("flashcard_speed_deckA", OWNER))));
    });

    it("owner can write their own leaderboard entry (doc id == uid)", async () => {
        const db = await authedDb(OWNER);
        await assertSucceeds(setDoc(doc(db, ...lbPath("flashcard_speed_deckA", OWNER)), entry));
    });

    it("cannot write to another user's leaderboard entry", async () => {
        const other = await authedDb(OTHER);
        await assertFails(
            setDoc(doc(other, ...lbPath("flashcard_speed_deckA", OWNER)), {
                ...entry,
                userId: OTHER,
            }),
        );
    });
});

d("game stats rules — personal bests (E17-T6 follow-up: was completely unruled)", () => {
    afterEach(() => clearData());
    afterAll(() => teardown());

    function statsPath(uid: string, gameMode: string) {
        return ["artifacts", APP, "users", uid, "stats", gameMode] as const;
    }

    it("owner can write and read their own best score", async () => {
        const db = await authedDb(OWNER);
        await assertSucceeds(
            setDoc(doc(db, ...statsPath(OWNER, "flashcard_speed_deckA")), {
                bestScore: 500,
                lastUpdated: "2026-07-18T00:00:00.000Z",
            }),
        );
        await assertSucceeds(getDoc(doc(db, ...statsPath(OWNER, "flashcard_speed_deckA"))));
    });

    it("another signed-in user cannot read or write someone else's best score", async () => {
        await withAdmin(async (db) => {
            await setDoc(doc(db, ...statsPath(OWNER, "flashcard_speed_deckA")), {
                bestScore: 500,
                lastUpdated: "2026-07-18T00:00:00.000Z",
            });
        });
        const other = await authedDb(OTHER);
        await assertFails(getDoc(doc(other, ...statsPath(OWNER, "flashcard_speed_deckA"))));
        await assertFails(
            setDoc(doc(other, ...statsPath(OWNER, "flashcard_speed_deckA")), {
                bestScore: 999,
                lastUpdated: "2026-07-18T00:00:01.000Z",
            }),
        );
    });
});

// Keep the linter happy when the whole suite is skipped (RUN === false).
if (!RUN) {
    it.skip("firestore rules tests require FIRESTORE_EMULATOR_HOST", () => {
        expect(true).toBe(true);
    });
}
