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

import type { AdminLog, AdminLogFilters, PaginatedLogs } from "../types";

/**
 * Server-side log fetch (dashboard, reports).
 */
export async function getLogs(
    filters: AdminLogFilters = {},
    limit = 50,
    startAfterId?: string | null,
): Promise<PaginatedLogs> {
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 200);

    let q = adminDb.collection(SYSTEM_LOGS_COLLECTION).orderBy("timestamp", "desc");

    // 2. Pagination Cursor
    if (startAfterId) {
        const cursor = await adminDb.collection(SYSTEM_LOGS_COLLECTION).doc(startAfterId).get();
        if (cursor.exists) {
            q = q.startAfter(cursor);
        }
    }

    // 3. Robust In-Memory Filtering Pool
    const poolSize = filters.level || filters.type || filters.search ? 1000 : safeLimit + 1;
    const snap = await q.limit(poolSize).get();

    let logs = snap.docs.map((d) =>
        systemLogToAdminView(
            firestoreDataToSystemRecord(d.id, d.data() as Record<string, unknown>),
        ),
    );

    // 4. In-Memory Filter Execution (Resilient to missing indexes)
    if (filters.level || filters.type || filters.search) {
        logs = applyLogFilters(logs, filters);
    }

    // 5. ENRICHMENT: Link with Users & Content
    const uids = Array.from(new Set(logs.map((l) => l.userId).filter(Boolean)));
    if (uids.length > 0) {
        try {
            const users = await adminAuth.getUsers(uids.map((uid) => ({ uid: uid! })));
            const userMap = new Map(users.users.map((u) => [u.uid, u]));

            logs.forEach((l) => {
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

    const hasNext = logs.length > safeLimit;
    const resultLogs = logs.slice(0, safeLimit);
    const nextPageToken = hasNext ? snap.docs[safeLimit - 1]?.id : null;

    return {
        logs: resultLogs,
        nextPageToken: nextPageToken || null,
    };
}

/**
 * Legacy-compatible writer — persists the canonical `system_logs` schema via Admin SDK.
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
