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
    /**
     * Skip building the filtered row model for tables with no search UI
     * wired to the engine (e.g. Content, which filters upstream of
     * `useDataTable` so its own empty-state can distinguish "no items at
     * all" from "no results for this search"). Defaults to true.
     */
    enableFiltering?: boolean;
    /**
     * Skip building the sorted row model for tables with no sortable
     * columns (e.g. Content, whose columns are all display-only — see
     * `useDecksTableColumns.tsx`). Defaults to true.
     */
    enableSorting?: boolean;
    /**
     * Stable per-row ID, for callers that key off `row.id` beyond React's own
     * reconciliation — e.g. Reports' virtualizer caches measured row height
     * by `row.id` (T-111a), so an index-based default would let a taller/
     * shorter log at the same index after a page/filter change reuse the
     * wrong cached height until the next scroll-triggered remeasure.
     * Unset (the default) keeps every existing caller's current index-based
     * `row.id` unchanged.
     */
    getRowId?: (row: T) => string;
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
    enableFiltering = true,
    enableSorting = true,
    getRowId,
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
        ...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
        ...(enableFiltering ? { getFilteredRowModel: getFilteredRowModel() } : {}),
        enableRowSelection,
        ...(globalFilterFn ? { globalFilterFn } : {}),
        ...(getRowId ? { getRowId } : {}),
    });

    return { table, globalFilter, setGlobalFilter, setRowSelection };
}
