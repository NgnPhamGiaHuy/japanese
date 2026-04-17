/**
 * Shared admin types — safe to import from both client and server.
 * No firebase-admin imports here.
 *
 * Role model:
 * - superadmin: Firebase custom claim, assigned via Firebase console only. Read-only in dashboard.
 * - admin:      Firestore-backed role (admins/{uid}), assignable by superadmins via dashboard.
 * - user:       Default — no elevated privileges.
 */

export interface AdminUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    disabled: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    lastSignInTime: string | null;
    creationTime: string | null;
}

export interface PaginatedUsers {
    users: AdminUser[];
    nextPageToken: string | null;
    total: number;
}

export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    superAdmins: number;
    admins: number;
    disabledUsers: number;
}
