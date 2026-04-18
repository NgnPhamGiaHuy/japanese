"use client";

import { useQuery } from "@tanstack/react-query";

import { useAdminToken } from "./useAdminToken";
import { fetchDashboardOverviewAction } from "../actions";
import { adminQueryKeys } from "../utils/queryKeys";

export function useAdminDashboard() {
    const getAdminIdToken = useAdminToken();
    return useQuery({
        queryKey: adminQueryKeys.dashboard(),
        queryFn: async () => {
            await getAdminIdToken();
            const result = await fetchDashboardOverviewAction();
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
    });
}
