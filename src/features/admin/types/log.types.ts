/**
 * @file log.types.ts
 * Admin-side log types.
 *
 * @remarks
 * The shared vocabulary — `LogLevel`, `LogType`, `LogSource`, `AdminLog` — is
 * declared in `lib/logging/log-types.ts` and re-exported here so that
 * `@/features/admin/types` remains the one place admin code looks for its
 * types. It used to be declared here and imported *upward* by
 * `lib/logging/public.ts`, which made shared infrastructure depend on this
 * feature (ADR-103, cycle B of TD-4).
 *
 * Only the filter and pagination shapes below are genuinely admin's own —
 * they describe the reports UI, not the log pipeline.
 */
import type { AdminLog, LogLevel, LogType } from "@/lib/logging/log-types";

export type { AdminLog, LogLevel, LogSource, LogType } from "@/lib/logging/log-types";

export interface AdminLogFilters {
    level?: LogLevel;
    type?: LogType;
    search?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
}

export interface PaginatedLogs {
    logs: AdminLog[];
    nextPageToken: string | null;
}
