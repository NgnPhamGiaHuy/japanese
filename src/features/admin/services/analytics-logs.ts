/**
 * @file analytics-logs
 * Log-derived charts (volume over time, by level, top actions) — split out
 * of analytics.service.ts's getAdminAnalytics (E11-T3). Reuses the
 * system_logs snapshot getAdminAnalytics already fetched for engagement —
 * zero extra Firestore reads.
 */
import type { QuerySnapshot } from "firebase-admin/firestore";
import type { LogLevelPoint, LogVolumePoint, TopActionPoint } from "../types";

const LOG_TYPES_LIST = ["AUTH", "ADMIN_ACTION", "USER_ACTION", "CONTENT", "SYSTEM", "ERROR"];
const ENTITY_TO_LOG_TYPE_MAP: Record<string, string> = {
    auth: "AUTH",
    authentication: "AUTH",
    user: "AUTH",
    admin: "ADMIN_ACTION",
    admin_action: "ADMIN_ACTION",
    deck: "USER_ACTION",
    card: "USER_ACTION",
    study: "USER_ACTION",
    share: "USER_ACTION",
    user_action: "USER_ACTION",
    content: "CONTENT",
    lesson: "CONTENT",
    flashcard: "CONTENT",
    error: "ERROR",
};

export interface LogCharts {
    logVolume: LogVolumePoint[];
    logsByLevel: LogLevelPoint[];
    topActions: TopActionPoint[];
}

export function buildLogCharts(logsSnap: QuerySnapshot): LogCharts {
    const volumeMap = new Map<string, Record<string, number>>();
    const levelCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    logsSnap.docs.forEach((d) => {
        const raw = d.data() as Record<string, unknown>;
        const tsRaw = raw.timestamp;
        const ts =
            typeof tsRaw === "number"
                ? tsRaw
                : tsRaw && typeof (tsRaw as { toDate?: () => Date }).toDate === "function"
                  ? (tsRaw as { toDate: () => Date }).toDate().getTime()
                  : typeof tsRaw === "string"
                    ? Date.parse(tsRaw)
                    : null;
        if (!ts || !Number.isFinite(ts)) return;

        const date = new Date(ts).toISOString().slice(0, 10);
        const metaType = (raw.metadata as { logType?: string } | undefined)?.logType;
        const entityType = typeof raw.entityType === "string" ? raw.entityType.toLowerCase() : "";
        const resolvedType =
            metaType && LOG_TYPES_LIST.includes(metaType)
                ? metaType
                : (ENTITY_TO_LOG_TYPE_MAP[entityType] ?? "SYSTEM");

        if (!volumeMap.has(date)) {
            volumeMap.set(date, {
                total: 0,
                AUTH: 0,
                ADMIN_ACTION: 0,
                USER_ACTION: 0,
                CONTENT: 0,
                SYSTEM: 0,
                ERROR: 0,
            });
        }
        const bucket = volumeMap.get(date)!;
        bucket.total = (bucket.total ?? 0) + 1;
        bucket[resolvedType] = (bucket[resolvedType] ?? 0) + 1;

        const level = typeof raw.level === "string" ? raw.level : "info";
        levelCounts[level] = (levelCounts[level] ?? 0) + 1;

        const action = typeof raw.action === "string" ? raw.action : null;
        if (action) actionCounts[action] = (actionCounts[action] ?? 0) + 1;
    });

    const logVolume = Array.from(volumeMap.entries())
        .map(([date, counts]) => ({ date, ...counts }) as LogVolumePoint)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

    const logsByLevel = Object.entries(levelCounts)
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => b.count - a.count);

    const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return { logVolume, logsByLevel, topActions };
}
