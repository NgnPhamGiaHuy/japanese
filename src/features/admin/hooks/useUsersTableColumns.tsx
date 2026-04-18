"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { ActionsCell, RoleCell, UserCell } from "../components/users/UsersTableCells";

import type { AdminUser } from "../types";

const col = createColumnHelper<AdminUser>();

interface ColumnProps {
    canDelete: boolean;
    canPromote: boolean;
    onPromote: (uid: string) => void;
    onDemote: (uid: string) => void;
    onDelete: (uid: string) => void;
}

/**
 * Column Configurations for the Users Table.
 *
 * @remarks Defines the horizontal structure of the users list.
 * delegates cell content rendering to UsersTableCells for cleaner definition.
 */
export const useUsersTableColumns = ({
    canDelete,
    canPromote,
    onPromote,
    onDemote,
    onDelete,
}: ColumnProps) => [
    col.display({
        id: "select",
        size: 56,
        header: ({ table }) =>
            canDelete ? (
                <div className="flex justify-center">
                    <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-gray-300"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                    />
                </div>
            ) : null,
        cell: ({ row }) =>
            canDelete ? (
                <div className="flex justify-center">
                    <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-gray-300"
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                </div>
            ) : null,
    }),
    col.accessor("email", {
        id: "user",
        header: () => (
            <div className="pl-4 text-left font-black tracking-widest text-gray-400 uppercase">
                User
            </div>
        ),
        size: 280,
        cell: ({ row }) => <UserCell user={row.original} />,
    }),
    col.display({
        id: "role",
        size: 120,
        header: () => <div className="w-full text-center">Role</div>,
        cell: ({ row }) => <RoleCell user={row.original} />,
    }),
    col.accessor("lastSignInTime", {
        id: "lastLogin",
        size: 130,
        header: () => (
            <div className="text-center font-black tracking-widest text-gray-400 uppercase">
                Last Login
            </div>
        ),
        cell: ({ getValue }) => {
            const raw = getValue();
            return (
                <div className="text-center">
                    {!raw ? (
                        <span className="text-xs text-[#afafaf]">Never</span>
                    ) : (
                        <span className="text-xs font-bold text-[#afafaf]">
                            {new Date(raw).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    )}
                </div>
            );
        },
    }),
    col.display({
        id: "actions",
        size: 190,
        header: () => <div className="w-full pr-6 text-right">Actions</div>,
        cell: ({ row }) => (
            <ActionsCell
                user={row.original}
                canPromote={canPromote}
                canDelete={canDelete}
                onPromote={onPromote}
                onDemote={onDemote}
                onDelete={onDelete}
            />
        ),
    }),
];
