"use client";

import { flexRender } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import type { Table } from "@tanstack/react-table";

interface DataTableHeaderProps<T> {
    table: Table<T>;
}

/**
 * Shared desktop `<thead>` for admin tables — generalizes the
 * former `UsersTableHeader`. Column alignment reads from
 * `columnDef.meta?.align` ("start" | "center" | "end", default "center")
 * instead of hardcoding column ids, so any table's columns can opt in.
 *
 * Adds `aria-sort` on sortable headers (absent from the prior
 * implementation) so sort state is announced to screen readers, not just
 * shown visually via the arrow icon.
 */
function DataTableHeader<T>({ table }: DataTableHeaderProps<T>) {
    return (
        <thead className="bg-gray-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        const align =
                            (
                                header.column.columnDef.meta as
                                    | { align?: "start" | "center" | "end" }
                                    | undefined
                            )?.align ?? "center";
                        const justify =
                            align === "end"
                                ? "justify-end"
                                : align === "start"
                                  ? "justify-start"
                                  : "justify-center";
                        const canSort = header.column.getCanSort();
                        const sorted = header.column.getIsSorted();

                        return (
                            <th
                                key={header.id}
                                style={{ width: header.getSize() }}
                                className="text-muted h-12 px-4 text-xs font-black tracking-wider uppercase"
                                aria-sort={
                                    canSort
                                        ? sorted === "asc"
                                            ? "ascending"
                                            : sorted === "desc"
                                              ? "descending"
                                              : "none"
                                        : undefined
                                }
                            >
                                <button
                                    className={`flex w-full items-center gap-1.5 ${justify} ${
                                        canSort ? "hover:text-text cursor-pointer" : ""
                                    }`}
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext(),
                                    )}
                                    {canSort && (
                                        <ArrowUpDown
                                            size={10}
                                            className={sorted ? "text-katakana" : "opacity-40"}
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
}

export default DataTableHeader;
