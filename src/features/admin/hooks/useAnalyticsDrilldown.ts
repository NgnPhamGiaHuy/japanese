"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAdminToken } from "./useAdminToken";
import {
    fetchDrilldownContentAction,
    fetchDrilldownFeatureAction,
    fetchDrilldownUsersAction,
} from "../actions/admin.actions";

export type DrilldownType = "user_growth" | "role" | "feature" | "content" | null;

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
 */
export const useAnalyticsDrilldown = () => {
    const getAdminIdToken = useAdminToken();
    const [selection, setSelection] = useState<DrilldownSelection | null>(null);

    const drilldownQuery = useQuery({
        queryKey: ["analytics", "drilldown", selection?.type, selection?.value],
        queryFn: async () => {
            if (!selection) return null;
            const token = await getAdminIdToken();

            switch (selection.type) {
                case "user_growth":
                    const resUsersDate = await fetchDrilldownUsersAction(token, {
                        date: selection.value,
                    });
                    if (!resUsersDate.ok) throw new Error(resUsersDate.error);
                    return resUsersDate.data;
                case "role":
                    const resUsersRole = await fetchDrilldownUsersAction(token, {
                        role: selection.value,
                    });
                    if (!resUsersRole.ok) throw new Error(resUsersRole.error);
                    return resUsersRole.data;
                case "feature":
                    const resFeature = await fetchDrilldownFeatureAction(token, selection.value);
                    if (!resFeature.ok) throw new Error(resFeature.error);
                    return resFeature.data;
                case "content":
                    const resContent = await fetchDrilldownContentAction(token, selection.value);
                    if (!resContent.ok) throw new Error(resContent.error);
                    return resContent.data;
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
