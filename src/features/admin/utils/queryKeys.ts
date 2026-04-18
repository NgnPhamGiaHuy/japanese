import type { AdminLogFilters } from "../types";

export const adminQueryKeys = {
    all: ["admin"] as const,
    dashboard: () => [...adminQueryKeys.all, "dashboard"] as const,
    analytics: () => [...adminQueryKeys.all, "analytics"] as const,
    users: (pageToken?: string, pageSize = 25) =>
        [...adminQueryKeys.all, "users", pageToken ?? null, pageSize] as const,
    stats: () => [...adminQueryKeys.all, "stats"] as const,
    content: () => [...adminQueryKeys.all, "content"] as const,
    logs: (filters: AdminLogFilters, startTime?: string) =>
        [...adminQueryKeys.all, "logs", filters, startTime ?? null] as const,
};
