"use client";

import { useTranslations } from "next-intl";

import { Users as UsersIcon } from "lucide-react";

import { Button, EmptyState } from "@/shared/components/ui";
import UserMobileRow from "./UserMobileRow";
import UsersActionConfirmModal from "./UsersActionConfirmModal";
import UsersTablePagination from "./UsersTablePagination";
import UsersTableToolbar from "./UsersTableToolbar";
import { AdminTable, DataTableBody, DataTableHeader, DataTableMobileList } from "../shared";
import { useUsersTable } from "../../hooks";

import type { AdminUser } from "../../types";

interface UsersTableProps {
    users: AdminUser[];
    totalUsers?: number;
    loading?: boolean;
    currentPage?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    onNextPage?: () => void;
    onPrevPage?: () => void;
    onGoToPage?: (page: number) => void;
    maxDiscoveredPage?: number;
    canDelete: boolean;
    canPromote: boolean;
    onPromote: (uid: string) => Promise<unknown>;
    onDemote: (uid: string) => Promise<unknown>;
    onDelete: (uid: string) => Promise<unknown>;
}

/**
 * Administrative Users Management Table Orchestrator.
 *
 * @remarks Coordinates the table state, sub-components, and action modals.
 * Adheres to < 120 lines by delegating logic to useUsersTable hook.
 */
const UsersTable = (props: UsersTableProps) => {
    const t = useTranslations("AdminUsers");
    const { totalUsers = 0, loading = false, currentPage = 0, canDelete, canPromote } = props;
    const totalPages = Math.ceil(totalUsers / 25);

    const {
        table,
        globalFilter,
        setGlobalFilter,
        setRowSelection,
        pendingAction,
        setPendingAction,
        isProcessing,
        handleConfirmAction,
    } = useUsersTable(props);

    const selectedRows = table.getSelectedRowModel().rows;
    const filteredRows = table.getFilteredRowModel().rows;
    const hasResults = filteredRows.length > 0;

    return (
        <>
            <AdminTable
                toolbar={
                    <UsersTableToolbar
                        selectedCount={selectedRows.length}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={setGlobalFilter}
                        onClearSelection={() => setRowSelection({})}
                        canDelete={canDelete}
                        canPromote={canPromote}
                        onPromote={() =>
                            setPendingAction({
                                type: "promote",
                                uids: selectedRows.map((r) => r.original.uid),
                            })
                        }
                        onDemote={() =>
                            setPendingAction({
                                type: "demote",
                                uids: selectedRows.map((r) => r.original.uid),
                            })
                        }
                        onDelete={() =>
                            setPendingAction({
                                type: "delete",
                                uids: selectedRows.map((r) => r.original.uid),
                            })
                        }
                    />
                }
                mobileList={
                    hasResults ? (
                        <DataTableMobileList
                            table={table}
                            loading={loading}
                            loadingLabel={t("loadingUsers")}
                            renderRow={(row) => <UserMobileRow row={row} />}
                        />
                    ) : undefined
                }
                pagination={
                    hasResults ? (
                        <UsersTablePagination
                            {...props}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalUsers={totalUsers}
                            loading={loading}
                            hasPrevPage={props.hasPrevPage ?? false}
                            hasNextPage={props.hasNextPage ?? false}
                            maxDiscoveredPage={props.maxDiscoveredPage ?? 1}
                        />
                    ) : undefined
                }
            >
                {hasResults ? (
                    <>
                        <DataTableHeader table={table} />
                        <DataTableBody
                            table={table}
                            loading={loading}
                            loadingLabel={t("loadingUsers")}
                        />
                    </>
                ) : (
                    <div className="col-span-full">
                        <EmptyState
                            title={globalFilter ? t("noUsersMatchSearch") : t("noUsersFound")}
                            description={
                                globalFilter
                                    ? t("tryAdjustingSearch", { search: globalFilter })
                                    : t("individualUserAccounts")
                            }
                            icon={UsersIcon}
                            action={
                                globalFilter ? (
                                    <Button variant="secondary" onClick={() => setGlobalFilter("")}>
                                        {t("clearSearch")}
                                    </Button>
                                ) : undefined
                            }
                        />
                    </div>
                )}
            </AdminTable>

            <UsersActionConfirmModal
                pendingAction={pendingAction}
                isProcessing={isProcessing}
                onClose={() => setPendingAction(null)}
                onConfirm={handleConfirmAction}
            />
        </>
    );
};

export default UsersTable;
