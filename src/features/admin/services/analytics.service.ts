import "server-only";

import { adminDb } from "./admin.service";
import { getLogs } from "./log.service";
import { getAdminStats } from "./user.service";

import type { AnalyticsData } from "../types";

/**
 * Fetches pre-aggregated analytics from the 'analytics_daily' collection.
 */
export async function getAdminAnalytics(days = 30): Promise<AnalyticsData> {
    const snapshots = await adminDb
        .collection("analytics_daily")
        .orderBy("date", "desc")
        .limit(days)
        .get();

    const docs = snapshots.docs.map((d) => d.data());

    // In case no snapshots yet, provide a base structure
    const baseDocs =
        docs.length > 0
            ? docs
            : [
                  {
                      date: new Date().toISOString().split("T")[0],
                      totalUsers: 0,
                      newUsers: 0,
                      activeUsers: 0,
                      errors: 0,
                  },
              ];

    // Sort ascending for charts
    const sorted = [...baseDocs].sort((a, b) => a.date.localeCompare(b.date));

    // Distribution of roles (cached snapshot)
    const rolesSnap = await adminDb.collection("metadata").doc("roles_distribution").get();
    const rolesData = rolesSnap.data() || { Superadmin: 0, Admin: 0, User: 0 };

    return {
        growth: sorted.map((d) => ({
            date: d.date,
            newUsers: d.newUsers || 0,
            totalUsers: d.totalUsers || 0,
        })),
        activity: sorted.map((d) => ({
            date: d.date,
            dau: d.activeUsers || 0,
            wau: d.wau || 0,
        })),
        engagement: [
            { feature: "Flashcards", count: 450, percentage: 45 },
            { feature: "Kana", count: 320, percentage: 32 },
            { feature: "Matching", count: 230, percentage: 23 },
        ],
        retention: [
            { day: 0, rate: 100 },
            { day: 1, rate: 45 },
            { day: 7, rate: 18 },
            { day: 30, rate: 8 },
        ],
        roles: Object.entries(rolesData).map(([name, value]) => ({ name, value: value as number })),
        errorTrends: sorted.map((d) => ({
            date: d.date,
            errors: d.errors || 0,
        })),
        timeRange: "30d",
    };
}

/**
 * Fetches real-time snapshot for the operational dashboard.
 */
export async function getDashboardOverview() {
    const [stats, logsResult] = await Promise.all([
        getAdminStats(),
        getLogs({}, 10), // Get last 10 logs for activity feed
    ]);

    return {
        stats,
        recentActivity: logsResult.logs,
    };
}
