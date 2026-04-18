"use client";

import { UserX } from "lucide-react";

import { Badge } from "@/shared/components/ui";

import type { AdminUser } from "../../types";

interface RoleCellProps {
    user: AdminUser;
}

/**
 * User Role & Status Table Cell.
 *
 * @remarks Displays current permissions and account status badges.
 * Dynamically prioritizes role levels and visibility of disabled states.
 */
const RoleCell = ({ user }: RoleCellProps) => {
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

export default RoleCell;
