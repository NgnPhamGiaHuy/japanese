"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { useAppStore } from "@/store";
import { fetchAdminRoleAction } from "../actions";
import { useAdminToken } from "../hooks";

interface AdminContextType {
    role: "superadmin" | "admin" | null;
    isLoading: boolean;
}

const AdminContext = createContext<AdminContextType>({
    role: null,
    isLoading: true,
});

const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthReady } = useAppStore();
    const getAdminIdToken = useAdminToken();
    const [role, setRole] = useState<"superadmin" | "admin" | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady) return;
        if (!user) {
            setRole(null);
            setIsLoading(false);
            return;
        }

        const fetchRole = async () => {
            try {
                const result = await fetchAdminRoleAction();
                setRole(result.ok ? result.data.role : null);
            } catch (err) {
                console.error("Failed to fetch admin role:", err);
                setRole(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRole();
    }, [user, isAuthReady]);

    return <AdminContext.Provider value={{ role, isLoading }}>{children}</AdminContext.Provider>;
};

export const useAdminRole = () => useContext(AdminContext);

export default AdminProvider;
