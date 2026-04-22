"use server";

import { cookies } from "next/headers";

import { ActivityAction } from "@/lib/logging/actions.enum";
import {
    adminDb,
    APP_ID,
    assertAdminAction,
    assertPermissionFromToken,
} from "../services/admin.service";
import {
    getAdminAnalytics,
    getContentBreakdown,
    getDashboardOverview,
    getFeatureUsageDetails,
    getUsersByDate,
    getUsersByRole,
} from "../services/analytics.service";
import {
    deleteGlobalFlashcard,
    getDeckCards,
    getGlobalContentPaginated,
} from "../services/content.service";
import { getLogs, getLogsDrilldown, logAdminAction } from "../services/log.service";
import {
    deleteUser,
    getAdminStats,
    getUsersPaginated,
    setAdminRole,
} from "../services/user.service";

import type {
    AdminLogFilters,
    AdminStats,
    AnalyticsData,
    PaginatedContent,
    PaginatedLogs,
    PaginatedUsers,
} from "../types";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function ok<T>(data: T): ActionResult<T> {
    return { ok: true, data };
}

function fail(err: unknown): ActionResult<never> {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { ok: false, error: message };
}

async function getAuthToken(): Promise<string> {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) throw new Error("UNAUTHORIZED: Session token missing");
    return token;
}

export async function fetchUsersAction(
    pageToken?: string,
    pageSize = 25,
): Promise<ActionResult<PaginatedUsers>> {
    try {
        await assertAdminAction("canManageUsers");
        return ok(await getUsersPaginated(pageToken, pageSize));
    } catch (err) {
        return fail(err);
    }
}

export async function fetchAdminStatsAction(): Promise<ActionResult<AdminStats>> {
    try {
        await assertAdminAction("canViewDashboard");
        return ok(await getAdminStats());
    } catch (err) {
        return fail(err);
    }
}

export async function setAdminRoleAction(
    targetUid: string,
    grant: boolean,
): Promise<ActionResult<{ uid: string; isAdmin: boolean }>> {
    try {
        const { uid, role } = await assertAdminAction("canPromoteUsers");
        const token = await getAuthToken();
        await setAdminRole(targetUid, grant, uid);
        void logAdminAction(
            token,
            uid,
            grant ? ActivityAction.ADMIN_ROLE_GRANTED : ActivityAction.ADMIN_ROLE_REVOKED,
            "ADMIN_ACTION",
            { targetUid, grant, role },
        );
        return ok({ uid: targetUid, isAdmin: grant });
    } catch (err) {
        return fail(err);
    }
}

export async function deleteUserAction(targetUid: string): Promise<ActionResult<{ uid: string }>> {
    try {
        const { uid, role } = await assertAdminAction("canDeleteUsers");
        const token = await getAuthToken();
        await deleteUser(targetUid, uid);
        void logAdminAction(token, uid, ActivityAction.ADMIN_USER_DELETED, "ADMIN_ACTION", {
            targetUid,
            role,
        });
        return ok({ uid: targetUid });
    } catch (err) {
        return fail(err);
    }
}

export async function fetchAnalyticsAction(): Promise<ActionResult<AnalyticsData>> {
    try {
        await assertAdminAction("canViewAnalytics");
        return ok(await getAdminAnalytics());
    } catch (err) {
        return fail(err);
    }
}

export async function fetchLogsAction(
    filters: AdminLogFilters,
    startAfterDocId?: string | null,
): Promise<ActionResult<PaginatedLogs>> {
    try {
        await assertAdminAction("canViewReports");
        return ok(await getLogs(filters, 20, startAfterDocId));
    } catch (err) {
        return fail(err);
    }
}

export async function createTestLogAction() {
    try {
        const { uid, role } = await assertAdminAction("canViewReports");
        const token = await getAuthToken();
        void logAdminAction(token, uid, ActivityAction.ADMIN_TEST_LOG, "ADMIN_ACTION", {
            triggeredBy: role,
            environment: process.env.NODE_ENV,
        });
        return ok(true);
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDashboardOverviewAction() {
    try {
        await assertAdminAction("canViewDashboard");
        return ok(await getDashboardOverview());
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDeckCardsAction(path: string): Promise<ActionResult<any[]>> {
    try {
        await assertAdminAction("canManageContent");
        return ok(await getDeckCards(path));
    } catch (err) {
        return fail(err);
    }
}

export async function fetchGlobalContentAction(
    limit = 50,
): Promise<ActionResult<PaginatedContent>> {
    try {
        await assertAdminAction("canManageContent");
        return ok(await getGlobalContentPaginated(limit));
    } catch (err) {
        return fail(err);
    }
}

export async function deleteGlobalFlashcardAction(path: string): Promise<ActionResult<void>> {
    try {
        const { uid, role } = await assertAdminAction("canManageContent");
        const token = await getAuthToken();
        await deleteGlobalFlashcard(path);
        void logAdminAction(token, uid, ActivityAction.ADMIN_CONTENT_DELETED, "ADMIN_ACTION", {
            path,
            role,
        });
        return ok(undefined);
    } catch (err) {
        return fail(err);
    }
}

export async function fetchAdminRoleAction(
    idToken?: string,
): Promise<ActionResult<{ role: "admin" | "superadmin" }>> {
    try {
        const caller = idToken
            ? await assertPermissionFromToken(idToken, "canViewDashboard")
            : await assertAdminAction("canViewDashboard");
        return ok({ role: caller.role });
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDrilldownUsersAction(filter: { date?: string; role?: string }) {
    try {
        await assertAdminAction("canViewAnalytics");
        if (filter.date) return ok(await getUsersByDate(filter.date));
        if (filter.role) return ok(await getUsersByRole(filter.role));
        return ok([]);
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDrilldownFeatureAction(feature: string) {
    try {
        await assertAdminAction("canViewAnalytics");
        return ok(await getFeatureUsageDetails(feature));
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDrilldownContentAction(category: string) {
    try {
        await assertAdminAction("canViewAnalytics");
        return ok(await getContentBreakdown(category));
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDrilldownLogsAction(filter: {
    type?: string;
    level?: string;
    action?: string;
}) {
    try {
        await assertAdminAction("canViewReports");
        return ok(await getLogsDrilldown(filter));
    } catch (err) {
        return fail(err);
    }
}

export async function exportAnalyticsAction(): Promise<ActionResult<any[]>> {
    try {
        await assertAdminAction("canViewAnalytics");

        const snapshots = await adminDb
            .collection("analytics_daily")
            .orderBy("date", "desc")
            .limit(100)
            .get();

        const docs = snapshots.docs.map((d) => d.data());

        if (docs.length === 0) {
            const stats = await getAdminStats();
            const today = new Date().toISOString().split("T")[0];
            return ok([
                {
                    date: today,
                    totalUsers: stats.totalUsers,
                    newUsers: 0,
                    activeUsers: stats.activeUsersToday,
                    sessions: stats.totalSessions,
                    errors: Math.round(stats.totalSessions * (stats.errorRate / 100)),
                    flashcardsCreated: stats.totalFlashcards,
                    featureUsage: { flashcards: 0, kana: 0, matching: 0 },
                },
            ]);
        }

        return ok(docs);
    } catch (err) {
        return fail(err);
    }
}

export async function exportUsersDatasetAction(): Promise<ActionResult<any[]>> {
    try {
        await assertAdminAction("canViewAnalytics");
        const snap = await adminDb
            .collection("artifacts")
            .doc(APP_ID)
            .collection("users")
            .limit(1000)
            .get();

        return ok(
            snap.docs.map((d) => ({
                uid: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate
                    ? d.data().createdAt.toDate().toISOString()
                    : d.data().createdAt,
                lastSeenAt: d.data().lastSeenAt?.toDate
                    ? d.data().lastSeenAt.toDate().toISOString()
                    : d.data().lastSeenAt,
            })),
        );
    } catch (err) {
        return fail(err);
    }
}

export async function exportContentDatasetAction(): Promise<ActionResult<any[]>> {
    try {
        await assertAdminAction("canViewAnalytics");
        const snap = await adminDb.collectionGroup("lessons").limit(1000).get();

        return ok(
            snap.docs.map((d) => {
                const data = d.data();
                return {
                    lessonId: d.id,
                    ownerId: d.ref.parent.parent?.id,
                    title: data.title,
                    category: (data.categories || [])[0] || "uncategorized",
                    cardCount: data.cardCount || 0,
                    isShared: !!data.sharedAt,
                    createdAt: data.createdAt?.toDate
                        ? data.createdAt.toDate().toISOString()
                        : data.createdAt,
                };
            }),
        );
    } catch (err) {
        return fail(err);
    }
}

export async function exportLogsDatasetAction(): Promise<ActionResult<any[]>> {
    try {
        await assertAdminAction("canViewAnalytics");
        const snap = await adminDb
            .collection("system_logs")
            .orderBy("timestamp", "desc")
            .limit(1000)
            .get();

        return ok(
            snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    timestamp: data.timestamp?.toDate
                        ? data.timestamp.toDate().toISOString()
                        : data.timestamp,
                    userId: data.userId || "system",
                    action: data.action,
                    level: data.level,
                    ...(typeof data.metadata === "object"
                        ? data.metadata
                        : { rawMetadata: data.metadata }),
                };
            }),
        );
    } catch (err) {
        return fail(err);
    }
}
