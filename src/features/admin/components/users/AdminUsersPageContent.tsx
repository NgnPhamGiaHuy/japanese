"use client";

import { useEffect, useState } from "react";

import { Users as UsersIcon } from "lucide-react";

import { LoadingSpinner } from "@/shared/components/ui";
import UsersTable from "./UsersTable";
import { AdminErrorState, AdminPageHeader, AdminPageLayout } from "../shared";
import { useAdminRole } from "../../context/AdminContext";
import { useUsers } from "../../hooks";
import { hasPermission } from "../../utils/rbac";

/**
 * Admin Users Management Page.
 *
 * @remarks Orchestrates user data fetching, role-based permission checks,
 * and paginated list rendering. Acts as the primary control center for
 * identity and access management (IAM).
 */
const AdminUsersPageContent = () => {
    const [mounted, setMounted] = useState(false);
    const { role } = useAdminRole();
    const [pageTokens, setPageTokens] = useState<(string | undefined)[]>([undefined]);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    const {
        users,
        usersTotal,
        nextPageToken,
        isLoadingUsers,
        usersError,
        refetchUsers,
        promoteUser,
        demoteUser,
        removeUser,
    } = useUsers(pageTokens[currentPage]);

    const canDelete = hasPermission(role, "canDeleteUsers");
    const canPromote = hasPermission(role, "canPromoteUsers");

    const goToPage = (pageIndex: number) => {
        if (pageIndex >= 0 && pageIndex < pageTokens.length) {
            setCurrentPage(pageIndex);
        }
    };

    if (!mounted || isLoadingUsers)
        return (
            <AdminPageLayout>
                <LoadingSpinner fullScreen={false} label="Loading users..." />
            </AdminPageLayout>
        );
    if (usersError)
        return (
            <AdminPageLayout>
                <AdminErrorState message={usersError.message} onRetry={() => refetchUsers()} />
            </AdminPageLayout>
        );

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title="Users"
                description="Manage users, roles, and moderation actions."
                icon={UsersIcon}
            />
            <UsersTable
                users={users}
                totalUsers={usersTotal}
                loading={isLoadingUsers}
                currentPage={currentPage}
                hasNextPage={!!nextPageToken}
                hasPrevPage={currentPage > 0}
                onNextPage={() => {
                    if (!nextPageToken) return;
                    // Only add if not already in the tokens list (prevent dupes on refetch)
                    setPageTokens((prev) => {
                        if (prev.includes(nextPageToken)) return prev;
                        return [...prev, nextPageToken];
                    });
                    setCurrentPage((p) => p + 1);
                }}
                onPrevPage={() => {
                    setCurrentPage((p) => Math.max(0, p - 1));
                }}
                onGoToPage={goToPage}
                maxDiscoveredPage={pageTokens.length}
                canDelete={canDelete}
                canPromote={canPromote}
                onPromote={promoteUser}
                onDemote={demoteUser}
                onDelete={removeUser}
            />
            <p className="px-1 text-[10px] font-bold tracking-widest text-[#afafaf] uppercase">
                Role controls are server-enforced
            </p>
        </AdminPageLayout>
    );
};

export default AdminUsersPageContent;
