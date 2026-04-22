import "server-only";

import {
    firestoreDataToSystemRecord,
    logTypeToEntityType,
    SYSTEM_LOGS_COLLECTION,
    systemLogToAdminView,
} from "@/lib/logging";
import { persistSystemLog } from "@/lib/logging/server";
import { adminAuth, adminDb } from "./admin.service";
import { applyLogFilters } from "../utils/filters";

import type { AdminLog, AdminLogFilters, LogType, PaginatedLogs } from "../types";

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Server-side log fetch (dashboard, reports).
 *
 * Pagination note: when filters are active we pull a larger pool and filter
 * in-memory (resilient to missing Firestore composite indexes). The cursor
 * is always anchored to the last document in the *unfiltered* snapshot so
 * subsequent pages are stable.
 */
export async function getLogs(
    filters: AdminLogFilters = {},
    limit = 20,
    startAfterId?: string | null,
): Promise<PaginatedLogs> {
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
    const hasFilters =
        !!filters.level ||
        !!filters.type ||
        !!filters.search ||
        !!filters.userId ||
        !!filters.startDate ||
        !!filters.endDate;

    let q = adminDb.collection(SYSTEM_LOGS_COLLECTION).orderBy("timestamp", "desc");

    if (startAfterId) {
        const cursor = await adminDb.collection(SYSTEM_LOGS_COLLECTION).doc(startAfterId).get();
        if (cursor.exists) q = q.startAfter(cursor);
    }

    // Fetch one extra doc beyond the page size so we can detect whether a next page exists.
    // When filters are active we pull a larger pool to ensure a full page survives filtering.
    const poolSize = hasFilters ? Math.max(safeLimit * 10, 200) : safeLimit + 1;
    const snap = await q.limit(poolSize).get();

    let mapped = snap.docs.map((d) =>
        systemLogToAdminView(
            firestoreDataToSystemRecord(d.id, d.data() as Record<string, unknown>),
        ),
    );

    if (hasFilters) {
        mapped = applyLogFilters(mapped, filters);
    }

    // Enrich with Firebase Auth user data
    const uids = Array.from(new Set(mapped.map((l) => l.userId).filter(Boolean)));
    if (uids.length > 0) {
        try {
            const users = await adminAuth.getUsers(uids.map((uid) => ({ uid: uid! })));
            const userMap = new Map(users.users.map((u) => [u.uid, u]));
            mapped.forEach((l) => {
                const u = l.userId ? userMap.get(l.userId) : null;
                if (u) {
                    l.userName = u.displayName || u.email?.split("@")[0] || "User";
                    l.userEmail = u.email || "";
                }
            });
        } catch (e) {
            console.warn("[getLogs] Enrichment failed:", e);
        }
    }

    // The (safeLimit + 1)th item is the sentinel — it tells us a next page exists
    // but is never returned to the client.
    const hasNext = mapped.length > safeLimit;
    const resultLogs = mapped.slice(0, safeLimit);

    // Cursor = the Firestore doc ID of the last item we're actually returning.
    // On the next call, startAfter(that doc) gives the correct next page.
    const lastReturnedId = resultLogs[resultLogs.length - 1]?.id ?? null;
    const nextPageToken = hasNext ? lastReturnedId : null;

    return {
        logs: resultLogs,
        nextPageToken,
    };
}

/**
 * Drilldown fetch for log-derived charts.
 * Returns rows shaped for AnalyticsDetailModal.
 */
export async function getLogsDrilldown(filter: {
    type?: string;
    level?: string;
    action?: string;
}): Promise<object[]> {
    const filters: AdminLogFilters = {};
    if (filter.type) filters.type = filter.type as AdminLogFilters["type"];
    if (filter.level) filters.level = filter.level as AdminLogFilters["level"];
    if (filter.action) filters.search = filter.action;

    const { logs } = await getLogs(filters, 50);

    return logs.map((l) => ({
        id: l.id,
        displayName: l.userName || "System",
        userName: l.userName || "System",
        email: l.userEmail || l.userId || "—",
        action: l.action,
        timestamp: l.timestamp,
        level: l.level,
        metadata: l.metadata,
    }));
}

/**
 * Low-level writer — persists the canonical `system_logs` schema via Admin SDK.
 * Accepts the legacy `AdminLog` shape for backward compatibility.
 */
export async function recordLog(log: Omit<AdminLog, "id" | "timestamp">): Promise<string> {
    if (!log.action || !log.type || !log.level || !log.userId) {
        throw new Error("BAD_REQUEST: Invalid log payload");
    }

    const canonicalLevel =
        log.level === "security"
            ? "warn"
            : log.level === "error"
              ? "error"
              : log.level === "warn"
                ? "warn"
                : "info";

    const metadata: Record<string, unknown> = {
        ...(log.metadata ?? {}),
        userName: log.userName,
        userEmail: log.userEmail,
        logType: log.type,
        ...(log.level === "security" ? { security: true } : {}),
        ...(log.ip ? { ip: log.ip } : {}),
        ...(log.userAgent ? { userAgent: log.userAgent } : {}),
    };

    const entityIdFromMeta =
        typeof metadata.entityId === "string"
            ? metadata.entityId
            : typeof metadata.resourceId === "string"
              ? metadata.resourceId
              : undefined;

    return persistSystemLog({
        userId: log.userId,
        action: log.action,
        entityType: logTypeToEntityType(log.type),
        entityId: log.entityId ?? entityIdFromMeta,
        metadata,
        level: canonicalLevel,
        source: "server",
    });
}

/**
 * Convenience writer for admin actions — resolves caller identity from the
 * idToken so callers don't need to re-decode the token themselves.
 */
export async function logAdminAction(
    idToken: string,
    callerUid: string,
    action: string,
    type: LogType,
    metadata: Record<string, unknown> = {},
): Promise<void> {
    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        await recordLog({
            action,
            level: "info",
            type,
            userId: callerUid,
            userName: typeof decoded.name === "string" && decoded.name ? decoded.name : "Admin",
            userEmail: typeof decoded.email === "string" ? decoded.email : "—",
            metadata,
        });
    } catch {
        // Logging must never block the primary action
    }
}
