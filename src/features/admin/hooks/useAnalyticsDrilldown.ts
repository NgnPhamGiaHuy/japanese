"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAdminToken } from "./useAdminToken";
import {
    fetchDrilldownContentAction,
    fetchDrilldownFeatureAction,
    fetchDrilldownLogsAction,
    fetchDrilldownUsersAction,
} from "../actions/admin.actions";

export type DrilldownType =
    | "user_growth"
    | "role"
    | "feature"
    | "content"
    | "log_type"
    | "log_level"
    | "log_action"
    | null;

interface DrilldownSelection {
    type: DrilldownType;
    label: string;
    value: string;
}

/**
 * Hook for managing Analytics Drilldown interactions.
 *
 * @remarks Handles modal state, data selection, and TanStack Query fetching
 * for detailed analytics records from Firebase.
 * Supports log-derived drilldowns: log_type, log_level, log_action.
 */
export const useAnalyticsDrilldown = () => {
    const getAdminIdToken = useAdminToken();
    const [selection, setSelection] = useState<DrilldownSelection | null>(null);

    const drilldownQuery = useQuery({
        queryKey: ["analytics", "drilldown", selection?.type, selection?.value],
        queryFn: async () => {
            if (!selection) return null;
            await getAdminIdToken();

            switch (selection.type) {
                case "user_growth": {
                    const res = await fetchDrilldownUsersAction({ date: selection.value });
                    if (!res.ok) throw new Error(res.error);
                    return res.data;
                }
                case "role": {
                    const res = await fetchDrilldownUsersAction({ role: selection.value });
                    if (!res.ok) throw new Error(res.error);
                    return res.data;
                }
                case "feature": {
                    const res = await fetchDrilldownFeatureAction(selection.value);
                    if (!res.ok) throw new Error(res.error);
                    return res.data;
                }
                case "content": {
                    const res = await fetchDrilldownContentAction(selection.value);
                    if (!res.ok) throw new Error(res.error);
                    return res.data;
                }
                case "log_type": {
                    const res = await fetchDrilldownLogsAction({ type: selection.value });
                    if (!res.ok) throw new Error(res.error);
                    return res.data;
                }
                case "log_level": {
                    const res = await fetchDrilldownLogsAction({ level: selection.value });
                    if (!res.ok) throw new Error(res.error);
                    return res.data;
                }
                case "log_action": {
                    const res = await fetchDrilldownLogsAction({ action: selection.value });
                    if (!res.ok) throw new Error(res.error);
                    return res.data;
                }
                default:
                    return null;
            }
        },
        enabled: !!selection,
    });

    const openDrilldown = (type: DrilldownType, label: string, value: string) => {
        setSelection({ type, label, value });
    };

    const closeDrilldown = () => {
        setSelection(null);
    };

    return {
        selection,
        data: drilldownQuery.data,
        isLoading: drilldownQuery.isLoading,
        error: drilldownQuery.error,
        openDrilldown,
        closeDrilldown,
    };
};
