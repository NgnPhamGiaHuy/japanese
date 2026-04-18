import "server-only";

import {
    firestoreDataToSystemRecord,
    logTypeToEntityType,
    SYSTEM_LOGS_COLLECTION,
    systemLogToAdminView,
} from "@/lib/logging";
import { persistSystemLog } from "@/lib/logging/server";
import { adminDb } from "./admin.service";
import { applyLogFilters } from "../utils/filters";

import type { AdminLog, AdminLogFilters, PaginatedLogs } from "../types";

export async function ensureLogsSeeded(): Promise<void> {
    const existing = await adminDb.collection(SYSTEM_LOGS_COLLECTION).limit(1).get();
    if (!existing.empty) return;

    await persistSystemLog({
        userId: "system",
        action: "System logging initialized",
        entityType: "system",
        metadata: {
            userName: "System",
            userEmail: "system@local",
            logType: "SYSTEM",
            seed: true,
            createdAt: new Date().toISOString(),
        },
        level: "info",
        source: "server",
    });
}

/**
 * Server-side log fetch (dashboard, exports). Prefer the real-time client hook for the Reports UI.
 * Pagination cursors refer to raw Firestore document order; in-memory filters may shorten pages.
 */
export async function getLogs(
    filters: AdminLogFilters = {},
    limit = 50,
    startAfterDocId?: string | null,
): Promise<PaginatedLogs> {
    const isUnfiltered =
        !filters.level &&
        !filters.type &&
        !filters.search &&
        !filters.startDate &&
        !filters.endDate &&
        !startAfterDocId;
    if (isUnfiltered) {
        await ensureLogsSeeded();
    }

    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 200);
    const overfetch = Math.min(600, Math.max(safeLimit * 5, 120));

    let q = adminDb.collection(SYSTEM_LOGS_COLLECTION).orderBy("timestamp", "desc");
    if (startAfterDocId) {
        const cursor = await adminDb.collection(SYSTEM_LOGS_COLLECTION).doc(startAfterDocId).get();
        if (cursor.exists) {
            q = q.startAfter(cursor);
        }
    }

    const snap = await q.limit(overfetch).get();
    const mapped = snap.docs.map((d) =>
        systemLogToAdminView(
            firestoreDataToSystemRecord(d.id, d.data() as Record<string, unknown>),
        ),
    );
    const filtered = applyLogFilters(mapped, filters);
    const hasNext = filtered.length > safeLimit || snap.docs.length === overfetch;
    const logs = filtered.slice(0, safeLimit);
    const lastRaw = snap.docs[snap.docs.length - 1];

    return {
        logs,
        nextPageToken: hasNext && lastRaw ? lastRaw.id : null,
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
