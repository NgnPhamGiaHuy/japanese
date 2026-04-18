import type { AdminRole } from "../types";

export interface PermissionSet {
    canViewDashboard: boolean;
    canViewAnalytics: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
    canDeleteUsers: boolean;
    canPromoteUsers: boolean;
    canManageContent: boolean;
    canChangeSettings: boolean;
}

const ROLE_PERMISSIONS: Record<AdminRole, PermissionSet> = {
    superadmin: {
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewReports: true,
        canManageUsers: true,
        canDeleteUsers: true,
        canPromoteUsers: true,
        canManageContent: true,
        canChangeSettings: true,
    },
    admin: {
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewReports: true,
        canManageUsers: true,
        canDeleteUsers: false,
        canPromoteUsers: false,
        canManageContent: true,
        canChangeSettings: false,
    },
};

export function hasPermission(
    role: AdminRole | null | undefined,
    action: keyof PermissionSet,
): boolean {
    if (!role) return false;
    return ROLE_PERMISSIONS[role][action];
}

export function normalizeAdminRole(value: unknown): AdminRole | null {
    return value === "superadmin" || value === "admin" ? value : null;
}

export { ROLE_PERMISSIONS };
