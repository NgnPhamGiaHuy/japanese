"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAdminToken } from "./useAdminToken";
import { createTestLogAction, fetchLogsAction } from "../actions";

import type { AdminLog, AdminLogFilters } from "../types";

/**
 * High-performance paginated system logs.
 * Filtering is performed server-side; this hook only manages pagination state.
 */
export function useLogs(filters: AdminLogFilters) {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [pageTokens, setPageTokens] = useState<(string | null)[]>([null]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const getToken = useAdminToken();

    const fetchPage = useCallback(
        async (cursorId: string | null, pageIdx: number) => {
            setIsLoading(true);
            setError(null);
            try {
                const idToken = await getToken();
                const result = await fetchLogsAction(idToken, filters, cursorId);
                if (!result.ok) throw new Error(result.error);

                setLogs(result.data.logs);
                setCurrentPage(pageIdx);

                // Register next page token if we haven't seen it yet
                if (result.data.nextPageToken) {
                    setPageTokens((prev) => {
                        if (prev[pageIdx + 1] === result.data.nextPageToken) return prev;
                        const next = prev.slice(0, pageIdx + 1);
                        next.push(result.data.nextPageToken);
                        return next;
                    });
                } else {
                    // No more pages — trim any stale tokens beyond current
                    setPageTokens((prev) => prev.slice(0, pageIdx + 1));
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setIsLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(filters), getToken],
    );

    // Reset and re-fetch when filters change
    useEffect(() => {
        setPageTokens([null]);
        setCurrentPage(0);
        fetchPage(null, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters)]);

    const goToNextPage = useCallback(() => {
        const nextToken = pageTokens[currentPage + 1];
        if (nextToken !== undefined) {
            fetchPage(nextToken, currentPage + 1);
        }
    }, [currentPage, pageTokens, fetchPage]);

    const goToPreviousPage = useCallback(() => {
        if (currentPage > 0) {
            fetchPage(pageTokens[currentPage - 1], currentPage - 1);
        }
    }, [currentPage, pageTokens, fetchPage]);

    const createManualLog = useCallback(async () => {
        const token = await getToken();
        const result = await createTestLogAction(token);
        if (!result.ok) throw new Error(result.error);
        if (currentPage === 0) fetchPage(null, 0);
    }, [getToken, currentPage, fetchPage]);

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
        countsByLevel,
        countsByType,
        isLoading,
        error,
        currentPage,
        goToNextPage,
        goToPreviousPage,
        hasNextPage: pageTokens.length > currentPage + 1,
        hasPreviousPage: currentPage > 0,
        createManualLog,
    };
}
