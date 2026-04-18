"use client";

import { Shield, ShieldCheck, UserX } from "lucide-react";

import { Badge, Button } from "@/shared/components/ui";

import type { AdminUser } from "../../types";

/**
 * User Identity Cell.
 */
export const UserCell = ({ user }: { user: AdminUser }) => (
    <div className="flex items-center gap-4 pl-4 text-left">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 ring-2 ring-white transition-transform hover:scale-105">
            {user.photoURL ? (
                <img
                    src={user.photoURL}
                    alt={user.displayName ?? "User Avatar"}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span className="text-sm font-black text-gray-400">
                    {(user.displayName ?? user.email ?? "?")[0]?.toUpperCase()}
                </span>
            )}
        </div>
        <div className="min-w-0">
            <p className="truncate text-[15px] font-black text-[#3c3c3c]">
                {user.displayName || "Anonymous User"}
            </p>
            <p className="truncate text-xs leading-none font-bold text-[#afafaf]">
                {user.email ?? "No email linked"}
            </p>
        </div>
    </div>
);

/**
 * User Role Cell.
 */
export const RoleCell = ({ user }: { user: AdminUser }) => {
    const { isSuperAdmin, isAdmin, disabled } = user;
    return (
        <div className="flex justify-center gap-1.5 font-black tracking-widest uppercase">
            {isSuperAdmin && <Badge variant="primary">Superadmin</Badge>}
            {!isSuperAdmin && isAdmin && <Badge variant="info">Admin</Badge>}
            {!isSuperAdmin && !isAdmin && !disabled && <Badge variant="default">User</Badge>}
            {disabled && (
                <Badge variant="danger" icon={UserX}>
                    Disabled
                </Badge>
            )}
        </div>
    );
};

/**
 * User Actions Cell.
 */
export const ActionsCell = ({
    user,
    canPromote,
    canDelete,
    onPromote,
    onDemote,
    onDelete,
}: {
    user: AdminUser;
    canPromote: boolean;
    canDelete: boolean;
    onPromote: (uid: string) => void;
    onDemote: (uid: string) => void;
    onDelete: (uid: string) => void;
}) => (
    <div className="flex items-center justify-end gap-2 pr-4">
        {canPromote &&
            !user.isSuperAdmin &&
            (user.isAdmin ? (
                <Button
                    variant="secondary"
                    color="orange"
                    className="!h-8 !px-3 !py-0 !text-xs"
                    onClick={() => onDemote(user.uid)}
                >
                    <Shield size={12} />
                    Demote
                </Button>
            ) : (
                <Button
                    variant="secondary"
                    color="purple"
                    className="!h-8 !px-3 !py-0 !text-xs"
                    onClick={() => onPromote(user.uid)}
                >
                    <ShieldCheck size={12} />
                    Promote
                </Button>
            ))}
        {canDelete && (
            <Button
                variant="ghost"
                className="!h-8 !px-3 !py-0 !text-xs"
                onClick={() => onDelete(user.uid)}
                disabled={user.isSuperAdmin}
            >
                Delete
            </Button>
        )}
    </div>
);
