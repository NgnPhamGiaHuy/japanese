"use client";

import { useEffect, useState } from "react";

import { useAppStore } from "@/lib/app-store";
import { useAdminToken } from "./useAdminToken";

export interface AdminRoleCheckResult {
    role: "admin" | "superadmin" | null;
    isAdmin: boolean;
    isLoading: boolean;
}

/**
 * Resolves the current user's admin role via a server-verified ID token.
 *
 * @remarks
 * Single source of truth for the admin role check — previously duplicated
 * independently in AdminGuard and AdminContext, which had drifted (one
 * passed the fetched token to fetchAdminRoleAction, the other silently
 * discarded it and relied on the auth cookie instead).
 */
export function useAdminRoleCheck(): AdminRoleCheckResult {
    const { user, isAuthReady } = useAppStore();
    const getAdminIdToken = useAdminToken();
    const [role, setRole] = useState<"admin" | "superadmin" | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady) return;

        if (!user) {
            setRole(null);
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        const checkRole = async () => {
            try {
                const token = await getAdminIdToken();
                // Lazy: a static import of "../actions" pulls the whole
                // server-action chain (firebase-admin/auth →
                // google-auth-library) into any bundle that imports this
                // hook, breaking plain browser/unit test runs that have no
                // Next.js build-time "use server" stubbing.
                const { fetchAdminRoleAction } = await import("../actions");
                const result = await fetchAdminRoleAction(token);
                if (cancelled) return;
                setRole(result.ok ? result.data.role : null);
            } catch (err) {
                console.error("[useAdminRoleCheck] Failed to fetch admin role:", err);
                if (!cancelled) setRole(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        checkRole();

        return () => {
            cancelled = true;
        };
    }, [user, isAuthReady]);

    return { role, isAdmin: role === "admin" || role === "superadmin", isLoading };
}
