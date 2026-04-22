import type { AdminLog, AdminLogFilters, LogLevel, LogType } from "../types";

export const LOG_LEVEL_OPTIONS: LogLevel[] = ["info", "warn", "error", "security"];
export const LOG_TYPE_OPTIONS: LogType[] = [
    "AUTH",
    "ADMIN_ACTION",
    "USER_ACTION",
    "CONTENT",
    "SYSTEM",
    "ERROR",
];

/**
 * Shared filtering logic for system logs.
 * Used by both the server-side Service and client-side Hook.
 */
export function applyLogFilters(logs: AdminLog[], filters: AdminLogFilters): AdminLog[] {
    let out = logs;

    if (filters.level) {
        out = out.filter((l) => l.level === filters.level);
    }
    if (filters.type) {
        out = out.filter((l) => l.type === filters.type);
    }
    if (filters.userId) {
        const uid = filters.userId.toLowerCase();
        out = out.filter(
            (l) =>
                l.userId?.toLowerCase().includes(uid) ||
                l.userEmail?.toLowerCase().includes(uid) ||
                l.userName?.toLowerCase().includes(uid),
        );
    }
    if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        out = out.filter((l) => (l.timestampMs ?? new Date(l.timestamp).getTime()) >= start);
    }
    if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        out = out.filter((l) => (l.timestampMs ?? new Date(l.timestamp).getTime()) <= end);
    }
    if (filters.search) {
        const s = filters.search.toLowerCase();
        out = out.filter((log) => {
            const haystack = [
                log.action,
                log.userName,
                log.userEmail,
                log.userId,
                log.type,
                log.level,
                log.entityType,
                log.entityId,
                log.source,
                JSON.stringify(log.metadata ?? {}),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(s);
        });
    }

    return out;
}
