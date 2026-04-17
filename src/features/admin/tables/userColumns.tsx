"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Crown, Shield, ShieldCheck, Trash2, UserX } from "lucide-react";

import { Badge, Button } from "@/shared/components/ui";

import type { AdminUser } from "../types";

export interface UserTableMeta {
    currentUserId: string | undefined;
    mutating: Record<string, boolean>;
    onPromote: (uid: string) => void;
    onDemote: (uid: string) => void;
    onDeleteRequest: (user: AdminUser) => void;
    onRowSelect?: (index: number, event: MouseEvent) => void;
}

const col = createColumnHelper<AdminUser>();

export const userColumns = [
    // ── Selection ───────────────────────────────────────────────────────────────
    col.display({
        id: "select",
        size: 50,
        header: ({ table }) => (
            <div className="flex justify-center">
                <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#1cb0f6] focus:ring-[#1cb0f6]"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({ row, table }) => {
            const meta = table.options.meta as UserTableMeta;
            return (
                <div className="flex justify-center">
                    <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#1cb0f6] focus:ring-[#1cb0f6]"
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={(e) => meta.onRowSelect?.(row.index, e.nativeEvent as MouseEvent)}
                        aria-label="Select row"
                    />
                </div>
            );
        },
    }),

    // ── Avatar + Email ────────────────────────────────────────────────────────

    col.accessor("email", {
        id: "user",
        header: "User",
        size: 250,
        enableSorting: true,
        cell: ({ row }) => {
            const { email, displayName, photoURL } = row.original;
            return (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                        {photoURL ? (
                            <img
                                src={photoURL}
                                alt={displayName ?? "User"}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-sm font-black text-gray-400">
                                {(displayName ?? email ?? "?")[0].toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        {displayName && (
                            <p className="truncate text-sm font-black text-[#3c3c3c]">
                                {displayName}
                            </p>
                        )}
                        <p className="truncate text-xs font-bold text-[#afafaf]">
                            {email ?? "No email"}
                        </p>
                    </div>
                </div>
            );
        },
    }),

    // ── Role badge ────────────────────────────────────────────────────────────
    col.display({
        id: "role",
        size: 100,
        header: () => <div className="w-full text-center">Role</div>,
        cell: ({ row }) => {
            const { isSuperAdmin, isAdmin, disabled } = row.original;
            return (
                <div className="flex justify-center gap-1.5 font-black tracking-widest uppercase">
                    {isSuperAdmin && (
                        <Badge variant="primary" size="lg">
                            <Crown size={10} className="mr-1" />
                            Superadmin
                        </Badge>
                    )}
                    {!isSuperAdmin && isAdmin && (
                        <Badge variant="info" size="lg">
                            <ShieldCheck size={10} className="mr-1" />
                            Admin
                        </Badge>
                    )}
                    {!isSuperAdmin && !isAdmin && !disabled && (
                        <Badge variant="default" size="lg">
                            User
                        </Badge>
                    )}
                    {disabled && (
                        <Badge variant="danger" size="lg">
                            <UserX size={10} className="mr-1" />
                            Disabled
                        </Badge>
                    )}
                </div>
            );
        },
    }),

    // ── Last login ────────────────────────────────────────────────────────────
    col.accessor("lastSignInTime", {
        id: "lastLogin",
        header: () => <div className="text-center">Last Login</div>,
        enableSorting: true,
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

    // ── Actions ───────────────────────────────────────────────────────────────
    col.display({
        id: "actions",
        size: 180,
        header: () => <div className="w-full pr-6 text-right">Actions</div>,
        cell: ({ row, table }) => {
            const meta = table.options.meta as UserTableMeta;
            const { uid, isSuperAdmin, isAdmin } = row.original;
            const isSelf = uid === meta.currentUserId;
            const isLoading = !!meta.mutating[uid];

            return (
                <div className="flex items-center justify-end gap-2 pr-4">
                    {/* Superadmin: read-only badge, no promote/demote */}
                    {isSuperAdmin ? (
                        <span className="text-[10px] font-black tracking-tighter text-[#afafaf] uppercase italic">
                            Console Managed
                        </span>
                    ) : isAdmin ? (
                        /* Admin → demote to user */
                        <Button
                            variant="secondary"
                            color="orange"
                            onClick={() => meta.onDemote(uid)}
                            loading={isLoading}
                            disabled={isSelf}
                            title={isSelf ? "Cannot demote yourself" : "Remove admin role"}
                            className="!h-8 !px-3 !py-1 !text-[10px] font-black tracking-wider uppercase"
                            icon={Shield}
                            iconSize={12}
                        >
                            Demote
                        </Button>
                    ) : (
                        /* User → promote to admin */
                        <Button
                            variant="secondary"
                            color="purple"
                            onClick={() => meta.onPromote(uid)}
                            loading={isLoading}
                            disabled={isSelf}
                            title="Promote to admin"
                            className="!h-8 !px-3 !py-1 !text-[10px] font-black tracking-wider uppercase"
                            icon={ShieldCheck}
                            iconSize={12}
                        >
                            Make Admin
                        </Button>
                    )}

                    {/* Delete — blocked for superadmins */}
                    <Button
                        variant="ghost"
                        onClick={() => meta.onDeleteRequest(row.original)}
                        loading={isLoading}
                        disabled={isSelf || isSuperAdmin}
                        title={
                            isSelf
                                ? "Cannot delete yourself"
                                : isSuperAdmin
                                  ? "Superadmin accounts are console-managed"
                                  : "Delete user"
                        }
                        className="!h-8 !w-8 !p-0 text-gray-300 hover:!bg-[#ffdfe0] hover:!text-[#ea2b2b] disabled:opacity-30"
                        icon={Trash2}
                        iconSize={14}
                    />
                </div>
            );
        },
    }),
];
