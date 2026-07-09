"use client";

import { ShieldAlert } from "lucide-react";

import { EmptyState, LoadingSpinner } from "@/shared/components/ui";
import { useAdminRoleCheck } from "../../hooks";

interface AdminGuardProps {
    children: React.ReactNode;
}

/**
 * Global Admin Route Guard.
 *
 * @remarks Enforces RBAC on the client-side by verifying ID tokens and
 * querying the server for role claims. Prevents unauthorized access to
 * the /admin path before the page content is mounted.
 */
const AdminGuard = ({ children }: AdminGuardProps) => {
    const { isAdmin, isLoading } = useAdminRoleCheck();

    if (isLoading) {
        return <LoadingSpinner label="Verifying permissions…" />;
    }

    if (!isAdmin) {
        return (
            <div className="pt-20">
                <EmptyState
                    icon={ShieldAlert}
                    title="Access Denied"
                    description="You do not have permission to view the admin dashboard."
                    iconBg="bg-danger"
                    iconBorder="border-danger-strong"
                />
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminGuard;
