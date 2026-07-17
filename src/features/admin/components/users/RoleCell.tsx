"use client";

import { useTranslations } from "next-intl";

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
    const t = useTranslations("AdminUsers");
    const { isSuperAdmin, isAdmin, disabled } = user;
    return (
        <div className="flex justify-center gap-1.5 font-black tracking-widest uppercase">
            {isSuperAdmin && <Badge variant="primary">{t("roleSuperadmin")}</Badge>}
            {!isSuperAdmin && isAdmin && <Badge variant="info">{t("roleAdmin")}</Badge>}
            {!isSuperAdmin && !isAdmin && !disabled && (
                <Badge variant="default">{t("roleUser")}</Badge>
            )}
            {disabled && (
                <Badge variant="danger" icon={UserX}>
                    {t("roleDisabled")}
                </Badge>
            )}
        </div>
    );
};

export default RoleCell;
