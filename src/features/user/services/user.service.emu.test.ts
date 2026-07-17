/**
 * @file user.service.emu.test.ts
 * Regression test for a lost-update race in updateUserProgress: a plain
 * getDoc + setDoc(merge:true) does NOT deep-merge the nested `progress`
 * object, so two concurrent updates (e.g. addXP and completedLesson firing
 * back-to-back, unawaited, from the same study-session completion) could
 * silently drop one of them — whichever write landed second won outright.
 * updateUserProgress now runs as a Firestore transaction instead.
 *
 * Uses its own isolated rules-test project (not the shared notifications
 * harness) — sharing that harness's project namespace means its OTHER test
 * files' clearFirestore() calls (running concurrently in a separate vitest
 * worker) can wipe this file's in-flight document mid-transaction, which is
 * indistinguishable from the lost-update bug this test exists to catch.
 *
 * GATED: requires the Firestore emulator + @firebase/rules-unit-testing. Runs
 * via `npm run test:emu` (vitest.emu.config.ts). Skips itself when the
 * emulator env is absent so a stray invocation is a no-op rather than a hang.
 */
import { readFileSync } from "node:fs";

import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc } from "firebase/firestore";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { updateUserProgress } from "./user.service";
import { INITIAL_USER_DATA } from "../types";

import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import type { Firestore } from "firebase/firestore";
import type { UserData } from "../types";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const UID = "emu_user_progress_1";
const APP_ID = "kana-nihongo-master";

let testEnv: RulesTestEnvironment | null = null;

async function authedDb(uid: string): Promise<Firestore> {
    testEnv ??= await initializeTestEnvironment({
        projectId: "demo-user-service",
        firestore: { rules: readFileSync("firestore.rules", "utf8") },
    });
    return testEnv.authenticatedContext(uid).firestore() as unknown as Firestore;
}

function userProgressDoc(db: Firestore, uid: string) {
    return doc(db, "artifacts", APP_ID, "users", uid);
}

d("updateUserProgress — concurrency safety", () => {
    afterEach(async () => {
        if (testEnv) await testEnv.clearFirestore();
    });
    afterAll(async () => {
        if (testEnv) {
            await testEnv.cleanup();
            testEnv = null;
        }
    });

    it("keeps both updates when two concurrent calls race (transactional, no lost update)", async () => {
        const db = await authedDb(UID);

        // Mirrors useStudySession.handleComplete's real call shape: addXP and
        // completedLesson fire back-to-back, unawaited, against the same doc.
        const addXP = updateUserProgress(
            UID,
            (prev: UserData) => ({ ...prev, xp: prev.xp + 50 }),
            db,
        );
        const completedLesson = updateUserProgress(
            UID,
            (prev: UserData) => ({ ...prev, lessonsCompleted: prev.lessonsCompleted + 1 }),
            db,
        );

        await Promise.all([addXP, completedLesson]);

        const finalDoc = await getDoc(userProgressDoc(db, UID));
        const progress = finalDoc.data()?.progress as UserData;

        // Before the fix: whichever write landed second would win outright,
        // silently reverting the other field to its pre-update value.
        expect(progress.xp).toBe(INITIAL_USER_DATA.xp + 50);
        expect(progress.lessonsCompleted).toBe(INITIAL_USER_DATA.lessonsCompleted + 1);
    });

    it("applies 10 concurrent increments without dropping any (transaction retries on contention)", async () => {
        const db = await authedDb(UID);

        await Promise.all(
            Array.from({ length: 10 }, () =>
                updateUserProgress(UID, (prev: UserData) => ({ ...prev, xp: prev.xp + 1 }), db),
            ),
        );

        const finalDoc = await getDoc(userProgressDoc(db, UID));
        const progress = finalDoc.data()?.progress as UserData;

        expect(progress.xp).toBe(INITIAL_USER_DATA.xp + 10);
    });
});
