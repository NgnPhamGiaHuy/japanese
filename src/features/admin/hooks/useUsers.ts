"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminToken } from "./useAdminToken";
import {
    deleteUserAction,
    fetchAdminStatsAction,
    fetchUsersAction,
    setAdminRoleAction,
} from "../actions";
import { adminQueryKeys } from "../utils/queryKeys";

import type { AdminUser } from "../types";

export function useUsers(pageToken?: string, pageSize = 25) {
    const getAdminIdToken = useAdminToken();
    const queryClient = useQueryClient();

    const usersQuery = useQuery({
        queryKey: adminQueryKeys.users(pageToken, pageSize),
        queryFn: async () => {
            const token = await getAdminIdToken();
            const result = await fetchUsersAction(token, pageToken, pageSize);
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
        refetchInterval: 30000, // 30 seconds for live status updates
    });

    const statsQuery = useQuery({
        queryKey: adminQueryKeys.stats(),
        queryFn: async () => {
            const token = await getAdminIdToken();
            const result = await fetchAdminStatsAction(token);
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
    });

    const invalidateUsers = () => {
        queryClient.invalidateQueries({ queryKey: [...adminQueryKeys.all, "users"] });
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats() });
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.analytics() });
    };

    const promoteMutation = useMutation({
        mutationFn: async (uid: string) => {
            const token = await getAdminIdToken();
            const result = await setAdminRoleAction(token, uid, true);
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
        onSuccess: invalidateUsers,
    });

    const demoteMutation = useMutation({
        mutationFn: async (uid: string) => {
            const token = await getAdminIdToken();
            const result = await setAdminRoleAction(token, uid, false);
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
        onSuccess: invalidateUsers,
    });

    const deleteMutation = useMutation({
        mutationFn: async (uid: string) => {
            const token = await getAdminIdToken();
            const result = await deleteUserAction(token, uid);
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
        onSuccess: invalidateUsers,
    });

    const bulkSetRoleMutation = useMutation({
        mutationFn: async ({ uids, grant }: { uids: string[]; grant: boolean }) => {
            const token = await getAdminIdToken();
            await Promise.all(
                uids.map(async (uid) => {
                    const result = await setAdminRoleAction(token, uid, grant);
                    if (!result.ok) throw new Error(result.error);
                }),
            );
        },
        onSuccess: invalidateUsers,
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (uids: string[]) => {
            const token = await getAdminIdToken();
            await Promise.all(
                uids.map(async (uid) => {
                    const result = await deleteUserAction(token, uid);
                    if (!result.ok) throw new Error(result.error);
                }),
            );
        },
        onSuccess: invalidateUsers,
    });

    return {
        users: usersQuery.data?.users ?? ([] as AdminUser[]),
        usersTotal: usersQuery.data?.total ?? 0,
        nextPageToken: usersQuery.data?.nextPageToken ?? null,
        stats: statsQuery.data ?? null,
        isLoadingUsers: usersQuery.isLoading,
        isLoadingStats: statsQuery.isLoading,
        isFetchingUsers: usersQuery.isFetching,
        usersError: usersQuery.error as Error | null,
        statsError: statsQuery.error as Error | null,
        refetchUsers: usersQuery.refetch,
        refetchStats: statsQuery.refetch,
        promoteUser: promoteMutation.mutateAsync,
        demoteUser: demoteMutation.mutateAsync,
        removeUser: deleteMutation.mutateAsync,
        bulkSetRole: bulkSetRoleMutation.mutateAsync,
        bulkDeleteUsers: bulkDeleteMutation.mutateAsync,
        isMutating:
            promoteMutation.isPending ||
            demoteMutation.isPending ||
            deleteMutation.isPending ||
            bulkSetRoleMutation.isPending ||
            bulkDeleteMutation.isPending,
    };
}
