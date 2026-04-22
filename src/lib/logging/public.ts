import type { AdminLog, LogLevel, LogSource, LogType } from "@/features/admin/types";

/** Firestore collection name for canonical audit logs. */
export const SYSTEM_LOGS_COLLECTION = "system_logs";

export type CanonicalLogLevel = "info" | "warn" | "error";

export interface SystemLogRecord {
    id: string;
    timestamp: number;
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
    level: CanonicalLogLevel;
    source: LogSource;
}

export type SystemLogInput = Omit<SystemLogRecord, "id" | "timestamp"> & {
    id?: string;
    timestamp?: number;
};

export function firestoreDataToSystemRecord(
    id: string,
    data: Record<string, unknown>,
): SystemLogRecord {
    const rawTs = data.timestamp;
    const ts =
        typeof rawTs === "number" && Number.isFinite(rawTs)
            ? rawTs
            : typeof rawTs === "string"
              ? Date.parse(rawTs)
              : NaN;
    const levelRaw = data.level;
    const level: CanonicalLogLevel =
        levelRaw === "warn" || levelRaw === "error" || levelRaw === "info" ? levelRaw : "info";
    const sourceRaw = data.source;
    const source: LogSource =
        sourceRaw === "client" || sourceRaw === "server" || sourceRaw === "cloud_function"
            ? sourceRaw
            : "server";

    return {
        id,
        timestamp: Number.isFinite(ts) ? ts : Date.now(),
        userId: (data.userId as string | null | undefined) ?? null,
        action: String(data.action ?? ""),
        entityType: String(data.entityType ?? "system"),
        entityId: (data.entityId as string | null | undefined) ?? null,
        metadata: (data.metadata as Record<string, unknown> | undefined) ?? {},
        level,
        source,
    };
}

const ENTITY_TO_LOG_TYPE: Record<string, LogType> = {
    auth: "AUTH",
    authentication: "AUTH",
    admin: "ADMIN_ACTION",
    admin_action: "ADMIN_ACTION",
    system: "SYSTEM",
    error: "ERROR",
    content: "CONTENT",
    lesson: "CONTENT",
    flashcard: "CONTENT",
    user: "AUTH",
    user_action: "USER_ACTION",
    deck: "USER_ACTION",
    card: "USER_ACTION",
    study: "USER_ACTION",
    share: "USER_ACTION",
};

export function inferLogTypeFromEntity(entityType: string): LogType {
    const key = entityType.toLowerCase();
    return ENTITY_TO_LOG_TYPE[key] ?? "SYSTEM";
}

export function logTypeToEntityType(type: LogType): string {
    switch (type) {
        case "AUTH":
            return "auth";
        case "ADMIN_ACTION":
            return "admin";
        case "SYSTEM":
            return "system";
        case "ERROR":
            return "error";
        case "CONTENT":
            return "content";
        case "USER_ACTION":
            return "user_action";
        default:
            return "system";
    }
}

/**
 * Maps a stored system log into the admin UI model (legacy-friendly).
 */
export function systemLogToAdminView(rec: SystemLogRecord): AdminLog {
    const meta = { ...(rec.metadata ?? {}) };
    const logType = (meta.logType as LogType | undefined) ?? inferLogTypeFromEntity(rec.entityType);
    const securityFlag = meta.security === true || meta.securityEvent === true;
    const level: LogLevel =
        securityFlag && rec.level !== "error"
            ? "security"
            : rec.level === "error"
              ? "error"
              : rec.level === "warn"
                ? "warn"
                : "info";

    const userName = typeof meta.userName === "string" ? meta.userName : "—";
    const userEmail = typeof meta.userEmail === "string" ? meta.userEmail : "—";
    const userId = rec.userId ?? "system";

    return {
        id: rec.id,
        timestamp: new Date(rec.timestamp).toISOString(),
        timestampMs: rec.timestamp,
        level,
        type: logType,
        action: rec.action,
        userId,
        userName,
        userEmail,
        metadata: {
            ...meta,
            entityType: rec.entityType,
            entityId: rec.entityId ?? undefined,
            source: rec.source,
        },
        entityType: rec.entityType,
        entityId: rec.entityId ?? undefined,
        source: rec.source,
        ip: typeof meta.ip === "string" ? meta.ip : undefined,
        userAgent: typeof meta.userAgent === "string" ? meta.userAgent : undefined,
    };
}
