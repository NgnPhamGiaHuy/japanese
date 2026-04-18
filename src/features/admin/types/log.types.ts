export type LogLevel = "info" | "warn" | "error" | "security";
export type LogType = "AUTH" | "ADMIN_ACTION" | "SYSTEM" | "ERROR" | "CONTENT";

export type LogSource = "client" | "server" | "cloud_function";

export interface AdminLog {
    id: string;
    timestamp: string;
    timestampMs?: number;
    level: LogLevel;
    type: LogType;
    action: string;
    userId: string;
    userName: string;
    userEmail: string;
    metadata: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
    entityType?: string;
    entityId?: string;
    source?: LogSource;
}

export interface AdminLogFilters {
    level?: LogLevel;
    type?: LogType;
    search?: string;
    startDate?: string;
    endDate?: string;
}

export interface PaginatedLogs {
    logs: AdminLog[];
    nextPageToken: string | null;
}
