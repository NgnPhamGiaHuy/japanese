"use client";

import { useQuery } from "@tanstack/react-query";

import { useAdminToken } from "./useAdminToken";
import { fetchAnalyticsAction } from "../actions";
import { adminQueryKeys } from "../utils/queryKeys";

export function useAnalytics() {
    const getAdminIdToken = useAdminToken();
    return useQuery({
        queryKey: adminQueryKeys.analytics(),
        queryFn: async () => {
            await getAdminIdToken();
            const result = await fetchAnalyticsAction();
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
    });
}
