"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
    firestoreDataToSystemRecord,
    SYSTEM_LOGS_COLLECTION,
    systemLogToAdminView,
} from "@/lib/logging";
import { useAdminToken } from "./useAdminToken";
import { createTestLogAction } from "../actions";
import { applyLogFilters } from "../utils/filters";

import type { AdminLog, AdminLogFilters } from "../types";

/**
 * Real-time system logs from Firestore `system_logs` (single source of truth).
 * Loads a rolling window; "load more" expands the subscription window.
 */
export function useLogs(filters: AdminLogFilters) {
    const [rawLogs, setRawLogs] = useState<AdminLog[]>([]);
    const [windowLimit, setWindowLimit] = useState(200);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const getToken = useAdminToken();

    useEffect(() => {
        setIsFetchingNextPage(true);
        const q = query(
            collection(db, SYSTEM_LOGS_COLLECTION),
            orderBy("timestamp", "desc"),
            limit(windowLimit),
        );
        const unsub = onSnapshot(
            q,
            (snap) => {
                const next = snap.docs.map((d) =>
                    systemLogToAdminView(
                        firestoreDataToSystemRecord(d.id, d.data() as Record<string, unknown>),
                    ),
                );
                setRawLogs(next);
                setIsLoading(false);
                setIsFetchingNextPage(false);
                setError(null);
            },
            (err) => {
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsLoading(false);
                setIsFetchingNextPage(false);
            },
        );
        return () => unsub();
    }, [windowLimit]);

    const logs = useMemo(() => applyLogFilters(rawLogs, filters), [rawLogs, filters]);

    const fetchNextPage = useCallback(() => {
        setWindowLimit((n) => Math.min(n + 250, 5000));
    }, []);

    const hasNextPage = windowLimit < 5000;

    const createManualLog = useCallback(async () => {
        const token = await getToken();
        const result = await createTestLogAction(token);
        if (!result.ok) {
            throw new Error(result.error);
        }
    }, [getToken]);

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
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        createManualLog,
    };
}
