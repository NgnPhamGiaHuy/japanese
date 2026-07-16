"use client";

import { useState } from "react";

import { useDataTable } from "./useDataTable";
import { useUsersTableColumns } from "./useUsersTableColumns";

import type { AdminUser } from "../types";

interface UseUsersTableProps {
    users: AdminUser[];
    canDelete: boolean;
    canPromote: boolean;
    onPromote: (uid: string) => Promise<unknown>;
    onDemote: (uid: string) => Promise<unknown>;
    onDelete: (uid: string) => Promise<unknown>;
}

/**
 * State and Logic Hook for the Users Management Table.
 *
 * @remarks Centralizes TanStack Table configuration, filtering, sorting,
 * and bulk-action logic. Decouples business logic from table UI.
 */
export const useUsersTable = ({
    users,
    canDelete,
    canPromote,
    onPromote,
    onDemote,
    onDelete,
}: UseUsersTableProps) => {
    const [pendingAction, setPendingAction] = useState<{
        type: "delete" | "promote" | "demote";
        uids: string[];
    } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const columns = useUsersTableColumns({
        canDelete,
        canPromote,
        onPromote: (uid) => setPendingAction({ type: "promote", uids: [uid] }),
        onDemote: (uid) => setPendingAction({ type: "demote", uids: [uid] }),
        onDelete: (uid) => setPendingAction({ type: "delete", uids: [uid] }),
    });

    const { table, globalFilter, setGlobalFilter, setRowSelection } = useDataTable<AdminUser>({
        data: users,
        columns,
        enableRowSelection: canDelete,
        globalFilterFn: (row, _, filterValue) => {
            const q = String(filterValue).toLowerCase();
            const name = row.original.displayName?.toLowerCase() ?? "";
            const email = row.original.email?.toLowerCase() ?? "";
            return name.includes(q) || email.includes(q);
        },
    });

    const handleConfirmAction = async () => {
        if (!pendingAction) return;
        setIsProcessing(true);
        try {
            const { type, uids } = pendingAction;
            if (type === "delete") {
                await Promise.all(uids.map((uid) => onDelete(uid)));
            } else if (type === "promote") {
                await Promise.all(uids.map((uid) => onPromote(uid)));
            } else {
                await Promise.all(uids.map((uid) => onDemote(uid)));
            }
            setRowSelection({});
        } finally {
            setPendingAction(null);
            setIsProcessing(false);
        }
    };

    return {
        table,
        globalFilter,
        setGlobalFilter,
        setRowSelection,
        pendingAction,
        setPendingAction,
        isProcessing,
        handleConfirmAction,
    };
};
