"use client";

import { Search, Trash2, Users } from "lucide-react";

import { Button } from "@/shared/components/ui";

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
export const UsersTableToolbar = ({
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
            <div className="flex h-full items-center justify-between bg-[#1cb0f6]/5 px-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1cb0f6] text-xs font-black text-white">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-black text-[#1cb0f6]">
                        {selectedCount} selected
                    </span>
                </div>
                <div className="flex items-center gap-2">
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
                    <button
                        onClick={onClearSelection}
                        className="text-xs font-bold text-[#afafaf] hover:text-[#3c3c3c]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full items-center p-4">
            <div className="relative w-full">
                <Search
                    size={16}
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    placeholder="Search by email or name…"
                    value={globalFilter}
                    onChange={(e) => onGlobalFilterChange(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-gray-200 pr-4 pl-9 text-sm font-bold text-[#3c3c3c] outline-none focus:border-[#1cb0f6]"
                />
            </div>
        </div>
    );
};
