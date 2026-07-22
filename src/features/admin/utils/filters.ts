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
 * Filtering logic for system logs (server-invoked). Kept in its own
 * server-agnostic module — not inlined into `log.service.ts` — so a future
 * client-side call path (e.g. a client-driven re-filter of an already-
 * fetched page) can share the exact same predicate rather than
 * reimplementing it, without needing to reach into a `"server-only"` file
 * to do so. Its sole caller today is `log.service.ts`'s `getLogs` (T-111a
 * re-verified: no client-side call site exists yet).
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
