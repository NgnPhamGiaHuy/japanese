"use client";

import DeckMobileRow from "./DeckMobileRow";
import { AdminTable, DataTableBody, DataTableHeader, DataTableMobileList } from "../table";
import { useDataTable } from "../../hooks/useDataTable";
import { useDecksTableColumns } from "../../hooks/useDecksTableColumns";

import type { AdminDeck } from "../../types";

interface DecksTableProps {
    items: AdminDeck[];
    onDelete: (path: string) => void;
    onView: (path: string, title: string) => void;
    isDeleting: boolean;
}

/**
 * Global Decks Administrative Table.
 *
 * @remarks
 * Migrated onto the shared `@tanstack/react-table` engine — same
 * external prop interface and rendered output as before, now sharing one
 * table implementation with Users instead of a hand-rolled `<table>`.
 * No sorting/selection existed here before this migration and none is
 * added; every column is a display column for exactly that reason.
 *
 * `items` arrives pre-filtered from `AdminContentPageContent` (title/
 * description/ownerEmail search happens upstream of this table, not via a
 * `globalFilterFn`) so its own empty-state can distinguish "no decks at
 * all" from "no results for this search" without reaching into a row
 * model. `enableFiltering`/`enableSorting` are both off here since neither
 * is wired to anything — leaving them on would build row models no caller
 * ever reads.
 */
const DecksTable = ({ items, onDelete, onView, isDeleting }: DecksTableProps) => {
    const columns = useDecksTableColumns({ onView, onDelete, isDeleting });
    const { table } = useDataTable<AdminDeck>({
        data: items,
        columns,
        enableFiltering: false,
        enableSorting: false,
    });

    return (
        <AdminTable
            mobileList={
                <DataTableMobileList
                    table={table}
                    renderRow={(row) => <DeckMobileRow row={row} />}
                />
            }
        >
            <DataTableHeader table={table} />
            <DataTableBody table={table} />
        </AdminTable>
    );
};

export default DecksTable;
