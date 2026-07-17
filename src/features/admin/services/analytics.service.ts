import "server-only";

import { adminDb, APP_ID } from "./admin.service";
import { DISCOVERY_LIMIT } from "./analytics-constants";
import { buildContentDistribution } from "./analytics-content";
import { buildEngagementData } from "./analytics-engagement";
import { buildLogCharts } from "./analytics-logs";
import { buildRetentionData } from "./analytics-retention";
import { getLogs } from "./log.service";
import { getAdminStats } from "./user.service";

import type { AnalyticsData } from "../types";

export {
    getContentBreakdown,
    getFeatureUsageDetails,
    getUsersByDate,
    getUsersByRole,
} from "./analytics-drilldowns";

/**
 * Fetches pre-aggregated analytics from the 'analytics_daily' collection,
 * plus the chart series computed by the analytics-* builder modules
 * (E11-T3 split — this file orchestrates; each builder owns one chart's
 * logic).
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

    // Distribution of roles - Dynamically derived from active stats
    const stats = await getAdminStats();
    const superAdmins = stats.activeSuperAdmins;
    const otherAdmins = stats.activeAdmins;
    const standardUsers = Math.max(0, stats.totalUsers - (superAdmins + otherAdmins));

    const rolesData = {
        Superadmin: superAdmins,
        Admin: otherAdmins,
        User: standardUsers,
    };

    // Content Analytics — sampled + scaled to platform totals.
    const lessonsSampleSnap = await adminDb.collectionGroup("lessons").limit(200).get();
    const lessonsSample = lessonsSampleSnap.docs.map((d) => d.data());
    const contentDistribution = buildContentDistribution(lessonsSample, stats.totalFlashcards);

    // Feature Engagement — Consolidated Discovery Pool (Sync with Drilldown)
    const [logsSnap, sessionsSnap] = await Promise.all([
        adminDb.collection("system_logs").orderBy("timestamp", "desc").limit(DISCOVERY_LIMIT).get(),
        adminDb
            .collection("artifacts")
            .doc(APP_ID)
            .collection("public")
            .doc("data")
            .collection("game_sessions")
            .orderBy("updatedAt", "desc")
            .limit(DISCOVERY_LIMIT)
            .get(),
    ]);
    const engagementData = buildEngagementData(logsSnap, sessionsSnap);

    // Retention Analytics — Sampling Discovery (Sync with User Cohorts)
    const usersSampleSnap = await adminDb
        .collection("artifacts")
        .doc(APP_ID)
        .collection("users")
        .orderBy("lastSeenAt", "desc")
        .limit(100)
        .get();
    const retentionData = buildRetentionData(usersSampleSnap);

    // Log-derived charts — reuses logsSnap already fetched above, zero extra reads.
    const { logVolume, logsByLevel, topActions } = buildLogCharts(logsSnap);

    return {
        growth: sorted.map((d) => ({
            date: d.date,
            newUsers: d.newUsers || 0,
            totalUsers: d.totalUsers || 0,
        })),
        activity: sorted.map((d) => ({
            date: d.date,
            dau: d.activeUsers || 0,
            wau: typeof d.wau === "number" ? d.wau : 0,
        })),
        engagement: engagementData,
        retention: retentionData,
        roles: Object.entries(rolesData).map(([name, value]) => ({ name, value: value as number })),
        content: contentDistribution,
        errorTrends: sorted.map((d) => ({
            date: d.date,
            errors: d.errors || 0,
        })),
        timeRange: "30d",
        logVolume,
        logsByLevel,
        topActions,
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
