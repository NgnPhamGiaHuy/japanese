"use client";

import { useEffect, useState } from "react";

import { doc, getDoc } from "firebase/firestore";
import { Loader2, ShieldAlert } from "lucide-react";

import { db } from "@/lib/firebase";
import { EmptyState } from "@/shared/components/ui";
import { useAppStore } from "@/store";

interface AdminGuardProps {
    children: React.ReactNode;
}

/**
 * AdminGuard — Client-side route guard for /admin routes.
 *
 * @remarks
 * Syncs with the Firestore 'admins' collection to verify the user's role.
 * This provides a smooth UX by blocking the entire page before the dashboard loads.
 * Server actions still perform their own independent validation for security.
 */
export function AdminGuard({ children }: AdminGuardProps) {
    const { user, isAuthReady } = useAppStore();
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
                const adminDoc = await getDoc(doc(db, "admins", user.uid));
                setIsAdmin(adminDoc.exists() && adminDoc.data()?.role === "superadmin");
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
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#1cb0f6]" />
                <p className="text-sm font-bold text-[#afafaf]">Verifying permissions…</p>
            </div>
        );
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
}
