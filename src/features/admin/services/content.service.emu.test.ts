/**
 * @file content.service.emu.test.ts
 * Regression test for deleteGlobalFlashcard leaving orphaned card documents.
 * Cards live in a flat, top-level collection (artifacts/{appId}/users/{ownerId}/cards)
 * linked to their lesson only by a `lessonId` field — not a Firestore
 * subcollection of the lesson doc — so deleting the lesson document alone
 * never touched them. deleteGlobalFlashcard now batch-deletes matching cards
 * alongside the lesson.
 *
 * GATED: requires the Firestore emulator (FIRESTORE_EMULATOR_HOST). Runs via
 * `npm run test:emu` (vitest.emu.config.ts). Skips itself when the emulator
 * env is absent so a stray invocation is a no-op rather than a hang.
 */
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { adminDb } from "@/lib/firebase-admin";
import { deleteGlobalFlashcard } from "./content.service";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const APP_ID = "kana-nihongo-master";
const OWNER = "emu_content_owner";
const LESSON_ID = "emu_content_lesson_1";

function lessonPath(ownerId: string, lessonId: string) {
    return `artifacts/${APP_ID}/users/${ownerId}/lessons/${lessonId}`;
}

function cardsCol(ownerId: string) {
    return adminDb
        .collection("artifacts")
        .doc(APP_ID)
        .collection("users")
        .doc(ownerId)
        .collection("cards");
}

async function seedLessonWithCards(cardCount: number) {
    await adminDb.doc(lessonPath(OWNER, LESSON_ID)).set({
        title: "Emulator Content Deck",
        ownerId: OWNER,
        userId: OWNER,
        cardCount,
    });

    const batch = adminDb.batch();
    for (let i = 0; i < cardCount; i++) {
        batch.set(cardsCol(OWNER).doc(`card_${i}`), {
            lessonId: LESSON_ID,
            primary: `word_${i}`,
            meaning: `meaning_${i}`,
        });
    }
    await batch.commit();
}

async function clearAll() {
    const cardsSnap = await cardsCol(OWNER).where("lessonId", "==", LESSON_ID).get();
    await Promise.all(cardsSnap.docs.map((doc) => doc.ref.delete()));
    await adminDb.doc(lessonPath(OWNER, LESSON_ID)).delete();
}

d("deleteGlobalFlashcard — cascades to cards", () => {
    afterEach(() => clearAll());
    afterAll(() => clearAll());

    it("deletes every card belonging to the lesson, not just the lesson doc", async () => {
        await seedLessonWithCards(5);

        const result = await deleteGlobalFlashcard(lessonPath(OWNER, LESSON_ID));

        expect(result.ownerId).toBe(OWNER);
        expect(result.lessonId).toBe(LESSON_ID);

        const lessonSnap = await adminDb.doc(lessonPath(OWNER, LESSON_ID)).get();
        expect(lessonSnap.exists).toBe(false);

        // Before the fix: all 5 of these survived the lesson delete, orphaned.
        const remainingCards = await cardsCol(OWNER).where("lessonId", "==", LESSON_ID).get();
        expect(remainingCards.docs).toHaveLength(0);
    });

    it("leaves other lessons' cards untouched", async () => {
        await seedLessonWithCards(2);
        const otherLessonId = "emu_content_lesson_other";
        await adminDb.doc(lessonPath(OWNER, otherLessonId)).set({ title: "Other deck" });
        await cardsCol(OWNER).doc("other_card").set({ lessonId: otherLessonId, primary: "x" });

        await deleteGlobalFlashcard(lessonPath(OWNER, LESSON_ID));

        const otherCardSnap = await cardsCol(OWNER).doc("other_card").get();
        expect(otherCardSnap.exists).toBe(true);

        await adminDb.doc(lessonPath(OWNER, otherLessonId)).delete();
        await cardsCol(OWNER).doc("other_card").delete();
    });
});
