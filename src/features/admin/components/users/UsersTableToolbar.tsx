"use client";

import { Trash2, Users } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { AdminBulkActionsBar, AdminSearchInput } from "../shared";

interface UsersTableToolbarProps {
    selectedCount: number;
    globalFilter: string;
    onGlobalFilterChange: (val: string) => void;
    onPromote: () => void;
    onDemote: () => void;
    onDelete: () => void;
    onClearSelection: () => void;
    canDelete: boolean;
    canPromote: boolean;
}

/**
 * Toolbar for the Users Table.
 *
 * @remarks Toggles between a search bar and bulk actions based on row selection state.
 */
const UsersTableToolbar = ({
    selectedCount,
    globalFilter,
    onGlobalFilterChange,
    onPromote,
    onDemote,
    onDelete,
    onClearSelection,
    canDelete,
    canPromote,
}: UsersTableToolbarProps) => {
    if (selectedCount > 0) {
        return (
            <AdminBulkActionsBar count={selectedCount} onCancel={onClearSelection}>
                {canPromote && (
                    <>
                        <Button
                            variant="secondary"
                            color="purple"
                            className="!h-9 !px-4 !py-0 !text-xs"
                            icon={Users}
                            iconSize={14}
                            onClick={onPromote}
                        >
                            Promote
                        </Button>
                        <Button
                            variant="secondary"
                            color="orange"
                            className="!h-9 !px-4 !py-0 !text-xs"
                            onClick={onDemote}
                        >
                            Demote
                        </Button>
                    </>
                )}
                {canDelete && (
                    <Button
                        variant="ghost"
                        className="!h-9 !px-4 !py-0 !text-xs !text-[#ea2b2b]"
                        icon={Trash2}
                        iconSize={14}
                        onClick={onDelete}
                    >
                        Delete
                    </Button>
                )}
            </AdminBulkActionsBar>
        );
    }

    return (
        <div className="p-3">
            <AdminSearchInput
                placeholder="Search by email or name…"
                value={globalFilter}
                onChange={onGlobalFilterChange}
                className="!h-10"
            />
        </div>
    );
};

export default UsersTableToolbar;
