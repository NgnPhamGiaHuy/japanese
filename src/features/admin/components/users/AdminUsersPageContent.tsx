"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { Users as UsersIcon } from "lucide-react";

import { LoadingSpinner } from "@/shared/components/ui";
import UsersTable from "./UsersTable";
import { AdminErrorState, AdminPageHeader, AdminPageLayout } from "../shared";
import { useAdminRole } from "../../context/AdminContext";
import { useCursorPagination, useUsers } from "../../hooks";
import { hasPermission } from "../../utils/rbac";

const emptySubscribe = () => () => {};

/**
 * Admin Users Management Page.
 *
 * @remarks Orchestrates user data fetching, role-based permission checks,
 * and paginated list rendering. Acts as the primary control center for
 * identity and access management (IAM).
 */
const AdminUsersPageContent = () => {
    const t = useTranslations("AdminUsers");
    const mounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
    const { role } = useAdminRole();
    const {
        currentPage,
        currentPageToken,
        totalDiscoveredPages,
        hasPreviousPage,
        goToNextPage,
        goToPreviousPage,
        goToPage,
    } = useCursorPagination();

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
    } = useUsers(currentPageToken);

    const canDelete = hasPermission(role, "canDeleteUsers");
    const canPromote = hasPermission(role, "canPromoteUsers");

    if (!mounted || isLoadingUsers)
        return (
            <AdminPageLayout>
                <LoadingSpinner fullScreen={false} label={t("loadingUsers")} />
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
            <AdminPageHeader title={t("title")} description={t("description")} icon={UsersIcon} />
            <UsersTable
                users={users}
                totalUsers={usersTotal}
                loading={isLoadingUsers}
                currentPage={currentPage}
                hasNextPage={!!nextPageToken}
                hasPrevPage={hasPreviousPage}
                onNextPage={() => goToNextPage(nextPageToken ?? undefined)}
                onPrevPage={goToPreviousPage}
                onGoToPage={goToPage}
                maxDiscoveredPage={totalDiscoveredPages}
                canDelete={canDelete}
                canPromote={canPromote}
                onPromote={promoteUser}
                onDemote={demoteUser}
                onDelete={removeUser}
            />
            <p className="text-muted px-1 text-xs font-bold tracking-widest uppercase">
                {t("roleControlsNote")}
            </p>
        </AdminPageLayout>
    );
};

export default AdminUsersPageContent;
