"use server";

import { adminAuth } from "@/lib/firebase-admin";
import { assertPermissionFromToken } from "../services/admin.service";
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
import { getLogs, recordLog } from "../services/log.service";
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

export async function fetchUsersAction(
    idToken: string,
    pageToken?: string,
    pageSize = 25,
): Promise<ActionResult<PaginatedUsers>> {
    try {
        await assertPermissionFromToken(idToken, "canManageUsers");
        return ok(await getUsersPaginated(pageToken, pageSize));
    } catch (err) {
        return fail(err);
    }
}

export async function fetchAdminStatsAction(idToken: string): Promise<ActionResult<AdminStats>> {
    try {
        await assertPermissionFromToken(idToken, "canViewDashboard");
        return ok(await getAdminStats());
    } catch (err) {
        return fail(err);
    }
}

export async function setAdminRoleAction(
    idToken: string,
    targetUid: string,
    grant: boolean,
): Promise<ActionResult<{ uid: string; isAdmin: boolean }>> {
    try {
        const { uid, role } = await assertPermissionFromToken(idToken, "canPromoteUsers");
        const decoded = await adminAuth.verifyIdToken(idToken);
        await setAdminRole(targetUid, grant, uid);
        await recordLog({
            action: grant ? "Granted admin role" : "Revoked admin role",
            level: "info",
            type: "ADMIN_ACTION",
            userId: uid,
            userName: typeof decoded.name === "string" && decoded.name ? decoded.name : "Admin",
            userEmail: typeof decoded.email === "string" ? decoded.email : "—",
            metadata: { targetUid, grant, role },
        });
        return ok({ uid: targetUid, isAdmin: grant });
    } catch (err) {
        return fail(err);
    }
}

export async function deleteUserAction(
    idToken: string,
    targetUid: string,
): Promise<ActionResult<{ uid: string }>> {
    try {
        const { uid, role } = await assertPermissionFromToken(idToken, "canDeleteUsers");
        const decoded = await adminAuth.verifyIdToken(idToken);
        await deleteUser(targetUid, uid);
        await recordLog({
            action: "Deleted user account",
            level: "warn",
            type: "ADMIN_ACTION",
            userId: uid,
            userName: typeof decoded.name === "string" && decoded.name ? decoded.name : "Admin",
            userEmail: typeof decoded.email === "string" ? decoded.email : "—",
            metadata: { targetUid, role },
        });
        return ok({ uid: targetUid });
    } catch (err) {
        return fail(err);
    }
}

export async function fetchAnalyticsAction(idToken: string): Promise<ActionResult<AnalyticsData>> {
    try {
        await assertPermissionFromToken(idToken, "canViewAnalytics");
        return ok(await getAdminAnalytics());
    } catch (err) {
        return fail(err);
    }
}

export async function fetchLogsAction(
    idToken: string,
    filters: AdminLogFilters,
    startAfterDocId?: string | null,
): Promise<ActionResult<PaginatedLogs>> {
    try {
        await assertPermissionFromToken(idToken, "canViewReports");
        return ok(await getLogs(filters, 100, startAfterDocId));
    } catch (err) {
        return fail(err);
    }
}

export async function createTestLogAction(idToken: string) {
    try {
        const { uid, role } = await assertPermissionFromToken(idToken, "canViewReports");
        const decoded = await adminAuth.verifyIdToken(idToken);
        await recordLog({
            action: "Manual Test Log Triggered",
            level: "info",
            type: "ADMIN_ACTION",
            userId: uid,
            userName: typeof decoded.name === "string" && decoded.name ? decoded.name : "Admin",
            userEmail: typeof decoded.email === "string" ? decoded.email : "—",
            metadata: {
                triggeredBy: role,
                environment: process.env.NODE_ENV,
            },
        });
        return ok(true);
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDashboardOverviewAction(idToken: string) {
    try {
        await assertPermissionFromToken(idToken, "canViewDashboard");
        return ok(await getDashboardOverview());
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDeckCardsAction(
    idToken: string,
    path: string,
): Promise<ActionResult<any[]>> {
    try {
        await assertPermissionFromToken(idToken, "canManageContent");
        return ok(await getDeckCards(path));
    } catch (err) {
        return fail(err);
    }
}

export async function fetchGlobalContentAction(
    idToken: string,
    limit = 50,
): Promise<ActionResult<PaginatedContent>> {
    try {
        await assertPermissionFromToken(idToken, "canManageContent");
        return ok(await getGlobalContentPaginated(limit));
    } catch (err) {
        return fail(err);
    }
}

export async function deleteGlobalFlashcardAction(
    idToken: string,
    path: string,
): Promise<ActionResult<void>> {
    try {
        const { uid, role } = await assertPermissionFromToken(idToken, "canManageContent");
        const decoded = await adminAuth.verifyIdToken(idToken);
        await deleteGlobalFlashcard(path);

        await recordLog({
            action: "Global Flashcard Deleted",
            level: "warn",
            type: "ADMIN_ACTION",
            userId: uid,
            userName: typeof decoded.name === "string" && decoded.name ? decoded.name : "Admin",
            userEmail: typeof decoded.email === "string" ? decoded.email : "—",
            metadata: { path, role },
        });

        return ok(undefined);
    } catch (err) {
        return fail(err);
    }
}

export async function fetchAdminRoleAction(
    idToken: string,
): Promise<ActionResult<{ role: "admin" | "superadmin" }>> {
    try {
        const caller = await assertPermissionFromToken(idToken, "canViewDashboard");
        return ok({ role: caller.role });
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDrilldownUsersAction(
    idToken: string,
    filter: { date?: string; role?: string },
) {
    try {
        await assertPermissionFromToken(idToken, "canViewAnalytics");
        if (filter.date) return ok(await getUsersByDate(filter.date));
        if (filter.role) return ok(await getUsersByRole(filter.role));
        return ok([]);
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDrilldownFeatureAction(idToken: string, feature: string) {
    try {
        await assertPermissionFromToken(idToken, "canViewAnalytics");
        return ok(await getFeatureUsageDetails(feature));
    } catch (err) {
        return fail(err);
    }
}

export async function fetchDrilldownContentAction(idToken: string, category: string) {
    try {
        await assertPermissionFromToken(idToken, "canViewAnalytics");
        return ok(await getContentBreakdown(category));
    } catch (err) {
        return fail(err);
    }
}
