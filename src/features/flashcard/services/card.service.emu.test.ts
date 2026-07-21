/**
 * @file card.service.emu.test.ts
 * Emulator-backed tests for card.service.ts's CRUD + batch reorder (T-117c).
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { adminDb } from "@/lib/firebase-admin";
import { RUN, signInAs, wipeCollections } from "./__tests__/emu-auth";
import { createCard, deleteCard, reorderCards, updateCard } from "./card.service";

import type { FlashCard } from "../types";

const d = RUN ? describe : describe.skip;

const APP_ID = "kana-nihongo-master";
const OWNER = "emu_card_service_owner";
const LESSON_ID = "emu_lesson_for_cards";

function cardsPath() {
    return `artifacts/${APP_ID}/users/${OWNER}/cards`;
}

function newCard(overrides: Partial<Omit<FlashCard, "id">> = {}): Omit<FlashCard, "id"> {
    return {
        lessonId: LESSON_ID,
        primary: "cat",
        alternatives: [],
        meaning: "a small domesticated feline",
        example: "The cat sat on the mat.",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewAt: 0,
        ...overrides,
    } as Omit<FlashCard, "id">;
}

d("card.service", () => {
    beforeAll(async () => {
        await signInAs(OWNER, "card-service-owner@example.com");
    });

    afterEach(async () => {
        await wipeCollections(cardsPath());
    });

    afterAll(async () => {
        await wipeCollections(cardsPath());
    });

    it("createCard persists content fields and returns a real Firestore doc ID", async () => {
        const id = await createCard(OWNER, newCard({ primary: "dog" }));

        expect(id).toBeTruthy();
        const snap = await adminDb.doc(`${cardsPath()}/${id}`).get();
        expect(snap.exists).toBe(true);
        expect(snap.data()?.primary).toBe("dog");
        expect(snap.data()?.lessonId).toBe(LESSON_ID);
    });

    it("updateCard merges new content into the existing document without dropping unspecified fields", async () => {
        const id = await createCard(OWNER, newCard({ primary: "cat", hint: "meow" }));

        await updateCard(OWNER, { id, ...newCard({ primary: "cat", meaning: "updated meaning" }) });

        const snap = await adminDb.doc(`${cardsPath()}/${id}`).get();
        expect(snap.data()?.meaning).toBe("updated meaning");
        expect(snap.data()?.hint).toBe("meow"); // merge:true preserves the untouched field
    });

    it("deleteCard removes the document", async () => {
        const id = await createCard(OWNER, newCard());
        await deleteCard(OWNER, id);

        const snap = await adminDb.doc(`${cardsPath()}/${id}`).get();
        expect(snap.exists).toBe(false);
    });

    it("reorderCards applies every change in one atomic batch, touching only the targeted docs", async () => {
        const idA = await createCard(OWNER, newCard({ primary: "a", order: "a0" }));
        const idB = await createCard(OWNER, newCard({ primary: "b", order: "a1" }));
        const idC = await createCard(OWNER, newCard({ primary: "c", order: "a2" }));

        await reorderCards(OWNER, [
            { id: idA, order: "b5" },
            { id: idB, order: "b1" },
        ]);

        const [snapA, snapB, snapC] = await Promise.all(
            [idA, idB, idC].map((id) => adminDb.doc(`${cardsPath()}/${id}`).get()),
        );
        expect(snapA.data()?.order).toBe("b5");
        expect(snapB.data()?.order).toBe("b1");
        expect(snapC.data()?.order).toBe("a2"); // untouched — not in the changes list
    });

    it("reorderCards with an empty change list is a no-op that still resolves", async () => {
        const id = await createCard(OWNER, newCard({ order: "a0" }));
        await expect(reorderCards(OWNER, [])).resolves.toBeUndefined();

        const snap = await adminDb.doc(`${cardsPath()}/${id}`).get();
        expect(snap.data()?.order).toBe("a0");
    });
});
