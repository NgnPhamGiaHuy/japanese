/**
 * @file user.service.stats.emu.test.ts
 * Emulator-backed proof of the T-114b honest-UI invariant for
 * `getAdminStats()`: when the never-written `metadata/counters` cache is
 * absent (or missing a specific field), `activeUsersToday`/`totalSessions`/
 * `errorRate` come back `null` — never a fabricated `0` (ADR-114). The
 * always-live fields (`totalUsers`, `totalFlashcards`) are unaffected by
 * this change and keep using their `count()` aggregation fallback.
 *
 * GATED: requires the Firestore emulator. Skips itself when absent.
 */
import { afterEach, describe, expect, it } from "vitest";

import { adminDb } from "@/lib/firebase-admin";
import { getAdminStats } from "./user.service";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

const COUNTERS_REF = adminDb ? adminDb.collection("metadata").doc("counters") : null;

d("getAdminStats — honest absent-data (T-114b)", () => {
    afterEach(async () => {
        await COUNTERS_REF?.delete().catch(() => {});
    });

    it("returns null (not 0) for activeUsersToday/totalSessions/errorRate when metadata/counters does not exist", async () => {
        await COUNTERS_REF?.delete().catch(() => {});

        const stats = await getAdminStats();

        expect(stats.activeUsersToday).toBeNull();
        expect(stats.totalSessions).toBeNull();
        expect(stats.errorRate).toBeNull();
        // The real-data path stays real: still numbers, from the live count() fallback.
        expect(typeof stats.totalUsers).toBe("number");
        expect(typeof stats.totalFlashcards).toBe("number");
    });

    it("returns null (not 0) for just the fields missing from an otherwise-present cache doc", async () => {
        await COUNTERS_REF?.set({ totalUsers: 42 });

        const stats = await getAdminStats();

        expect(stats.totalUsers).toBe(42);
        expect(stats.activeUsersToday).toBeNull();
        expect(stats.totalSessions).toBeNull();
        expect(stats.errorRate).toBeNull();
    });

    it("returns the real cached numbers when metadata/counters has them, including a genuine 0", async () => {
        await COUNTERS_REF?.set({ activeUsersToday: 0, totalSessions: 12, errorRate: 1.5 });

        const stats = await getAdminStats();

        // A real, measured zero is preserved as 0 — only the absent case is null.
        expect(stats.activeUsersToday).toBe(0);
        expect(stats.totalSessions).toBe(12);
        expect(stats.errorRate).toBe(1.5);
    });
});
