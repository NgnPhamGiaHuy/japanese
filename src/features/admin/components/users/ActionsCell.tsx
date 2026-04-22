"use client";

import { Shield, ShieldCheck } from "lucide-react";

import { Button } from "@/shared/components/ui";

import type { AdminUser } from "../../types";

interface ActionsCellProps {
    user: AdminUser;
    canPromote: boolean;
    canDelete: boolean;
    onPromote: (uid: string) => void;
    onDemote: (uid: string) => void;
    onDelete: (uid: string) => void;
}

/**
 * User Row Actions Table Cell.
 *
 * @remarks Orchestrates inline administrative actions (promote, demote, delete).
 * Respects hierarchical permissions by disabling actions on superadmins.
 */
const ActionsCell = ({
    user,
    canPromote,
    canDelete,
    onPromote,
    onDemote,
    onDelete,
}: ActionsCellProps) => {
    return (
        <div className="flex flex-wrap items-center justify-end gap-2 pr-4">
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
};

export default ActionsCell;
