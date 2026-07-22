"use client";

import { useTranslations } from "next-intl";

import { flexRender } from "@tanstack/react-table";

import { LoadingSpinner } from "@/shared/components/ui";

import type { Table } from "@tanstack/react-table";

interface DataTableBodyProps<T> {
    table: Table<T>;
    loading?: boolean;
    loadingLabel?: string;
}

/**
 * Shared desktop `<tbody>` for admin tables — generalizes the
 * former `UsersTableBody`. `colSpan` is derived from the table's own
 * visible-leaf-column count instead of being hardcoded per table.
 */
function DataTableBody<T>({ table, loading = false, loadingLabel }: DataTableBodyProps<T>) {
    const t = useTranslations("AdminCommon");
    const rows = table.getRowModel().rows;
    const columnCount = table.getVisibleLeafColumns().length;

    if (loading) {
        return (
            <tbody>
                <tr>
                    <td
                        colSpan={columnCount}
                        className="text-muted py-16 text-center text-sm font-bold"
                    >
                        <LoadingSpinner fullScreen={false} label={loadingLabel ?? t("loading")} />
                    </td>
                </tr>
            </tbody>
        );
    }

    return (
        <tbody>
            {rows.map((row) => (
                <tr
                    key={row.id}
                    className={`border-t border-gray-100 transition-colors hover:bg-gray-50/50 ${
                        row.getIsSelected() ? "bg-katakana/5" : ""
                    }`}
                >
                    {row.getVisibleCells().map((cell) => (
                        <td
                            key={cell.id}
                            style={{ width: cell.column.getSize() }}
                            className="px-4 py-3"
                        >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
}

export default DataTableBody;
