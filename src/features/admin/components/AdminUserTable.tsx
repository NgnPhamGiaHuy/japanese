"use client";

/**
 * AdminUserTable — TanStack Table-powered user list.
 *
 * @remarks
 * Handles client-side sorting and filtering (email search) on the current page.
 * Server-side pagination is controlled by the parent via onNextPage / onPrevPage.
 */
import { useMemo, useState } from "react";

import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Search,
    Shield,
    Trash2,
    Users,
} from "lucide-react";

import { Button, Card, ConfirmModal } from "@/shared/components/ui";
import { userColumns } from "../tables/userColumns";

import type { SortingState } from "@tanstack/react-table";
import type { UserTableMeta } from "../tables/userColumns";
import type { AdminUser } from "../types";

interface AdminUserTableProps {
    users: AdminUser[];
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    loading: boolean;
    meta: UserTableMeta;
    onNextPage: () => void;
    onPrevPage: () => void;
    onBulkDelete: (uids: string[]) => Promise<void>;
    onBulkSetRole: (uids: string[], grant: boolean) => Promise<void>;
}

export function AdminUserTable({
    users,
    currentPage,
    hasNextPage,
    hasPrevPage,
    loading,
    meta,
    onNextPage,
    onPrevPage,
    onBulkDelete,
    onBulkSetRole,
}: AdminUserTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [rowSelection, setRowSelection] = useState({});

    const [pendingBulkAction, setPendingBulkAction] = useState<
        "delete" | "promote" | "demote" | null
    >(null);
    const [isProcessingBulk, setIsProcessingBulk] = useState(false);
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

    const data = useMemo(() => users, [users]);

    const handleRowSelect = (index: number, event: MouseEvent) => {
        const allRows = table.getRowModel().rows;
        const row = allRows[index];
        if (!row) return;

        if (event.shiftKey && lastSelectedIndex !== null) {
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const targetValue = !row.getIsSelected();

            for (let i = start; i <= end; i++) {
                allRows[i].toggleSelected(targetValue);
            }
        } else {
            row.toggleSelected();
        }
        setLastSelectedIndex(index);
    };

    const table = useReactTable({
        data,
        columns: userColumns,
        state: { sorting, globalFilter, rowSelection },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableRowSelection: true,
        // Filter by email or displayName
        globalFilterFn: (row, _columnId, filterValue: string) => {
            const q = filterValue.toLowerCase();
            return (
                (row.original.email?.toLowerCase().includes(q) ?? false) ||
                (row.original.displayName?.toLowerCase().includes(q) ?? false)
            );
        },
        meta: {
            ...meta,
            onRowSelect: handleRowSelect,
        },
    });

    const selectedRows = table.getSelectedRowModel().rows;
    const selectedCount = selectedRows.length;

    const handleBulkAction = async (action: "delete" | "promote" | "demote") => {
        setPendingBulkAction(action);
    };

    const handleBulkConfirm = async () => {
        if (!pendingBulkAction) return;
        const uids = selectedRows.map((r) => r.original.uid);
        setIsProcessingBulk(true);

        try {
            if (pendingBulkAction === "delete") {
                await onBulkDelete(uids);
            } else {
                await onBulkSetRole(uids, pendingBulkAction === "promote");
            }
        } finally {
            setIsProcessingBulk(false);
            setPendingBulkAction(null);
            setRowSelection({});
        }
    };

    const bulkConfig = {
        delete: {
            title: "Delete Users?",
            message: `Are you sure you want to permanently delete ${selectedCount} users?`,
            confirmText: "Delete All",
            variant: "danger" as const,
        },
        promote: {
            title: "Grant Admin Role?",
            message: `You are about to promote ${selectedCount} users to Admin status.`,
            confirmText: "Confirm Promotion",
            variant: "info" as const,
        },
        demote: {
            title: "Remove Admin Role?",
            message: `You are about to revoke admin permissions for ${selectedCount} users.`,
            confirmText: "Confirm Demotion",
            variant: "warning" as const,
        },
    };

    const currentConfig = pendingBulkAction ? bulkConfig[pendingBulkAction] : null;

    return (
        <>
            <Card variant="default" padding="none" className="overflow-hidden">
                {/* Contextual Header (Search or Bulk Actions) */}
                <div className="h-16 border-b-2 border-gray-100 transition-colors duration-200">
                    {selectedCount > 0 ? (
                        <div className="animate-in fade-in slide-in-from-top-2 flex h-full items-center justify-between bg-[#1cb0f6]/5 px-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 rotate-[-6deg] items-center justify-center rounded-lg bg-[#1cb0f6] text-xs font-black text-white shadow-sm transition-transform hover:rotate-0">
                                    {selectedCount}
                                </div>
                                <span className="text-sm font-black text-[#1cb0f6]">
                                    {selectedCount} {selectedCount === 1 ? "User" : "Users"}{" "}
                                    Selected
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    color="purple"
                                    className="!h-9 !px-4 !py-0 !text-xs"
                                    icon={Users}
                                    iconSize={14}
                                    onClick={() => handleBulkAction("promote")}
                                >
                                    Promote
                                </Button>
                                <Button
                                    variant="secondary"
                                    color="orange"
                                    className="!h-9 !px-4 !py-0 !text-xs"
                                    icon={Shield}
                                    iconSize={14}
                                    onClick={() => handleBulkAction("demote")}
                                >
                                    Demote
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="!h-9 !px-4 !py-0 !text-xs !text-[#ea2b2b] hover:!bg-[#ffdfe0]"
                                    icon={Trash2}
                                    iconSize={14}
                                    onClick={() => handleBulkAction("delete")}
                                >
                                    Delete
                                </Button>
                                <div className="mx-2 h-6 w-px bg-gray-200" />
                                <button
                                    onClick={() => setRowSelection({})}
                                    className="text-xs font-bold text-[#afafaf] hover:text-[#3c3c3c]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 flex h-full items-center p-4">
                            <div className="relative w-full">
                                <Search
                                    size={16}
                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search by email or name…"
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="h-10 w-full rounded-xl border-2 border-gray-200 pr-4 pl-9 text-sm font-bold text-[#3c3c3c] transition-colors outline-none focus:border-[#1cb0f6]"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full min-w-[800px] table-fixed">
                        <colgroup>
                            {table.getFlatHeaders().map((header) => (
                                <col key={header.id} style={{ width: header.column.getSize() }} />
                            ))}
                        </colgroup>
                        <thead>
                            {table.getHeaderGroups().map((hg) => (
                                <tr
                                    key={hg.id}
                                    className="border-b-2 border-gray-100 bg-gray-50/50"
                                >
                                    {hg.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="h-12 px-0 text-left text-[10px] font-black tracking-wider text-[#afafaf] uppercase"
                                        >
                                            <div
                                                className={`flex h-full items-center px-4 ${
                                                    header.id === "select" ||
                                                    header.id === "role" ||
                                                    header.id === "lastLogin"
                                                        ? "justify-center"
                                                        : header.id === "actions"
                                                          ? "justify-end pr-6"
                                                          : ""
                                                }`}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <button
                                                        className={`group relative flex items-center gap-1.5 ${
                                                            header.column.getCanSort()
                                                                ? "cursor-pointer hover:text-[#3c3c3c]"
                                                                : ""
                                                        }`}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext(),
                                                        )}
                                                        {header.column.getCanSort() && (
                                                            <ArrowUpDown
                                                                size={10}
                                                                className={`transition-opacity transition-transform ${
                                                                    header.column.getIsSorted()
                                                                        ? "scale-110 text-[#1cb0f6] opacity-100"
                                                                        : "opacity-0 group-hover:opacity-40"
                                                                }`}
                                                            />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={userColumns.length}
                                        className="py-16 text-center text-sm font-bold text-[#afafaf]"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#1cb0f6]" />
                                            Loading users…
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={userColumns.length}
                                        className="py-16 text-center text-sm font-bold text-[#afafaf]"
                                    >
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={`border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${
                                            row.getIsSelected() ? "bg-[#1cb0f6]/5" : ""
                                        }`}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                <div className="flex items-center justify-between border-t-2 border-gray-100 px-4 py-3">
                    <span className="text-xs font-bold text-[#afafaf]">
                        Page {currentPage + 1} · {table.getFilteredRowModel().rows.length} shown
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            color="gray"
                            onClick={onPrevPage}
                            disabled={!hasPrevPage || loading}
                            className="!h-8 !px-3 !py-1 !text-xs"
                            icon={ChevronLeft}
                            iconSize={14}
                        >
                            Prev
                        </Button>
                        <Button
                            variant="secondary"
                            color="gray"
                            onClick={onNextPage}
                            disabled={!hasNextPage || loading}
                            className="!h-8 !px-3 !py-1 !text-xs"
                            icon={ChevronRight}
                            iconSize={14}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

            <ConfirmModal
                isOpen={!!pendingBulkAction}
                onClose={() => setPendingBulkAction(null)}
                onConfirm={handleBulkConfirm}
                title={currentConfig?.title ?? ""}
                message={currentConfig?.message ?? ""}
                confirmText={currentConfig?.confirmText ?? "Confirm"}
                variant={currentConfig?.variant ?? "danger"}
                loading={isProcessingBulk}
            />
        </>
    );
}
