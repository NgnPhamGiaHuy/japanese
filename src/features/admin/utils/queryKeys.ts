import type { AdminLogFilters } from "../types";

/** Default page size for the admin Users list — shared across the query key, hook, service, and server action. */
export const USERS_PAGE_SIZE = 25;

export const adminQueryKeys = {
    all: ["admin"] as const,
    dashboard: () => [...adminQueryKeys.all, "dashboard"] as const,
    analytics: () => [...adminQueryKeys.all, "analytics"] as const,
    users: (pageToken?: string, pageSize = USERS_PAGE_SIZE) =>
        [...adminQueryKeys.all, "users", pageToken ?? null, pageSize] as const,
    stats: () => [...adminQueryKeys.all, "stats"] as const,
    content: () => [...adminQueryKeys.all, "content"] as const,
    logs: (filters: AdminLogFilters, cursorId?: string) =>
        [...adminQueryKeys.all, "logs", filters, cursorId ?? null] as const,
};
