"use client";

import { flexRender } from "@tanstack/react-table";

import RoleCell from "./RoleCell";

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
    const user = row.original;
    const lastSeen = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
    const isOnline = Date.now() - lastSeen < 5 * 60 * 1000;

    const actionsCell = row.getVisibleCells().find((c) => c.column.id === "actions");

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                row.getIsSelected() ? "bg-[#1cb0f6]/5" : "hover:bg-gray-50/50"
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

            {/* Avatar */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 ring-2 ring-white">
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName ?? "User"}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="text-sm font-black text-gray-400">
                        {(user.displayName ?? user.email ?? "?")[0]?.toUpperCase()}
                    </span>
                )}
                {isOnline && (
                    <div className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#58cc02]" />
                )}
            </div>

            {/* Info + actions */}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-black text-[#3c3c3c]">
                        {user.displayName || "Anonymous User"}
                    </p>
                    {isOnline && (
                        <span className="flex h-4 items-center rounded-full bg-[#58cc02] px-1.5 text-[8px] font-black tracking-widest text-white uppercase">
                            Live
                        </span>
                    )}
                </div>
                <p className="truncate text-xs font-bold text-[#afafaf]">
                    {user.email ?? "No email"}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RoleCell user={user} />
                    {user.lastSeenAt && (
                        <span className="text-[10px] font-bold text-[#1cb0f6]">
                            Active{" "}
                            {new Date(user.lastSeenAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
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
