"use server";

import { cookies } from "next/headers";

import { z } from "zod";

import { notifySystemEvent } from "@/features/notifications/actions/notification.actions";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { toActionResult } from "@/lib/safe-action";
import { COOKIE_NAME } from "@/shared/utils/cookie";
import {
    adminActionClient,
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

/**
 * @file Admin Server Actions — migrated to next-safe-action.
 *
 * Every action runs through `adminActionClient` (features/admin/services/
 * admin.service.ts): its middleware resolves the caller from the `auth-token`
 * session cookie and enforces the permission declared via `.metadata()`
 * BEFORE the action body ever runs — no action here calls `verifyIdToken` or
 * checks a permission by hand. The exported functions keep the pre-migration
 * `Promise<{ok:true,data}|{ok:false,error}>` calling contract (via
 * `toActionResult`) so every existing call site is unaffected.
 */

async function getAuthToken(): Promise<string> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) throw new Error("UNAUTHORIZED: Session token missing");
    return token;
}

export async function fetchUsersAction(pageToken?: string, pageSize = 25) {
    const result = await adminActionClient
        .metadata({ permission: "canManageUsers" })
        .inputSchema(
            z.object({ pageToken: z.string().optional(), pageSize: z.number().int().positive() }),
        )
        .action(async ({ parsedInput }) =>
            getUsersPaginated(parsedInput.pageToken, parsedInput.pageSize),
        )({ pageToken, pageSize });
    return toActionResult(result);
}

export async function fetchAdminStatsAction() {
    const result = await adminActionClient
        .metadata({ permission: "canViewDashboard" })
        .action(async () => getAdminStats())();
    return toActionResult(result);
}

export async function setAdminRoleAction(targetUid: string, grant: boolean) {
    const result = await adminActionClient
        .metadata({ permission: "canPromoteUsers" })
        .inputSchema(z.object({ targetUid: z.string().min(1), grant: z.boolean() }))
        .action(async ({ parsedInput, ctx }) => {
            await setAdminRole(parsedInput.targetUid, parsedInput.grant, ctx.uid);
            const token = await getAuthToken();
            void logAdminAction(
                token,
                ctx.uid,
                parsedInput.grant
                    ? ActivityAction.ADMIN_ROLE_GRANTED
                    : ActivityAction.ADMIN_ROLE_REVOKED,
                "ADMIN_ACTION",
                { targetUid: parsedInput.targetUid, grant: parsedInput.grant, role: ctx.role },
            );
            return { uid: parsedInput.targetUid, isAdmin: parsedInput.grant };
        })({ targetUid, grant });
    return toActionResult(result);
}

export async function deleteUserAction(targetUid: string) {
    const result = await adminActionClient
        .metadata({ permission: "canDeleteUsers" })
        .inputSchema(z.object({ targetUid: z.string().min(1) }))
        .action(async ({ parsedInput, ctx }) => {
            await deleteUser(parsedInput.targetUid, ctx.uid);
            const token = await getAuthToken();
            void logAdminAction(token, ctx.uid, ActivityAction.ADMIN_USER_DELETED, "ADMIN_ACTION", {
                targetUid: parsedInput.targetUid,
                role: ctx.role,
            });
            return { uid: parsedInput.targetUid };
        })({ targetUid });
    return toActionResult(result);
}

export async function fetchAnalyticsAction() {
    const result = await adminActionClient
        .metadata({ permission: "canViewAnalytics" })
        .action(async () => getAdminAnalytics())();
    return toActionResult(result);
}

export async function fetchLogsAction(
    filters: Parameters<typeof getLogs>[0],
    startAfterDocId?: string | null,
) {
    const result = await adminActionClient
        .metadata({ permission: "canViewReports" })
        .inputSchema(
            z.object({
                filters: z.custom<Parameters<typeof getLogs>[0]>(),
                startAfterDocId: z.string().nullish(),
            }),
        )
        .action(async ({ parsedInput }) =>
            getLogs(parsedInput.filters, 20, parsedInput.startAfterDocId),
        )({ filters, startAfterDocId });
    return toActionResult(result);
}

export async function createTestLogAction() {
    const result = await adminActionClient
        .metadata({ permission: "canViewReports" })
        .action(async ({ ctx }) => {
            const token = await getAuthToken();
            void logAdminAction(token, ctx.uid, ActivityAction.ADMIN_TEST_LOG, "ADMIN_ACTION", {
                triggeredBy: ctx.role,
                environment: process.env.NODE_ENV,
            });
            return true;
        })();
    return toActionResult(result);
}

export async function fetchDashboardOverviewAction() {
    const result = await adminActionClient
        .metadata({ permission: "canViewDashboard" })
        .action(async () => getDashboardOverview())();
    return toActionResult(result);
}

export async function fetchDeckCardsAction(path: string) {
    const result = await adminActionClient
        .metadata({ permission: "canManageContent" })
        .inputSchema(z.object({ path: z.string().min(1) }))
        .action(async ({ parsedInput }) => getDeckCards(parsedInput.path))({ path });
    return toActionResult(result);
}

export async function fetchGlobalContentAction(limit = 50) {
    const result = await adminActionClient
        .metadata({ permission: "canManageContent" })
        .inputSchema(z.object({ limit: z.number().int().positive() }))
        .action(async ({ parsedInput }) => getGlobalContentPaginated(parsedInput.limit))({ limit });
    return toActionResult(result);
}

export async function deleteGlobalFlashcardAction(path: string) {
    const result = await adminActionClient
        .metadata({ permission: "canManageContent" })
        .inputSchema(z.object({ path: z.string().min(1) }))
        .action(async ({ parsedInput, ctx }) => {
            const token = await getAuthToken();
            const { ownerId, lessonId, title } = await deleteGlobalFlashcard(parsedInput.path);
            void logAdminAction(
                token,
                ctx.uid,
                ActivityAction.ADMIN_CONTENT_DELETED,
                "ADMIN_ACTION",
                {
                    path: parsedInput.path,
                    role: ctx.role,
                },
            );
            // Notify the deck owner their content was removed (server-internal,
            // never blocks the delete).
            void notifySystemEvent({
                kind: "content_removed",
                recipientId: ownerId,
                lessonId,
                lessonTitle: title,
            });
        })({ path });
    return toActionResult(result);
}

/**
 * Only action with a caller-choice auth path: an explicit token (checked at
 * app boot, before an `auth-token` cookie necessarily exists yet) or the
 * cookie session. Left on `assertPermissionFromToken`/`assertAdminAction`
 * directly rather than `adminActionClient` — its whole point is running
 * *before* the cookie-based path is guaranteed available.
 */
export async function fetchAdminRoleAction(idToken?: string) {
    try {
        const caller = idToken
            ? await assertPermissionFromToken(idToken, "canViewDashboard")
            : await assertAdminAction("canViewDashboard");
        return { ok: true as const, data: { role: caller.role } };
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        return { ok: false as const, error: message };
    }
}

export async function fetchDrilldownUsersAction(filter: { date?: string; role?: string }) {
    const result = await adminActionClient
        .metadata({ permission: "canViewAnalytics" })
        .inputSchema(z.object({ date: z.string().optional(), role: z.string().optional() }))
        .action(async ({ parsedInput }) => {
            if (parsedInput.date) return getUsersByDate(parsedInput.date);
            if (parsedInput.role) return getUsersByRole(parsedInput.role);
            return [];
        })(filter);
    return toActionResult(result);
}

export async function fetchDrilldownFeatureAction(feature: string) {
    const result = await adminActionClient
        .metadata({ permission: "canViewAnalytics" })
        .inputSchema(z.object({ feature: z.string().min(1) }))
        .action(async ({ parsedInput }) => getFeatureUsageDetails(parsedInput.feature))({
        feature,
    });
    return toActionResult(result);
}

export async function fetchDrilldownContentAction(category: string) {
    const result = await adminActionClient
        .metadata({ permission: "canViewAnalytics" })
        .inputSchema(z.object({ category: z.string().min(1) }))
        .action(async ({ parsedInput }) => getContentBreakdown(parsedInput.category))({ category });
    return toActionResult(result);
}

export async function fetchDrilldownLogsAction(filter: {
    type?: string;
    level?: string;
    action?: string;
}) {
    const result = await adminActionClient
        .metadata({ permission: "canViewReports" })
        .inputSchema(
            z.object({
                type: z.string().optional(),
                level: z.string().optional(),
                action: z.string().optional(),
            }),
        )
        .action(async ({ parsedInput }) => getLogsDrilldown(parsedInput))(filter);
    return toActionResult(result);
}

export async function exportAnalyticsAction() {
    const result = await adminActionClient
        .metadata({ permission: "canViewAnalytics" })
        .action(async () => {
            const snapshots = await adminDb
                .collection("analytics_daily")
                .orderBy("date", "desc")
                .limit(100)
                .get();

            const docs = snapshots.docs.map((d) => d.data());
            if (docs.length > 0) return docs;

            const stats = await getAdminStats();
            const today = new Date().toISOString().split("T")[0];
            return [
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
            ];
        })();
    return toActionResult(result);
}

export async function exportUsersDatasetAction() {
    const result = await adminActionClient
        .metadata({ permission: "canViewAnalytics" })
        .action(async () => {
            const snap = await adminDb
                .collection("artifacts")
                .doc(APP_ID)
                .collection("users")
                .limit(1000)
                .get();

            return snap.docs.map((d) => ({
                uid: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate
                    ? d.data().createdAt.toDate().toISOString()
                    : d.data().createdAt,
                lastSeenAt: d.data().lastSeenAt?.toDate
                    ? d.data().lastSeenAt.toDate().toISOString()
                    : d.data().lastSeenAt,
            }));
        })();
    return toActionResult(result);
}

export async function exportContentDatasetAction() {
    const result = await adminActionClient
        .metadata({ permission: "canViewAnalytics" })
        .action(async () => {
            const snap = await adminDb.collectionGroup("lessons").limit(1000).get();

            return snap.docs.map((d) => {
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
            });
        })();
    return toActionResult(result);
}

export async function exportLogsDatasetAction() {
    const result = await adminActionClient
        .metadata({ permission: "canViewAnalytics" })
        .action(async () => {
            const snap = await adminDb
                .collection("system_logs")
                .orderBy("timestamp", "desc")
                .limit(1000)
                .get();

            return snap.docs.map((d) => {
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
            });
        })();
    return toActionResult(result);
}
