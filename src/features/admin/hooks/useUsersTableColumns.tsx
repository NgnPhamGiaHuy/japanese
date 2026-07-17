"use client";

import { useTranslations } from "next-intl";

import { createColumnHelper } from "@tanstack/react-table";

import ActionsCell from "../components/users/ActionsCell";
import RoleCell from "../components/users/RoleCell";
import UserCell from "../components/users/UserCell";

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
}: ColumnProps) => {
    const t = useTranslations("AdminUsers");
    const columns = [
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
                    {t("columnUser")}
                </div>
            ),
            size: 280,
            meta: { align: "start" },
            cell: ({ row }) => <UserCell user={row.original} />,
        }),
        col.display({
            id: "role",
            size: 120,
            header: () => <div className="w-full text-center">{t("columnRole")}</div>,
            cell: ({ row }) => <RoleCell user={row.original} />,
        }),
        col.accessor("lastSignInTime", {
            id: "lastLogin",
            size: 130,
            header: () => (
                <div className="text-center font-black tracking-widest text-gray-400 uppercase">
                    {t("columnLastLogin")}
                </div>
            ),
            cell: ({ getValue }) => {
                const raw = getValue();
                return (
                    <div className="text-center">
                        {!raw ? (
                            <span className="text-muted text-xs">{t("never")}</span>
                        ) : (
                            <span className="text-muted text-xs font-bold">
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
        col.accessor("lastSeenAt", {
            id: "lastActive",
            size: 130,
            header: () => (
                <div className="text-center font-black tracking-widest text-gray-400 uppercase">
                    {t("columnLastActive")}
                </div>
            ),
            cell: ({ getValue }) => {
                const raw = getValue();
                return (
                    <div className="text-center">
                        {!raw ? (
                            <span className="text-muted text-xs">{t("unknownDate")}</span>
                        ) : (
                            <span className="text-katakana text-xs font-bold">
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
    ];

    // Only add actions if the user has permission to do something
    if (canDelete || canPromote) {
        columns.push(
            col.display({
                id: "actions",
                size: 190,
                meta: { align: "end" },
                header: () => <div className="w-full pr-6 text-right">{t("columnActions")}</div>,
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
        );
    }

    return columns;
};
