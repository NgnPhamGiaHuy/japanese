"use client";

import { flexRender } from "@tanstack/react-table";

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
export const UsersTableBody = ({ table, loading }: UsersTableBodyProps) => {
    const rows = table.getRowModel().rows;

    if (loading) {
        return (
            <tbody>
                <tr>
                    <td colSpan={5} className="py-16 text-center text-sm font-bold text-[#afafaf]">
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#1cb0f6]" />
                            Loading users...
                        </div>
                    </td>
                </tr>
            </tbody>
        );
    }

    if (rows.length === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan={5} className="py-16 text-center text-sm font-bold text-[#afafaf]">
                        No users found
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
