"use client";

import { useEffect, useState } from "react";

import { ShieldAlert } from "lucide-react";

import { EmptyState, LoadingSpinner } from "@/shared/components/ui";
import { useAppStore } from "@/store";
import { fetchAdminRoleAction } from "../../actions";
import { useAdminToken } from "../../hooks";

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
    const { user, isAuthReady } = useAppStore();
    const getAdminIdToken = useAdminToken();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady) return;

        if (!user) {
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        const checkAdmin = async () => {
            try {
                const token = await getAdminIdToken();
                const result = await fetchAdminRoleAction(token);
                setIsAdmin(
                    result.ok &&
                        (result.data.role === "admin" || result.data.role === "superadmin"),
                );
            } catch (error) {
                console.error("Admin check failed:", error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [user, isAuthReady]);

    if (loading || !isAuthReady) {
        return <LoadingSpinner label="Verifying permissions…" />;
    }

    if (!isAdmin) {
        return (
            <div className="pt-20">
                <EmptyState
                    icon={ShieldAlert}
                    title="Access Denied"
                    description="You do not have permission to view the admin dashboard."
                    iconBg="bg-[#ea2b2b]"
                    iconBorder="border-[#b82222]"
                />
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminGuard;
