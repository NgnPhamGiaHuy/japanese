"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { auth } from "@/lib/firebase";
import { useAlert } from "@/shared/providers";
import { useAppStore } from "@/store";
import {
    deleteUserAction,
    fetchAdminStatsAction,
    fetchUsersAction,
    setAdminRoleAction,
} from "../actions/admin.actions";

import type { AdminStats, AdminUser } from "../types";

const PAGE_SIZE = 25;

export interface UseAdminDashboardReturn {
    users: AdminUser[];
    stats: AdminStats | null;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    loadingUsers: boolean;
    loadingStats: boolean;
    mutating: Record<string, boolean>;
    goToNextPage: () => void;
    goToPrevPage: () => void;
    promoteUser: (uid: string) => Promise<void>;
    demoteUser: (uid: string) => Promise<void>;
    removeUser: (uid: string) => Promise<void>;
    refreshUsers: () => void;
    bulkRemoveUsers: (uids: string[]) => Promise<void>;
    bulkSetAdminRole: (uids: string[], grant: boolean) => Promise<void>;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
    const { user } = useAppStore();
    const { showAlert } = useAlert();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [mutating, setMutating] = useState<Record<string, boolean>>({});

    const [pageStack, setPageStack] = useState<(string | undefined)[]>([undefined]);
    const [currentPage, setCurrentPage] = useState(0);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);

    const pageStackRef = useRef(pageStack);
    pageStackRef.current = pageStack;

    const getToken = useCallback(async (): Promise<string> => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Not authenticated");
        return currentUser.getIdToken();
    }, []);

    const setMutatingUid = (uid: string, value: boolean) =>
        setMutating((prev) => ({ ...prev, [uid]: value }));

    const loadUsers = useCallback(
        async (pageToken?: string) => {
            setLoadingUsers(true);
            try {
                const token = await getToken();
                const result = await fetchUsersAction(token, pageToken, PAGE_SIZE);
                if (!result.ok) {
                    showAlert("error", result.error);
                    return;
                }
                setUsers(result.data.users);
                setNextPageToken(result.data.nextPageToken);
            } catch (err) {
                showAlert("error", err instanceof Error ? err.message : "Failed to load users");
            } finally {
                setLoadingUsers(false);
            }
        },
        [getToken, showAlert],
    );

    const loadStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const token = await getToken();
            const result = await fetchAdminStatsAction(token);
            if (!result.ok) {
                showAlert("error", result.error);
                return;
            }
            setStats(result.data);
        } catch (err) {
            showAlert("error", err instanceof Error ? err.message : "Failed to load stats");
        } finally {
            setLoadingStats(false);
        }
    }, [getToken, showAlert]);

    useEffect(() => {
        if (!user) return;
        void loadUsers(undefined);
        void loadStats();
    }, [user, loadUsers, loadStats]);

    const goToNextPage = useCallback(() => {
        if (!nextPageToken) return;
        const newStack = [...pageStackRef.current, nextPageToken];
        setPageStack(newStack);
        setCurrentPage((p) => p + 1);
        void loadUsers(nextPageToken);
    }, [nextPageToken, loadUsers]);

    const goToPrevPage = useCallback(() => {
        if (currentPage === 0) return;
        const newStack = pageStackRef.current.slice(0, -1);
        setPageStack(newStack);
        setCurrentPage((p) => p - 1);
        void loadUsers(newStack[newStack.length - 1]);
    }, [currentPage, loadUsers]);

    const refreshUsers = useCallback(() => {
        void loadUsers(pageStackRef.current[currentPage]);
        void loadStats();
    }, [currentPage, loadUsers, loadStats]);

    /** Promote a user to `admin` (Firestore-backed). Superadmin is console-only. */
    const promoteUser = useCallback(
        async (uid: string) => {
            setMutatingUid(uid, true);
            try {
                const token = await getToken();
                const result = await setAdminRoleAction(token, uid, true);
                if (!result.ok) {
                    showAlert("error", result.error);
                    return;
                }
                setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isAdmin: true } : u)));
                setStats((prev) => prev && { ...prev, admins: prev.admins + 1 });
                showAlert("success", "User promoted to admin");
            } catch (err) {
                showAlert("error", err instanceof Error ? err.message : "Promotion failed");
            } finally {
                setMutatingUid(uid, false);
            }
        },
        [getToken, showAlert],
    );

    /** Revoke `admin` role. Superadmin cannot be demoted here. */
    const demoteUser = useCallback(
        async (uid: string) => {
            setMutatingUid(uid, true);
            try {
                const token = await getToken();
                const result = await setAdminRoleAction(token, uid, false);
                if (!result.ok) {
                    showAlert("error", result.error);
                    return;
                }
                setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isAdmin: false } : u)));
                setStats((prev) => prev && { ...prev, admins: Math.max(0, prev.admins - 1) });
                showAlert("success", "Admin role removed");
            } catch (err) {
                showAlert("error", err instanceof Error ? err.message : "Demotion failed");
            } finally {
                setMutatingUid(uid, false);
            }
        },
        [getToken, showAlert],
    );

    const removeUser = useCallback(
        async (uid: string) => {
            setMutatingUid(uid, true);
            try {
                const token = await getToken();
                const result = await deleteUserAction(token, uid);
                if (!result.ok) {
                    showAlert("error", result.error);
                    return;
                }
                setUsers((prev) => prev.filter((u) => u.uid !== uid));
                setStats(
                    (prev) => prev && { ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) },
                );
                showAlert("success", "User deleted");
            } catch (err) {
                showAlert("error", err instanceof Error ? err.message : "Delete failed");
            } finally {
                setMutatingUid(uid, false);
            }
        },
        [getToken, showAlert],
    );

    const bulkRemoveUsers = useCallback(
        async (uids: string[]) => {
            const token = await getToken();
            const results = await Promise.allSettled(
                uids.map((uid) => deleteUserAction(token, uid)),
            );

            const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
            const failed = uids.length - succeeded;

            setUsers((prev) => prev.filter((u) => !uids.includes(u.uid)));
            setStats(
                (prev) => prev && { ...prev, totalUsers: Math.max(0, prev.totalUsers - succeeded) },
            );

            if (failed > 0) {
                showAlert("warning", `Deleted ${succeeded} users, but ${failed} failed.`);
            } else {
                showAlert("success", `Successfully deleted ${succeeded} users.`);
            }
        },
        [getToken, showAlert],
    );

    const bulkSetAdminRole = useCallback(
        async (uids: string[], grant: boolean) => {
            const token = await getToken();
            const results = await Promise.allSettled(
                uids.map((uid) => setAdminRoleAction(token, uid, grant)),
            );

            const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
            const failed = uids.length - succeeded;

            setUsers((prev) =>
                prev.map((u) => (uids.includes(u.uid) ? { ...u, isAdmin: grant } : u)),
            );
            setStats((prev) => {
                if (!prev) return null;
                const diff = grant ? succeeded : -succeeded;
                return { ...prev, admins: Math.max(0, prev.admins + diff) };
            });

            if (failed > 0) {
                showAlert("warning", `Updated ${succeeded} users, but ${failed} failed.`);
            } else {
                showAlert("success", `Successfully updated ${succeeded} users.`);
            }
        },
        [getToken, showAlert],
    );

    return {
        users,
        stats,
        currentPage,
        hasNextPage: !!nextPageToken,
        hasPrevPage: currentPage > 0,
        loadingUsers,
        loadingStats,
        mutating,
        goToNextPage,
        goToPrevPage,
        promoteUser,
        demoteUser,
        removeUser,
        refreshUsers,
        bulkRemoveUsers,
        bulkSetAdminRole,
    };
}
