/**
 * @file log-types.ts
 * The canonical log vocabulary — one declaration site for the whole app.
 *
 * @remarks
 * This vocabulary previously lived in `features/admin/types`, which meant the
 * shared logging infrastructure imported its own vocabulary from one of its
 * consumers: `lib/logging/public.ts` reached into `@/features/admin/types`.
 * Infrastructure that depends on a feature cannot be reasoned about, tested,
 * or extracted without that feature, and it made `admin ↔ lib/logging` a
 * dependency cycle. The types belong to the layer that owns the pipeline.
 *
 * `features/admin` now imports from here, which is the legal direction
 * (features may use lib; lib may never use features — ADR-103).
 */

/**
 * Where a log record was produced.
 *
 * Declared as a const tuple so the TypeScript union and the zod enum in
 * `schema.ts` both DERIVE from it. They used to be written out separately and
 * kept in step by hand — a pair that agrees only while someone remembers it
 * has to. Adding a source now means editing this one line.
 *
 * Note for readers of `logSourceSchema`: widening this tuple widens what the
 * validator accepts. `firestoreDataToSystemRecord` deliberately normalizes any
 * unrecognized stored value to `"server"` rather than rejecting the record, so
 * historical documents keep rendering.
 */
export const LOG_SOURCES = ["client", "server"] as const;

export type LogSource = (typeof LOG_SOURCES)[number];

/** Severity as surfaced in the admin reports UI. Broader than
 * `CanonicalLogLevel` (see `public.ts`), which is what the pipeline writes. */
export type LogLevel = "info" | "warn" | "error" | "security";

/** Coarse category used for filtering and badge rendering. */
export type LogType = "AUTH" | "ADMIN_ACTION" | "SYSTEM" | "ERROR" | "CONTENT" | "USER_ACTION";

/**
 * A log record shaped for display. `systemLogToAdminView` in `public.ts`
 * produces this from the stored `SystemLogRecord`.
 */
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
