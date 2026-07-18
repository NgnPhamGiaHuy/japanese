"use client";

import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminToken } from "./useAdminToken";
import { createTestLogAction, fetchLogsAction } from "../actions";
import { adminQueryKeys } from "../utils/queryKeys";

import type { AdminLogFilters } from "../types";

/**
 * Paginated system logs — one page per call, cursor-based.
 *
 * @remarks
 * Mirrors useUsers.ts's split: cursor bookkeeping (which tokens have been
 * discovered so far, which page is current) lives in the calling page
 * component, not here — this hook just fetches whichever single cursorId
 * it's given for the current filters.
 */
export function useLogs(filters: AdminLogFilters, cursorId?: string) {
    const getAdminIdToken = useAdminToken();
    const queryClient = useQueryClient();

    const logsQuery = useQuery({
        queryKey: adminQueryKeys.logs(filters, cursorId),
        queryFn: async () => {
            await getAdminIdToken();
            const result = await fetchLogsAction(filters, cursorId);
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
    });

    const createTestLogMutation = useMutation({
        mutationFn: async () => {
            await getAdminIdToken();
            const result = await createTestLogAction();
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...adminQueryKeys.all, "logs"] });
        },
    });

    const logs = useMemo(() => logsQuery.data?.logs ?? [], [logsQuery.data]);

    const { countsByLevel, countsByType } = useMemo(() => {
        const levelMap: Record<string, number> = {};
        const typeMap: Record<string, number> = {};
        for (const log of logs) {
            const lv = log.level ?? "info";
            const t = log.type ?? "SYSTEM";
            levelMap[lv] = (levelMap[lv] ?? 0) + 1;
            typeMap[t] = (typeMap[t] ?? 0) + 1;
        }
        return { countsByLevel: levelMap, countsByType: typeMap };
    }, [logs]);

    return {
        logs,
        nextPageToken: logsQuery.data?.nextPageToken ?? null,
        countsByLevel,
        countsByType,
        isLoading: logsQuery.isLoading,
        isFetching: logsQuery.isFetching,
        error: logsQuery.error as Error | null,
        refetch: logsQuery.refetch,
        createTestLog: createTestLogMutation.mutateAsync,
        isCreatingTestLog: createTestLogMutation.isPending,
    };
}
