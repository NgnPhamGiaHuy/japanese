/**
 * @file analytics-retention
 * Retention-curve chart data — split out of analytics.service.ts's
 * getAdminAnalytics (E11-T3).
 */
import type { QuerySnapshot } from "firebase-admin/firestore";
import type { RetentionPoint } from "../types";

/**
 * Builds day-0/1/7/30 retention rates from a sample of users (by lifespan =
 * lastSeenAt - createdAt), sorted by most recently active.
 */
export function buildRetentionData(usersSampleSnap: QuerySnapshot): RetentionPoint[] {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const lifespans = usersSampleSnap.docs.map((doc) => {
        const d = doc.data();
        const created = d.createdAt?.toDate ? d.createdAt.toDate().getTime() : now;
        const last = d.lastSeenAt?.toDate ? d.lastSeenAt.toDate().getTime() : now;
        return (last - created) / dayMs;
    });

    const getRetentionRate = (days: number) => {
        if (lifespans.length === 0) return 0;
        const retained = lifespans.filter((l) => l >= days).length;
        return Math.round((retained / lifespans.length) * 100);
    };

    return [
        { day: 0, rate: 100 },
        { day: 1, rate: getRetentionRate(1) },
        { day: 7, rate: getRetentionRate(7) },
        { day: 30, rate: getRetentionRate(30) },
    ];
}
