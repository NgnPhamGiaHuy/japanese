/**
 * @file analytics.service.emu.test.ts
 * Emulator-backed proof of the T-114b honest-UI invariant for
 * `getAdminAnalytics()`: when `analytics_daily` has zero documents, the
 * growth/activity/errorTrends series come back as empty arrays — not a
 * fabricated single all-zero day (ADR-114). An empty array is what
 * `AdminAnalyticsPageContent`'s existing `isGlobalEmpty` check and each
 * chart's own empty state are built to recognize.
 *
 * GATED: requires the Firestore + Auth emulator. Skips itself when absent.
 */
import { describe, expect, it } from "vitest";

import { adminDb } from "@/lib/firebase-admin";
import { getAdminAnalytics } from "./analytics.service";

const RUN = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const d = RUN ? describe : describe.skip;

d("getAdminAnalytics — honest absent-data (T-114b)", () => {
    it("returns [] for growth/activity/errorTrends when analytics_daily has no documents", async () => {
        const existing = await adminDb.collection("analytics_daily").limit(1).get();
        expect(existing.empty).toBe(true); // nothing in this repo ever writes this collection

        const data = await getAdminAnalytics();

        expect(data.growth).toEqual([]);
        expect(data.activity).toEqual([]);
        expect(data.errorTrends).toEqual([]);
    });

    it("returns the real documents, unmodified, when analytics_daily is populated", async () => {
        const ref = adminDb.collection("analytics_daily").doc("2026-07-20");
        await ref.set({
            date: "2026-07-20",
            totalUsers: 10,
            newUsers: 2,
            activeUsers: 5,
            errors: 1,
        });

        try {
            const data = await getAdminAnalytics();

            expect(data.growth).toEqual([{ date: "2026-07-20", newUsers: 2, totalUsers: 10 }]);
            expect(data.activity).toEqual([{ date: "2026-07-20", dau: 5, wau: 0 }]);
            expect(data.errorTrends).toEqual([{ date: "2026-07-20", errors: 1 }]);
        } finally {
            await ref.delete().catch(() => {});
        }
    });
});
