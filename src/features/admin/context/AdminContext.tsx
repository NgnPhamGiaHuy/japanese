"use client";

import { createContext, useContext, useMemo } from "react";

import { useAdminRoleCheck } from "../hooks";

interface AdminContextType {
    role: "superadmin" | "admin" | null;
    isLoading: boolean;
}

const AdminContext = createContext<AdminContextType>({
    role: null,
    isLoading: true,
});

const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const { role, isLoading } = useAdminRoleCheck();
    const value = useMemo(() => ({ role, isLoading }), [role, isLoading]);

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdminRole = () => useContext(AdminContext);

export default AdminProvider;
