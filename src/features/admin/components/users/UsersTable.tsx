"use client";

import { Users as UsersIcon } from "lucide-react";

import { Button, LoadingSpinner } from "@/shared/components/ui";
import UserMobileRow from "./UserMobileRow";
import UsersActionConfirmModal from "./UsersActionConfirmModal";
import UsersTableBody from "./UsersTableBody";
import UsersTableHeader from "./UsersTableHeader";
import UsersTablePagination from "./UsersTablePagination";
import UsersTableToolbar from "./UsersTableToolbar";
import { AdminEmptyState, AdminTable } from "../shared";
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
    const {
        users,
        totalUsers = 0,
        loading = false,
        currentPage = 0,
        canDelete,
        canPromote,
    } = props;
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
    const hasData = users.length > 0;
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
                        loading ? (
                            <div className="flex justify-center py-16">
                                <LoadingSpinner fullScreen={false} label="Loading users..." />
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {table.getRowModel().rows.map((row) => (
                                    <UserMobileRow key={row.id} row={row} />
                                ))}
                            </div>
                        )
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
                        <UsersTableHeader table={table} />
                        <UsersTableBody table={table} loading={loading} />
                    </>
                ) : (
                    <div className="col-span-full">
                        <AdminEmptyState
                            title={globalFilter ? "No users match your search" : "No users found"}
                            description={
                                globalFilter
                                    ? `Try adjusting your search for "${globalFilter}" or clearing filters.`
                                    : "Individual user accounts will appear here as they register on the platform."
                            }
                            icon={UsersIcon}
                            action={
                                globalFilter ? (
                                    <Button variant="secondary" onClick={() => setGlobalFilter("")}>
                                        Clear Search
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
