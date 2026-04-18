"use client";

import { Card } from "@/shared/components/ui";
import { UsersActionConfirmModal } from "./UsersActionConfirmModal";
import { UsersTableBody } from "./UsersTableBody";
import { UsersTableHeader } from "./UsersTableHeader";
import { UsersTablePagination } from "./UsersTablePagination";
import { UsersTableToolbar } from "./UsersTableToolbar";
import { useUsersTable } from "../../hooks/useUsersTable";

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

    return (
        <>
            <Card variant="default" padding="none" className="overflow-hidden">
                <div className="h-16 border-b-2 border-gray-100">
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
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] table-fixed">
                        <UsersTableHeader table={table} />
                        <UsersTableBody table={table} loading={loading} />
                    </table>
                </div>

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
            </Card>

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
