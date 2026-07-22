"use client";

import { useTranslations } from "next-intl";

import { flexRender } from "@tanstack/react-table";

import RoleCell from "./RoleCell";
import UserIdentityAvatar from "./UserIdentityAvatar";
import { formatAdminDate, isOnline } from "../../utils/date.utils";

import type { Row } from "@tanstack/react-table";
import type { AdminUser } from "../../types";

interface UserMobileRowProps {
    row: Row<AdminUser>;
}

/**
 * Mobile card layout for a single user row.
 *
 * @remarks Replaces the multi-column table row on small screens with a
 * compact card that surfaces the most important info and inline actions.
 * Action callbacks are already baked into the column cell definitions via
 * TanStack Table, so we just flexRender the actions cell directly.
 */
const UserMobileRow = ({ row }: UserMobileRowProps) => {
    const t = useTranslations("AdminCommon");
    const tUsers = useTranslations("AdminUsers");
    const user = row.original;
    const online = isOnline(user.lastSeenAt);

    const actionsCell = row.getVisibleCells().find((c) => c.column.id === "actions");

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                row.getIsSelected() ? "bg-katakana/5" : "hover:bg-gray-50/50"
            }`}
        >
            {/* Checkbox */}
            {row.getCanSelect() && (
                <div className="mt-1 shrink-0">
                    <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-gray-300"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                </div>
            )}

            <UserIdentityAvatar
                photoURL={user.photoURL}
                displayName={user.displayName}
                email={user.email}
                isOnline={online}
                size={10}
            />

            {/* Info + actions */}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-text text-sm font-black">
                        {user.displayName || t("anonymousUser")}
                    </p>
                    {online && (
                        <span className="bg-hiragana flex h-4 items-center rounded-full px-1.5 text-[8px] font-black tracking-widest text-white uppercase">
                            {t("live")}
                        </span>
                    )}
                </div>
                <p className="text-muted truncate text-xs font-bold">
                    {user.email ?? tUsers("noEmailShort")}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RoleCell user={user} />
                    {user.lastSeenAt && (
                        <span className="text-katakana text-xs font-bold">
                            {tUsers("activeOn", {
                                date: formatAdminDate(user.lastSeenAt, { includeYear: false }),
                            })}
                        </span>
                    )}
                </div>

                {/* Inline actions — reuse the already-configured cell */}
                {actionsCell && (
                    <div className="mt-2 flex gap-1.5">
                        {flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserMobileRow;
