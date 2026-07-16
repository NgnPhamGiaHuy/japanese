"use client";

import { useState } from "react";

import {
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

import type { ColumnDef, FilterFn, RowSelectionState, SortingState } from "@tanstack/react-table";

interface UseDataTableProps<T> {
    data: T[];
    // A heterogeneous array of accessor/display columns can't be soundly
    // narrowed below `any` per-column value type — the same reason
    // @tanstack/react-table's own docs type consuming APIs this way.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: ColumnDef<T, any>[];
    /** Row selection is opt-in per caller (e.g. gated on a permission), matching the prior Users table. */
    enableRowSelection?: boolean;
    globalFilterFn?: FilterFn<T>;
}

/**
 * Shared `@tanstack/react-table` engine: the generic sorting/
 * selection/filtering wiring every admin table needs, extracted from
 * `useUsersTable.ts` so Users, Content, and any future admin table build on
 * one `useReactTable` configuration instead of each hand-rolling it.
 *
 * Callers own their column defs and any domain-specific state (e.g. pending
 * bulk actions) — this hook owns only the table instance and its three
 * pieces of UI state (global filter, sorting, row selection).
 */
export function useDataTable<T>({
    data,
    columns,
    enableRowSelection = false,
    globalFilterFn,
}: UseDataTableProps<T>) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const table = useReactTable({
        data,
        columns,
        state: { globalFilter, sorting, rowSelection: enableRowSelection ? rowSelection : {} },
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableRowSelection,
        ...(globalFilterFn ? { globalFilterFn } : {}),
    });

    return { table, globalFilter, setGlobalFilter, rowSelection, setRowSelection };
}
