/**
 * @file lesson-duplicate.emu.test.ts
 * Emulator-backed tests for `duplicateLesson` (cleanup-audit B4/PR6d) — the
 * app's only previously-untested write path: saving a personal copy of a
 * shared deck with fresh SRS state and no inherited sharing config.
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 *
 * Mocks `@/features/notifications` by its real specifier (see
 * shared.service.emu.test.ts for the same rationale) — duplicateLesson
 * itself calls emitNotification, which transitively imports a "use server"
 * action Vitest's transform can't load.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { adminDb } from "@/lib/firebase-admin";
import { RUN, signInAs, wipeCollections } from "./__tests__/emu-auth";
import { duplicateLesson } from "./lesson-duplicate";

import type { CardWithProgress } from "../domain";
import type { SharedLessonViewModel } from "../types";

const emitNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("@/features/notifications", () => ({
    emitNotification: (...args: unknown[]) => emitNotification(...args),
    notifyInvite: vi.fn().mockResolvedValue(undefined),
}));

const d = RUN ? describe : describe.skip;

const APP_ID = "kana-nihongo-master";
const NEW_OWNER = "emu_duplicate_new_owner";
const SOURCE_OWNER = "emu_duplicate_source_owner";
const SOURCE_LESSON_ID = "emu_source_lesson";

const lessonsPath = (uid: string) => `artifacts/${APP_ID}/users/${uid}/lessons`;
const cardsPath = (uid: string) => `artifacts/${APP_ID}/users/${uid}/cards`;

function sourceLesson(overrides: Partial<SharedLessonViewModel> = {}): SharedLessonViewModel {
    return Object.freeze({
        id: SOURCE_LESSON_ID,
        title: "Source Deck",
        description: "A deck to duplicate",
        createdAt: 111,
        cardCount: 1,
        isPublic: true,
        allowLinkAccess: true,
        shareId: "some-existing-share-token",
        ...overrides,
    }) as SharedLessonViewModel;
}

function sourceCard(overrides: Partial<CardWithProgress> = {}): CardWithProgress {
    return {
        id: "src_card_1",
        cardId: "src_card_1",
        lessonId: SOURCE_LESSON_ID,
        sourceOwnerId: SOURCE_OWNER,
        primary: "犬",
        alternatives: ["inu"],
        meaning: "dog",
        example: "犬が好きです。",
        easeFactor: 1.8,
        interval: 15,
        repetitions: 5,
        nextReviewAt: Date.now() + 999_999,
        status: "review",
        lastResult: "Good",
        isMistake: false,
        lastReviewedAt: 222,
        createdAt: 111,
        ...overrides,
    } as CardWithProgress;
}

/** Duplicates a standard source deck for NEW_OWNER; overrides merge shallowly. */
function dup(overrides: Partial<Parameters<typeof duplicateLesson>[0]> = {}) {
    return duplicateLesson({
        sourceLesson: sourceLesson(),
        sourceCards: [sourceCard()],
        sourceLessonId: SOURCE_LESSON_ID,
        sourceUserId: SOURCE_OWNER,
        newOwner: { uid: NEW_OWNER, displayName: null, photoURL: null },
        ...overrides,
    });
}

async function findDuplicatedLesson(uid: string) {
    const snap = await adminDb.collection(lessonsPath(uid)).get();
    expect(snap.docs).toHaveLength(1);
    return { id: snap.docs[0].id, data: snap.docs[0].data() };
}

async function findDuplicatedCards(uid: string) {
    const snap = await adminDb.collection(cardsPath(uid)).get();
    return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

d("duplicateLesson", () => {
    beforeEach(async () => {
        emitNotification.mockClear();
        await signInAs(NEW_OWNER, "duplicate-new-owner@example.com");
    });

    afterEach(async () => {
        await wipeCollections(lessonsPath(NEW_OWNER), cardsPath(NEW_OWNER));
    });

    it("saves a fresh, sole-owned lesson doc with no inherited sharing config", async () => {
        await dup({
            newOwner: {
                uid: NEW_OWNER,
                displayName: "New Owner",
                photoURL: "https://example.com/p.jpg",
            },
        });

        const { data } = await findDuplicatedLesson(NEW_OWNER);
        expect(data.ownerId).toBe(NEW_OWNER);
        expect(data.ownerName).toBe("New Owner");
        expect(data.ownerAvatar).toBe("https://example.com/p.jpg");
        expect(data.roles).toEqual({ [NEW_OWNER]: "owner" });
        expect(data.isPublic).toBe(false);
        expect(data.allowLinkAccess).toBe(false);
        expect(data.shareId).toBeUndefined();
    });

    it("preserves the source content and records provenance", async () => {
        await dup({
            sourceLesson: sourceLesson({ title: "My Kanji Deck", description: "N3 kanji" }),
        });

        const { data } = await findDuplicatedLesson(NEW_OWNER);
        expect(data.title).toBe("My Kanji Deck");
        expect(data.description).toBe("N3 kanji");
        expect(data.sourceLessonId).toBe(SOURCE_LESSON_ID);
        expect(data.sourceUserId).toBe(SOURCE_OWNER);
        // A fresh copy, not a reference back to the original doc's createdAt.
        expect(data.createdAt).not.toBe(111);
    });

    it("resets every card's SRS state to fresh, regardless of the source card's progress", async () => {
        await dup({
            sourceCards: [sourceCard({ easeFactor: 1.3, interval: 40, repetitions: 12 })],
        });

        const { id: newLessonId } = await findDuplicatedLesson(NEW_OWNER);
        const cards = await findDuplicatedCards(NEW_OWNER);

        expect(cards).toHaveLength(1);
        expect(cards[0].data.easeFactor).toBe(2.5);
        expect(cards[0].data.interval).toBe(0);
        expect(cards[0].data.repetitions).toBe(0);
        expect(cards[0].data.nextReviewAt).toBe(0);
        expect(cards[0].data.lessonId).toBe(newLessonId);
        // A new card identity, not the source card's id carried over.
        expect(cards[0].id).not.toBe("src_card_1");
        expect(cards[0].data.primary).toBe("犬");
        expect(cards[0].data.meaning).toBe("dog");
    });

    it("notifies the source owner when duplicating someone else's deck", async () => {
        await dup();

        expect(emitNotification).toHaveBeenCalledWith({
            kind: "deck_duplicated",
            ownerId: SOURCE_OWNER,
            lessonId: SOURCE_LESSON_ID,
        });
    });

    it("does not notify when duplicating your own deck", async () => {
        await dup({ sourceUserId: NEW_OWNER });

        expect(emitNotification).not.toHaveBeenCalled();
    });
});
