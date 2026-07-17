"use client";

import { useTranslations } from "next-intl";

import { ShieldAlert } from "lucide-react";

import { EmptyState, LoadingSpinner } from "@/shared/components/ui";
import { useAdminRole } from "../../context/AdminContext";

interface AdminGuardProps {
    children: React.ReactNode;
}

/**
 * Global Admin Route Guard.
 *
 * @remarks Enforces RBAC on the client-side by reading the already-resolved
 * role from AdminContext (mounted once at the app root) rather than
 * independently re-verifying the ID token and re-querying the server —
 * this used to be a third redundant admin-role check alongside the two
 * AdminProvider mounts. Prevents unauthorized access to the /admin path
 * before the page content is mounted.
 */
const AdminGuard = ({ children }: AdminGuardProps) => {
    const t = useTranslations("AdminCommon");
    const { role, isLoading } = useAdminRole();
    const isAdmin = role !== null;

    if (isLoading) {
        return <LoadingSpinner label={t("verifyingPermissions")} />;
    }

    if (!isAdmin) {
        return (
            <div className="pt-20">
                <EmptyState
                    icon={ShieldAlert}
                    title={t("accessDenied")}
                    description={t("accessDeniedMessage")}
                    iconBg="bg-danger"
                    iconBorder="border-danger-strong"
                />
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminGuard;
