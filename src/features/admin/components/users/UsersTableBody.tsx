"use client";

import { flexRender } from "@tanstack/react-table";

import { LoadingSpinner } from "@/shared/components/ui";

import type { Table } from "@tanstack/react-table";
import type { AdminUser } from "../../types";

interface UsersTableBodyProps {
    table: Table<AdminUser>;
    loading: boolean;
}

/**
 * Main Content Body for the Users Table.
 *
 * @remarks Responsible for rendering table rows and their corresponding cells
 * using TanStack Table's flexRender. Handles empty and loading states.
 */
const UsersTableBody = ({ table, loading }: UsersTableBodyProps) => {
    const rows = table.getRowModel().rows;

    if (loading) {
        return (
            <tbody>
                <tr>
                    <td colSpan={6} className="py-16 text-center text-sm font-bold text-[#afafaf]">
                        <LoadingSpinner fullScreen={false} label="Loading users..." />
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
                        row.getIsSelected() ? "bg-[#1cb0f6]/5" : ""
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
};

export default UsersTableBody;
