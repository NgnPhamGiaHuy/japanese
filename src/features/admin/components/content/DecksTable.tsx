"use client";

import DeckMobileRow from "./DeckMobileRow";
import { AdminTable, DataTableBody, DataTableHeader, DataTableMobileList } from "../shared";
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
 */
const DecksTable = ({ items, onDelete, onView, isDeleting }: DecksTableProps) => {
    const columns = useDecksTableColumns({ onView, onDelete, isDeleting });
    const { table } = useDataTable<AdminDeck>({ data: items, columns });

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
