/**
 * @file __tests__/harness.ts
 * Emulator test harness. Wraps @firebase/rules-unit-testing so the
 * rules suite and integration tests share one setup.
 *
 * Requires the Firestore/Auth emulator (FIRESTORE_EMULATOR_HOST) and
 * @firebase/rules-unit-testing (a devDependency). Run via `npm run test:emu`,
 * which boots the emulator with `firebase emulators:exec`. Not part of the
 * default `npm test` unit run (see vitest.config.ts / vitest.emu.config.ts).
 */

import { readFileSync } from "node:fs";

import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import type { Firestore } from "firebase/firestore";

export const TEST_PROJECT_ID = "demo-notifications";

let testEnv: RulesTestEnvironment | null = null;

/** Boots (once) a rules test environment loaded with the repo's firestore.rules. */
export async function getTestEnv(): Promise<RulesTestEnvironment> {
    if (testEnv) return testEnv;
    testEnv = await initializeTestEnvironment({
        projectId: TEST_PROJECT_ID,
        firestore: {
            // cwd is the project root (src/) when vitest runs.
            rules: readFileSync("firestore.rules", "utf8"),
        },
    });
    return testEnv;
}

/** Firestore handle for a signed-in user (rules enforced). */
export async function authedDb(uid: string, email?: string): Promise<Firestore> {
    const env = await getTestEnv();
    const token = email ? { email } : undefined;
    return env.authenticatedContext(uid, token).firestore() as unknown as Firestore;
}

/** Firestore handle for an anonymous visitor (rules enforced). */
export async function unauthedDb(): Promise<Firestore> {
    const env = await getTestEnv();
    return env.unauthenticatedContext().firestore() as unknown as Firestore;
}

/** Seed helper: run writes with rules DISABLED (admin-like context). */
export async function withAdmin(fn: (db: Firestore) => Promise<void>): Promise<void> {
    const env = await getTestEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
        await fn(ctx.firestore() as unknown as Firestore);
    });
}

export async function clearData(): Promise<void> {
    const env = await getTestEnv();
    await env.clearFirestore();
}

export async function teardown(): Promise<void> {
    if (testEnv) {
        await testEnv.cleanup();
        testEnv = null;
    }
}
