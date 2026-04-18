"use client";

import { flexRender } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import type { Table } from "@tanstack/react-table";
import type { AdminUser } from "../../types";

interface UsersTableHeaderProps {
    table: Table<AdminUser>;
}

/**
 * Header Section for the Users Table.
 *
 * @remarks Manages column headers, sorting toggles, and alignment logic.
 * Follows component rules by focusing purely on header UI.
 */
const UsersTableHeader = ({ table }: UsersTableHeaderProps) => {
    return (
        <thead className="bg-gray-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        const alignment =
                            header.id === "actions"
                                ? "justify-end"
                                : header.id === "user"
                                  ? "justify-start"
                                  : "justify-center";

                        return (
                            <th
                                key={header.id}
                                style={{ width: header.getSize() }}
                                className="h-12 px-4 text-[10px] font-black tracking-wider text-[#afafaf] uppercase"
                            >
                                <button
                                    className={`flex w-full items-center gap-1.5 ${alignment} ${
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
                                            className={
                                                header.column.getIsSorted()
                                                    ? "text-[#1cb0f6]"
                                                    : "opacity-40"
                                            }
                                        />
                                    )}
                                </button>
                            </th>
                        );
                    })}
                </tr>
            ))}
        </thead>
    );
};

export default UsersTableHeader;
