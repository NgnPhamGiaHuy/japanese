/**
 * @file lesson-save.emu.test.ts
 * Emulator-backed tests for `saveLessonWithCards` — the diff-based atomic
 * batch writer (T-117c). This is the regression net ADR-106/109 rewrite
 * against in Waves 3-5, so it must pin down the actual create/update/delete/
 * reorder/no-op diff behavior, not just that the function "runs".
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { adminDb } from "@/lib/firebase-admin";
import { RUN, signInAs, wipeCollections } from "./__tests__/emu-auth";
import { saveLessonWithCards } from "./lesson-save";
import { CardValidationError } from "../utils/card.validator";

import type { FlashCard, Lesson } from "../types";

const d = RUN ? describe : describe.skip;

const APP_ID = "kana-nihongo-master";
const OWNER = "emu_lesson_save_owner";

function lessonsPath() {
    return `artifacts/${APP_ID}/users/${OWNER}/lessons`;
}
function cardsPath() {
    return `artifacts/${APP_ID}/users/${OWNER}/cards`;
}

function baseLesson(overrides: Partial<Lesson> = {}): Lesson {
    return {
        id: "",
        title: "Test Deck",
        description: "A deck for lesson-save tests",
        createdAt: 0,
        cardCount: 0,
        ...overrides,
    } as Lesson;
}

function card(
    id: string,
    primary: string,
    overrides: Partial<Omit<FlashCard, "lessonId">> = {},
): Omit<FlashCard, "lessonId"> {
    return {
        id,
        primary,
        alternatives: [],
        meaning: `meaning of ${primary}`,
        example: `example with ${primary}`,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewAt: 0,
        ...overrides,
    } as Omit<FlashCard, "lessonId">;
}

async function getOnlyLesson() {
    const snap = await adminDb.collection(lessonsPath()).get();
    expect(snap.docs).toHaveLength(1);
    return { id: snap.docs[0].id, data: snap.docs[0].data() as Lesson };
}

async function getCardsFor(lessonId: string) {
    const snap = await adminDb.collection(cardsPath()).where("lessonId", "==", lessonId).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FlashCard);
}

d("saveLessonWithCards", () => {
    beforeAll(async () => {
        await signInAs(OWNER, "lesson-save-owner@example.com");
    });

    afterEach(async () => {
        await wipeCollections(lessonsPath(), cardsPath());
    });

    afterAll(async () => {
        await wipeCollections(lessonsPath(), cardsPath());
    });

    it("create: stamps ownership fields, roles, and cardCount on a brand-new lesson", async () => {
        await saveLessonWithCards(
            OWNER,
            baseLesson({ title: "My New Deck" }),
            [card("c_1", "cat"), card("c_2", "dog")],
            true,
        );

        const { data } = await getOnlyLesson();
        expect(data.title).toBe("My New Deck");
        expect(data.ownerId).toBe(OWNER);
        expect(data.userId).toBeUndefined();
        expect(data.roles).toEqual({ [OWNER]: "owner" });
        expect(data.collaborators).toBeUndefined();
        expect(data.allowLinkAccess).toBe(false);
        expect(data.cardCount).toBe(2);
    });

    it("create: assigns every temp-id card a real document with fractional order keys matching input order", async () => {
        await saveLessonWithCards(
            OWNER,
            baseLesson(),
            [card("c_1", "cat"), card("c_2", "dog"), card("c_3", "bird")],
            true,
        );

        const { id: lessonId } = await getOnlyLesson();
        const cards = await getCardsFor(lessonId);
        expect(cards).toHaveLength(3);

        const byPrimary = new Map(cards.map((c) => [c.primary, c]));
        const catOrder = byPrimary.get("cat")!.order as string;
        const dogOrder = byPrimary.get("dog")!.order as string;
        const birdOrder = byPrimary.get("bird")!.order as string;
        expect([catOrder, dogOrder, birdOrder].sort()).toEqual([catOrder, dogOrder, birdOrder]);
    });

    it("update — create diff: adds a new card (temp id) alongside the existing one, without touching it", async () => {
        await saveLessonWithCards(OWNER, baseLesson(), [card("c_1", "cat")], true);
        const { id: lessonId, data: created } = await getOnlyLesson();
        const [existingCard] = await getCardsFor(lessonId);

        await saveLessonWithCards(
            OWNER,
            { ...created, id: lessonId },
            [card(existingCard.id, "cat"), card("c_new", "dog")],
            false,
        );

        const cards = await getCardsFor(lessonId);
        expect(cards.map((c) => c.primary).sort()).toEqual(["cat", "dog"]);
        const { data: updated } = await getOnlyLesson();
        expect(updated.cardCount).toBe(2);
    });

    it("update — update diff: full-replaces an existing card's content by real id", async () => {
        await saveLessonWithCards(OWNER, baseLesson(), [card("c_1", "cat")], true);
        const { id: lessonId, data: created } = await getOnlyLesson();
        const [existingCard] = await getCardsFor(lessonId);

        await saveLessonWithCards(
            OWNER,
            { ...created, id: lessonId },
            [card(existingCard.id, "cat", { meaning: "a feline, edited" })],
            false,
        );

        const [updatedCard] = await getCardsFor(lessonId);
        expect(updatedCard.id).toBe(existingCard.id);
        expect(updatedCard.meaning).toBe("a feline, edited");
    });

    it("update — delete diff: removes a card that's missing from the incoming set", async () => {
        await saveLessonWithCards(
            OWNER,
            baseLesson(),
            [card("c_1", "cat"), card("c_2", "dog")],
            true,
        );
        const { id: lessonId, data: created } = await getOnlyLesson();
        const existingCards = await getCardsFor(lessonId);
        const catCard = existingCards.find((c) => c.primary === "cat")!;

        await saveLessonWithCards(
            OWNER,
            { ...created, id: lessonId },
            [card(catCard.id, "cat")],
            false,
        );

        const cards = await getCardsFor(lessonId);
        expect(cards.map((c) => c.primary)).toEqual(["cat"]);
        const { data: updated } = await getOnlyLesson();
        expect(updated.cardCount).toBe(1);
    });

    it("update — reorder diff: re-stamps fractional order keys to match the new incoming order", async () => {
        await saveLessonWithCards(
            OWNER,
            baseLesson(),
            [card("c_1", "cat"), card("c_2", "dog")],
            true,
        );
        const { id: lessonId, data: created } = await getOnlyLesson();
        const existingCards = await getCardsFor(lessonId);
        const cat = existingCards.find((c) => c.primary === "cat")!;
        const dog = existingCards.find((c) => c.primary === "dog")!;

        // Reverse the order: dog now comes first in the incoming array.
        await saveLessonWithCards(
            OWNER,
            { ...created, id: lessonId },
            [card(dog.id, "dog"), card(cat.id, "cat")],
            false,
        );

        const reordered = await getCardsFor(lessonId);
        const byId = new Map(reordered.map((c) => [c.id, c]));
        const dogOrder = byId.get(dog.id)!.order as string;
        const catOrder = byId.get(cat.id)!.order as string;
        expect(dogOrder < catOrder).toBe(true); // dog now sorts before cat
    });

    it("no-op diff: re-saving the identical card set deletes nothing and keeps the same card count", async () => {
        await saveLessonWithCards(
            OWNER,
            baseLesson(),
            [card("c_1", "cat"), card("c_2", "dog")],
            true,
        );
        const { id: lessonId, data: created } = await getOnlyLesson();
        const existingCards = await getCardsFor(lessonId);

        await saveLessonWithCards(
            OWNER,
            { ...created, id: lessonId },
            existingCards.map((c) => card(c.id, c.primary)),
            false,
        );

        const cards = await getCardsFor(lessonId);
        expect(cards.map((c) => c.id).sort()).toEqual(existingCards.map((c) => c.id).sort());
        const { data: updated } = await getOnlyLesson();
        expect(updated.cardCount).toBe(2);
    });

    it("rejects duplicate real card IDs and writes nothing", async () => {
        await expect(
            saveLessonWithCards(
                OWNER,
                baseLesson(),
                [card("dup", "cat"), card("dup", "dog")],
                true,
            ),
        ).rejects.toThrow(/Duplicate card IDs/);

        const snap = await adminDb.collection(lessonsPath()).get();
        expect(snap.docs).toHaveLength(0);
    });

    it("rejects a missing title before writing anything", async () => {
        await expect(
            saveLessonWithCards(OWNER, baseLesson({ title: "" }), [card("c_1", "cat")], true),
        ).rejects.toThrow();

        const snap = await adminDb.collection(lessonsPath()).get();
        expect(snap.docs).toHaveLength(0);
    });

    it("rejects a non-atomic card primary (e.g. 'cat/dog') as a CardValidationError, writing nothing", async () => {
        await expect(
            saveLessonWithCards(OWNER, baseLesson(), [card("c_1", "cat/dog")], true),
        ).rejects.toBeInstanceOf(CardValidationError);

        const snap = await adminDb.collection(lessonsPath()).get();
        expect(snap.docs).toHaveLength(0);
    });

    it("rejects a cloze card whose clozeTemplate has no ___ token, writing nothing (T-109a)", async () => {
        // Study mode's displayEngine.ts renders clozeTemplate verbatim with no
        // parsing — a missing token would silently render as a plain
        // sentence rather than error at read time, so this must be caught
        // here, at the write boundary, independent of cardContentSchema's
        // own gated (Q-12) disposition.
        const badCard = card("c_1", "cat", {
            cardType: "cloze",
            clozeTemplate: "no blank token here",
        });

        await expect(saveLessonWithCards(OWNER, baseLesson(), [badCard], true)).rejects.toThrow(
            /clozeTemplate must contain exactly one ___ token/,
        );

        const snap = await adminDb.collection(lessonsPath()).get();
        expect(snap.docs).toHaveLength(0);
    });

    it("accepts a cloze card whose clozeTemplate has exactly one ___ token", async () => {
        const goodCard = card("c_1", "cat", {
            cardType: "cloze",
            clozeTemplate: "The ___ sat on the mat.",
        });

        await saveLessonWithCards(OWNER, baseLesson(), [goodCard], true);

        const snap = await adminDb.collection(cardsPath()).get();
        expect(snap.docs).toHaveLength(1);
        expect(snap.docs[0].data().clozeTemplate).toBe("The ___ sat on the mat.");
    });
});
